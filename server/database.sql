-- =============================================
-- CARDÁPIO ONLINE - SCRIPT SQL SERVER
-- =============================================

-- 1. TABELA DE ADMINISTRADORES
CREATE TABLE Admins (
    Id          INT           IDENTITY(1,1) PRIMARY KEY,
    Usuario     NVARCHAR(50)  NOT NULL UNIQUE,
    SenhaHash   NVARCHAR(255) NOT NULL,
    Nome        NVARCHAR(100) NOT NULL,
    DataCriacao DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- 2. TABELA DE CATEGORIAS
CREATE TABLE Categorias (
    Id              NVARCHAR(50)    NOT NULL,
    Nome            NVARCHAR(100)   NOT NULL,
    Icone           NVARCHAR(50)    NULL,
    Ordem           INT             NOT NULL DEFAULT 0,
    DataCriacao     DATETIME        NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Categorias PRIMARY KEY CLUSTERED (Id)
);
GO

-- Trigger para Categoria DataAtualizacao
CREATE TRIGGER trg_Categorias_DataAtualizacao
ON Categorias AFTER UPDATE AS
    UPDATE Categorias SET DataAtualizacao = GETDATE()
    WHERE Id IN (SELECT Id FROM inserted);
GO

-- 3. TABELA DE PRODUTOS
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

    CONSTRAINT FK_Produtos_Categorias
        FOREIGN KEY (CategoriaId)
        REFERENCES Categorias (Id)
        ON DELETE CASCADE,

    CONSTRAINT CK_Produtos_Preco CHECK (Preco >= 0)
);
GO

-- Trigger para Produto DataAtualizacao
CREATE TRIGGER trg_Produtos_DataAtualizacao
ON Produtos AFTER UPDATE AS
    UPDATE Produtos SET DataAtualizacao = GETDATE()
    WHERE Id IN (SELECT Id FROM inserted);
GO

-- 4. TABELA DE SABORES DE PIZZA
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
GO

-- Trigger para PizzaSabor DataAtualizacao
CREATE TRIGGER trg_PizzaSabores_DataAtualizacao
ON PizzaSabores AFTER UPDATE AS
    UPDATE PizzaSabores SET DataAtualizacao = GETDATE()
    WHERE Id IN (SELECT Id FROM inserted);
GO

-- 5. TABELA DE PEDIDOS
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

    CONSTRAINT PK_Pedidos PRIMARY KEY CLUSTERED (Id),

    CONSTRAINT CK_Pedidos_Status CHECK (
        Status IN ('pendente', 'enviado', 'erro')
    ),

    CONSTRAINT CK_Pedidos_FormaPagamento CHECK (
        FormaPagamento IN ('dinheiro', 'debito', 'credito', 'pix')
    ),

    CONSTRAINT CK_Pedidos_TipoEntrega CHECK (
        TipoEntrega IN ('delivery', 'balcao')
    ),

    CONSTRAINT CK_Pedidos_Total CHECK (Total >= 0),

    CONSTRAINT CK_Pedidos_TentativasEnvio CHECK (TentativasEnvio >= 0),

    CONSTRAINT CK_Pedidos_Telefone CHECK (LEN(Telefone) >= 10)
);
GO

-- Índice para buscar pedidos por status (fila de reenvio)
CREATE NONCLUSTERED INDEX IX_Pedidos_Status
    ON Pedidos (Status)
    INCLUDE (NomeCliente, Total, DataCriacao);
GO

-- Índice para ordenar por data de criação
CREATE NONCLUSTERED INDEX IX_Pedidos_DataCriacao
    ON Pedidos (DataCriacao DESC);
GO

-- Índice composto para acelerar buscas comuns do dashboard administrativo
CREATE NONCLUSTERED INDEX IX_Pedidos_Status_Data
    ON Pedidos (Status, DataCriacao DESC);
GO

-- Trigger para atualizar DataAtualizacao automaticamente nos Pedidos
CREATE TRIGGER trg_Pedidos_DataAtualizacao
ON Pedidos AFTER UPDATE AS
    UPDATE Pedidos SET DataAtualizacao = GETDATE()
    WHERE Id IN (SELECT Id FROM inserted);
GO

-- 6. TABELA DE ITENS DO PEDIDO
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

    CONSTRAINT FK_ItensPedido_Pedidos
        FOREIGN KEY (PedidoId)
        REFERENCES Pedidos (Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_ItensPedido_Produtos
        FOREIGN KEY (ProdutoId)
        REFERENCES Produtos (Id)
        ON DELETE SET NULL,

    CONSTRAINT CK_ItensPedido_Quantidade CHECK (Quantidade >= 1),

    CONSTRAINT CK_ItensPedido_Preco CHECK (Preco >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_ItensPedido_PedidoId
    ON ItensPedido (PedidoId);
GO
