// Mock data for the POS prototype
// All Indonesian Rupiah; times in minutes elapsed (dari 'now')

const RP = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");

const HOURLY = {
  PS4: 8000,
  PS5: 15000,
};

const PAKET = [
  // PS4 hourly packages (shown on picker)
  { id: "p4-1jam", unit: "PS4", label: "PS4 (1 Jam)", durMin: 60,  price: 10000 },
  { id: "p4-2jam", unit: "PS4", label: "PS4 (2 Jam)", durMin: 120, price: 20000 },
  { id: "p4-3jam", unit: "PS4", label: "PS4 (3 Jam)", durMin: 180, price: 25000 },
  // PS5 hourly packages (shown on picker)
  { id: "p5-1jam", unit: "PS5", label: "PS5 (1 Jam)", durMin: 60,  price: 13000 },
  { id: "p5-2jam", unit: "PS5", label: "PS5 (2 Jam)", durMin: 120, price: 26000 },
  { id: "p5-3jam", unit: "PS5", label: "PS5 (3 Jam)", durMin: 180, price: 34000 },
  { id: "malam", unit: "any", label: "Paket Malam (10 jam)", durMin: 600, price: 80000 },
];

// Initial unit state. status: idle | aktif | paket | selesai | maintenance
const INITIAL_UNITS = [
  { id: "PS4-01", type: "PS4", status: "aktif",   startedAtMinAgo: 47,  pkg: null,                     customer: "Rian",   tab: [{ id: "i1", name: "Indomie Goreng", qty: 1, price: 12000 }, { id: "i2", name: "Es Teh", qty: 2, price: 5000 }] },
  { id: "PS4-02", type: "PS4", status: "paket",   startedAtMinAgo: 92,  pkg: { label: "Paket Hemat 3 Jam", durMin: 180, price: 20000 }, customer: "Bowo",   tab: [{ id: "i1", name: "Kopi Hitam", qty: 1, price: 7000 }] },
  { id: "PS4-03", type: "PS4", status: "idle",    startedAtMinAgo: 0,   pkg: null,                     customer: null,     tab: [] },
  { id: "PS4-04", type: "PS4", status: "aktif",   startedAtMinAgo: 18,  pkg: null,                     customer: "Andi",   tab: [] },
  { id: "PS4-05", type: "PS4", status: "idle",    startedAtMinAgo: 0,   pkg: null,                     customer: null,     tab: [] },
  { id: "PS4-06", type: "PS4", status: "paket",   startedAtMinAgo: 165, pkg: { label: "Paket Hemat 3 Jam", durMin: 180, price: 20000 }, customer: "Sinta",  tab: [{ id: "i1", name: "Kentang Goreng", qty: 1, price: 15000 }, { id: "i2", name: "Es Jeruk", qty: 1, price: 8000 }, { id: "i3", name: "Indomie Telur", qty: 1, price: 14000 }] },
  { id: "PS4-07", type: "PS4", status: "maintenance", startedAtMinAgo: 0, pkg: null,                  customer: null,     tab: [] },
  { id: "PS4-08", type: "PS4", status: "aktif",   startedAtMinAgo: 8,   pkg: null,                     customer: "Tomi",   tab: [{ id: "i1", name: "Es Teh", qty: 1, price: 5000 }] },
  { id: "PS5-01", type: "PS5", status: "aktif",   startedAtMinAgo: 32,  pkg: null,                     customer: "Dimas",  tab: [] },
  { id: "PS5-02", type: "PS5", status: "paket",   startedAtMinAgo: 71,  pkg: { label: "Paket 3 Jam PS5", durMin: 180, price: 40000 }, customer: "Yusuf",  tab: [{ id: "i1", name: "Nasi Goreng Spesial", qty: 1, price: 22000 }, { id: "i2", name: "Es Teh", qty: 2, price: 5000 }] },
  { id: "PS5-03", type: "PS5", status: "idle",    startedAtMinAgo: 0,   pkg: null,                     customer: null,     tab: [] },
  { id: "PS5-04", type: "PS5", status: "aktif",   startedAtMinAgo: 113, pkg: null,                     customer: "Reza",   tab: [{ id: "i1", name: "Kopi Susu", qty: 1, price: 12000 }, { id: "i2", name: "Pisang Goreng", qty: 1, price: 10000 }] },
];

