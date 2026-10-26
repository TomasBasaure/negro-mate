// Datos compartidos entre la tienda (index.html) y el panel (admin.html).
// Todo se guarda en localStorage con el prefijo nm_
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('nm_' + k)); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nm_' + k, JSON.stringify(v)); } catch (e) {} }
};

const DEFAULT_PRODUCTS = [
  { id: 1,  n: 'Remera Boxy Lisa',     c: 'remeras',     p: 18500, d: 0,  s: ['S','M','L','XL'],        col: '#151515', t: 'tee' },
  { id: 2,  n: 'Remera Oversize Hueso',c: 'remeras',     p: 19900, d: 15, s: ['M','L','XL','XXL'],      col: '#e9e6dd', t: 'tee' },
  { id: 3,  n: 'Remera Pesada Grafito',c: 'remeras',     p: 21000, d: 0,  s: ['S','M','L'],             col: '#3b3d40', t: 'tee' },
  { id: 4,  n: 'Buzo Canguro Frisa',   c: 'buzos',       p: 52000, d: 0,  s: ['S','M','L','XL'],        col: '#151515', t: 'hoodie' },
  { id: 5,  n: 'Buzo Canguro Oliva',   c: 'buzos',       p: 54500, d: 20, s: ['M','L','XL'],            col: '#4a5240', t: 'hoodie' },
  { id: 6,  n: 'Buzo Cuello Redondo',  c: 'buzos',       p: 46000, d: 0,  s: ['S','M','L','XL','XXL'],  col: '#3b3d40', t: 'hoodie' },
  { id: 7,  n: 'Jogger Cargo',         c: 'pantalones',  p: 48500, d: 0,  s: ['38','40','42','44'],     col: '#151515', t: 'pants' },
  { id: 8,  n: 'Pantalón Recto Gabardina', c: 'pantalones', p: 56000, d: 10, s: ['38','40','42'],       col: '#5a1f24', t: 'pants' },
  { id: 9,  n: 'Gorra Visera Curva',   c: 'accesorios',  p: 14500, d: 0,  s: [],                        col: '#151515', t: 'cap' },
  { id: 10, n: 'Gorra Bordada',        c: 'accesorios',  p: 15900, d: 0,  s: [],                        col: '#4a5240', t: 'cap' }
];
const PRODUCTS = store.get('products', DEFAULT_PRODUCTS);

const STOCK0 = 8; // stock inicial por talle si nadie lo cargó
const stockOf = (id, size) => { const s = store.get('stock', {}); const v = s[id] && s[id][size || 'Único']; return v === undefined ? STOCK0 : v; };

const day = n => new Date(Date.now() - n * 864e5).toISOString();
const SEED_ORDERS = [
  { id: 101, num: 'NM-1005', name: 'Lucía Fernández', email: 'lucia@mail.com', phone: '3425551234', date: day(0), status: 'pending',   pay: 'pending', total: 52000, items: [{ n: 'Buzo Canguro Frisa', s: 'M', q: 1, p: 52000 }] },
  { id: 102, num: 'NM-1004', name: 'Martín Gómez',    email: 'martin@mail.com', phone: '3425559876', date: day(1), status: 'confirmed', pay: 'paid',    total: 56200, items: [{ n: 'Remera Boxy Lisa', s: 'L', q: 2, p: 18500 }, { n: 'Gorra Bordada', s: null, q: 1, p: 15900 }] },
  { id: 103, num: 'NM-1003', name: 'Camila Ríos',     email: 'cami@mail.com', phone: '3425554321', date: day(3), status: 'shipped',   pay: 'paid',    total: 43650, items: [{ n: 'Buzo Canguro Oliva', s: 'L', q: 1, p: 43600 }] },
  { id: 104, num: 'NM-1002', name: 'Tomás Acosta',    email: 'tomas@mail.com', phone: '3425556789', date: day(6), status: 'delivered', pay: 'paid',    total: 48500, items: [{ n: 'Jogger Cargo', s: '40', q: 1, p: 48500 }] },
  { id: 105, num: 'NM-1001', name: 'Sofía Paz',       email: 'sofi@mail.com', phone: '3425550000', date: day(9), status: 'cancelled', pay: 'refunded', total: 21000, items: [{ n: 'Remera Pesada Grafito', s: 'S', q: 1, p: 21000 }] }
];
const ordersGet = () => store.get('orders', SEED_ORDERS);
