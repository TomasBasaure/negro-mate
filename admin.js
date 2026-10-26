const USER = 'admin', PASS = 'demo1234';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString('es-AR');
const fdate = d => new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
const ST = { pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const PAY = { pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado' };
const badge = (k, l) => `<span class="bd s-${k}">${l}</span>`;
const final = p => p.p * (1 - p.d / 100);
let tab = 'orders', fStatus = '', fSearch = '', fStock = '';
let orders = ordersGet();
const saveP = () => store.set('products', PRODUCTS);
const saveO = () => store.set('orders', orders);
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; t.setAttribute('role', 'status'); document.body.append(t); setTimeout(() => t.remove(), 2200); }

// ---------- sesión ----------
const logged = () => sessionStorage.getItem('nm_admin') === '1';
function gate() { $('#login').hidden = logged(); $('#panel').hidden = !logged(); if (logged()) draw(); }
$('#lf').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (f.get('u') === USER && f.get('p') === PASS) { sessionStorage.setItem('nm_admin', '1'); $('#lerr').textContent = ''; gate(); }
  else $('#lerr').textContent = 'Usuario o contraseña incorrectos.';
});
$('#logout').onclick = () => { sessionStorage.removeItem('nm_admin'); gate(); };
$('#tabs').addEventListener('click', e => {
  if (!e.target.dataset.t) return;
  tab = e.target.dataset.t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b === e.target));
  draw();
});
function draw() { ({ orders: drawOrders, products: drawProducts, stock: drawStock })[tab](); }

