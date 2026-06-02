// Drawer that opens when you click a unit:
// - Add F&B to tab
// - Selesaikan sewa -> bill + pembayaran (Cash/QRIS)

const CATS = [
  { key: "Semua", filter: () => true },
  { key: "Makanan", filter: m => m.cat === "Makanan" },
  { key: "Minuman", filter: m => m.cat === "Minuman" },
];

function UnitDrawer({ unit, tickMin, onClose, onUpdateUnit, onCheckout }) {
  const [view, setView] = React.useState("menu"); // menu | bill
  const [cat, setCat] = React.useState("Semua");
  const [search, setSearch] = React.useState("");

  if (!unit) return null;

  const elapsed = unit.startedAtMinAgo + tickMin;
  const sewa = unit.pkg
    ? unit.pkg.price
    : Math.ceil(elapsed / 60) * (HOURLY[unit.type] || 0);
  const fnb = unit.tab.reduce((s, i) => s + i.qty * i.price, 0);
  const total = sewa + fnb;

  const addItem = (m) => {
    const existing = unit.tab.find(i => i.id === m.id);
    let newTab;
    if (existing) {
      newTab = unit.tab.map(i => i.id === m.id ? { ...i, qty: i.qty + 1 } : i);
    } else {
      newTab = [...unit.tab, { id: m.id, name: m.name, qty: 1, price: m.price }];
    }
    onUpdateUnit({ ...unit, tab: newTab });
  };
  const setQty = (id, q) => {
    const newTab = q <= 0
      ? unit.tab.filter(i => i.id !== id)
      : unit.tab.map(i => i.id === id ? { ...i, qty: q } : i);
    onUpdateUnit({ ...unit, tab: newTab });
  };

  const filteredMenu = MENU.filter(CATS.find(c => c.key === cat).filter)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <aside className="drawer drawer-wide" role="dialog" aria-label={`Unit ${unit.id}`}>
        <div className="drawer-head">
          <div>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <span className="drawer-title">{unit.id}</span>
              <span className="unit-type-tag">{unit.type}</span>
              <span className={`status ${unit.status}`}>
                <span className="status-dot"/>
                {unit.status === "aktif" && "Aktif"}
                {unit.status === "paket" && unit.pkg.label}
                {unit.status === "idle" && "Idle"}
                {unit.status === "maintenance" && "Service"}
              </span>
            </div>
            <div className="drawer-sub">
              {unit.customer ? `Customer: ${unit.customer} · ` : ""}
              {unit.status !== "idle" && unit.status !== "maintenance" && `Berjalan ${fmtMinShort(elapsed)} · ${RP(total)}`}
            </div>
          </div>
          <div style={{display:"flex", gap:8}}>
            <div className="seg">
              <button className={`seg-btn ${view==="menu" ? "on" : ""}`} onClick={() => setView("menu")}>Menu F&B</button>
              <button className={`seg-btn ${view==="bill" ? "on" : ""}`} onClick={() => setView("bill")}>Selesaikan</button>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Tutup"><Icon name="x" size={14}/></button>
          </div>
        </div>

        {view === "menu" ? (
          <div className="drawer-body" style={{ padding: 0 }}>
            <div className="menu-shell">
              <div className="menu-list">
                <div className="menu-search">
                  <Icon name="search" size={14}/>
                  <input className="input" placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <div className="menu-cat-tabs">
                  {CATS.map(c => (
                    <button key={c.key} className={`cat-tab ${cat === c.key ? "on" : ""}`} onClick={() => setCat(c.key)}>{c.key}</button>
                  ))}
                </div>
                <div className="menu-grid">
                  {filteredMenu.map(m => (
                    <button key={m.id} className="menu-item" onClick={() => addItem(m)}>
                      <div className="menu-item-thumb">
                        {m.img
                          ? <img src={m.img} alt={m.name}/>
                          : <span className="menu-item-thumb-placeholder">{m.name.split(" ")[0]}</span>}
                      </div>
                      <div className="menu-item-name">{m.name}</div>
                      <div className="menu-item-foot">
                        <span className="menu-item-price">{RP(m.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="tab-side">
                <div className="tab-head">
                  <div className="tab-head-title">Tab Pesanan F&B</div>
                  <div className="tab-head-sub">{unit.tab.length} item · ditambahkan ke {unit.id}</div>
                </div>
                <div className="tab-rows">
                  {unit.tab.length === 0 && (
                    <div className="empty">Belum ada pesanan F&B<br/><span style={{fontSize:11}}>Klik menu di kiri untuk menambah</span></div>
                  )}
                  {unit.tab.map(i => (
                    <div key={i.id} className="tab-row">
                      <div style={{flex:1}}>
                        <div className="tab-row-name">{i.name}</div>
                        <div className="tab-row-price mono">{RP(i.price)}</div>
                      </div>
                      <div className="qty-stepper">
                        <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                        <span className="qty">{i.qty}</span>
                        <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                      </div>
                      <div className="mono" style={{minWidth:70, textAlign:"right", fontSize:12, fontWeight:600}}>{RP(i.qty * i.price)}</div>
                    </div>
                  ))}
                </div>
                <div className="tab-foot">
                  <div className="tab-line"><span>Sewa berjalan</span><span className="mono">{RP(sewa)}</span></div>
                  <div className="tab-line"><span>F&B ({unit.tab.length})</span><span className="mono">{RP(fnb)}</span></div>
                  <div className="tab-line total"><span>Total</span><span className="mono">{RP(total)}</span></div>
                  <button className="btn btn-primary btn-block btn-lg" style={{marginTop:12}} onClick={() => setView("bill")}>
                    Selesaikan & Bayar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <BillView unit={unit} sewa={sewa} fnb={fnb} elapsed={elapsed} onBack={() => setView("menu")} onCheckout={onCheckout}/>
        )}
      </aside>
    </>
  );
}

function BillView({ unit, sewa, fnb, elapsed, onBack, onCheckout }) {
  const [pay, setPay] = React.useState("Cash");
  const [cashIn, setCashIn] = React.useState(0);
  const total = sewa + fnb;
  const change = Math.max(0, cashIn - total);

  const quickCash = [50000, 100000, 200000];
  const trxId = "TRX-2026-" + String(Math.floor(Math.random()*9000)+1000);

  return (
    <div className="drawer-body" style={{ padding: 0 }}>
      <div className="bill-grid">
        <div className="bill-side">
          <div className="bill-h">Struk Pembayaran</div>
          <div className="bill-meta">
            <div className="bill-meta-cell">
              <div className="bill-meta-label">Trx ID</div>
              <div className="bill-meta-value">{trxId}</div>
            </div>
            <div className="bill-meta-cell">
              <div className="bill-meta-label">Unit</div>
              <div className="bill-meta-value">{unit.id} · {unit.type}</div>
            </div>
            <div className="bill-meta-cell">
              <div className="bill-meta-label">Customer</div>
              <div className="bill-meta-value">{unit.customer || "Walk-in"}</div>
            </div>
            <div className="bill-meta-cell">
              <div className="bill-meta-label">Durasi</div>
              <div className="bill-meta-value">{fmtMinShort(elapsed)} <span style={{color:"var(--fg-3)", fontWeight:400}}>({Math.ceil(elapsed/60)} jam)</span></div>
            </div>
          </div>

          <div className="bill-section-title">Sewa Unit</div>
          {unit.pkg ? (
            <div className="bill-row">
              <span className="name">{unit.pkg.label} ({fmtMinShort(unit.pkg.durMin)})</span>
              <span className="amt">{RP(unit.pkg.price)}</span>
            </div>
          ) : (
            <div className="bill-row">
              <span className="name">{unit.type} · {Math.ceil(elapsed/60)}× @ {RP(HOURLY[unit.type])}/jam</span>
              <span className="amt">{RP(sewa)}</span>
            </div>
          )}

          {unit.tab.length > 0 && (
            <>
              <div className="bill-section-title">Pesanan F&B</div>
              {unit.tab.map(i => (
                <div key={i.id} className="bill-row">
                  <span className="name">{i.qty}× {i.name}</span>
                  <span className="amt">{RP(i.qty * i.price)}</span>
                </div>
              ))}
            </>
          )}

          <div className="bill-summary">
            <div className="bill-summary-row"><span>Subtotal sewa</span><span className="mono">{RP(sewa)}</span></div>
            <div className="bill-summary-row"><span>Subtotal F&B</span><span className="mono">{RP(fnb)}</span></div>
            <div className="bill-summary-row"><span>Pajak (sudah termasuk)</span><span className="mono">—</span></div>
            <div className="bill-summary-row total"><span>Total</span><span className="mono">{RP(total)}</span></div>
          </div>
        </div>

        <div className="pay-side">
          <div style={{fontSize:13, fontWeight:600}}>Metode Pembayaran</div>
          <div className="pay-tabs">
            <div className={`pay-tab ${pay==="Cash" ? "on" : ""}`} onClick={() => setPay("Cash")}>
              <Icon name="cash" size={22}/>
              Cash
            </div>
            <div className={`pay-tab ${pay==="QRIS" ? "on" : ""}`} onClick={() => setPay("QRIS")}>
              <Icon name="qris" size={22}/>
              QRIS
            </div>
          </div>

          <div className="pay-amount">
            <div className="pay-amount-label">Total Tagihan</div>
            <div className="pay-amount-value">{RP(total)}</div>
          </div>

          {pay === "Cash" ? (
            <>
              <div className="field">
                <label>Uang Diterima</label>
                <input className="input mono" inputMode="numeric" placeholder="0"
                  value={cashIn ? cashIn.toLocaleString("id-ID") : ""}
                  onChange={e => setCashIn(parseInt(e.target.value.replace(/\D/g,"")) || 0)}/>
              </div>
              <div className="cash-quick">
                {quickCash.map(c => <button key={c} className="cash-btn" onClick={() => setCashIn(c)}>{RP(c)}</button>)}
                <button className="cash-btn" onClick={() => setCashIn(total)}>Pas</button>
                <button className="cash-btn" onClick={() => setCashIn(Math.ceil(total/50000)*50000)}>Bulatkan</button>
                <button className="cash-btn" onClick={() => setCashIn(0)}>Reset</button>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:"1px solid var(--line)"}}>
                <span style={{fontSize:13, color:"var(--fg-2)"}}>Kembalian</span>
                <span className="mono" style={{fontWeight:600, fontSize:15, color: change > 0 ? "var(--ok)" : "var(--fg)"}}>{RP(change)}</span>
              </div>
            </>
          ) : (
            <div className="qris-card">
              <div style={{fontSize:11, fontWeight:600, color:"var(--fg-3)", textTransform:"uppercase", letterSpacing:".05em"}}>Scan untuk membayar</div>
              <QRPattern/>
              <div style={{fontSize:11, color:"var(--fg-3)"}}>Customer scan dari aplikasi e-wallet · expired 5 menit</div>
              <div style={{marginTop:10, fontSize:12, color:"var(--fg-2)"}}>Menunggu pembayaran...</div>
            </div>
          )}

          <div style={{marginTop:"auto", display:"flex", flexDirection:"column", gap:8}}>
            <button className="btn btn-primary btn-block btn-lg"
              disabled={pay === "Cash" && cashIn < total}
              onClick={() => onCheckout(unit, total, pay)}>
              <Icon name="check" size={14}/>
              {pay === "Cash" ? "Konfirmasi Pembayaran" : "Tandai Sudah Dibayar"}
            </button>
            <button className="btn btn-block" onClick={onBack}><Icon name="print" size={14}/> Print Struk Saja</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QRPattern() {
  // Pseudo-random deterministic QR-ish pattern. Just visual.
  const cells = React.useMemo(() => {
    const seed = 7;
    const arr = [];
    for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
      const inFinder = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
      let on;
      if (inFinder) {
        const rr = r > 13 ? r - 14 : r;
        const cc = c > 13 ? c - 14 : c;
        on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
      } else {
        on = ((r * 13 + c * 7 + seed) % 3 === 0) || ((r ^ c) % 5 === 0 && (r + c) % 2 === 0);
      }
      arr.push(on);
    }
    return arr;
  }, []);
  return (
    <div className="qris-pattern">
      {cells.map((on, i) => on ? <div key={i} className="qb" style={{gridRow: Math.floor(i/21)+1, gridColumn: (i%21)+1}}/> : null)}
    </div>
  );
}

window.UnitDrawer = UnitDrawer;