const MENU = [
  // Makanan
  { id: "m-indogor",  name: "Indomie Goreng",      price: 10000, cat: "Makanan", stock: 24, img: "assets/food/indomie-goreng.png?v=2" },
  { id: "m-indorebus",name: "Indomie Rebus",       price: 10000, cat: "Makanan", stock: 24, img: "assets/food/indomie-rebus.png?v=2" },
  { id: "m-kentang",  name: "Kentang Goreng",      price: 13000, cat: "Makanan", stock: 14, img: "assets/food/kentang-goreng.png?v=2" },
  { id: "m-cireng",   name: "Cireng Rujak",        price: 10000, cat: "Makanan", stock: 18, img: "assets/food/cireng-rujak.png?v=2" },
  // Minuman dingin
  { id: "d-esamericano",name:"Es Americano",       price: 10000, cat: "Minuman",  stock: 24, img: "assets/drink/es-americano.png" },
  { id: "d-eskopisusu",name: "Es Kopi Susu",       price: 13000, cat: "Minuman",  stock: 22, img: "assets/drink/es-kopi-susu.png" },
  { id: "d-esteh",     name: "Es Teh Manis",       price: 3000,  cat: "Minuman",  stock: 40, img: "assets/drink/es-teh-manis.png" },
  { id: "d-esnutri",   name: "Es Nutrisari",       price: 4000,  cat: "Minuman",  stock: 30, img: "assets/drink/es-nutrisari.png" },
  // Minuman panas
  { id: "h-hotlatte",  name: "Hot Latte",          price: 12000, cat: "Minuman",   stock: 22, img: "assets/drink/hot-latte.png" },
  { id: "h-hotameri",  name: "Hot Americano",      price: 10000, cat: "Minuman",   stock: 24, img: "assets/drink/hot-americano.png" },
];

// Add-on / extras yang bisa ditambahkan ke transaksi
const ADDONS = [
  { id: "a-telur",    name: "Telur Rebus/Dadar",   price: 2000,  cat: "AddOn", stock: 30, img: "assets/addon/telur.png" },
  { id: "a-kornet",   name: "Kornet",              price: 4000,  cat: "AddOn", stock: 20, img: "assets/addon/kornet.png" },
];

const HISTORY = [
  { id: "TRX-2026-0412", at: "26 Apr 26 · 14:22", unit: "PS5-02", customer: "Yusuf",  durMin: 195, sewa: 48750, fnb: 32000, total: 80750, pay: "QRIS" },
  { id: "TRX-2026-0411", at: "26 Apr 26 · 13:58", unit: "PS4-04", customer: "Andi",   durMin: 60,  sewa: 8000,  fnb: 0,     total: 8000,  pay: "Cash" },
  { id: "TRX-2026-0410", at: "26 Apr 26 · 13:30", unit: "PS4-08", customer: "—",      durMin: 90,  sewa: 12000, fnb: 5000,  total: 17000, pay: "Cash" },
  { id: "TRX-2026-0409", at: "26 Apr 26 · 12:47", unit: "PS5-04", customer: "Reza",   durMin: 240, sewa: 60000, fnb: 22000, total: 82000, pay: "QRIS" },
  { id: "TRX-2026-0408", at: "26 Apr 26 · 12:10", unit: "PS4-01", customer: "—",      durMin: 120, sewa: 16000, fnb: 17000, total: 33000, pay: "Cash" },
  { id: "TRX-2026-0407", at: "26 Apr 26 · 11:35", unit: "PS4-06", customer: "Sinta",  durMin: 180, sewa: 20000, fnb: 27000, total: 47000, pay: "QRIS" },
  { id: "TRX-2026-0406", at: "26 Apr 26 · 11:02", unit: "PS5-01", customer: "—",      durMin: 60,  sewa: 15000, fnb: 12000, total: 27000, pay: "Cash" },
  { id: "TRX-2026-0405", at: "26 Apr 26 · 10:24", unit: "PS4-02", customer: "—",      durMin: 90,  sewa: 12000, fnb: 7000,  total: 19000, pay: "Cash" },
  { id: "TRX-2026-0404", at: "26 Apr 26 · 09:48", unit: "PS4-04", customer: "Bowo",   durMin: 180, sewa: 20000, fnb: 14000, total: 34000, pay: "QRIS" },
  { id: "TRX-2026-0403", at: "26 Apr 26 · 09:11", unit: "PS5-04", customer: "—",      durMin: 60,  sewa: 15000, fnb: 0,     total: 15000, pay: "Cash" },
];

