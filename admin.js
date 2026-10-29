const USER = 'admin';
const PASS = 'demo1234';

const $ = sel => document.querySelector(sel);

// tema claro / oscuro (compartido con la tienda)
const root = document.documentElement;
const themeBtns = document.querySelectorAll('.theme-btn');

function applyTheme(t) {
  root.dataset.theme = t;
  const label = t === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  themeBtns.forEach(b => {
    b.setAttribute('aria-pressed', String(t === 'dark'));
    b.setAttribute('aria-label', label);
    b.title = label;
  });
}

themeBtns.forEach(b => {
  b.onclick = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
  };
});

applyTheme(root.dataset.theme || 'light');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const money = n => '$' + Math.round(n).toLocaleString('es-AR');
const fdate = d => new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const finalPrice = p => p.p * (1 - p.d / 100);

const ST = { pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const PAY = { pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado' };

const badge = (key, label) => `<span class="bd s-${key}">${label}</span>`;

let tab = 'orders';
let fStatus = '';
let fSearch = '';
let fStock = '';
let orders = ordersGet();

const saveProducts = () => store.set('products', PRODUCTS);
const saveOrders = () => store.set('orders', orders);

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.setAttribute('role', 'status');
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

// login (solo demo, no es seguridad real)
const logged = () => sessionStorage.getItem('nm_admin') === '1';

function gate() {
  $('#login').hidden = logged();
  $('#panel').hidden = !logged();
  if (logged()) draw();
}

$('#lf').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (f.get('u') === USER && f.get('p') === PASS) {
    sessionStorage.setItem('nm_admin', '1');
    $('#lerr').textContent = '';
    gate();
  } else {
    $('#lerr').textContent = 'Usuario o contraseña incorrectos.';
  }
});

$('#logout').onclick = () => {
  sessionStorage.removeItem('nm_admin');
  gate();
};

$('#tabs').addEventListener('click', e => {
  if (!e.target.dataset.t) return;
  tab = e.target.dataset.t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b === e.target));
  draw();
});

function draw() {
  if (tab === 'orders') drawOrders();
  else if (tab === 'products') drawProducts();
  else drawStock();
}

// vuelve a dibujar y deja el cursor al final del buscador
function refocusSearch() {
  const input = $('#q');
  input.focus();
  input.setSelectionRange(99, 99);
}

function drawOrders() {
  const cobrado = orders.filter(o => o.pay === 'paid').reduce((sum, o) => sum + o.total, 0);
  const q = fSearch.toLowerCase();
  const list = orders.filter(o => {
    const okStatus = !fStatus || o.status === fStatus;
    const okText = !q || [o.num, o.name, o.email].some(x => x.toLowerCase().includes(q));
    return okStatus && okText;
  });

  const opcionesEstado = Object.entries(ST).map(([k, v]) =>
    `<option value="${k}" ${fStatus === k ? 'selected' : ''}>${v}</option>`
  ).join('');

  const filas = list.map(o => `<tr>
      <td><b>${esc(o.num)}</b></td>
      <td>${esc(o.name)}<br><small>${esc(o.email)}</small></td>
      <td>${fdate(o.date)}</td>
      <td class="r">${money(o.total)}</td>
      <td>${badge(o.status, ST[o.status])}</td>
      <td>${badge(o.pay, PAY[o.pay])}</td>
      <td class="r"><button class="btn sm" data-view="${o.id}">Ver / editar</button><button class="btn sm del" data-delo="${o.id}">Eliminar</button></td>
    </tr>`).join('');

  $('#view').innerHTML = `
    <div class="head"><h2>Pedidos</h2></div>
    <div class="stats">
      <div class="stat"><b>${orders.length}</b><span>Pedidos en total</span></div>
      <div class="stat"><b>${orders.filter(o => o.status === 'pending').length}</b><span>Por confirmar</span></div>
      <div class="stat"><b>${orders.filter(o => o.pay === 'pending').length}</b><span>Pagos pendientes</span></div>
      <div class="stat"><b>${money(cobrado)}</b><span>Cobrado</span></div>
    </div>
    <div class="tools">
      <input id="q" placeholder="Buscar por número, nombre o email" value="${esc(fSearch)}" aria-label="Buscar pedidos">
      <select id="fs" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${opcionesEstado}</select>
    </div>
    <div class="tw"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th class="r">Total</th><th>Estado</th><th>Pago</th><th></th></tr></thead><tbody>${filas}</tbody></table>
    ${list.length ? '' : '<p class="empty">No hay pedidos con ese filtro.</p>'}</div>`;

  $('#q').oninput = e => {
    fSearch = e.target.value;
    drawOrders();
    refocusSearch();
  };
  $('#fs').onchange = e => {
    fStatus = e.target.value;
    drawOrders();
  };
}

