// Dashboard — "Mulai Transaksi" builder
// Tabs: Playstation · Makanan · Minuman · Add On
// + sidebar showing active units (live) + cart panel for new transaction

const { useState, useEffect, useMemo } = React;

function fmtMin(min) {
  const sign = min < 0 ? "-" : "";
  const m = Math.abs(Math.round(min));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${sign}${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}:00`;
}
function fmtMinShort(min) {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}j` : `${h}j ${mm}m`;
}

// PlayStation family logo (PS letterform) — kept for reuse if needed
// Official PS4 wordmark
function PS4Wordmark() {
  return (
    <svg viewBox="0 0 503 105" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="currentColor" d="M335.361 71.101V41.126c0-6.115 2.854-10.494 8.941-10.494h37.547c.23 0 .451-.228.451-.454v-5.964a.406.406 0 0 0-.035-.152h-45.909c-9.951 1.265-14.812 8.2-14.812 17.064V71.1c0 6.115-2.934 10.495-8.94 10.495h-39.652c-.225 0-.451.151-.451.453v5.965c0 .247.152.436.33.499h45.019c11.734-.308 17.511-7.799 17.511-17.411zM181.104 88.513h13.183a.522.522 0 0 0 .33-.499V68.911c0-6.115 3.454-10.344 8.486-10.344h54.301c12.242 0 18.176-7.55 18.176-17.441 0-8.864-4.857-15.799-14.813-17.064H180.86c-.023.05-.062.089-.062.152v5.964c0 .302.15.454.45.454h71.574c6.084 0 8.938 4.379 8.938 10.494 0 6.116-2.854 10.495-8.938 10.495h-56.628c-8.787 0-15.396 7.476-15.396 17.29v19.103c-.001.247.105.435.306.499z"/>
      <path fill="currentColor" d="M382.08 81.596h72.1c.221 0 .371.151.371.302v6.116c0 .302.23.453.451.453h12.996c.23 0 .449-.151.449-.453v-5.965c0-.227.23-.453.451-.453h12.916c.301 0 .451-.227.451-.452v-6.041c0-.227-.15-.453-.451-.453h-12.916c-.221 0-.451-.227-.451-.453V30.632c0-3.555-1.321-5.819-3.542-6.57h-3.76c-1.172.301-2.446.84-3.812 1.661l-77.656 47.945c-3.004 1.887-4.057 4-3.305 5.586.6 1.36 2.323 2.342 5.708 2.342zm11.263-8.003L453.5 36.37c.379-.302 1.131-.226 1.131.604v37.223c0 .227-.23.453-.451.453h-60.465c-.521 0-.752-.15-.822-.302-.081-.302.069-.529.45-.755zM50.372 0c5.858 1.092 11.616 2.652 17.346 4.278 3.278.952 6.547 1.937 9.795 2.986 5.102 1.625 10.182 3.465 14.803 6.209 2.07 1.257 4.058 2.677 5.757 4.409a21.957 21.957 0 0 1 4.454 6.255c2.015 4.208 2.705 8.909 2.909 13.531.096 3.016.09 6.058-.473 9.035-.468 2.587-1.3 5.138-2.684 7.385-1.222 1.985-2.921 3.701-4.983 4.807-1.978 1.066-4.243 1.574-6.486 1.529-3.402.036-6.703-1.049-9.756-2.47-.055-10.153-.008-20.308-.024-30.46-.022-1.837.103-3.693-.267-5.505-.26-1.404-.833-2.819-1.935-3.772-.731-.659-1.678-1.031-2.63-1.232-.963-.183-1.99.226-2.586.999-.991 1.238-1.251 2.882-1.296 4.423-.008 27.181.01 54.363-.008 81.542-7.312-2.317-14.625-4.636-21.935-6.96-.008-32.33-.005-64.659-.001-96.989zM17.506 68.783c9.533-3.375 19.056-6.782 28.593-10.146.015 3.743 0 7.487.006 11.233-.006.508.027 1.018-.037 1.523-7.538 2.672-15.061 5.391-22.592 8.08-1.044.394-2.115.841-2.92 1.638-.375.374-.68.926-.475 1.462.258.631.902.974 1.496 1.234 1.652.672 3.458.767 5.218.848 1.962-.031 3.932-.178 5.854-.602 1.299-.255 2.549-.693 3.787-1.158 3.218-1.165 6.436-2.337 9.659-3.49.024 3.166.004 6.334.01 9.503-.01.633.029 1.27-.034 1.901-3.958.711-7.963 1.194-11.986 1.257-8.101.183-16.221-1.071-23.916-3.603-2.524-.731-5.032-1.704-7.139-3.307C1.87 84.258.832 83.129.304 81.74c-.442-1.176-.41-2.535.141-3.67.531-1.132 1.459-2.027 2.481-2.722 2.365-1.633 4.973-2.878 7.616-3.989 2.277-.972 4.639-1.728 6.964-2.576z"/>
      <path fill="currentColor" d="M94.209 64.52c2.162-.25 4.338-.309 6.511-.387 7.151.027 14.338.917 21.178 3.062 1.342.408 2.642.936 3.979 1.362 2.383.871 4.769 1.927 6.677 3.64 1.147 1.046 2.135 2.455 2.149 4.064.068 1.309-.525 2.565-1.374 3.531-1.616 1.812-3.752 3.057-5.897 4.143-2.283 1.164-4.737 1.915-7.131 2.801-14.612 5.247-29.225 10.492-43.835 15.745-.002-4.093.004-8.185-.002-12.276.022-.163-.068-.448.163-.491 11.118-3.956 22.233-7.923 33.349-11.889 1.503-.562 3.122-.969 4.398-1.989.522-.41 1.033-1.062.777-1.765-.267-.615-.905-.956-1.492-1.21-1.664-.659-3.476-.787-5.246-.836-2.771.019-5.567.361-8.202 1.249-7.919 2.775-15.824 5.584-23.745 8.35.001-4.395-.002-8.787.002-13.181 5.731-2.011 11.715-3.23 17.741-3.923z"/>
    </svg>
  );
}

