// inventory-store.jsx
// ============================================================================
// SINGLE SOURCE OF TRUTH for products, ingredients, electronics, and recipes.
// All panels (Dashboard, Menu Manager, Reports, Cart, Export) read from this
// store via React hooks. No panel keeps its own copy of product/stock data.
//
// Data is persisted to localStorage and seeded from data.jsx on first run.
//
// Public API (mounted on `window`):
//   Hooks (auto-rerender on change):
//     useProducts()      -> Product[]
//     useIngredients()   -> Ingredient[]
//     useElectronics()   -> Electronic[]
//
//   Mutations:
//     updateProductPrice(id, newPrice)
//     updateProduct(id, patch)
//     addProduct(product)
//     deleteProduct(id)
//     updateStock(id, delta, kind?)        kind: "product" | "ingredient"
//     deductIngredients(productId, qty)    apply recipe → ingredients
//     addIngredient / updateIngredient / deleteIngredient
//     addElectronic  / updateElectronic  / deleteElectronic
//     getRecipe(id)      / setRecipe(id, recipe)
//
//   Checkout:
//     processTransaction({ cart, payMethod, customer }) ->
//       1. Re-resolves LIVE prices from the products store
//       2. Decrements product stock for every cart line
//       3. Deducts each line's recipe ingredients from the ingredients store
//       4. Persists the transaction via window.addTransaction (store.jsx)
//       5. All subscribed components rerender automatically
// ============================================================================

const INV_PROD_KEY   = "warming-pos.products.v1";
const INV_ING_KEY    = "warming-pos.ingredients.v1";
const INV_EL_KEY     = "warming-pos.electronics.v1";
const INV_RECIPE_KEY = "warming-pos.recipes.v1";

// ---------- localStorage IO ----------
function _load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function _save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function loadProducts()    { return _load(INV_PROD_KEY, []); }
function saveProducts(v)   { _save(INV_PROD_KEY, v); }
function loadIngredients() { return _load(INV_ING_KEY, []); }
function saveIngredients(v){ _save(INV_ING_KEY, v); }
function loadElectronics() { return _load(INV_EL_KEY, []); }
function saveElectronics(v){ _save(INV_EL_KEY, v); }
function loadRecipes()     { return _load(INV_RECIPE_KEY, {}); }
function saveRecipes(v)    { _save(INV_RECIPE_KEY, v); }

// ---------- Seeding (idempotent) ----------
function seedIfEmpty() {
  if (!localStorage.getItem(INV_PROD_KEY)) {
    const menu  = (window.MENU   || []).map(m => ({ ...m, recipe: undefined }));
    const addon = (window.ADDONS || []).map(a => ({ ...a, recipe: undefined }));
    // Unified product list — `cat` distinguishes Makanan / Minuman / AddOn.
    saveProducts([...menu, ...addon]);
  }
  if (!localStorage.getItem(INV_ING_KEY)) {
    saveIngredients(window.BAHAN_BAKU_SEED || []);
  }
  if (!localStorage.getItem(INV_EL_KEY)) {
    saveElectronics(window.ELEKTRONIK_SEED || []);
  }
  if (!localStorage.getItem(INV_RECIPE_KEY)) {
    saveRecipes(window.RECIPES_SEED || {});
  }
}
seedIfEmpty();
async function syncProductsFromSupabase() {
  const client = window.supabaseClient;
  if (!client) return;

  const { data, error } = await client
    .from("products")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const mapped = (data || []).map((p, i) => ({
    id: p.id ?? `supabase-${i + 1}`,
    name: p.name,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    cat: p.cat || "Makanan",
    img: p.img || ""
  }));

  saveProducts(mapped);
  notifyProd();
}

syncProductsFromSupabase();
// ---------- Image path migration ----------
// Fixes stale "assets/..." paths in localStorage when running as a standalone
// file (where images are inlined as base64 data URIs in window.MENU / window.ADDONS).
// Only rewrites products whose img still starts with "assets/" and whose ID
// matches a seeded item that now has an inline URI — leaves custom products alone.
(function migrateImages() {
  const prods = loadProducts();
  // Build a lookup: id → img from the current seed data
  const inline = {};
  for (const m of [...(window.MENU || []), ...(window.ADDONS || [])]) {
    if (m.id && m.img && !String(m.img).startsWith("assets/")) {
      inline[m.id] = m.img;
    }
  }
  if (Object.keys(inline).length === 0) return; // server mode — nothing to migrate
  let dirty = false;
  const patched = prods.map(p => {
    if (p.img && String(p.img).startsWith("assets/") && inline[p.id]) {
      dirty = true;
      return { ...p, img: inline[p.id] };
    }
    return p;
  });
  if (dirty) saveProducts(patched);
})();

