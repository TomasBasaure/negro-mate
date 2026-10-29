const WA = '5493420000000';
const FREE_FROM = 60000;
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const $ = sel => document.querySelector(sel);

// tema claro / oscuro (el script del <head> ya puso el inicial)
const root = document.documentElement;
const themeBtn = $('#theme');

function applyTheme(t) {
  root.dataset.theme = t;
  const label = t === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
  themeBtn.setAttribute('aria-label', label);
  themeBtn.title = label;
}

themeBtn.onclick = () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  store.set('theme', next);
};

// si nunca eligió un tema a mano, sigo el del sistema
const mq = window.matchMedia('(prefers-color-scheme: dark)');
if (mq.addEventListener) {
  mq.addEventListener('change', e => {
    if (!store.get('theme', null)) applyTheme(e.matches ? 'dark' : 'light');
  });
}

applyTheme(root.dataset.theme || 'light');

function money(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function finalPrice(p) {
  return p.p * (1 - p.d / 100);
}

// foto si hay, si no el dibujito de la prenda
function pic(p) {
  if (p.img) {
    return `<img src="${p.img}" alt="${p.n}" loading="lazy" width="600" height="600">`;
  }
  return `<svg style="color:${p.col}" aria-hidden="true"><use href="#${p.t}"/></svg>`;
}

let cat = 'todos';
let sortBy = '';
const sizeFilter = new Set();
const picked = {}; // talle elegido por producto
let cart = [];

try {
  cart = JSON.parse(localStorage.getItem('nm_cart')) || [];
} catch (e) {}

function saveCart() {
  try {
    localStorage.setItem('nm_cart', JSON.stringify(cart));
  } catch (e) {}
}

function sortSizes(sizes) {
  const letras = SIZE_ORDER.filter(s => sizes.includes(s));
  const numeros = sizes.filter(s => !isNaN(s)).sort((a, b) => a - b);
  return [...letras, ...numeros];
}

function buildFilters() {
  const cats = ['todos', ...new Set(PRODUCTS.map(p => p.c))];
  $('#cats').innerHTML = cats.map(c => {
    const nombre = c[0].toUpperCase() + c.slice(1);
    return `<button class="chip ${c === cat ? 'on' : ''}" data-cat="${c}">${nombre}</button>`;
  }).join('');

  const talles = sortSizes([...new Set(PRODUCTS.flatMap(p => p.s))]);
  $('#sizes').innerHTML = talles.map(s =>
    `<button class="chip sm ${sizeFilter.has(s) ? 'on' : ''}" data-size="${s}">${s}</button>`
  ).join('');

  $('#clear').hidden = cat === 'todos' && !sizeFilter.size && !sortBy;
}

function renderGrid() {
  let list = PRODUCTS.filter(p => {
    const okCat = cat === 'todos' || p.c === cat;
    const okSize = !sizeFilter.size || p.s.some(s => sizeFilter.has(s));
    return okCat && okSize;
  });

  if (sortBy) {
    list = [...list].sort((a, b) =>
      sortBy === 'asc' ? finalPrice(a) - finalPrice(b) : finalPrice(b) - finalPrice(a)
    );
  }

  $('#none').hidden = list.length > 0;
  $('#found').textContent = list.length + (list.length === 1 ? ' prenda' : ' prendas');

  $('#grid').innerHTML = list.map(p => {
    const chosen = picked[p.id];
    const tieneTalles = p.s.length > 0;
    const agotado = tieneTalles ? p.s.every(s => stockOf(p.id, s) < 1) : stockOf(p.id) < 1;

    let texto = 'Agregar al carrito';
    if (agotado) texto = 'Agotado';
    else if (tieneTalles && !chosen) texto = 'Elegí un talle';

    const botonesTalle = tieneTalles
      ? `<div class="sz" role="group" aria-label="Talle">${sortSizes(p.s).map(s =>
          `<button data-s="${s}" class="${chosen === s ? 'on' : ''}" ${stockOf(p.id, s) < 1 ? 'disabled title="Sin stock"' : ''}>${s}</button>`
        ).join('')}</div>`
      : '';

    return `<article class="card ${agotado ? 'sold' : ''}" data-id="${p.id}">
      <div class="pic">${pic(p)}${p.img2 ? `<img class="alt" src="${p.img2}" alt="" loading="lazy">` : ''}${agotado ? '<span class="off sold-tag">Agotado</span>' : p.d ? `<span class="off">-${p.d}%</span>` : ''}</div>
      <div class="meta">
        <h3>${p.n}</h3>
        <div class="price">${money(finalPrice(p))}${p.d ? `<s>${money(p.p)}</s>` : ''}</div>
        ${botonesTalle}
        <button class="btn add" ${agotado || (tieneTalles && !chosen) ? 'disabled' : ''}>${texto}</button>
      </div></article>`;
  }).join('');
}

document.addEventListener('click', e => {
  const t = e.target;

  if (t.dataset.cat) {
    cat = t.dataset.cat;
    buildFilters();
    renderGrid();
  } else if (t.dataset.size) {
    if (sizeFilter.has(t.dataset.size)) sizeFilter.delete(t.dataset.size);
    else sizeFilter.add(t.dataset.size);
    buildFilters();
    renderGrid();
  } else if (t.id === 'clear') {
    cat = 'todos';
    sizeFilter.clear();
    sortBy = '';
    $('#sort').value = '';
    buildFilters();
    renderGrid();
  } else if (t.closest('.sz') && t.dataset.s) {
    picked[t.closest('.card').dataset.id] = t.dataset.s;
    renderGrid();
  } else if (t.classList.contains('add')) {
    const id = +t.closest('.card').dataset.id;
    addToCart(id, picked[id] || null);
    delete picked[id];
    renderGrid();
    openCart();
  }
});

function addToCart(id, size) {
  const row = cart.find(i => i.id === id && i.size === size);
  if (row) row.q++;
  else cart.push({ id, size, q: 1 });
  drawCart();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + finalPrice(PRODUCTS.find(p => p.id === i.id)) * i.q, 0);
}