// Official PS5 wordmark
function PS5Wordmark() {
  return (
    <svg viewBox="54.5 166 790.2 176" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="currentColor" d="m143 167.2v82.2c0 58.9.3 81.1 1.1 81.7.6.3 3 1.2 5.3 1.9 2.2.7 5.7 1.8 7.6 2.5s6.2 2.1 9.5 3c3.3 1 7 2.2 8.3 2.6 1.3.5 2.7.9 3.2.9.6 0 1-26.2 1-69.8 0-64.4.1-70 1.8-73.2 1.5-3.1 2.1-3.5 5.4-3.4 2.6.1 4.3.8 5.7 2.5 1.9 2.3 2 4 2.1 34.1v31.7l4.6 2.1c7.1 3.1 18.1 2.8 24-.6 8.9-5.2 13.4-16 13.4-32.3 0-16.7-3.8-28-12.5-36.7-4.8-4.9-16.3-12.4-18.9-12.4-.7 0-2.1-.7-3.2-1.5-1-.8-2.7-1.5-3.6-1.5-1 0-3.2-.6-5-1.4-5.1-2.1-9.9-3.7-13.8-4.6-1.9-.4-4.8-1.3-6.5-1.8-7.3-2.5-25.6-7.2-27.8-7.2-.9 0-1.7.6-1.7 1.2zm202.2 35c-1.5 1.5-1.6 7 0 8.6.9.9 15.3 1.2 58.6 1.2 40.8 0 58.7.3 61.6 1.2 12.6 3.5 16.9 19.8 7.4 28.4-6 5.5-4.8 5.4-57.3 5.4h-48.6l-5.3 2.4c-3.3 1.5-7 4.4-9.8 7.5-6.5 7.5-8 14.2-7.6 34.1l.3 15.5h23l.5-19c.5-20.9.8-21.7 7.2-26.6l3.3-2.4 50.5-.6c27.8-.3 51.6-.9 53-1.4 6.8-2.3 12.4-7.6 16.5-15.5 2.8-5.4 2.5-18.1-.5-23.9-2.9-5.5-7.8-10.4-13.3-13.3l-4.2-2.3-67-.3c-52.3-.2-67.3 0-68.3 1zm242.8-.3c-5.2 1.1-9.8 3.8-14.4 8.5-7.2 7.4-7.6 10-7.6 43.4v29.2l-2.4 3.9c-1.4 2.1-4 4.9-5.8 6.2-3.3 2.4-3.6 2.4-32.3 2.7-15.9.1-29.6.2-30.2.2-.9 0-1.3 1.8-1.3 5.5v5.5h36.4c38.9 0 38.8 0 46.7-5.3 3.2-2.1 8.7-9.7 10.2-14 .6-1.9 1.3-15.9 1.6-34.4l.6-31.2 3.9-4c2.1-2.1 5-4.2 6.5-4.7 1.4-.4 15.9-1 32.1-1.3l29.5-.6v-10l-35-.1c-19.2-.1-36.6.1-38.5.5zm98 .6c-.8 1-1.1 7.2-.8 23.2.3 24.2.4 24.4 7.7 29.4l3.4 2.4 54.6.5c52.5.5 54.7.6 57.6 2.5 7 4.7 9.5 9.2 9.5 17 0 7.1-2.7 11.7-9.6 16.2-2.6 1.7-6.7 1.8-61.9 2.1-32.4.1-59.6.4-60.3.7-.9.3-1.2 2-1 5.2l.3 4.8 66 .3c73.5.3 69.2.6 78.3-6.6 14.9-11.9 14.9-34.6 0-46.4-9-7.1-6.1-6.8-64.1-6.8-39.5-.1-52.6-.4-53.7-1.3-4.4-3.4-5-5.7-5-18.7 0-8.5.4-13 1.2-13.8.9-.9 16.6-1.2 64.4-1.2 56.7 0 63.2-.2 63.8-1.6 1-2.6.7-6.9-.6-8.2-.9-.9-18.9-1.2-74.9-1.2-63.2 0-73.8.2-74.9 1.5zm-556.5 64.7c-1.6.6-4.3 1.6-6 2.3-1.6.7-3.9 1.5-5 1.8s-4.5 1.5-7.5 2.7-6.8 2.5-8.5 3c-1.6.5-5.5 1.8-8.5 3-3 1.1-8.2 3-11.5 4.1-18.9 6.5-28 13.8-25.5 20.4 1.8 4.9 8.2 9.3 16.5 11.5 1.7.5 4.4 1.3 6 1.9 9.4 3.2 19.3 4.3 35.8 3.9 20.2-.4 19.7-.1 19.7-12 0-9.3.1-9.3-9-5.8-12.8 4.9-18.3 6.2-24.6 5.8-7.3-.5-11-2.8-9.4-5.9.6-1 2.5-2.2 4.3-2.8 1.7-.5 5.7-1.9 8.7-3.1s6.6-2.4 8-2.7 3-1 3.7-1.5c.7-.6 2.7-1.4 4.5-1.8 5.8-1.5 12.3-4.1 13-5.3.9-1.4 1.1-16.9.2-19.1-.7-1.8-.7-1.8-4.9-.4z"/>
      <path fill="currentColor" d="m211 276.2c-7.8 1.1-17.5 3.5-21 5.2-2.4 1.1-2.5 1.5-2.5 11.6 0 12.1-.2 11.9 9.5 8 3-1.2 6.9-2.5 8.5-3 1.7-.5 5.5-1.8 8.5-3s6.9-2.5 8.5-2.9c1.7-.4 4-1.3 5.2-1.9 1.2-.7 6.5-1.2 12.2-1.2 9.2 0 10.1.2 11.2 2.1.8 1.7.8 2.4-.3 3.5-1.5 1.5-10.5 5.2-14.8 6.1-1.4.3-2.9.9-3.5 1.3-.5.4-2.6 1.3-4.5 1.8-1.9.6-6 2-9 3.2s-6.8 2.5-8.5 3c-1.6.5-5.5 1.8-8.5 3s-7 2.5-8.8 3c-5.8 1.4-6.2 2.3-6.2 13.1 0 9.8 0 9.9 2.4 9.9 1.4 0 2.7-.4 3-.9s1.8-1.1 3.3-1.4c1.6-.3 4.6-1.2 6.8-2.1 2.2-.8 6.5-2.5 9.5-3.6 3-1.2 6.9-2.5 8.5-3 1.7-.5 5.5-1.8 8.5-3 10.6-4.1 13.5-5.1 16.5-6 1.7-.4 5.5-1.8 8.5-3s6.6-2.5 8-3c19.9-6.9 27.1-14.1 21.8-22-4-6-20.1-12.4-37.6-14.9-8.4-1.3-25.9-1.2-35.2.1z"/>
    </svg>
  );
}

