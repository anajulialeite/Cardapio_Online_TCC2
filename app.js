// Cardápio Online - Script Principal

// URL DO SERVIDOR PIX
const PIX_SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname || window.location.protocol === 'file:'
  ? 'http://localhost:3001'
  : 'https://cardapio-online-tcc-ii.onrender.com';

// STATUS
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentProduct = null;
let modalQty = 1;
let pizzaQty = 1;
let pizzaState = { size: null, flavors: [], border: null };
let searchQuery = '';

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Tentar carregar cardápio dinâmico do servidor
  try {
    const response = await fetch(`${PIX_SERVER_URL}/menu`);
    if (response.ok) {
      const data = await response.json();
      if (data.categories && data.pizzas) {
        CATEGORIES = data.categories;
        PIZZAS = data.pizzas;
        console.log('Cardápio dinâmico carregado do servidor!');
      }
    }
  } catch (error) {
    console.warn('Não foi possível carregar o cardápio do servidor, usando fallback estático:', error);
  }

  renderStoreInfo();
  checkStoreStatus();
  renderCategoriesNav();
  renderAllProducts();
  renderFooter();
  updateCartUI();
  createParticles();
  setupSearch();
});

// Info do estabelecimento
function renderStoreInfo() {
  document.getElementById('storeAddress').textContent = STORE_INFO.address;
  document.getElementById('storePhone').textContent = STORE_INFO.phone;
  document.getElementById('minOrder').textContent = STORE_INFO.minOrder;
  document.getElementById('cartMinOrder').textContent = STORE_INFO.minOrder;
}

function checkStoreStatus() {
  const badge = document.getElementById('statusBadge');
  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sunday
  const schedule = STORE_INFO.schedule[dayIndex];

  if (!schedule) {
    badge.textContent = 'Fechado';
    badge.className = 'info-bar__badge info-bar__badge--closed';
    return;
  }

  const [openH, openM] = schedule.open.split(':').map(Number);
  const [closeH, closeM] = schedule.close.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (nowMinutes >= openMinutes && nowMinutes <= closeMinutes) {
    badge.textContent = '● Aberto agora';
    badge.className = 'info-bar__badge info-bar__badge--open';
  } else {
    badge.textContent = 'Fechado';
    badge.className = 'info-bar__badge info-bar__badge--closed';
  }
}

// Partículas do background
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'hero__particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (4 + Math.random() * 4) + 's';
    container.appendChild(particle);
  }
}

// Navegação de categorias
function renderCategoriesNav() {
  const nav = document.getElementById('categoriesNav');

  // PIZZA
  const pizzaChip = document.createElement('button');
  pizzaChip.className = 'category-chip';
  pizzaChip.innerHTML = `<span class="emoji">🍕</span> Pizzas`;
  pizzaChip.onclick = () => openPizzaModal();
  nav.appendChild(pizzaChip);

  // Outras categorias
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'category-chip';
    chip.id = `chip-${cat.id}`;
    chip.innerHTML = `<span class="emoji">${cat.icon}</span> ${cat.name}`;
    chip.onclick = () => scrollToCategory(cat.id);
    nav.appendChild(chip);
  });

  // Drag-to-scroll para desktop/notebook
  let isDown = false;
  let startX;
  let scrollLeft;

  nav.addEventListener('mousedown', (e) => {
    isDown = true;
    nav.classList.add('dragging');
    startX = e.pageX - nav.offsetLeft;
    scrollLeft = nav.scrollLeft;
  });

  nav.addEventListener('mouseleave', () => {
    isDown = false;
    nav.classList.remove('dragging');
  });

  nav.addEventListener('mouseup', () => {
    isDown = false;
    nav.classList.remove('dragging');
  });

  nav.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - nav.offsetLeft;
    const walk = (x - startX) * 2;
    nav.scrollLeft = scrollLeft - walk;
  });

  // Scroll horizontal com roda do mouse
  nav.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      nav.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

function scrollToCategory(catId) {
  const section = document.getElementById(`cat-${catId}`);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    // Atualizar chip ativo
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    const chip = document.getElementById(`chip-${catId}`);
    if (chip) chip.classList.add('active');
  }
}

// OBSERVADOR DE CATEGORIAS
function setupCategoryObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const catId = entry.target.id.replace('cat-', '');
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        const chip = document.getElementById(`chip-${catId}`);
        if (chip) chip.classList.add('active');
      }
    });
  }, { rootMargin: '-120px 0px -70% 0px' });

  document.querySelectorAll('.category-section').forEach(s => observer.observe(s));
}

// Renderização dos produtos no cardápio
function renderAllProducts() {
  const main = document.getElementById('mainContent');
  // MANter o banner de busca
  const searchBanner = document.getElementById('searchBanner');

  // Limpar tudo exceto o banner
  const children = Array.from(main.children);
  children.forEach(child => {
    if (child.id !== 'searchBanner') main.removeChild(child);
  });

  CATEGORIES.forEach(cat => {
    const filteredProducts = searchQuery
      ? cat.products.filter(p => matchSearch(p))
      : cat.products;

    if (searchQuery && filteredProducts.length === 0) return;

    const section = document.createElement('section');
    section.className = 'category-section';
    section.id = `cat-${cat.id}`;

    const availableCount = filteredProducts.filter(p => p.available).length;

    section.innerHTML = `
      <div class="category-header" onclick="toggleCategory('${cat.id}')">
        <span class="category-header__emoji">${cat.icon}</span>
        <h2 class="category-header__title">${cat.name}</h2>
        <span class="category-header__count">${availableCount} itens</span>
        <span class="category-header__toggle">▼</span>
      </div>
      <div class="category-products" id="products-${cat.id}">
        ${filteredProducts.map(p => renderProductCard(p, cat)).join('')}
      </div>
    `;

    main.appendChild(section);
  });

  setupCategoryObserver();
}