// ---------- Pub/sub ----------
const prodSubs = new Set();
const ingSubs  = new Set();
const elSubs   = new Set();
function notifyProd() { prodSubs.forEach(fn => fn()); }
function notifyIng()  { ingSubs.forEach(fn  => fn()); }
function notifyEl()   { elSubs.forEach(fn   => fn()); }

// ---------- React hooks ----------
function useProducts() {
  const [v, set] = React.useState(loadProducts);
  React.useEffect(() => {
    const cb = () => set(loadProducts());
    prodSubs.add(cb);
    return () => prodSubs.delete(cb);
  }, []);
  return v;
}
function useIngredients() {
  const [v, set] = React.useState(loadIngredients);
  React.useEffect(() => {
    const cb = () => set(loadIngredients());
    ingSubs.add(cb);
    return () => ingSubs.delete(cb);
  }, []);
  return v;
}
function useElectronics() {
  const [v, set] = React.useState(loadElectronics);
  React.useEffect(() => {
    const cb = () => set(loadElectronics());
    elSubs.add(cb);
    return () => elSubs.delete(cb);
  }, []);
  return v;
}

// ---------- Product mutations ----------
function updateProductPrice(productId, newPrice) {
  const p = Number(newPrice) || 0;
  saveProducts(loadProducts().map(x => x.id === productId ? { ...x, price: p } : x));
  notifyProd();
}
function updateProduct(productId, patch) {
  saveProducts(loadProducts().map(x => x.id === productId ? { ...x, ...patch } : x));
  notifyProd();
}
function addProduct(product) {
  saveProducts([product, ...loadProducts()]);
  notifyProd();
}
function deleteProduct(productId) {
  saveProducts(loadProducts().filter(x => x.id !== productId));
  const r = loadRecipes(); delete r[productId]; saveRecipes(r);
  notifyProd();
}

// Generic stock change. delta can be negative (decrement) or positive (return).
function updateStock(itemId, delta, kind = "product") {
  const d = Number(delta) || 0;
  if (kind === "ingredient") {
    saveIngredients(loadIngredients().map(i =>
      i.id === itemId ? { ...i, stock: Math.max(0, (Number(i.stock) || 0) + d) } : i
    ));
    notifyIng();
  } else {
    saveProducts(loadProducts().map(p =>
      p.id === itemId ? { ...p, stock: Math.max(0, (Number(p.stock) || 0) + d) } : p
    ));
    notifyProd();
  }
}

// Convenience aliases used during checkout.
function decrementProductStock(productId, qty) { updateStock(productId, -Math.abs(qty), "product"); }
function decrementIngredientStock(ingredientId, qty) { updateStock(ingredientId, -Math.abs(qty), "ingredient"); }

// ---------- Ingredient mutations ----------
function addIngredient(item) {
  saveIngredients([item, ...loadIngredients()]);
  notifyIng();
}
function updateIngredient(id, patch) {
  saveIngredients(loadIngredients().map(i => i.id === id ? { ...i, ...patch } : i));
  notifyIng();
}
function deleteIngredient(id) {
  saveIngredients(loadIngredients().filter(i => i.id !== id));
  notifyIng();
}

// ---------- Electronics mutations ----------
function addElectronic(item) {
  saveElectronics([item, ...loadElectronics()]);
  notifyEl();
}
function updateElectronic(id, patch) {
  saveElectronics(loadElectronics().map(e => e.id === id ? { ...e, ...patch } : e));
  notifyEl();
}
function deleteElectronic(id) {
  saveElectronics(loadElectronics().filter(e => e.id !== id));
  notifyEl();
}

