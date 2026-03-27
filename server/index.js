// =============================================
// SERVIDOR PIX - MERCADO PAGO
// =============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});
const payment = new Payment(client);

// =============================================
// POST /create-pix - Criar cobrança PIX
// =============================================
app.post('/create-pix', async (req, res) => {
  try {
    const { amount, description, payerEmail, payerFirstName, payerLastName, payerCPF } = req.body;

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
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, () => {
  console.log(`✅ Servidor PIX rodando em http://localhost:${PORT}`);
  console.log(`📱 Endpoint PIX: POST http://localhost:${PORT}/create-pix`);
  console.log(`🔍 Status: GET http://localhost:${PORT}/payment-status/:id`);
});