function orderDialog(id) {
  const o = orders.find(x => x.id === id);
  const items = o.items.map(i =>
    `<div><span>${esc(i.n)}${i.s ? ' (' + esc(i.s) + ')' : ''} x${i.q}</span><span>${money(i.p * i.q)}</span></div>`
  ).join('');
  const opts = (obj, cur) => Object.entries(obj).map(([k, v]) =>
    `<option value="${k}" ${cur === k ? 'selected' : ''}>${v}</option>`
  ).join('');
  const whatsapp = o.phone
    ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${o.phone.replace(/\D/g, '')}">WhatsApp</a>`
    : '';

  $('#dbody').innerHTML = `<h2>Pedido ${esc(o.num)}</h2>
    <div class="lines">${items}<div><b>Total</b><b>${money(o.total)}</b></div></div>
    <form class="fg" id="of">
      <div class="two">
        <label>Estado del pedido<select name="status">${opts(ST, o.status)}</select></label>
        <label>Estado del pago<select name="pay">${opts(PAY, o.pay)}</select></label>
      </div>
      <label>Nombre<input name="name" value="${esc(o.name)}" required></label>
      <div class="two">
        <label>Email<input name="email" type="email" value="${esc(o.email)}" required></label>
        <label>Teléfono<input name="phone" value="${esc(o.phone)}"></label>
      </div>
      <div class="acts">${whatsapp}
        <button type="button" class="btn ghost" data-close>Cerrar</button>
        <button class="btn" type="submit">Guardar cambios</button>
      </div>
    </form>`;
  $('#dlg').showModal();

  $('#of').onsubmit = e => {
    e.preventDefault();
    Object.assign(o, Object.fromEntries(new FormData(e.target)));
    saveOrders();
    $('#dlg').close();
    drawOrders();
    toast('Pedido actualizado');
  };
}

function drawProducts() {
  const filas = PRODUCTS.map(p => `<tr>
      <td><span class="dot" style="background:${esc(p.col)}"></span></td>
      <td><b>${esc(p.n)}</b></td>
      <td>${esc(p.c)}</td>
      <td class="r">${money(finalPrice(p))}${p.d ? `<br><small><s>${money(p.p)}</s></small>` : ''}</td>
      <td>${p.d ? p.d + '%' : '-'}</td>
      <td>${esc(p.s.join(', ') || 'Único')}</td>
      <td class="r"><button class="btn sm" data-edit="${p.id}">Editar</button><button class="btn sm del" data-delp="${p.id}">Eliminar</button></td>
    </tr>`).join('');

  $('#view').innerHTML = `<div class="head"><h2>Productos</h2><button class="btn" data-new>Nuevo producto</button></div>
    <div class="tw"><table><thead><tr><th>Color</th><th>Nombre</th><th>Categoría</th><th class="r">Precio</th><th>Desc.</th><th>Talles</th><th></th></tr></thead><tbody>${filas}</tbody></table>
    ${PRODUCTS.length ? '' : '<p class="empty">No hay productos. Creá el primero con el botón de arriba.</p>'}</div>`;
}

function productDialog(id) {
  const vacio = { n: '', c: 'remeras', p: '', d: 0, s: [], col: '#151515', t: 'tee' };
  const p = PRODUCTS.find(x => x.id === id) || vacio;
  const opts = (arr, cur) => arr.map(([v, l]) =>
    `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`
  ).join('');

  $('#dbody').innerHTML = `<h2>${id ? 'Editar producto' : 'Nuevo producto'}</h2>
    <form class="fg" id="pf">
      <label>Nombre<input name="n" value="${esc(p.n)}" required></label>
      <div class="two">
        <label>Categoría<select name="c">${opts([['remeras', 'Remeras'], ['buzos', 'Buzos'], ['pantalones', 'Pantalones'], ['accesorios', 'Accesorios']], p.c)}</select></label>
        <label>Tipo de prenda (dibujo)<select name="t">${opts([['tee', 'Remera'], ['hoodie', 'Buzo'], ['pants', 'Pantalón'], ['cap', 'Gorra']], p.t)}</select></label>
      </div>
      <div class="two">
        <label>Precio<input name="p" type="number" min="1" value="${p.p}" required></label>
        <label>Descuento (%)<input name="d" type="number" min="0" max="90" value="${p.d}"></label>
      </div>
      <div class="two">
        <label>Talles (separados por coma)<input name="s" value="${esc(p.s.join(', '))}" placeholder="S, M, L"></label>
        <label>Color de la prenda<input name="col" type="color" value="${esc(p.col)}"></label>
      </div>
      <div class="acts"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div>
    </form>`;
  $('#dlg').showModal();

  $('#pf').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const data = {
      n: f.n.trim(),
      c: f.c,
      t: f.t,
      p: +f.p,
      d: Math.min(90, Math.max(0, +f.d || 0)),
      col: f.col,
      s: f.s.split(',').map(x => x.trim()).filter(Boolean)
    };
    if (id) Object.assign(p, data);
    else PRODUCTS.push({ id: Date.now(), ...data });
    saveProducts();
    $('#dlg').close();
    drawProducts();
    toast('Producto guardado');
  };
}

