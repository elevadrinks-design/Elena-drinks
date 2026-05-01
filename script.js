* ==========================================================
   ELEVA DRINKS – Vanilla JS Business App
   Pure static · Supabase CDN · Cloudinary CDN
   ========================================================== */

// ------------------------------ SUPABASE CONFIG
const SUPABASE_URL  = 'https://advwqrupribbecgaxsst.supabase.co';
const SUPABASE_ANON = 'sb_publishable_u0exIuE-mWxmdevk2dlrJw_Fo7KtQrt';
let sb = null;
try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  }
} catch (e) { console.warn('Supabase init failed:', e); }

// ------------------------------ CLOUDINARY CONFIG
const CLOUDINARY = { cloudName: 'dszl6lfeu', uploadPreset: 'eleva_upload' };

// ------------------------------ STORAGE KEYS
const KEYS = {
  products:    'eleva_products_v1',
  settings:    'eleva_settings_v1',
  cart:        'eleva_cart_v1',
  sales:       'eleva_offline_sales_v1',
  orders:      'eleva_online_orders_v1',
  expenses:    'eleva_expenses_v1',
  investments: 'eleva_investments_v1',
};

// ------------------------------ DEFAULTS
const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Hello Good Morning', price: 180, category: 'Protein Shakes', desc: 'Banana, oats, whey – the perfect AM fuel', image: '', emoji: '☀️', available: true, discount: 0, bestseller: false, recommended: true },
  { id: 'p2', name: 'Good Life',          price: 170, category: 'Protein Shakes', desc: 'Chocolate whey blend with milk',           image: '', emoji: '🍫', available: true, discount: 0, bestseller: true,  recommended: false },
  { id: 'p3', name: 'Peanut Butter Blast',price: 190, category: 'Protein Shakes', desc: 'PB + banana + whey, thick & creamy',      image: '', emoji: '🥜', available: true, discount: 0, bestseller: false, recommended: false },
  { id: 'p4', name: 'C-Fuel',             price: 180, category: 'Protein Shakes', desc: 'Coffee + whey for pre-workout kick',      image: '', emoji: '☕', available: true, discount: 0, bestseller: false, recommended: false },
  { id: 's1', name: 'Myra Boost',         price: 150, category: 'Summer Drinks',  desc: 'Mixed berry energy refresher',            image: '', emoji: '🫐', available: true, discount: 0, bestseller: false, recommended: false },
  { id: 's2', name: 'Purple Rain',        price: 160, category: 'Summer Drinks',  desc: 'Beetroot, apple & ginger juice',          image: '', emoji: '🍇', available: true, discount: 0, bestseller: true,  recommended: false },
  { id: 's3', name: 'Plain Gane',         price: 100, category: 'Summer Drinks',  desc: 'Fresh sugarcane juice with lemon',        image: '', emoji: '🌿', available: true, discount: 0, bestseller: false, recommended: false },
  { id: 's4', name: 'OG Immunity',        price: 120, category: 'Summer Drinks',  desc: 'Orange, ginger, turmeric shot',           image: '', emoji: '🍊', available: true, discount: 0, bestseller: false, recommended: true  },
  { id: 's5', name: 'Green Mile',         price: 140, category: 'Summer Drinks',  desc: 'Spinach, apple, cucumber, lime',          image: '', emoji: '🥒', available: true, discount: 0, bestseller: false, recommended: false },
  { id: 's6', name: '4Ever Young',        price: 150, category: 'Summer Drinks',  desc: 'Watermelon mint cooler',                  image: '', emoji: '🍉', available: true, discount: 0, bestseller: false, recommended: false },
];

const DEFAULT_SETTINGS = {
  appName:            'Eleva Drinks',
  whatsapp:           '9779706094655',
  viber:              '9779706094655',
  messenger:          '',
  instagram:          '',
  deliveryEnabled:    false,
  deliveryAmount:     0,
  adminPassword:      'eleva123drinks',
  autoLogoutMinutes:  10,
};

// ------------------------------ STATE
function loadStore(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

let state = {
  products:    loadStore(KEYS.products,    DEFAULT_PRODUCTS),
  settings:    { ...DEFAULT_SETTINGS, ...loadStore(KEYS.settings,    {}) },
  cart:        loadStore(KEYS.cart,        {}),
  sales:       loadStore(KEYS.sales,       []),
  orders:      loadStore(KEYS.orders,      []),
  expenses:    loadStore(KEYS.expenses,    []),
  investments: loadStore(KEYS.investments, []),
  activeCategory: 'all',
};

function persist() {
  saveStore(KEYS.products,    state.products);
  saveStore(KEYS.settings,    state.settings);
  saveStore(KEYS.cart,        state.cart);
  saveStore(KEYS.sales,       state.sales);
  saveStore(KEYS.orders,      state.orders);
  saveStore(KEYS.expenses,    state.expenses);
  saveStore(KEYS.investments, state.investments);
}

// ------------------------------ HELPERS
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmt  = n => 'Rs. ' + Number(n).toLocaleString('en-IN');
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const todayISO  = () => new Date().toISOString().slice(0,10);
const fmtDate   = iso => new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const fmtDT     = iso => new Date(iso).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

function discountedPrice(p) {
  if (!p.discount || p.discount <= 0) return p.price;
  return Math.round(p.price * (100 - p.discount) / 100);
}

function toast(msg, dur=2000) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, dur);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g,'&#96;'); }

// ------------------------------ SUPABASE HELPERS
function productToRow(p) {
  return { id:p.id, name:p.name, price:Number(p.price)||0, category:p.category||'',
    description:p.desc||'', image:p.image||'', emoji:p.emoji||'🥤',
    available:p.available!==false, discount:Number(p.discount)||0 };
}
function productFromRow(r) {
  return { id:r.id, name:r.name, price:Number(r.price)||0, category:r.category||'',
    desc:r.description||'', image:r.image||'', emoji:r.emoji||'🥤',
    available:r.available!==false, discount:Number(r.discount)||0,
    bestseller: r.bestseller||false, recommended: r.recommended||false };
}
async function loadProductsRemote() {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('products').select('*').order('category').order('name');
    if (error) throw error;
    return Array.isArray(data) ? data.map(productFromRow) : null;
  } catch (e) { console.warn('Supabase load failed:', e.message); return null; }
}
async function upsertProductRemote(p) {
  if (!sb) return { ok:false };
  try { const { error } = await sb.from('products').upsert(productToRow(p), { onConflict:'id' }); if (error) throw error; return { ok:true }; }
  catch (e) { console.warn('Supabase upsert failed:', e.message); return { ok:false }; }
}
async function deleteProductRemote(id) {
  if (!sb) return { ok:false };
  try { const { error } = await sb.from('products').delete().eq('id', id); if (error) throw error; return { ok:true }; }
  catch (e) { console.warn('Supabase delete failed:', e.message); return { ok:false }; }
}

// ------------------------------ CLOUDINARY UPLOAD
async function uploadImageCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method:'POST', body:fd });
  if (!res.ok) throw new Error('Cloudinary ' + res.status);
  const j = await res.json();
  return j.secure_url || j.url || null;
}

