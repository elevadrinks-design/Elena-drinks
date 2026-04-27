/* ==========================================================
   ELEVA DRINKS – Vanilla JS App
   - Renders dynamic menu from products array
   - Cart in localStorage
   - WhatsApp / Viber / Messenger / Instagram checkout
   - Hidden admin panel (long-press logo OR top-right corner tap)
   - Admin: products, settings, discounts, offline sales tracker
   ========================================================== */

// ------------------------------ STORAGE KEYS
const KEYS = {
  products: 'eleva_products_v1',
  settings: 'eleva_settings_v1',
  cart:     'eleva_cart_v1',
  sales:    'eleva_offline_sales_v1',
  orders:   'eleva_online_orders_v1',
};

// ------------------------------ DEFAULT DATA
const DEFAULT_PRODUCTS = [
  // Protein Shakes
  { id: 'p1', name: 'Hello Good Morning', price: 180, category: 'Protein Shakes', desc: 'Banana, oats, whey – the perfect AM fuel', image: '', emoji: '☀️', available: true, discount: 0 },
  { id: 'p2', name: 'Good Life',          price: 170, category: 'Protein Shakes', desc: 'Chocolate whey blend with milk',           image: '', emoji: '🍫', available: true, discount: 0 },
  { id: 'p3', name: 'Peanut Butter Blast',price: 190, category: 'Protein Shakes', desc: 'PB + banana + whey, thick & creamy',      image: '', emoji: '🥜', available: true, discount: 0 },
  { id: 'p4', name: 'C-Fuel',             price: 180, category: 'Protein Shakes', desc: 'Coffee + whey for pre-workout kick',      image: '', emoji: '☕', available: true, discount: 0 },
  // Summer Drinks
  { id: 's1', name: 'Myra Boost',         price: 150, category: 'Summer Drinks',  desc: 'Mixed berry energy refresher',            image: '', emoji: '🫐', available: true, discount: 0 },
  { id: 's2', name: 'Purple Rain',        price: 160, category: 'Summer Drinks',  desc: 'Beetroot, apple & ginger juice',          image: '', emoji: '🍇', available: true, discount: 0 },
  { id: 's3', name: 'Plain Gane',         price: 100, category: 'Summer Drinks',  desc: 'Fresh sugarcane juice with lemon',        image: '', emoji: '🌿', available: true, discount: 0 },
  { id: 's4', name: 'OG Immunity',        price: 120, category: 'Summer Drinks',  desc: 'Orange, ginger, turmeric shot',           image: '', emoji: '🍊', available: true, discount: 0 },
  { id: 's5', name: 'Green Mile',         price: 140, category: 'Summer Drinks',  desc: 'Spinach, apple, cucumber, lime',          image: '', emoji: '🥒', available: true, discount: 0 },
  { id: 's6', name: '4Ever Young',        price: 150, category: 'Summer Drinks',  desc: 'Watermelon mint cooler',                  image: '', emoji: '🍉', available: true, discount: 0 },
];

const DEFAULT_SETTINGS = {
  appName: 'Eleva Drinks',
  whatsapp: '9779706094655',
  viber: '9779706094655',
  messenger: '',
  instagram: '',
  deliveryEnabled: false,
  deliveryAmount: 0,
};

// ------------------------------ STATE
let state = {
  products: loadStore(KEYS.products, DEFAULT_PRODUCTS),
  settings: { ...DEFAULT_SETTINGS, ...loadStore(KEYS.settings, {}) },
  cart:     loadStore(KEYS.cart,     {}),  // { productId: qty }
  sales:    loadStore(KEYS.sales,    []),  // [{id,name,qty,price,total,date}]
  orders:   loadStore(KEYS.orders,   []),  // [{id, items, total, channel, note, date}]
  activeCategory: 'all',
  editingProductId: null,
};

function loadStore(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function persist() {
  saveStore(KEYS.products, state.products);
  saveStore(KEYS.settings, state.settings);
  saveStore(KEYS.cart,     state.cart);
  saveStore(KEYS.sales,    state.sales);
  saveStore(KEYS.orders,   state.orders);
}

// ------------------------------ HELPERS
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmt = n => 'Rs. ' + Number(n).toLocaleString('en-IN');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const todayKey = () => new Date().toISOString().slice(0,10);

function discountedPrice(p) {
  if (!p.discount || p.discount <= 0) return p.price;
  return Math.round(p.price * (100 - p.discount) / 100);
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 1800);
}