// Hourly chart data for shift report (10:00 - 22:00)
const SHIFT_HOURS = [
  { h: "10", sewa: 35000,  fnb: 0 },
  { h: "11", sewa: 47000,  fnb: 19000 },
  { h: "12", sewa: 76000,  fnb: 39000 },
  { h: "13", sewa: 108000, fnb: 22000 },
  { h: "14", sewa: 132000, fnb: 32000 },
  { h: "15", sewa: 95000,  fnb: 17000 },
  { h: "16", sewa: 64000,  fnb: 14000 },
  { h: "17", sewa: 88000,  fnb: 28000 },
  { h: "18", sewa: 145000, fnb: 51000 },
  { h: "19", sewa: 187000, fnb: 67000 },
  { h: "20", sewa: 168000, fnb: 58000 },
  { h: "21", sewa: 122000, fnb: 41000 },
];

// ---------------------------------------------------------------------------
// Seeds for the centralised inventory store (inventory-store.jsx).
// These are written to localStorage on first run. After that the store is the
// source of truth and these seeds are ignored.
// ---------------------------------------------------------------------------
const BAHAN_BAKU_SEED = [
  { id: "bb-indogor",  name: "Indomie Goreng",  price: 3500,   stock: 48 },
  { id: "bb-indorebus",name: "Indomie Rebus",   price: 3500,   stock: 48 },
  { id: "bb-cireng",   name: "Cireng Rujak",    price: 8000,   stock: 30 },
  { id: "bb-kentang",  name: "Kentang Goreng",  price: 6500,   stock: 25 },
  { id: "bb-kopi",     name: "Biji Kopi",       price: 180000, stock: 3 },
  { id: "bb-matcha",   name: "Matcha Powder",   price: 95000,  stock: 2 },
  { id: "bb-nutri",    name: "Nutrisari",       price: 1500,   stock: 60 },
  { id: "bb-teh",      name: "Teh Celup",       price: 500,    stock: 200 },
  { id: "bb-gula",     name: "Gula Pasir",      price: 14000,  stock: 8 },
  { id: "bb-brown",    name: "Brown Sugar",     price: 22000,  stock: 4 },
  { id: "bb-krimer",   name: "Krimer",          price: 28000,  stock: 5 },
  { id: "bb-telur",    name: "Telur",           price: 1800,   stock: 120 },
  { id: "bb-sambal",   name: "Sambal",          price: 12000,  stock: 6 },
  { id: "bb-cup12",    name: "Cup 12 oz",       price: 450,    stock: 500 },
  { id: "bb-cup10",    name: "Cup 10 oz",       price: 380,    stock: 500 },
  { id: "bb-sedotan",  name: "Sedotan",         price: 150,    stock: 800 },
  { id: "bb-sealer",   name: "Cup Sealer",      price: 850,    stock: 600 },
  { id: "bb-tisu",     name: "Tisu",            price: 8000,   stock: 24 },
];

