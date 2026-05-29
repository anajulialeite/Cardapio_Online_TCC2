// =============================================
// SCRIPT DE SEED DO BANCO DE DADOS - CARDÁPIO ONLINE
// =============================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');
  const { sql, getPool } = db;
  try {
    const pool = await getPool();
    
    // =============================================
    // 1. CRIAR TABELAS SE NÃO EXISTIREM
    // =============================================
    console.log('⚙️ Verificando e criando tabelas...');
    
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

    // Tabela Produtos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Produtos' AND xtype='U')
      BEGIN
        CREATE TABLE Produtos (
            Id            NVARCHAR(50)   PRIMARY KEY,
            CategoriaId   NVARCHAR(50)   NOT NULL,
            Nome          NVARCHAR(100)  NOT NULL,
            Descricao     NVARCHAR(255)  NULL,
            Preco         DECIMAL(10,2)  NOT NULL,
            Disponivel    BIT            NOT NULL DEFAULT 1,
            Tag           NVARCHAR(50)   NULL,
            Complements   NVARCHAR(MAX)  NULL
        );
        PRINT 'Tabela Produtos criada com sucesso.';
      END
    `);

    // Tabela PizzaSabores
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PizzaSabores' AND xtype='U')
      BEGIN
        CREATE TABLE PizzaSabores (
            Nome          NVARCHAR(100)  PRIMARY KEY,
            Descricao     NVARCHAR(255)  NULL,
            Tipo          NVARCHAR(50)   NOT NULL,
            PrecoBrotinho DECIMAL(10,2)  NOT NULL,
            PrecoGrande   DECIMAL(10,2)  NOT NULL,
            Disponivel    BIT            NOT NULL DEFAULT 1
        );
        PRINT 'Tabela PizzaSabores criada com sucesso.';
      END
    `);

    // =============================================
    // 2. CRIAR ADMINISTRADOR PADRÃO (admin / admin123)
    // =============================================
    console.log('👤 Configurando usuário administrador padrão...');
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
      console.log('✅ Administrador padrão "admin" criado com sucesso!');
    } else {
      console.log('ℹ️ Usuário "admin" já existe no banco de dados.');
    }

    // =============================================
    // 3. PARSE DOS DADOS DO data.js DO FRONTEND
    // =============================================
    console.log('📄 Lendo arquivo data.js do frontend...');
    const dataJsPath = path.join(__dirname, '../data.js');
    const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

    const context = vm.createContext({});
    const scriptToRun = dataJsContent + '\nglobalThis.CATEGORIES = CATEGORIES; globalThis.PIZZAS = PIZZAS;';
    vm.runInContext(scriptToRun, context);
    const { CATEGORIES, PIZZAS } = context;

    if (!CATEGORIES || !PIZZAS) {
      throw new Error('Não foi possível ler CATEGORIES ou PIZZAS do data.js');
    }

    // =============================================
    // 4. POPULAR PRODUTOS GERAIS
    // =============================================
    console.log(`🍟 Importando produtos gerais (${CATEGORIES.reduce((acc, c) => acc + c.products.length, 0)} itens)...`);
    let prodCount = 0;
    
    for (const cat of CATEGORIES) {
      for (const prod of cat.products) {
        // Verificar se já existe
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
    console.log(`✅ ${prodCount} novos produtos inseridos.`);

    // =============================================
    // 5. POPULAR SABORES DE PIZZAS
    // =============================================
    console.log(`🍕 Importando sabores de pizza (${PIZZAS.flavors.length} sabores)...`);
    let pizzaCount = 0;

    for (const flavor of PIZZAS.flavors) {
      // Verificar se já existe
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
          .input('Disponivel', sql.Bit, 1) // Todos os sabores padrão iniciam disponíveis
          .query(`
            INSERT INTO PizzaSabores (Nome, Descricao, Tipo, PrecoBrotinho, PrecoGrande, Disponivel)
            VALUES (@Nome, @Descricao, @Tipo, @PrecoBrotinho, @PrecoGrande, @Disponivel)
          `);
        pizzaCount++;
      }
    }
    console.log(`✅ ${pizzaCount} novos sabores de pizza inseridos.`);
    console.log('🎉 Banco de dados atualizado e semeado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no seed do banco de dados:', error);
  } finally {
    process.exit(0);
  }
}

seed();