// ------------------------------ MENU RENDER
// Fixed category list — always show all four buttons
const CATEGORIES = ['All', 'Protein Shakes', 'Summer Drinks', 'Snacks'];

function renderTabs() {
  const wrap = $('#categoryTabs');
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    const key = cat === 'All' ? 'all' : cat;
    btn.className = 'cat-tab' + (state.activeCategory === key ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      state.activeCategory = key;
      renderTabs();
      renderMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    wrap.appendChild(btn);
  });
}

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-'); }

function renderMenu() {
  const container = $('#menuContainer');
  container.innerHTML = '';
  const visible = state.activeCategory === 'all'
    ? state.products
    : state.products.filter(p => p.category === state.activeCategory);
  // Group by category
  const byCat = {};
  visible.forEach(p => { (byCat[p.category] = byCat[p.category] || []).push(p); });

  if (Object.keys(byCat).length === 0) {
    const label = state.activeCategory === 'all' ? 'No products available yet.' : `No products in "${state.activeCategory}" yet.`;
    container.innerHTML = `<div class="empty-state">${escapeHtml(label)}</div>`;
    return;
  }

  Object.keys(byCat).forEach(cat => {
    const section = document.createElement('section');
    section.className = 'category-section';
    section.id = 'cat-' + slug(cat);
    section.innerHTML = `<h2 class="cat-title">${escapeHtml(cat)}</h2><div class="product-grid"></div>`;
    const grid = $('.product-grid', section);
    byCat[cat].forEach(p => grid.appendChild(productCard(p)));
    container.appendChild(section);
  });
}

function productCard(p) {
  const card = document.createElement('article');
  card.className = 'product-card' + (p.available ? '' : ' sold-out');
  const final = discountedPrice(p);
  const hasDiscount = p.discount > 0;
  const inCart = state.cart[p.id] || 0;

  card.innerHTML = `
    <div class="product-image">
      ${p.image
        ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji-fallback',textContent:'${escapeAttr(p.emoji||'🥤')}'}))">`
        : `<span class="emoji-fallback">${escapeHtml(p.emoji || '🥤')}</span>`}
      ${hasDiscount ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
      ${!p.available ? `<span class="soldout-badge">Sold Out</span>` : ''}
    </div>
    <div class="product-body">
      <div class="product-name">${escapeHtml(p.name)}</div>
      ${p.desc ? `<div class="product-desc">${escapeHtml(p.desc)}</div>` : `<div class="product-desc"></div>`}
      <div class="price-row">
        <span class="price-now">${fmt(final)}</span>
        ${hasDiscount ? `<span class="price-old">${fmt(p.price)}</span>` : ''}
      </div>
      <div class="product-actions"></div>
    </div>
  `;
  const actions = $('.product-actions', card);
  if (!p.available) {
    actions.innerHTML = `<div class="soldout-text">Unavailable</div>`;
  } else if (inCart > 0) {
    const ctrl = document.createElement('div');
    ctrl.className = 'qty-controls';
    ctrl.innerHTML = `
      <button class="qty-btn" data-act="dec">−</button>
      <span class="qty-num">${inCart}</span>
      <button class="qty-btn" data-act="inc">+</button>
    `;
    $('[data-act=dec]', ctrl).onclick = () => updateQty(p.id, -1);
    $('[data-act=inc]', ctrl).onclick = () => updateQty(p.id, +1);
    actions.appendChild(ctrl);
  } else {
    const btn = document.createElement('button');
    btn.className = 'add-btn';
    btn.textContent = '+ Add to Cart';
    btn.onclick = () => updateQty(p.id, +1);
    actions.appendChild(btn);
  }
  return card;
}

// ------------------------------ CART OPS
function updateQty(productId, delta) {
  const cur = state.cart[productId] || 0;
  const next = Math.max(0, cur + delta);
  if (next === 0) delete state.cart[productId];
  else state.cart[productId] = next;
  persist();
  renderMenu();
  renderCartBar();
  if (!$('#cartModal').hidden) renderCartModal();
}

function cartLines() {
  return Object.keys(state.cart)
    .map(id => {
      const p = state.products.find(x => x.id === id);
      if (!p) return null;
      const qty = state.cart[id];
      const price = discountedPrice(p);
      return { product: p, qty, price, total: price * qty };
    })
    .filter(Boolean);
}
function cartTotals() {
  const lines = cartLines();
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal  = lines.reduce((s, l) => s + l.total, 0);
  const delivery  = (state.settings.deliveryEnabled && itemCount > 0) ? Number(state.settings.deliveryAmount || 0) : 0;
  return { lines, itemCount, subtotal, delivery, total: subtotal + delivery };
}

function renderCartBar() {
  const bar = $('#cartBar');
  const { itemCount, total } = cartTotals();
  if (itemCount === 0) { bar.hidden = true; return; }
  bar.hidden = false;
  $('#cartCount').textContent = itemCount;
  $('#cartTotal').textContent = fmt(total);
}

function renderCartModal() {
  const wrap = $('#cartItems');
  const sum  = $('#cartSummary');
  const { lines, itemCount, subtotal, delivery, total } = cartTotals();
  wrap.innerHTML = '';
  if (lines.length === 0) {
    wrap.innerHTML = `<div class="empty-cart"><div class="empty-cart-icon">🛒</div><div>Your cart is empty</div></div>`;
    sum.innerHTML = '';
    return;
  }
  lines.forEach(line => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-thumb">${line.product.image
        ? `<img src="${escapeAttr(line.product.image)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${escapeAttr(line.product.emoji||'🥤')}'}))">`
        : escapeHtml(line.product.emoji || '🥤')}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(line.product.name)}</div>
        <div class="cart-item-price">${fmt(line.price)} × ${line.qty} = ${fmt(line.total)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-item-qty" data-act="dec">−</button>
        <span class="cart-item-num">${line.qty}</span>
        <button class="cart-item-qty" data-act="inc">+</button>
      </div>
    `;
    $('[data-act=dec]', row).onclick = () => updateQty(line.product.id, -1);
    $('[data-act=inc]', row).onclick = () => updateQty(line.product.id, +1);
    wrap.appendChild(row);
  });

  sum.innerHTML = `
    <div class="summary-row"><span class="summary-label">Items</span><span>${itemCount}</span></div>
    <div class="summary-row"><span class="summary-label">Subtotal</span><span>${fmt(subtotal)}</span></div>
    ${delivery > 0 ? `<div class="summary-row"><span class="summary-label">Delivery</span><span>${fmt(delivery)}</span></div>` : ''}
    <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
  `;
}