// ---------- pedidos ----------
function drawOrders() {
  const paid = orders.filter(o => o.pay === 'paid').reduce((a, o) => a + o.total, 0);
  const q = fSearch.toLowerCase();
  const list = orders.filter(o => (!fStatus || o.status === fStatus) &&
    (!q || [o.num, o.name, o.email].some(x => x.toLowerCase().includes(q))));
  $('#view').innerHTML = `
    <div class="head"><h2>Pedidos</h2></div>
    <div class="stats">
      <div class="stat"><b>${orders.length}</b><span>Pedidos en total</span></div>
      <div class="stat"><b>${orders.filter(o => o.status === 'pending').length}</b><span>Por confirmar</span></div>
      <div class="stat"><b>${orders.filter(o => o.pay === 'pending').length}</b><span>Pagos pendientes</span></div>
      <div class="stat"><b>${money(paid)}</b><span>Cobrado</span></div>
    </div>
    <div class="tools">
      <input id="q" placeholder="Buscar por número, nombre o email" value="${esc(fSearch)}" aria-label="Buscar pedidos">
      <select id="fs" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${fStatus === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    <div class="tw"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th class="r">Total</th><th>Estado</th><th>Pago</th><th></th></tr></thead><tbody>
    ${list.map(o => `<tr><td><b>${esc(o.num)}</b></td><td>${esc(o.name)}<br><small>${esc(o.email)}</small></td><td>${fdate(o.date)}</td><td class="r">${money(o.total)}</td>
      <td>${badge(o.status, ST[o.status])}</td><td>${badge(o.pay, PAY[o.pay])}</td>
      <td class="r"><button class="btn sm" data-view="${o.id}">Ver / editar</button><button class="btn sm del" data-delo="${o.id}">Eliminar</button></td></tr>`).join('')}
    </tbody></table>${list.length ? '' : '<p class="empty">No hay pedidos con ese filtro.</p>'}</div>`;
  $('#q').oninput = e => { fSearch = e.target.value; drawOrders(); const i = $('#q'); i.focus(); i.setSelectionRange(99, 99); };
  $('#fs').onchange = e => { fStatus = e.target.value; drawOrders(); };
}
function orderDialog(id) {
  const o = orders.find(x => x.id === id);
  $('#dbody').innerHTML = `<h2>Pedido ${esc(o.num)}</h2>
    <div class="lines">${o.items.map(i => `<div><span>${esc(i.n)}${i.s ? ' (' + esc(i.s) + ')' : ''} x${i.q}</span><span>${money(i.p * i.q)}</span></div>`).join('')}
      <div><b>Total</b><b>${money(o.total)}</b></div></div>
    <form class="fg" id="of">
      <div class="two"><label>Estado del pedido<select name="status">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Estado del pago<select name="pay">${Object.entries(PAY).map(([k, v]) => `<option value="${k}" ${o.pay === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
      <label>Nombre<input name="name" value="${esc(o.name)}" required></label>
      <div class="two"><label>Email<input name="email" type="email" value="${esc(o.email)}" required></label>
      <label>Teléfono<input name="phone" value="${esc(o.phone)}"></label></div>
      <div class="acts">${o.phone ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${o.phone.replace(/\D/g, '')}">WhatsApp</a>` : ''}
        <button type="button" class="btn ghost" data-close>Cerrar</button><button class="btn" type="submit">Guardar cambios</button></div>
    </form>`;
  $('#dlg').showModal();
  $('#of').onsubmit = e => {
    e.preventDefault();
    Object.assign(o, Object.fromEntries(new FormData(e.target)));
    saveO(); $('#dlg').close(); drawOrders(); toast('Pedido actualizado');
  };
}

// ---------- productos ----------
function drawProducts() {
  $('#view').innerHTML = `<div class="head"><h2>Productos</h2><button class="btn" data-new>Nuevo producto</button></div>
    <div class="tw"><table><thead><tr><th>Color</th><th>Nombre</th><th>Categoría</th><th class="r">Precio</th><th>Desc.</th><th>Talles</th><th></th></tr></thead><tbody>
    ${PRODUCTS.map(p => `<tr><td><span class="dot" style="background:${esc(p.col)}"></span></td><td><b>${esc(p.n)}</b></td><td>${esc(p.c)}</td>
      <td class="r">${money(final(p))}${p.d ? `<br><small><s>${money(p.p)}</s></small>` : ''}</td><td>${p.d ? p.d + '%' : '-'}</td><td>${esc(p.s.join(', ') || 'Único')}</td>
      <td class="r"><button class="btn sm" data-edit="${p.id}">Editar</button><button class="btn sm del" data-delp="${p.id}">Eliminar</button></td></tr>`).join('')}
    </tbody></table>${PRODUCTS.length ? '' : '<p class="empty">No hay productos. Creá el primero con el botón de arriba.</p>'}</div>`;
}
function productDialog(id) {
  const p = PRODUCTS.find(x => x.id === id) || { n: '', c: 'remeras', p: '', d: 0, s: [], col: '#151515', t: 'tee' };
  const opt = (arr, cur) => arr.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`).join('');
  $('#dbody').innerHTML = `<h2>${id ? 'Editar producto' : 'Nuevo producto'}</h2>
    <form class="fg" id="pf">
      <label>Nombre<input name="n" value="${esc(p.n)}" required></label>
      <div class="two"><label>Categoría<select name="c">${opt([['remeras', 'Remeras'], ['buzos', 'Buzos'], ['pantalones', 'Pantalones'], ['accesorios', 'Accesorios']], p.c)}</select></label>
      <label>Tipo de prenda (dibujo)<select name="t">${opt([['tee', 'Remera'], ['hoodie', 'Buzo'], ['pants', 'Pantalón'], ['cap', 'Gorra']], p.t)}</select></label></div>
      <div class="two"><label>Precio<input name="p" type="number" min="1" value="${p.p}" required></label>
      <label>Descuento (%)<input name="d" type="number" min="0" max="90" value="${p.d}"></label></div>
      <div class="two"><label>Talles (separados por coma)<input name="s" value="${esc(p.s.join(', '))}" placeholder="S, M, L"></label>
      <label>Color de la prenda<input name="col" type="color" value="${esc(p.col)}"></label></div>
      <div class="acts"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div>
    </form>`;
  $('#dlg').showModal();
  $('#pf').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const data = { n: f.n.trim(), c: f.c, t: f.t, p: +f.p, d: Math.min(90, Math.max(0, +f.d || 0)), col: f.col,
      s: f.s.split(',').map(x => x.trim()).filter(Boolean) };
    if (id) Object.assign(p, data); else PRODUCTS.push({ id: Date.now(), ...data });
    saveP(); $('#dlg').close(); drawProducts(); toast('Producto guardado');
  };
}