// ==========================================================
//   CUSTOMER: MENU
// ==========================================================
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
      renderTabs(); renderMenu();
      window.scrollTo({ top:0, behavior:'smooth' });
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
  const byCat = {};
  visible.forEach(p => { (byCat[p.category] = byCat[p.category]||[]).push(p); });
  if (!Object.keys(byCat).length) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(state.activeCategory==='all'?'No products yet.':'No products in "'+state.activeCategory+'".')}</div>`;
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
  const inCart = state.cart[p.id] || 0;
  card.innerHTML = `
    <div class="product-image">
      ${p.image
        ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji-fallback',textContent:'${escapeAttr(p.emoji||'🥤')}'}))">`
        : `<span class="emoji-fallback">${escapeHtml(p.emoji||'🥤')}</span>`}
      ${p.discount>0 ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
      ${!p.available ? `<span class="soldout-badge">Sold Out</span>` : ''}
      ${p.bestseller ? `<span class="bestseller-badge">🏆</span>` : ''}
      ${p.recommended ? `<span class="recommended-badge">⭐</span>` : ''}
    </div>
    <div class="product-body">
      <div class="product-name">${escapeHtml(p.name)}</div>
      <div class="product-desc">${escapeHtml(p.desc||'')}</div>
      <div class="price-row">
        <span class="price-now">${fmt(final)}</span>
        ${p.discount>0 ? `<span class="price-old">${fmt(p.price)}</span>` : ''}
      </div>
      <div class="product-actions"></div>
    </div>`;
  const actions = $('.product-actions', card);
  if (!p.available) {
    actions.innerHTML = `<div class="soldout-text">Unavailable</div>`;
  } else if (inCart > 0) {
    const ctrl = document.createElement('div');
    ctrl.className = 'qty-controls';
    ctrl.innerHTML = `<button class="qty-btn" data-act="dec">−</button><span class="qty-num">${inCart}</span><button class="qty-btn" data-act="inc">+</button>`;
    $('[data-act=dec]',ctrl).onclick = () => updateQty(p.id,-1);
    $('[data-act=inc]',ctrl).onclick = () => updateQty(p.id,+1);
    actions.appendChild(ctrl);
  } else {
    const btn = document.createElement('button');
    btn.className = 'add-btn'; btn.textContent = '+ Add to Cart';
    btn.onclick = () => updateQty(p.id,+1);
    actions.appendChild(btn);
  }
  return card;
}

// ------------------------------ CART
function updateQty(productId, delta) {
  const cur = state.cart[productId]||0;
  const next = Math.max(0, cur+delta);
  if (next===0) delete state.cart[productId]; else state.cart[productId]=next;
  persist(); renderMenu(); renderCartBar();
  if (!$('#cartModal').hidden) renderCartModal();
}
function cartLines() {
  return Object.keys(state.cart).map(id => {
    const p = state.products.find(x=>x.id===id); if (!p) return null;
    const qty=state.cart[id], price=discountedPrice(p);
    return { product:p, qty, price, total:price*qty };
  }).filter(Boolean);
}
function cartTotals() {
  const lines = cartLines();
  const itemCount = lines.reduce((s,l)=>s+l.qty,0);
  const subtotal  = lines.reduce((s,l)=>s+l.total,0);
  const delivery  = (state.settings.deliveryEnabled&&itemCount>0) ? Number(state.settings.deliveryAmount||0) : 0;
  return { lines, itemCount, subtotal, delivery, total:subtotal+delivery };
}
function renderCartBar() {
  const bar = $('#cartBar');
  const { itemCount, total } = cartTotals();
  if (itemCount===0) { bar.hidden=true; return; }
  bar.hidden = false;
  $('#cartCount').textContent = itemCount;
  $('#cartTotal').textContent = fmt(total);
}
function renderCartModal() {
  const wrap = $('#cartItems'), sum = $('#cartSummary');
  const { lines, itemCount, subtotal, delivery, total } = cartTotals();
  wrap.innerHTML = '';
  if (!lines.length) {
    wrap.innerHTML = `<div class="empty-cart"><div class="empty-cart-icon">🛒</div><div>Your cart is empty</div></div>`;
    sum.innerHTML = ''; return;
  }
  lines.forEach(line => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-thumb">${line.product.image
        ? `<img src="${escapeAttr(line.product.image)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${escapeAttr(line.product.emoji||'🥤')}'}))">`
        : escapeHtml(line.product.emoji||'🥤')}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(line.product.name)}</div>
        <div class="cart-item-price">${fmt(line.price)} × ${line.qty} = ${fmt(line.total)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-item-qty" data-act="dec">−</button>
        <span class="cart-item-num">${line.qty}</span>
        <button class="cart-item-qty" data-act="inc">+</button>
      </div>`;
    $('[data-act=dec]',row).onclick = () => updateQty(line.product.id,-1);
    $('[data-act=inc]',row).onclick = () => updateQty(line.product.id,+1);
    wrap.appendChild(row);
  });
  sum.innerHTML = `
    <div class="summary-row"><span class="summary-label">Items</span><span>${itemCount}</span></div>
    <div class="summary-row"><span class="summary-label">Subtotal</span><span>${fmt(subtotal)}</span></div>
    ${delivery>0?`<div class="summary-row"><span class="summary-label">Delivery</span><span>${fmt(delivery)}</span></div>`:''}
    <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>`;
}

// ------------------------------ ORDER / CHECKOUT
function buildOrderMessage() {
  const { lines, subtotal, delivery, total } = cartTotals();
  const note = $('#orderNote').value.trim();
  let msg = `Hi ${state.settings.appName}, I want to order:\n\n`;
  lines.forEach(l => { msg += `• ${l.product.name} x ${l.qty} = ${fmt(l.total)}\n`; });
  msg += `\nSubtotal: ${fmt(subtotal)}`;
  if (delivery>0) msg += `\nDelivery: ${fmt(delivery)}`;
  msg += `\nTotal: ${fmt(total)}\n`;
  if (note) msg += `\nNote: ${note}`;
  msg += `\nPickup: Now`;
  return msg;
}
function logOnlineOrder(channel) {
  const { lines, total } = cartTotals();
  const note = $('#orderNote').value.trim();
  state.orders.unshift({ id:uid(), channel, note, total,
    items:lines.map(l=>({ name:l.product.name, qty:l.qty, price:l.price, total:l.total })),
    date:new Date().toISOString() });
  state.orders = state.orders.slice(0,200);
  persist();
}
function checkoutVia(channel) {
  if (!cartLines().length) { toast('Cart is empty'); return; }
  const text = encodeURIComponent(buildOrderMessage());
  const wa=state.settings.whatsapp, vb=state.settings.viber, ms=state.settings.messenger, ig=state.settings.instagram;
  let url = '';
  if (channel==='whatsapp')  { if (!wa) { toast('WhatsApp number not set'); return; } url=`https://wa.me/${wa}?text=${text}`; }
  else if (channel==='viber')     { const n=vb||wa; if (!n) { toast('Viber number not set'); return; } url=`viber://chat?number=%2B${n}&text=${text}`; }
  else if (channel==='messenger') { if (!ms) { toast('Messenger username not set'); return; } url=`https://m.me/${ms}`; }
  else if (channel==='instagram') { if (!ig) { toast('Instagram username not set'); return; } url=`https://ig.me/m/${ig}`; }
  logOnlineOrder(channel);
  window.open(url,'_blank');
  state.cart={}; $('#orderNote').value='';
  persist(); closeAllModals(); renderMenu(); renderCartBar();
  toast('Order sent! 💪');
}

// ------------------------------ MODALS
function openModal(id) { $(id).hidden=false; document.body.style.overflow='hidden'; }
function closeModal(id) { $(id).hidden=true; document.body.style.overflow=''; }
function closeAllModals() {
  ['#cartModal','#checkoutModal','#adminLoginModal','#productModal','#confirmOrderModal','#expenseModal','#investmentModal'].forEach(closeModal);
}
document.addEventListener('click', e => {
  if (e.target.matches('[data-close]')) { const m=e.target.closest('.modal'); if (m) closeModal('#'+m.id); }
});
$('#openCartBtn').addEventListener('click', () => { renderCartModal(); openModal('#cartModal'); });
$('#checkoutWhatsappBtn').addEventListener('click', () => { if (!cartLines().length) { toast('Cart is empty'); return; } openConfirmOrder('whatsapp'); });
$('#moreOptionsBtn').addEventListener('click', () => { if (!cartLines().length) { toast('Cart is empty'); return; } closeModal('#cartModal'); openModal('#checkoutModal'); });
$$('#checkoutModal .channel-btn').forEach(btn => btn.addEventListener('click', () => openConfirmOrder(btn.dataset.channel)));

