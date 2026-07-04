/**
 * Projeto: Cardápio Online
 * Desenvolvido por Ana Júlia de Lima Aguiar Leite
 * Copyright © 2026 AJ - Criar e Desenvolver. Todos os direitos reservados.
 *
 * Este código é destinado exclusivamente para fins acadêmicos e comerciais
 * da autora. A reprodução, distribuição, modificação, comercialização ou
 * utilização deste código, total ou parcial, sem autorização expressa da
 * autora é proibida.
 */

// Painel Administrativo - Script Principal

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname || window.location.protocol === 'file:'
  ? 'http://localhost:3001'
  : 'https://cardapio-online-tcc-ii.onrender.com';

// Cache local de dados
let allOrders = [];
let allProducts = [];
let allPizzas = [];
let currentFilter = 'all';

// Fluxo e Inicialização
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  // Fechar modals se clicar fora
  document.querySelectorAll('.modal-overlay-admin').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay-admin')) {
        overlay.classList.remove('active');
      }
    });
  });

  // Preview local de imagem selecionada para produtos
  const prodFileInput = document.getElementById('editProdImageFile');
  if (prodFileInput) {
    prodFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('editProdImagePreview').src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Preview local de imagem selecionada para pizzas
  const pizzaFileInput = document.getElementById('editPizzaImageFile');
  if (pizzaFileInput) {
    pizzaFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('editPizzaImagePreview').src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

function checkAuth() {
  const token = sessionStorage.getItem('adminToken');
  const user = JSON.parse(sessionStorage.getItem('adminUser') || '{}');

  if (!token) {
    document.getElementById('loginWrapper').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
  } else {
    document.getElementById('loginWrapper').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';
    document.getElementById('adminUserName').textContent = user.nome || 'Administrador';
    
    // Iniciar carregando a aba padrão
    switchTab('dashboard');
  }
}

// Helper para chamadas de API com Auth
async function apiFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (response.status === 401 || response.status === 403) {
    // Token inválido/expirado
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    checkAuth();
    showToast('Sessão expirada. Faça login novamente.', '⚠️');
    throw new Error('Não autorizado');
  }

  return response;
}

// Autenticação
async function handleLogin(event) {
  event.preventDefault();
  const usuario = document.getElementById('username').value.trim();
  const senha = document.getElementById('password').value.trim();
  const submitBtn = document.getElementById('loginSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Autenticando...';

  try {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao fazer login');
    }

    sessionStorage.setItem('adminToken', data.token);
    sessionStorage.setItem('adminUser', JSON.stringify(data.admin));

    showToast('Login realizado com sucesso!', '🔑');
    checkAuth();
  } catch (error) {
    console.error('Erro de login:', error);
    showToast(error.message, '❌');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Entrar no Painel';
  }
}

function handleLogout() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminUser');
  checkAuth();
  showToast('Sessão encerrada.', '🚪');
}

// Controle de Abas
function switchTab(tabName) {
  // Alterar classes nos botões
  document.querySelectorAll('.sidebar__nav .nav-item').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`tabBtn-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Alterar visibilidade das seções
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = 'none';
  });
  document.getElementById(`section-${tabName}`).style.display = 'block';

  // Configurar títulos e carregar dados específicos
  const pageTitle = document.getElementById('pageTitle');
  if (tabName === 'dashboard') {
    pageTitle.textContent = 'Visão Geral';
    loadDashboardStats();
  } else if (tabName === 'orders') {
    pageTitle.textContent = 'Gerenciar Pedidos';
    loadOrdersData();
  } else if (tabName === 'menu') {
    pageTitle.textContent = 'Gerenciar Cardápio';
    switchMenuTab('products');
  }
}

// Dashboard
async function loadDashboardStats() {
  try {
    const res = await apiFetch('/admin/dashboard');
    const stats = await res.json();

    document.getElementById('statTotalSales').textContent = `R$ ${formatPrice(stats.FaturamentoTotal)}`;
    document.getElementById('statTotalOrders').textContent = stats.TotalPedidos;
    document.getElementById('statPendingOrders').textContent = stats.Pendentes;
    document.getElementById('statDeliveredOrders').textContent = stats.Enviados;

    // Carregar pedidos recentes para o dashboard
    const ordersRes = await apiFetch('/admin/orders');
    const orders = await ordersRes.json();
    
    // Pegar apenas os 5 mais recentes
    const recentOrders = orders.slice(0, 5);
    renderRecentOrders(recentOrders);
  } catch (error) {
    console.error('Erro ao carregar estatísticas do dashboard:', error);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('dashboardRecentOrders');
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>#${order.id}</td>
      <td>${order.nomeCliente}</td>
      <td>${order.formaPagamento}</td>
      <td class="bold">R$ ${formatPrice(order.total)}</td>
      <td><span class="status-badge ${order.status}">${order.status}</span></td>
      <td>
        <button class="btn-action btn-view" onclick="openOrderDetails(${order.id})">🔍 Detalhes</button>
      </td>
    </tr>
  `).join('');
}