function drawStock() {
  const rows = PRODUCTS.map(p => {
    const talles = p.s.length ? p.s : ['Único'];
    const qs = talles.map(s => ({ s, q: stockOf(p.id, s === 'Único' && !p.s.length ? null : s) }));
    return {
      p,
      qs,
      total: qs.reduce((sum, x) => sum + x.q, 0),
      out: qs.filter(x => x.q === 0).length,
      low: qs.some(x => x.q > 0 && x.q <= 2)
    };
  });

  const q = fSearch.toLowerCase();
  const list = rows.filter(r => {
    const okText = !q || r.p.n.toLowerCase().includes(q);
    const okStock = !fStock || (fStock === 'out' ? r.out : r.low);
    return okText && okStock;
  });

  const filas = list.map(r => {
    const inputs = r.qs.map(x =>
      `<label>${esc(x.s)}<input type="number" min="0" value="${x.q}" data-sid="${r.p.id}" data-size="${esc(x.s)}"></label>`
    ).join('');
    const estado = r.out ? badge('out', 'Sin stock en ' + r.out) : r.low ? badge('low', 'Stock bajo') : badge('ok', 'Ok');
    return `<tr><td><b>${esc(r.p.n)}</b></td><td><div class="sz-cell">${inputs}</div></td><td class="r">${r.total}</td><td>${estado}</td></tr>`;
  }).join('');

  $('#view').innerHTML = `<div class="head"><h2>Stock</h2></div>
    <div class="stats">
      <div class="stat"><b>${rows.length}</b><span>Productos</span></div>
      <div class="stat"><b>${rows.reduce((sum, r) => sum + r.total, 0)}</b><span>Unidades</span></div>
      <div class="stat"><b>${rows.filter(r => r.low).length}</b><span>Con stock bajo (2 o menos)</span></div>
      <div class="stat"><b>${rows.reduce((sum, r) => sum + r.out, 0)}</b><span>Talles sin stock</span></div>
    </div>
    <div class="tools">
      <input id="q" placeholder="Buscar producto" value="${esc(fSearch)}" aria-label="Buscar producto">
      <select id="fk" aria-label="Filtrar stock">
        <option value="">Todo</option>
        <option value="low" ${fStock === 'low' ? 'selected' : ''}>Stock bajo</option>
        <option value="out" ${fStock === 'out' ? 'selected' : ''}>Sin stock</option>
      </select>
    </div>
    <div class="tw"><table><thead><tr><th>Producto</th><th>Unidades por talle</th><th class="r">Total</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table>
    ${list.length ? '' : '<p class="empty">Ningún producto coincide con el filtro.</p>'}</div>`;

  $('#q').oninput = e => {
    fSearch = e.target.value;
    drawStock();
    refocusSearch();
  };
  $('#fk').onchange = e => {
    fStock = e.target.value;
    drawStock();
  };

  document.querySelectorAll('[data-sid]').forEach(inp => {
    inp.onchange = () => {
      const stock = store.get('stock', {});
      const id = inp.dataset.sid;
      stock[id] = stock[id] || {};
      stock[id][inp.dataset.size] = Math.max(0, parseInt(inp.value) || 0);
      store.set('stock', stock);
      drawStock();
      toast('Stock actualizado');
    };
  });
}

document.addEventListener('click', e => {
  const d = e.target.dataset;

  if (d.view) {
    orderDialog(+d.view);
  } else if (d.delo && confirm('¿Eliminar este pedido? No se puede deshacer.')) {
    orders = orders.filter(o => o.id !== +d.delo);
    saveOrders();
    drawOrders();
    toast('Pedido eliminado');
  } else if (d.new !== undefined) {
    productDialog(null);
  } else if (d.edit) {
    productDialog(+d.edit);
  } else if (d.delp && confirm('¿Eliminar este producto de la tienda?')) {
    PRODUCTS.splice(PRODUCTS.findIndex(p => p.id === +d.delp), 1);
    saveProducts();
    drawProducts();
    toast('Producto eliminado');
  } else if (d.close !== undefined) {
    $('#dlg').close();
  }
});

gate();
