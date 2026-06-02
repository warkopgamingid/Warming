// Manajemen Menu & Paket
// All product/ingredient/electronic data comes from the central
// inventory store (inventory-store.jsx). No local state for data.
const ELEKTRONIK_STATUSES = ["Sewa", "Non-Sewa", "Service", "Ready", "Not Ready"];

function elektronikStatusClass(s) {
  // map to existing .status modifier classes in styles.css
  if (s === "Ready") return "aktif";          // green, pulse
  if (s === "Sewa") return "paket";           // blue/accent, pulse
  if (s === "Non-Sewa") return "idle";        // neutral grey
  if (s === "Service") return "maintenance";  // amber
  if (s === "Not Ready") return "warning";    // red
  return "";
}

function MenuMgrScreen() {
  const [tab, setTab] = React.useState("menu"); // menu | bahan | elektronik
  const [cat, setCat] = React.useState("Semua");
  // Subscribed to the central inventory store — auto-rerenders on change.
  const allItems = window.useProducts();
  const bahan = window.useIngredients();
  const elektronik = window.useElectronics();
  // Menu tab covers Makanan / Minuman / Rental (paket sewa).
  const items = React.useMemo(
    () => allItems.filter(m => m.cat === "Makanan" || m.cat === "Minuman" || m.cat === "Rental"),
    [allItems]
  );
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [editingEl, setEditingEl] = React.useState(null);
  const [editingBahan, setEditingBahan] = React.useState(null);

  const cats = [
    {k:"Semua",   count: items.length},
    {k:"Makanan", count: items.filter(m=>m.cat==="Makanan").length},
    {k:"Minuman", count: items.filter(m=>m.cat==="Minuman").length},
    {k:"Rental",  count: items.filter(m=>m.cat==="Rental").length},
  ];
  const filtered = cat === "Semua" ? items : items.filter(m => m.cat === cat);

  // Handlers delegate to the store. All other screens see the change too.
  const handleAdd = (newItem) => {
    window.addProduct(newItem);
    setShowModal(false);
  };

  const handleSave = (updated) => {
    window.updateProduct(updated.id, updated);
    setEditing(null);
  };

  const handleDelete = (id) => {
    window.deleteProduct(id);
  };

  const handleAddElektronik = (newUnit) => {
    window.addElectronic(newUnit);
    setShowModal(false);
  };

  const handleSaveElektronik = (updated) => {
    window.updateElectronic(updated.id, updated);
    setEditingEl(null);
  };

  const handleAddBahan = (newItem) => {
    window.addIngredient(newItem);
    setShowModal(false);
  };

  const handleSaveBahan = (updated) => {
    window.updateIngredient(updated.id, updated);
    setEditingBahan(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Inventory</h1>
          <div className="page-sub">Atur item F&B dan paket sewa</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <div className="seg">
            <button className={`seg-btn ${tab==="menu"?"on":""}`} onClick={()=>setTab("menu")}>Menu</button>
            <button className={`seg-btn ${tab==="bahan"?"on":""}`} onClick={()=>setTab("bahan")}>Bahan Baku</button>
            <button className={`seg-btn ${tab==="elektronik"?"on":""}`} onClick={()=>setTab("elektronik")}>Elektronik</button>
          </div>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
            <Icon name="plus" size={14}/> {tab==="elektronik" ? "Tambah Unit" : "Tambah Item"}
          </button>
        </div>
      </div>

      {tab === "menu" && (
        <div className="card">
          <div className="menu-mgr-grid">
            <div className="cat-list">
              <div style={{fontSize:10, color:"var(--fg-3)", textTransform:"uppercase", letterSpacing:".06em", fontWeight:600, padding:"4px 10px 8px"}}>Kategori</div>
              {cats.map(c => (
                <div key={c.k} className={`cat-list-item ${cat===c.k ? "on" : ""}`} onClick={() => setCat(c.k)}>
                  <span>{c.k}</span>
                  <span className="count">{c.count}</span>
                </div>
              ))}
            </div>
            <div style={{padding:0}}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:60}}></th>
                    <th>Nama</th>
                    <th>Kategori</th>
                    <th className="r">Modal</th>
                    <th className="r">Harga Jual</th>
                    <th className="r">Stok</th>
                    <th>Status</th>
                    <th style={{width:80}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const isRental = m.cat === "Rental";
                    return (
                    <tr key={m.id}>
                      <td>
                        <div style={{width:36, height:36, borderRadius:6, background:"repeating-linear-gradient(45deg, var(--surface-2), var(--surface-2) 4px, var(--bg) 4px, var(--bg) 8px)", border:"1px dashed var(--line)"}}/>
                      </td>
                      <td style={{fontWeight:500}}>{m.name}</td>
                      <td>
                        <span className="pill">{m.cat}</span>
                        {isRental && m.psType && (
                          <span className="pill" style={{marginLeft:6}}>{m.psType}</span>
                        )}
                      </td>
                      <td className="r mono" style={{color:"var(--fg-3)"}}>{m.cost ? RP(m.cost) : "—"}</td>
                      <td className="r mono">{RP(m.price)}</td>
                      <td className="r mono" style={{color: isRental ? "var(--fg-3)" : (m.stock < 10 ? "var(--warn)" : "var(--fg-2)")}}>
                        {isRental ? (m.promo || "—") : m.stock}
                      </td>
                      <td>
                        {isRental ? (
                          <span className="status aktif" style={{fontSize:10}}>
                            <span className="status-dot"/>Paket sewa
                          </span>
                        ) : (
                          <span className={`status ${m.stock < 10 ? "warning" : "aktif"}`} style={{fontSize:10}}>
                            <span className="status-dot"/>
                            {m.stock < 10 ? "Stok rendah" : "Tersedia"}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{display:"flex", gap:4, justifyContent:"flex-end"}}>
                          <button className="icon-btn" title="Edit" onClick={()=>setEditing(m)}><Icon name="edit" size={14}/></button>
                          <button className="icon-btn" title="Hapus" onClick={()=>handleDelete(m.id)}><Icon name="trash" size={14}/></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "bahan" && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th className="r" style={{width:160}}>Harga</th>
                <th className="r" style={{width:100}}>Stok</th>
                <th style={{width:160}}>Status</th>
                <th style={{width:80}}></th>
              </tr>
            </thead>
            <tbody>
              {bahan.map(b => {
                const low = b.stock < 10;
                return (
                  <tr key={b.id}>
                    <td style={{fontWeight:500}}>
                      <Icon name="package" size={14} style={{verticalAlign:-2, marginRight:8, color:"var(--accent)"}}/>
                      {b.name}
                    </td>
                    <td className="r mono">{RP(b.price)}</td>
                    <td className="r mono" style={{color: low ? "var(--warn)" : "var(--fg-2)"}}>{b.stock}</td>
                    <td>
                      <span className={`status ${low ? "warning" : "aktif"}`} style={{fontSize:10}}>
                        <span className="status-dot"/>{low ? "Stok rendah" : "Tersedia"}
                      </span>
                    </td>
                    <td>
                      <div style={{display:"flex", gap:4, justifyContent:"flex-end"}}>
                        <button className="icon-btn" title="Edit" onClick={()=>setEditingBahan(b)}><Icon name="edit" size={14}/></button>
                        <button
                          className="icon-btn"
                          title="Hapus"
                          onClick={() => window.deleteIngredient(b.id)}
                        ><Icon name="trash" size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "elektronik" && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th style={{width:180}}>Unit</th>
                <th className="r" style={{width:100}}>Stok</th>
                <th style={{width:140}}>Status</th>
                <th style={{width:80}}></th>
              </tr>
            </thead>
            <tbody>
              {elektronik.map(e => (
                  <tr key={e.id}>
                    <td style={{fontWeight:500}}>
                      <Icon name="package" size={14} style={{verticalAlign:-2, marginRight:8, color:"var(--accent)"}}/>
                      {e.name}
                    </td>
                    <td><span className="pill">{e.unit}</span></td>
                    <td className="r mono" style={{color: e.stock < 2 ? "var(--warn)" : "var(--fg-2)"}}>{e.stock}</td>
                    <td>
                      <span className={`status ${elektronikStatusClass(e.status)}`} style={{fontSize:10}}>
                        <span className="status-dot"/>{e.status}
                      </span>
                    </td>
                    <td>
                      <div style={{display:"flex", gap:4, justifyContent:"flex-end"}}>
                        <button className="icon-btn" title="Edit" onClick={()=>setEditingEl(e)}><Icon name="edit" size={14}/></button>
                        <button
                          className="icon-btn"
                          title="Hapus"
                          onClick={() => window.deleteElectronic(e.id)}
                        ><Icon name="trash" size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && tab === "menu" && <ItemModal mode="add" onClose={()=>setShowModal(false)} onSubmit={handleAdd}/>}
      {showModal && tab === "bahan" && <BahanModal mode="add" onClose={()=>setShowModal(false)} onSubmit={handleAddBahan}/>}
      {showModal && tab === "elektronik" && <ElektronikModal mode="add" onClose={()=>setShowModal(false)} onSubmit={handleAddElektronik}/>}
      {editing && <ItemModal mode="edit" item={editing} onClose={()=>setEditing(null)} onSubmit={handleSave}/>}
      {editingBahan && <BahanModal mode="edit" item={editingBahan} onClose={()=>setEditingBahan(null)} onSubmit={handleSaveBahan}/>}
      {editingEl && <ElektronikModal mode="edit" item={editingEl} onClose={()=>setEditingEl(null)} onSubmit={handleSaveElektronik}/>}
    </>
  );
}

function ItemModal({ mode, item, onClose, onSubmit }) {
  const isEdit = mode === "edit";
  const [name, setName] = React.useState(item?.name || "");
  const [category, setCategory] = React.useState(item?.cat || "Makanan");
  const [stock, setStock] = React.useState(item?.stock != null ? String(item.stock) : "");
  const [cost, setCost] = React.useState(item?.cost != null ? String(item.cost) : "");
  const [price, setPrice] = React.useState(item?.price != null ? String(item.price) : "");
  // Rental-only fields
  const [psType, setPsType] = React.useState(item?.psType || "PS4");
  const [promo, setPromo] = React.useState(item?.promo || "Non-Promo");

  const isRental = category === "Rental";
  const valid = isRental
    ? name.trim() && price !== "" && (psType === "PS4" || psType === "PS5") && (promo === "Promo" || promo === "Non-Promo")
    : name.trim() && stock !== "" && price !== "";

  const submit = () => {
    if (!valid) return;
    const base = {
      ...(item || {}),
      id: item?.id || ("new-" + Date.now()),
      name: name.trim(),
      cat: category,
      price: parseInt(price, 10) || 0,
      img: item?.img ?? null,
    };
    const payload = isRental
      ? {
          ...base,
          psType,
          promo,                       // "Promo" | "Non-Promo"
          durMin: item?.durMin || 60,  // legacy default — paket pakai 60m
          // Rental items don't track F&B stock or cost.
          stock: 1,
          cost: 0,
        }
      : {
          ...base,
          stock: parseInt(stock, 10) || 0,
          cost: parseInt(cost, 10) || 0,
          // Strip rental fields if category was switched away.
          psType: undefined,
          promo: undefined,
          durMin: undefined,
        };
    onSubmit(payload);
  };

  const margin = (parseInt(price,10)||0) - (parseInt(cost,10)||0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:480, maxWidth:"90vw"}}>
        <div className="modal-head">
          <div>
            <h2 style={{fontSize:16, fontWeight:600, margin:0}}>
              {isEdit ? "Edit Item" : "Tambah Item Baru"}
            </h2>
            <div style={{fontSize:12, color:"var(--fg-3)", marginTop:2}}>
              {isEdit ? "Perbarui detail item, lalu klik Simpan" : "Item akan langsung tersedia di Inventory & Dashboard"}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <div className="modal-body" style={{display:"flex", flexDirection:"column", gap:14}}>
          <div className="field">
            <label>Nama Produk</label>
            <input
              type="text"
              className="input"
              placeholder="Mis. Indomie Goreng"
              value={name}
              onChange={e=>setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Kategori</label>
            <div className="seg" style={{width:"fit-content"}}>
              <button
                className={`seg-btn ${category==="Makanan"?"on":""}`}
                onClick={()=>setCategory("Makanan")}
              >Makanan</button>
              <button
                className={`seg-btn ${category==="Minuman"?"on":""}`}
                onClick={()=>setCategory("Minuman")}
              >Minuman</button>
              <button
                className={`seg-btn ${category==="Rental"?"on":""}`}
                onClick={()=>setCategory("Rental")}
              >Rental</button>
            </div>
          </div>

          {isRental && (
            <div className="field">
              <label>Tipe Unit</label>
              <div className="seg" style={{width:"fit-content"}}>
                <button
                  className={`seg-btn ${psType==="PS4"?"on":""}`}
                  onClick={()=>setPsType("PS4")}
                >PS4</button>
                <button
                  className={`seg-btn ${psType==="PS5"?"on":""}`}
                  onClick={()=>setPsType("PS5")}
                >PS5</button>
              </div>
            </div>
          )}

          {isRental ? (
            <div className="field">
              <label>Paket</label>
              <select
                className="select"
                value={promo}
                onChange={e=>setPromo(e.target.value)}
              >
                <option value="Non-Promo">Non-Promo</option>
                <option value="Promo">Promo</option>
              </select>
            </div>
          ) : (
            <div className="field">
              <label>Jumlah Stok</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                min="0"
                value={stock}
                onChange={e=>setStock(e.target.value)}
              />
            </div>
          )}

          <div style={{display:"grid", gridTemplateColumns: isRental ? "1fr" : "1fr 1fr", gap:12}}>
            {!isRental && (
              <div className="field">
                <label>Harga Modal</label>
                <div className="input-prefix">
                  <span>Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={cost}
                    onChange={e=>setCost(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="field">
              <label>{isRental ? "Harga Paket" : "Harga Jual"}</label>
              <div className="input-prefix">
                <span>Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={price}
                  onChange={e=>setPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {!isRental && cost && price && (
            <div style={{
              fontSize:12,
              padding:"8px 10px",
              background:"var(--surface-2)",
              border:"1px solid var(--line)",
              borderRadius:6,
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center"
            }}>
              <span style={{color:"var(--fg-3)"}}>Margin per item</span>
              <span className="mono" style={{
                fontWeight:600,
                color: margin > 0 ? "var(--ok)" : margin < 0 ? "var(--err)" : "var(--fg-2)"
              }}>
                {margin >= 0 ? "+" : "−"}{RP(Math.abs(margin))}
              </span>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Batal</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!valid}
            style={{opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed"}}
          >
            {isEdit ? <><Icon name="check" size={14}/> Simpan</> : <><Icon name="plus" size={14}/> Tambah ke Inventory</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ElektronikModal({ mode, item, onClose, onSubmit }) {
  const isEdit = mode === "edit";
  const [name, setName] = React.useState(item?.name || "");
  const [unit, setUnit] = React.useState(item?.unit || "");
  const [stock, setStock] = React.useState(item?.stock != null ? String(item.stock) : "");
  const [status, setStatus] = React.useState(item?.status || "Ready");

  const valid = name.trim() && unit.trim() && stock !== "";

  const submit = () => {
    if (!valid) return;
    onSubmit({
      ...(item || {}),
      id: item?.id || ("el-" + Date.now()),
      name: name.trim(),
      unit: unit.trim(),
      stock: parseInt(stock, 10) || 0,
      status,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:440, maxWidth:"90vw"}}>
        <div className="modal-head">
          <div>
            <h2 style={{fontSize:16, fontWeight:600, margin:0}}>
              {isEdit ? "Edit Unit Elektronik" : "Tambah Unit Elektronik"}
            </h2>
            <div style={{fontSize:12, color:"var(--fg-3)", marginTop:2}}>
              {isEdit ? "Perbarui nama, stok, atau status" : "Tambahkan perangkat ke daftar inventory"}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <div className="modal-body" style={{display:"flex", flexDirection:"column", gap:14}}>
          <div className="field">
            <label>Nama Produk</label>
            <input
              type="text"
              className="input"
              placeholder="Mis. Playstation 5"
              value={name}
              onChange={e=>setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Unit / Tipe</label>
            <input
              type="text"
              className="input"
              placeholder="Mis. Console, Display, Pendingin"
              value={unit}
              onChange={e=>setUnit(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Jumlah Stok</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              min="0"
              value={stock}
              onChange={e=>setStock(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Status</label>
            <select
              className="select"
              value={status}
              onChange={e=>setStatus(e.target.value)}
            >
              {ELEKTRONIK_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Batal</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!valid}
            style={{opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed"}}
          >
            {isEdit ? <><Icon name="check" size={14}/> Simpan</> : <><Icon name="plus" size={14}/> Tambah Unit</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function BahanModal({ mode, item, onClose, onSubmit }) {
  const isEdit = mode === "edit";
  const [name, setName] = React.useState(item?.name || "");
  const [price, setPrice] = React.useState(item?.price != null ? String(item.price) : "");
  const [stock, setStock] = React.useState(item?.stock != null ? String(item.stock) : "");

  const valid = name.trim() && price !== "" && stock !== "";

  const submit = () => {
    if (!valid) return;
    onSubmit({
      ...(item || {}),
      id: item?.id || ("bb-" + Date.now()),
      name: name.trim(),
      price: parseInt(price, 10) || 0,
      stock: parseInt(stock, 10) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:440, maxWidth:"90vw"}}>
        <div className="modal-head">
          <div>
            <h2 style={{fontSize:16, fontWeight:600, margin:0}}>
              {isEdit ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
            </h2>
            <div style={{fontSize:12, color:"var(--fg-3)", marginTop:2}}>
              {isEdit ? "Perbarui nama, harga, atau stok" : "Tambahkan bahan ke daftar inventory"}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <div className="modal-body" style={{display:"flex", flexDirection:"column", gap:14}}>
          <div className="field">
            <label>Nama</label>
            <input
              type="text"
              className="input"
              placeholder="Mis. Biji Kopi"
              value={name}
              onChange={e=>setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Harga</label>
            <div className="input-prefix">
              <span>Rp</span>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={price}
                onChange={e=>setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Jumlah Stok</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              min="0"
              value={stock}
              onChange={e=>setStock(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Batal</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!valid}
            style={{opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed"}}
          >
            {isEdit ? <><Icon name="check" size={14}/> Simpan</> : <><Icon name="plus" size={14}/> Tambah ke Inventory</>}
          </button>
        </div>
      </div>
    </div>
  );
}

window.MenuMgrScreen = MenuMgrScreen;