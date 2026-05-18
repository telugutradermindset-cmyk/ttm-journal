import { useState, useEffect, useCallback, useMemo } from "react";

// ─── THEME TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg0: "#0a0b0d",
  bg1: "#0f1115",
  bg2: "#14171d",
  bg3: "#1a1e27",
  bg4: "#20263300",
  border: "#ffffff0f",
  borderHi: "#ffffff1a",
  borderGold: "#c9943230",
  gold: "#c99432",
  goldDim: "#c9943280",
  goldBright: "#f0b84a",
  green: "#22c55e",
  greenDim: "#22c55e20",
  red: "#ef4444",
  redDim: "#ef444420",
  blue: "#3b82f6",
  blueDim: "#3b82f620",
  amber: "#f59e0b",
  text: "#e8e4dc",
  textDim: "#9a9489",
  textFaint: "#5a5650",
};

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    background: ${T.bg0};
    color: ${T.text};
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bg1}; }
  ::-webkit-scrollbar-thumb { background: ${T.borderHi}; border-radius: 2px; }

  input, select, textarea {
    background: ${T.bg2};
    border: 1px solid ${T.border};
    color: ${T.text};
    border-radius: 6px;
    padding: 9px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }
  input:focus, select:focus, textarea:focus {
    border-color: ${T.goldDim};
    background: ${T.bg3};
  }
  select option { background: ${T.bg2}; }

  .scan-line {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    pointer-events: none; z-index: 9999;
  }

  .grid-bg {
    background-image:
      linear-gradient(rgba(201,148,50,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,148,50,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes slideIn { from { transform: translateX(-8px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes toastIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .slide-in { animation: slideIn 0.2s ease forwards; }
`;

// ─── UTILITIES ──────────────────────────────────────────────────────────────
const fmt = {
  pnl: (v) => {
    const n = parseFloat(v) || 0;
    return `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(2)}`;
  },
  pct: (v) => `${(parseFloat(v) || 0).toFixed(1)}%`,
  num: (v) => (parseFloat(v) || 0).toFixed(2),
};

const SESSION_MAP = {
  "00:00-08:00": "Asia",
  "08:00-12:00": "London",
  "12:00-17:00": "New York",
  "17:00-24:00": "London/NY Close",
};

function getSession(time) {
  if (!time) return "Unknown";
  const [h] = time.split(":").map(Number);
  if (h < 8) return "Asia";
  if (h < 12) return "London";
  if (h < 17) return "New York";
  return "Late Session";
}

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function apiFetch(path, opts = {}, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Request failed");
  return res.json();
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function GoldDot({ live }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%",
      background: live ? T.green : T.gold,
      display: "inline-block",
      animation: live ? "pulse 1.5s infinite" : "none",
    }} />
  );
}

function Badge({ label, type = "neutral" }) {
  const colors = {
    win: { bg: T.greenDim, color: T.green, border: "#22c55e30" },
    loss: { bg: T.redDim, color: T.red, border: "#ef444430" },
    be: { bg: T.blueDim, color: T.blue, border: "#3b82f630" },
    long: { bg: "#3b82f615", color: "#60a5fa", border: "#3b82f620" },
    short: { bg: "#f59e0b15", color: T.amber, border: "#f59e0b20" },
    neutral: { bg: T.bg3, color: T.textDim, border: T.border },
  };
  const c = colors[type] || colors.neutral;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 4, fontSize: 10, fontWeight: 600, padding: "2px 7px",
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
      textTransform: "uppercase",
    }}>{label}</span>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: T.bg2,
      border: `1px solid ${glow ? T.borderGold : T.border}`,
      borderRadius: 10,
      boxShadow: glow ? `0 0 20px ${T.goldDim}18` : "none",
      ...style,
    }}>{children}</div>
  );
}

function StatCard({ label, value, sub, positive, negative }) {
  const color = positive ? T.green : negative ? T.red : T.gold;
  return (
    <Card style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: 10, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Orbitron',sans-serif", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#1a0a0a" : "#0a1a0f",
          border: `1px solid ${t.type === "error" ? T.red : T.green}40`,
          borderLeft: `3px solid ${t.type === "error" ? T.red : T.green}`,
          color: T.text, padding: "10px 16px", borderRadius: 8, fontSize: 13,
          animation: "toastIn 0.3s ease", minWidth: 260,
          fontFamily: "'JetBrains Mono',monospace",
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", padding: 0 }} glow>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: T.gold, letterSpacing: "0.1em" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </Card>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⬛" },
  { id: "log", label: "Log Trade", icon: "+" },
  { id: "trades", label: "Trade Log", icon: "≡" },
  { id: "analytics", label: "Analytics", icon: "◈" },
  { id: "calendar", label: "Calendar", icon: "◫" },
  { id: "backtest", label: "Backtester", icon: "⟳" },
  { id: "rules", label: "Rules", icon: "⚑" },
  { id: "profile", label: "Profile", icon: "◎" },
];

function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <div style={{
      width: 220, minHeight: "100vh", background: T.bg1,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: T.gold, letterSpacing: "0.2em" }}>TTM</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.textFaint, letterSpacing: "0.3em", marginTop: 3 }}>JOURNAL PRO</div>
      </div>

      {/* Status */}
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GoldDot live />
          <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>LIVE</span>
        </div>
        <div style={{ fontSize: 11, color: T.text, marginTop: 4 }}>{user?.name || "Trader"}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", borderRadius: 7, border: "none",
            background: page === item.id ? `${T.gold}12` : "transparent",
            color: page === item.id ? T.gold : T.textDim,
            cursor: "pointer", textAlign: "left", fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace",
            transition: "all 0.15s",
            borderLeft: page === item.id ? `2px solid ${T.gold}` : "2px solid transparent",
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span style={{ letterSpacing: "0.05em" }}>{item.label.toUpperCase()}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={onLogout} style={{
        margin: "12px", padding: "10px", borderRadius: 7,
        background: T.redDim, border: `1px solid ${T.red}25`,
        color: T.red, cursor: "pointer", fontSize: 11,
        fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.08em",
      }}>LOGOUT</button>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ trades, setPage }) {
  const stats = useMemo(() => {
    if (!trades.length) return { total: 0, pnl: 0, wins: 0, losses: 0, winRate: 0, pf: 0, avgRR: 0, streak: 0 };
    const pnl = trades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
    const wins = trades.filter(t => t.outcome === "win").length;
    const losses = trades.filter(t => t.outcome === "loss").length;
    const winPnl = trades.filter(t => t.outcome === "win").reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
    const lossPnl = Math.abs(trades.filter(t => t.outcome === "loss").reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0));
    const rrs = trades.filter(t => t.rr).map(t => parseFloat(t.rr) || 0);
    const avgRR = rrs.length ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0;

    // streak
    let streak = 0, i = trades.length - 1;
    if (i >= 0) {
      const dir = trades[i].outcome;
      while (i >= 0 && trades[i].outcome === dir) { streak++; i--; }
      if (dir === "loss") streak = -streak;
    }

    return {
      total: trades.length, pnl, wins, losses,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
      pf: lossPnl ? winPnl / lossPnl : wins > 0 ? 999 : 0,
      avgRR, streak,
    };
  }, [trades]);

  // Equity curve last 20
  const recent = trades.slice(-20);
  const equity = [];
  let running = 0;
  recent.forEach(t => { running += parseFloat(t.pnl) || 0; equity.push(running); });

  const recentTrades = [...trades].reverse().slice(0, 8);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: T.gold, fontWeight: 700 }}>COMMAND CENTER</div>
          <div style={{ fontSize: 11, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
          </div>
        </div>
        <button onClick={() => setPage("log")} style={{
          background: T.gold, color: T.bg0, border: "none", borderRadius: 8,
          padding: "10px 20px", fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.1em",
        }}>+ LOG TRADE</button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Total P&L" value={fmt.pnl(stats.pnl)} sub={`${stats.total} trades`} positive={stats.pnl > 0} negative={stats.pnl < 0} />
        <StatCard label="Win Rate" value={fmt.pct(stats.winRate)} sub={`${stats.wins}W / ${stats.losses}L`} positive={stats.winRate > 50} />
        <StatCard label="Profit Factor" value={stats.pf > 99 ? "∞" : fmt.num(stats.pf)} sub="gross profit / loss" positive={stats.pf > 1} negative={stats.pf < 1} />
        <StatCard label="Streak" value={stats.streak === 0 ? "—" : `${Math.abs(stats.streak)} ${stats.streak > 0 ? "W" : "L"}`} positive={stats.streak > 2} negative={stats.streak < -2} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Mini equity curve */}
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 12 }}>EQUITY CURVE (LAST 20)</div>
          <MiniChart data={equity} />
        </Card>

        {/* Recent trades */}
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 12 }}>RECENT TRADES</div>
          {recentTrades.length === 0 ? (
            <div style={{ color: T.textFaint, fontSize: 12, textAlign: "center", padding: "20px 0" }}>No trades yet</div>
          ) : recentTrades.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge label={t.outcome} type={t.outcome} />
                <span style={{ color: T.text, fontFamily: "'JetBrains Mono',monospace" }}>{t.pair}</span>
              </div>
              <span style={{ color: (parseFloat(t.pnl) || 0) >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                {fmt.pnl(t.pnl)}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* Session stats */}
      <SessionWidget trades={trades} />
    </div>
  );
}

function MiniChart({ data }) {
  if (!data.length) return <div style={{ height: 80, color: T.textFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>No data</div>;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const H = 80, W = 260;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  }).join(" ");
  const lastVal = data[data.length - 1];
  const color = lastVal >= 0 ? T.green : T.red;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill={`${color}18`} stroke="none" />
      <line x1="0" y1={H - ((0 - min) / range) * H * 0.85 - H * 0.075} x2={W} y2={H - ((0 - min) / range) * H * 0.85 - H * 0.075} stroke={`${T.textFaint}40`} strokeDasharray="4,4" strokeWidth="0.5" />
    </svg>
  );
}

function SessionWidget({ trades }) {
  const sessions = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const s = getSession(t.time);
      if (!map[s]) map[s] = { wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      if (t.outcome === "win") map[s].wins++;
      map[s].pnl += parseFloat(t.pnl) || 0;
    });
    return map;
  }, [trades]);

  const sessionList = ["Asia", "London", "New York", "Late Session"];
  return (
    <Card style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>SESSION BREAKDOWN</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {sessionList.map(s => {
          const d = sessions[s] || { wins: 0, total: 0, pnl: 0 };
          const wr = d.total ? (d.wins / d.total) * 100 : 0;
          return (
            <div key={s} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, letterSpacing: "0.08em" }}>{s.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: d.pnl >= 0 ? T.green : T.red }}>{fmt.pct(wr)}</div>
              <div style={{ fontSize: 10, color: T.textFaint, marginTop: 3 }}>{d.total} trades</div>
              <div style={{ fontSize: 10, color: d.pnl >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace" }}>{fmt.pnl(d.pnl)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── LOG TRADE ────────────────────────────────────────────────────────────────
const EMPTY_TRADE = {
  date: new Date().toISOString().slice(0, 10),
  time: "",
  pair: "EURUSD",
  direction: "long",
  strategy: "",
  outcome: "win",
  pnl: "",
  rr: "",
  session: "London",
  emotion: "calm",
  rating: 3,
  notes: "",
};

const EMOTIONS = ["calm", "confident", "fearful", "greedy", "fomo", "frustrated", "disciplined"];
const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "GBPJPY", "EURJPY", "NAS100", "US30", "Other"];

function LogTrade({ trades, setTrades, toast, editId, setEditId, setPage }) {
  const existing = editId ? trades.find(t => t.id === editId) : null;
  const [form, setForm] = useState(existing || EMPTY_TRADE);

  useEffect(() => {
    if (existing) setForm(existing);
    else setForm({ ...EMPTY_TRADE, date: new Date().toISOString().slice(0, 10) });
  }, [editId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.pair || !form.pnl) return toast("Fill in pair and P&L", "error");
    const trade = { ...form, id: existing?.id || Date.now().toString(), pnl: parseFloat(form.pnl) };

    if (existing) {
      setTrades(prev => prev.map(t => t.id === trade.id ? trade : t));
      toast("Trade updated");
      setEditId(null);
      setPage("trades");
    } else {
      setTrades(prev => [...prev, trade]);
      toast("Trade logged");
      setForm({ ...EMPTY_TRADE, date: new Date().toISOString().slice(0, 10) });
    }
  };

  const label = (text) => (
    <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", marginBottom: 6 }}>{text}</div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold, marginBottom: 24 }}>
        {existing ? "EDIT TRADE" : "LOG TRADE"}
      </div>

      {existing && (
        <div style={{ background: `${T.amber}15`, border: `1px solid ${T.amber}30`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: T.amber, fontFamily: "'JetBrains Mono',monospace" }}>
          ✎ EDITING: {existing.pair} — {fmt.pnl(existing.pnl)}
        </div>
      )}

      <Card style={{ padding: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            {label("DATE")}
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div>
            {label("TIME")}
            <input type="time" value={form.time} onChange={e => set("time", e.target.value)} />
          </div>
          <div>
            {label("PAIR")}
            <select value={form.pair} onChange={e => set("pair", e.target.value)}>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            {label("DIRECTION")}
            <div style={{ display: "flex", gap: 8 }}>
              {["long", "short"].map(d => (
                <button key={d} onClick={() => set("direction", d)} style={{
                  flex: 1, padding: "9px", borderRadius: 6, border: `1px solid ${form.direction === d ? (d === "long" ? T.green : T.red) : T.border}`,
                  background: form.direction === d ? (d === "long" ? T.greenDim : T.redDim) : T.bg2,
                  color: form.direction === d ? (d === "long" ? T.green : T.red) : T.textDim,
                  cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.08em",
                }}>{d.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div>
            {label("OUTCOME")}
            <div style={{ display: "flex", gap: 8 }}>
              {["win", "loss", "be"].map(o => (
                <button key={o} onClick={() => set("outcome", o)} style={{
                  flex: 1, padding: "9px", borderRadius: 6,
                  border: `1px solid ${form.outcome === o ? (o === "win" ? T.green : o === "loss" ? T.red : T.blue) : T.border}`,
                  background: form.outcome === o ? (o === "win" ? T.greenDim : o === "loss" ? T.redDim : T.blueDim) : T.bg2,
                  color: form.outcome === o ? (o === "win" ? T.green : o === "loss" ? T.red : T.blue) : T.textDim,
                  cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.08em",
                }}>{o.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div>
            {label("STRATEGY")}
            <input type="text" value={form.strategy} onChange={e => set("strategy", e.target.value)} placeholder="e.g. Break & Retest" />
          </div>
          <div>
            {label("P&L ($)")}
            <input type="number" value={form.pnl} onChange={e => set("pnl", e.target.value)} placeholder="e.g. 250 or -120" />
          </div>
          <div>
            {label("R:R")}
            <input type="number" step="0.1" value={form.rr} onChange={e => set("rr", e.target.value)} placeholder="e.g. 2.5" />
          </div>
          <div>
            {label("EMOTION")}
            <select value={form.emotion} onChange={e => set("emotion", e.target.value)}>
              {EMOTIONS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>
          <div>
            {label(`EXECUTION RATING: ${form.rating}/5`)}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => set("rating", n)} style={{
                  width: 36, height: 36, borderRadius: 6,
                  border: `1px solid ${form.rating >= n ? T.gold : T.border}`,
                  background: form.rating >= n ? `${T.gold}20` : T.bg2,
                  color: form.rating >= n ? T.gold : T.textFaint,
                  cursor: "pointer", fontSize: 14,
                }}>★</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {label("NOTES")}
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Trade notes, observations, lessons learned..." />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          <button onClick={handleSubmit} style={{
            flex: 1, padding: "12px", background: T.gold, border: "none", borderRadius: 8,
            color: T.bg0, fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.1em",
          }}>{existing ? "UPDATE TRADE" : "LOG TRADE"}</button>
          {existing && (
            <button onClick={() => { setEditId(null); setPage("trades"); }} style={{
              padding: "12px 24px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8,
              color: T.textDim, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
            }}>CANCEL</button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── TRADE LOG ───────────────────────────────────────────────────────────────
function TradeLog({ trades, setTrades, setEditId, setPage, toast }) {
  const [filter, setFilter] = useState({ pair: "", outcome: "", strategy: "", from: "", to: "" });
  const [sort, setSort] = useState({ key: "date", dir: -1 });

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (filter.pair && t.pair !== filter.pair) return false;
      if (filter.outcome && t.outcome !== filter.outcome) return false;
      if (filter.strategy && !t.strategy?.toLowerCase().includes(filter.strategy.toLowerCase())) return false;
      if (filter.from && t.date < filter.from) return false;
      if (filter.to && t.date > filter.to) return false;
      return true;
    }).sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === "string") return sort.dir * av.localeCompare(bv);
      return sort.dir * ((parseFloat(av) || 0) - (parseFloat(bv) || 0));
    });
  }, [trades, filter, sort]);

  const pairs = [...new Set(trades.map(t => t.pair))];

  const handleDelete = (id) => {
    if (!confirm("Delete this trade?")) return;
    setTrades(prev => prev.filter(t => t.id !== id));
    toast("Trade deleted");
  };

  const handleEdit = (trade) => {
    setEditId(trade.id);
    setPage("log");
  };

  const handleExport = () => {
    const cols = ["date", "time", "pair", "direction", "strategy", "outcome", "pnl", "rr", "emotion", "rating", "notes"];
    const csv = [cols.join(","), ...filtered.map(t => cols.map(c => JSON.stringify(t[c] ?? "")).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `ttm-trades-${Date.now()}.csv`;
    a.click();
    toast("CSV exported");
  };

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }));

  const Th = ({ k, label }) => (
    <th onClick={() => toggleSort(k)} style={{
      padding: "10px 14px", textAlign: "left", fontFamily: "'JetBrains Mono',monospace",
      fontSize: 9, color: sort.key === k ? T.gold : T.textFaint, letterSpacing: "0.12em",
      cursor: "pointer", background: T.bg3, whiteSpace: "nowrap", userSelect: "none",
      borderBottom: `1px solid ${T.border}`,
    }}>{label} {sort.key === k ? (sort.dir === 1 ? "↑" : "↓") : ""}</th>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold }}>TRADE LOG</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExport} style={{
            padding: "8px 16px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 7,
            color: T.textDim, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
          }}>↓ EXPORT CSV</button>
          <button onClick={() => setPage("log")} style={{
            padding: "8px 16px", background: T.gold, border: "none", borderRadius: 7,
            color: T.bg0, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
          }}>+ LOG TRADE</button>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          <select value={filter.pair} onChange={e => setFilter(f => ({ ...f, pair: e.target.value }))}>
            <option value="">All Pairs</option>
            {pairs.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={filter.outcome} onChange={e => setFilter(f => ({ ...f, outcome: e.target.value }))}>
            <option value="">All Outcomes</option>
            <option>win</option><option>loss</option><option>be</option>
          </select>
          <input type="text" placeholder="Strategy…" value={filter.strategy} onChange={e => setFilter(f => ({ ...f, strategy: e.target.value }))} />
          <input type="date" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} />
          <input type="date" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} />
        </div>
      </Card>

      <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>
        {filtered.length} / {trades.length} TRADES
      </div>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th k="date" label="DATE" />
              <Th k="pair" label="PAIR" />
              <Th k="direction" label="DIR" />
              <Th k="outcome" label="OUTCOME" />
              <Th k="pnl" label="P&L" />
              <Th k="rr" label="R:R" />
              <Th k="strategy" label="STRATEGY" />
              <Th k="emotion" label="EMOTION" />
              <Th k="rating" label="RTG" />
              <th style={{ padding: "10px 14px", background: T.bg3, borderBottom: `1px solid ${T.border}`, fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: T.textFaint, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>NO TRADES MATCH FILTERS</td></tr>
            ) : filtered.map((t, i) => {
              const pnl = parseFloat(t.pnl) || 0;
              return (
                <tr key={t.id} style={{ background: i % 2 === 0 ? "transparent" : `${T.bg3}50` }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{t.date}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: T.text, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{t.pair}</td>
                  <td style={{ padding: "10px 14px" }}><Badge label={t.direction} type={t.direction} /></td>
                  <td style={{ padding: "10px 14px" }}><Badge label={t.outcome} type={t.outcome} /></td>
                  <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: pnl >= 0 ? T.green : T.red }}>{fmt.pnl(pnl)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{t.rr || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: T.text }}>{t.strategy || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: T.textDim }}>{t.emotion || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: T.gold }}>{"★".repeat(t.rating || 0)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEdit(t)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 5, padding: "5px 10px", color: T.gold, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>✎</button>
                      <button onClick={() => handleDelete(t.id)} style={{ background: T.redDim, border: `1px solid ${T.red}30`, borderRadius: 5, padding: "5px 10px", color: T.red, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function Analytics({ trades }) {
  const [tab, setTab] = useState("overview");

  const stats = useMemo(() => {
    if (!trades.length) return null;
    const byPair = {}, byStrat = {}, byMonth = {}, byEmotion = {};

    let running = 0;
    const equity = [], dates = [];
    let maxDD = 0, peak = 0;

    [...trades].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      const pnl = parseFloat(t.pnl) || 0;
      running += pnl;
      equity.push(running);
      dates.push(t.date);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;

      const p = t.pair || "Unknown";
      if (!byPair[p]) byPair[p] = { wins: 0, total: 0, pnl: 0 };
      byPair[p].total++;
      if (t.outcome === "win") byPair[p].wins++;
      byPair[p].pnl += pnl;

      const s = t.strategy || "No Strategy";
      if (!byStrat[s]) byStrat[s] = { wins: 0, total: 0, pnl: 0 };
      byStrat[s].total++;
      if (t.outcome === "win") byStrat[s].wins++;
      byStrat[s].pnl += pnl;

      const m = t.date?.slice(0, 7) || "Unknown";
      if (!byMonth[m]) byMonth[m] = 0;
      byMonth[m] += pnl;

      const em = t.emotion || "unknown";
      if (!byEmotion[em]) byEmotion[em] = { wins: 0, total: 0 };
      byEmotion[em].total++;
      if (t.outcome === "win") byEmotion[em].wins++;
    });

    return { byPair, byStrat, byMonth, byEmotion, equity, dates, maxDD };
  }, [trades]);

  const tabs = ["overview", "pairs", "strategy", "emotion"];

  return (
    <div className="fade-in">
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold, marginBottom: 20 }}>ANALYTICS</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", borderRadius: 7, border: `1px solid ${tab === t ? T.gold : T.border}`,
            background: tab === t ? `${T.gold}15` : T.bg2,
            color: tab === t ? T.gold : T.textDim,
            cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.08em",
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {!stats ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>LOG TRADES TO SEE ANALYTICS</div>
        </Card>
      ) : (
        <>
          {tab === "overview" && <AnalyticsOverview stats={stats} trades={trades} />}
          {tab === "pairs" && <AnalyticsPairs data={stats.byPair} />}
          {tab === "strategy" && <AnalyticsStrategy data={stats.byStrat} />}
          {tab === "emotion" && <AnalyticsEmotion data={stats.byEmotion} />}
        </>
      )}
    </div>
  );
}

function AnalyticsOverview({ stats, trades }) {
  const totalPnl = stats.equity[stats.equity.length - 1] || 0;
  const wins = trades.filter(t => t.outcome === "win").length;
  const wr = trades.length ? (wins / trades.length) * 100 : 0;

  // Monthly bars
  const months = Object.entries(stats.byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const maxAbs = Math.max(...months.map(([, v]) => Math.abs(v)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Total P&L" value={fmt.pnl(totalPnl)} positive={totalPnl > 0} negative={totalPnl < 0} />
        <StatCard label="Win Rate" value={fmt.pct(wr)} positive={wr > 50} />
        <StatCard label="Max Drawdown" value={`-$${stats.maxDD.toFixed(0)}`} negative />
      </div>

      {/* Equity Curve */}
      <Card style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>CUMULATIVE P&L CURVE</div>
        <EquityCurve equity={stats.equity} />
      </Card>

      {/* Monthly P&L */}
      <Card style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>MONTHLY P&L</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
          {months.map(([m, v]) => {
            const pct = Math.abs(v) / maxAbs;
            const isPos = v >= 0;
            return (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 9, color: isPos ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace" }}>{isPos ? "+" : ""}{v.toFixed(0)}</div>
                <div style={{ width: "100%", height: pct * 70, background: isPos ? T.green : T.red, borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
                <div style={{ fontSize: 8, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace" }}>{m.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function EquityCurve({ equity }) {
  if (!equity.length) return null;
  const min = Math.min(...equity, 0), max = Math.max(...equity, 0);
  const range = max - min || 1;
  const H = 140, W = 600;
  const pts = equity.map((v, i) => {
    const x = (i / Math.max(equity.length - 1, 1)) * W;
    const y = H - ((v - min) / range) * H * 0.88 - H * 0.06;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const zeroY = H - ((0 - min) / range) * H * 0.88 - H * 0.06;
  const last = equity[equity.length - 1];
  const color = last >= 0 ? T.green : T.red;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke={`${T.textFaint}40`} strokeDasharray="4,4" strokeWidth="0.8" />
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#eqGrad)" stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={equity.length > 1 ? (W).toFixed(0) : 0} cy={pts.split(" ").pop()?.split(",")[1] || H / 2} r="4" fill={color} />
    </svg>
  );
}

function AnalyticsPairs({ data }) {
  const rows = Object.entries(data).sort(([, a], [, b]) => b.pnl - a.pnl);
  const maxPnl = Math.max(...rows.map(([, d]) => Math.abs(d.pnl)), 1);
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>PAIR PERFORMANCE</div>
      {rows.map(([pair, d]) => {
        const wr = (d.wins / d.total) * 100;
        const barW = (Math.abs(d.pnl) / maxPnl) * 60;
        return (
          <div key={pair} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 70, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.text, fontWeight: 600 }}>{pair}</div>
            <div style={{ width: 50, fontSize: 10, color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{d.total}T</div>
            <div style={{ width: 55, fontSize: 10, color: wr > 50 ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace" }}>{wr.toFixed(0)}%WR</div>
            <div style={{ flex: 1, height: 6, background: T.bg3, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${barW}%`, background: d.pnl >= 0 ? T.green : T.red, borderRadius: 3 }} />
            </div>
            <div style={{ width: 80, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: d.pnl >= 0 ? T.green : T.red }}>{fmt.pnl(d.pnl)}</div>
          </div>
        );
      })}
    </Card>
  );
}

