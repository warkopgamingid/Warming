const TXN_KEY = "warming-pos.transactions.v1";
const EXP_KEY = "warming-pos.expenses.v1";

function loadTxns() {
  try { return JSON.parse(localStorage.getItem(TXN_KEY) || "[]"); } catch { return []; }
}
function saveTxns(arr) {
  try { localStorage.setItem(TXN_KEY, JSON.stringify(arr)); } catch {}
}
function loadExpenses() {
  try { return JSON.parse(localStorage.getItem(EXP_KEY) || "[]"); } catch { return []; }
}
function saveExpenses(arr) {
  try { localStorage.setItem(EXP_KEY, JSON.stringify(arr)); } catch {}
}

const txnSubs = new Set();
const expSubs = new Set();
function notifyTxn() { txnSubs.forEach(fn => fn()); }
function notifyExp() { expSubs.forEach(fn => fn()); }

async function getProducts() {
  const client = window.supabaseClient;

  if (!client) {
    console.error("Supabase client belum tersedia");
    return [];
  }

  const { data, error } = await client
    .from("products")
    .select("*");

  if (error) {
    console.log(error);
    return [];
  }

  return data;
}

window.getProducts = getProducts;

function useTransactions() {
  const [txns, setTxns] = React.useState(loadTxns);
  React.useEffect(() => {
    const cb = () => setTxns(loadTxns());
    txnSubs.add(cb);
    return () => txnSubs.delete(cb);
  }, []);
  return txns;
}

function useExpenses() {
  const [exp, setExp] = React.useState(loadExpenses);
  React.useEffect(() => {
    const cb = () => setExp(loadExpenses());
    expSubs.add(cb);
    return () => expSubs.delete(cb);
  }, []);
  return exp;
}

ffunction addTransaction({ cart, payMethod, total, customer }) {
  const list = loadTxns();
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const time = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const seq = list.length + 1;
  const trxId = "WG-" + String(seq).padStart(4, "0");

  const rows = cart.map((c, i) => {
    const isPS = c.kind === "ps";
    return {
      id: trxId + (cart.length > 1 ? `-${i + 1}` : ""),
      trxId,
      isoDate,
      time,
      unit: isPS ? c.unit : c.label,
      customer: customer || "—",
      kind: isPS ? "Sewa" : (c.sub === "AddOn" ? "Add On" : c.sub || "F&B"),
      durMin: isPS && c.pkg ? c.pkg.durMin : 0,
      qty: c.qty,
      price: c.price,
      sewa: isPS ? c.price * c.qty : 0,
      fnb: isPS ? 0 : c.price * c.qty,
      total: c.price * c.qty,
      pay: payMethod,
      status: "Berhasil",
    };
  });

  saveTxns([...list, ...rows]);
  notifyTxn();

  const supabaseClient = window.supabaseClient || globalThis.supabaseClient;
  if (supabaseClient) {
    const grandTotal = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);

    const payload = {
      trx_id: trxId,
      customer: customer || null,
      pay_method: payMethod,
      total: grandTotal,
      items: rows,
    };

    supabaseClient.from("transactions").insert([payload]).then(({ error }) => {
      if (error) console.error("Gagal simpan transaksi ke Supabase:", error);
    });
  } else {
    console.error("Supabase client belum tersedia");
  }

  return trxId;
}

function deleteExpense(id) {
  saveExpenses(loadExpenses().filter(e => e.id !== id));
  notifyExp();
}

function clearExpenses() { saveExpenses([]); notifyExp(); }

Object.assign(window, {
  useTransactions, useExpenses,
  addTransaction, clearTransactions,
  addExpense, deleteExpense, clearExpenses,
});