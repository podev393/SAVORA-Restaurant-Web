/* ============================================================
   SAVORA demo: script.js
   1 Helpers · 2 Menu data · 3 Navigation · 4 Menu · 5 Cart
   6 Checkout · 7 Forms · 8 Page extras
   ============================================================ */
(() => {
'use strict';
document.documentElement.classList.add('js');

/* ---------- 1. HELPERS ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => 'PKR ' + n.toLocaleString('en-US');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Broken images: hide the <img> so the gradient + dish name behind it shows.
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG') e.target.classList.add('failed');
}, true);
$$('img').forEach(img => { if (img.complete && !img.naturalWidth) img.classList.add('failed'); });

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const box = document.createElement('textarea');
    box.value = text;
    document.body.append(box);
    box.select();
    const ok = document.execCommand('copy');
    box.remove();
    return ok;
  }
}

/* ---------- 2. MENU DATA (edit names, prices and image ids here) ---------- */
const U = id => `assets/images/${id}.jpg`;
const DISHES = [
  { id: 'burger', name: 'Burger', cat: 'Main Course', price: 850, badge: 'Popular', img: 'burger', alt: 'Gourmet burger with melted cheese and fresh toppings', desc: 'Stacked fresh, grilled to perfection — bite into pure deliciousness.' },
  { id: 'pizza', name: 'Spicy Aloha', cat: 'Pizza', price: 1100, badge: 'Popular', img: 'pizza', alt: 'Margherita pizza topped with basil', desc: 'Freshly baked, loaded with flavor — every slice is a slice of heaven. ' },
  { id: 'pasta', name: 'Creamy Tuscan Mushroom Pasta', cat: 'Main Course', price: 950, badge: '', img: 'pasta', alt: 'Bowl of creamy Alfredo pasta', desc: ' Pasta tossed in silky cream sauce with seared mushrooms, spinach & sun-dried tomatoes — pure Italian comfort.' },
  { id: 'chicken', name: 'Grilled Chicken', cat: 'Main Course', price: 1350, badge: "Chef's Pick", img: 'chicken', alt: 'Herb-grilled chicken with roasted vegetables', desc: 'Marinated chicken breast, grilled and served with seasonal vegetables.' },
  { id: 'cake', name: 'Lava Cake', cat: 'Desserts', price: 550, badge: "Chef's Pick", img: 'lava_cake', alt: 'Chocolate lava cake with molten centre', desc: 'Molten chocolate cake with a gooey, oozing center — pure chocolate bliss.' },
  { id: 'cooler', name: 'Chai', cat: 'Drinks', price: 350, badge: '', img: 'chai', alt: 'Cup of Tea', desc: 'A warm, aromatic cup of chai — cozy and comforting.' },
  { id: 'bread', name: 'Garlic Herb Bread', cat: 'Starters', price: 450, badge: '', img: 'bread', alt: 'Sliced garlic bread with herbs', desc: 'Oven-warm bread brushed with garlic butter and parsley.' }
];
const byId = id => DISHES.find(d => d.id === id);

/* ---------- 3. NAVIGATION ---------- */
const nav = $('#nav'), navToggle = $('#navToggle');
function setNav(open) {
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.textContent = open ? '✕' : '☰';
}
navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });

// Highlight the nav link of the section crossing the middle of the screen.
const navLinks = $$('#nav a');
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(a => a.getAttribute('href') === '#' + en.target.id
      ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });
}

/* ---------- 4. MENU: filter + search + sort ---------- */
const state = { cat: 'All', q: '', sort: 'featured' };
const grid = $('#menuGrid');
const sorters = { price: (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name) };

const cardHTML = d => `
  <article class="card">
    <figure class="img-box" data-name="${d.name}">
      <img src="${U(d.img)}" alt="${d.alt}" width="700" height="525" loading="lazy">
      ${d.badge ? `<span class="badge">${d.badge}</span>` : ''}
    </figure>
    <div class="card-body">
      <p class="cat">${d.cat}</p>
      <h3>${d.name}</h3>
      <p>${d.desc}</p>
      <div class="row"><b class="price">${money(d.price)}</b>
        <button class="btn btn-gold btn-sm" type="button" data-add="${d.id}" aria-label="Add ${d.name} to cart">Add to Cart</button></div>
    </div>
  </article>`;

function renderMenu() {
  const q = state.q.trim().toLowerCase();
  const list = DISHES.filter(d =>
    (state.cat === 'All' || d.cat === state.cat) &&
    (!q || (d.name + ' ' + d.desc).toLowerCase().includes(q)));
  if (sorters[state.sort]) list.sort(sorters[state.sort]);
  grid.innerHTML = list.map(cardHTML).join('');
  $('#empty').hidden = list.length > 0;
}

$('#filters').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.cat = chip.dataset.cat;
  $$('.chip').forEach(c => {
    const on = c === chip;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  renderMenu();
});
$('#search').addEventListener('input', e => { state.q = e.target.value; renderMenu(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderMenu(); });

/* ---------- 5. CART ---------- */
const KEY = 'savora-demo-cart-v1', MAX_QTY = 20;
const drawer = $('#cart'), overlay = $('#overlay'), cartBtn = $('#cartOpen');

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const clean = {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [id, q] of Object.entries(raw)) {
        if (byId(id) && Number.isInteger(q) && q > 0) clean[id] = Math.min(q, MAX_QTY);
      }
    }
    return clean;
  } catch { return {}; }
}
function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* storage unavailable: cart still works for this visit */ } }

