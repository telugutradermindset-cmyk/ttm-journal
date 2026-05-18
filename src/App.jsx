import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, ComposedChart
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-2c4af.up.railway.app';

// ------------------------- Helper Functions -------------------------
const getAuthToken = () => localStorage.getItem('token');

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Session detection based on UTC hour
const getSession = (dateStr) => {
  const d = new Date(dateStr);
  const hour = d.getUTCHours();
  if (hour >= 8 && hour < 17) return 'London';      // 8 AM - 5 PM UTC
  if (hour >= 13 && hour < 22) return 'New York';   // 1 PM - 10 PM UTC
  return 'Asia';                                     // rest (including Sydney/Tokyo)
};

// Calculate drawdown series from trades sorted by date
const computeDrawdown = (trades) => {
  if (!trades.length) return [];
  const sorted = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
  let peak = 0;
  let running = 0;
  return sorted.map(trade => {
    const pnl = (trade.exitPrice - trade.entryPrice) * (trade.direction === 'long' ? 1 : -1) * trade.quantity;
    running += pnl;
    if (running > peak) peak = running;
    const drawdown = peak > 0 ? ((peak - running) / peak) * 100 : 0;
    return { date: trade.date, drawdown: drawdown.toFixed(2), equity: running };
  });
};

// Calendar heatmap data: days of current month with P&L
const getCalendarData = (trades, year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const weeks = [];
  let day = 1;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDay) week.push(null);
      else if (day > daysInMonth) week.push(null);
      else {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayTrades = trades.filter(t => t.date.startsWith(dateStr));
        const pnl = dayTrades.reduce((sum, t) => {
          const p = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
          return sum + p;
        }, 0);
        week.push({ day, pnl, date: dateStr });
        day++;
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }
  return weeks;
};

// ------------------------- Components -------------------------
const NavSidebar = () => (
  <div className="sidebar">
    <div className="logo">TTM<span>WAR ROOM</span></div>
    <nav>
      <NavItem to="/" icon="📊">Dashboard</NavItem>
      <NavItem to="/trades" icon="📝">Trade Log</NavItem>
      <NavItem to="/analytics" icon="📈">Analytics</NavItem>
      <NavItem to="/backtest" icon="🧪">Backtesting</NavItem>
      <NavItem to="/rules" icon="📋">Trading Rules</NavItem>
      <NavItem to="/profile" icon="⚙️">Profile</NavItem>
    </nav>
    <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>🚪 Logout</button>
  </div>
);

const NavItem = ({ to, icon, children }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span>{children}</span>
    </Link>
  );
};