// ------------------------------ CONFIRM / CANCEL ORDER
let pendingChannel = null;
const CHANNEL_LABEL = { whatsapp:'WhatsApp', viber:'Viber', messenger:'Messenger', instagram:'Instagram' };
function openConfirmOrder(channel) {
  if (!cartLines().length) { toast('Cart is empty'); return; }
  pendingChannel = channel;
  const { lines, total } = cartTotals();
  $('#confirmOrderSummary').innerHTML =
    lines.map(l=>`<div class="confirm-line"><span>${escapeHtml(l.product.name)} × ${l.qty}</span><span>${fmt(l.total)}</span></div>`).join('') +
    `<div class="confirm-line confirm-total"><span>Total</span><span>${fmt(total)}</span></div>`;
  $('#confirmChannelName').textContent = CHANNEL_LABEL[channel]||'messaging app';
  closeModal('#cartModal'); closeModal('#checkoutModal');
  openModal('#confirmOrderModal');
}
$('#confirmOrderBtn').addEventListener('click', () => { const ch=pendingChannel; pendingChannel=null; closeModal('#confirmOrderModal'); if (ch) checkoutVia(ch); });
$('#cancelOrderBtn').addEventListener('click', () => {
  pendingChannel=null; state.cart={};
  const n=$('#orderNote'); if (n) n.value='';
  persist(); closeAllModals(); renderMenu(); renderCartBar(); toast('Order cancelled');
});

// ==========================================================
//   ADMIN: LOGIN + ENTRY
// ==========================================================
let pressTimer = null;
$('#brandLogo').addEventListener('pointerdown', () => { pressTimer=setTimeout(openAdminLogin,700); });
['pointerup','pointerleave','pointercancel'].forEach(ev => $('#brandLogo').addEventListener(ev, () => clearTimeout(pressTimer)));
$('#hiddenAdminBtn').addEventListener('click', openAdminLogin);

function openAdminLogin() {
  $('#adminLoginError').hidden=true; $('#adminUser').value=''; $('#adminPass').value='';
  openModal('#adminLoginModal');
}
$('#adminLoginForm').addEventListener('submit', e => {
  e.preventDefault();
  const u=$('#adminUser').value.trim(), p=$('#adminPass').value;
  const correctPwd = state.settings.adminPassword || DEFAULT_SETTINGS.adminPassword;
  if (u==='eleva1' && p===correctPwd) {
    closeModal('#adminLoginModal'); openAdmin();
  } else { $('#adminLoginError').hidden=false; }
});

// ------------------------------ AUTO-LOGOUT
let inactivityTimer = null;
function resetInactivity() {
  if ($('#adminScreen').hidden) return;
  clearTimeout(inactivityTimer);
  const mins = Number(state.settings.autoLogoutMinutes) || 10;
  inactivityTimer = setTimeout(() => { closeAdmin(); toast('Auto-logged out due to inactivity'); }, mins * 60 * 1000);
}
['click','touchstart','keydown','mousemove'].forEach(ev => document.addEventListener(ev, resetInactivity, { passive:true }));

// ------------------------------ SIDEBAR NAVIGATION
let currentSection = 'overview';
const SECTION_LABELS = {
  overview:'Overview', pos:'Take Order', orders:'Orders', products:'Products',
  expenses:'Expenses', investment:'Investment', analytics:'Analytics', settings:'Settings'
};