function renderProductCard(product, category) {
  const unavailableClass = !product.available ? 'unavailable' : '';
  const tagHtml = product.tag
    ? `<span class="product-card__tag ${product.tag === 'Novidade' ? 'product-card__tag--new' : ''}">${product.tag}</span>`
    : '';
  const imgHtml = product.image
    ? `<img class="product-card__img" src="${product.image}" alt="${product.name}" loading="lazy">`
    : '';

  return `
    <div class="product-card ${unavailableClass}" onclick="openProductModal('${product.id}', '${category.id}')">
      ${imgHtml}
      <div class="product-card__info">
        <div class="product-card__name">${product.name}</div>
        ${product.desc ? `<div class="product-card__desc">${product.desc}</div>` : ''}
        ${tagHtml}
      </div>
      <div class="product-card__price-area">
        <span class="product-card__price">R$ ${formatPrice(product.price)}</span>
        ${product.available ? `<button class="product-card__add-btn" onclick="event.stopPropagation(); quickAdd('${product.id}', '${category.id}')">+</button>` : '<span style="font-size:12px;color:var(--text-light)">Indisponível</span>'}
      </div>
    </div>
  `;
}

function toggleCategory(catId) {
  const products = document.getElementById(`products-${catId}`);
  const header = products.previousElementSibling;
  products.classList.toggle('hidden');
  header.classList.toggle('collapsed');
}

// Campo de pesquisa
function setupSearch() {
  const input = document.getElementById('searchInput');
  let debounce;

  input.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = e.target.value.trim().toLowerCase();
      const banner = document.getElementById('searchBanner');

      if (searchQuery) {
        const totalResults = CATEGORIES.reduce((acc, cat) => {
          return acc + cat.products.filter(p => matchSearch(p)).length;
        }, 0);

        document.getElementById('searchBannerText').textContent =
          `${totalResults} resultado(s) para "${e.target.value.trim()}"`;
        banner.style.display = 'flex';
      } else {
        banner.style.display = 'none';
      }

      renderAllProducts();
    }, 300);
  });
}

function matchSearch(product) {
  if (!searchQuery) return true;
  const q = searchQuery;
  return (
    product.name.toLowerCase().includes(q) ||
    (product.desc && product.desc.toLowerCase().includes(q))
  );
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchBanner').style.display = 'none';
  renderAllProducts();
}

// Modal de detalhes do produto
function findProduct(productId, categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return null;
  return { product: cat.products.find(p => p.id === productId), category: cat };
}

function openProductModal(productId, categoryId) {
  const result = findProduct(productId, categoryId);
  if (!result || !result.product.available) return;

  currentProduct = result;
  modalQty = 1;

  const { product, category } = result;
  const modal = document.getElementById('productModal');

  // Banner da imagem
  const bannerContainer = document.getElementById('modalBannerContainer');
  if (product.image) {
    bannerContainer.innerHTML = `<img class="modal__banner-img" src="${product.image}" alt="${product.name}">`;
  } else {
    bannerContainer.innerHTML = '';
  }

  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalDesc').textContent = product.desc || '';
  document.getElementById('modalPrice').textContent = `R$ ${formatPrice(product.price)}`;
  document.getElementById('modalQty').textContent = '1';

  // RENDERIZAR COMPLEMENTOS E ADICIONAIS
  const body = document.getElementById('modalBody');
  body.innerHTML = '';

  // COMPLEMENTOS
  if (product.complements) {
    product.complements.forEach((comp, ci) => {
      const group = document.createElement('div');
      group.className = 'complement-group';
      const inputType = comp.type === 'radio' ? 'radio' : 'checkbox';
      const badgeClass = comp.required ? '' : 'complement-group__badge--optional';
      const badgeText = comp.required ? 'Obrigatório' : 'Opcional';

      group.innerHTML = `
        <div class="complement-group__header">
          <span class="complement-group__title">${comp.title}</span>
          <span class="complement-group__badge ${badgeClass}">${badgeText}</span>
        </div>
        ${comp.options.map((opt, oi) => `
          <label class="complement-option">
            <input type="${inputType}" name="comp-${ci}" value="${opt}" data-comp-index="${ci}"
              ${comp.type === 'checkbox' ? `data-max="${comp.max || 99}"` : ''}>
            <span class="complement-option__label">${opt}</span>
          </label>
        `).join('')}
      `;
      body.appendChild(group);
    });
  }

  // Extras
  if (category.extras && category.extras.length > 0) {
    const extrasDiv = document.createElement('div');
    extrasDiv.className = 'extras-section';
    extrasDiv.innerHTML = `
      <h3 class="extras-section__title">Adicionais</h3>
      ${category.extras.map((ext, ei) => `
        <label class="complement-option">
          <input type="checkbox" name="extra" value="${ext.name}" data-price="${ext.price}">
          <span class="complement-option__label">${ext.name}</span>
          <span class="complement-option__price">+ R$ ${formatPrice(ext.price)}</span>
        </label>
      `).join('')}
    `;
    body.appendChild(extrasDiv);
  }

  // CAMPO DE OBSERVAÇÃO
  const obsDiv = document.createElement('div');
  obsDiv.className = 'complement-group';
  obsDiv.style.marginTop = '16px';
  obsDiv.innerHTML = `
    <div class="complement-group__header">
      <span class="complement-group__title">Observações</span>
      <span class="complement-group__badge complement-group__badge--optional">Opcional</span>
    </div>
    <textarea id="modalObs" placeholder="Ex: Sem cebola, bem passado..." 
      style="width:100%;padding:12px;border:2px solid var(--border);border-radius:8px;font-size:14px;resize:vertical;min-height:60px;background:var(--bg);color:#ffffff;"></textarea>
  `;
  body.appendChild(obsDiv);

  updateModalTotal();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = '';
  currentProduct = null;
}