// ------------------------------ ORDER MESSAGE
function buildOrderMessage() {
  const { lines, subtotal, delivery, total } = cartTotals();
  const note = $('#orderNote').value.trim();
  let msg = `Hi ${state.settings.appName}, I want to order:\n\n`;
  lines.forEach(l => {
    msg += `• ${l.product.name} x ${l.qty} = ${fmt(l.total)}\n`;
  });
  msg += `\nSubtotal: ${fmt(subtotal)}`;
  if (delivery > 0) msg += `\nDelivery: ${fmt(delivery)}`;
  msg += `\nTotal: ${fmt(total)}\n`;
  if (note) msg += `\nNote: ${note}`;
  msg += `\nPickup: Now`;
  return msg;
}

function logOnlineOrder(channel) {
  const { lines, total } = cartTotals();
  const note = $('#orderNote').value.trim();
  state.orders.unshift({
    id: uid(),
    channel,
    note,
    total,
    items: lines.map(l => ({ name: l.product.name, qty: l.qty, price: l.price, total: l.total })),
    date: new Date().toISOString(),
  });
  // keep last 200
  state.orders = state.orders.slice(0, 200);
  persist();
}

function checkoutVia(channel) {
  if (cartLines().length === 0) { toast('Cart is empty'); return; }
  const text = encodeURIComponent(buildOrderMessage());
  let url = '';
  const wa  = state.settings.whatsapp;
  const vb  = state.settings.viber;
  const ms  = state.settings.messenger;
  const ig  = state.settings.instagram;

  if (channel === 'whatsapp') {
    if (!wa) { toast('WhatsApp number not set'); return; }
    url = `https://wa.me/${wa}?text=${text}`;
  } else if (channel === 'viber') {
    const num = vb || wa;
    if (!num) { toast('Viber number not set'); return; }
    url = `viber://chat?number=%2B${num}&text=${text}`;
  } else if (channel === 'messenger') {
    if (!ms) { toast('Messenger username not set'); return; }
    url = `https://m.me/${ms}`;
  } else if (channel === 'instagram') {
    if (!ig) { toast('Instagram username not set'); return; }
    url = `https://ig.me/m/${ig}`;
  }

  logOnlineOrder(channel);
  window.open(url, '_blank');
  // Clear cart after checkout
  state.cart = {};
  $('#orderNote').value = '';
  persist();
  closeAllModals();
  renderMenu();
  renderCartBar();
  toast('Order sent! 💪');
}