function switchAdminSection(name) {
  currentSection = name;
  $$('.adm-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section===name));
  $$('.adm-panel').forEach(p => p.hidden = p.dataset.panel!==name);
  $('#admTopbarTitle').textContent = SECTION_LABELS[name]||name;
  // Close sidebar on mobile after navigation
  closeSidebar();
  // Render the relevant section
  if (name==='overview')   renderOverview();
  if (name==='pos')        renderPOS();
  if (name==='orders')     renderOrdersPanel('online');
  if (name==='products')   renderAdminProducts();
  if (name==='expenses')   renderExpenses();
  if (name==='investment') renderInvestments();
  if (name==='analytics')  renderAnalytics();
  if (name==='settings')   renderSettingsForm();
}

$$('.adm-nav-btn').forEach(btn => btn.addEventListener('click', () => switchAdminSection(btn.dataset.section)));

// Mobile sidebar toggle
function openSidebar()  { $('#admSidebar').classList.add('open'); $('#admOverlay').classList.add('show'); }
function closeSidebar() { $('#admSidebar').classList.remove('open'); $('#admOverlay').classList.remove('show'); }
$('#admHamburger').addEventListener('click', openSidebar);
$('#admOverlay').addEventListener('click', closeSidebar);

// overview "view all" buttons
document.addEventListener('click', e => {
  const goto = e.target.dataset.goto;
  if (goto) switchAdminSection(goto);
});

function openAdmin() {
  $('#adminScreen').hidden=false;
  document.body.style.overflow='hidden';
  switchAdminSection('overview');
  resetInactivity();
}
function closeAdmin() {
  $('#adminScreen').hidden=true;
  document.body.style.overflow='';
  clearTimeout(inactivityTimer);
}
$('#adminLogoutBtn').addEventListener('click', closeAdmin);
$('#adminLogoutBtn2').addEventListener('click', closeAdmin);

// ==========================================================
//   ADMIN: OVERVIEW
// ==========================================================
function calcPnL() {
  const today = todayISO();
  const weekAgo = new Date(Date.now()-7*86400000).toISOString().slice(0,10);
  const monthStart = new Date().toISOString().slice(0,7) + '-01';

  let revToday=0, revWeek=0, revMonth=0, revAll=0;
  let expToday=0, expWeek=0, expMonth=0, expAll=0;
  let orderCountToday=0, orderCountMonth=0;

  // Revenue from sales (POS + offline)
  state.sales.forEach(s => {
    const d = s.date.slice(0,10);
    revAll += s.total;
    if (d===today)         { revToday+=s.total; orderCountToday++; }
    if (d>=weekAgo)         revWeek +=s.total;
    if (d>=monthStart)     { revMonth+=s.total; orderCountMonth++; }
  });
  // Revenue from online orders
  state.orders.forEach(o => {
    const d = o.date.slice(0,10);
    revAll += o.total;
    if (d===today)         { revToday+=o.total; orderCountToday++; }
    if (d>=weekAgo)         revWeek +=o.total;
    if (d>=monthStart)     { revMonth+=o.total; orderCountMonth++; }
  });
  // Expenses
  state.expenses.forEach(ex => {
    const d = ex.date;
    expAll += ex.amount;
    if (d===today)     expToday+=ex.amount;
    if (d>=weekAgo)    expWeek +=ex.amount;
    if (d>=monthStart) expMonth+=ex.amount;
  });

  return {
    revToday, revWeek, revMonth, revAll,
    expToday, expWeek, expMonth, expAll,
    profitToday:  revToday-expToday,
    profitWeek:   revWeek-expWeek,
    profitMonth:  revMonth-expMonth,
    profitAll:    revAll-expAll,
    orderCountToday, orderCountMonth
  };
}

function renderOverview() {
  const now = new Date();
  $('#overviewDate').textContent = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const pl = calcPnL();

  // KPI cards
  $('#kpiGrid').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Today Revenue</div>
      <div class="kpi-value accent">${fmt(pl.revToday)}</div>
      <div class="kpi-sub">${pl.orderCountToday} orders</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Today Expenses</div>
      <div class="kpi-value danger">${fmt(pl.expToday)}</div>
      <div class="kpi-sub">logged today</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Today Profit</div>
      <div class="kpi-value ${pl.profitToday>=0?'accent':'danger'}">${fmt(pl.profitToday)}</div>
      <div class="kpi-sub">net</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">This Month</div>
      <div class="kpi-value">${fmt(pl.revMonth)}</div>
      <div class="kpi-sub">${pl.orderCountMonth} orders</div>
    </div>`;

  // P&L row
  $('#pnlRow').innerHTML = `
    <div class="pnl-card green">
      <div class="pnl-period">This Week</div>
      <div class="pnl-amounts">
        <div><span class="pnl-lbl">Revenue</span><span class="pnl-val">${fmt(pl.revWeek)}</span></div>
        <div><span class="pnl-lbl">Expenses</span><span class="pnl-val">${fmt(pl.expWeek)}</span></div>
        <div class="pnl-profit ${pl.profitWeek>=0?'pos':'neg'}"><span>Profit</span><span>${fmt(pl.profitWeek)}</span></div>
      </div>
    </div>
    <div class="pnl-card">
      <div class="pnl-period">Lifetime</div>
      <div class="pnl-amounts">
        <div><span class="pnl-lbl">Revenue</span><span class="pnl-val">${fmt(pl.revAll)}</span></div>
        <div><span class="pnl-lbl">Expenses</span><span class="pnl-val">${fmt(pl.expAll)}</span></div>
        <div class="pnl-profit ${pl.profitAll>=0?'pos':'neg'}"><span>Profit</span><span>${fmt(pl.profitAll)}</span></div>
      </div>
    </div>`;

  // Recent orders (last 5)
  const recent = [...state.orders, ...state.sales]
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0,5);
  if (!recent.length) {
    $('#recentOrdersList').innerHTML = `<div class="empty-state">No orders yet.</div>`;
  } else {
    $('#recentOrdersList').innerHTML = recent.map(o => {
      const isSale = !!o.productId || !!o.name;
      const label = isSale ? `${escapeHtml(o.name||'Sale')} ×${o.qty}` : (o.items||[]).map(i=>`${i.name}×${i.qty}`).join(', ');
      return `<div class="recent-row">
        <div class="recent-info"><div class="recent-label">${label}</div><div class="recent-meta">${fmtDT(o.date)} · ${isSale?(o.paymentMethod||'in-store'):(o.channel||'online')}</div></div>
        <div class="recent-amt">${fmt(o.total)}</div></div>`;
    }).join('');
  }

  // Top sellers
  const tally = {};
  state.sales.forEach(s => { tally[s.name]=(tally[s.name]||0)+s.qty; });
  state.orders.forEach(o => (o.items||[]).forEach(i => { tally[i.name]=(tally[i.name]||0)+i.qty; }));
  const sorted = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxQty = sorted[0]?.[1] || 1;
  if (!sorted.length) {
    $('#topSellersOverview').innerHTML = `<div class="empty-state">No sales data yet.</div>`;
  } else {
    $('#topSellersOverview').innerHTML = sorted.map(([name,qty],i) => `
      <div class="top-row">
        <div class="top-rank">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]||''}</div>
        <div class="top-info"><div class="top-name">${escapeHtml(name)}</div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(qty/maxQty*100)}%"></div></div></div>
        <div class="top-qty">${qty}</div>
      </div>`).join('');
  }
}

// ==========================================================
//   ADMIN: POS (TAKE ORDER)
// ==========================================================
let posCart = {};
function renderPOS() {
  posCart = {};
  updatePOSReceipt();
  const grid = $('#posProductGrid');
  grid.innerHTML = '';
  const available = state.products.filter(p=>p.available);
  if (!available.length) {
    grid.innerHTML = `<div class="empty-state">No available products.</div>`;
    return;
  }
  available.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pos-card';
    card.id = 'pos-card-' + p.id;
    card.innerHTML = `
      <div class="pos-card-img">${p.image?`<img src="${escapeAttr(p.image)}" alt="" onerror="this.style.display='none'">`:`<span>${escapeHtml(p.emoji||'🥤')}</span>`}</div>
      <div class="pos-card-name">${escapeHtml(p.name)}</div>
      <div class="pos-card-price">${fmt(discountedPrice(p))}</div>
      <div class="pos-card-ctrl" id="pos-ctrl-${p.id}"></div>`;
    grid.appendChild(card);
    renderPOSCardCtrl(p);
  });
}
function renderPOSCardCtrl(p) {
  const ctrl = $(`#pos-ctrl-${p.id}`);
  if (!ctrl) return;
  const qty = posCart[p.id] || 0;
  if (qty === 0) {
    ctrl.innerHTML = `<button class="pos-add-btn" onclick="posAdd('${p.id}')">+ Add</button>`;
  } else {
    ctrl.innerHTML = `
      <div class="pos-qty-row">
        <button class="pos-qty-btn" onclick="posDec('${p.id}')">−</button>
        <span class="pos-qty-num">${qty}</span>
        <button class="pos-qty-btn" onclick="posInc('${p.id}')">+</button>
      </div>`;
  }
}
window.posAdd = function(id) { posCart[id]=(posCart[id]||0)+1; const p=state.products.find(x=>x.id===id); if(p) renderPOSCardCtrl(p); updatePOSReceipt(); };
window.posInc = function(id) { posCart[id]=(posCart[id]||0)+1; const p=state.products.find(x=>x.id===id); if(p) renderPOSCardCtrl(p); updatePOSReceipt(); };
window.posDec = function(id) { posCart[id]=Math.max(0,(posCart[id]||0)-1); if(!posCart[id]) delete posCart[id]; const p=state.products.find(x=>x.id===id); if(p) renderPOSCardCtrl(p); updatePOSReceipt(); };

function updatePOSReceipt() {
  const lines = Object.keys(posCart).map(id => {
    const p=state.products.find(x=>x.id===id); if(!p) return null;
    const qty=posCart[id], price=discountedPrice(p);
    return { p, qty, price, total:price*qty };
  }).filter(Boolean);
  const total = lines.reduce((s,l)=>s+l.total,0);
  const receipt = $('#posReceipt');
  receipt.hidden = !lines.length;
  if (!lines.length) return;
  $('#posReceiptItems').innerHTML = lines.map(l=>
    `<div class="pos-ri"><span>${escapeHtml(l.p.name)} × ${l.qty}</span><span>${fmt(l.total)}</span></div>`
  ).join('');
  $('#posReceiptTotal').innerHTML = `<div class="pos-ri total-ri"><span>Total</span><span>${fmt(total)}</span></div>`;
}

$('#posClearBtn').addEventListener('click', () => { posCart={}; renderPOS(); });

$('#posConfirmBtn').addEventListener('click', () => {
  const lines = Object.keys(posCart).map(id => {
    const p=state.products.find(x=>x.id===id); if(!p) return null;
    const qty=posCart[id], price=discountedPrice(p);
    return { p, qty, price, total:price*qty };
  }).filter(Boolean);
  if (!lines.length) { toast('No items selected'); return; }
  const customer  = $('#posCustomerName').value.trim();
  const orderType = $('#posOrderType').value;
  const payment   = $('#posPayment').value;
  const total     = lines.reduce((s,l)=>s+l.total,0);
  lines.forEach(l => {
    state.sales.unshift({
      id:uid(), productId:l.p.id, name:l.p.name, qty:l.qty,
      price:l.price, total:l.total, date:new Date().toISOString(),
      type:'pos', customerName:customer, paymentMethod:payment, orderType
    });
  });
  state.sales = state.sales.slice(0,500);
  persist();
  const totalStr = fmt(total);
  posCart = {};
  renderPOS();
  toast(`✅ Sale logged! ${totalStr}`);
});

