// Guardado simple en localStorage
const store = {
  get(key, def) {
    try {
      const v = JSON.parse(localStorage.getItem('nm_' + key));
      return v === null ? def : v;
    } catch (e) {
      return def;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem('nm_' + key, JSON.stringify(val));
    } catch (e) {}
  }
};

const DEFAULT_PRODUCTS = [
  { id: 1,  n: 'Remera Boxy Lisa',         c: 'remeras',    p: 18500, d: 0,  s: ['S', 'M', 'L', 'XL'],       col: '#151515', t: 'tee',    img: 'img/tee-negra.png' },
  { id: 2,  n: 'Remera Oversize Hueso',    c: 'remeras',    p: 19900, d: 15, s: ['M', 'L', 'XL', 'XXL'],     col: '#e9e6dd', t: 'tee',    img: 'img/tee-marfil.png' },
  { id: 3,  n: 'Remera Pesada Grafito',    c: 'remeras',    p: 21000, d: 0,  s: ['S', 'M', 'L'],             col: '#3b3d40', t: 'tee',    img: 'img/tee-antracita.png' },
  { id: 4,  n: 'Buzo Canguro Frisa',       c: 'buzos',      p: 52000, d: 0,  s: ['S', 'M', 'L', 'XL'],       col: '#151515', t: 'hoodie', img: 'img/buzo-carbon.png' },
  { id: 5,  n: 'Buzo Canguro Oliva',       c: 'buzos',      p: 54500, d: 20, s: ['M', 'L', 'XL'],            col: '#4a5240', t: 'hoodie', img: 'img/buzo-oliva.jpg' },
  { id: 6,  n: 'Buzo Cuello Redondo',      c: 'buzos',      p: 46000, d: 0,  s: ['S', 'M', 'L', 'XL', 'XXL'], col: '#3b3d40', t: 'hoodie', img: 'img/buzo-redondo.jpg' },
  { id: 7,  n: 'Jogger Cargo',             c: 'pantalones', p: 48500, d: 0,  s: ['38', '40', '42', '44'],    col: '#151515', t: 'pants',  img: 'img/jogger-cargo.jpg' },
  { id: 8,  n: 'Pantalón Recto Gabardina', c: 'pantalones', p: 56000, d: 10, s: ['38', '40', '42'],          col: '#5a1f24', t: 'pants',  img: 'img/pantalon-recto.jpg' },
  { id: 9,  n: 'Gorra Visera Curva',       c: 'accesorios', p: 14500, d: 0,  s: [],                          col: '#151515', t: 'cap',    img: 'img/gorra-negra.png' },
  { id: 10, n: 'Gorra Bordada',            c: 'accesorios', p: 15900, d: 0,  s: [],                          col: '#4a5240', t: 'cap',    img: 'img/gorra-bordada.png' },
  { id: 11, n: 'Jogger Cargo Blanco',      c: 'pantalones', p: 48500, d: 0,  s: ['38', '40', '42', '44'],    col: '#f2f2f2', t: 'pants',  img: 'img/jogger-cargo-blanco.png' }
];

// productos que arrancan agotados (si no, todos arrancan con STOCK0)
const DEFAULT_STOCK = {
  11: { '38': 0, '40': 0, '42': 0, '44': 0 }
};

// si ya había productos guardados en el navegador les pongo la foto que les falte
// y, una sola vez, agrego los productos nuevos (seed_v)
const SEED_V = 2;
const saved = store.get('products', null);
let PRODUCTS;
if (saved) {
  PRODUCTS = saved.map(p => {
    const def = DEFAULT_PRODUCTS.find(x => x.id === p.id);
    if (def && def.img && !p.img) p.img = def.img;
    return p;
  });
  if (store.get('seed_v', 1) < SEED_V) {
    DEFAULT_PRODUCTS.forEach(d => {
      if (!PRODUCTS.some(p => p.id === d.id)) PRODUCTS.push(d);
    });
    store.set('products', PRODUCTS);
    store.set('seed_v', SEED_V);
  }
} else {
  PRODUCTS = DEFAULT_PRODUCTS;
  store.set('seed_v', SEED_V);
}

const STOCK0 = 8; // stock inicial por talle

function stockOf(id, size) {
  const st = store.get('stock', {});
  const talle = size || 'Único';
  const v = st[id] && st[id][talle];
  if (v !== undefined) return v;
  const def = DEFAULT_STOCK[id] && DEFAULT_STOCK[id][talle];
  return def !== undefined ? def : STOCK0;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

const SEED_ORDERS = [
  { id: 101, num: 'NM-1005', name: 'Lucía Fernández', email: 'lucia@mail.com',  phone: '3425551234', date: daysAgo(0), status: 'pending',   pay: 'pending',  total: 52000, items: [{ n: 'Buzo Canguro Frisa', s: 'M', q: 1, p: 52000 }] },
  { id: 102, num: 'NM-1004', name: 'Martín Gómez',    email: 'martin@mail.com', phone: '3425559876', date: daysAgo(1), status: 'confirmed', pay: 'paid',     total: 56200, items: [{ n: 'Remera Boxy Lisa', s: 'L', q: 2, p: 18500 }, { n: 'Gorra Bordada', s: null, q: 1, p: 15900 }] },
  { id: 103, num: 'NM-1003', name: 'Camila Ríos',     email: 'cami@mail.com',   phone: '3425554321', date: daysAgo(3), status: 'shipped',   pay: 'paid',     total: 43650, items: [{ n: 'Buzo Canguro Oliva', s: 'L', q: 1, p: 43600 }] },
  { id: 104, num: 'NM-1002', name: 'Tomás Acosta',    email: 'tomas@mail.com',  phone: '3425556789', date: daysAgo(6), status: 'delivered', pay: 'paid',     total: 48500, items: [{ n: 'Jogger Cargo', s: '40', q: 1, p: 48500 }] },
  { id: 105, num: 'NM-1001', name: 'Sofía Paz',       email: 'sofi@mail.com',   phone: '3425550000', date: daysAgo(9), status: 'cancelled', pay: 'refunded', total: 21000, items: [{ n: 'Remera Pesada Grafito', s: 'S', q: 1, p: 21000 }] }
];

function ordersGet() {
  return store.get('orders', SEED_ORDERS);
}