// ---------- stock ----------
function drawStock() {
  const st = store.get('stock', {});
  const rows = PRODUCTS.map(p => {
    const sizes = p.s.length ? p.s : ['Único'];
    const qs = sizes.map(s => ({ s, q: stockOf(p.id, s === 'Único' && !p.s.length ? null : s) }));
    return { p, qs, total: qs.reduce((a, x) => a + x.q, 0), out: qs.filter(x => x.q === 0).length, low: qs.some(x => x.q > 0 && x.q <= 2) };
  });
  const q = fSearch.toLowerCase();
  const list = rows.filter(r => (!q || r.p.n.toLowerCase().includes(q)) &&
    (!fStock || (fStock === 'out' ? r.out : r.low)));
  $('#view').innerHTML = `<div class="head"><h2>Stock</h2></div>
    <div class="stats">
      <div class="stat"><b>${rows.length}</b><span>Productos</span></div>
      <div class="stat"><b>${rows.reduce((a, r) => a + r.total, 0)}</b><span>Unidades</span></div>
      <div class="stat"><b>${rows.filter(r => r.low).length}</b><span>Con stock bajo (2 o menos)</span></div>
      <div class="stat"><b>${rows.reduce((a, r) => a + r.out, 0)}</b><span>Talles sin stock</span></div>
    </div>
    <div class="tools"><input id="q" placeholder="Buscar producto" value="${esc(fSearch)}" aria-label="Buscar producto">
      <select id="fk" aria-label="Filtrar stock"><option value="">Todo</option><option value="low" ${fStock === 'low' ? 'selected' : ''}>Stock bajo</option><option value="out" ${fStock === 'out' ? 'selected' : ''}>Sin stock</option></select></div>
    <div class="tw"><table><thead><tr><th>Producto</th><th>Unidades por talle</th><th class="r">Total</th><th>Estado</th></tr></thead><tbody>
    ${list.map(r => `<tr><td><b>${esc(r.p.n)}</b></td>
      <td><div class="sz-cell">${r.qs.map(x => `<label>${esc(x.s)}<input type="number" min="0" value="${x.q}" data-sid="${r.p.id}" data-size="${esc(x.s)}"></label>`).join('')}</div></td>
      <td class="r">${r.total}</td><td>${r.out ? badge('out', 'Sin stock en ' + r.out) : r.low ? badge('low', 'Stock bajo') : badge('ok', 'Ok')}</td></tr>`).join('')}
    </tbody></table>${list.length ? '' : '<p class="empty">Ningún producto coincide con el filtro.</p>'}</div>`;
  $('#q').oninput = e => { fSearch = e.target.value; drawStock(); const i = $('#q'); i.focus(); i.setSelectionRange(99, 99); };
  $('#fk').onchange = e => { fStock = e.target.value; drawStock(); };
  document.querySelectorAll('[data-sid]').forEach(inp => inp.onchange = () => {
    const s = store.get('stock', {}); const id = inp.dataset.sid;
    s[id] = s[id] || {}; s[id][inp.dataset.size] = Math.max(0, parseInt(inp.value) || 0);
    store.set('stock', s); drawStock(); toast('Stock actualizado');
  });
}

// ---------- clicks globales ----------
document.addEventListener('click', e => {
  const d = e.target.dataset;
  if (d.view) orderDialog(+d.view);
  else if (d.delo && confirm('¿Eliminar este pedido? No se puede deshacer.')) { orders = orders.filter(o => o.id !== +d.delo); saveO(); drawOrders(); toast('Pedido eliminado'); }
  else if (d.new !== undefined) productDialog(null);
  else if (d.edit) productDialog(+d.edit);
  else if (d.delp && confirm('¿Eliminar este producto de la tienda?')) { PRODUCTS.splice(PRODUCTS.findIndex(p => p.id === +d.delp), 1); saveP(); drawProducts(); toast('Producto eliminado'); }
  else if (d.close !== undefined) $('#dlg').close();
});
gate();