// PS panel — blue background with full lockup
function PSLogo({ variant = "PS4" }) {
  return (
    <div className="ps-logo-stack ps-logo-full">
      {variant === "PS5" ? <PS5Wordmark/> : <PS4Wordmark/>}
    </div>
  );
}

const TABS = [
  { id: "ps",      label: "Playstation", icon: "grid",    sub: "Unit & paket" },
  { id: "makanan", label: "Makanan",     icon: "fnb",     sub: "Mie & snack" },
  { id: "minuman", label: "Minuman",     icon: "fnb",     sub: "Kopi & teh" },
  { id: "addon",   label: "Add On",      icon: "package", sub: "Topping ekstra" },
];

const TV_OPTIONS = ["TV 1", "TV 2", "TV 3", "TV 4"];
const DRAFTS_KEY = "pos-drafts";

function Dashboard({ units, tickMin, onOpenUnit, filter, setFilter }) {
  const [tab, setTab] = useState("ps");
  const [cart, setCart] = useState([]);            // [{kind:'ps'|'item', ...}]
  const [search, setSearch] = useState("");
  const [payOpen, setPayOpen] = useState(false);   // payment modal
  const [payMethod, setPayMethod] = useState(null);// "Cash" | "QRIS"
  const [toast, setToast] = useState(null);        // {msg, sub}

  // ---------- Drafts (persisted to localStorage) ----------
  const [drafts, setDrafts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || "[]"); }
    catch { return []; }
  });
  const [draftSaveOpen, setDraftSaveOpen] = useState(false);
  const [draftListOpen, setDraftListOpen] = useState(false);
  const [draftCustomer, setDraftCustomer] = useState("");
  const [draftTV, setDraftTV] = useState(TV_OPTIONS[0]);

  const persistDrafts = (next) => {
    setDrafts(next);
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(next)); } catch {}
  };

  const openDraftModal = () => {
    if (cart.length === 0) return;
    setDraftCustomer("");
    setDraftTV(TV_OPTIONS[0]);
    setDraftSaveOpen(true);
  };

  const saveDraft = () => {
    if (cart.length === 0) return;
    const draft = {
      id: `draft-${Date.now()}`,
      customer: draftCustomer.trim() || "Tanpa nama",
      tv: draftTV,
      cart: cart,
      createdAt: Date.now(),
    };
    persistDrafts([draft, ...drafts]);
    setCart([]);
    setDraftSaveOpen(false);
    setToast({ msg: "Draft tersimpan", sub: `${draft.customer} · ${draft.tv}` });
    setTimeout(() => setToast(null), 2800);
  };

  const loadDraft = (d) => {
    setCart(d.cart);
    persistDrafts(drafts.filter(x => x.id !== d.id));
    setDraftListOpen(false);
    setToast({ msg: "Draft dimuat ke keranjang", sub: `${d.customer} · ${d.tv}` });
    setTimeout(() => setToast(null), 2800);
  };

  const deleteDraft = (id) => {
    persistDrafts(drafts.filter(x => x.id !== id));
  };

  // ----- Live data from the central inventory store -----
  // Single source of truth. When prices / stock change anywhere, this
  // hook fires and the whole Dashboard rerenders — cart prices and the
  // F&B grid follow automatically.
  const products = window.useProducts ? window.useProducts() : [];
  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  // Resolve a cart row to its LIVE label/price/sub from the store.
  // PS rows (rental) don't live in the products store, so pass through.
  const liveLine = (c) => {
    if (c.kind !== "item") return c;
    const live = productMap.get(c.id);
    if (!live) return c;
    return { ...c, label: live.name, sub: live.cat || c.sub, price: Number(live.price) || 0 };
  };

  const finishPayment = () => {
    if (!payMethod) return;
    // Resolve cart through the store one last time before persisting so
    // we charge the LIVE price and decrement stocks / ingredients via
    // the single checkout pipeline.
    const resolved = cart.map(liveLine);
    const total = resolved.reduce((s, c) => s + c.price * c.qty, 0);
    const method = payMethod;
    if (window.processTransaction) {
      window.processTransaction({ cart: resolved, payMethod: method, customer: null });
    } else if (window.addTransaction) {
      // Defensive fallback: persist without stock-deduction if the store
      // module failed to load.
      window.addTransaction({ cart: resolved, payMethod: method, total, customer: null });
    }
    setCart([]);
    setPayOpen(false);
    setPayMethod(null);
    setToast({
      msg: "Transaksi berhasil",
      sub: `${RP(total)} dibayar via ${method}`,
    });
    setTimeout(() => setToast(null), 3200);
  };

  const counts = useMemo(() => ({
    all: units.length,
    aktif: units.filter(u => u.status === "aktif" || u.status === "paket").length,
    idle: units.filter(u => u.status === "idle").length,
    maintenance: units.filter(u => u.status === "maintenance").length,
  }), [units]);

  const totalLive = useMemo(() => {
    return units.reduce((s, u) => {
      if (u.status === "idle" || u.status === "maintenance") return s;
      const elapsed = u.startedAtMinAgo + tickMin;
      const sewa = u.pkg ? u.pkg.price : Math.ceil(elapsed / 60) * (HOURLY[u.type] || 0);
      const fnb = u.tab.reduce((a, i) => a + i.qty * i.price, 0);
      return s + sewa + fnb;
    }, 0);
  }, [units, tickMin]);

  // ---------- Cart ops ----------
  const addPS = (unit, pkg) => {
    const id = `ps-${unit.id}-${pkg ? pkg.id : "open"}`;
    if (cart.find(c => c.id === id)) return;
    setCart([...cart, {
      id, kind: "ps", unit: unit.id, type: unit.type,
      label: pkg ? `${unit.id} · ${pkg.label}` : `${unit.id} · Open Billing`,
      sub: pkg ? fmtMinShort(pkg.durMin) : `${RP(HOURLY[unit.type])}/jam`,
      price: pkg ? pkg.price : HOURLY[unit.type],
      qty: 1,
      pkg: pkg || null,
    }]);
  };
  const addItem = (m) => {
    const existing = cart.find(c => c.id === m.id);
    if (existing) {
      setCart(cart.map(c => c.id === m.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: m.id, kind: "item", label: m.name, sub: m.cat, price: m.price, qty: 1 }]);
    }
  };
  const setQty = (id, q) => {
    setCart(q <= 0 ? cart.filter(c => c.id !== id) : cart.map(c => c.id === id ? { ...c, qty: q } : c));
  };

  const subtotal = cart.reduce((s, c) => {
    const line = liveLine(c);
    return s + line.price * line.qty;
  }, 0);

  // ---------- Tab content ----------
  // Menu & add-on grids read straight from the products store.
  const makananItems = products.filter(p => p.cat === "Makanan");
  const minumanItems = products.filter(p => p.cat === "Minuman");
  const addonItems   = products.filter(p => p.cat === "AddOn");

  let content;
  if (tab === "ps") {
    content = <PSTab units={units} tickMin={tickMin} onAdd={addPS} onOpenUnit={onOpenUnit} filter={filter} setFilter={setFilter} counts={counts}/>;
  } else if (tab === "makanan") {
    content = <ItemGrid items={makananItems} onAdd={addItem} search={search}/>;
  } else if (tab === "minuman") {
    content = <ItemGrid items={minumanItems} onAdd={addItem} search={search}/>;
  } else if (tab === "addon") {
    content = <ItemGrid items={addonItems} onAdd={addItem} search={search}/>;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mulai Transaksi</h1>
          <div className="page-sub">Pilih item dari tab di bawah</div>
        </div>
        <button
          className="btn"
          onClick={() => setDraftListOpen(true)}
          style={{display:"inline-flex", alignItems:"center", gap:6}}
        >
          <Icon name="receipt" size={14}/>
          Draft Tersimpan
          {drafts.length > 0 && (
            <span style={{
              marginLeft:2,
              background:"var(--accent)",
              color:"#fff",
              borderRadius:999,
              padding:"1px 8px",
              fontSize:11,
              fontWeight:600,
              lineHeight:1.5,
            }}>{drafts.length}</span>
          )}
        </button>
      </div>

      <div className="trx-shell">
        {/* Left: builder */}
        <div className="trx-builder">
          <div className="tabbar">
            {TABS.map(t => (
              <button key={t.id} className={`tabbar-btn ${tab===t.id ? "on" : ""}`} onClick={() => { setTab(t.id); setSearch(""); }}>
                <Icon name={t.icon} size={16}/>
                <div className="tabbar-text">
                  <div className="tabbar-label">{t.label}</div>
                  <div className="tabbar-sub">{t.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {tab !== "ps" && (
            <div className="trx-search">
              <Icon name="search" size={14}/>
              <input className="input" placeholder={`Cari ${TABS.find(t=>t.id===tab).label.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          )}

          <div className="trx-content">{content}</div>
        </div>

        {/* Right: cart */}
        <aside className="trx-cart">
          <div className="trx-cart-head">
            <div>
              <div style={{fontSize:13, fontWeight:600}}>Keranjang Transaksi</div>
              <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}>{cart.length} item</div>
            </div>
            {cart.length > 0 && (
              <button className="btn-ghost btn btn-sm" onClick={() => setCart([])}>Kosongkan</button>
            )}
          </div>
          <div className="trx-cart-body">
            {cart.length === 0 && (
              <div className="empty">
                <Icon name="receipt" size={28} style={{opacity:.3, marginBottom:8}}/>
                <div>Keranjang kosong</div>
                <div style={{fontSize:11, marginTop:4}}>Pilih PS / makanan / minuman / add-on dari tab kiri</div>
              </div>
            )}
            {cart.map(c => {
              const live = liveLine(c);
              return (
              <div key={c.id} className="cart-row">
                <div style={{flex:1, minWidth:0}}>
                  <div className="cart-row-name">{live.label}</div>
                  <div className="cart-row-sub">{live.sub} · {RP(live.price)}{c.kind==="ps" && !c.pkg ? "/jam" : ""}</div>
                </div>
                {c.kind === "ps" ? (
                  <button className="icon-btn" onClick={() => setQty(c.id, 0)} aria-label="Hapus"><Icon name="x" size={12}/></button>
                ) : (
                  <div className="qty-stepper">
                    <button onClick={() => setQty(c.id, c.qty - 1)}>−</button>
                    <span className="qty">{c.qty}</span>
                    <button onClick={() => setQty(c.id, c.qty + 1)}>+</button>
                  </div>
                )}
                <div className="mono cart-row-amt">{RP(live.price * c.qty)}</div>
              </div>
              );
            })}
          </div>
          <div className="trx-cart-foot">
            <div className="tab-line"><span>Subtotal</span><span className="mono">{RP(subtotal)}</span></div>
            <div className="tab-line" style={{color:"var(--fg-3)"}}><span>Pajak (PB1 termasuk)</span><span className="mono">—</span></div>
            <div className="tab-line total"><span>Total</span><span className="mono">{RP(subtotal)}</span></div>
            <div style={{display:"flex", gap:8, marginTop:12}}>
              <button
                className="btn btn-block"
                disabled={cart.length===0}
                onClick={openDraftModal}
              >Simpan Draft</button>
              <button
                className="btn btn-primary btn-block btn-lg"
                disabled={cart.length===0}
                onClick={() => { setPayMethod(null); setPayOpen(true); }}
              >
                <Icon name="check" size={14}/> Lanjut ke Bayar
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Payment method modal */}
      {payOpen && (
        <div
          onClick={() => setPayOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:90,
            background:"rgba(15, 23, 42, 0.55)",
            backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:"min(440px, 100%)",
              background:"#fff",
              border:"1px solid var(--border)",
              borderRadius:14,
              boxShadow:"0 20px 50px -10px rgba(0,0,0,.35)",
              overflow:"hidden",
            }}
          >
            <div style={{padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14, fontWeight:600}}>Pilih Metode Pembayaran</div>
                <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}>{cart.length} item · Total {RP(subtotal)}</div>
              </div>
              <button className="icon-btn" onClick={() => setPayOpen(false)} aria-label="Tutup"><Icon name="x" size={14}/></button>
            </div>

            <div style={{padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              {[
                {id:"Cash", icon:"cash", label:"Cash", sub:"Bayar di kasir"},
                {id:"QRIS", icon:"qris", label:"QRIS",  sub:"Scan dari e-wallet"},
              ].map(opt => {
                const on = payMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPayMethod(opt.id)}
                    style={{
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                      gap:8, padding:"22px 12px",
                      borderRadius:12,
                      border: on
                        ? "2px solid var(--accent)"
                        : "1.5px solid #d4d4d8",
                      background: on ? "color-mix(in oklch, var(--accent) 10%, #fff)" : "#fff",
                      color: on ? "var(--accent)" : "var(--fg-1)",
                      cursor:"pointer",
                      transition:"all .12s",
                      position:"relative",
                      boxShadow: on ? "none" : "0 1px 2px rgba(15,23,42,.04)",
                    }}
                  >
                    {on && (
                      <span style={{
                        position:"absolute", top:8, right:8,
                        width:18, height:18, borderRadius:999,
                        background:"var(--accent)", color:"#fff",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <Icon name="check" size={11}/>
                      </span>
                    )}
                    <Icon name={opt.icon} size={28}/>
                    <div style={{fontSize:14, fontWeight:600}}>{opt.label}</div>
                    <div style={{fontSize:11, color:"var(--fg-3)"}}>{opt.sub}</div>
                  </button>
                );
              })}
            </div>

            <div style={{padding:"14px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:8, alignItems:"center"}}>
              <div style={{flex:1, fontSize:12, color:"var(--fg-3)"}}>
                {payMethod
                  ? <>Metode: <b style={{color:"var(--fg-1)"}}>{payMethod}</b></>
                  : <>Pilih salah satu metode di atas</>}
              </div>
              <button className="btn" onClick={() => setPayOpen(false)}>Batal</button>
              <button
                className="btn btn-primary"
                disabled={!payMethod}
                onClick={finishPayment}
              >
                <Icon name="check" size={14}/> Bayar {RP(subtotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Draft modal */}
      {draftSaveOpen && (
        <div
          onClick={() => setDraftSaveOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:90,
            background:"rgba(15, 23, 42, 0.55)",
            backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:"min(480px, 100%)",
              maxHeight:"min(90vh, 700px)",
              background:"#fff",
              border:"1px solid var(--border)",
              borderRadius:14,
              boxShadow:"0 20px 50px -10px rgba(0,0,0,.35)",
              overflow:"hidden",
              display:"flex", flexDirection:"column",
            }}
          >
            <div style={{padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14, fontWeight:600}}>Simpan Draft Transaksi</div>
                <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}>{cart.length} item · Total {RP(subtotal)}</div>
              </div>
              <button className="icon-btn" onClick={() => setDraftSaveOpen(false)} aria-label="Tutup"><Icon name="x" size={14}/></button>
            </div>

            <div style={{padding:"16px 20px", overflowY:"auto", display:"flex", flexDirection:"column", gap:14}}>
              {/* Cart preview */}
              <div>
                <div style={{fontSize:11, fontWeight:600, color:"var(--fg-3)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:8}}>Keranjang</div>
                <div style={{border:"1px solid var(--border)", borderRadius:10, overflow:"hidden"}}>
                  {cart.map((c, i) => {
                    const live = liveLine(c);
                    return (
                      <div key={c.id} style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        gap:10, padding:"10px 12px",
                        borderTop: i === 0 ? "none" : "1px solid var(--border)",
                        fontSize:12,
                      }}>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontWeight:500, color:"var(--fg-1)"}}>{live.label}</div>
                          <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}>{live.sub} · {c.qty}x</div>
                        </div>
                        <div className="mono" style={{fontWeight:500}}>{RP(live.price * c.qty)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer name */}
              <div>
                <label style={{fontSize:11, fontWeight:600, color:"var(--fg-3)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:6, display:"block"}}>
                  Nama Pelanggan
                </label>
                <input
                  className="input"
                  placeholder="Contoh: Budi"
                  value={draftCustomer}
                  onChange={e => setDraftCustomer(e.target.value)}
                  autoFocus
                  style={{width:"100%"}}
                />
              </div>

              {/* TV dropdown */}
              <div>
                <label style={{fontSize:11, fontWeight:600, color:"var(--fg-3)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:6, display:"block"}}>
                  Pilih TV
                </label>
                <select
                  className="input"
                  value={draftTV}
                  onChange={e => setDraftTV(e.target.value)}
                  style={{width:"100%", cursor:"pointer"}}
                >
                  {TV_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{padding:"14px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:8, justifyContent:"flex-end"}}>
              <button className="btn" onClick={() => setDraftSaveOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={saveDraft}>
                <Icon name="check" size={14}/> Simpan Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts List modal */}
      {draftListOpen && (
        <div
          onClick={() => setDraftListOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:90,
            background:"rgba(15, 23, 42, 0.55)",
            backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:"min(560px, 100%)",
              maxHeight:"min(90vh, 720px)",
              background:"#fff",
              border:"1px solid var(--border)",
              borderRadius:14,
              boxShadow:"0 20px 50px -10px rgba(0,0,0,.35)",
              overflow:"hidden",
              display:"flex", flexDirection:"column",
            }}
          >
            <div style={{padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14, fontWeight:600}}>Draft Tersimpan</div>
                <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}>
                  {drafts.length === 0 ? "Belum ada draft" : `${drafts.length} transaksi menunggu di-checkout`}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDraftListOpen(false)} aria-label="Tutup"><Icon name="x" size={14}/></button>
            </div>

            <div style={{padding:drafts.length === 0 ? 40 : 16, overflowY:"auto", display:"flex", flexDirection:"column", gap:10}}>
              {drafts.length === 0 && (
                <div className="empty" style={{textAlign:"center", color:"var(--fg-3)"}}>
                  <Icon name="receipt" size={32} style={{opacity:.3, marginBottom:8}}/>
                  <div style={{fontSize:13}}>Belum ada draft tersimpan</div>
                  <div style={{fontSize:11, marginTop:4}}>Klik "Simpan Draft" di keranjang untuk menyimpan transaksi yang belum bayar</div>
                </div>
              )}
              {drafts.map(d => {
                const total = d.cart.reduce((s, c) => s + (liveLine(c).price) * c.qty, 0);
                const itemCount = d.cart.reduce((s, c) => s + c.qty, 0);
                const ageMin = Math.max(0, Math.round((Date.now() - d.createdAt) / 60000));
                const ageLabel = ageMin < 1 ? "Baru saja"
                  : ageMin < 60 ? `${ageMin} menit lalu`
                  : ageMin < 1440 ? `${Math.floor(ageMin / 60)} jam lalu`
                  : `${Math.floor(ageMin / 1440)} hari lalu`;
                return (
                  <div key={d.id} style={{
                    border:"1px solid var(--border)",
                    borderRadius:10,
                    padding:14,
                    display:"flex", flexDirection:"column", gap:10,
                    background:"#fff",
                  }}>
                    <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10}}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                          <div style={{fontSize:14, fontWeight:600}}>{d.customer}</div>
                          <span style={{
                            background:"color-mix(in oklch, var(--accent) 12%, #fff)",
                            color:"var(--accent)",
                            padding:"2px 8px",
                            borderRadius:999,
                            fontSize:11,
                            fontWeight:600,
                          }}>{d.tv}</span>
                        </div>
                        <div style={{fontSize:11, color:"var(--fg-3)", marginTop:3}}>
                          {itemCount} item · {ageLabel}
                        </div>
                      </div>
                      <div className="mono" style={{fontSize:14, fontWeight:600}}>{RP(total)}</div>
                    </div>

                    <div style={{
                      display:"flex", flexDirection:"column", gap:3,
                      padding:"8px 10px",
                      background:"var(--bg-2, #fafafa)",
                      borderRadius:8,
                      fontSize:11,
                      color:"var(--fg-2)",
                    }}>
                      {d.cart.slice(0, 4).map(c => {
                        const live = liveLine(c);
                        return (
                          <div key={c.id} style={{display:"flex", justifyContent:"space-between", gap:8}}>
                            <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                              {c.qty}× {live.label}
                            </span>
                          </div>
                        );
                      })}
                      {d.cart.length > 4 && (
                        <div style={{color:"var(--fg-3)"}}>+{d.cart.length - 4} item lainnya</div>
                      )}
                    </div>

                    <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          if (confirm(`Hapus draft "${d.customer} · ${d.tv}"?`)) deleteDraft(d.id);
                        }}
                      >Hapus</button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={cart.length > 0}
                        title={cart.length > 0 ? "Kosongkan keranjang dulu untuk memuat draft" : ""}
                        onClick={() => loadDraft(d)}
                      >
                        <Icon name="check" size={12}/> Muat ke Keranjang
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {toast && (
        <div style={{
          position:"fixed",
          bottom:24, left:"50%", transform:"translateX(-50%)",
          zIndex:100,
          background:"var(--accent)",
          color:"#fff",
          padding:"12px 18px",
          borderRadius:10,
          boxShadow:"0 12px 30px -8px color-mix(in oklch, var(--accent) 60%, transparent)",
          display:"flex", alignItems:"center", gap:10,
          fontSize:13, fontWeight:500,
          animation:"toastIn .25s ease-out",
        }}>
          <span style={{
            width:22, height:22, borderRadius:999,
            background:"rgba(255,255,255,.22)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Icon name="check" size={13}/>
          </span>
          <div>
            <div>{toast.msg}</div>
            <div style={{fontSize:11, opacity:.85, marginTop:1}}>{toast.sub}</div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- PS tab: pick paket → auto-assign first idle unit → adds to cart ----------
function PSTab({ units, tickMin, onAdd, onOpenUnit, filter, setFilter, counts }) {
  const idleUnits = units.filter(u => u.status === "idle");
  // Built-in paket from data.jsx (PS4 / PS5 hourly) → semuanya Non-Promo.
  const builtIn = PAKET.filter(p => p.unit === "PS4" || p.unit === "PS5");
  // Rental items added through Inventory → become extra paket cards here.
  const products = window.useProducts ? window.useProducts() : [];
  const rentalProducts = products.filter(p => p.cat === "Rental" && (p.psType === "PS4" || p.psType === "PS5"));
  const toPaket = (p) => ({
    id: p.id,
    unit: p.psType,
    label: p.name,
    durMin: Number(p.durMin) || 60,
    price: Number(p.price) || 0,
  });

  // Pisahkan: paket sewa reguler (Non-Promo) vs paket promo.
  const sewaPaket  = [...builtIn, ...rentalProducts.filter(p => p.promo !== "Promo").map(toPaket)];
  const promoPaket = rentalProducts.filter(p => p.promo === "Promo").map(toPaket);

  const onPickPaket = (paket) => {
    const unit = idleUnits.find(u => u.type === paket.unit);
    if (!unit) return;
    onAdd(unit, paket);
  };

  const renderCard = (p) => {
    const idleCount = idleUnits.filter(u => u.type === p.unit).length;
    return (
      <button
        key={p.id}
        className={`ps-pick ${idleCount === 0 ? "disabled" : ""}`}
        disabled={idleCount === 0}
        onClick={() => onPickPaket(p)}
      >
        <div className={`ps-pick-panel ${p.unit === "PS5" ? "ps5" : ""}`}>
          <PSLogo variant={p.unit}/>
        </div>
        <div className="ps-pick-name">{p.label}</div>
        <div className="ps-pick-price">{RP(p.price)}</div>
      </button>
    );
  };

  return (
    <div className="ps-tab">
      <div className="ps-tab-head">
        <div>
          <div style={{fontSize:13, fontWeight:600}}>Pilih Paket Sewa</div>
          <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}> pilih paket untuk masukkan ke keranjang</div>
        </div>
      </div>
      <div className="ps-pick-grid">
        {sewaPaket.map(renderCard)}
      </div>

      <div className="ps-tab-head" style={{marginTop:24}}>
        <div>
          <div style={{fontSize:13, fontWeight:600}}>Pilih Promo</div>
          <div style={{fontSize:11, color:"var(--fg-3)", marginTop:2}}>
            {promoPaket.length === 0
              ? "Belum ada paket promo · tambahkan dari Inventory → Rental → Paket: Promo"
              : `${promoPaket.length} paket promo tersedia`}
          </div>
        </div>
      </div>
      {promoPaket.length > 0 && (
        <div className="ps-pick-grid">
          {promoPaket.map(renderCard)}
        </div>
      )}
    </div>
  );
}

// ---------- F&B / Add-on grid ----------
function ItemGrid({ items, onAdd, search }) {
  const filtered = items.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="item-grid">
      {filtered.map(m => (
        <button key={m.id} className="menu-item" onClick={() => onAdd(m)}>
          <div className="menu-item-thumb">
            {m.img
              ? <img src={m.img} alt={m.name}/>
              : <span className="menu-item-thumb-placeholder">{m.name.split(" ")[0]}</span>}
          </div>
          <div className="menu-item-name">{m.name}</div>
          <div className="menu-item-foot">
            <span className="menu-item-price">{m.price < 0 ? "Diskon" : RP(m.price)}</span>
          </div>
        </button>
      ))}
      {filtered.length === 0 && <div className="empty" style={{gridColumn:"1/-1"}}>Tidak ada item ditemukan.</div>}
    </div>
  );
}

// ---------- Mini unit card for active strip ----------
function MiniUnit({ unit, tickMin, onOpen }) {
  const elapsed = unit.status === "idle" || unit.status === "maintenance" ? 0 : unit.startedAtMinAgo + tickMin;
  let label, value, status = unit.status;
  if (unit.status === "idle") { label = "Siap pakai"; value = "—"; }
  else if (unit.status === "maintenance") { label = "Service"; value = "—"; }
  else if (unit.pkg) {
    const remain = unit.pkg.durMin - elapsed;
    label = remain <= 0 ? "Lewat" : "Sisa paket";
    value = fmtMin(remain);
    if (remain <= 15 && remain > 0) status = "warning";
  } else { label = "Berjalan"; value = fmtMin(elapsed); }

  return (
    <button className="mini-unit" onClick={onOpen}>
      <div className="mini-unit-head">
        <span className="unit-id">{unit.id}</span>
        <span className={`status ${status}`}>
          <span className="status-dot"/>
          {status === "idle" && "Idle"}
          {status === "aktif" && "Aktif"}
          {status === "paket" && "Paket"}
          {status === "warning" && "Hampir habis"}
          {status === "maintenance" && "Service"}
        </span>
      </div>
      <div className="mini-unit-timer tnum">{value}</div>
      <div className="mini-unit-sub">{label}{unit.customer ? ` · ${unit.customer}` : ""}</div>
    </button>
  );
}

window.Dashboard = Dashboard;
window.fmtMin = fmtMin;
window.fmtMinShort = fmtMinShort;