function changeModalQty(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById('modalQty').textContent = modalQty;
  updateModalTotal();
}

function updateModalTotal() {
  if (!currentProduct) return;
  const extras = getSelectedExtras();
  const total = (currentProduct.product.price + extras) * modalQty;
  document.getElementById('modalTotalPrice').textContent = `R$ ${formatPrice(total)}`;
}

function getSelectedExtras() {
  let total = 0;
  document.querySelectorAll('#modalBody input[name="extra"]:checked').forEach(el => {
    total += parseFloat(el.dataset.price);
  });
  return total;
}

function getSelectedComplements() {
  const complements = [];
  if (!currentProduct.product.complements) return complements;

  currentProduct.product.complements.forEach((comp, ci) => {
    const inputs = document.querySelectorAll(`#modalBody input[data-comp-index="${ci}"]:checked`);
    const selections = Array.from(inputs).map(el => el.value);
    if (selections.length > 0) {
      complements.push({ title: comp.title, selections });
    }
  });
  return complements;
}

function addToCartFromModal() {
  if (!currentProduct) return;
  const { product, category } = currentProduct;

  // VERIFICA SE TEM COMPLEMENTOS
  if (product.complements) {
    for (let i = 0; i < product.complements.length; i++) {
      const comp = product.complements[i];
      if (comp.required) {
        const inputs = document.querySelectorAll(`#modalBody input[data-comp-index="${i}"]:checked`);
        if (inputs.length === 0) {
          showToast(`Selecione: ${comp.title}`, '⚠️');
          return;
        }
      }
    }
  }

  const complements = getSelectedComplements();
  const extras = [];
  document.querySelectorAll('#modalBody input[name="extra"]:checked').forEach(el => {
    extras.push({ name: el.value, price: parseFloat(el.dataset.price) });
  });

  const obs = document.getElementById('modalObs')?.value || '';
  const extrasTotal = extras.reduce((a, e) => a + e.price, 0);

  const item = {
    id: Date.now() + Math.random(),
    productId: product.id,
    name: product.name,
    basePrice: product.price,
    unitPrice: product.price + extrasTotal,
    qty: modalQty,
    complements,
    extras,
    obs,
    type: 'product'
  };

  cart.push(item);
  saveCart();
  updateCartUI();
  closeProductModal();
  showToast(`${product.name} adicionado!`);
}

// ADICIONAR RAPIDAMENTE (sem complementos)
function quickAdd(productId, categoryId) {
  const result = findProduct(productId, categoryId);
  if (!result || !result.product.available) return;

  const { product } = result;

  // SE TIVER COMPLEMENTOS, ABRE O MODAL
  if (product.complements && product.complements.length > 0) {
    openProductModal(productId, categoryId);
    return;
  }

  const item = {
    id: Date.now() + Math.random(),
    productId: product.id,
    name: product.name,
    basePrice: product.price,
    unitPrice: product.price,
    qty: 1,
    complements: [],
    extras: [],
    obs: '',
    type: 'product'
  };

  cart.push(item);
  saveCart();
  updateCartUI();
  showToast(`${product.name} adicionado!`);
}

// ALTERAR O VALOR TOTAL DO PRODUTO
document.addEventListener('change', (e) => {
  if (e.target.closest('#modalBody')) {
    updateModalTotal();
  }
});

// FECHAR MODAL AO CLIQUE NO OVERLAY
document.getElementById('productModal').addEventListener('click', (e) => {
  if (e.target.id === 'productModal') closeProductModal();
});

