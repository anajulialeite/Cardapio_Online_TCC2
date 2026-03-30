// =============================================
// CONEXÃO COM SQL SERVER
// =============================================
const sql = require('mssql/msnodesqlv8');

const dbConfig = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost\\SQLEXPRESS'};Database=${process.env.DB_DATABASE || 'CardapioOnline'};Trusted_Connection=yes;`,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};


let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log('✅ Conectado ao SQL Server');
    } catch (err) {
      console.error('❌ Erro ao conectar ao SQL Server:', err.message);
      throw err;
    }
  }
  return pool;
}

// =============================================
// FUNÇÕES DE PEDIDOS
// =============================================

// Salvar pedido + itens no banco (transação)
async function salvarPedido(pedido) {
  const db = await getPool();
  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    // Inserir pedido
    const result = await transaction.request()
      .input('NomeCliente', sql.NVarChar(100), pedido.nomeCliente)
      .input('Telefone', sql.NVarChar(20), pedido.telefone)
      .input('Endereco', sql.NVarChar(255), pedido.endereco || null)
      .input('Observacao', sql.NVarChar(255), pedido.observacao || null)
      .input('Total', sql.Decimal(10, 2), pedido.total)
      .query(`
        INSERT INTO Pedidos (NomeCliente, Telefone, Endereco, Observacao, Total)
        OUTPUT INSERTED.Id
        VALUES (@NomeCliente, @Telefone, @Endereco, @Observacao, @Total)
      `);

    const pedidoId = result.recordset[0].Id;

    // Inserir itens do pedido
    for (const item of pedido.itens) {
      await transaction.request()
        .input('PedidoId', sql.Int, pedidoId)
        .input('NomeProduto', sql.NVarChar(100), item.nome)
        .input('Quantidade', sql.Int, item.quantidade)
        .input('Preco', sql.Decimal(10, 2), item.preco)
        .query(`
          INSERT INTO ItensPedido (PedidoId, NomeProduto, Quantidade, Preco)
          VALUES (@PedidoId, @NomeProduto, @Quantidade, @Preco)
        `);
    }

    await transaction.commit();
    console.log(`📦 Pedido #${pedidoId} salvo no banco`);
    return pedidoId;

  } catch (err) {
    await transaction.rollback();
    console.error('❌ Erro ao salvar pedido:', err.message);
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
  console.log(`🔄 Pedido #${pedidoId} → status: ${novoStatus}`);
}

// Buscar pedidos pendentes
async function buscarPendentes() {
  const db = await getPool();
  const result = await db.request()
    .query(`
      SELECT p.*, 
        (SELECT i.NomeProduto, i.Quantidade, i.Preco
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

module.exports = {
  getPool,
  salvarPedido,
  atualizarStatus,
  buscarPendentes,
  incrementarTentativa,
};