const ELEKTRONIK_SEED = [
  { id: "ps4-01", name: "Playstation 4",            unit: "Console",        stock: 8, status: "Ready" },
  { id: "ps5-01", name: "Playstation 5",            unit: "Console",        stock: 4, status: "Ready" },
  { id: "tv-pol", name: "UHD TV Polytron 43\"",     unit: "Display",        stock: 4, status: "Ready" },
  { id: "tv-tcl", name: "UHD TV TCL 43\"",          unit: "Display",        stock: 4, status: "Ready" },
  { id: "kulkas", name: "Kulkas",                   unit: "Pendingin",      stock: 1, status: "Non-Sewa" },
  { id: "ferro",  name: "Mesin Kopi Ferrati Ferro", unit: "Coffee Machine", stock: 1, status: "Non-Sewa" },
  { id: "bean",   name: "Bean Bags",                unit: "Furniture",      stock: 12, status: "Ready" },
  { id: "ac-pan", name: "AC Panasonic 1PK",         unit: "Pendingin",      stock: 2, status: "Non-Sewa" },
];

// Recipes: product_id -> [{ ingredient_id, qty }, ...]
// "qty" is how many units of the ingredient are consumed per 1 unit of product.
const RECIPES_SEED = {
  "m-indogor":     [{ ingredient_id: "bb-indogor",   qty: 1 }, { ingredient_id: "bb-telur",   qty: 1 }],
  "m-indorebus":   [{ ingredient_id: "bb-indorebus", qty: 1 }, { ingredient_id: "bb-telur",   qty: 1 }],
  "m-kentang":     [{ ingredient_id: "bb-kentang",   qty: 1 }, { ingredient_id: "bb-sambal",  qty: 1 }],
  "m-cireng":      [{ ingredient_id: "bb-cireng",    qty: 1 }, { ingredient_id: "bb-sambal",  qty: 1 }],
  "d-esamericano": [{ ingredient_id: "bb-kopi",      qty: 1 }, { ingredient_id: "bb-cup12",   qty: 1 }, { ingredient_id: "bb-sedotan", qty: 1 }],
  "d-eskopisusu":  [{ ingredient_id: "bb-kopi",      qty: 1 }, { ingredient_id: "bb-krimer",  qty: 1 }, { ingredient_id: "bb-gula",    qty: 1 }, { ingredient_id: "bb-cup12", qty: 1 }, { ingredient_id: "bb-sedotan", qty: 1 }],
  "d-esteh":       [{ ingredient_id: "bb-teh",       qty: 1 }, { ingredient_id: "bb-gula",    qty: 1 }, { ingredient_id: "bb-cup12",   qty: 1 }, { ingredient_id: "bb-sedotan", qty: 1 }],
  "d-esnutri":     [{ ingredient_id: "bb-nutri",     qty: 1 }, { ingredient_id: "bb-cup12",   qty: 1 }, { ingredient_id: "bb-sedotan", qty: 1 }],
  "h-hotlatte":    [{ ingredient_id: "bb-kopi",      qty: 1 }, { ingredient_id: "bb-krimer",  qty: 1 }, { ingredient_id: "bb-cup10",   qty: 1 }],
  "h-hotameri":    [{ ingredient_id: "bb-kopi",      qty: 1 }, { ingredient_id: "bb-cup10",   qty: 1 }],
  "a-telur":       [{ ingredient_id: "bb-telur",     qty: 1 }],
  "a-kornet":      [],
};

Object.assign(window, {
  RP, HOURLY, PAKET, INITIAL_UNITS, MENU, ADDONS, HISTORY, SHIFT_HOURS,
  BAHAN_BAKU_SEED, ELEKTRONIK_SEED, RECIPES_SEED,
});