// Modal para montagem de pizza meio a meio
function openPizzaModal() {
  pizzaState = { size: null, flavors: [], border: null };
  pizzaQty = 1;
  document.getElementById('pizzaQty').textContent = '1';
  renderPizzaModal();
  document.getElementById('pizzaModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePizzaModal() {
  document.getElementById('pizzaModal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderPizzaModal() {
  const body = document.getElementById('pizzaModalBody');

  // ETAPA 1: TAMANHO
  let html = `<h3 style="font-size:16px;font-weight:700;margin-bottom:12px;color:var(--accent);">1. Escolha o tamanho</h3>`;
  html += `<div class="pizza-sizes">`;
  PIZZAS.sizes.forEach(size => {
    const selected = pizzaState.size?.id === size.id ? 'selected' : '';
    html += `
      <div class="pizza-size-card ${selected}" onclick="selectPizzaSize('${size.id}')">
        <div class="pizza-size-card__name">${size.name}</div>
        <div class="pizza-size-card__desc">${size.desc}</div>
        <div class="pizza-size-card__price">R$ ${formatPrice(size.basePrice)}</div>
      </div>
    `;
  });
  html += `</div>`;

  // ETAPA 2: SABORES (SE TAMANHO SELECIONADO)
  if (pizzaState.size) {
    const maxFlavors = pizzaState.size.maxFlavors;
    html += `<h3 style="font-size:16px;font-weight:700;margin-bottom:12px;color:var(--accent);">2. Escolha até ${maxFlavors} sabor(es) <span style="font-size:12px;color:var(--text-secondary);">(${pizzaState.flavors.length}/${maxFlavors})</span></h3>`;

    const types = [...new Set(PIZZAS.flavors.map(f => f.type))];
    types.forEach(type => {
      const flavorsOfType = PIZZAS.flavors.filter(f => f.type === type && (f.available === undefined || f.available === true || f.available === 1));
      html += `
        <div class="pizza-flavor-type">
          <div class="pizza-flavor-type__title">${type}</div>
          ${flavorsOfType.map(flavor => {
            const isSelected = pizzaState.flavors.includes(flavor.name);
            const price = flavor.prices[pizzaState.size.id];
            const imgHtml = flavor.image
              ? `<img class="pizza-flavor-option__img" src="${flavor.image}" alt="${flavor.name}" loading="lazy">`
              : '';
            return `
                  <div class="pizza-flavor-option ${isSelected ? 'selected' : ''}" onclick="togglePizzaFlavor('${flavor.name}')">
                    <div class="pizza-flavor-option__check">${isSelected ? '✓' : ''}</div>
                    ${imgHtml}
                    <div class="pizza-flavor-option__info">
                      <div class="pizza-flavor-option__name">${flavor.name}</div>
                      <div class="pizza-flavor-option__desc">${flavor.desc}</div>
                    </div>
                    <div class="pizza-flavor-option__price">R$ ${formatPrice(price)}</div>
                  </div>
                `;
          }).join('')}
        </div>
      `;
    });

    // ETAPA 3: BORDA
    html += `<h3 style="font-size:16px;font-weight:700;margin:20px 0 12px;color:var(--accent);">3. Escolha a borda</h3>`;
    PIZZAS.borders.forEach(border => {
      const isSelected = pizzaState.border?.name === border.name;
      const price = border.prices[pizzaState.size.id];
      html += `
        <div class="pizza-flavor-option ${isSelected ? 'selected' : ''}" onclick="selectPizzaBorder('${border.name}')">
          <div class="pizza-flavor-option__check">${isSelected ? '✓' : ''}</div>
          <div class="pizza-flavor-option__info">
            <div class="pizza-flavor-option__name">${border.name}</div>
          </div>
          ${price > 0 ? `<div class="pizza-flavor-option__price">+ R$ ${formatPrice(price)}</div>` : '<div class="pizza-flavor-option__price" style="color:var(--success)">Grátis</div>'}
        </div>
      `;
    });
  }

  body.innerHTML = html;
  updatePizzaTotal();
}

function selectPizzaSize(sizeId) {
  pizzaState.size = PIZZAS.sizes.find(s => s.id === sizeId);
  pizzaState.flavors = [];
  pizzaState.border = PIZZAS.borders[0]; // Default: sem borda
  renderPizzaModal();
}

function togglePizzaFlavor(flavorName) {
  const idx = pizzaState.flavors.indexOf(flavorName);
  if (idx > -1) {
    pizzaState.flavors.splice(idx, 1);
  } else {
    if (pizzaState.flavors.length >= pizzaState.size.maxFlavors) {
      showToast(`Máximo ${pizzaState.size.maxFlavors} sabor(es)`, '⚠️');
      return;
    }
    pizzaState.flavors.push(flavorName);
  }
  renderPizzaModal();
}

function selectPizzaBorder(borderName) {
  pizzaState.border = PIZZAS.borders.find(b => b.name === borderName);
  renderPizzaModal();
}

function changePizzaQty(delta) {
  pizzaQty = Math.max(1, pizzaQty + delta);
  document.getElementById('pizzaQty').textContent = pizzaQty;
  updatePizzaTotal();
}

function calcPizzaPrice() {
  if (!pizzaState.size || pizzaState.flavors.length === 0) return 0;

  // Take the highest price among selected flavors
  let maxFlavorPrice = 0;
  pizzaState.flavors.forEach(fn => {
    const flavor = PIZZAS.flavors.find(f => f.name === fn);
    if (flavor) {
      const price = flavor.prices[pizzaState.size.id];
      if (price > maxFlavorPrice) maxFlavorPrice = price;
    }
  });

  const borderPrice = pizzaState.border ? pizzaState.border.prices[pizzaState.size.id] : 0;
  return maxFlavorPrice + borderPrice;
}

function updatePizzaTotal() {
  const total = calcPizzaPrice() * pizzaQty;
  document.getElementById('pizzaTotalPrice').textContent = `R$ ${formatPrice(total)}`;
}

function addPizzaToCart() {
  if (!pizzaState.size) { showToast('Escolha o tamanho!', '⚠️'); return; }
  if (pizzaState.flavors.length === 0) { showToast('Escolha pelo menos 1 sabor!', '⚠️'); return; }

  const unitPrice = calcPizzaPrice();
  const item = {
    id: Date.now() + Math.random(),
    name: `Pizza ${pizzaState.size.name}`,
    basePrice: unitPrice,
    unitPrice: unitPrice,
    qty: pizzaQty,
    complements: [
      { title: 'Sabor(es)', selections: [...pizzaState.flavors] },
      { title: 'Borda', selections: [pizzaState.border?.name || 'Sem borda'] }
    ],
    extras: [],
    obs: '',
    type: 'pizza'
  };

  cart.push(item);
  saveCart();
  updateCartUI();
  closePizzaModal();
  showToast(`Pizza ${pizzaState.size.name} adicionada!`);
}

// Close pizza modal on overlay
document.getElementById('pizzaModal').addEventListener('click', (e) => {
  if (e.target.id === 'pizzaModal') closePizzaModal();
});

// Carrinho de compras
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const totalItems = cart.reduce((a, i) => a + i.qty, 0);

  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.classList.remove('empty');
  } else {
    badge.classList.add('empty');
  }

  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart__empty">
        <div class="cart__empty-icon">🛒</div>
        <p class="cart__empty-text">Seu carrinho está vazio</p>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';

  let html = '';
  cart.forEach((item, index) => {
    const complementsText = item.complements.map(c => `${c.title}: ${c.selections.join(', ')}`).join(' | ');
    const extrasText = item.extras.map(e => e.name).join(', ');
    const details = [complementsText, extrasText, item.obs].filter(Boolean).join(' • ');

    html += `
      <div class="cart-item">
        <div class="cart-item__info">
          <div class="cart-item__name">${item.name}</div>
          ${details ? `<div class="cart-item__details">${details}</div>` : ''}
          <div class="cart-item__controls">
            <div class="cart-item__qty">
              <button onclick="updateCartItemQty(${index}, -1)">−</button>
              <span>${item.qty}</span>
              <button onclick="updateCartItemQty(${index}, 1)">+</button>
            </div>
            <button class="cart-item__remove" onclick="removeCartItem(${index})">🗑️</button>
          </div>
        </div>
        <div class="cart-item__price">R$ ${formatPrice(item.unitPrice * item.qty)}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update total
  const total = cart.reduce((a, i) => a + (i.unitPrice * i.qty), 0);
  document.getElementById('cartTotal').textContent = `R$ ${formatPrice(total)}`;
}

function updateCartItemQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  saveCart();
  updateCartUI();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = sidebar.classList.contains('active');

  if (isOpen) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Finalização do pedido
function updateCheckoutTotal() {
  const deliveryType = document.getElementById('checkDeliveryType')?.value;
  const totalProducts = cart.reduce((a, i) => a + (i.unitPrice * i.qty), 0);
  let fee = 0;

  if (deliveryType === 'delivery') {
    const neighborhoodSelect = document.getElementById('checkNeighborhood');
    if (neighborhoodSelect) {
      const selectedOption = neighborhoodSelect.options[neighborhoodSelect.selectedIndex];
      fee = parseFloat(selectedOption?.dataset?.fee || 0);
    }
    document.getElementById('checkoutDeliveryRow').style.display = 'flex';
    document.getElementById('checkoutDeliveryFee').textContent = `R$ ${formatPrice(fee)}`;
  } else {
    document.getElementById('checkoutDeliveryRow').style.display = 'none';
    document.getElementById('checkoutDeliveryFee').textContent = 'R$ 0,00';
  }

  const totalGeneral = totalProducts + fee;
  document.getElementById('checkoutTotalVal').textContent = `R$ ${formatPrice(totalGeneral)}`;
}

// Finalização do pedido
function openCheckout() {
  if (cart.length === 0) return;

  const total = cart.reduce((a, i) => a + (i.unitPrice * i.qty), 0);
  if (total < STORE_INFO.minOrder) {
    showToast(`Pedido mínimo: R$ ${formatPrice(STORE_INFO.minOrder)}`, '⚠️');
    return;
  }

  toggleCart(); // FECHAR CARRINHO

  const container = document.getElementById('checkoutContent');

  // Carregar dados salvos
  const savedData = JSON.parse(localStorage.getItem('customerData') || '{}');

  container.innerHTML = `
    <div class="checkout__header">
      <h2>📋 Finalizar Pedido</h2>
      <button class="checkout__close" onclick="closeCheckout()">✕</button>
    </div>
    <div class="checkout__body">
      <div class="checkout__section">
        <h3>📦 Resumo do Pedido</h3>
        ${cart.map(item => `
          <div class="checkout__summary-item">
            <span>${item.qty}x ${item.name}</span>
            <span>R$ ${formatPrice(item.unitPrice * item.qty)}</span>
          </div>
        `).join('')}
        <div id="checkoutDeliveryRow" style="display: none; justify-content: space-between; margin-bottom: 8px; font-size: 14px; opacity: 0.9;">
          <span>Taxa de Entrega</span>
          <span id="checkoutDeliveryFee">R$ 0,00</span>
        </div>
        <div class="checkout__summary-total">
          <span>Total Geral</span>
          <span id="checkoutTotalVal">R$ ${formatPrice(total)}</span>
        </div>
      </div>

      <div class="checkout__section">
        <h3>👤 Seus Dados</h3>
        <div class="checkout__input-group">
          <label>Nome completo *</label>
          <input type="text" id="checkName" placeholder="Seu nome" required value="${savedData.name || ''}">
        </div>
        <div class="checkout__input-group">
          <label>Telefone / WhatsApp *</label>
          <input type="tel" id="checkPhone" placeholder="(61) 99999-9999" required value="${savedData.phone || ''}">
        </div>
      </div>

      <div class="checkout__section">
        <h3>📍 Tipo de Entrega</h3>
        <div class="checkout__input-group">
          <select id="checkDeliveryType">
            <option value="delivery">🚴 Delivery</option>
            <option value="balcao">🏪 Retirada no Balcão</option>
          </select>
        </div>
        <div id="deliveryFields">
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 10px; font-weight: bold;">📍 Entregamos apenas na cidade de Luziânia-GO</p>
          <div class="checkout__input-group">
            <label>Bairro *</label>
            <select id="checkNeighborhood" required>
              <option value="">Selecione seu bairro em Luziânia...</option>
              ${DELIVERY_AREAS.neighborhoods.map(n => `
                <option value="${n.name}" data-fee="${n.fee}" ${savedData.bairro === n.name ? 'selected' : ''}>${n.name} — R$ ${formatPrice(n.fee)}</option>
              `).join('')}
            </select>
          </div>
          <div class="checkout__input-group">
            <label>Endereço (Rua e Número) *</label>
            <input type="text" id="checkAddress" placeholder="Rua, número, apto" value="${savedData.address || ''}">
          </div>
          <div class="checkout__input-group">
            <label>Referência</label>
            <input type="text" id="checkRef" placeholder="Próximo ao..." value="${savedData.ref || ''}">
          </div>
        </div>
      </div>

      <div class="checkout__section">
        <h3>💳 Forma de Pagamento</h3>
        <div class="checkout__input-group">
          <select id="checkPayment">
            <option value="dinheiro">💵 Dinheiro</option>
            <option value="debito">💳 Cartão de Débito</option>
            <option value="credito">💳 Cartão de Crédito</option>
            <option value="pix">📱 Pix</option>
          </select>
        </div>
        <div id="changeFields">
          <div class="checkout__input-group">
            <label>Troco para</label>
            <input type="text" id="checkChange" placeholder="R$ 50,00">
          </div>
        </div>
      </div>

      <div class="checkout__section">
        <div class="checkout__input-group">
          <label>Observações do pedido</label>
          <textarea id="checkObs" rows="2" placeholder="Alguma observação?"></textarea>
        </div>
      </div>

      <div class="checkout__save-data">
        <label class="checkout__save-label">
          <input type="checkbox" id="checkSaveData" ${savedData.name ? 'checked' : ''}>
          <span>💾 Salvar meus dados para próximos pedidos</span>
        </label>
      </div>

      <button class="checkout__submit" onclick="submitOrder()">
        📱 Pagar com PIX
      </button>
    </div>
  `;

  // Inicializar o botão conforme o meio de pagamento selecionado por padrão
  const paymentSelect = document.getElementById('checkPayment');
  const submitBtn = document.querySelector('.checkout__submit');
  if (paymentSelect.value === 'pix') {
    submitBtn.innerHTML = '📱 Pagar com PIX';
  } else {
    submitBtn.innerHTML = '✅ Enviar Pedido via WhatsApp';
  }

  // ALTERNAR O TIPO DE ENTREGA E ATUALIZAR TOTAL
  document.getElementById('checkDeliveryType').addEventListener('change', (e) => {
    const isDelivery = e.target.value === 'delivery';
    document.getElementById('deliveryFields').style.display = isDelivery ? 'block' : 'none';
    updateCheckoutTotal();
  });

  // ESCUTAR ALTERAÇÃO DE BAIRRO E ATUALIZAR TOTAL
  document.getElementById('checkNeighborhood').addEventListener('change', () => {
    updateCheckoutTotal();
  });

  // ALTERNAR O TIPO DE PAGAMENTO
  paymentSelect.addEventListener('change', (e) => {
    document.getElementById('changeFields').style.display = e.target.value === 'dinheiro' ? 'block' : 'none';
    if (e.target.value === 'pix') {
      submitBtn.innerHTML = '📱 Pagar com PIX';
    } else {
      submitBtn.innerHTML = '✅ Enviar Pedido via WhatsApp';
    }
  });

  // Inicializar cálculo do total de checkout
  updateCheckoutTotal();

  document.getElementById('checkoutOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('checkoutOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'checkoutOverlay') closeCheckout();
});

function submitOrder() {
  const name = document.getElementById('checkName').value.trim();
  const phone = document.getElementById('checkPhone').value.trim();

  if (!name || !phone) {
    showToast('Preencha nome e telefone!', '⚠️');
    return;
  }

  const deliveryType = document.getElementById('checkDeliveryType').value;
  let address = '';
  let bairro = null;
  let taxaEntrega = 0;

  if (deliveryType === 'delivery') {
    const street = document.getElementById('checkAddress')?.value?.trim() || '';
    const neighborhoodSelect = document.getElementById('checkNeighborhood');
    bairro = neighborhoodSelect?.value || '';
    
    if (!bairro) {
      showToast('Selecione seu bairro para entrega!', '⚠️');
      return;
    }
    if (!street) {
      showToast('Preencha a rua e o número do endereço!', '⚠️');
      return;
    }

    const selectedOption = neighborhoodSelect.options[neighborhoodSelect.selectedIndex];
    taxaEntrega = parseFloat(selectedOption?.dataset?.fee || 0);
    address = street;
  }

  // Salvar dados do cliente se checkbox marcado
  const saveData = document.getElementById('checkSaveData')?.checked;
  if (saveData) {
    const customerData = {
      name,
      phone,
      address: deliveryType === 'delivery' ? address : '',
      bairro: deliveryType === 'delivery' ? bairro : '',
      ref: document.getElementById('checkRef')?.value?.trim() || ''
    };
    localStorage.setItem('customerData', JSON.stringify(customerData));
  } else {
    localStorage.removeItem('customerData');
  }

  const ref = document.getElementById('checkRef')?.value?.trim() || '';
  const payment = document.getElementById('checkPayment').value;
  const change = document.getElementById('checkChange')?.value?.trim() || '';
  const obs = document.getElementById('checkObs')?.value?.trim() || '';
  const totalProducts = cart.reduce((a, i) => a + (i.unitPrice * i.qty), 0);
  const total = totalProducts + taxaEntrega;

  // SE FOR PIX, ABRE O MODAL PIX
  if (payment === 'pix') {
    // Salvar dados do pedido para enviar no WhatsApp depois
    window._pixOrderData = { name, phone, deliveryType, address, bairro, taxaEntrega, ref, obs, total };
    createPixPayment(total, name);
    return;
  }

  // FLUXO NORMAL - ENVIAR NO WHATSAPP
  sendWhatsAppOrder({ name, phone, deliveryType, address, bairro, taxaEntrega, ref, payment, change, obs, total });
}

// =============================================
// ENVIAR PEDIDO VIA WHATSAPP (COM PROTEÇÃO DB)
// =============================================
async function sendWhatsAppOrder({ name, phone, deliveryType, address, bairro, taxaEntrega, ref, payment, change, obs, total, pixPago }) {
  // 1. SALVAR NO BANCO PRIMEIRO
  let pedidoId = null;
  try {
    const itens = cart.map(item => ({
      produtoId: item.productId || null,
      nome: item.name,
      quantidade: item.qty,
      preco: item.unitPrice * item.qty,
      complementos: item.complements.length > 0
        ? item.complements.map(c => `${c.title}: ${c.selections.join(', ')}`).join(' | ')
        : null,
      extras: item.extras.length > 0
        ? item.extras.map(e => e.name).join(', ')
        : null,
      observacao: item.obs || null,
    }));

    const response = await fetch(`${PIX_SERVER_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeCliente: name,
        telefone: phone,
        endereco: deliveryType === 'delivery' ? address : 'Retirada no Balcão',
        referencia: deliveryType === 'delivery' ? (ref || null) : null,
        observacao: obs || null,
        total: total,
        itens: itens,
        formaPagamento: pixPago ? 'pix' : (payment || 'dinheiro'),
        tipoEntrega: deliveryType || 'delivery',
        trocoPara: payment === 'dinheiro' ? (change || null) : null,
        pixPago: pixPago || false,
        cidade: deliveryType === 'delivery' ? 'Luziânia' : null,
        bairro: deliveryType === 'delivery' ? (bairro || null) : null,
        taxaEntrega: deliveryType === 'delivery' ? (taxaEntrega || 0.00) : 0.00,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      pedidoId = data.id;
      console.log(`Pedido #${pedidoId} salvo no banco`);
    } else {
      console.warn('Não foi possível salvar no banco, continuando com WhatsApp...');
    }
  } catch (err) {
    console.warn('Servidor indisponível, continuando com WhatsApp...', err.message);
  }

  // 2. MONTAR MENSAGEM WHATSAPP
  const EMOJI = {
    cart: '🛒', person: '👤', phone: '📞', package: '📦',
    money: '💰', bike: '🚴', pin: '📍', pushpin: '📌',
    card: '💳', cash: '💵', memo: '📝', pix: '📱',
  };

  let msg = `${EMOJI.cart} *NOVO PEDIDO - Menu Online*\n\n`;
  msg += `${EMOJI.person} *Nome:* ${name}\n`;
  msg += `${EMOJI.phone} *Telefone:* ${phone}\n\n`;

  msg += `${EMOJI.package} *ITENS:*\n`;
  cart.forEach(item => {
    msg += `\u2022 ${item.qty}x ${item.name} - R$ ${formatPrice(item.unitPrice * item.qty)}\n`;
    if (item.complements.length > 0) {
      item.complements.forEach(c => {
        msg += `  _${c.title}: ${c.selections.join(', ')}_\n`;
      });
    }
    if (item.extras.length > 0) {
      msg += `  _Extras: ${item.extras.map(e => e.name).join(', ')}_\n`;
    }
    if (item.obs) msg += `  _Obs: ${item.obs}_\n`;
  });

  msg += `\n${EMOJI.money} *TOTAL: R$ ${formatPrice(total)}*\n\n`;
  msg += `${EMOJI.bike} *Entrega:* ${deliveryType === 'delivery' ? 'Delivery' : 'Retirada no Balcão'}\n`;
  if (deliveryType === 'delivery' && address) {
    msg += `🏙️ *Cidade:* Luziânia - GO\n`;
    if (bairro) msg += `${EMOJI.pin} *Bairro:* ${bairro}\n`;
    msg += `🏠 *Endereço:* ${address}\n`;
    if (ref) msg += `${EMOJI.pushpin} *Referência:* ${ref}\n`;
    msg += `🚴 *Taxa de Entrega:* R$ ${formatPrice(taxaEntrega || 0)}\n`;
  }

  if (pixPago) {
    msg += `${EMOJI.pix} *Pagamento:* PIX ✅ (Já pago)\n`;
  } else {
    const paymentLabel = payment === 'dinheiro' ? 'Dinheiro' : payment === 'debito' ? 'Débito' : 'Crédito';
    msg += `${EMOJI.card} *Pagamento:* ${paymentLabel}\n`;
    if (payment === 'dinheiro' && change) msg += `${EMOJI.cash} *Troco para:* ${change}\n`;
  }
  if (obs) msg += `\n${EMOJI.memo} *Obs:* ${obs}`;

  // 3. ABRIR WHATSAPP
  const url = `https://wa.me/5561996773513?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  // 4. MARCAR COMO ENVIADO NO BANCO
  if (pedidoId) {
    try {
      await fetch(`${PIX_SERVER_URL}/orders/${pedidoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'enviado' }),
      });
      console.log(`Pedido #${pedidoId} marcado como enviado`);
    } catch (err) {
      console.warn('Não foi possível atualizar status no banco');
    }
  }

  // 5. MOSTRAR SUCESSO
  showOrderSuccess();
}

