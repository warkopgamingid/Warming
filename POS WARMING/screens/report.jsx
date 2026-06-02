// Laporan — Pendapatan & Pengeluaran
const BULAN_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const BULAN_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function targetKey(month, year) { return `pos.target.${year}-${String(month+1).padStart(2,"0")}`; }
function loadTarget(month, year) {
  try { return parseInt(localStorage.getItem(targetKey(month, year)) || "0", 10) || 0; } catch (e) { return 0; }
}
function saveTarget(month, year, value) {
  try { localStorage.setItem(targetKey(month, year), String(value)); } catch (e) {}
}

function ReportScreen() {
  const now = new Date();
  const [tab, setTab] = React.useState("pendapatan"); // pendapatan | pengeluaran

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Laporan</h1>
          <div className="page-sub">Rincian pendapatan dan pengeluaran</div>
        </div>
      </div>

      <div className="seg" style={{marginBottom:16, display:"inline-flex"}}>
        <button className={`seg-btn ${tab==="pendapatan"?"on":""}`} onClick={()=>setTab("pendapatan")}>
          <Icon name="chart" size={13} style={{marginRight:6, verticalAlign:"-2px"}}/>
          Pendapatan
        </button>
        <button className={`seg-btn ${tab==="pengeluaran"?"on":""}`} onClick={()=>setTab("pengeluaran")}>
          <Icon name="cash" size={13} style={{marginRight:6, verticalAlign:"-2px"}}/>
          Pengeluaran
        </button>
      </div>

      {tab === "pendapatan" ? <PendapatanTab/> : <PengeluaranTab/>}
    </>
  );
}

