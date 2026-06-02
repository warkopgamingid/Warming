// Main app — sidebar + screens + tweaks
const { useState, useEffect } = React;

const NAV = [
  { id: "dashboard", label: "Dashboard",         mobileLabel: "Beranda",   icon: "grid" },
  { id: "history",   label: "Riwayat Transaksi", mobileLabel: "Riwayat",   icon: "history" },
  { id: "report",    label: "Laporan",            mobileLabel: "Laporan",   icon: "chart" },
  { id: "menu-mgr",  label: "Inventory",          mobileLabel: "Inventori", icon: "menu-mgr" },
];

const VALID_USERS = [
  { username: "Admin", password: "1234", role: "Administrator" },
];

function LoginScreen({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!u.trim() || !p) {
      setErr("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const match = VALID_USERS.find(x => x.username === u.trim() && x.password === p);
      if (match) {
        onLogin({ username: match.username, role: match.role });
      } else {
        setErr("Username atau password salah");
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="login-shell">
      <div className="login-bg-orb login-bg-orb-1"/>
      <div className="login-bg-orb login-bg-orb-2"/>

      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="login-brand-mark">W</div>
          <div>
            <div className="login-brand-text">Warming POS</div>
            <div className="login-brand-sub">Rental PlayStation + F&B</div>
          </div>
        </div>

        <div className="login-title">Masuk ke akun Anda</div>
        <div className="login-sub">Silakan masukkan kredensial Anda untuk melanjutkan.</div>

        <div className="login-field">
          <label>Username</label>
          <input
            type="text"
            value={u}
            onChange={e => setU(e.target.value)}
            placeholder="Masukkan username"
            autoFocus
            autoComplete="username"
          />
        </div>

        <div className="login-field">
          <label>Password</label>
          <div className="login-pwd">
            <input
              type={show ? "text" : "password"}
              value={p}
              onChange={e => setP(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-pwd-toggle"
              onClick={() => setShow(s => !s)}
              tabIndex={-1}
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            >
              <Icon name={show ? "eye-off" : "eye"} size={16}/>
            </button>
          </div>
        </div>

        {err && (
          <div className="login-error">
            <Icon name="alert" size={14}/>
            <span>{err}</span>
          </div>
        )}

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? "Memverifikasi…" : "Masuk"}
        </button>

        <div className="login-hint">
          <span style={{color:"var(--fg-3)"}}>Demo:</span> Admin / 1234
        </div>
      </form>

      <div className="login-footer">© Warming POS · v1.0</div>
    </div>
  );
}

// Single source of truth for current shift, derived from device clock.
// 10:00–16:59 → Shift Pagi · Sandi
// 17:00–21:59 → Shift Sore · Aep
// Outside operating hours → Di Luar Jam Operasional
function getCurrentShift(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins >= 10 * 60 && mins <= 16 * 60 + 59) {
    return { label: "Shift Pagi", time: "10:00", staff: "Sandi", active: true };
  }
  if (mins >= 17 * 60 && mins <= 21 * 60 + 59) {
    return { label: "Shift Sore", time: "17:00", staff: "Aep", active: true };
  }
  return { label: "Di Luar Jam Operasional", time: "—", staff: "Tutup", active: false };
}

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "light",
    "accent": "blue",
    "density": "default",
    "showShiftPill": true
  }/*EDITMODE-END*/);

  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem("warming-pos-user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  useEffect(() => {
  async function loadProducts() {
    const data = await window.getProducts();
    console.log("PRODUCTS:", data);
  }

  loadProducts();
}, []);
  const [route, setRoute] = useState("dashboard");
  const [units, setUnits] = useState(INITIAL_UNITS);
  const [filter, setFilter] = useState("all");
  const [openUnitId, setOpenUnitId] = useState(null);
  const [tickMin, setTickMin] = useState(0);
  const [shiftTick, setShiftTick] = useState(0);
  const [toast, setToast] = useState(null);

  const handleLogin = (u) => {
    sessionStorage.setItem("warming-pos-user", JSON.stringify(u));
    setUser(u);
  };
  const handleLogout = () => {
    sessionStorage.removeItem("warming-pos-user");
    setUser(null);
    setRoute("dashboard");
    setOpenUnitId(null);
  };

  // 1 sec real = 1 min POS time, so timers update visibly
  useEffect(() => {
    const t = setInterval(() => setTickMin(m => m + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Re-check current shift every minute so the shift pill auto-updates
  // without page refresh as the device clock crosses shift boundaries.
  useEffect(() => {
    const t = setInterval(() => setShiftTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // Apply theme + accent + density to body
  useEffect(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.density = tweaks.density;
    const accentMap = {
      blue:    "oklch(0.62 0.18 250)",
      purple:  "oklch(0.6 0.22 305)",
      green:   "oklch(0.62 0.16 155)",
      orange:  "oklch(0.7 0.17 55)",
      slate:   "oklch(0.45 0.04 250)",
    };
    document.documentElement.style.setProperty("--accent", accentMap[tweaks.accent] || accentMap.blue);
  }, [tweaks.theme, tweaks.accent, tweaks.density]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const updateUnit = (u) => {
    setUnits(units.map(x => x.id === u.id ? u : x));
  };

  const checkout = (unit, total, payMethod) => {
    setUnits(units.map(x => x.id === unit.id
      ? { ...x, status: "idle", customer: null, tab: [], pkg: null, startedAtMinAgo: 0 }
      : x));
    setOpenUnitId(null);
    showToast(`✓ ${unit.id} selesai · ${RP(total)} via ${payMethod}`);
  };

  const openUnit = units.find(u => u.id === openUnitId);

  // Gate the entire app behind login
  if (!user) {
    return <LoginScreen onLogin={handleLogin}/>;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <div className="nav-brand-text">Warming POS</div>
            <div className="nav-brand-sub">POS · Rental + F&B</div>
          </div>
        </div>
        {NAV.map(n => (
          <button key={n.id} className={`nav-item ${route===n.id ? "active" : ""}`} onClick={() => setRoute(n.id)}>
            <Icon name={n.icon} size={16} className="icon"/>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
        <div className="sidebar-footer">
          {tweaks.showShiftPill && (() => {
            // shiftTick triggers a re-render every minute; getCurrentShift is the single source of truth.
            void shiftTick;
            const shift = getCurrentShift();
            return (
              <div className="shift-pill">
                <div className="shift-dot"/>
                <div style={{flex:1}} className="nav-label">
                  <div style={{fontSize:11, fontWeight:600, color:"var(--fg)"}}>{shift.label}</div>
                  <div style={{fontSize:10, color:"var(--fg-3)"}}>{shift.time} · {shift.staff}</div>
                </div>
              </div>
            );
          })()}
          <div className="user-pill">
            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div style={{flex:1, minWidth:0}} className="nav-label">
              <div className="user-name">{user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Keluar" aria-label="Keluar">
              <Icon name="logout" size={14}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {route === "dashboard" && (
          <Dashboard
            units={units}
            tickMin={tickMin}
            onOpenUnit={(u) => setOpenUnitId(u.id)}
            filter={filter}
            setFilter={setFilter}
          />
        )}
        {route === "history"  && <HistoryScreen/>}
        {route === "report"   && <ReportScreen/>}
        {route === "menu-mgr" && <MenuMgrScreen/>}
      </main>

      <nav className="bottom-nav" aria-label="Navigasi">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`bottom-nav-btn ${route === n.id ? "active" : ""}`}
            onClick={() => setRoute(n.id)}
            aria-label={n.label}
          >
            <Icon name={n.icon} size={20} className="icon"/>
            <span>{n.mobileLabel}</span>
          </button>
        ))}
      </nav>

      {openUnit && (
        <UnitDrawer
          unit={openUnit}
          tickMin={tickMin}
          onClose={() => setOpenUnitId(null)}
          onUpdateUnit={updateUnit}
          onCheckout={checkout}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tampilan"/>
        <TweakRadio
          label="Theme"
          value={tweaks.theme}
          onChange={v => setTweak("theme", v)}
          options={[{value:"light",label:"Light"},{value:"dark",label:"Dark"}]}
        />
        <TweakRadio
          label="Accent"
          value={tweaks.accent}
          onChange={v => setTweak("accent", v)}
          options={[{value:"blue",label:"Blue"},{value:"purple",label:"Purple"},{value:"green",label:"Green"},{value:"orange",label:"Orange"},{value:"slate",label:"Slate"}]}
        />
        <TweakRadio
          label="Density"
          value={tweaks.density}
          onChange={v => setTweak("density", v)}
          options={[{value:"compact",label:"Padat"},{value:"default",label:"Default"},{value:"cozy",label:"Lega"}]}
        />
        <TweakSection label="Sidebar"/>
        <TweakToggle label="Info shift" value={tweaks.showShiftPill} onChange={v => setTweak("showShiftPill", v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