// ------------------------------ MODALS
function openModal(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(id) { $(id).hidden = true; document.body.style.overflow = ''; }
function closeAllModals() {
  ['#cartModal','#checkoutModal','#adminLoginModal','#productModal'].forEach(closeModal);
}

document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close]')) {
    const m = e.target.closest('.modal');
    if (m) closeModal('#' + m.id);
  }
});

// Open cart
$('#openCartBtn').addEventListener('click', () => {
  renderCartModal();
  openModal('#cartModal');
});

// Cart -> WhatsApp (default, one tap)
$('#checkoutWhatsappBtn').addEventListener('click', () => {
  if (cartLines().length === 0) { toast('Cart is empty'); return; }
  checkoutVia('whatsapp');
});

// Cart -> More options (Viber / Messenger / Instagram)
$('#moreOptionsBtn').addEventListener('click', () => {
  if (cartLines().length === 0) { toast('Cart is empty'); return; }
  closeModal('#cartModal');
  openModal('#checkoutModal');
});

// Channel pick
$$('#checkoutModal .channel-btn').forEach(btn => {
  btn.addEventListener('click', () => checkoutVia(btn.dataset.channel));
});

// ------------------------------ ADMIN ENTRY
// Triggers: top-right corner tap (the hidden 60x60 button) OR long-press on logo
let pressTimer = null;
$('#brandLogo').addEventListener('pointerdown', () => {
  pressTimer = setTimeout(openAdminLogin, 700);
});
['pointerup','pointerleave','pointercancel'].forEach(ev => {
  $('#brandLogo').addEventListener(ev, () => clearTimeout(pressTimer));
});
$('#hiddenAdminBtn').addEventListener('click', openAdminLogin);

function openAdminLogin() {
  $('#adminLoginError').hidden = true;
  $('#adminUser').value = '';
  $('#adminPass').value = '';
  openModal('#adminLoginModal');
}

$('#adminLoginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = $('#adminUser').value.trim();
  const p = $('#adminPass').value;
  if (u === 'eleva1' && p === 'eleva123drinks') {
    closeModal('#adminLoginModal');
    openAdmin();
  } else {
    $('#adminLoginError').hidden = false;
  }
});

$('#adminLogoutBtn').addEventListener('click', closeAdmin);

function openAdmin() {
  $('#adminScreen').hidden = false;
  document.body.style.overflow = 'hidden';
  switchAdminTab('products');
  renderAdminProducts();
  renderSettingsForm();
  renderSales();
  renderOrders();
}
function closeAdmin() {
  $('#adminScreen').hidden = true;
  document.body.style.overflow = '';
}

// Admin tabs
$$('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => switchAdminTab(tab.dataset.adminTab));
});
function switchAdminTab(name) {
  $$('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.adminTab === name));
  $$('.admin-panel').forEach(p => p.hidden = p.dataset.adminPanel !== name);
}

// ------------------------------ ADMIN: PRODUCTS
function renderAdminProducts() {
  const list = $('#adminProductList');
  list.innerHTML = '';
  if (state.products.length === 0) {
    list.innerHTML = `<div class="empty-state">No products yet. Add one above.</div>`;
    return;
  }
  state.products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'admin-product-row';
    const final = discountedPrice(p);
    row.innerHTML = `
      <div class="thumb">${p.image
        ? `<img src="${escapeAttr(p.image)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${escapeAttr(p.emoji||'🥤')}'}))">`
        : escapeHtml(p.emoji || '🥤')}</div>
      <div class="info">
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="meta">
          <span class="pill ${p.available ? 'live' : 'off'}">${p.available ? 'Live' : 'Sold Out'}</span>
          ${escapeHtml(p.category)} · ${fmt(final)}${p.discount ? ` <s style="opacity:.6">${fmt(p.price)}</s> -${p.discount}%` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-ghost small" data-act="edit">Edit</button>
        <button class="btn btn-ghost small" data-act="toggle">${p.available ? 'Set Out' : 'Set Live'}</button>
      </div>
    `;
    $('[data-act=edit]', row).onclick = () => openProductForm(p.id);
    $('[data-act=toggle]', row).onclick = () => {
      p.available = !p.available;
      persist(); renderAdminProducts(); renderMenu();
    };
    list.appendChild(row);
  });
  populateOfflineSelect();
}