function AnalyticsStrategy({ data }) {
  const rows = Object.entries(data).sort(([, a], [, b]) => b.pnl - a.pnl);
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>STRATEGY PERFORMANCE</div>
      {rows.map(([strat, d]) => {
        const wr = (d.wins / d.total) * 100;
        return (
          <div key={strat} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ flex: 1, fontSize: 12, color: T.text }}>{strat}</div>
            <div style={{ width: 40, fontSize: 10, color: T.textDim, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>{d.total}T</div>
            <div style={{ width: 55, fontSize: 10, color: wr > 50 ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }}>{wr.toFixed(0)}%WR</div>
            <div style={{ width: 80, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: d.pnl >= 0 ? T.green : T.red }}>{fmt.pnl(d.pnl)}</div>
          </div>
        );
      })}
    </Card>
  );
}

function AnalyticsEmotion({ data }) {
  const rows = Object.entries(data).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total));
  const emotionColors = { calm: T.blue, confident: T.green, fearful: T.red, greedy: T.amber, fomo: "#f97316", frustrated: "#ec4899", disciplined: T.gold };
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>EMOTION PERFORMANCE</div>
      <div style={{ fontSize: 10, color: T.textDim, marginBottom: 12, fontStyle: "italic" }}>Win rate by emotional state during trade</div>
      {rows.map(([emotion, d]) => {
        const wr = (d.wins / d.total) * 100;
        const c = emotionColors[emotion] || T.textDim;
        return (
          <div key={emotion} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: c, fontFamily: "'JetBrains Mono',monospace", textTransform: "capitalize", fontWeight: 600 }}>{emotion}</span>
              <span style={{ fontSize: 11, color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{wr.toFixed(0)}% WR ({d.total} trades)</span>
            </div>
            <div style={{ height: 6, background: T.bg3, borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${wr}%`, background: c, borderRadius: 3, opacity: 0.7 }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ─── CALENDAR HEATMAP ────────────────────────────────────────────────────────
function CalendarHeatmap({ trades }) {
  const today = new Date();
  const year = today.getFullYear();

  const dailyPnl = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.date) return;
      map[t.date] = (map[t.date] || 0) + (parseFloat(t.pnl) || 0);
    });
    return map;
  }, [trades]);

  const maxAbs = Math.max(...Object.values(dailyPnl).map(Math.abs), 1);

  // Build weeks for current year
  const startOfYear = new Date(year, 0, 1);
  const dayOfWeek = startOfYear.getDay();
  const weeks = [];
  let week = Array(dayOfWeek).fill(null);

  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    week.push({ date: iso, pnl: dailyPnl[iso] });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

  function cellColor(v) {
    if (v === undefined || v === null) return T.bg3;
    if (v === 0) return T.bg3;
    const intensity = Math.min(Math.abs(v) / maxAbs, 1);
    if (v > 0) return `rgba(34,197,94,${0.15 + intensity * 0.75})`;
    return `rgba(239,68,68,${0.15 + intensity * 0.75})`;
  }

  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="fade-in">
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold, marginBottom: 20 }}>TRADING CALENDAR</div>
      <Card style={{ padding: "20px 24px" }} glow>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 16 }}>
          {year} DAILY P&L HEATMAP
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 2, minWidth: 720 }}>
            {/* Day labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
              <div style={{ height: 14 }} />
              {DAYS.map((d, i) => (
                <div key={i} style={{ height: 12, width: 12, fontSize: 8, color: T.textFaint, display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono',monospace" }}>{d}</div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Month label */}
                <div style={{ height: 14, fontSize: 8, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
                  {wi === 0 || (week[1] && week[1]?.date?.slice(8) === "01") ? MONTHS[parseInt((week.find(x => x)?.date || "").slice(5, 7)) - 1] || "" : ""}
                </div>
                {week.map((day, di) => (
                  <div key={di}
                    onMouseEnter={e => day && setTooltip({ date: day.date, pnl: day.pnl, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: 12, height: 12, borderRadius: 2,
                      background: day ? cellColor(day.pnl) : "transparent",
                      border: day ? `1px solid ${T.border}` : "none",
                      cursor: day?.pnl !== undefined ? "pointer" : "default",
                    }} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
          <span style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace" }}>LESS</span>
          {[0.15, 0.35, 0.55, 0.75, 0.95].map(o => (
            <div key={o} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(34,197,94,${o})` }} />
          ))}
          <span style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace" }}>MORE (PROFIT)</span>
          <span style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", marginLeft: 12 }}>LOSS</span>
          {[0.15, 0.35, 0.55, 0.75, 0.95].map(o => (
            <div key={o} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(239,68,68,${o})` }} />
          ))}
        </div>
      </Card>

      {/* Daily breakdown */}
      <Card style={{ padding: "18px 20px", marginTop: 16 }}>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>BEST / WORST DAYS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["Best", "Worst"].map(label => {
            const entries = Object.entries(dailyPnl);
            if (!entries.length) return <div key={label} style={{ color: T.textFaint, fontSize: 11 }}>No data</div>;
            const sorted = entries.sort(([, a], [, b]) => label === "Best" ? b - a : a - b);
            const top5 = sorted.slice(0, 5);
            return (
              <div key={label}>
                <div style={{ fontSize: 11, color: label === "Best" ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10, fontWeight: 600 }}>
                  {label.toUpperCase()} DAYS
                </div>
                {top5.map(([date, pnl]) => (
                  <div key={date} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                    <span style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{date}</span>
                    <span style={{ color: pnl >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{fmt.pnl(pnl)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── BACKTESTER ───────────────────────────────────────────────────────────────
function Backtester({ trades }) {
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))];
  const [params, setParams] = useState({ strategy: "", trades: 100, winRate: 55, avgWin: 100, avgLoss: 60, simulations: 200 });
  const [results, setResults] = useState(null);

  const setP = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const runBacktest = useCallback(() => {
    let wr = parseFloat(params.winRate) / 100;
    let avgWin = parseFloat(params.avgWin);
    let avgLoss = parseFloat(params.avgLoss);
    const n = parseInt(params.trades);
    const sims = parseInt(params.simulations);

    // Use real data if strategy selected
    if (params.strategy) {
      const sTrades = trades.filter(t => t.strategy === params.strategy);
      if (sTrades.length >= 5) {
        const wins = sTrades.filter(t => t.outcome === "win");
        const losses = sTrades.filter(t => t.outcome === "loss");
        wr = wins.length / sTrades.length;
        avgWin = wins.length ? wins.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0) / wins.length : avgWin;
        avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0) / losses.length) : avgLoss;
      }
    }

    const paths = [];
    for (let s = 0; s < sims; s++) {
      let equity = 0;
      const path = [0];
      for (let i = 0; i < n; i++) {
        equity += Math.random() < wr ? avgWin : -avgLoss;
        path.push(equity);
      }
      paths.push(path);
    }

    const finals = paths.map(p => p[p.length - 1]).sort((a, b) => a - b);
    const profitable = finals.filter(v => v > 0).length;
    const p10 = paths[Math.floor(sims * 0.1)];
    const p50 = paths[Math.floor(sims * 0.5)];
    const p90 = paths[Math.floor(sims * 0.9)];

    const expectancy = wr * avgWin - (1 - wr) * avgLoss;

    setResults({
      paths: [p10, p50, p90],
      profitable: (profitable / sims) * 100,
      expectancy,
      median: finals[Math.floor(sims * 0.5)],
      p10: finals[Math.floor(sims * 0.1)],
      p90: finals[Math.floor(sims * 0.9)],
      wr, avgWin, avgLoss, n,
    });
  }, [params, trades]);

  return (
    <div className="fade-in">
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold, marginBottom: 20 }}>MONTE CARLO BACKTESTER</div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
        {/* Controls */}
        <Card style={{ padding: "20px" }}>
          <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 16 }}>PARAMETERS</div>

          {[
            { label: "STRATEGY (AUTO-FILLS FROM TRADES)", key: "strategy", type: "select", opts: ["", ...strategies] },
            { label: "SIMULATED TRADES", key: "trades", type: "number", min: 10, max: 1000 },
            { label: "WIN RATE %", key: "winRate", type: "number", min: 1, max: 99 },
            { label: "AVG WIN ($)", key: "avgWin", type: "number", min: 1 },
            { label: "AVG LOSS ($)", key: "avgLoss", type: "number", min: 1 },
            { label: "SIMULATIONS", key: "simulations", type: "number", min: 50, max: 1000 },
          ].map(({ label, key, type, opts, min, max }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", marginBottom: 5 }}>{label}</div>
              {type === "select" ? (
                <select value={params[key]} onChange={e => setP(key, e.target.value)}>
                  {opts.map(o => <option key={o} value={o}>{o || "Manual Input"}</option>)}
                </select>
              ) : (
                <input type="number" min={min} max={max} value={params[key]} onChange={e => setP(key, e.target.value)} />
              )}
            </div>
          ))}

          <button onClick={runBacktest} style={{
            width: "100%", padding: "12px", background: T.gold, border: "none", borderRadius: 8,
            color: T.bg0, fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.1em", marginTop: 8,
          }}>⟳ RUN SIMULATION</button>
        </Card>

        {/* Results */}
        <div>
          {!results ? (
            <Card style={{ padding: 40, textAlign: "center" }}>
              <div style={{ color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>RUN A SIMULATION TO SEE RESULTS</div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <StatCard label="Profitable Sims" value={`${results.profitable.toFixed(0)}%`} positive={results.profitable > 60} negative={results.profitable < 40} />
                <StatCard label="Expectancy/Trade" value={fmt.pnl(results.expectancy)} positive={results.expectancy > 0} negative={results.expectancy < 0} />
                <StatCard label="Median Outcome" value={fmt.pnl(results.median)} positive={results.median > 0} negative={results.median < 0} />
                <StatCard label="Pessimistic (10%)" value={fmt.pnl(results.p10)} negative={results.p10 < 0} />
              </div>

              {results.expectancy < 0 && (
                <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "12px 16px", fontSize: 12, color: T.red, fontFamily: "'JetBrains Mono',monospace" }}>
                  ⚠ NEGATIVE EDGE: With these parameters, the strategy loses money long-term. Improve win rate or R:R ratio.
                </div>
              )}

              <Card style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 14 }}>EQUITY PATHS — 10th / 50th / 90th PERCENTILE</div>
                <MonteCarloChart paths={results.paths} />
                <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                  {[["#ef4444", "Pessimistic (10th%)"], [T.gold, "Median (50th%)"], [T.green, "Optimistic (90th%)"]].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.textDim }}>
                      <div style={{ width: 20, height: 2, background: c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MonteCarloChart({ paths }) {
  const H = 200, W = 600;
  const allVals = paths.flat();
  const min = Math.min(...allVals), max = Math.max(...allVals);
  const range = max - min || 1;
  const n = paths[0]?.length || 1;

  const toPath = (path, color, width = 1.5) => {
    const pts = path.map((v, i) => {
      const x = (i / (n - 1)) * W;
      const y = H - ((v - min) / range) * H * 0.85 - H * 0.075;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return <polyline key={color} points={pts} fill="none" stroke={color} strokeWidth={width} opacity={0.9} />;
  };

  const zeroY = H - ((0 - min) / range) * H * 0.85 - H * 0.075;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke={`${T.textFaint}40`} strokeDasharray="4,4" strokeWidth="0.8" />
      {toPath(paths[0], "#ef4444", 1.5)}
      {toPath(paths[2], T.green, 1.5)}
      {toPath(paths[1], T.gold, 2)}
    </svg>
  );
}

// ─── TRADING RULES ───────────────────────────────────────────────────────────
const DEFAULT_RULES = [
  "Only trade during London and New York sessions",
  "Maximum 3 trades per day",
  "Never risk more than 1% per trade",
  "Only take A+ setups — wait for confluence",
  "Stop trading after 2 consecutive losses",
  "Journal every trade with notes",
];

function TradingRules({ toast }) {
  const [rules, setRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ttm_rules") || "null") || DEFAULT_RULES; }
    catch { return DEFAULT_RULES; }
  });
  const [newRule, setNewRule] = useState("");
  const [editing, setEditing] = useState(null);

  const save = (updated) => {
    setRules(updated);
    localStorage.setItem("ttm_rules", JSON.stringify(updated));
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    save([...rules, newRule.trim()]);
    setNewRule("");
    toast("Rule added");
  };

  const deleteRule = (i) => save(rules.filter((_, idx) => idx !== i));
  const updateRule = (i, v) => { const r = [...rules]; r[i] = v; save(r); setEditing(null); };

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold, marginBottom: 20 }}>TRADING RULES</div>

      <Card style={{ padding: "20px 24px" }} glow>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 20 }}>
          YOUR PLAYBOOK — {rules.length} RULES
        </div>

        {rules.map((rule, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${T.gold}20`, border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.gold, fontFamily: "'Orbitron',monospace", flexShrink: 0 }}>{i + 1}</div>

            {editing === i ? (
              <input
                autoFocus
                defaultValue={rule}
                onBlur={e => updateRule(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") updateRule(i, e.target.value); if (e.key === "Escape") setEditing(null); }}
                style={{ flex: 1 }}
              />
            ) : (
              <span style={{ flex: 1, fontSize: 13, color: T.text }}>{rule}</span>
            )}

            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setEditing(editing === i ? null : i)} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 5, padding: "5px 9px", color: T.gold, cursor: "pointer", fontSize: 11 }}>✎</button>
              <button onClick={() => deleteRule(i)} style={{ background: T.redDim, border: `1px solid ${T.red}30`, borderRadius: 5, padding: "5px 9px", color: T.red, cursor: "pointer", fontSize: 11 }}>✕</button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <input
            type="text"
            placeholder="Add a new rule..."
            value={newRule}
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRule()}
          />
          <button onClick={addRule} style={{
            padding: "9px 20px", background: T.gold, border: "none", borderRadius: 6,
            color: T.bg0, fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.08em", whiteSpace: "nowrap",
          }}>+ ADD</button>
        </div>
      </Card>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function Profile({ user, setUser, token, toast }) {
  const [name, setName] = useState(user?.name || "");
  const [pw, setPw] = useState({ current: "", newp: "", confirm: "" });

  const saveProfile = async () => {
    try {
      const updated = await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ name }) }, token);
      setUser(updated);
      toast("Profile updated");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const savePassword = async () => {
    if (pw.newp !== pw.confirm) return toast("Passwords don't match", "error");
    if (pw.newp.length < 6) return toast("Password must be 6+ characters", "error");
    try {
      await apiFetch("/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.newp }) }, token);
      setPw({ current: "", newp: "", confirm: "" });
      toast("Password changed");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const label = (t) => <div style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", marginBottom: 6 }}>{t}</div>;

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: T.gold, marginBottom: 24 }}>PROFILE</div>

      <Card style={{ padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 18 }}>ACCOUNT DETAILS</div>
        <div style={{ marginBottom: 14 }}>{label("DISPLAY NAME")}<input value={name} onChange={e => setName(e.target.value)} /></div>
        <div style={{ marginBottom: 18 }}>{label("EMAIL")}<input value={user?.email || ""} disabled style={{ opacity: 0.5 }} /></div>
        <button onClick={saveProfile} style={{ padding: "10px 24px", background: T.gold, border: "none", borderRadius: 7, color: T.bg0, fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>SAVE PROFILE</button>
      </Card>

      <Card style={{ padding: "20px 24px" }}>
        <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.12em", marginBottom: 18 }}>CHANGE PASSWORD</div>
        <div style={{ marginBottom: 14 }}>{label("CURRENT PASSWORD")}<input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} /></div>
        <div style={{ marginBottom: 14 }}>{label("NEW PASSWORD")}<input type="password" value={pw.newp} onChange={e => setPw(p => ({ ...p, newp: e.target.value }))} /></div>
        <div style={{ marginBottom: 18 }}>{label("CONFIRM NEW PASSWORD")}<input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} /></div>
        <button onClick={savePassword} style={{ padding: "10px 24px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>CHANGE PASSWORD</button>
      </Card>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const data = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      onLogin(data.user, data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const label = (t) => <div style={{ fontSize: 9, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", marginBottom: 6 }}>{t}</div>;

  return (
    <div className="grid-bg" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: T.bg0,
    }}>
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 32, fontWeight: 900, color: T.gold, letterSpacing: "0.3em" }}>TTM</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.textFaint, letterSpacing: "0.4em", marginTop: 6 }}>TRADING JOURNAL PRO</div>
          <div style={{ width: 60, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, margin: "16px auto 0" }} />
        </div>

        <Card style={{ padding: "28px 32px" }} glow>
          <div style={{ fontSize: 10, color: T.textFaint, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.15em", marginBottom: 24, textAlign: "center" }}>
            {mode === "login" ? "AUTHENTICATE" : "CREATE ACCOUNT"}
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 16 }}>{label("CALL SIGN")}<input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" /></div>
          )}
          <div style={{ marginBottom: 16 }}>{label("EMAIL")}<input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" /></div>
          <div style={{ marginBottom: 20 }}>{label("PASSWORD")}<input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></div>

          {error && <div style={{ background: T.redDim, border: `1px solid ${T.red}30`, borderRadius: 7, padding: "10px 14px", fontSize: 12, color: T.red, fontFamily: "'JetBrains Mono',monospace", marginBottom: 16 }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "13px", background: T.gold, border: "none", borderRadius: 8,
            color: T.bg0, fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.12em",
            opacity: loading ? 0.7 : 1,
          }}>{loading ? "CONNECTING…" : mode === "login" ? "ENTER WAR ROOM" : "CREATE ACCOUNT"}</button>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={() => setMode(m => m === "login" ? "register" : "login")} style={{
              background: "none", border: "none", color: T.goldDim, cursor: "pointer",
              fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em",
            }}>{mode === "login" ? "NO ACCOUNT? REGISTER →" : "← BACK TO LOGIN"}</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("ttm_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("ttm_token") || "");
  const [trades, setTrades] = useState(() => { try { return JSON.parse(localStorage.getItem("ttm_trades") || "[]"); } catch { return []; } });
  const [page, setPage] = useState("dashboard");
  const [editId, setEditId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Persist trades
  useEffect(() => { localStorage.setItem("ttm_trades", JSON.stringify(trades)); }, [trades]);

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const handleLogin = (u, t) => {
    setUser(u); setToken(t);
    localStorage.setItem("ttm_user", JSON.stringify(u));
    localStorage.setItem("ttm_token", t);
  };

  const handleLogout = () => {
    setUser(null); setToken("");
    localStorage.removeItem("ttm_user");
    localStorage.removeItem("ttm_token");
    setPage("dashboard");
  };

  // Inject global styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!user) return <Auth onLogin={handleLogin} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard trades={trades} setPage={setPage} />;
      case "log": return <LogTrade trades={trades} setTrades={setTrades} toast={toast} editId={editId} setEditId={setEditId} setPage={setPage} />;
      case "trades": return <TradeLog trades={trades} setTrades={setTrades} setEditId={setEditId} setPage={setPage} toast={toast} />;
      case "analytics": return <Analytics trades={trades} />;
      case "calendar": return <CalendarHeatmap trades={trades} />;
      case "backtest": return <Backtester trades={trades} />;
      case "rules": return <TradingRules toast={toast} />;
      case "profile": return <Profile user={user} setUser={setUser} token={token} toast={toast} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg0 }}>
      <div className="scan-line" />
      <Sidebar page={page} setPage={(p) => { setPage(p); if (p !== "log") setEditId(null); }} user={user} onLogout={handleLogout} />

      <main className="grid-bg" style={{ marginLeft: 220, flex: 1, padding: "32px 36px", minHeight: "100vh" }}>
        {renderPage()}
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}