// =============================================
// PIX - MERCADO PAGO
// =============================================
let pixPollingInterval = null;

async function createPixPayment(amount, payerName) {
  // Abrir modal PIX
  document.getElementById('pixOverlay').classList.add('active');
  document.getElementById('pixStatus').style.display = 'flex';
  document.getElementById('pixQrContainer').style.display = 'none';
  document.getElementById('pixSuccess').style.display = 'none';
  document.getElementById('pixError').style.display = 'none';
  document.body.style.overflow = 'hidden';

  try {
    // ---- PASSO 1: SOLICITAR TOKEN DE SEGURANÇA ----
    const tokenResponse = await fetch(`${PIX_SERVER_URL}/generate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json().catch(() => ({}));
      throw new Error(tokenError.error || 'Erro ao gerar token de segurança');
    }

    const tokenData = await tokenResponse.json();
    const securityToken = tokenData.token;

    console.log('Token de segurança obtido');

    // ---- PASSO 2: CRIAR PIX COM TOKEN ----
    const response = await fetch(`${PIX_SERVER_URL}/create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        token: securityToken,
        description: `Pedido - Menu Online - ${payerName}`,
        payerEmail: 'cliente@menuonline.com',
        payerFirstName: payerName.split(' ')[0],
        payerLastName: payerName.split(' ').slice(1).join(' ') || 'Cliente',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error(errorData.details || 'Transação recusada pelo servidor');
      }
      throw new Error('Erro na resposta do servidor');
    }

    const data = await response.json();

    if (!data.qrCodeBase64 || !data.qrCode) {
      throw new Error('QR Code não retornado pela API');
    }

    // Exibir QR Code
    document.getElementById('pixStatus').style.display = 'none';
    document.getElementById('pixQrContainer').style.display = 'flex';
    document.getElementById('pixQrImage').src = `data:image/png;base64,${data.qrCodeBase64}`;
    document.getElementById('pixCopyCode').value = data.qrCode;
    document.getElementById('pixAmount').textContent = `Valor: R$ ${formatPrice(amount)}`;

    // Iniciar polling do status
    startPixPolling(data.id);

  } catch (error) {
    console.error('Erro PIX:', error);
    document.getElementById('pixStatus').style.display = 'none';
    document.getElementById('pixError').style.display = 'flex';
    document.getElementById('pixErrorText').textContent = 
      error.message.includes('Failed to fetch') 
        ? 'Servidor PIX não encontrado. Verifique se o servidor está rodando (npm start na pasta server/).'
        : error.message;
  }
}