// ==========================================================
//   ADMIN: ORDERS PANEL
// ==========================================================
let currentOrdersSub = 'online';
function renderOrdersPanel(sub) {
  currentOrdersSub = sub || currentOrdersSub;
  $$('#ordersSubTabs .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.sub===currentOrdersSub));
  const el = $('#ordersTabContent');
  el.innerHTML = '';
  if (currentOrdersSub==='online') {
    if (!state.orders.length) { el.innerHTML=`<div class="empty-state">No online orders yet.</div>`; return; }
    state.orders.slice(0,80).forEach(o => {
      const row = document.createElement('div');
      row.className = 'adm-row';
      const items = (o.items||[]).map(i=>`${i.name}×${i.qty}`).join(', ');
      row.innerHTML = `
        <div class="adm-row-left">
          <div class="adm-row-title">${escapeHtml(items)}</div>
          <div class="adm-row-meta">${fmtDT(o.date)} · via ${escapeHtml(o.channel)}${o.note?` · "${escapeHtml(o.note)}"`:''}${o.customerName?` · ${escapeHtml(o.customerName)}`:''}</div>
        </div>
        <div class="adm-row-right">
          <span class="adm-amt">${fmt(o.total)}</span>
          <button class="delete-x" title="Delete">✕</button>
        </div>`;
      $('.delete-x',row).onclick = () => { if(!confirm('Delete this order?')) return; state.orders=state.orders.filter(x=>x.id!==o.id); persist(); renderOrdersPanel(); };
      el.appendChild(row);
    });
  } else {
    if (!state.sales.length) { el.innerHTML=`<div class="empty-state">No in-store sales yet.</div>`; return; }
    // Stats
    const today=todayISO();
    let todayTotal=0,todayItems=0,allTotal=0,allItems=0;
    state.sales.forEach(s=>{ allTotal+=s.total; allItems+=s.qty; if(s.date.slice(0,10)===today){todayTotal+=s.total;todayItems+=s.qty;} });
    const statsEl = document.createElement('div');
    statsEl.className = 'sales-summary';
    statsEl.innerHTML = `
      <div class="stat-card"><span class="stat-label">Today</span><span class="stat-value">${fmt(todayTotal)}</span><span class="stat-sub">${todayItems} items</span></div>
      <div class="stat-card"><span class="stat-label">All-Time</span><span class="stat-value">${fmt(allTotal)}</span><span class="stat-sub">${allItems} items</span></div>`;
    el.appendChild(statsEl);

    // Quick log form
    const form = document.createElement('div');
    form.className = 'quick-log-form';
    form.innerHTML = `
      <form id="quickSaleForm" class="admin-form inline" style="margin-bottom:12px">
        <label class="grow">Product<select id="quickSaleProduct"></select></label>
        <label>Qty<input type="number" id="quickSaleQty" min="1" value="1" style="width:70px"></label>
        <button type="submit" class="btn btn-primary small">+ Log</button>
      </form>`;
    el.appendChild(form);
    // populate select
    const sel = $('#quickSaleProduct');
    state.products.forEach(p => { const o2=document.createElement('option'); o2.value=p.id; o2.textContent=`${p.name} (${fmt(discountedPrice(p))})`; sel.appendChild(o2); });
    $('#quickSaleForm').addEventListener('submit', ev => {
      ev.preventDefault();
      const id=$('#quickSaleProduct').value;
      const qty=Math.max(1,Number($('#quickSaleQty').value)||1);
      const p=state.products.find(x=>x.id===id); if(!p) return;
      const price=discountedPrice(p);
      state.sales.unshift({ id:uid(), productId:id, name:p.name, qty, price, total:price*qty, date:new Date().toISOString() });
      state.sales=state.sales.slice(0,500);
      persist(); renderOrdersPanel('instore'); toast('Sale logged');
    });

    state.sales.slice(0,80).forEach(s => {
      const row = document.createElement('div');
      row.className = 'adm-row';
      row.innerHTML = `
        <div class="adm-row-left">
          <div class="adm-row-title">${escapeHtml(s.name)} × ${s.qty}${s.customerName?` · <em>${escapeHtml(s.customerName)}</em>`:''}</div>
          <div class="adm-row-meta">${fmtDT(s.date)}${s.paymentMethod?` · ${s.paymentMethod}`:''}${s.orderType?` · ${s.orderType}`:''}</div>
        </div>
        <div class="adm-row-right">
          <span class="adm-amt">${fmt(s.total)}</span>
          <button class="delete-x" title="Delete">✕</button>
        </div>`;
      $('.delete-x',row).onclick = () => { if(!confirm('Delete this sale?')) return; state.sales=state.sales.filter(x=>x.id!==s.id); persist(); renderOrdersPanel('instore'); };
      el.appendChild(row);
    });
  }
}
$('#ordersSubTabs').addEventListener('click', e => {
  const sub = e.target.dataset.sub;
  if (sub) renderOrdersPanel(sub);
});

// ==========================================================
//   ADMIN: PRODUCTS
// ==========================================================
function renderAdminProducts() {
  const list = $('#adminProductList');
  list.innerHTML = '';
  if (!state.products.length) { list.innerHTML=`<div class="empty-state">No products. Add one →</div>`; return; }
  state.products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'admin-product-row';
    const final = discountedPrice(p);
    row.innerHTML = `
      <div class="thumb">${p.image?`<img src="${escapeAttr(p.image)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${escapeAttr(p.emoji||'🥤')}'}))">`:escapeHtml(p.emoji||'🥤')}</div>
      <div class="info">
        <div class="name">${escapeHtml(p.name)}${p.bestseller?' <span class="badge-mini">🏆</span>':''}${p.recommended?' <span class="badge-mini">⭐</span>':''}</div>
        <div class="meta">
          <span class="pill ${p.available?'live':'off'}">${p.available?'Live':'Sold Out'}</span>
          ${escapeHtml(p.category)} · ${fmt(final)}${p.discount?` <s style="opacity:.5">${fmt(p.price)}</s> -${p.discount}%`:''}
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-ghost small" data-act="edit">Edit</button>
        <button class="btn btn-ghost small" data-act="toggle">${p.available?'Sold Out':'Set Live'}</button>
      </div>`;
    $('[data-act=edit]',row).onclick = () => openProductForm(p.id);
    $('[data-act=toggle]',row).onclick = async () => {
      p.available=!p.available; persist(); renderAdminProducts(); renderMenu();
      const r=await upsertProductRemote(p); if(!r.ok&&sb) toast('Toggle saved locally — sync failed');
    };
    list.appendChild(row);
  });
}

$('#addProductBtn').addEventListener('click', () => openProductForm(null));

function openProductForm(productId) {
  const p = productId ? state.products.find(x=>x.id===productId) : null;
  $('#productModalTitle').textContent = p ? 'Edit Product' : 'Add Product';
  $('#prodId').value       = p?.id || '';
  $('#prodName').value     = p?.name || '';
  $('#prodPrice').value    = p?.price ?? '';
  $('#prodDiscount').value = p?.discount || 0;
  $('#prodCategory').value = p?.category || 'Protein Shakes';
  $('#prodDesc').value     = p?.desc || '';
  $('#prodImage').value    = p?.image || '';
  $('#prodImageFile').value= '';
  $('#prodEmoji').value    = p?.emoji || '🥤';
  $('#prodAvailable').checked   = p ? p.available : true;
  $('#prodBestseller').checked  = p?.bestseller  || false;
  $('#prodRecommended').checked = p?.recommended || false;
  $('#deleteProductBtn').style.display = p ? '' : 'none';
  updateImagePreview(p?.image||'');
  openModal('#productModal');
}
function updateImagePreview(src) {
  const wrap=$('#prodImagePreview'), img=$('#prodImagePreviewImg');
  if (src) { img.src=src; wrap.hidden=false; } else { img.removeAttribute('src'); wrap.hidden=true; }
}
$('#prodImageFile').addEventListener('change', async e => {
  const file=e.target.files?.[0]; if(!file) return;
  if (!file.type.startsWith('image/')) { toast('Select an image file'); return; }
  if (file.size>8*1024*1024) { toast('Image too large (max 8MB)'); return; }
  toast('Uploading…');
  try {
    const url=await uploadImageCloudinary(file); if(!url) throw new Error('No URL');
    $('#prodImage').value=url; updateImagePreview(url); toast('Image uploaded ✅');
  } catch {
    toast('Cloud upload failed, saving locally');
    const reader=new FileReader();
    reader.onload=() => { $('#prodImage').value=reader.result; updateImagePreview(reader.result); };
    reader.readAsDataURL(file);
  }
});
$('#prodImage').addEventListener('input', e => updateImagePreview(e.target.value.trim()));
$('#prodImageClearBtn').addEventListener('click', () => { $('#prodImage').value=''; $('#prodImageFile').value=''; updateImagePreview(''); });