function drawCart() {
  saveCart();
  $('#count').textContent = cart.reduce((sum, i) => sum + i.q, 0);
  $('#foot').hidden = !cart.length;

  if (!cart.length) {
    $('#items').innerHTML = '<p class="empty">Todavía no agregaste nada. Elegí una prenda y un talle para empezar.</p>';
    return;
  }

  $('#items').innerHTML = cart.map((item, k) => {
    const p = PRODUCTS.find(x => x.id === item.id);
    return `<div class="line"><div class="th">${pic(p)}</div>
      <div><h4>${p.n}</h4><small>${item.size ? 'Talle ' + item.size : 'Talle único'} &nbsp;${money(finalPrice(p))}</small>
        <div class="qty"><button data-q="${k}:-1" aria-label="Menos">&minus;</button><span>${item.q}</span><button data-q="${k}:1" aria-label="Más">+</button></div></div>
      <button class="link rm" data-rm="${k}">Quitar</button></div>`;
  }).join('');

  const t = cartTotal();
  $('#total').textContent = money(t);
  $('#free').textContent = t >= FREE_FROM
    ? 'Tu pedido tiene envío gratis.'
    : `Te faltan ${money(FREE_FROM - t)} para el envío gratis. Si no llegás, te confirmamos el costo por WhatsApp.`;
}

$('#items').addEventListener('click', e => {
  if (e.target.dataset.q) {
    const [k, delta] = e.target.dataset.q.split(':').map(Number);
    cart[k].q += delta;
    if (cart[k].q < 1) cart.splice(k, 1);
    drawCart();
  } else if (e.target.dataset.rm) {
    cart.splice(+e.target.dataset.rm, 1);
    drawCart();
  }
});

const drawer = $('#drawer');
const scrim = $('#scrim');

function openCart() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  scrim.hidden = false;
  $('#close-cart').focus();
}

function closeCart() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  scrim.hidden = true;
}

$('#open-cart').onclick = openCart;
$('#close-cart').onclick = closeCart;
scrim.onclick = closeCart;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});

const dlg = $('#dlg');
const dlgBody = $('#dlg-body');

$('#checkout').onclick = () => {
  closeCart();

  const lines = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `<div><span>${p.n}${i.size ? ' (' + i.size + ')' : ''} x${i.q}</span><span>${money(finalPrice(p) * i.q)}</span></div>`;
  }).join('');

  dlgBody.innerHTML = `<h2>Finalizar compra</h2>
    <form class="f" id="cof">
      <label>Nombre completo<input name="n" required autocomplete="name"></label>
      <label>Email<input name="e" type="email" required autocomplete="email"></label>
      <label>Teléfono<input name="t" type="tel" required autocomplete="tel"></label>
      <div class="sum">${lines}<div class="t"><span>Subtotal</span><span>${money(cartTotal())}</span></div></div>
      <button class="btn full" type="submit">Confirmar pedido</button>
    </form>`;
  dlg.showModal();
};

dlgBody.addEventListener('submit', e => {
  if (e.target.id !== 'cof') return;
  e.preventDefault();

  const f = new FormData(e.target);
  const orders = ordersGet();
  const stock = store.get('stock', {});

  orders.unshift({
    id: Date.now(),
    num: 'NM-' + (1000 + orders.length + 1),
    name: f.get('n'),
    email: f.get('e'),
    phone: f.get('t'),
    date: new Date().toISOString(),
    status: 'pending',
    pay: 'pending',
    total: cartTotal(),
    items: cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return { n: p.n, s: i.size, q: i.q, p: finalPrice(p) };
    })
  });

  // descuento el stock de lo que se pidió
  cart.forEach(i => {
    const talle = i.size || 'Único';
    stock[i.id] = stock[i.id] || {};
    stock[i.id][talle] = Math.max(0, stockOf(i.id, i.size) - i.q);
  });

  store.set('orders', orders);
  store.set('stock', stock);

  dlgBody.innerHTML = `<h2>Pedido de prueba enviado</h2>
    <p>Este es el final de la demo: no se cobró nada ni se guardó ningún dato.</p>
    <p>La tienda original funciona con un backend real y pagos con Mercado Pago. Esta versión corre entera en el navegador. El pedido ya aparece en el <a href="admin.html">panel admin</a> (usuario admin, clave demo1234).</p>
    <div class="stack"><span>HTML</span><span>CSS</span><span>JavaScript</span><span>localStorage</span></div>
    <button class="btn full" id="reset">Vaciar carrito y seguir mirando</button>`;
});

dlgBody.addEventListener('click', e => {
  if (e.target.id === 'reset') {
    cart = [];
    drawCart();
    dlg.close();
  }
});

$('#cform').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Hola, escribo desde la web de Negro Mate.\nNombre: ${f.get('n')}\nEmail: ${f.get('e')}\n\n${f.get('m')}`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  $('#cstatus').textContent = 'Se abrió WhatsApp con tu mensaje listo para enviar.';
  e.target.reset();
});

$('#sort').onchange = e => {
  sortBy = e.target.value;
  buildFilters();
  renderGrid();
};

buildFilters();
renderGrid();
drawCart();