$('#addProductBtn').addEventListener('click', () => openProductForm(null));

function openProductForm(productId) {
  state.editingProductId = productId;
  const p = productId ? state.products.find(x => x.id === productId) : null;
  $('#productModalTitle').textContent = p ? 'Edit Product' : 'Add Product';
  $('#prodId').value       = p?.id || '';
  $('#prodName').value     = p?.name || '';
  $('#prodPrice').value    = p?.price ?? '';
  $('#prodDiscount').value = p?.discount || 0;
  $('#prodCategory').value = p?.category || 'Protein Shakes';
  $('#prodDesc').value     = p?.desc || '';
  $('#prodImage').value    = p?.image || '';
  $('#prodImageFile').value = '';
  $('#prodEmoji').value    = p?.emoji || '🥤';
  $('#prodAvailable').checked = p ? p.available : true;
  $('#deleteProductBtn').style.display = p ? '' : 'none';
  updateImagePreview(p?.image || '');
  openModal('#productModal');
}

function updateImagePreview(src) {
  const wrap = $('#prodImagePreview');
  const img  = $('#prodImagePreviewImg');
  if (src) {
    img.src = src;
    wrap.hidden = false;
  } else {
    img.removeAttribute('src');
    wrap.hidden = true;
  }
}

// File upload -> base64 (max ~2MB to keep localStorage sane)
$('#prodImageFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Please select an image file'); return; }
  if (file.size > 2 * 1024 * 1024) { toast('Image too large (max 2MB)'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    $('#prodImage').value = reader.result;
    updateImagePreview(reader.result);
  };
  reader.onerror = () => toast('Failed to read image');
  reader.readAsDataURL(file);
});

$('#prodImage').addEventListener('input', (e) => updateImagePreview(e.target.value.trim()));

$('#prodImageClearBtn').addEventListener('click', () => {
  $('#prodImage').value = '';
  $('#prodImageFile').value = '';
  updateImagePreview('');
});

$('#productForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    id: $('#prodId').value || uid(),
    name: $('#prodName').value.trim(),
    price: Number($('#prodPrice').value),
    discount: Math.min(100, Math.max(0, Number($('#prodDiscount').value) || 0)),
    category: $('#prodCategory').value,
    desc: $('#prodDesc').value.trim(),
    image: $('#prodImage').value.trim(),
    emoji: $('#prodEmoji').value.trim() || '🥤',
    available: $('#prodAvailable').checked,
  };
  if (!data.name || !data.price) { toast('Name and price required'); return; }
  const idx = state.products.findIndex(x => x.id === data.id);
  if (idx >= 0) state.products[idx] = data;
  else state.products.push(data);
  persist();
  closeModal('#productModal');
  renderAdminProducts();
  renderTabs();
  renderMenu();
  toast('Product saved');
});

$('#deleteProductBtn').addEventListener('click', () => {
  const id = $('#prodId').value;
  if (!id) return;
  if (!confirm('Delete this product?')) return;
  state.products = state.products.filter(x => x.id !== id);
  delete state.cart[id];
  persist();
  closeModal('#productModal');
  renderAdminProducts();
  renderTabs();
  renderMenu();
  renderCartBar();
  toast('Product deleted');
});

// ------------------------------ ADMIN: SETTINGS
function renderSettingsForm() {
  $('#setAppName').value     = state.settings.appName;
  $('#setWhatsapp').value    = state.settings.whatsapp;
  $('#setViber').value       = state.settings.viber || '';
  $('#setMessenger').value   = state.settings.messenger || '';
  $('#setInstagram').value   = state.settings.instagram || '';
  $('#setDeliveryOn').checked = !!state.settings.deliveryEnabled;
  $('#setDeliveryAmt').value = state.settings.deliveryAmount || 0;
}

$('#settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  state.settings = {
    appName:   $('#setAppName').value.trim() || 'Eleva Drinks',
    whatsapp:  $('#setWhatsapp').value.replace(/\D/g,''),
    viber:     $('#setViber').value.replace(/\D/g,''),
    messenger: $('#setMessenger').value.trim().replace(/^@/, ''),
    instagram: $('#setInstagram').value.trim().replace(/^@/, ''),
    deliveryEnabled: $('#setDeliveryOn').checked,
    deliveryAmount: Number($('#setDeliveryAmt').value) || 0,
  };
  persist();
  applyBranding();
  $('#settingsSavedMsg').hidden = false;
  setTimeout(() => $('#settingsSavedMsg').hidden = true, 1600);
  renderCartBar();
  toast('Settings saved');
});