// Pedidos
async function loadOrdersData() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="text-center">Carregando pedidos...</td></tr>`;

  try {
    const res = await apiFetch('/admin/orders');
    allOrders = await res.json();
    renderOrdersTable();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: red;">Erro ao carregar dados da API.</td></tr>`;
    console.error(error);
  }
}

function filterOrders(status) {
  currentFilter = status;
  // Atualizar classe do botão ativo
  document.querySelectorAll('.filters-bar .filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  // Localizar botão ativo
  event.target.classList.add('active');
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const filtered = currentFilter === 'all' 
    ? allOrders 
    : allOrders.filter(o => o.status === currentFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">Nenhum pedido encontrado com este filtro.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const dateStr = new Date(order.dataCriacao).toLocaleString('pt-BR');
    
    // Botões de ação dinâmica
    let actionButtons = `<button class="btn-action btn-view" onclick="openOrderDetails(${order.id})">Visualizar</button>`;
    if (order.status === 'pendente') {
      actionButtons += `
        <button class="btn-action btn-deliver" onclick="updateOrderStatus(${order.id}, 'enviado')">Entregar</button>
        <button class="btn-action btn-error" onclick="updateOrderStatus(${order.id}, 'erro')">Erro</button>
      `;
    }

    return `
      <tr>
        <td>#${order.id}</td>
        <td>${dateStr}</td>
        <td class="bold">${order.nomeCliente}</td>
        <td>${order.telefone}</td>
        <td>${order.tipoEntrega === 'delivery' ? '🚗 Entrega' : '🏪 Balcão'}</td>
        <td class="bold">R$ ${formatPrice(order.total)}</td>
        <td><span class="status-badge ${order.status}">${order.status}</span></td>
        <td>
          <div class="actions-cell">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await apiFetch(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) throw new Error('Erro ao atualizar status');

    showToast(`Pedido #${orderId} atualizado para "${newStatus}"!`, '📦');
    
    // Atualizar dados localmente e re-renderizar
    const order = allOrders.find(o => o.id === orderId);
    if (order) order.status = newStatus;
    
    renderOrdersTable();
    loadDashboardStats(); // Manter dashboard atualizado em background
  } catch (error) {
    showToast('Falha ao atualizar status.', '❌');
    console.error(error);
  }
}

// Modal de detalhes do pedido
function openOrderDetails(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('modalOrderId').textContent = `#${order.id}`;
  
  const container = document.getElementById('orderModalBody');
  const dateStr = new Date(order.dataCriacao).toLocaleString('pt-BR');

  // Itens HTML
  const itemsHtml = order.itens.map(item => {
    let complements = '';
    if (item.Complementos && item.Complementos !== '[]') {
      try {
        const comps = JSON.parse(item.Complementos);
        complements += comps.map(c => `• <strong>${c.title}</strong>: ${c.selections.join(', ')}`).join('<br>');
      } catch(e) {}
    }
    if (item.Extras && item.Extras !== '[]') {
      try {
        const exts = JSON.parse(item.Extras);
        complements += (complements ? '<br>' : '') + `• <strong>Adicionais</strong>: ` + exts.map(e => e.name).join(', ');
      } catch(e) {}
    }
    if (item.Observacao) {
      complements += (complements ? '<br>' : '') + `• <em>Obs: ${item.Observacao}</em>`;
    }

    return `
      <div class="detail-item">
        <div>
          <span class="detail-item__name">${item.Quantidade}x ${item.NomeProduto}</span>
          ${complements ? `<div class="detail-item__desc">${complements}</div>` : ''}
        </div>
        <span class="detail-item__total">R$ ${formatPrice(item.Preco * item.Quantidade)}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="order-details-view">
      <div class="order-details-grid">
        <div class="info-block">
          <h4>Cliente</h4>
          <p>${order.nomeCliente}</p>
        </div>
        <div class="info-block">
          <h4>Telefone</h4>
          <p>${order.telefone}</p>
        </div>
        <div class="info-block">
          <h4>Data / Hora</h4>
          <p>${dateStr}</p>
        </div>
        <div class="info-block">
          <h4>Tipo de Entrega</h4>
          <p>${order.tipoEntrega === 'delivery' ? `🚗 Entrega (Taxa: R$ ${formatPrice(order.taxaEntrega || 0)})` : '🏪 Retirada no Balcão'}</p>
        </div>
        <div class="info-block" style="grid-column: span 2;">
          <h4>Endereço de Entrega</h4>
          <p>${order.endereco || 'Retirada no local'}</p>
          ${order.bairro ? `<p style="font-size: 13px; margin-top: 4px;"><strong>Bairro:</strong> ${order.bairro}</p>` : ''}
          ${order.cidade ? `<p style="font-size: 13px; margin-top: 2px;"><strong>Cidade:</strong> ${order.cidade} - GO</p>` : ''}
          ${order.referencia ? `<p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Ref: ${order.referencia}</p>` : ''}
        </div>
        <div class="info-block">
          <h4>Forma de Pagamento</h4>
          <p>${order.formaPagamento} ${order.trocoPara ? `(Troco para R$ ${formatPrice(order.trocoPara)})` : ''}</p>
        </div>
        <div class="info-block">
          <h4>Status do Pagamento PIX</h4>
          <p>${order.pixPago ? '✅ Pago via API' : '❌ Não detectado'}</p>
        </div>
        ${order.observacao ? `
          <div class="info-block" style="grid-column: span 2;">
            <h4>Observação Geral</h4>
            <p style="font-style: italic; color: #ffeb3b;">"${order.observacao}"</p>
          </div>
        ` : ''}
      </div>

      <div class="items-list-block">
        <h4>Itens do Pedido</h4>
        ${itemsHtml}
        <div class="detail-item" style="border-top: 2px solid var(--border); margin-top: 15px; padding-top: 15px; font-size: 16px;">
          <span style="font-weight: 700; color: white;">TOTAL</span>
          <span class="detail-item__total" style="font-size: 18px;">R$ ${formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('orderDetailModal').classList.add('active');
}

function closeOrderModal() {
  document.getElementById('orderDetailModal').classList.remove('active');
}

// Gerenciamento do cardápio (produtos e pizzas)
function switchMenuTab(menuType) {
  // Tabs active state
  document.querySelectorAll('.menu-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`menuTabBtn-${menuType}`).classList.add('active');

  // Tab content visibility
  document.querySelectorAll('.menu-tab-content').forEach(cnt => {
    cnt.style.display = 'none';
  });
  document.getElementById(`menuContent-${menuType}`).style.display = 'block';

  // Carregar dados respectivos
  if (menuType === 'products') {
    loadProductsData();
  } else {
    loadPizzasData();
  }
}

// ABA: PRODUTOS GERAIS
async function loadProductsData() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center">Carregando produtos...</td></tr>`;

  try {
    const res = await apiFetch('/admin/products');
    allProducts = await res.json();
    renderProductsTable(allProducts);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Erro ao carregar produtos.</td></tr>`;
    console.error(error);
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(prod => `
    <tr>
      <td class="bold" style="color: var(--accent);">${prod.CategoriaId.toUpperCase()}</td>
      <td class="bold">${prod.Nome}</td>
      <td style="max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${prod.Descricao || '-'}</td>
      <td class="bold">R$ ${formatPrice(prod.Preco)}</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${prod.Disponivel ? 'checked' : ''} onchange="toggleProductAvailability('${prod.Id}', this.checked)">
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <button class="btn-action btn-view" onclick="openEditProduct('${prod.Id}')">⚙️ Editar</button>
      </td>
    </tr>
  `).join('');
}

function filterProductsList() {
  const query = document.getElementById('productSearchInput').value.toLowerCase().trim();
  const filtered = allProducts.filter(p => 
    p.Nome.toLowerCase().includes(query) || 
    p.CategoriaId.toLowerCase().includes(query) ||
    (p.Descricao && p.Descricao.toLowerCase().includes(query))
  );
  renderProductsTable(filtered);
}

async function toggleProductAvailability(id, isAvailable) {
  try {
    const prod = allProducts.find(p => p.Id === id);
    if (!prod) return;

    const res = await apiFetch(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome: prod.Nome,
        descricao: prod.Descricao,
        preco: prod.Preco,
        disponivel: isAvailable,
        imagemUrl: prod.ImagemUrl
      })
    });

    if (!res.ok) throw new Error('Erro ao salvar alteração');

    prod.Disponivel = isAvailable;
    showToast(`Disponibilidade de "${prod.Nome}" atualizada!`, '🍔');
  } catch (error) {
    showToast('Erro ao atualizar disponibilidade.', '❌');
    console.error(error);
    loadProductsData(); // recarregar para restaurar estado visual correto do checkbox
  }
}

function openEditProduct(id) {
  const prod = allProducts.find(p => p.Id === id);
  if (!prod) return;

  document.getElementById('editProdId').value = prod.Id;
  document.getElementById('editProdName').value = prod.Nome;
  document.getElementById('editProdDesc').value = prod.Descricao || '';
  document.getElementById('editProdPrice').value = prod.Preco;
  document.getElementById('editProdAvailable').checked = prod.Disponivel;

  // Imagem preview e file input reset
  document.getElementById('editProdImageFile').value = '';
  const imgUrl = prod.ImagemUrl || '';
  document.getElementById('editProdImageUrl').value = imgUrl;
  const preview = document.getElementById('editProdImagePreview');
  if (imgUrl) {
    preview.src = imgUrl.startsWith('/uploads/') ? `${API_URL}${imgUrl}` : imgUrl;
  } else {
    preview.src = '';
  }

  document.getElementById('editProductModal').classList.add('active');
}

function closeEditProductModal() {
  document.getElementById('editProductModal').classList.remove('active');
}

async function saveProductChanges(event) {
  event.preventDefault();
  const id = document.getElementById('editProdId').value;
  const nome = document.getElementById('editProdName').value.trim();
  const descricao = document.getElementById('editProdDesc').value.trim();
  const preco = parseFloat(document.getElementById('editProdPrice').value);
  const disponivel = document.getElementById('editProdAvailable').checked;
  let imagemUrl = document.getElementById('editProdImageUrl').value;

  const fileInput = document.getElementById('editProdImageFile');
  if (fileInput.files.length > 0) {
    // Fazer upload da imagem primeiro
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    try {
      showToast('Enviando imagem...', '⏳');
      const uploadRes = await apiFetch(`/admin/upload`, {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Erro ao subir imagem');
      }
      const uploadData = await uploadRes.json();
      imagemUrl = uploadData.path;
      console.log('📷 Imagem enviada:', imagemUrl);
    } catch (uploadErr) {
      showToast(uploadErr.message, '❌');
      return;
    }
  }

  try {
    const res = await apiFetch(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome, descricao, preco, disponivel, imagemUrl })
    });

    if (!res.ok) throw new Error('Erro ao salvar produto');

    showToast('Produto atualizado com sucesso!', '✅');
    closeEditProductModal();
    loadProductsData();
  } catch (error) {
    showToast('Erro ao atualizar produto.', '❌');
    console.error(error);
  }
}

// ABA: SABORES DE PIZZA
async function loadPizzasData() {
  const tbody = document.getElementById('pizzasTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">Carregando sabores...</td></tr>`;

  try {
    const res = await apiFetch('/admin/pizzas');
    allPizzas = await res.json();
    renderPizzasTable(allPizzas);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red;">Erro ao carregar pizzas.</td></tr>`;
    console.error(error);
  }
}

function renderPizzasTable(pizzas) {
  const tbody = document.getElementById('pizzasTableBody');
  if (pizzas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum sabor de pizza cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = pizzas.map(pizza => `
    <tr>
      <td class="bold" style="color: var(--accent);">${pizza.Tipo.toUpperCase()}</td>
      <td class="bold">${pizza.Nome}</td>
      <td style="max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${pizza.Descricao || '-'}</td>
      <td class="bold">R$ ${formatPrice(pizza.PrecoBrotinho)}</td>
      <td class="bold">R$ ${formatPrice(pizza.PrecoGrande)}</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${pizza.Disponivel ? 'checked' : ''} onchange="togglePizzaAvailability('${pizza.Nome}', this.checked)">
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <button class="btn-action btn-view" onclick="openEditPizza('${pizza.Nome}')">⚙️ Editar</button>
      </td>
    </tr>
  `).join('');
}

function filterPizzasList() {
  const query = document.getElementById('pizzaSearchInput').value.toLowerCase().trim();
  const filtered = allPizzas.filter(p => 
    p.Nome.toLowerCase().includes(query) || 
    p.Tipo.toLowerCase().includes(query) ||
    (p.Descricao && p.Descricao.toLowerCase().includes(query))
  );
  renderPizzasTable(filtered);
}

async function togglePizzaAvailability(name, isAvailable) {
  try {
    const pizza = allPizzas.find(p => p.Nome === name);
    if (!pizza) return;

    const res = await apiFetch(`/admin/pizzas/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({
        descricao: pizza.Descricao,
        precoBrotinho: pizza.PrecoBrotinho,
        precoGrande: pizza.PrecoGrande,
        disponivel: isAvailable,
        imagemUrl: pizza.ImagemUrl
      })
    });

    if (!res.ok) throw new Error('Erro ao salvar alteração');

    pizza.Disponivel = isAvailable;
    showToast(`Disponibilidade da pizza "${pizza.Nome}" atualizada!`, '🍕');
  } catch (error) {
    showToast('Erro ao atualizar disponibilidade.', '❌');
    console.error(error);
    loadPizzasData(); // recarregar para restaurar estado visual correto do checkbox
  }
}

function openEditPizza(name) {
  const pizza = allPizzas.find(p => p.Nome === name);
  if (!pizza) return;

  document.getElementById('editPizzaNameKey').value = pizza.Nome;
  document.getElementById('editPizzaNameDisplay').value = pizza.Nome;
  document.getElementById('editPizzaDesc').value = pizza.Descricao || '';
  document.getElementById('editPizzaPriceBrotinho').value = pizza.PrecoBrotinho;
  document.getElementById('editPizzaPriceGrande').value = pizza.PrecoGrande;
  document.getElementById('editPizzaAvailable').checked = pizza.Disponivel;

  // Imagem preview e file input reset
  document.getElementById('editPizzaImageFile').value = '';
  const imgUrl = pizza.ImagemUrl || '';
  document.getElementById('editPizzaImageUrl').value = imgUrl;
  const preview = document.getElementById('editPizzaImagePreview');
  if (imgUrl) {
    preview.src = imgUrl.startsWith('/uploads/') ? `${API_URL}${imgUrl}` : imgUrl;
  } else {
    preview.src = '';
  }

  document.getElementById('editPizzaModal').classList.add('active');
}

function closeEditPizzaModal() {
  document.getElementById('editPizzaModal').classList.remove('active');
}

async function savePizzaChanges(event) {
  event.preventDefault();
  const name = document.getElementById('editPizzaNameKey').value;
  const descricao = document.getElementById('editPizzaDesc').value.trim();
  const precoBrotinho = parseFloat(document.getElementById('editPizzaPriceBrotinho').value);
  const precoGrande = parseFloat(document.getElementById('editPizzaPriceGrande').value);
  const disponivel = document.getElementById('editPizzaAvailable').checked;
  let imagemUrl = document.getElementById('editPizzaImageUrl').value;

  const fileInput = document.getElementById('editPizzaImageFile');
  if (fileInput.files.length > 0) {
    // Fazer upload da imagem primeiro
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    try {
      showToast('Enviando imagem...', '⏳');
      const uploadRes = await apiFetch(`/admin/upload`, {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Erro ao subir imagem');
      }
      const uploadData = await uploadRes.json();
      imagemUrl = uploadData.path;
      console.log('📷 Imagem enviada:', imagemUrl);
    } catch (uploadErr) {
      showToast(uploadErr.message, '❌');
      return;
    }
  }

  try {
    const res = await apiFetch(`/admin/pizzas/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ descricao, precoBrotinho, precoGrande, disponivel, imagemUrl })
    });

    if (!res.ok) throw new Error('Erro ao salvar sabor de pizza');

    showToast('Sabor de pizza atualizado com sucesso!', '✅');
    closeEditPizzaModal();
    loadPizzasData();
  } catch (error) {
    showToast('Erro ao atualizar sabor de pizza.', '❌');
    console.error(error);
  }
}

// Funções auxiliares
function formatPrice(value) {
  return Number(value).toFixed(2).replace('.', ',');
}

function showToast(message, icon = '✅') {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = message;
  document.querySelector('.toast__icon').textContent = icon;
  
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}
