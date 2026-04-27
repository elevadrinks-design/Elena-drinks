# Eleva Drinks 💪

A mobile-first ordering web app for Eleva Drinks (Fresh Juice & Protein Shakes).
Built with **vanilla HTML / CSS / JavaScript** — no frameworks, no backend, no build tools required.

## ✨ Features

- 📱 Mobile-first dark gym theme
- 🥤 Dynamic menu (rendered from a JS array — no hardcoded HTML)
- 🛒 Live cart with sticky bottom bar
- 📝 Optional order note (no sugar, less ice, etc.)
- 📲 Checkout via **WhatsApp / Viber / Messenger / Instagram**
- 🔐 Hidden admin panel (long-press logo OR tap the top-right corner)
- 💸 Per-product **discounts** (shows original crossed-out price)
- 📦 Sold-out toggle per product
- 🧾 Offline sales tracker with daily / all-time totals
- 📋 Online orders auto-logged when customer hits "Order"
- ⚙️ Editable business settings (app name, phone numbers, delivery charge)
- 💾 All data saved in `localStorage`

## 🏃 Run Locally

This app is **pure static HTML** — you can simply double-click `index.html` to open it.

For a smoother dev experience inside this monorepo:

```bash
pnpm --filter @workspace/eleva-drinks run dev
```

## 🔑 Admin Login

- Open the app
- **Long-press** the "Eleva Drinks" logo for ~1 second  
  (or tap the invisible button in the top-right corner of the header)
- Enter:
  - **ID:** `admin`
  - **Password:** `fuelbar123`

To change the password, edit the credentials check in `script.js`:

```js
if (u === 'admin' && p === 'fuelbar123') { ... }
```

## ☁️ Deploy

### Option 1 — Replit (one click)
Click **Publish** in Replit. Your app will be live at `https://<your-app>.replit.app`.

### Option 2 — Vercel / Netlify / GitHub Pages
Push `index.html`, `style.css`, and `script.js` to a GitHub repo, then import the repo into Vercel/Netlify. No build command needed (just static files).

## ✏️ Customizing

All editable from the **Admin Panel**:

- **App name / branding** → Settings tab
- **WhatsApp / Viber / Messenger / Instagram** → Settings tab
- **Add / edit / delete products** → Products tab
- **Set discounts** → edit any product, set discount %
- **Mark sold out** → click "Set Out" on any product
- **Delivery charge** → Settings tab → enable + set amount

## 🗂 Files

```
index.html   — markup
style.css    — dark gym theme
script.js    — all logic (cart, admin, sales, checkout)
```

## 🛣 Roadmap

- **Phase 1** — Static deploy ✅
- **Phase 2** — Sync products & orders to **Supabase**
- **Phase 3** — **Cloudinary** image upload from admin panel
- **Phase 4** — Custom domain + delivery zones