$('#productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    id: $('#prodId').value || uid(),
    name: $('#prodName').value.trim(),
    price: Number($('#prodPrice').value),
    discount: Math.min(100,Math.max(0,Number($('#prodDiscount').value)||0)),
    category: $('#prodCategory').value,
    desc: $('#prodDesc').value.trim(),
    image: $('#prodImage').value.trim(),
    emoji: $('#prodEmoji').value.trim()||'🥤',
    available: $('#prodAvailable').checked,
    bestseller:  $('#prodBestseller').checked,
    recommended: $('#prodRecommended').checked,
  };
  if (!data.name||!data.price) { toast('Name and price required'); return; }
  const idx=state.products.findIndex(x=>x.id===data.id);
  if (idx>=0) state.products[idx]=data; else state.products.push(data);
  persist(); closeModal('#productModal'); renderAdminProducts(); renderTabs(); renderMenu(); toast('Product saved');
  const r=await upsertProductRemote(data); if(!r.ok&&sb) toast('Saved locally — sync failed');
});

$('#deleteProductBtn').addEventListener('click', async () => {
  const id=$('#prodId').value; if(!id) return;
  if(!confirm('Delete this product?')) return;
  state.products=state.products.filter(x=>x.id!==id); delete state.cart[id];
  persist(); closeModal('#productModal'); renderAdminProducts(); renderTabs(); renderMenu(); renderCartBar(); toast('Product deleted');
  const r=await deleteProductRemote(id); if(!r.ok&&sb) toast('Deleted locally — sync failed');
});

// ==========================================================
//   ADMIN: EXPENSES
// ==========================================================
function renderExpenses() {
  const filterDate = $('#expFilterDate').value;
  const filterCat  = $('#expFilterCat').value;

  let list = state.expenses.slice().sort((a,b)=>b.date.localeCompare(a.date));
  if (filterDate) list = list.filter(e=>e.date===filterDate);
  if (filterCat)  list = list.filter(e=>e.category===filterCat);

  // Stats
  const today = todayISO();
  const monthStart = new Date().toISOString().slice(0,7) + '-01';
  let todayExp=0, monthExp=0, allExp=0;
  state.expenses.forEach(e => {
    allExp += e.amount;
    if (e.date===today)     todayExp+=e.amount;
    if (e.date>=monthStart) monthExp+=e.amount;
  });
  $('#expenseStats').innerHTML = `
    <div class="exp-stat-grid">
      <div class="stat-card"><span class="stat-label">Today</span><span class="stat-value danger">${fmt(todayExp)}</span></div>
      <div class="stat-card"><span class="stat-label">This Month</span><span class="stat-value danger">${fmt(monthExp)}</span></div>
      <div class="stat-card"><span class="stat-label">All Time</span><span class="stat-value danger">${fmt(allExp)}</span></div>
    </div>`;

  const el = $('#expenseList');
  el.innerHTML = '';
  if (!list.length) { el.innerHTML=`<div class="empty-state">No expenses found.</div>`; return; }
  list.forEach(ex => {
    const row = document.createElement('div');
    row.className = 'adm-row';
    row.innerHTML = `
      <div class="adm-row-left">
        <div class="adm-row-title">${escapeHtml(ex.item)}</div>
        <div class="adm-row-meta"><span class="pill" style="background:rgba(255,165,0,0.15);color:#ffa500">${escapeHtml(ex.category)}</span> · ${fmtDate(ex.date)}${ex.note?` · ${escapeHtml(ex.note)}`:''}</div>
      </div>
      <div class="adm-row-right">
        <span class="adm-amt danger">${fmt(ex.amount)}</span>
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="delete-x" title="Delete">✕</button>
      </div>`;
    $('.edit-btn',row).onclick = () => openExpenseForm(ex.id);
    $('.delete-x',row).onclick = () => { if(!confirm('Delete this expense?')) return; state.expenses=state.expenses.filter(x=>x.id!==ex.id); persist(); renderExpenses(); };
    el.appendChild(row);
  });
}

$('#addExpenseBtn').addEventListener('click', () => openExpenseForm(null));
$('#expFilterDate').addEventListener('change', renderExpenses);
$('#expFilterCat').addEventListener('change', renderExpenses);
$('#expFilterClear').addEventListener('click', () => { $('#expFilterDate').value=''; $('#expFilterCat').value=''; renderExpenses(); });

function openExpenseForm(id) {
  const ex = id ? state.expenses.find(x=>x.id===id) : null;
  $('#expenseModalTitle').textContent = ex ? 'Edit Expense' : 'Add Expense';
  $('#expId').value      = ex?.id || '';
  $('#expItem').value    = ex?.item || '';
  $('#expCategory').value= ex?.category || 'Fruits';
  $('#expAmount').value  = ex?.amount ?? '';
  $('#expDate').value    = ex?.date || todayISO();
  $('#expNote').value    = ex?.note || '';
  $('#deleteExpenseBtn').style.display = ex ? '' : 'none';
  openModal('#expenseModal');
}
$('#expenseForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    id: $('#expId').value || uid(),
    item: $('#expItem').value.trim(),
    category: $('#expCategory').value,
    amount: Number($('#expAmount').value) || 0,
    date: $('#expDate').value,
    note: $('#expNote').value.trim(),
  };
  if (!data.item || !data.amount) { toast('Item and amount required'); return; }
  const idx = state.expenses.findIndex(x=>x.id===data.id);
  if (idx>=0) state.expenses[idx]=data; else state.expenses.unshift(data);
  persist(); closeModal('#expenseModal'); renderExpenses(); toast('Expense saved');
});
$('#deleteExpenseBtn').addEventListener('click', () => {
  const id=$('#expId').value; if(!id) return;
  if(!confirm('Delete this expense?')) return;
  state.expenses=state.expenses.filter(x=>x.id!==id);
  persist(); closeModal('#expenseModal'); renderExpenses(); toast('Expense deleted');
});

