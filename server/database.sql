-- =============================================
-- CARDÁPIO ONLINE - SCRIPT SQL SERVER
-- =============================================

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

    CONSTRAINT CK_Pedidos_TentativasEnvio CHECK (TentativasEnvio >= 0)
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

-- Trigger para atualizar DataAtualizacao automaticamente
CREATE TRIGGER trg_Pedidos_DataAtualizacao
ON Pedidos AFTER UPDATE AS
    UPDATE Pedidos SET DataAtualizacao = GETDATE()
    WHERE Id IN (SELECT Id FROM inserted);
GO

CREATE TABLE ItensPedido (
    Id              INT             IDENTITY(1,1)   NOT NULL,
    PedidoId        INT                             NOT NULL,
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

    CONSTRAINT CK_ItensPedido_Quantidade CHECK (Quantidade >= 1),

    CONSTRAINT CK_ItensPedido_Preco CHECK (Preco >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_ItensPedido_PedidoId
    ON ItensPedido (PedidoId);
GO
