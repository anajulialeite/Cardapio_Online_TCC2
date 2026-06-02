// Script de carga inicial do banco de dados (seed)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bcrypt = require('bcryptjs');
const db = require('./db');

const clean = process.argv.includes('--clean');

async function seed() {
  console.log('Iniciando seed do banco de dados...');
  const { sql, getPool } = db;
  try {
    const pool = await getPool();
    
    if (clean) {
      console.log('Limpando tabelas existentes (--clean)...');
      // Drop em ordem de dependência reversa
      await pool.request().query(`
        DROP TABLE IF EXISTS ItensPedido;
        DROP TABLE IF EXISTS Pedidos;
        DROP TABLE IF EXISTS Produtos;
        DROP TABLE IF EXISTS Categorias;
        DROP TABLE IF EXISTS PizzaSabores;
        DROP TABLE IF EXISTS Admins;
      `);
      console.log('Tabelas antigas removidas.');
    }

    // Cria as tabelas necessárias se não existirem
    console.log('Verificando/criando tabelas...');
    
    // Tabela Admins
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Admins' AND xtype='U')
      BEGIN
        CREATE TABLE Admins (
            Id          INT           IDENTITY(1,1) PRIMARY KEY,
            Usuario     NVARCHAR(50)  NOT NULL UNIQUE,
            SenhaHash   NVARCHAR(255) NOT NULL,
            Nome        NVARCHAR(100) NOT NULL,
            DataCriacao DATETIME      NOT NULL DEFAULT GETDATE()
        );
        PRINT 'Tabela Admins criada com sucesso.';
      END
    `);

    // Tabela Categorias
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categorias' AND xtype='U')
      BEGIN
        CREATE TABLE Categorias (
            Id              NVARCHAR(50)    NOT NULL,
            Nome            NVARCHAR(100)   NOT NULL,
            Icone           NVARCHAR(50)    NULL,
            Ordem           INT             NOT NULL DEFAULT 0,
            DataCriacao     DATETIME        NOT NULL DEFAULT GETDATE(),
            DataAtualizacao DATETIME        NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_Categorias PRIMARY KEY CLUSTERED (Id)
        );
        PRINT 'Tabela Categorias criada com sucesso.';
      END
    `);

    // Trigger para Categoria
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name='trg_Categorias_DataAtualizacao')
      BEGIN
        EXEC('
          CREATE TRIGGER trg_Categorias_DataAtualizacao
          ON Categorias AFTER UPDATE AS
              UPDATE Categorias SET DataAtualizacao = GETDATE()
              WHERE Id IN (SELECT Id FROM inserted);
        ');
      END
    `);

    // Tabela Produtos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Produtos' AND xtype='U')
      BEGIN
        CREATE TABLE Produtos (
            Id              NVARCHAR(50)    NOT NULL,
            CategoriaId     NVARCHAR(50)    NOT NULL,
            Nome            NVARCHAR(100)   NOT NULL,
            Descricao       NVARCHAR(255)   NULL,
            Preco           DECIMAL(10,2)   NOT NULL,
            Disponivel      BIT             NOT NULL DEFAULT 1,
            Tag             NVARCHAR(50)    NULL,
            Complements     NVARCHAR(MAX)   NULL,
            DataCriacao     DATETIME        NOT NULL DEFAULT GETDATE(),
            DataAtualizacao DATETIME        NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_Produtos PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_Produtos_Categorias FOREIGN KEY (CategoriaId) REFERENCES Categorias (Id) ON DELETE CASCADE,
            CONSTRAINT CK_Produtos_Preco CHECK (Preco >= 0)
        );
        PRINT 'Tabela Produtos criada com sucesso.';
      END
    `);

    // Trigger para Produtos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name='trg_Produtos_DataAtualizacao')
      BEGIN
        EXEC('
          CREATE TRIGGER trg_Produtos_DataAtualizacao
          ON Produtos AFTER UPDATE AS
              UPDATE Produtos SET DataAtualizacao = GETDATE()
              WHERE Id IN (SELECT Id FROM inserted);
        ');
      END
    `);

    // Tabela PizzaSabores
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PizzaSabores' AND xtype='U')
      BEGIN
        CREATE TABLE PizzaSabores (
            Id              INT             IDENTITY(1,1)   NOT NULL,
            Nome            NVARCHAR(100)                   NOT NULL,
            Descricao       NVARCHAR(255)                   NULL,
            Tipo            NVARCHAR(50)                    NOT NULL,
            PrecoBrotinho   DECIMAL(10,2)                   NOT NULL,
            PrecoGrande     DECIMAL(10,2)                   NOT NULL,
            Disponivel      BIT                             NOT NULL DEFAULT 1,
            DataCriacao     DATETIME                        NOT NULL DEFAULT GETDATE(),
            DataAtualizacao DATETIME                        NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_PizzaSabores PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT UQ_PizzaSabores_Nome UNIQUE (Nome),
            CONSTRAINT CK_PizzaSabores_PrecoBrotinho CHECK (PrecoBrotinho >= 0),
            CONSTRAINT CK_PizzaSabores_PrecoGrande CHECK (PrecoGrande >= 0)
        );
        PRINT 'Tabela PizzaSabores criada com sucesso.';
      END
    `);

    // Trigger para PizzaSabores
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name='trg_PizzaSabores_DataAtualizacao')
      BEGIN
        EXEC('
          CREATE TRIGGER trg_PizzaSabores_DataAtualizacao
          ON PizzaSabores AFTER UPDATE AS
              UPDATE PizzaSabores SET DataAtualizacao = GETDATE()
              WHERE Id IN (SELECT Id FROM inserted);
        ');
      END
    `);

    // Tabela Pedidos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pedidos' AND xtype='U')
      BEGIN
        CREATE TABLE Pedidos (
            Id              INT             IDENTITY(1,1)   NOT NULL,
            NomeCliente     NVARCHAR(100)                   NOT NULL,
            Telefone        NVARCHAR(20)                    NOT NULL,
            Endereco        NVARCHAR(255)                   NULL,
            Referencia      NVARCHAR(255)                   NULL,
            Observacao      NVARCHAR(500)                   NULL,
            Total           DECIMAL(10,2)                   NOT NULL,
            FormaPagamento  NVARCHAR(20)                    NOT NULL    DEFAULT 'dinheiro',
            TipoEntrega     NVARCHAR(20)                    NOT NULL    DEFAULT 'delivery',
            TrocoPara       NVARCHAR(20)                    NULL,
            PixPago         BIT                             NOT NULL    DEFAULT 0,
            Status          NVARCHAR(20)                    NOT NULL    DEFAULT 'pendente',
            TentativasEnvio INT                             NOT NULL    DEFAULT 0,
            DataCriacao     DATETIME                        NOT NULL    DEFAULT GETDATE(),
            DataAtualizacao DATETIME                        NOT NULL    DEFAULT GETDATE(),
            Cupom           NVARCHAR(50)                    NULL,
            Desconto        DECIMAL(10,2)                   NOT NULL    DEFAULT 0.00,
            Cidade          NVARCHAR(100)                   NOT NULL    DEFAULT 'Luziânia',
            Bairro          NVARCHAR(100)                   NULL,
            TaxaEntrega     DECIMAL(10,2)                   NOT NULL    DEFAULT 0.00,
            CONSTRAINT PK_Pedidos PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT CK_Pedidos_Status CHECK (Status IN ('pendente', 'enviado', 'erro')),
            CONSTRAINT CK_Pedidos_FormaPagamento CHECK (FormaPagamento IN ('dinheiro', 'debito', 'credito', 'pix')),
            CONSTRAINT CK_Pedidos_TipoEntrega CHECK (TipoEntrega IN ('delivery', 'balcao')),
            CONSTRAINT CK_Pedidos_Total CHECK (Total >= 0),
            CONSTRAINT CK_Pedidos_TentativasEnvio CHECK (TentativasEnvio >= 0),
            CONSTRAINT CK_Pedidos_Telefone CHECK (LEN(Telefone) >= 10),
            CONSTRAINT CK_Pedidos_Desconto CHECK (Desconto >= 0),
            CONSTRAINT CK_Pedidos_TaxaEntrega CHECK (TaxaEntrega >= 0)
        );
        PRINT 'Tabela Pedidos criada com sucesso.';
      END
    `);

    // Índices para Pedidos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Pedidos_Status' AND object_id=OBJECT_ID('Pedidos'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Pedidos_Status ON Pedidos (Status) INCLUDE (NomeCliente, Total, DataCriacao);
      END
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Pedidos_DataCriacao' AND object_id=OBJECT_ID('Pedidos'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Pedidos_DataCriacao ON Pedidos (DataCriacao DESC);
      END

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Pedidos_Status_Data' AND object_id=OBJECT_ID('Pedidos'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Pedidos_Status_Data ON Pedidos (Status, DataCriacao DESC);
      END
    `);

    // Trigger para Pedidos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name='trg_Pedidos_DataAtualizacao')
      BEGIN
        EXEC('
          CREATE TRIGGER trg_Pedidos_DataAtualizacao
          ON Pedidos AFTER UPDATE AS
              UPDATE Pedidos SET DataAtualizacao = GETDATE()
              WHERE Id IN (SELECT Id FROM inserted);
        ');
      END
    `);

    // Tabela ItensPedido
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItensPedido' AND xtype='U')
      BEGIN
        CREATE TABLE ItensPedido (
            Id              INT             IDENTITY(1,1)   NOT NULL,
            PedidoId        INT                             NOT NULL,
            ProdutoId       NVARCHAR(50)                    NULL,
            NomeProduto     NVARCHAR(100)                   NOT NULL,
            Quantidade      INT                             NOT NULL,
            Preco           DECIMAL(10,2)                   NOT NULL,
            Complementos    NVARCHAR(500)                   NULL,
            Extras          NVARCHAR(500)                   NULL,
            Observacao      NVARCHAR(255)                   NULL,
            CONSTRAINT PK_ItensPedido PRIMARY KEY CLUSTERED (Id),
            CONSTRAINT FK_ItensPedido_Pedidos FOREIGN KEY (PedidoId) REFERENCES Pedidos (Id) ON DELETE CASCADE,
            CONSTRAINT FK_ItensPedido_Produtos FOREIGN KEY (ProdutoId) REFERENCES Produtos (Id) ON DELETE SET NULL,
            CONSTRAINT CK_ItensPedido_Quantidade CHECK (Quantidade >= 1),
            CONSTRAINT CK_ItensPedido_Preco CHECK (Preco >= 0)
        );
        PRINT 'Tabela ItensPedido criada com sucesso.';
      END
    `);

    // Índice para ItensPedido
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_ItensPedido_PedidoId' AND object_id=OBJECT_ID('ItensPedido'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_ItensPedido_PedidoId ON ItensPedido (PedidoId);
      END
    `);

    // Configura o usuário administrador inicial
    const adminCheck = await pool.request()
      .input('Usuario', sql.NVarChar(50), 'admin')
      .query('SELECT * FROM Admins WHERE Usuario = @Usuario');

    if (adminCheck.recordset.length === 0) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      await pool.request()
        .input('Usuario', sql.NVarChar(50), 'admin')
        .input('SenhaHash', sql.NVarChar(255), passwordHash)
        .input('Nome', sql.NVarChar(100), 'Administrador')
        .query('INSERT INTO Admins (Usuario, SenhaHash, Nome) VALUES (@Usuario, @SenhaHash, @Nome)');
      console.log('Administrador padrão "admin" criado.');
    } else {
      console.log('Usuário "admin" já existe no banco.');
    }

    // Lê e executa o arquivo data.js do frontend para extrair os dados
    const dataJsPath = path.join(__dirname, '../data.js');
    const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

    const context = vm.createContext({});
    const scriptToRun = dataJsContent + '\nglobalThis.CATEGORIES = CATEGORIES; globalThis.PIZZAS = PIZZAS;';
    vm.runInContext(scriptToRun, context);
    const { CATEGORIES, PIZZAS } = context;

    if (!CATEGORIES || !PIZZAS) {
      throw new Error('Não foi possível ler CATEGORIES ou PIZZAS do data.js');
    }

    // Popula categorias
    let catCount = 0;
    for (let index = 0; index < CATEGORIES.length; index++) {
      const cat = CATEGORIES[index];
      const catCheck = await pool.request()
        .input('Id', sql.NVarChar(50), cat.id)
        .query('SELECT Id FROM Categorias WHERE Id = @Id');

      if (catCheck.recordset.length === 0) {
        await pool.request()
          .input('Id', sql.NVarChar(50), cat.id)
          .input('Nome', sql.NVarChar(100), cat.name)
          .input('Ordem', sql.Int, index)
          .query(`
            INSERT INTO Categorias (Id, Nome, Ordem)
            VALUES (@Id, @Nome, @Ordem)
          `);
        catCount++;
      }
    }
    console.log(`${catCount} categorias inseridas.`);

    // Popula produtos gerais
    let prodCount = 0;
    for (const cat of CATEGORIES) {
      for (const prod of cat.products) {
        const prodCheck = await pool.request()
          .input('Id', sql.NVarChar(50), prod.id)
          .query('SELECT Id FROM Produtos WHERE Id = @Id');

        if (prodCheck.recordset.length === 0) {
          const complementsJson = prod.complements ? JSON.stringify(prod.complements) : null;
          await pool.request()
            .input('Id', sql.NVarChar(50), prod.id)
            .input('CategoriaId', sql.NVarChar(50), cat.id)
            .input('Nome', sql.NVarChar(100), prod.name)
            .input('Descricao', sql.NVarChar(255), prod.desc || null)
            .input('Preco', sql.Decimal(10, 2), prod.price)
            .input('Disponivel', sql.Bit, prod.available ? 1 : 0)
            .input('Tag', sql.NVarChar(50), prod.tag || null)
            .input('Complements', sql.NVarChar(sql.MAX), complementsJson)
            .query(`
              INSERT INTO Produtos (Id, CategoriaId, Nome, Descricao, Preco, Disponivel, Tag, Complements)
              VALUES (@Id, @CategoriaId, @Nome, @Descricao, @Preco, @Disponivel, @Tag, @Complements)
            `);
          prodCount++;
        }
      }
    }
    console.log(`${prodCount} produtos inseridos.`);

    // Popula sabores de pizzas
    let pizzaCount = 0;
    for (const flavor of PIZZAS.flavors) {
      const pizzaCheck = await pool.request()
        .input('Nome', sql.NVarChar(100), flavor.name)
        .query('SELECT Nome FROM PizzaSabores WHERE Nome = @Nome');

      if (pizzaCheck.recordset.length === 0) {
        const precoBrotinho = flavor.prices.brotinho || 0;
        const precoGrande = flavor.prices.grande || 0;
        
        await pool.request()
          .input('Nome', sql.NVarChar(100), flavor.name)
          .input('Descricao', sql.NVarChar(255), flavor.desc || null)
          .input('Tipo', sql.NVarChar(50), flavor.type)
          .input('PrecoBrotinho', sql.Decimal(10, 2), precoBrotinho)
          .input('PrecoGrande', sql.Decimal(10, 2), precoGrande)
          .input('Disponivel', sql.Bit, 1)
          .query(`
            INSERT INTO PizzaSabores (Nome, Descricao, Tipo, PrecoBrotinho, PrecoGrande, Disponivel)
            VALUES (@Nome, @Descricao, @Tipo, @PrecoBrotinho, @PrecoGrande, @Disponivel)
          `);
        pizzaCount++;
      }
    }
    console.log(`${pizzaCount} sabores de pizza inseridos.`);
    console.log('Banco de dados atualizado e semeado.');
    
  } catch (error) {
    console.error('Erro no seed do banco de dados:', error);
  } finally {
    process.exit(0);
  }
}

seed();
