// Cambiá este número por el tuyo (código de país + área + número, sin + ni espacios)
const WA = '5493420000000';
const FREE_FROM = 60000;

const ORDER = ['XS','S','M','L','XL','XXL'];
const $ = s => document.querySelector(s);
const money = n => '$' + Math.round(n).toLocaleString('es-AR');
const final = p => p.p * (1 - p.d / 100);
const art = (p, cls = '') => `<svg class="${cls}" style="color:${p.col}" aria-hidden="true"><use href="#${p.t}"/></svg>`;

let cat = 'todos';
const sizeFilter = new Set();
const picked = {};                       // talle elegido por producto
let cart = [];
try { cart = JSON.parse(localStorage.getItem('nm_cart')) || []; } catch (e) {}
const save = () => { try { localStorage.setItem('nm_cart', JSON.stringify(cart)); } catch (e) {} };

// ---------- filtros ----------
function sortSizes(a) {
  const txt = ORDER.filter(s => a.includes(s));
  const num = a.filter(s => !isNaN(s)).sort((x, y) => x - y);
  return [...txt, ...num];
}
function buildFilters() {
  const cats = ['todos', ...new Set(PRODUCTS.map(p => p.c))];
  $('#cats').innerHTML = cats.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-cat="${c}">${c[0].toUpperCase() + c.slice(1)}</button>`).join('');
  const all = sortSizes([...new Set(PRODUCTS.flatMap(p => p.s))]);
  $('#sizes').innerHTML = all.map(s => `<button class="chip sm ${sizeFilter.has(s) ? 'on' : ''}" data-size="${s}">${s}</button>`).join('');
  $('#clear').hidden = cat === 'todos' && !sizeFilter.size;
}
function renderGrid() {
  const list = PRODUCTS.filter(p =>
    (cat === 'todos' || p.c === cat) &&
    (!sizeFilter.size || p.s.some(s => sizeFilter.has(s))));
  $('#none').hidden = list.length > 0;
  $('#grid').innerHTML = list.map(p => {
    const chosen = picked[p.id];
    const needs = p.s.length > 0;
    const out = !needs && stockOf(p.id) < 1;
    return `<article class="card" data-id="${p.id}">
      <div class="pic">${art(p)}${p.d ? `<span class="off">-${p.d}%</span>` : ''}</div>
      <div class="meta">
        <h3>${p.n}</h3>
        <div class="price">${money(final(p))}${p.d ? `<s>${money(p.p)}</s>` : ''}</div>
        ${needs ? `<div class="sz" role="group" aria-label="Talle">${sortSizes(p.s).map(s => `<button data-s="${s}" class="${chosen === s ? 'on' : ''}" ${stockOf(p.id, s) < 1 ? 'disabled title="Sin stock"' : ''}>${s}</button>`).join('')}</div>` : ''}
        <button class="btn add" ${out || (needs && !chosen) ? 'disabled' : ''}>${out ? 'Sin stock' : needs && !chosen ? 'Elegí un talle' : 'Agregar al carrito'}</button>
      </div></article>`;
  }).join('');
}

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.cat) { cat = t.dataset.cat; buildFilters(); renderGrid(); }
  else if (t.dataset.size) {
    sizeFilter.has(t.dataset.size) ? sizeFilter.delete(t.dataset.size) : sizeFilter.add(t.dataset.size);
    buildFilters(); renderGrid();
  }
  else if (t.id === 'clear') { cat = 'todos'; sizeFilter.clear(); buildFilters(); renderGrid(); }
  else if (t.closest('.sz') && t.dataset.s) {
    picked[t.closest('.card').dataset.id] = t.dataset.s; renderGrid();
  }
  else if (t.classList.contains('add')) {
    const id = +t.closest('.card').dataset.id;
    addToCart(id, picked[id] || null);
    delete picked[id]; renderGrid(); openCart();
  }
});

// ---------- carrito ----------
function addToCart(id, size) {
  const row = cart.find(i => i.id === id && i.size === size);
  row ? row.q++ : cart.push({ id, size, q: 1 });
  drawCart();
}
const total = () => cart.reduce((a, i) => a + final(PRODUCTS.find(p => p.id === i.id)) * i.q, 0);

function drawCart() {
  save();
  $('#count').textContent = cart.reduce((a, i) => a + i.q, 0);
  $('#foot').hidden = !cart.length;
  if (!cart.length) {
    $('#items').innerHTML = '<p class="empty">Todavía no agregaste nada. Elegí una prenda y un talle para empezar.</p>';
    return;
  }
  $('#items').innerHTML = cart.map((i, k) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `<div class="line"><div class="th">${art(p)}</div>
      <div><h4>${p.n}</h4><small>${i.size ? 'Talle ' + i.size : 'Talle único'} &nbsp;${money(final(p))}</small>
        <div class="qty"><button data-q="${k}:-1" aria-label="Menos">&minus;</button><span>${i.q}</span><button data-q="${k}:1" aria-label="Más">+</button></div></div>
      <button class="link rm" data-rm="${k}">Quitar</button></div>`;
  }).join('');
  const t = total();
  $('#total').textContent = money(t);
  $('#free').textContent = t >= FREE_FROM ? 'Tu pedido tiene envío gratis.' : `Te faltan ${money(FREE_FROM - t)} para el envío gratis.`;
}
$('#items').addEventListener('click', e => {
  if (e.target.dataset.q) {
    const [k, d] = e.target.dataset.q.split(':').map(Number);
    cart[k].q += d; if (cart[k].q < 1) cart.splice(k, 1);
    drawCart();
  } else if (e.target.dataset.rm) { cart.splice(+e.target.dataset.rm, 1); drawCart(); }
});

const drawer = $('#drawer'), scrim = $('#scrim');
function openCart() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); scrim.hidden = false; $('#close-cart').focus(); }
function closeCart() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true; }
$('#open-cart').onclick = openCart;
$('#close-cart').onclick = closeCart;
scrim.onclick = closeCart;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

// ---------- checkout (demo) ----------
const dlg = $('#dlg'), body = $('#dlg-body');
$('#checkout').onclick = () => {
  closeCart();
  const lines = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `<div><span>${p.n}${i.size ? ' (' + i.size + ')' : ''} x${i.q}</span><span>${money(final(p) * i.q)}</span></div>`;
  }).join('');
  body.innerHTML = `<h2>Finalizar compra</h2>
    <form class="f" id="cof">
      <label>Nombre completo<input name="n" required autocomplete="name"></label>
      <label>Email<input name="e" type="email" required autocomplete="email"></label>
      <label>Teléfono<input name="t" type="tel" required autocomplete="tel"></label>
      <div class="sum">${lines}<div class="t"><span>Total</span><span>${money(total())}</span></div></div>
      <button class="btn full" type="submit">Confirmar pedido</button>
    </form>`;
  dlg.showModal();
};
body.addEventListener('submit', e => {
  if (e.target.id !== 'cof') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const orders = ordersGet(), st = store.get('stock', {});
  orders.unshift({ id: Date.now(), num: 'NM-' + (1000 + orders.length + 1), name: f.get('n'), email: f.get('e'), phone: f.get('t'),
    date: new Date().toISOString(), status: 'pending', pay: 'pending', total: total(),
    items: cart.map(i => { const p = PRODUCTS.find(x => x.id === i.id); return { n: p.n, s: i.size, q: i.q, p: final(p) }; }) });
  cart.forEach(i => { const k = i.size || 'Único'; st[i.id] = st[i.id] || {}; st[i.id][k] = Math.max(0, stockOf(i.id, i.size) - i.q); });
  store.set('orders', orders); store.set('stock', st);
  body.innerHTML = `<h2>Pedido de prueba enviado</h2>
    <p>Este es el final de la demo: no se cobró nada ni se guardó ningún dato.</p>
    <p>La tienda original funciona con un backend real y pagos con Mercado Pago. Esta versión corre entera en el navegador. El pedido ya aparece en el <a href="admin.html">panel admin</a> (usuario admin, clave demo1234).</p>
    <div class="stack"><span>HTML</span><span>CSS</span><span>JavaScript</span><span>localStorage</span></div>
    <button class="btn full" id="reset">Vaciar carrito y seguir mirando</button>`;
});
body.addEventListener('click', e => {
  if (e.target.id === 'reset') { cart = []; drawCart(); dlg.close(); }
});

// ---------- contacto ----------
$('#cform').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Hola, escribo desde la web de Negro Mate.\nNombre: ${f.get('n')}\nEmail: ${f.get('e')}\n\n${f.get('m')}`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  $('#cstatus').textContent = 'Se abrió WhatsApp con tu mensaje listo para enviar.';
  e.target.reset();
});

buildFilters(); renderGrid(); drawCart();
