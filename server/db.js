let sql, dbConfig, useNativeDriver;

// Tentar usar driver nativo (Windows) primeiro, senão usar tedious
try {
  sql = require('mssql/msnodesqlv8');
  useNativeDriver = true;
  dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost\\SQLEXPRESS'};Database=${process.env.DB_DATABASE || 'CardapioOnline'};Trusted_Connection=yes;`,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
  console.log('Driver nativo (msnodesqlv8) detectado');
} catch (e) {
  sql = require('mssql');
  useNativeDriver = false;
  dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'CardapioOnline',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
  console.log('Usando driver tedious (compatível com nuvem)');
}

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log('Conectado ao SQL Server');
    } catch (err) {
      console.error('Erro ao conectar ao SQL Server:', err.message);
      throw err;
    }
  }
  return pool;
}

// Salvar pedido + itens no banco (transação)
async function salvarPedido(pedido) {
  const db = await getPool();
  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    const result = await transaction.request()
      .input('NomeCliente', sql.NVarChar(100), pedido.nomeCliente)
      .input('Telefone', sql.NVarChar(20), pedido.telefone)
      .input('Endereco', sql.NVarChar(255), pedido.endereco || null)
      .input('Referencia', sql.NVarChar(255), pedido.referencia || null)
      .input('Observacao', sql.NVarChar(500), pedido.observacao || null)
      .input('Total', sql.Decimal(10, 2), pedido.total)
      .input('FormaPagamento', sql.NVarChar(20), pedido.formaPagamento || 'dinheiro')
      .input('TipoEntrega', sql.NVarChar(20), pedido.tipoEntrega || 'delivery')
      .input('TrocoPara', sql.NVarChar(20), pedido.trocoPara || null)
      .input('PixPago', sql.Bit, pedido.pixPago ? 1 : 0)
      .input('Cupom', sql.NVarChar(50), pedido.cupom || null)
      .input('Desconto', sql.Decimal(10, 2), pedido.desconto || 0.00)
      .input('Cidade', sql.NVarChar(100), pedido.cidade || 'Luziânia')
      .input('Bairro', sql.NVarChar(100), pedido.bairro || null)
      .input('TaxaEntrega', sql.Decimal(10, 2), pedido.taxaEntrega || 0.00)
      .query(`
        INSERT INTO Pedidos (NomeCliente, Telefone, Endereco, Referencia, Observacao, Total, FormaPagamento, TipoEntrega, TrocoPara, PixPago, Cupom, Desconto, Cidade, Bairro, TaxaEntrega)
        OUTPUT INSERTED.Id
        VALUES (@NomeCliente, @Telefone, @Endereco, @Referencia, @Observacao, @Total, @FormaPagamento, @TipoEntrega, @TrocoPara, @PixPago, @Cupom, @Desconto, @Cidade, @Bairro, @TaxaEntrega)
      `);

    const pedidoId = result.recordset[0].Id;

    for (const item of pedido.itens) {
      await transaction.request()
        .input('PedidoId', sql.Int, pedidoId)
        .input('ProdutoId', sql.NVarChar(50), item.produtoId || null)
        .input('NomeProduto', sql.NVarChar(100), item.nome)
        .input('Quantidade', sql.Int, item.quantidade)
        .input('Preco', sql.Decimal(10, 2), item.preco)
        .input('Complementos', sql.NVarChar(500), item.complementos || null)
        .input('Extras', sql.NVarChar(500), item.extras || null)
        .input('Observacao', sql.NVarChar(255), item.observacao || null)
        .query(`
          INSERT INTO ItensPedido (PedidoId, ProdutoId, NomeProduto, Quantidade, Preco, Complementos, Extras, Observacao)
          VALUES (@PedidoId, @ProdutoId, @NomeProduto, @Quantidade, @Preco, @Complementos, @Extras, @Observacao)
        `);
    }

    await transaction.commit();
    console.log(`Pedido #${pedidoId} salvo no banco`);
    return pedidoId;

  } catch (err) {
    await transaction.rollback();
    console.error('Erro ao salvar pedido:', err.message);
    throw err;
  }
}

// Atualizar status do pedido
async function atualizarStatus(pedidoId, novoStatus) {
  const db = await getPool();
  await db.request()
    .input('Id', sql.Int, pedidoId)
    .input('Status', sql.NVarChar(20), novoStatus)
    .query('UPDATE Pedidos SET Status = @Status WHERE Id = @Id');
  console.log(`Pedido #${pedidoId} -> status: ${novoStatus}`);
}

// Buscar pedidos pendentes
async function buscarPendentes() {
  const db = await getPool();
  const result = await db.request()
    .query(`
      SELECT p.*, 
        (SELECT i.NomeProduto, i.Quantidade, i.Preco, i.Complementos, i.Extras, i.Observacao
         FROM ItensPedido i WHERE i.PedidoId = p.Id
         FOR JSON PATH) AS Itens
      FROM Pedidos p
      WHERE p.Status IN ('pendente', 'erro')
      ORDER BY p.DataCriacao DESC
    `);
  return result.recordset;
}