function startPixPolling(paymentId) {
  if (pixPollingInterval) clearInterval(pixPollingInterval);

  const totalSeconds = 30 * 60; // 30 minutos
  let elapsed = 0;

  // Mostrar tempo inicial
  document.getElementById('pixTimerText').textContent = 'Você tem 30:00 para realizar o pagamento!';

  pixPollingInterval = setInterval(async () => {
    elapsed += 3;
    const remaining = totalSeconds - elapsed;

    if (remaining <= 0) {
      clearInterval(pixPollingInterval);
      document.getElementById('pixTimerText').textContent = '⚠️ Tempo esgotado! Gere um novo QR Code.';
      document.getElementById('pixTimer').style.color = '#e53935';
      return;
    }

    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    document.getElementById('pixTimerText').textContent = 
      `Realize o pagamento em ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    try {
      const response = await fetch(`${PIX_SERVER_URL}/payment-status/${paymentId}`);
      const data = await response.json();

      if (data.status === 'approved') {
        clearInterval(pixPollingInterval);
        // Mostrar sucesso
        document.getElementById('pixQrContainer').style.display = 'none';
        document.getElementById('pixSuccess').style.display = 'flex';
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  }, 3000);
}

function copyPixCode() {
  const input = document.getElementById('pixCopyCode');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('Código PIX copiado!', '📋');
  }).catch(() => {
    // Fallback para navegadores mais antigos
    document.execCommand('copy');
    showToast('Código PIX copiado!', '📋');
  });
}

function closePixModal() {
  if (pixPollingInterval) clearInterval(pixPollingInterval);
  document.getElementById('pixOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function finishPixOrder() {
  closePixModal();
  // Enviar pedido via WhatsApp com indicação de que PIX já foi pago
  const orderData = window._pixOrderData;
  if (orderData) {
    sendWhatsAppOrder({ ...orderData, pixPago: true });
  }
}

// Fechar PIX modal ao clicar no overlay
document.getElementById('pixOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'pixOverlay') closePixModal();
});

function showOrderSuccess() {
  const container = document.getElementById('checkoutContent');
  container.innerHTML = `
    <div class="order-success">
      <div class="order-success__icon">🎉</div>
      <h2 class="order-success__title">Pedido Enviado!</h2>
      <p class="order-success__msg">Seu pedido foi enviado via WhatsApp. Aguarde a confirmação!</p>
      <button class="order-success__btn" onclick="finishOrder()">Voltar ao Cardápio</button>
    </div>
  `;
}

function finishOrder() {
  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();
}

// Rodapé da página
function renderFooter() {
  const footer = document.getElementById('footer');
  footer.innerHTML = `
    <h3 class="footer__name">${STORE_INFO.name}</h3>
    <p class="footer__address">${STORE_INFO.address}</p>
    <div class="footer__phones">
      <span class="footer__phone">📞 ${STORE_INFO.phone}</span>
      <span class="footer__phone">📞 ${STORE_INFO.phone2}</span>
      <span class="footer__phone">📱 ${STORE_INFO.whatsapp}</span>
    </div>
    <div class="footer__schedule">
      ${STORE_INFO.schedule.map(s => `
        <div class="footer__schedule-item">
          <strong>${s.day}</strong>
          ${s.open} - ${s.close}
        </div>
      `).join('')}
    </div>
    <p class="footer__copy">© 2026 ${STORE_INFO.name} - Sistema de Pedidos Online</p>
  `;
}

// Mensagens toast (alerta flutuante)
function showToast(message, icon = '✅') {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = message;
  toast.querySelector('.toast__icon').textContent = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Funções auxiliares
function formatPrice(price) {
  return price.toFixed(2).replace('.', ',');
}

// Controle de tema (dark/light mode)
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('themeIcon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Restore saved theme on load
(function () {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = saved === 'dark' ? '☀️' : '🌙';
})();