// ================== PENDAPATAN ==================
function PendapatanTab() {
  const now = new Date();
  const txns = window.useTransactions ? window.useTransactions() : [];
  const [periodMonth, setPeriodMonth] = React.useState(now.getMonth());
  const [periodYear, setPeriodYear] = React.useState(now.getFullYear());
  const [showExport, setShowExport] = React.useState(false);
  const [showTarget, setShowTarget] = React.useState(false);
  const [target, setTarget] = React.useState(() => loadTarget(now.getMonth(), now.getFullYear()));

  React.useEffect(() => {
    setTarget(loadTarget(periodMonth, periodYear));
  }, [periodMonth, periodYear]);

  // Filter transactions in selected period
  const periodTxns = React.useMemo(() => {
    return txns.filter(t => {
      const d = new Date(t.isoDate);
      return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
    });
  }, [txns, periodMonth, periodYear]);

  const totalSewa = periodTxns.reduce((a,t)=>a+(t.sewa||0),0);
  const totalFnb  = periodTxns.reduce((a,t)=>a+(t.fnb||0),0);
  const totalRevenue = totalSewa + totalFnb;
  const targetPct = target > 0 ? Math.min(100, Math.round((totalRevenue / target) * 100)) : 0;

  // Monthly chart data (12 months of chartYear, from real txns)
  const [chartYear, setChartYear] = React.useState(periodYear);
  React.useEffect(() => { setChartYear(periodYear); }, [periodYear]);

  const monthlyRevenue = React.useMemo(() => {
    return Array.from({length: 12}, (_, m) => {
      const monthTxns = txns.filter(t => {
        const d = new Date(t.isoDate);
        return d.getMonth() === m && d.getFullYear() === chartYear;
      });
      return {
        m,
        sewa: monthTxns.reduce((a,t)=>a+(t.sewa||0),0),
        fnb:  monthTxns.reduce((a,t)=>a+(t.fnb||0),0),
      };
    });
  }, [txns, chartYear]);
  const monthlyMax = Math.max(...monthlyRevenue.map(x => x.sewa + x.fnb), 1);

  const yearOptions = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

  // Payment breakdown (real)
  const cashTotal = periodTxns.filter(t=>t.pay==="Cash").reduce((a,t)=>a+t.total,0);
  const qrisTotal = periodTxns.filter(t=>t.pay==="QRIS").reduce((a,t)=>a+t.total,0);
  const payTotal  = cashTotal + qrisTotal;

  // Top items (real)
  const topMap = {};
  periodTxns.filter(t=>t.fnb>0).forEach(t=>{
    const k = t.unit;
    if (!topMap[k]) topMap[k] = {n:k, q:0, v:0};
    topMap[k].q += t.qty || 1;
    topMap[k].v += t.total;
  });
  const topItems = Object.values(topMap).sort((a,b)=>b.v-a.v).slice(0,5);

  return (
    <>
      <div style={{display:"flex", gap:8, alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap"}}>
        <div style={{fontSize:12, color:"var(--fg-3)"}}>
          Periode <b style={{color:"var(--fg-2)", fontWeight:600}}>{BULAN_NAMES[periodMonth]} {periodYear}</b>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <select className="input" value={periodMonth} onChange={e=>setPeriodMonth(parseInt(e.target.value,10))}
            style={{height:32, padding:"0 28px 0 10px", fontSize:13, minWidth:130}}>
            {BULAN_NAMES.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select className="input" value={periodYear} onChange={e=>setPeriodYear(parseInt(e.target.value,10))}
            style={{height:32, padding:"0 28px 0 10px", fontSize:13, minWidth:90}}>
            {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={()=>setShowExport(true)}>
            <Icon name="download" size={14}/> Export Data
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Pendapatan / Bulan</div>
          <div className="kpi-value tnum">{RP(totalRevenue)}</div>
          <div className="kpi-delta" style={{color:"var(--fg-3)"}}>{periodTxns.length} transaksi</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Rental</div>
          <div className="kpi-value tnum">{RP(totalSewa)}</div>
          <div className="kpi-delta">{totalRevenue>0 ? Math.round(totalSewa/totalRevenue*100) : 0}% dari total</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Makanan &amp; Minuman</div>
          <div className="kpi-value tnum">{RP(totalFnb)}</div>
          <div className="kpi-delta">{totalRevenue>0 ? Math.round(totalFnb/totalRevenue*100) : 0}% dari total</div>
        </div>
        <div className="kpi" style={{position:"relative"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div className="kpi-label">Target / Bulan</div>
            <button className="icon-btn" title="Atur target" onClick={()=>setShowTarget(true)} style={{width:22, height:22}}>
              <Icon name="edit" size={12}/>
            </button>
          </div>
          {target > 0 ? (
            <>
              <div className="kpi-value tnum">{RP(target)}</div>
              <div style={{height:5, background:"var(--surface-2)", borderRadius:999, overflow:"hidden", margin:"6px 0 4px"}}>
                <div style={{width: targetPct+"%", height:"100%",
                  background: targetPct >= 100 ? "var(--ok)" : targetPct >= 70 ? "var(--accent)" : "var(--warn)"}}/>
              </div>
              <div className="kpi-delta" style={{color: targetPct >= 100 ? "var(--ok)" : "var(--fg-3)"}}>
                {targetPct}% tercapai · {RP(Math.max(0, target - totalRevenue))} lagi
              </div>
            </>
          ) : (
            <>
              <div className="kpi-value tnum" style={{color:"var(--fg-3)", fontSize:18}}>Belum diset</div>
              <button className="btn" onClick={()=>setShowTarget(true)} style={{height:24, padding:"0 10px", fontSize:11, marginTop:6}}>+ Set Target</button>
            </>
          )}
        </div>
      </div>

      <div className="chart-wrap">
        <div className="card card-pad">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, gap:10, flexWrap:"wrap"}}>
            <div style={{fontSize:14, fontWeight:600}}>Pendapatan per Bulan</div>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <select className="input" value={chartYear} onChange={e=>setChartYear(parseInt(e.target.value,10))}
                style={{height:30, padding:"0 24px 0 10px", fontSize:12, minWidth:90}}>
                {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <div className="legend">
                <span><span className="legend-sw" style={{background:"color-mix(in oklch, var(--accent) 35%, var(--surface-2))"}}/>Rental</span>
                <span><span className="legend-sw" style={{background:"var(--accent)"}}/>Makanan &amp; Minuman</span>
              </div>
            </div>
          </div>
          <div className="bar-chart" style={{height:180}}>
            {monthlyRevenue.map((h,i) => {
              const total = h.sewa + h.fnb;
              const sewaH = total > 0 ? (h.sewa / monthlyMax) * 150 : 0;
              const fnbH  = total > 0 ? (h.fnb  / monthlyMax) * 150 : 0;
              const isCurrentMonth = chartYear === now.getFullYear() && i === now.getMonth();
              return (
                <div key={h.m} className={`bar-col ${i===0?"first":""}`}>
                  <div className="bar-tip">{BULAN_NAMES[h.m]} · {total > 0 ? RP(total) : "Belum ada"}</div>
                  {total > 0 ? (
                    <>
                      <div className="bar-fnb" style={{height: fnbH}}/>
                      <div className="bar-sewa" style={{height: sewaH}}/>
                    </>
                  ) : (
                    <div style={{height:2, background:"var(--line)", borderRadius:1, width:"100%", alignSelf:"flex-end"}}/>
                  )}
                  <div className="bar-x" style={{
                    fontWeight: isCurrentMonth ? 600 : 400,
                    color: isCurrentMonth ? "var(--accent)" : "var(--fg-3)"
                  }}>{BULAN_SHORT[h.m]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-pad">
          <div style={{fontSize:14, fontWeight:600, marginBottom:10}}>Metode Pembayaran</div>
          {[
            {label:"Cash", val:cashTotal, color:"var(--ok)"},
            {label:"QRIS", val:qrisTotal, color:"var(--accent)"},
          ].map(m => {
            const pct = payTotal > 0 ? Math.round(m.val/payTotal*100) : 0;
            return (
              <div key={m.label} style={{padding:"10px 0", borderBottom:"1px solid var(--line)"}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                  <span style={{fontWeight:500}}>{m.label}</span>
                  <span className="mono" style={{fontWeight:600}}>{RP(m.val)}</span>
                </div>
                <div style={{height:6, background:"var(--surface-2)", borderRadius:999, overflow:"hidden"}}>
                  <div style={{width: pct+"%", height:"100%", background: m.color}}/>
                </div>
                <div style={{fontSize:11, color:"var(--fg-3)", marginTop:4}}>{pct}% transaksi</div>
              </div>
            );
          })}

          <div style={{fontSize:14, fontWeight:600, margin:"16px 0 10px"}}>Top Menu F&B</div>
          {topItems.length === 0 ? (
            <div style={{fontSize:12, color:"var(--fg-3)", padding:"8px 0"}}>Belum ada transaksi F&B</div>
          ) : topItems.map(t => (
            <div key={t.n} style={{display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:13}}>
              <span style={{color:"var(--fg-2)"}}><b style={{color:"var(--fg)", fontWeight:500}}>{t.n}</b> <span style={{color:"var(--fg-3)"}}>· {t.q}×</span></span>
              <span className="mono">{RP(t.v)}</span>
            </div>
          ))}
        </div>
      </div>

      {showExport && <ExportDataModal onClose={()=>setShowExport(false)} txns={txns}/>}
      {showTarget && (
        <TargetModal
          month={periodMonth}
          year={periodYear}
          current={target}
          totalRevenue={totalRevenue}
          onClose={()=>setShowTarget(false)}
          onSave={(v)=>{ saveTarget(periodMonth, periodYear, v); setTarget(v); setShowTarget(false); }}
        />
      )}
    </>
  );
}

// ================== PENGELUARAN ==================
const EXP_KATEGORI = ["Bahan Baku","Operasional","Gaji & Bonus","Listrik & Air","Internet","Maintenance","Lainnya"];

function PengeluaranTab() {
  const now = new Date();
  const expenses = window.useExpenses ? window.useExpenses() : [];
  const [periodMonth, setPeriodMonth] = React.useState(now.getMonth());
  const [periodYear, setPeriodYear] = React.useState(now.getFullYear());
  const [showAdd, setShowAdd] = React.useState(false);

  const yearOptions = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

  const periodExp = React.useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.tanggal);
      return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
    }).slice().reverse();
  }, [expenses, periodMonth, periodYear]);

  const totalExp = periodExp.reduce((a,e)=>a+e.jumlah, 0);

  // Per kategori
  const perCat = {};
  periodExp.forEach(e => {
    perCat[e.kategori] = (perCat[e.kategori] || 0) + e.jumlah;
  });
  const catRows = Object.entries(perCat).sort((a,b)=>b[1]-a[1]);

  return (
    <>
      <div style={{display:"flex", gap:8, alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap"}}>
        <div style={{fontSize:12, color:"var(--fg-3)"}}>
          Periode <b style={{color:"var(--fg-2)", fontWeight:600}}>{BULAN_NAMES[periodMonth]} {periodYear}</b>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <select className="input" value={periodMonth} onChange={e=>setPeriodMonth(parseInt(e.target.value,10))}
            style={{height:32, padding:"0 28px 0 10px", fontSize:13, minWidth:130}}>
            {BULAN_NAMES.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select className="input" value={periodYear} onChange={e=>setPeriodYear(parseInt(e.target.value,10))}
            style={{height:32, padding:"0 28px 0 10px", fontSize:13, minWidth:90}}>
            {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
            <Icon name="plus" size={14}/> Tambah Pengeluaran
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        <div className="kpi">
          <div className="kpi-label">Total Pengeluaran</div>
          <div className="kpi-value tnum">{RP(totalExp)}</div>
          <div className="kpi-delta" style={{color:"var(--fg-3)"}}>{periodExp.length} entri</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Kategori Terbesar</div>
          <div className="kpi-value tnum" style={{fontSize: catRows.length ? 18 : 16, color: catRows.length ? "var(--fg)" : "var(--fg-3)"}}>
            {catRows.length ? catRows[0][0] : "—"}
          </div>
          <div className="kpi-delta">{catRows.length ? RP(catRows[0][1]) : "Belum ada data"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Rata-rata / Entri</div>
          <div className="kpi-value tnum">{RP(periodExp.length ? Math.round(totalExp/periodExp.length) : 0)}</div>
          <div className="kpi-delta" style={{color:"var(--fg-3)"}}>per pengeluaran</div>
        </div>
      </div>

      <div className="chart-wrap">
        <div className="card">
          <div style={{padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{fontSize:14, fontWeight:600}}>Daftar Pengeluaran</div>
            <div style={{fontSize:11, color:"var(--fg-3)"}}>{periodExp.length} entri</div>
          </div>
          <div style={{maxHeight:480, overflow:"auto"}}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{width:100}}>ID</th>
                  <th style={{width:110}}>Tanggal</th>
                  <th style={{width:140}}>Kategori</th>
                  <th>Deskripsi</th>
                  <th className="r" style={{width:130}}>Jumlah</th>
                  <th style={{width:50}}></th>
                </tr>
              </thead>
              <tbody>
                {periodExp.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:"center", padding:60, color:"var(--fg-3)"}}>
                    <Icon name="cash" size={28} style={{opacity:.3, marginBottom:8}}/>
                    <div style={{fontSize:13, marginTop:4}}>Belum ada pengeluaran</div>
                    <div style={{fontSize:11, marginTop:4}}>Klik "Tambah Pengeluaran" untuk mulai mencatat.</div>
                  </td></tr>
                )}
                {periodExp.map(e => (
                  <tr key={e.id}>
                    <td className="mono" style={{fontSize:12, fontWeight:600}}>{e.id}</td>
                    <td style={{color:"var(--fg-2)"}}>{new Date(e.tanggal).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}</td>
                    <td>
                      <span style={{
                        display:"inline-block", padding:"2px 8px", borderRadius:999,
                        fontSize:11, fontWeight:500,
                        background:"var(--surface-2)", color:"var(--fg-2)",
                        border:"1px solid var(--border)",
                      }}>{e.kategori}</span>
                    </td>
                    <td style={{color:"var(--fg-2)"}}>{e.deskripsi || "—"}</td>
                    <td className="r mono" style={{fontWeight:600}}>{RP(e.jumlah)}</td>
                    <td>
                      <button className="icon-btn" title="Hapus" onClick={()=>{
                        if (confirm(`Hapus pengeluaran "${e.deskripsi || e.kategori}"?`)) window.deleteExpense(e.id);
                      }}><Icon name="x" size={12}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{fontSize:14, fontWeight:600, marginBottom:10}}>Per Kategori</div>
          {catRows.length === 0 ? (
            <div style={{fontSize:12, color:"var(--fg-3)", padding:"8px 0"}}>Belum ada data</div>
          ) : catRows.map(([k,v]) => {
            const pct = totalExp > 0 ? Math.round(v/totalExp*100) : 0;
            return (
              <div key={k} style={{padding:"10px 0", borderBottom:"1px solid var(--line)"}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                  <span style={{fontWeight:500, fontSize:13}}>{k}</span>
                  <span className="mono" style={{fontWeight:600, fontSize:13}}>{RP(v)}</span>
                </div>
                <div style={{height:6, background:"var(--surface-2)", borderRadius:999, overflow:"hidden"}}>
                  <div style={{width: pct+"%", height:"100%", background:"var(--accent)"}}/>
                </div>
                <div style={{fontSize:11, color:"var(--fg-3)", marginTop:4}}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && <AddExpenseModal onClose={()=>setShowAdd(false)}/>}
    </>
  );
}

function AddExpenseModal({ onClose }) {
  const today = new Date().toISOString().slice(0,10);
  const [tanggal, setTanggal] = React.useState(today);
  const [kategori, setKategori] = React.useState(EXP_KATEGORI[0]);
  const [deskripsi, setDeskripsi] = React.useState("");
  const [jumlah, setJumlah] = React.useState("");
  const num = parseInt(jumlah, 10) || 0;
  const valid = num > 0 && tanggal;

  const submit = () => {
    if (!valid) return;
    window.addExpense({ tanggal, kategori, deskripsi: deskripsi.trim(), jumlah: num });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:460, maxWidth:"90vw"}}>
        <div className="modal-head">
          <div>
            <h2 style={{fontSize:16, fontWeight:600, margin:0}}>Tambah Pengeluaran</h2>
            <div style={{fontSize:12, color:"var(--fg-3)", marginTop:2}}>Catat pengeluaran (belanja, operasional, dll.)</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-body" style={{display:"flex", flexDirection:"column", gap:14}}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div className="field" style={{margin:0}}>
              <label>Tanggal</label>
              <input type="date" className="input" value={tanggal} onChange={e=>setTanggal(e.target.value)}/>
            </div>
            <div className="field" style={{margin:0}}>
              <label>Kategori</label>
              <select className="input" value={kategori} onChange={e=>setKategori(e.target.value)}>
                {EXP_KATEGORI.map(k=><option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Deskripsi <span style={{color:"var(--fg-3)", fontWeight:400}}>(opsional)</span></label>
            <input type="text" className="input" value={deskripsi} onChange={e=>setDeskripsi(e.target.value)}
              placeholder="Misal: Belanja stok mie, Bayar listrik, dll."/>
          </div>
          <div className="field">
            <label>Jumlah</label>
            <div className="input-prefix">
              <span>Rp</span>
              <input type="number" placeholder="0" min="0" value={jumlah} onChange={e=>setJumlah(e.target.value)} autoFocus/>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}
            style={{opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed"}}>
            <Icon name="check" size={14}/> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Target Bulanan Modal ----------
function TargetModal({ month, year, current, totalRevenue, onClose, onSave }) {
  const [val, setVal] = React.useState(current ? String(current) : "");
  const num = parseInt(val, 10) || 0;
  const valid = num > 0;
  const base = Math.max(totalRevenue, 5000000);
  const suggestions = [
    Math.ceil(base * 1.0  / 1000000) * 1000000,
    Math.ceil(base * 1.15 / 1000000) * 1000000,
    Math.ceil(base * 1.3  / 1000000) * 1000000,
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:460, maxWidth:"90vw"}}>
        <div className="modal-head">
          <div>
            <h2 style={{fontSize:16, fontWeight:600, margin:0}}>Atur Target Bulanan</h2>
            <div style={{fontSize:12, color:"var(--fg-3)", marginTop:2}}>
              Periode <b style={{color:"var(--fg-2)"}}>{BULAN_NAMES[month]} {year}</b>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-body" style={{display:"flex", flexDirection:"column", gap:14}}>
          <div style={{background:"var(--surface-2)", borderRadius:"var(--radius)", padding:"12px 14px", fontSize:12, color:"var(--fg-2)", lineHeight:1.55}}>
            <div style={{fontWeight:600, color:"var(--fg)", marginBottom:6}}>💡 Cara menetapkan target</div>
            <div>1. Lihat pendapatan bulan lalu sebagai acuan dasar.</div>
            <div>2. Tambahkan <b>10–20%</b> untuk pertumbuhan yang realistis.</div>
            <div>3. Pertimbangkan musim ramai (libur, weekend panjang) atau event khusus.</div>
            <div>4. Target dapat diubah kapan saja per bulan.</div>
          </div>
          <div className="field">
            <label>Target Pendapatan</label>
            <div className="input-prefix">
              <span>Rp</span>
              <input type="number" placeholder="0" min="0" value={val} onChange={e=>setVal(e.target.value)} autoFocus/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11, color:"var(--fg-3)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:600, marginBottom:6}}>Saran cepat</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {suggestions.map(s => (
                <button key={s} className="btn" onClick={()=>setVal(String(s))}
                  style={{height:30, padding:"0 12px", fontSize:12}}>{RP(s)}</button>
              ))}
            </div>
          </div>
          {valid && (
            <div style={{fontSize:12, color:"var(--fg-3)"}}>
              Estimasi pencapaian saat ini: <b style={{color:"var(--fg)"}}>{Math.round(totalRevenue/num*100)}%</b> dari target
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={()=>onSave(num)} disabled={!valid}
            style={{opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed"}}>
            <Icon name="check" size={14}/> Simpan Target
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Export Data Modal ----------
function ExportDataModal({ onClose, txns }) {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0,10);
  const expenses = window.useExpenses ? window.useExpenses() : [];
  const [mode, setMode] = React.useState("tanggal");
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
  const [dateFrom, setDateFrom] = React.useState(iso(weekAgo));
  const [dateTo, setDateTo]     = React.useState(iso(today));
  const [month, setMonth] = React.useState(today.getMonth());
  const [year, setYear] = React.useState(today.getFullYear());
  const [busy, setBusy] = React.useState(false);

  const yearOptions = [];
  for (let y = today.getFullYear() - 3; y <= today.getFullYear() + 1; y++) yearOptions.push(y);

  const [from, to] = (() => {
    const a = new Date(dateFrom), b = new Date(dateTo);
    return a <= b ? [dateFrom, dateTo] : [dateTo, dateFrom];
  })();

  const fmtId = (s) => new Date(s).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"});
  const dayCount = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

  const periodLabel =
    mode === "tanggal" ? (from === to ? fmtId(from) : `${fmtId(from)} — ${fmtId(to)}`) :
    mode === "bulan"   ? `${BULAN_NAMES[month]} ${year}` :
                         `${year}`;

  // Simplified filename
  const fmtShort = (iso) => {
    const d = new Date(iso);
    return d.getDate() + BULAN_SHORT[d.getMonth()];
  };
  const fmtShortYear = (iso) => {
    const d = new Date(iso);
    return d.getDate() + BULAN_SHORT[d.getMonth()] + " " + d.getFullYear();
  };
  const fileName = (() => {
    if (mode === "tanggal") {
      const a = new Date(from), b = new Date(to);
      if (from === to) return `Laporan(${fmtShortYear(from)}).xlsx`;
      // same year?
      if (a.getFullYear() === b.getFullYear()) {
        return `Laporan(${fmtShort(from)}-${fmtShort(to)} ${b.getFullYear()}).xlsx`;
      }
      return `Laporan(${fmtShortYear(from)}-${fmtShortYear(to)}).xlsx`;
    }
    if (mode === "bulan") return `Laporan(${BULAN_SHORT[month]}-${year}).xlsx`;
    return `Laporan(${year}).xlsx`;
  })();

  // Filter real txns into period rows
  const periodTxns = React.useMemo(() => {
    return txns.filter(t => {
      if (mode === "tanggal") {
        return t.isoDate >= from && t.isoDate <= to;
      } else if (mode === "bulan") {
        const d = new Date(t.isoDate);
        return d.getMonth() === month && d.getFullYear() === year;
      } else {
        const d = new Date(t.isoDate);
        return d.getFullYear() === year;
      }
    });
  }, [txns, mode, from, to, month, year]);

  // Filter expenses with the SAME period rule, so the export pairs cleanly.
  const periodExpenses = React.useMemo(() => {
    return expenses.filter(e => {
      if (!e.tanggal) return false;
      if (mode === "tanggal") {
        return e.tanggal >= from && e.tanggal <= to;
      } else if (mode === "bulan") {
        const d = new Date(e.tanggal);
        return d.getMonth() === month && d.getFullYear() === year;
      } else {
        const d = new Date(e.tanggal);
        return d.getFullYear() === year;
      }
    });
  }, [expenses, mode, from, to, month, year]);

  const downloadExcel = () => {
    setBusy(true);
    try {
      // Sort: terbaru di atas untuk pendapatan, tanggal asc untuk pengeluaran.
      const txnsSorted = [...periodTxns].sort((a, b) => {
        if (a.isoDate !== b.isoDate) return a.isoDate < b.isoDate ? 1 : -1;
        return (a.time || "") < (b.time || "") ? 1 : -1;
      });
      const expSorted = [...periodExpenses].sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));

      const stamp = new Date().toLocaleString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      // Compute actual ISO from/to for the export header regardless of filter mode
      const exportFrom = mode === "tanggal" ? from
        : mode === "bulan" ? iso(new Date(year, month, 1))
        : iso(new Date(year, 0, 1));
      const exportTo = mode === "tanggal" ? to
        : mode === "bulan" ? iso(new Date(year, month + 1, 0))
        : iso(new Date(year, 11, 31));

      const blob = window.buildLaporanXlsx({
        title:    "LAPORAN KEUANGAN",
        subtitle: `Warming POS · Diekspor ${stamp}`,
        from:     exportFrom,
        to:       exportTo,
        txns:     txnsSorted,
        expenses: expSorted,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:480, maxWidth:"90vw"}}>
        <div className="modal-head">
          <div>
            <h2 style={{fontSize:16, fontWeight:600, margin:0}}>Export Data Transaksi</h2>
            <div style={{fontSize:12, color:"var(--fg-3)", marginTop:2}}>Pilih periode, unduh sebagai file Excel</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <div className="modal-body" style={{display:"flex", flexDirection:"column", gap:14}}>
          <div className="field">
            <label>Periode</label>
            <div className="seg" style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:4}}>
              {[{k:"tanggal",l:"Per Tanggal"},{k:"bulan",l:"Per Bulan"},{k:"tahun",l:"Per Tahun"}].map(o=>(
                <button key={o.k} className={`seg-btn ${mode===o.k?"on":""}`} onClick={()=>setMode(o.k)}>{o.l}</button>
              ))}
            </div>
          </div>

          {mode === "tanggal" && (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"end"}}>
                <div className="field" style={{margin:0}}>
                  <label>Dari Tanggal</label>
                  <input type="date" className="input" value={dateFrom} max={dateTo} onChange={e=>setDateFrom(e.target.value)}/>
                </div>
                <div style={{paddingBottom:10, color:"var(--fg-3)", fontSize:12, textAlign:"center"}}>→</div>
                <div className="field" style={{margin:0}}>
                  <label>Sampai Tanggal</label>
                  <input type="date" className="input" value={dateTo} min={dateFrom} max={iso(today)} onChange={e=>setDateTo(e.target.value)}/>
                </div>
              </div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {[{l:"Hari ini",days:0},{l:"7 hari",days:6},{l:"30 hari",days:29},{l:"Bulan ini",days:-1}].map(p=>(
                  <button key={p.l} type="button"
                    style={{padding:"5px 10px", fontSize:11, borderRadius:999, border:"1px solid var(--border)", background:"var(--surface-2)", color:"var(--fg-2)", cursor:"pointer", fontWeight:500}}
                    onClick={()=>{
                      const t = new Date();
                      if (p.days === -1) {
                        const first = new Date(t.getFullYear(), t.getMonth(), 1);
                        setDateFrom(iso(first)); setDateTo(iso(t));
                      } else {
                        const f = new Date(t); f.setDate(t.getDate() - p.days);
                        setDateFrom(iso(f)); setDateTo(iso(t));
                      }
                    }}>{p.l}</button>
                ))}
              </div>
              <div style={{fontSize:11, color:"var(--fg-3)"}}>Rentang: <b style={{color:"var(--fg-2)"}}>{dayCount} hari</b></div>
            </div>
          )}

          {mode === "bulan" && (
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <div className="field"><label>Bulan</label>
                <select className="input" value={month} onChange={e=>setMonth(parseInt(e.target.value,10))}>
                  {BULAN_NAMES.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="field"><label>Tahun</label>
                <select className="input" value={year} onChange={e=>setYear(parseInt(e.target.value,10))}>
                  {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {mode === "tahun" && (
            <div className="field"><label>Tahun</label>
              <select className="input" value={year} onChange={e=>setYear(parseInt(e.target.value,10))}>
                {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <div style={{background:"var(--surface-2)", borderRadius:"var(--radius)", padding:"12px 14px", fontSize:12, color:"var(--fg-2)", display:"flex", gap:10, alignItems:"flex-start"}}>
            <Icon name="download" size={14} style={{marginTop:2, color:"var(--accent)"}}/>
            <div>
              File akan diunduh sebagai <b className="mono" style={{color:"var(--fg)"}}>{fileName}</b><br/>
              Berisi <b style={{color:"var(--fg)"}}>{periodTxns.length} transaksi</b> &amp; <b style={{color:"var(--fg)"}}>{periodExpenses.length} pengeluaran</b> dari periode <b style={{color:"var(--fg)"}}>{periodLabel}</b>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={downloadExcel} disabled={busy} style={{opacity: busy ? 0.6 : 1}}>
            <Icon name="download" size={14}/> {busy ? "Menyiapkan..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.ReportScreen = ReportScreen;