// Incrementar tentativas de envio
async function incrementarTentativa(pedidoId) {
  const db = await getPool();
  const result = await db.request()
    .input('Id', sql.Int, pedidoId)
    .query(`
      UPDATE Pedidos 
      SET TentativasEnvio = TentativasEnvio + 1
      OUTPUT INSERTED.TentativasEnvio
      WHERE Id = @Id
    `);
  return result.recordset[0]?.TentativasEnvio || 0;
}

// Buscar administrador por usuário
async function buscarAdminPorUsuario(usuario) {
  const db = await getPool();
  const result = await db.request()
    .input('Usuario', sql.NVarChar(50), usuario)
    .query('SELECT * FROM Admins WHERE Usuario = @Usuario');
  return result.recordset[0] || null;
}

// Buscar todos os pedidos (com itens)
async function buscarTodosPedidos() {
  const db = await getPool();
  const result = await db.request()
    .query(`
      SELECT p.*, 
        (SELECT i.NomeProduto, i.Quantidade, i.Preco, i.Complementos, i.Extras, i.Observacao
         FROM ItensPedido i WHERE i.PedidoId = p.Id
         FOR JSON PATH) AS Itens
      FROM Pedidos p
      ORDER BY p.DataCriacao DESC
    `);
  return result.recordset;
}

// Obter menu completo do banco
async function obterMenuCompleto() {
  const db = await getPool();
  const productsResult = await db.request().query('SELECT * FROM Produtos');
  const pizzasResult = await db.request().query('SELECT * FROM PizzaSabores');
  return {
    produtos: productsResult.recordset,
    pizzas: pizzasResult.recordset
  };
}

// Atualizar produto geral
async function atualizarProduto(id, dados) {
  const db = await getPool();
  await db.request()
    .input('Id', sql.NVarChar(50), id)
    .input('Nome', sql.NVarChar(100), dados.nome)
    .input('Descricao', sql.NVarChar(255), dados.descricao || null)
    .input('Preco', sql.Decimal(10, 2), dados.preco)
    .input('Disponivel', sql.Bit, dados.disponivel ? 1 : 0)
    .input('ImagemUrl', sql.NVarChar(500), dados.imagemUrl || null)
    .query(`
      UPDATE Produtos 
      SET Nome = @Nome, Descricao = @Descricao, Preco = @Preco, Disponivel = @Disponivel, ImagemUrl = @ImagemUrl 
      WHERE Id = @Id
    `);
}

// Atualizar sabor de pizza
async function atualizarPizzaSabor(nome, dados) {
  const db = await getPool();
  await db.request()
    .input('Nome', sql.NVarChar(100), nome)
    .input('Descricao', sql.NVarChar(255), dados.descricao || null)
    .input('PrecoBrotinho', sql.Decimal(10, 2), dados.precoBrotinho)
    .input('PrecoGrande', sql.Decimal(10, 2), dados.precoGrande)
    .input('Disponivel', sql.Bit, dados.disponivel ? 1 : 0)
    .input('ImagemUrl', sql.NVarChar(500), dados.imagemUrl || null)
    .query(`
      UPDATE PizzaSabores 
      SET Descricao = @Descricao, PrecoBrotinho = @PrecoBrotinho, PrecoGrande = @PrecoGrande, Disponivel = @Disponivel, ImagemUrl = @ImagemUrl 
      WHERE Nome = @Nome
    `);
}

// Obter estatísticas para o painel admin
async function obterEstatisticasDashboard() {
  const db = await getPool();
  const stats = await db.request().query(`
    SELECT 
      COUNT(*) as TotalPedidos,
      ISNULL(SUM(CASE WHEN Status = 'pendente' THEN 1 ELSE 0 END), 0) as Pendentes,
      ISNULL(SUM(CASE WHEN Status = 'enviado' THEN 1 ELSE 0 END), 0) as Enviados,
      ISNULL(SUM(CASE WHEN Status = 'erro' THEN 1 ELSE 0 END), 0) as Erros,
      ISNULL(SUM(Total), 0) as FaturamentoTotal,
      ISNULL(SUM(CASE WHEN CAST(DataCriacao AS DATE) = CAST(GETDATE() AS DATE) THEN Total ELSE 0 END), 0) as FaturamentoHoje
    FROM Pedidos
  `);
  return stats.recordset[0] || {
    TotalPedidos: 0,
    Pendentes: 0,
    Enviados: 0,
    Erros: 0,
    FaturamentoTotal: 0,
    FaturamentoHoje: 0
  };
}

module.exports = {
  getPool,
  sql,
  salvarPedido,
  atualizarStatus,
  buscarPendentes,
  incrementarTentativa,
  buscarAdminPorUsuario,
  buscarTodosPedidos,
  obterMenuCompleto,
  atualizarProduto,
  atualizarPizzaSabor,
  obterEstatisticasDashboard,
};