// ---------- Recipes ----------
function getRecipe(productId) {
  return loadRecipes()[productId] || [];
}
function setRecipe(productId, recipe) {
  const all = loadRecipes();
  all[productId] = (recipe || []).map(r => ({ ingredient_id: r.ingredient_id, qty: Number(r.qty) || 0 }));
  saveRecipes(all);
  notifyProd(); // products view may show recipe info
}

// Deduct all ingredients required to produce `qty` units of `productId`.
// Bulk update so we only fire notifyIng once.
function deductIngredients(productId, qty) {
  const recipe = getRecipe(productId);
  if (!recipe.length) return;
  const factor = Number(qty) || 0;
  if (factor === 0) return;
  const list = loadIngredients();
  const next = list.map(i => {
    const line = recipe.find(r => r.ingredient_id === i.id);
    if (!line) return i;
    const used = (Number(line.qty) || 0) * factor;
    return { ...i, stock: Math.max(0, (Number(i.stock) || 0) - used) };
  });
  saveIngredients(next);
  notifyIng();
}

// ---------- Lookups ----------
function getProduct(productId)  { return loadProducts().find(p => p.id === productId) || null; }
function getLivePrice(productId){ const p = getProduct(productId); return p ? Number(p.price) || 0 : 0; }

// ---------- Checkout ----------
// Single entry point used by Dashboard when "Bayar" is pressed. All side
// effects (stock + ingredients + transaction history) happen here in one
// place so every screen stays in sync.
function processTransaction({ cart, payMethod, customer }) {
  // 1. Resolve LIVE price/label/category from the products store. The cart
  //    snapshot may be stale if the cashier changed inventory while
  //    building the cart — the store wins.
  const resolved = cart.map(line => {
    if (line.kind !== "item") return line;
    const live = getProduct(line.id);
    if (!live) return line; // product was deleted; fall back to cart snapshot
    return {
      ...line,
      label: live.name,
      price: Number(live.price) || 0,
      sub:   live.cat || line.sub,
    };
  });

  const total = resolved.reduce((s, c) => s + (Number(c.price) || 0) * (Number(c.qty) || 0), 0);

  // 2. Decrement product stock + 3. deduct recipe ingredients.
  // Batched so notifications fire once per store.
  const products = loadProducts();
  const ingredients = loadIngredients();
  const recipes = loadRecipes();

  const nextProducts = products.map(p => {
    const lines = resolved.filter(l => l.kind === "item" && l.id === p.id);
    if (!lines.length) return p;
    const used = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0);
    return { ...p, stock: Math.max(0, (Number(p.stock) || 0) - used) };
  });

  const ingredientDelta = new Map();
  for (const line of resolved) {
    if (line.kind !== "item") continue;
    const recipe = recipes[line.id] || [];
    for (const step of recipe) {
      const prev = ingredientDelta.get(step.ingredient_id) || 0;
      ingredientDelta.set(step.ingredient_id, prev + (Number(step.qty) || 0) * (Number(line.qty) || 0));
    }
  }
  const nextIngredients = ingredients.map(i => {
    const used = ingredientDelta.get(i.id);
    if (!used) return i;
    return { ...i, stock: Math.max(0, (Number(i.stock) || 0) - used) };
  });

  saveProducts(nextProducts);
  saveIngredients(nextIngredients);
  notifyProd();
  notifyIng();

  // 4. Persist transaction history (store.jsx).
  let trxId = null;
  if (window.addTransaction) {
    trxId = window.addTransaction({ cart: resolved, payMethod, total, customer });
  }

  return { trxId, total, resolvedCart: resolved };
}

// ---------- Export to window ----------
Object.assign(window, {
  // Hooks
  useProducts, useIngredients, useElectronics,

  // Products
  updateProductPrice, updateProduct, addProduct, deleteProduct,
  // Stock
  updateStock, decrementProductStock, decrementIngredientStock,
  // Ingredients
  addIngredient, updateIngredient, deleteIngredient,
  // Electronics
  addElectronic, updateElectronic, deleteElectronic,
  // Recipes
  getRecipe, setRecipe, deductIngredients,
  // Lookups
  getProduct, getLivePrice,
  // Checkout
  processTransaction,

  // Low-level (used by db-export & debug)
  _inventoryStore: {
    loadProducts, loadIngredients, loadElectronics, loadRecipes,
    saveProducts, saveIngredients, saveElectronics, saveRecipes,
    seedIfEmpty,
  },
});
