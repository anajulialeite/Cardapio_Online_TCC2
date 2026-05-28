// =============================================
// SERVIDOR PIX + PEDIDOS - CARDÁPIO ONLINE
// =============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const db = require('./db');
const { iniciarFilaDeReenvio } = require('./queue');
const { gerarToken, validarToken } = require('./token');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://anajulialeite.github.io',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ]
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor PIX + Pedidos ativo!' });
});

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});
const payment = new Payment(client);

// =============================================
// POST /generate-token - Gerar token de segurança
// =============================================
// O front-end chama este endpoint ANTES de criar o PIX.
// O servidor gera um token HMAC assinado com o valor.
// Na volta (/create-pix), o token é validado.
// Se o valor foi adulterado, a transação é recusada.
// =============================================
app.post('/generate-token', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // Gerar token assinado com o valor
    const { token } = gerarToken(Number(amount));

    console.log(`🔐 Token gerado para R$ ${Number(amount).toFixed(2)}`);

    res.json({
      token,
      amount: Number(amount),
    });
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    res.status(500).json({
      error: 'Erro ao gerar token de segurança',
      details: error.message,
    });
  }
});

// =============================================
// POST /create-pix - Criar cobrança PIX
// =============================================
// AGORA EXIGE TOKEN VÁLIDO para criar a cobrança.
// Se o token for inválido ou o valor foi adulterado,
// a transação é automaticamente recusada.
// =============================================
app.post('/create-pix', async (req, res) => {
  try {
    const { amount, token, description, payerEmail, payerFirstName, payerLastName, payerCPF } = req.body;

    // ---- VALIDAÇÃO DO TOKEN ----
    if (!token) {
      console.warn('⚠️  Tentativa de criar PIX sem token!');
      return res.status(403).json({ error: 'Token de segurança obrigatório' });
    }

    const validacao = validarToken(token, Number(amount));
    if (!validacao.valid) {
      console.error(`🚫 TOKEN INVÁLIDO: ${validacao.error}`);
      console.error(`   Amount recebido: R$ ${Number(amount).toFixed(2)}`);
      return res.status(403).json({
        error: 'Transação recusada',
        details: validacao.error,
      });
    }

    console.log(`✅ Token validado para R$ ${Number(amount).toFixed(2)}`);
    // ---- FIM VALIDAÇÃO ----

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const paymentData = {
      transaction_amount: Number(amount),
      description: description || 'Pedido - Menu Online',
      payment_method_id: 'pix',
      payer: {
        email: payerEmail || 'test@test.com',
        first_name: payerFirstName || 'Cliente',
        last_name: payerLastName || 'Menu Online',
        identification: {
          type: 'CPF',
          number: payerCPF || '00000000000',
        },
      },
    };

    const result = await payment.create({ body: paymentData });

    // Retornar dados do PIX para o frontend
    res.json({
      id: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url,
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({
      error: 'Erro ao gerar cobrança PIX',
      details: error.message,
    });
  }
});

// =============================================
// GET /payment-status/:id - Verificar status
// =============================================
app.get('/payment-status/:id', async (req, res) => {
  try {
    const result = await payment.get({ id: req.params.id });

    res.json({
      id: result.id,
      status: result.status,
      statusDetail: result.status_detail,
    });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({
      error: 'Erro ao consultar status do pagamento',
      details: error.message,
    });
  }
});

// =============================================
// POST /orders - Salvar pedido no banco
// =============================================
app.post('/orders', async (req, res) => {
  try {
    const {
      nomeCliente, telefone, endereco, referencia,
      observacao, total, itens,
      formaPagamento, tipoEntrega, trocoPara, pixPago
    } = req.body;

    // Validações
    if (!nomeCliente || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    if (!itens || itens.length === 0) {
      return res.status(400).json({ error: 'Pedido deve ter pelo menos 1 item' });
    }
    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Total inválido' });
    }
    if (total < 10) {
      return res.status(400).json({ error: 'Pedido mínimo de R$ 10,00' });
    }

    const pedidoId = await db.salvarPedido({
      nomeCliente,
      telefone,
      endereco,
      referencia,
      observacao,
      total,
      itens,
      formaPagamento,
      tipoEntrega,
      trocoPara,
      pixPago,
    });

    res.status(201).json({
      id: pedidoId,
      status: 'pendente',
      message: 'Pedido salvo com sucesso',
    });
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    res.status(500).json({
      error: 'Erro ao salvar pedido no banco',
      details: error.message,
    });
  }
});

// =============================================
// PUT /orders/:id/status - Atualizar status
// =============================================
app.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const pedidoId = parseInt(req.params.id);

    if (!['pendente', 'enviado', 'erro'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use: pendente, enviado, erro' });
    }

    await db.atualizarStatus(pedidoId, status);

    res.json({
      id: pedidoId,
      status,
      message: 'Status atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      error: 'Erro ao atualizar status do pedido',
      details: error.message,
    });
  }
});

// =============================================
// GET /orders/pending - Listar pedidos pendentes
// =============================================
app.get('/orders/pending', async (req, res) => {
  try {
    const pendentes = await db.buscarPendentes();

    // Parsear itens JSON
    const resultado = pendentes.map(p => ({
      id: p.Id,
      nomeCliente: p.NomeCliente,
      telefone: p.Telefone,
      endereco: p.Endereco,
      observacao: p.Observacao,
      total: p.Total,
      status: p.Status,
      tentativasEnvio: p.TentativasEnvio,
      dataCriacao: p.DataCriacao,
      itens: p.Itens ? JSON.parse(p.Itens) : [],
    }));

    res.json({
      total: resultado.length,
      pedidos: resultado,
    });
  } catch (error) {
    console.error('Erro ao buscar pendentes:', error);
    res.status(500).json({
      error: 'Erro ao buscar pedidos pendentes',
      details: error.message,
    });
  }
});

// =============================================
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, async () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔐 Token: POST http://localhost:${PORT}/generate-token`);
  console.log(`📱 Endpoint PIX: POST http://localhost:${PORT}/create-pix`);
  console.log(`🔍 Status: GET http://localhost:${PORT}/payment-status/:id`);
  console.log(`📦 Pedidos: POST http://localhost:${PORT}/orders`);
  console.log(`📋 Pendentes: GET http://localhost:${PORT}/orders/pending`);

  // Conectar ao banco e iniciar fila
  try {
    await db.getPool();
    iniciarFilaDeReenvio();
  } catch (err) {
    console.log('⚠️  Banco não conectado. Pedidos via banco desabilitados.');
    console.log('   Configure as variáveis DB_* no arquivo .env');
  }
});
