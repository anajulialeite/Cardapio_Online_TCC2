// Servidor PIX e Pedidos - Cardápio Online
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const db = require('./db');
const { iniciarFilaDeReenvio } = require('./queue');
const { gerarToken, validarToken } = require('./token');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authMiddleware, JWT_SECRET } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

// Gera o token de segurança assinado com o valor para validar no create-pix
app.post('/generate-token', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // Gerar token assinado com o valor
    const { token } = gerarToken(Number(amount));

    console.log(`Token gerado para R$ ${Number(amount).toFixed(2)}`);

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

// POST /create-pix - Cria cobrança PIX com validação do token HMAC
app.post('/create-pix', async (req, res) => {
  try {
    const { amount, token, description, payerEmail, payerFirstName, payerLastName, payerCPF } = req.body;

    // Validação do token
    if (!token) {
      console.warn('Tentativa de criar PIX sem token');
      return res.status(403).json({ error: 'Token de segurança obrigatório' });
    }

    const validacao = validarToken(token, Number(amount));
    if (!validacao.valid) {
      console.error(`Token inválido: ${validacao.error}`);
      console.error(`Valor recebido: R$ ${Number(amount).toFixed(2)}`);
      return res.status(403).json({
        error: 'Transação recusada',
        details: validacao.error,
      });
    }

    console.log(`Token validado para R$ ${Number(amount).toFixed(2)}`);

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

// GET /payment-status/:id - Verifica status do pagamento no Mercado Pago
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

// POST /orders - Salva pedido no banco
app.post('/orders', async (req, res) => {
  try {
    const {
      nomeCliente, telefone, endereco, referencia,
      observacao, total, itens,
      formaPagamento, tipoEntrega, trocoPara, pixPago,
      cidade, bairro, taxaEntrega
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
      cidade,
      bairro,
      taxaEntrega,
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

// PUT /orders/:id/status - Atualiza status do pedido
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

// GET /orders/pending - Retorna os pedidos pendentes ou com erro
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
      cidade: p.Cidade,
      bairro: p.Bairro,
      taxaEntrega: p.TaxaEntrega,
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

// GET /menu - Carrega o cardápio mesclando os dados do banco com o data.js do frontend
app.get('/menu', async (req, res) => {
  try {
    // Ler data.js do frontend usando vm
    const vm = require('vm');
    const fs = require('fs');
    const path = require('path');
    const dataJsContent = fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8');
    const context = vm.createContext({});
    const scriptToRun = dataJsContent + '\nglobalThis.CATEGORIES = CATEGORIES; globalThis.PIZZAS = PIZZAS;';
    vm.runInContext(scriptToRun, context);
    const { CATEGORIES, PIZZAS } = context;

    let dbMenu;
    try {
      dbMenu = await db.obterMenuCompleto();
    } catch (dbErr) {
      console.warn('Banco de dados indisponível, servindo cardápio estático do arquivo data.js:', dbErr.message);
      return res.json({
        categories: CATEGORIES,
        pizzas: PIZZAS
      });
    }

    // Mesclar produtos normais do banco de dados
    const mergedCategories = CATEGORIES.map(cat => {
      const mergedProducts = cat.products.map(prod => {
        const dbProd = dbMenu.produtos.find(p => p.Id === prod.id);
        if (dbProd) {
          return {
            ...prod,
            name: dbProd.Nome,
            desc: dbProd.Descricao,
            price: Number(dbProd.Preco),
            available: dbProd.Disponivel === true || dbProd.Disponivel === 1,
            image: dbProd.Imagem || prod.image,
          };
        }
        return prod;
      });
      return {
        ...cat,
        products: mergedProducts
      };
    });

    // Mesclar sabores de pizza do banco de dados
    const mergedPizzas = {
      ...PIZZAS,
      flavors: PIZZAS.flavors.map(flavor => {
        const dbPizza = dbMenu.pizzas.find(p => p.Nome === flavor.name);
        if (dbPizza) {
          return {
            ...flavor,
            desc: dbPizza.Descricao,
            prices: {
              brotinho: Number(dbPizza.PrecoBrotinho),
              grande: Number(dbPizza.PrecoGrande),
            },
            available: dbPizza.Disponivel === true || dbPizza.Disponivel === 1,
            image: dbPizza.Imagem || flavor.image,
          };
        }
        return flavor;
      })
    };

    res.json({
      categories: mergedCategories,
      pizzas: mergedPizzas
    });
  } catch (error) {
    console.warn('Erro ao carregar cardápio do banco, usando fallback local...');
    res.status(500).json({ error: 'Erro ao carregar cardápio', details: error.message });
  }
});

// POST /admin/login - Autenticação do painel administrativo
app.post('/admin/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const admin = await db.buscarAdminPorUsuario(usuario);
    if (!admin) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const senhaValida = bcrypt.compareSync(senha, admin.SenhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    // Gerar token válido por 8 horas
    const token = jwt.sign(
      { id: admin.Id, usuario: admin.Usuario, nome: admin.Nome },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: { usuario: admin.Usuario, nome: admin.Nome }
    });
  } catch (error) {
    console.error('Erro no login admin:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /admin/orders - Retorna todos os pedidos para o painel administrativo
app.get('/admin/orders', authMiddleware, async (req, res) => {
  try {
    const pedidos = await db.buscarTodosPedidos();
    const resultado = pedidos.map(p => ({
      id: p.Id,
      nomeCliente: p.NomeCliente,
      telefone: p.Telefone,
      endereco: p.Endereco,
      referencia: p.Referencia,
      observacao: p.Observacao,
      total: p.Total,
      formaPagamento: p.FormaPagamento,
      tipoEntrega: p.TipoEntrega,
      trocoPara: p.TrocoPara,
      pixPago: p.PixPago,
      status: p.Status,
      tentativasEnvio: p.TentativasEnvio,
      dataCriacao: p.DataCriacao,
      cidade: p.Cidade,
      bairro: p.Bairro,
      taxaEntrega: p.TaxaEntrega,
      itens: p.Itens ? JSON.parse(p.Itens) : [],
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar todos os pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos', details: error.message });
  }
});

// PUT /admin/orders/:id/status - Atualização de status por um administrador
app.put('/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const pedidoId = parseInt(req.params.id);

    if (!['pendente', 'enviado', 'erro'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await db.atualizarStatus(pedidoId, status);

    res.json({
      id: pedidoId,
      status,
      message: 'Status atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido (admin):', error);
    res.status(500).json({ error: 'Erro ao atualizar status', details: error.message });
  }
});

// GET /admin/dashboard - Retorna estatísticas gerais de faturamento e status
app.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const stats = await db.obterEstatisticasDashboard();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas', details: error.message });
  }
});

// GET /admin/products - Retorna a lista de produtos gerais cadastrados
app.get('/admin/products', authMiddleware, async (req, res) => {
  try {
    const dbMenu = await db.obterMenuCompleto();
    res.json(dbMenu.produtos);
  } catch (error) {
    console.error('Erro ao listar produtos admin:', error);
    res.status(500).json({ error: 'Erro ao listar produtos', details: error.message });
  }
});

// PUT /admin/products/:id - Edição de dados do produto pelo ID
app.put('/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const { nome, descricao, preco, disponivel, imagem } = req.body;
    const id = req.params.id;

    if (!nome || preco === undefined) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    await db.atualizarProduto(id, { nome, descricao, preco, disponivel, imagem });
    res.json({ id, message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto (admin):', error);
    res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
  }
});

// GET /admin/pizzas - Retorna os sabores e preços das pizzas
app.get('/admin/pizzas', authMiddleware, async (req, res) => {
  try {
    const dbMenu = await db.obterMenuCompleto();
    res.json(dbMenu.pizzas);
  } catch (error) {
    console.error('Erro ao listar pizzas admin:', error);
    res.status(500).json({ error: 'Erro ao listar pizzas', details: error.message });
  }
});

// PUT /admin/pizzas/:name - Edição dos preços e disponibilidade do sabor de pizza
app.put('/admin/pizzas/:name', authMiddleware, async (req, res) => {
  try {
    const { descricao, precoBrotinho, precoGrande, disponivel, imagem } = req.body;
    const name = req.params.name;

    if (precoBrotinho === undefined || precoGrande === undefined) {
      return res.status(400).json({ error: 'Preços são obrigatórios' });
    }

    await db.atualizarPizzaSabor(name, { descricao, precoBrotinho, precoGrande, disponivel, imagem });
    res.json({ name, message: 'Sabor de pizza atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar sabor de pizza (admin):', error);
    res.status(500).json({ error: 'Erro ao atualizar sabor de pizza', details: error.message });
  }
});

// Inicialização do servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);

  try {
    await db.getPool();
    iniciarFilaDeReenvio();
  } catch (err) {
    console.log('Banco de dados não conectado. Pedidos via banco desabilitados.');
  }
});