// ------------------------- Main App -------------------------
const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return navigate('/login');
    fetchWithAuth('/api/auth/me')
      .then(data => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); })
      .finally(() => setLoading(false));
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const data = await fetchWithAuth('/api/trades');
      setTrades(data);
    } catch (err) { showToast('Error loading trades', 'error'); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="loading">Loading War Room...</div>;
  if (!user) return null;

  return (
    <div className="war-room">
      <NavSidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard trades={trades} user={user} />} />
          <Route path="/trades" element={<TradeLog trades={trades} loadTrades={loadTrades} showToast={showToast} />} />
          <Route path="/analytics" element={<Analytics trades={trades} />} />
          <Route path="/backtest" element={<Backtest trades={trades} />} />
          <Route path="/rules" element={<Rules user={user} showToast={showToast} />} />
          <Route path="/profile" element={<Profile user={user} showToast={showToast} />} />
        </Routes>
      </div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

// ------------------------- Dashboard -------------------------
const Dashboard = ({ trades, user }) => {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(1) : 0;
  const totalPnl = trades.reduce((sum, t) => {
    return sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
  }, 0);
  const profitFactor = (() => {
    const grossProfit = trades.filter(t => t.outcome === 'win').reduce(s => s + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
    const grossLoss = Math.abs(trades.filter(t => t.outcome === 'loss').reduce(s => s + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0));
    return grossLoss ? (grossProfit / grossLoss).toFixed(2) : '∞';
  })();

  return (
    <div className="page">
      <h1>Welcome back, {user.name}</h1>
      <div className="stat-grid">
        <StatCard title="Total Trades" value={totalTrades} />
        <StatCard title="Win Rate" value={`${winRate}%`} />
        <StatCard title="Total P&L" value={`$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? '#4ade80' : '#f87171'} />
        <StatCard title="Profit Factor" value={profitFactor} />
      </div>
      <div className="recent-trades">
        <h3>Recent Trades</h3>
        <table className="trade-table">
          <thead><tr><th>Date</th><th>Pair</th><th>Direction</th><th>Outcome</th><th>P&L</th></tr></thead>
          <tbody>
            {trades.slice(0,5).map(t => (
              <tr key={t._id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.pair}</td>
                <td><span className={`badge ${t.direction}`}>{t.direction}</span></td>
                <td><span className={`badge ${t.outcome}`}>{t.outcome}</span></td>
                <td style={{color: (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) >=0 ? '#4ade80' : '#f87171'}}>
                  ${((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="stat-card"><h3>{title}</h3><div className="value" style={{color}}>{value}</div></div>
);

// ------------------------- Trade Log (with Emotion + Rating) -------------------------
const TradeLog = ({ trades, loadTrades, showToast }) => {
  const [editingTrade, setEditingTrade] = useState(null);
  const [form, setForm] = useState({ pair:'EURUSD', entryPrice:'', exitPrice:'', quantity:'1', direction:'long', outcome:'win', strategy:'', date:new Date().toISOString().slice(0,16), emotion:'calm', rating:3 });
  const [filters, setFilters] = useState({ pair:'', outcome:'', strategy:'' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, entryPrice: parseFloat(form.entryPrice), exitPrice: parseFloat(form.exitPrice), quantity: parseFloat(form.quantity) };
    try {
      if (editingTrade) {
        await fetchWithAuth(`/api/trades/${editingTrade._id}`, { method:'PUT', body: JSON.stringify(payload) });
        showToast('Trade updated');
      } else {
        await fetchWithAuth('/api/trades', { method:'POST', body: JSON.stringify(payload) });
        showToast('Trade added');
      }
      loadTrades();
      setEditingTrade(null);
      setForm({ pair:'EURUSD', entryPrice:'', exitPrice:'', quantity:'1', direction:'long', outcome:'win', strategy:'', date:new Date().toISOString().slice(0,16), emotion:'calm', rating:3 });
    } catch (err) { showToast('Error saving trade', 'error'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete trade?')) {
      await fetchWithAuth(`/api/trades/${id}`, { method:'DELETE' });
      loadTrades();
      showToast('Trade deleted');
    }
  };

  const filteredTrades = trades.filter(t => 
    (!filters.pair || t.pair === filters.pair) &&
    (!filters.outcome || t.outcome === filters.outcome) &&
    (!filters.strategy || t.strategy === filters.strategy)
  );

  const exportCSV = () => {
    const headers = ['Date','Pair','Direction','Entry','Exit','Quantity','Outcome','Strategy','P&L','Emotion','Rating'];
    const rows = filteredTrades.map(t => [
      t.date, t.pair, t.direction, t.entryPrice, t.exitPrice, t.quantity,
      t.outcome, t.strategy || '', ((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity).toFixed(2),
      t.emotion || '', t.rating || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trades_${new Date().toISOString()}.csv`;
    a.click();
    showToast('CSV exported');
  };

  return (
    <div className="page">
      <h1>Trade Log</h1>
      <div className="filters-bar">
        <select value={filters.pair} onChange={e=>setFilters({...filters, pair:e.target.value})}><option value="">All pairs</option>{[...new Set(trades.map(t=>t.pair))].map(p=><option key={p}>{p}</option>)}</select>
        <select value={filters.outcome} onChange={e=>setFilters({...filters, outcome:e.target.value})}><option value="">All outcomes</option><option>win</option><option>loss</option><option>breakeven</option></select>
        <select value={filters.strategy} onChange={e=>setFilters({...filters, strategy:e.target.value})}><option value="">All strategies</option>{[...new Set(trades.map(t=>t.strategy).filter(Boolean))].map(s=><option key={s}>{s}</option>)}</select>
        <button className="btn-secondary" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      <form onSubmit={handleSubmit} className="trade-form">
        <h3>{editingTrade ? '✏️ Edit Trade' : '➕ Log New Trade'}</h3>
        <div className="form-row">
          <input type="datetime-local" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} required />
          <input placeholder="Pair" value={form.pair} onChange={e=>setForm({...form, pair:e.target.value})} required />
          <input type="number" step="any" placeholder="Entry" value={form.entryPrice} onChange={e=>setForm({...form, entryPrice:e.target.value})} required />
          <input type="number" step="any" placeholder="Exit" value={form.exitPrice} onChange={e=>setForm({...form, exitPrice:e.target.value})} required />
          <input type="number" step="any" placeholder="Quantity (lots)" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} required />
          <select value={form.direction} onChange={e=>setForm({...form, direction:e.target.value})}><option>long</option><option>short</option></select>
          <select value={form.outcome} onChange={e=>setForm({...form, outcome:e.target.value})}><option>win</option><option>loss</option><option>breakeven</option></select>
          <input placeholder="Strategy (optional)" value={form.strategy} onChange={e=>setForm({...form, strategy:e.target.value})} />
          <select value={form.emotion} onChange={e=>setForm({...form, emotion:e.target.value})}>
            <option>calm</option><option>fearful</option><option>fomo</option><option>confident</option><option>frustrated</option>
          </select>
          <select value={form.rating} onChange={e=>setForm({...form, rating:parseInt(e.target.value)})}>
            {[1,2,3,4,5].map(r=><option key={r}>{r}⭐</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary">{editingTrade ? 'Update' : 'Save Trade'}</button>
        {editingTrade && <button type="button" onClick={()=>setEditingTrade(null)} className="btn-secondary">Cancel</button>}
      </form>

      <table className="trade-table">
        <thead><tr><th>Date</th><th>Pair</th><th>Dir</th><th>Entry/Exit</th><th>Qty</th><th>Outcome</th><th>P&L</th><th>Emotion</th><th>⭐</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredTrades.map(t => (
            <tr key={t._id}>
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>{t.pair}</td>
              <td><span className={`badge ${t.direction}`}>{t.direction}</span></td>
              <td>{t.entryPrice}/{t.exitPrice}</td>
              <td>{t.quantity}</td>
              <td><span className={`badge ${t.outcome}`}>{t.outcome}</span></td>
              <td>${((t.exitPrice - t.entryPrice) * (t.direction==='long'?1:-1) * t.quantity).toFixed(2)}</td>
              <td>{t.emotion || '-'}</td>
              <td>{t.rating ? '⭐'.repeat(t.rating) : '-'}</td>
              <td><button className="icon-btn" onClick={()=>{setEditingTrade(t); setForm({...t, date:t.date.slice(0,16), entryPrice:t.entryPrice, exitPrice:t.exitPrice, quantity:t.quantity});}}>✏️</button> <button className="icon-btn" onClick={()=>handleDelete(t._id)}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ------------------------- Analytics (with Calendar Heatmap, Sessions, Drawdown) -------------------------
const Analytics = ({ trades }) => {
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarWeeks = getCalendarData(trades, viewYear, viewMonth);

  // Session stats
  const sessionStats = ['London','New York','Asia'].map(sess => {
    const sessionTrades = trades.filter(t => getSession(t.date) === sess);
    const wins = sessionTrades.filter(t => t.outcome === 'win').length;
    return { session: sess, count: sessionTrades.length, winRate: sessionTrades.length ? (wins/sessionTrades.length*100).toFixed(1) : 0 };
  });

  // Emotional distribution
  const emotions = ['calm','fearful','fomo','confident','frustrated'];
  const emotionCounts = emotions.map(e => ({ name: e, value: trades.filter(t => t.emotion === e).length }));

  // Equity & Drawdown
  const sortedTrades = [...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  let equityCurve = [];
  let running = 0;
  sortedTrades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    running += pnl;
    equityCurve.push({ date: t.date.slice(0,10), equity: running });
  });
  const drawdownData = computeDrawdown(trades);

  return (
    <div className="page">
      <h1>Analytics War Room</h1>

      {/* Calendar Heatmap */}
      <div className="card">
        <h3>📅 Daily P&L Heatmap</h3>
        <div className="heatmap-controls">
          <button onClick={()=>setViewMonth((m)=>(m===0? (setViewYear(y=>y-1),11) : m-1))}>◀</button>
          <span>{new Date(viewYear, viewMonth).toLocaleString('default', { month:'long', year:'numeric' })}</span>
          <button onClick={()=>setViewMonth((m)=>(m===11? (setViewYear(y=>y+1),0) : m+1))}>▶</button>
        </div>
        <div className="calendar-heatmap">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="weekday">{d}</div>)}
          {calendarWeeks.flat().map((day, idx) => (
            <div key={idx} className={`heat-cell ${day ? (day.pnl>0 ? 'pos' : day.pnl<0 ? 'neg' : 'neutral') : 'empty'}`} style={day ? { backgroundColor: day.pnl>0 ? `rgba(74,222,128,${Math.min(0.9, day.pnl/500)})` : day.pnl<0 ? `rgba(248,113,113,${Math.min(0.9, Math.abs(day.pnl)/500)})` : '#2a2e4a' } : {}}>
              {day ? <><div>{day.day}</div><small>${day.pnl.toFixed(0)}</small></> : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-row">
        <div className="card"><h3>📈 Equity Curve</h3><ResponsiveContainer width="100%" height={250}><LineChart data={equityCurve}><CartesianGrid stroke="#333"/><XAxis dataKey="date" tick={{fill:'#ccc'}}/><YAxis /><Tooltip /><Line type="monotone" dataKey="equity" stroke="#e8a020" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
        <div className="card"><h3>📉 Drawdown %</h3><ResponsiveContainer width="100%" height={250}><AreaChart data={drawdownData}><CartesianGrid stroke="#333"/><XAxis dataKey="date"/><YAxis /><Tooltip /><Area type="monotone" dataKey="drawdown" stroke="#f87171" fill="#f87171" fillOpacity={0.3}/></AreaChart></ResponsiveContainer></div>
      </div>

      <div className="chart-row">
        <div className="card"><h3>🌍 Session Win Rate</h3><ResponsiveContainer width="100%" height={250}><BarChart data={sessionStats}><CartesianGrid stroke="#333"/><XAxis dataKey="session"/><YAxis /><Tooltip /><Bar dataKey="winRate" fill="#e8a020"/></BarChart></ResponsiveContainer></div>
        <div className="card"><h3>😌 Emotional Distribution</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={emotionCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label><Cell fill="#e8a020"/><Cell fill="#f87171"/><Cell fill="#fbbf24"/><Cell fill="#4ade80"/><Cell fill="#a855f7"/></Pie><Tooltip/></PieChart></ResponsiveContainer></div>
      </div>

      {/* Existing Pair & Strategy tables can be added similarly – keeping brief for length */}
    </div>
  );
};

// ------------------------- Backtest (from previous version) -------------------------
const Backtest = ({ trades }) => {
  const [params, setParams] = useState({ strategy:'', numSims:200 });
  const [results, setResults] = useState(null);
  const runMonteCarlo = () => {
    const strategyTrades = params.strategy ? trades.filter(t => t.strategy === params.strategy) : trades;
    if (strategyTrades.length < 5) { alert('Need at least 5 trades'); return; }
    const pnls = strategyTrades.map(t => (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity);
    const sims = [];
    for (let i=0; i<params.numSims; i++) {
      let total = 0;
      for (let j=0; j<strategyTrades.length; j++) total += pnls[Math.floor(Math.random()*pnls.length)];
      sims.push(total);
    }
    sims.sort((a,b)=>a-b);
    setResults({ median: sims[Math.floor(sims.length/2)], p10: sims[Math.floor(sims.length*0.1)], p90: sims[Math.floor(sims.length*0.9)], profitable: sims.filter(s=>s>0).length/sims.length*100 });
  };
  return (
    <div className="page">
      <h1>Backtesting Lab</h1>
      <div className="card">
        <select value={params.strategy} onChange={e=>setParams({...params, strategy:e.target.value})}><option value="">All strategies</option>{[...new Set(trades.map(t=>t.strategy).filter(Boolean))].map(s=><option key={s}>{s}</option>)}</select>
        <input type="number" value={params.numSims} onChange={e=>setParams({...params, numSims:parseInt(e.target.value)})} />
        <button onClick={runMonteCarlo}>Run Monte Carlo</button>
        {results && <div><p>Median P&L: ${results.median.toFixed(2)}</p><p>10th percentile: ${results.p10.toFixed(2)}</p><p>90th percentile: ${results.p90.toFixed(2)}</p><p>Profitable simulations: {results.profitable.toFixed(1)}%</p></div>}
      </div>
    </div>
  );
};

// ------------------------- Rules & Profile (simplified) -------------------------
const Rules = ({ user, showToast }) => {
  const [rules, setRules] = useState(user.tradingRules || '');
  const saveRules = async () => {
    await fetchWithAuth('/api/user/profile', { method:'PUT', body: JSON.stringify({ tradingRules: rules }) });
    showToast('Rules saved');
  };
  return (<div className="page"><h1>Trading Rules</h1><textarea value={rules} onChange={e=>setRules(e.target.value)} rows={10} className="rules-textarea"/><button onClick={saveRules}>Save</button></div>);
};

const Profile = ({ user, showToast }) => {
  const [name, setName] = useState(user.name);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const updateProfile = async () => { await fetchWithAuth('/api/user/profile', { method:'PUT', body: JSON.stringify({ name }) }); showToast('Profile updated'); };
  const changePassword = async () => { await fetchWithAuth('/api/user/change-password', { method:'POST', body: JSON.stringify({ oldPassword:oldPwd, newPassword:newPwd }) }); showToast('Password changed'); setOldPwd(''); setNewPwd(''); };
  return (<div className="page"><h1>Profile</h1><input value={name} onChange={e=>setName(e.target.value)}/><button onClick={updateProfile}>Update Name</button><hr/><input type="password" placeholder="Old password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)}/><input type="password" placeholder="New password" value={newPwd} onChange={e=>setNewPwd(e.target.value)}/><button onClick={changePassword}>Change Password</button></div>);
};

// ------------------------- Global CSS (injected in <head> via style tag - but we include here for completeness) -------------------------
const GlobalStyle = () => (
  <style>{`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0c15; font-family: 'Inter', 'Segoe UI', monospace; color: #e0e4f0; }
    .war-room { display: flex; min-height: 100vh; background: radial-gradient(circle at 20% 30%, #0f1222, #05070c); position: relative; }
    .war-room::before { content: ''; position: fixed; top:0; left:0; width:100%; height:100%; background-image: repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 4px); pointer-events: none; z-index: 0; }
    .sidebar { width: 260px; background: rgba(10,14,30,0.8); backdrop-filter: blur(12px); border-right: 1px solid rgba(232,160,32,0.3); padding: 2rem 1rem; position: fixed; height: 100vh; z-index: 2; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #e8a020; margin-bottom: 2rem; text-shadow: 0 0 5px #e8a020; letter-spacing: 2px; }
    .logo span { color: white; font-weight: normal; font-size: 0.8rem; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin: 8px 0; color: #b0b8cc; text-decoration: none; border-radius: 8px; transition: all 0.2s; }
    .nav-item.active { background: rgba(232,160,32,0.2); color: #e8a020; border-left: 3px solid #e8a020; }
    .nav-item:hover { background: rgba(232,160,32,0.1); color: #fff; }
    .logout-btn { margin-top: 3rem; width: 100%; background: rgba(248,113,113,0.2); border: 1px solid #f87171; color: #f87171; padding: 10px; border-radius: 8px; cursor: pointer; }
    .main-content { margin-left: 260px; flex: 1; padding: 2rem; z-index: 1; }
    .page { max-width: 1400px; margin: 0 auto; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 20px; margin: 30px 0; }
    .stat-card { background: rgba(26,31,58,0.7); backdrop-filter: blur(4px); border-radius: 16px; padding: 20px; border: 1px solid rgba(232,160,32,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .stat-card .value { font-size: 2rem; font-weight: bold; font-family: monospace; }
    .trade-table { width: 100%; border-collapse: collapse; background: #1a1f3a; border-radius: 12px; overflow: hidden; margin-top: 20px; }
    .trade-table th, .trade-table td { padding: 12px; text-align: left; border-bottom: 1px solid #2a2e4a; }
    .badge { padding: 4px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
    .badge.long { background: #4ade8020; color:#4ade80; border:1px solid #4ade80; }
    .badge.short { background: #f8717120; color:#f87171; border:1px solid #f87171; }
    .badge.win { background: #4ade8020; color:#4ade80; }
    .badge.loss { background: #f8717120; color:#f87171; }
    .trade-form { background: #1a1f3a; padding: 20px; border-radius: 16px; margin-bottom: 30px; }
    .form-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 15px 0; }
    .form-row input, .form-row select { background: #0f1222; border: 1px solid #e8a020; padding: 10px; border-radius: 8px; color: white; flex: 1 0 150px; }
    .btn-primary { background: #e8a020; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .btn-secondary { background: #2a2e4a; border: none; padding: 10px 20px; border-radius: 8px; color: white; cursor: pointer; }
    .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .calendar-heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 15px; }
    .heat-cell { background: #1e2340; padding: 8px 4px; text-align: center; border-radius: 6px; font-size: 12px; transition: transform 0.1s; cursor: default; color: white; }
    .heat-cell.pos { background-color: #4ade80cc; }
    .heat-cell.neg { background-color: #f87171cc; }
    .heat-cell.neutral { background-color: #2a2e4a; }
    .weekday { font-weight: bold; text-align: center; color: #e8a020; }
    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
    .card { background: rgba(26,31,58,0.7); backdrop-filter: blur(4px); border-radius: 16px; padding: 20px; border: 1px solid rgba(232,160,32,0.3); }
    .toast { position: fixed; bottom: 20px; right: 20px; background: #1a1f3a; border-left: 4px solid #e8a020; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 15px black; z-index: 1000; }
    .toast.error { border-left-color: #f87171; }
    @media (max-width: 768px) { .sidebar { width: 80px; } .sidebar .logo span, .sidebar .nav-item span:last-child { display: none; } .main-content { margin-left: 80px; } .chart-row { grid-template-columns: 1fr; } }
  `}</style>
);

// Wrap App with GlobalStyle
const AppWithStyles = () => (<><GlobalStyle/><App/></>);
export default AppWithStyles;