$('#resetProductsBtn').addEventListener('click', () => {
  if (!confirm('Reset all products to defaults? This cannot be undone.')) return;
  state.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  state.cart = {};
  persist();
  renderAdminProducts();
  renderTabs();
  renderMenu();
  renderCartBar();
  toast('Products reset');
});

function applyBranding() {
  $('#brandName').textContent = state.settings.appName;
  document.title = state.settings.appName + ' 💪';
}

// ------------------------------ ADMIN: SALES (offline)
function populateOfflineSelect() {
  const sel = $('#offlineItemSelect');
  if (!sel) return;
  sel.innerHTML = '';
  state.products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${fmt(discountedPrice(p))})`;
    sel.appendChild(opt);
  });
}

$('#offlineSaleForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('#offlineItemSelect').value;
  const qty = Math.max(1, Number($('#offlineQty').value) || 1);
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const price = discountedPrice(p);
  state.sales.unshift({
    id: uid(),
    productId: id,
    name: p.name,
    qty, price,
    total: price * qty,
    date: new Date().toISOString(),
  });
  state.sales = state.sales.slice(0, 500);
  persist();
  $('#offlineQty').value = 1;
  renderSales();
  toast('Sale logged');
});

function renderSales() {
  const list = $('#salesList');
  list.innerHTML = '';
  // Stats
  let todayTotal = 0, todayItems = 0, allTotal = 0, allItems = 0;
  const today = todayKey();
  state.sales.forEach(s => {
    allTotal += s.total; allItems += s.qty;
    if (s.date.slice(0,10) === today) { todayTotal += s.total; todayItems += s.qty; }
  });
  $('#salesToday').textContent = fmt(todayTotal);
  $('#salesTodayCount').textContent = `${todayItems} item${todayItems===1?'':'s'}`;
  $('#salesAllTime').textContent = fmt(allTotal);
  $('#salesAllCount').textContent = `${allItems} item${allItems===1?'':'s'}`;

  if (state.sales.length === 0) {
    list.innerHTML = `<div class="empty-state">No offline sales logged yet.</div>`;
    return;
  }
  state.sales.slice(0, 50).forEach(s => {
    const row = document.createElement('div');
    row.className = 'sales-row';
    const d = new Date(s.date);
    row.innerHTML = `
      <div class="left">
        <div><strong>${escapeHtml(s.name)}</strong> × ${s.qty}</div>
        <div class="meta">${d.toLocaleString()}</div>
      </div>
      <div class="right">
        <span class="amount">${fmt(s.total)}</span>
        <button class="delete-x" title="Delete">✕</button>
      </div>
    `;
    $('.delete-x', row).onclick = () => {
      if (!confirm('Delete this sale?')) return;
      state.sales = state.sales.filter(x => x.id !== s.id);
      persist(); renderSales();
    };
    list.appendChild(row);
  });
}

// ------------------------------ ADMIN: ORDERS
function renderOrders() {
  const list = $('#ordersList');
  list.innerHTML = '';
  if (state.orders.length === 0) {
    list.innerHTML = `<div class="empty-state">No online orders yet. Customer orders will appear here.</div>`;
    return;
  }
  state.orders.slice(0, 50).forEach(o => {
    const row = document.createElement('div');
    row.className = 'sales-row';
    const d = new Date(o.date);
    const items = o.items.map(i => `${i.name}×${i.qty}`).join(', ');
    row.innerHTML = `
      <div class="left">
        <div><strong>${escapeHtml(items)}</strong></div>
        <div class="meta">${d.toLocaleString()} · via ${escapeHtml(o.channel)}${o.note ? ' · ' + escapeHtml(o.note) : ''}</div>
      </div>
      <div class="right">
        <span class="amount">${fmt(o.total)}</span>
        <button class="delete-x" title="Delete">✕</button>
      </div>
    `;
    $('.delete-x', row).onclick = () => {
      if (!confirm('Delete this order entry?')) return;
      state.orders = state.orders.filter(x => x.id !== o.id);
      persist(); renderOrders();
    };
    list.appendChild(row);
  });
}

// ------------------------------ UTIL
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }

// ------------------------------ INIT
function init() {
  // First-time defaults
  if (!localStorage.getItem(KEYS.products)) {
    saveStore(KEYS.products, DEFAULT_PRODUCTS);
  }
  applyBranding();
  renderTabs();
  renderMenu();
  renderCartBar();
}
init();
