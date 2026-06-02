// Riwayat Transaksi — reads from shared transaction store
const TODAY_ISO_H = new Date().toISOString().slice(0,10);

function fmtTanggalID(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
}

function HistoryScreen() {
  const allTxns = window.useTransactions ? window.useTransactions() : [];
  const [search, setSearch] = React.useState("");
  const [pay, setPay] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [date, setDate] = React.useState(TODAY_ISO_H);

  const all = React.useMemo(
    () => allTxns.filter(t => t.isoDate === date).slice().reverse(),
    [allTxns, date]
  );

  const filtered = all.filter(h => {
    if (pay !== "all" && h.pay !== pay) return false;
    if (status !== "all" && h.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(h.id.toLowerCase().includes(q) ||
            (h.unit||"").toLowerCase().includes(q) ||
            (h.customer||"").toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const totals = filtered.reduce(
    (a, h) => ({ sewa: a.sewa+(h.sewa||0), fnb: a.fnb+(h.fnb||0), total: a.total+(h.total||0) }),
    { sewa:0, fnb:0, total:0 }
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Riwayat Transaksi</h1>
          <div className="page-sub">{filtered.length} transaksi · {fmtTanggalID(date)}</div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          {/* Export buttons — DB-ready (Transactions / TransactionItems / Payments).
              Uses existing .btn / .btn-sm classes so visual style is unchanged. */}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => window.dbExport && window.dbExport.xlsx(allTxns)}
            title="Export semua transaksi ke .xlsx (3 sheet: Transactions, TransactionItems, Payments)"
          >Export Excel</button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => window.dbExport && window.dbExport.csv(allTxns)}
            title="Export semua transaksi ke .csv (zip berisi 3 file)"
          >Export CSV</button>
          <input
            type="date"
            className="input"
            value={date}
            max={TODAY_ISO_H}
            onChange={e=>setDate(e.target.value)}
            style={{height:32, padding:"0 10px", fontSize:13, minWidth:160}}
          />
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        <div className="kpi"><div className="kpi-label">Total Transaksi</div><div className="kpi-value tnum">{filtered.length}</div></div>
        <div className="kpi"><div className="kpi-label">Pendapatan Sewa</div><div className="kpi-value tnum">{RP(totals.sewa)}</div></div>
        <div className="kpi"><div className="kpi-label">Pendapatan F&B</div><div className="kpi-value tnum">{RP(totals.fnb)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Pendapatan</div><div className="kpi-value tnum">{RP(totals.total)}</div></div>
      </div>

      <div className="card">
        <div style={{padding:"14px 18px", display:"flex", gap:10, alignItems:"center", borderBottom:"1px solid var(--line)", flexWrap:"wrap"}}>
          <div style={{position:"relative", flex:1, maxWidth:340, minWidth:200}}>
            <span style={{position:"absolute", left:11, top:10, color:"var(--fg-3)"}}><Icon name="search" size={14}/></span>
            <input
              className="input"
              style={{width:"100%", paddingLeft:32}}
              placeholder="Cari ID atau item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="seg">
            {[["all","Semua"],["Cash","Cash"],["QRIS","QRIS"]].map(([k,l]) => (
              <button key={k} className={`seg-btn ${pay===k?"on":""}`} onClick={() => setPay(k)}>{l}</button>
            ))}
          </div>
          <div className="seg">
            {[["all","Semua Status"],["Berhasil","Berhasil"],["Gagal","Gagal"]].map(([k,l]) => (
              <button key={k} className={`seg-btn ${status===k?"on":""}`} onClick={() => setStatus(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{maxHeight:520, overflowY:"auto", overflowX:"auto", WebkitOverflowScrolling:"touch"}}>
          <table className="table" style={{minWidth:560}}>
            <thead>
              <tr>
                <th style={{width:100}}>ID</th>
                <th style={{width:80}}>Waktu</th>
                <th>Item</th>
                <th className="r" style={{width:60}}>Qty</th>
                <th className="r" style={{width:120}}>Total</th>
                <th style={{width:80}}>Bayar</th>
                <th style={{width:100}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{textAlign:"center", padding:60, color:"var(--fg-3)"}}>
                  <Icon name="receipt" size={28} style={{opacity:.3, marginBottom:8}}/>
                  <div style={{fontSize:13, marginTop:4}}>Belum ada transaksi</div>
                  <div style={{fontSize:11, marginTop:4}}>Riwayat akan muncul setelah Anda menyelesaikan transaksi di Dashboard.</div>
                </td></tr>
              )}
              {filtered.map(h => (
                <tr key={h.id}>
                  <td className="mono" style={{fontSize:12, fontWeight:600}}>{h.id}</td>
                  <td style={{color:"var(--fg-2)"}}>{h.time}</td>
                  <td>{h.unit} <span style={{color:"var(--fg-3)", fontSize:11}}>· {h.kind}</span></td>
                  <td className="r mono">{h.qty}</td>
                  <td className="r mono" style={{fontWeight:600}}>{RP(h.total)}</td>
                  <td><span className={`pill ${h.pay==="Cash" ? "pill-cash" : "pill-qris"}`}>{h.pay}</span></td>
                  <td>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:6,
                      padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:500,
                      background: h.status === "Berhasil"
                        ? "color-mix(in oklch, var(--accent) 14%, transparent)"
                        : "color-mix(in oklch, var(--warn) 14%, transparent)",
                      color: h.status === "Berhasil" ? "var(--accent)" : "var(--warn)",
                      border: "1px solid " + (h.status === "Berhasil"
                        ? "color-mix(in oklch, var(--accent) 30%, transparent)"
                        : "color-mix(in oklch, var(--warn) 30%, transparent)"),
                    }}>
                      <span style={{width:6, height:6, borderRadius:999, background: h.status === "Berhasil" ? "var(--accent)" : "var(--warn)"}}/>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

window.HistoryScreen = HistoryScreen;