let cart = loadCart();
const itemCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const subtotal = () => Object.entries(cart).reduce((sum, [id, q]) => sum + byId(id).price * q, 0);

function renderCart() {
  const n = itemCount();
  $('#cartList').innerHTML = Object.entries(cart).map(([id, q]) => {
    const d = byId(id);
    return `<li class="ci">
      <span>${d.name}<small>${money(d.price)} each</small></span><b>${money(d.price * q)}</b>
      <span class="qty"><button type="button" data-dec="${id}" aria-label="Decrease quantity of ${d.name}">−</button><output aria-label="Quantity">${q}</output><button type="button" data-inc="${id}" aria-label="Increase quantity of ${d.name}">+</button></span>
      <button class="x" type="button" data-rm="${id}" aria-label="Remove ${d.name}">Remove</button></li>`;
  }).join('');
  $('#cartCount').textContent = n;
  cartBtn.setAttribute('aria-label', `Open cart, ${n} item${n === 1 ? '' : 's'}`);
  $('#subtotal').textContent = money(subtotal());
  $('#cartEmpty').hidden = n > 0;
  $('#checkoutBtn').disabled = n === 0;
  $('#clearCart').hidden = n === 0;
}

function setQty(id, qty) {
  qty = Math.min(MAX_QTY, Math.floor(qty));
  if (qty > 0) cart[id] = qty; else delete cart[id];
  saveCart();
  renderCart();
}

function openCart(open) {
  drawer.inert = !open;
  drawer.classList.toggle('open', open);
  overlay.hidden = !open;
  document.body.classList.toggle('lock', open);
  (open ? drawer : cartBtn).focus();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-add],[data-inc],[data-dec],[data-rm]');
  if (!t) return;
  const { add, inc, dec, rm } = t.dataset;
  if (add) { setQty(add, (cart[add] || 0) + 1); toast(`${byId(add).name} added to cart`); }
  if (inc) setQty(inc, (cart[inc] || 0) + 1);
  if (dec) setQty(dec, (cart[dec] || 0) - 1);
  if (rm) { setQty(rm, 0); toast('Item removed'); }
});
cartBtn.addEventListener('click', () => openCart(true));
$('#cartClose').addEventListener('click', () => openCart(false));
overlay.addEventListener('click', () => openCart(false));
$('#clearCart').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); toast('Cart cleared'); });

// Keep Tab focus inside the open drawer.
drawer.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = $$('button:not([disabled])', drawer).filter(b => !b.hidden);
  const first = f[0], last = f[f.length - 1], now = document.activeElement;
  if (e.shiftKey && (now === first || now === drawer)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && now === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  setNav(false);
  if (drawer.classList.contains('open')) openCart(false);
});

/* ---------- 7. FORM VALIDATION (shared by checkout + reservation) ---------- */
function validate(form) {
  let firstBad = null;
  $$('input,textarea', form).forEach(el => {
    let msg = '';
    if (!el.checkValidity()) msg = el.validity.valueMissing ? 'This field is required.' : (el.title || el.validationMessage);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    let err = el.parentElement.querySelector('.err');
    if (msg) {
      if (!err) {
        err = document.createElement('small');
        err.className = 'err';
        err.id = `${form.id}-${el.name}-err`;
        el.parentElement.append(err);
        el.setAttribute('aria-describedby', err.id);
      }
      err.textContent = msg;
      firstBad = firstBad || el;
    } else if (err) { err.remove(); el.removeAttribute('aria-describedby'); }
  });
  if (firstBad) firstBad.focus();
  return !firstBad;
}

/* ---------- 6. DEMO CHECKOUT ---------- */
const dlg = $('#checkout'), coForm = $('#coForm'), coDone = $('#coDone');
$('#checkoutBtn').addEventListener('click', () => {
  if (!itemCount()) return;
  $('#coItems').innerHTML = Object.entries(cart).map(([id, q]) =>
    `<li><span>${q} × ${byId(id).name}</span><span>${money(byId(id).price * q)}</span></li>`).join('');
  $('#coTotal').textContent = money(subtotal());
  coForm.hidden = false;
  coDone.hidden = true;
  openCart(false);
  dlg.showModal();
});
dlg.addEventListener('click', e => { if (e.target.closest('[data-close]')) dlg.close(); });
coForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate(coForm)) return;
  coForm.hidden = true;
  coDone.hidden = false;
  coForm.reset();
  cart = {}; saveCart(); renderCart();   // customer details are never stored
});

/* ---------- 7b. RESERVATION FORM ---------- */
const now = new Date(), pad = n => String(n).padStart(2, '0');
$('#resDate').min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
$('#resForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target, status = $('#resStatus');
  if (!validate(form)) {
    status.className = 'status full err';
    status.textContent = 'Please fix the highlighted fields.';
    return;
  }
  status.className = 'status full ok';
  status.textContent = 'Demo only: your details passed validation but were not sent, saved or confirmed. No real booking exists.';
  form.reset();
});

/* ---------- 8. PAGE EXTRAS ---------- */
$('#copyAddr').addEventListener('click', async () => {
  toast(await copyText($('#addr').textContent.trim()) ? 'Demo address copied' : 'Copy failed. Select the text instead.');
});
const toTop = $('#toTop');
addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 600), { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }));
$('#year').textContent = new Date().getFullYear();

// Scroll reveal (content stays visible if IntersectionObserver is missing).
const reveals = $$('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .15 });
  reveals.forEach(el => io.observe(el));
} else reveals.forEach(el => el.classList.add('in'));

/* ---------- START ---------- */
renderMenu();
renderCart();
})();