// ==========================================================
//   ADMIN: INVESTMENT
// ==========================================================
function renderInvestments() {
  const list = state.investments.slice().sort((a,b)=>b.date.localeCompare(a.date));
  let totalInvested=0, totalPending=0, totalUnpaid=0;
  state.investments.forEach(i => {
    totalInvested += i.amount;
    if (i.status==='pending') totalPending+=i.amount;
    if (!i.paid) totalUnpaid+=i.amount;
  });
  $('#investStats').innerHTML = `
    <div class="exp-stat-grid">
      <div class="stat-card"><span class="stat-label">Total Invested</span><span class="stat-value">${fmt(totalInvested)}</span></div>
      <div class="stat-card"><span class="stat-label">Pending Purchases</span><span class="stat-value warning">${fmt(totalPending)}</span></div>
      <div class="stat-card"><span class="stat-label">Unpaid</span><span class="stat-value danger">${fmt(totalUnpaid)}</span></div>
    </div>`;

  // Category breakdown
  const byCat = {};
  state.investments.forEach(i => { byCat[i.category]=(byCat[i.category]||0)+i.amount; });
  const catHtml = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>
    `<div class="cat-breakdown"><span>${escapeHtml(cat)}</span><span>${fmt(amt)}</span></div>`
  ).join('');
  if (catHtml) {
    const bd=document.createElement('div'); bd.className='invest-breakdown'; bd.innerHTML=catHtml;
    $('#investStats').appendChild(bd);
  }

  const el = $('#investmentList');
  el.innerHTML = '';
  if (!list.length) { el.innerHTML=`<div class="empty-state">No investments recorded yet.</div>`; return; }
  list.forEach(inv => {
    const row = document.createElement('div');
    row.className = 'adm-row';
    const statusIcon = inv.status==='bought' ? '✅' : '⏳';
    const paidBadge = inv.paid ? '<span class="pill live" style="font-size:9px">Paid</span>' : '<span class="pill off" style="font-size:9px">Unpaid</span>';
    row.innerHTML = `
      <div class="adm-row-left">
        <div class="adm-row-title">${statusIcon} ${escapeHtml(inv.item)}</div>
        <div class="adm-row-meta">${escapeHtml(inv.category)} · ${fmtDate(inv.date)} ${inv.vendor?`· ${escapeHtml(inv.vendor)}`:''} ${paidBadge}${inv.notes?`<br><em style="opacity:.7">${escapeHtml(inv.notes)}</em>`:''}</div>
      </div>
      <div class="adm-row-right">
        <span class="adm-amt">${fmt(inv.amount)}</span>
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="delete-x" title="Delete">✕</button>
      </div>`;
    $('.edit-btn',row).onclick = () => openInvestmentForm(inv.id);
    $('.delete-x',row).onclick = () => { if(!confirm('Delete this item?')) return; state.investments=state.investments.filter(x=>x.id!==inv.id); persist(); renderInvestments(); };
    el.appendChild(row);
  });
}

$('#addInvestmentBtn').addEventListener('click', () => openInvestmentForm(null));

function openInvestmentForm(id) {
  const inv = id ? state.investments.find(x=>x.id===id) : null;
  $('#investModalTitle').textContent = inv ? 'Edit Investment Item' : 'Add Investment Item';
  $('#investId').value       = inv?.id || '';
  $('#investItem').value     = inv?.item || '';
  $('#investCategory').value = inv?.category || 'Equipment';
  $('#investAmount').value   = inv?.amount ?? '';
  $('#investVendor').value   = inv?.vendor || '';
  $('#investDate').value     = inv?.date || todayISO();
  $('#investStatus').value   = inv?.status || 'bought';
  $('#investPaid').checked   = inv ? inv.paid : true;
  $('#investNotes').value    = inv?.notes || '';
  $('#deleteInvestmentBtn').style.display = inv ? '' : 'none';
  openModal('#investmentModal');
}
$('#investmentForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    id: $('#investId').value || uid(),
    item: $('#investItem').value.trim(),
    category: $('#investCategory').value,
    amount: Number($('#investAmount').value)||0,
    vendor: $('#investVendor').value.trim(),
    date: $('#investDate').value,
    status: $('#investStatus').value,
    paid: $('#investPaid').checked,
    notes: $('#investNotes').value.trim(),
  };
  if (!data.item||!data.amount) { toast('Item and amount required'); return; }
  const idx=state.investments.findIndex(x=>x.id===data.id);
  if (idx>=0) state.investments[idx]=data; else state.investments.unshift(data);
  persist(); closeModal('#investmentModal'); renderInvestments(); toast('Investment item saved');
});
$('#deleteInvestmentBtn').addEventListener('click', () => {
  const id=$('#investId').value; if(!id) return;
  if(!confirm('Delete this item?')) return;
  state.investments=state.investments.filter(x=>x.id!==id);
  persist(); closeModal('#investmentModal'); renderInvestments(); toast('Item deleted');
});

