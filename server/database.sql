-- CARDÁPIO ONLINE - SCRIPT SQL SERVER
-- Criação das tabelas: Pedidos e ItensPedido

CREATE TABLE Pedidos (
    Id              INT             IDENTITY(1,1)   NOT NULL,
    NomeCliente     NVARCHAR(100)                   NOT NULL,
    Telefone        NVARCHAR(20)                    NOT NULL,
    Endereco        NVARCHAR(255)                   NULL,
    Observacao      NVARCHAR(255)                   NULL,
    Total           DECIMAL(10,2)                   NOT NULL,
    Status          NVARCHAR(20)                    NOT NULL    DEFAULT 'pendente',
    TentativasEnvio INT                             NOT NULL    DEFAULT 0,
    DataCriacao     DATETIME                        NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_Pedidos PRIMARY KEY CLUSTERED (Id),

    CONSTRAINT CK_Pedidos_Status CHECK (Status IN ('pendente', 'enviado', 'erro')),

    CONSTRAINT CK_Pedidos_Total CHECK (Total >= 0),

    CONSTRAINT CK_Pedidos_TentativasEnvio CHECK (TentativasEnvio >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_Pedidos_Status
    ON Pedidos (Status)
    INCLUDE (NomeCliente, Total, DataCriacao);
GO

CREATE NONCLUSTERED INDEX IX_Pedidos_DataCriacao
    ON Pedidos (DataCriacao DESC);
GO

CREATE TABLE ItensPedido (
    Id              INT             IDENTITY(1,1)   NOT NULL,
    PedidoId        INT                             NOT NULL,
    NomeProduto     NVARCHAR(100)                   NOT NULL,
    Quantidade      INT                             NOT NULL,
    Preco           DECIMAL(10,2)                   NOT NULL,

    CONSTRAINT PK_ItensPedido PRIMARY KEY CLUSTERED (Id),

    CONSTRAINT FK_ItensPedido_Pedidos
        FOREIGN KEY (PedidoId)
        REFERENCES Pedidos (Id)
        ON DELETE CASCADE,

    -- Garantir que Quantidade seja >= 1
	CONSTRAINT CK_ItensPedido_Quantidade CHECK (Quantidade >= 1),

	-- Garantir que Preco seja >= 0
    CONSTRAINT CK_ItensPedido_Preco CHECK (Preco >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_ItensPedido_PedidoId
    ON ItensPedido (PedidoId);
GO