// ==========================================================
//   ADMIN: ANALYTICS
// ==========================================================
function renderAnalytics() {
  const el = $('#analyticsContent');
  const pl = calcPnL();

  // Top products
  const tally = {};
  const revByProduct = {};
  state.sales.forEach(s => {
    tally[s.name]=(tally[s.name]||0)+s.qty;
    revByProduct[s.name]=(revByProduct[s.name]||0)+s.total;
  });
  state.orders.forEach(o => (o.items||[]).forEach(i => {
    tally[i.name]=(tally[i.name]||0)+i.qty;
    revByProduct[i.name]=(revByProduct[i.name]||0)+i.total;
  }));
  const sorted = Object.entries(tally).sort((a,b)=>b[1]-a[1]);
  const maxQty = sorted[0]?.[1]||1;

  // Hourly distribution
  const hourly = Array(24).fill(0);
  [...state.sales, ...state.orders].forEach(o => {
    const h = new Date(o.date).getHours();
    hourly[h]++;
  });
  const maxH = Math.max(...hourly,1);
  const busiestHour = hourly.indexOf(Math.max(...hourly));

  // Channel breakdown
  const channels = {};
  state.orders.forEach(o => { channels[o.channel]=(channels[o.channel]||0)+1; });
  state.sales.filter(s=>s.paymentMethod).forEach(s => { channels[s.paymentMethod]=(channels[s.paymentMethod]||0)+1; });

  // Total order count
  const totalOrders = state.sales.length + state.orders.length;
  const avgOrderValue = totalOrders ? Math.round((pl.revAll)/totalOrders) : 0;

  el.innerHTML = `
    <div class="analytics-kpis">
      <div class="kpi-card"><div class="kpi-label">Total Orders</div><div class="kpi-value">${totalOrders}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg Order Value</div><div class="kpi-value accent">${fmt(avgOrderValue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Busiest Hour</div><div class="kpi-value">${busiestHour>0?busiestHour+':00':'N/A'}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Products</div><div class="kpi-value">${state.products.length}</div></div>
    </div>

    <div class="analytics-section">
      <h3>Best Selling Products</h3>
      ${!sorted.length ? `<div class="empty-state">No sales data yet.</div>` : sorted.slice(0,10).map(([name,qty],i) =>
        `<div class="analytics-bar-row">
          <div class="analytics-rank">${i+1}</div>
          <div class="analytics-bar-info">
            <div class="analytics-bar-name">${escapeHtml(name)}</div>
            <div class="analytics-bar-wrap"><div class="analytics-bar-fill" style="width:${Math.round(qty/maxQty*100)}%"></div></div>
          </div>
          <div class="analytics-bar-stat">
            <div class="analytics-bar-qty">${qty} sold</div>
            <div class="analytics-bar-rev">${fmt(revByProduct[name]||0)}</div>
          </div>
        </div>`).join('')}
    </div>

    <div class="analytics-section">
      <h3>Hourly Activity (all-time)</h3>
      <div class="hourly-chart">
        ${Array.from({length:24},(_,h)=>`
          <div class="hour-col">
            <div class="hour-bar" style="height:${Math.round(hourly[h]/maxH*60)}px" title="${hourly[h]} orders"></div>
            <div class="hour-lbl">${h%6===0?h+':00':''}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="analytics-section">
      <h3>Channel / Payment Breakdown</h3>
      ${!Object.keys(channels).length ? `<div class="empty-state">No data yet.</div>` :
        Object.entries(channels).sort((a,b)=>b[1]-a[1]).map(([ch,cnt])=>
          `<div class="adm-row" style="margin-bottom:6px">
            <div class="adm-row-left"><div class="adm-row-title">${escapeHtml(ch)}</div></div>
            <div class="adm-row-right"><span class="adm-amt">${cnt} orders</span></div>
          </div>`).join('')}
    </div>

    <div class="analytics-section">
      <h3>Expense Breakdown by Category</h3>
      ${!state.expenses.length ? `<div class="empty-state">No expenses logged yet.</div>` : (() => {
        const byCat2 = {};
        state.expenses.forEach(e => { byCat2[e.category]=(byCat2[e.category]||0)+e.amount; });
        const maxAmt = Math.max(...Object.values(byCat2),1);
        return Object.entries(byCat2).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>
          `<div class="analytics-bar-row">
            <div class="analytics-rank" style="font-size:11px;min-width:60px">${escapeHtml(cat)}</div>
            <div class="analytics-bar-info">
              <div class="analytics-bar-wrap"><div class="analytics-bar-fill danger" style="width:${Math.round(amt/maxAmt*100)}%"></div></div>
            </div>
            <div class="analytics-bar-stat"><div class="analytics-bar-rev">${fmt(amt)}</div></div>
          </div>`).join('');
      })()}
    </div>`;
}

// ==========================================================
//   ADMIN: SETTINGS
// ==========================================================
function renderSettingsForm() {
  $('#setAppName').value      = state.settings.appName;
  $('#setWhatsapp').value     = state.settings.whatsapp;
  $('#setViber').value        = state.settings.viber||'';
  $('#setMessenger').value    = state.settings.messenger||'';
  $('#setInstagram').value    = state.settings.instagram||'';
  $('#setDeliveryOn').checked = !!state.settings.deliveryEnabled;
  $('#setDeliveryAmt').value  = state.settings.deliveryAmount||0;
  $('#setAutoLogout').value   = state.settings.autoLogoutMinutes||10;
  $('#setNewPassword').value  = '';
  $('#setConfirmPassword').value = '';
}

$('#settingsForm').addEventListener('submit', e => {
  e.preventDefault();
  const newPwd     = $('#setNewPassword').value;
  const confirmPwd = $('#setConfirmPassword').value;
  if (newPwd && newPwd !== confirmPwd) { toast('Passwords do not match'); return; }
  state.settings = {
    ...state.settings,
    appName:   $('#setAppName').value.trim()||'Eleva Drinks',
    whatsapp:  $('#setWhatsapp').value.replace(/\D/g,''),
    viber:     $('#setViber').value.replace(/\D/g,''),
    messenger: $('#setMessenger').value.trim().replace(/^@/,''),
    instagram: $('#setInstagram').value.trim().replace(/^@/,''),
    deliveryEnabled: $('#setDeliveryOn').checked,
    deliveryAmount: Number($('#setDeliveryAmt').value)||0,
    autoLogoutMinutes: Number($('#setAutoLogout').value)||10,
    adminPassword: newPwd || state.settings.adminPassword,
  };
  persist(); applyBranding();
  $('#settingsSavedMsg').hidden=false;
  setTimeout(()=>$('#settingsSavedMsg').hidden=true, 2000);
  renderCartBar(); toast('Settings saved');
  resetInactivity();
});

$('#resetProductsBtn').addEventListener('click', async () => {
  if (!confirm('Reset all products to defaults? This cannot be undone.')) return;
  state.products=JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); state.cart={};
  persist(); renderAdminProducts(); renderTabs(); renderMenu(); renderCartBar(); toast('Products reset');
  if (sb) { try { const rows=state.products.map(productToRow); await sb.from('products').upsert(rows,{onConflict:'id'}); } catch(e) { toast('Reset locally — sync failed'); } }
});

function applyBranding() {
  $('#brandName').textContent = state.settings.appName;
  document.title = state.settings.appName + ' 💪';
}

// ==========================================================
//   CSV EXPORT
// ==========================================================
function downloadCSV(filename, headers, rows) {
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const lines = [headers.map(esc).join(','), ...rows.map(r=>r.map(esc).join(','))];
  const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click(); URL.revokeObjectURL(a.href);
}

$('#exportOrdersBtn').addEventListener('click', () => {
  const rows = [
    ...state.orders.map(o=>['online', o.date, (o.items||[]).map(i=>`${i.name}x${i.qty}`).join('; '), o.total, o.channel, o.note||'']),
    ...state.sales.map(s=>['instore', s.date, `${s.name} x${s.qty}`, s.total, s.paymentMethod||'cash', s.customerName||'']),
  ];
  downloadCSV('eleva_orders.csv', ['Type','Date','Items','Total','Channel/Payment','Customer'], rows);
  toast('Orders exported');
});

$('#exportExpensesBtn').addEventListener('click', () => {
  const rows = state.expenses.map(e=>[e.date, e.item, e.category, e.amount, e.note||'']);
  downloadCSV('eleva_expenses.csv', ['Date','Item','Category','Amount (Rs.)','Note'], rows);
  toast('Expenses exported');
});

$('#exportInvestBtn').addEventListener('click', () => {
  const rows = state.investments.map(i=>[i.date, i.item, i.category, i.amount, i.vendor||'', i.status, i.paid?'Yes':'No', i.notes||'']);
  downloadCSV('eleva_investments.csv', ['Date','Item','Category','Amount (Rs.)','Vendor','Status','Paid','Notes'], rows);
  toast('Investments exported');
});

$('#exportAllBtn').addEventListener('click', () => {
  const pl = calcPnL();
  // Products
  downloadCSV('eleva_products.csv',
    ['ID','Name','Category','Price','Discount%','Available','Bestseller','Recommended','Description'],
    state.products.map(p=>[p.id,p.name,p.category,p.price,p.discount,p.available,p.bestseller,p.recommended,p.desc]));
  setTimeout(()=>{
    downloadCSV('eleva_orders.csv', ['Type','Date','Items','Total','Channel/Payment','Customer'],
      [...state.orders.map(o=>['online',o.date,(o.items||[]).map(i=>`${i.name}x${i.qty}`).join('; '),o.total,o.channel,o.note||'']),
       ...state.sales.map(s=>['instore',s.date,`${s.name} x${s.qty}`,s.total,s.paymentMethod||'cash',s.customerName||''])]);
  },300);
  setTimeout(()=>{ downloadCSV('eleva_expenses.csv',['Date','Item','Category','Amount (Rs.)','Note'],state.expenses.map(e=>[e.date,e.item,e.category,e.amount,e.note||''])); },600);
  setTimeout(()=>{ downloadCSV('eleva_investments.csv',['Date','Item','Category','Amount (Rs.)','Vendor','Status','Paid','Notes'],state.investments.map(i=>[i.date,i.item,i.category,i.amount,i.vendor||'',i.status,i.paid?'Yes':'No',i.notes||''])); },900);
  setTimeout(()=>{
    downloadCSV('eleva_pnl.csv',['Period','Revenue','Expenses','Profit'],[
      ['Today',pl.revToday,pl.expToday,pl.profitToday],
      ['This Week',pl.revWeek,pl.expWeek,pl.profitWeek],
      ['This Month',pl.revMonth,pl.expMonth,pl.profitMonth],
      ['Lifetime',pl.revAll,pl.expAll,pl.profitAll],
    ]);
  },1200);
  toast('Full backup exporting (5 files)…', 3000);
});

// ==========================================================
//   INIT
// ==========================================================
async function init() {
  if (!localStorage.getItem(KEYS.products)) { saveStore(KEYS.products,DEFAULT_PRODUCTS); state.products=JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); }
  applyBranding(); renderTabs(); renderMenu(); renderCartBar();
  if (sb) {
    const remote = await loadProductsRemote();
    if (remote && remote.length>0) {
      state.products=remote; saveStore(KEYS.products,remote); renderTabs(); renderMenu(); renderCartBar();
    } else if (remote && remote.length===0) {
      try { await sb.from('products').upsert(state.products.map(productToRow),{onConflict:'id'}); } catch {}
    }
  }
}
init();
