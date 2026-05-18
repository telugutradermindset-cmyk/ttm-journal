import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-2c4af.up.railway.app';

// ------------------------- HELPERS -------------------------
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

const getSession = (dateStr) => {
  const d = new Date(dateStr);
  const hour = d.getUTCHours();
  if (hour >= 8 && hour < 17) return 'London';
  if (hour >= 13 && hour < 22) return 'New York';
  return 'Asia';
};

const computeMaxDrawdown = (equityCurve) => {
  if (!equityCurve.length) return 0;
  let peak = equityCurve[0].equity;
  let maxDrawdown = 0;
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i].equity > peak) peak = equityCurve[i].equity;
    const drawdown = peak > 0 ? ((peak - equityCurve[i].equity) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
};

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
        const pnl = dayTrades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
        week.push({ day, pnl, date: dateStr });
        day++;
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }
  return weeks;
};

// ------------------------- SIDEBAR & TOPBAR -------------------------
const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="sidebar">
      <div className="logo">
        <span className="logo-icon">📈</span>
        <span>TTM<span>Journal</span></span>
      </div>
      
      <div className="sidebar-section">
        <div className="section-label">Trading</div>
        <SidebarItem to="/" icon="📊" label="Dashboard" active={isActive('/')} />
        <SidebarItem to="/trades" icon="📝" label="Trade Log" active={isActive('/trades')} />
        <SidebarItem to="/analytics" icon="📈" label="Analytics" active={isActive('/analytics')} />
        <SidebarItem to="/backtest" icon="🧪" label="Backtesting" active={isActive('/backtest')} />
      </div>
      
      <div className="sidebar-section">
        <div className="section-label">Tools</div>
        <SidebarItem to="/rules" icon="📋" label="Trading Rules" active={isActive('/rules')} />
        <SidebarItem to="/profile" icon="⚙️" label="Profile" active={isActive('/profile')} />
      </div>
      
      <div className="sidebar-section">
        <div className="section-label">Community</div>
        <SidebarItem to="/lounge" icon="💬" label="Traders Lounge" active={isActive('/lounge')} />
        <SidebarItem to="/leaderboard" icon="🏆" label="Leaderboard" active={isActive('/leaderboard')} />
      </div>
      
      <div className="upgrade-card">
        <div className="upgrade-icon">🚀</div>
        <div className="upgrade-title">Upgrade to Pro</div>
        <div className="upgrade-desc">Unlock AI reports & traders lounge</div>
        <button className="upgrade-btn" onClick={() => alert('Stripe integration coming soon!')}>Upgrade</button>
      </div>
      
      <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>
        <span>🚪</span> Logout
      </button>
    </div>
  );
};

const SidebarItem = ({ to, icon, label, active }) => (
  <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
    <span className="sidebar-icon">{icon}</span>
    <span className="sidebar-label">{label}</span>
  </Link>
);

const TopBar = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  return (
    <div className="top-bar">
      <div className="top-left">
        <div className="date-badge">{formattedDate}</div>
        <div className="time-badge">{formattedTime}</div>
        <div className="beta-badge">BETA</div>
      </div>
      <div className="top-center">
        <div className="search-bar">
          <span>🔍</span>
          <input type="text" placeholder="Search trades, pairs..." />
          <span className="search-shortcut">Ctrl+K</span>
        </div>
      </div>
      <div className="top-right">
        <div className="user-avatar">
          <span>{user?.name?.charAt(0) || 'U'}</span>
        </div>
        <div className="user-name">{user?.name?.split(' ')[0] || 'Trader'}</div>
      </div>
    </div>
  );
};

// ------------------------- MAIN APP -------------------------
const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return navigate('/login');
    fetchWithAuth('/api/auth/me')
      .then(data => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); })
      .finally(() => setLoading(false));
    loadTrades();
  }, [navigate]);

  if (loading) return <div className="loading">Loading TTM Journal...</div>;
  if (!user) return null;

  return (
    <div className="app">
      <Sidebar />
      <div className="main-area">
        <TopBar user={user} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard trades={trades} user={user} />} />
            <Route path="/trades" element={<TradeLog trades={trades} loadTrades={loadTrades} showToast={showToast} />} />
            <Route path="/analytics" element={<Analytics trades={trades} />} />
            <Route path="/backtest" element={<Backtest trades={trades} />} />
            <Route path="/rules" element={<Rules user={user} showToast={showToast} />} />
            <Route path="/profile" element={<Profile user={user} showToast={showToast} />} />
            <Route path="/lounge" element={<Lounge />} />
            <Route path="/leaderboard" element={<Leaderboard trades={trades} />} />
          </Routes>
        </div>
      </div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

// ------------------------- DASHBOARD -------------------------
const Dashboard = ({ trades, user }) => {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(1) : 0;
  const totalPnl = trades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
  
  let grossProfit = 0, grossLoss = 0;
  trades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    if (pnl > 0) grossProfit += pnl;
    else grossLoss += Math.abs(pnl);
  });
  const profitFactor = grossLoss ? (grossProfit / grossLoss).toFixed(2) : '∞';
  
  const avgRR = trades.reduce((sum, t) => sum + ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100, 0) / (totalTrades || 1);
  
  const sortedTrades = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
  let equityCurve = [];
  let running = 0;
  sortedTrades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    running += pnl;
    equityCurve.push({ date: t.date.slice(0,10), equity: running });
  });
  const maxDrawdown = computeMaxDrawdown(equityCurve);
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome">Welcome back, {user.name}</p>
      </div>
      
      <div className="stats-grid">
        <StatCard title="Total Trades" value={totalTrades} icon="📊" color="#e8a020" />
        <StatCard title="Win Rate" value={`${winRate}%`} icon="🎯" color="#4ade80" />
        <StatCard title="Total P&L" value={`$${totalPnl.toFixed(2)}`} icon="💰" color={totalPnl >= 0 ? '#4ade80' : '#f87171'} />
        <StatCard title="Profit Factor" value={profitFactor} icon="⚡" color="#e8a020" />
        <StatCard title="Avg R:R" value={`${avgRR.toFixed(1)}%`} icon="📏" color="#60a5fa" />
        <StatCard title="Max DD" value={`${maxDrawdown.toFixed(1)}%`} icon="📉" color="#f87171" />
      </div>
      
      {equityCurve.length > 0 && (
        <div className="card">
          <h3>📈 Equity Curve</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={equityCurve}>
              <CartesianGrid stroke="#2a2e4a" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#b0b8cc' }} />
              <YAxis tick={{ fill: '#b0b8cc' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
              <Area type="monotone" dataKey="equity" stroke="#e8a020" fill="url(#equityGrad)" />
              <defs><linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8a020" stopOpacity={0.8}/><stop offset="95%" stopColor="#e8a020" stopOpacity={0}/></linearGradient></defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="quick-actions">
        <Link to="/trades" className="quick-btn primary">+ Log New Trade</Link>
        <Link to="/analytics" className="quick-btn secondary">📊 View Analytics</Link>
      </div>
      
      <div className="recent-trades">
        <h3>Recent Trades</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Pair</th><th>Direction</th><th>Entry/Exit</th><th>Outcome</th><th>P&L</th></tr></thead>
            <tbody>
              {trades.slice(0,5).map(t => {
                const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
                return (
                  <tr key={t._id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>{t.pair}</td>
                    <td><span className={`badge ${t.direction}`}>{t.direction}</span></td>
                    <td>{t.entryPrice} → {t.exitPrice}</td>
                    <td><span className={`badge ${t.outcome}`}>{t.outcome}</span></td>
                    <td style={{color: pnl >=0 ? '#4ade80' : '#f87171', fontWeight: 'bold'}}>${pnl.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <div className="stat-title">{title}</div>
      <div className="stat-value" style={{color}}>{value}</div>
    </div>
  </div>
);

// ------------------------- TRADE LOG (with emotion + rating) -------------------------
const TradeLog = ({ trades, loadTrades, showToast }) => {
  const [editingTrade, setEditingTrade] = useState(null);
  const [form, setForm] = useState({
    pair: 'EURUSD', entryPrice: '', exitPrice: '', quantity: '1',
    direction: 'long', outcome: 'win', strategy: '',
    date: new Date().toISOString().slice(0, 16),
    emotion: 'calm', rating: 3
  });
  const [filters, setFilters] = useState({ pair: '', outcome: '', strategy: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      quantity: parseFloat(form.quantity),
      rating: parseInt(form.rating)
    };
    try {
      if (editingTrade) {
        await fetchWithAuth(`/api/trades/${editingTrade._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Trade updated');
      } else {
        await fetchWithAuth('/api/trades', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Trade added');
      }
      loadTrades();
      setEditingTrade(null);
      setForm({ pair: 'EURUSD', entryPrice: '', exitPrice: '', quantity: '1', direction: 'long', outcome: 'win', strategy: '', date: new Date().toISOString().slice(0, 16), emotion: 'calm', rating: 3 });
    } catch (err) { showToast('Error saving trade', 'error'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this trade?')) {
      await fetchWithAuth(`/api/trades/${id}`, { method: 'DELETE' });
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
    const headers = ['Date', 'Pair', 'Direction', 'Entry', 'Exit', 'Quantity', 'Outcome', 'Strategy', 'P&L', 'Emotion', 'Rating'];
    const rows = filteredTrades.map(t => [
      t.date, t.pair, t.direction, t.entryPrice, t.exitPrice, t.quantity,
      t.outcome, t.strategy || '', ((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity).toFixed(2),
      t.emotion || '', t.rating || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
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
        <select value={filters.pair} onChange={e => setFilters({ ...filters, pair: e.target.value })}>
          <option value="">All pairs</option>
          {[...new Set(trades.map(t => t.pair))].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filters.outcome} onChange={e => setFilters({ ...filters, outcome: e.target.value })}>
          <option value="">All outcomes</option>
          <option>win</option><option>loss</option><option>breakeven</option>
        </select>
        <select value={filters.strategy} onChange={e => setFilters({ ...filters, strategy: e.target.value })}>
          <option value="">All strategies</option>
          {[...new Set(trades.map(t => t.strategy).filter(Boolean))].map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-secondary" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <h3>{editingTrade ? '✏️ Edit Trade' : '➕ Log New Trade'}</h3>
        <div className="form-row">
          <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          <input placeholder="Pair" value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value })} required />
          <input type="number" step="any" placeholder="Entry" value={form.entryPrice} onChange={e => setForm({ ...form, entryPrice: e.target.value })} required />
          <input type="number" step="any" placeholder="Exit" value={form.exitPrice} onChange={e => setForm({ ...form, exitPrice: e.target.value })} required />
          <input type="number" step="any" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
          <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}><option>long</option><option>short</option></select>
          <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}><option>win</option><option>loss</option><option>breakeven</option></select>
          <input placeholder="Strategy" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} />
          <select value={form.emotion} onChange={e => setForm({ ...form, emotion: e.target.value })}>
            <option>calm</option><option>fearful</option><option>fomo</option><option>confident</option><option>frustrated</option>
          </select>
          <select value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}>
            {[1,2,3,4,5].map(r => <option key={r}>{r}⭐</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">{editingTrade ? 'Update' : 'Save Trade'}</button>
          {editingTrade && <button type="button" onClick={() => setEditingTrade(null)} className="btn-secondary">Cancel</button>}
        </div>
      </form>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Pair</th><th>Dir</th><th>Entry/Exit</th><th>Qty</th><th>Outcome</th><th>P&L</th><th>Emotion</th><th>⭐</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredTrades.map(t => {
              const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
              return (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.pair}</td>
                  <td><span className={`badge ${t.direction}`}>{t.direction}</span></td>
                  <td>{t.entryPrice} → {t.exitPrice}</td>
                  <td>{t.quantity}</td>
                  <td><span className={`badge ${t.outcome}`}>{t.outcome}</span></td>
                  <td style={{color: pnl >=0 ? '#4ade80' : '#f87171'}}>${pnl.toFixed(2)}</td>
                  <td><span className={`emotion-badge ${t.emotion || 'calm'}`}>{t.emotion || '-'}</span></td>
                  <td>{t.rating ? '⭐'.repeat(t.rating) : '-'}</td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingTrade(t); setForm({ ...t, date: t.date.slice(0,16), entryPrice: t.entryPrice, exitPrice: t.exitPrice, quantity: t.quantity, rating: t.rating || 3 }); }}>✏️</button>
                    <button className="icon-btn delete" onClick={() => handleDelete(t._id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ------------------------- ANALYTICS (simplified for brevity, but fully functional) -------------------------
const Analytics = ({ trades }) => {
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarWeeks = getCalendarData(trades, viewYear, viewMonth);
  
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(1) : 0;
  const totalPnl = trades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
  
  const outcomeData = [
    { name: 'Wins', value: wins, color: '#4ade80' },
    { name: 'Losses', value: trades.filter(t => t.outcome === 'loss').length, color: '#f87171' },
    { name: 'Breakeven', value: totalTrades - wins - trades.filter(t => t.outcome === 'loss').length, color: '#fbbf24' }
  ];
  
  const sessionStats = ['London', 'New York', 'Asia'].map(sess => {
    const sessionTrades = trades.filter(t => getSession(t.date) === sess);
    const sessionWins = sessionTrades.filter(t => t.outcome === 'win').length;
    const sessionPnl = sessionTrades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
    return { session: sess, winRate: sessionTrades.length ? (sessionWins / sessionTrades.length * 100).toFixed(1) : 0, pnl: sessionPnl };
  });
  
  const emotions = ['calm', 'fearful', 'fomo', 'confident', 'frustrated'];
  const emotionColors = ['#4ade80', '#f87171', '#fbbf24', '#e8a020', '#a855f7'];
  const emotionData = emotions.map(e => ({ name: e, value: trades.filter(t => t.emotion === e).length }));
  
  const sortedTrades = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
  let equityCurve = [], running = 0;
  sortedTrades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    running += pnl;
    equityCurve.push({ date: t.date.slice(0,10), equity: running });
  });
  
  return (
    <div className="page">
      <h1>Analytics</h1>
      <div className="stats-mini-grid">
        <div className="mini-stat"><span>Total Trades</span><strong>{totalTrades}</strong></div>
        <div className="mini-stat"><span>Win Rate</span><strong>{winRate}%</strong></div>
        <div className="mini-stat"><span>Total P&L</span><strong style={{color: totalPnl >=0 ? '#4ade80' : '#f87171'}}>${totalPnl.toFixed(2)}</strong></div>
      </div>
      
      <div className="card">
        <h3>📅 Daily P&L Heatmap</h3>
        <div className="heatmap-controls">
          <button onClick={() => setViewMonth(m => m === 0 ? (setViewYear(y => y-1), 11) : m-1)}>◀</button>
          <span>{new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setViewMonth(m => m === 11 ? (setViewYear(y => y+1), 0) : m+1)}>▶</button>
        </div>
        <div className="calendar-heatmap">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="weekday">{d}</div>)}
          {calendarWeeks.flat().map((day, idx) => (
            <div key={idx} className={`heat-cell ${day ? (day.pnl > 0 ? 'pos' : day.pnl < 0 ? 'neg' : 'neutral') : 'empty'}`}
                 style={day ? { backgroundColor: day.pnl > 0 ? `rgba(74,222,128,${Math.min(0.9, day.pnl/500)})` : day.pnl < 0 ? `rgba(248,113,113,${Math.min(0.9, Math.abs(day.pnl)/500)})` : '#2a2e4a' } : {}}>
              {day ? <><div className="heat-day">{day.day}</div><div className="heat-pnl">${day.pnl.toFixed(0)}</div></> : ''}
            </div>
          ))}
        </div>
      </div>
      
      <div className="chart-row">
        <div className="card"><h3>📈 Equity Curve</h3><ResponsiveContainer width="100%" height={250}><AreaChart data={equityCurve}><CartesianGrid stroke="#2a2e4a"/><XAxis dataKey="date"/><YAxis/><Tooltip/><Area type="monotone" dataKey="equity" stroke="#e8a020" fill="#e8a020" fillOpacity={0.2}/></AreaChart></ResponsiveContainer></div>
        <div className="card"><h3>🌍 Session P&L</h3><ResponsiveContainer width="100%" height={250}><BarChart data={sessionStats}><CartesianGrid stroke="#2a2e4a"/><XAxis dataKey="session"/><YAxis/><Tooltip/><Bar dataKey="pnl" fill="#e8a020"/></BarChart></ResponsiveContainer></div>
      </div>
      
      <div className="chart-row">
        <div className="card"><h3>🎯 Win/Loss</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{outcomeData.map((e,i) => <Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
        <div className="card"><h3>😌 Emotions</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={emotionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{emotionData.map((e,i) => <Cell key={i} fill={emotionColors[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};

// ------------------------- BACKTEST (Monte Carlo) -------------------------
const Backtest = ({ trades }) => {
  const [params, setParams] = useState({ strategy: '', numSims: 200 });
  const [results, setResults] = useState(null);
  const runMonteCarlo = () => {
    const strategyTrades = params.strategy ? trades.filter(t => t.strategy === params.strategy) : trades;
    if (strategyTrades.length < 5) { alert('Need at least 5 trades'); return; }
    const pnls = strategyTrades.map(t => (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity);
    const sims = [];
    for (let i = 0; i < params.numSims; i++) {
      let total = 0;
      for (let j = 0; j < strategyTrades.length; j++) total += pnls[Math.floor(Math.random() * pnls.length)];
      sims.push(total);
    }
    sims.sort((a,b) => a - b);
    setResults({ median: sims[Math.floor(sims.length/2)], p10: sims[Math.floor(sims.length*0.1)], p90: sims[Math.floor(sims.length*0.9)], profitable: sims.filter(s => s > 0).length / sims.length * 100 });
  };
  return (
    <div className="page">
      <h1>Backtesting</h1>
      <div className="card">
        <div className="backtest-controls">
          <select value={params.strategy} onChange={e => setParams({ ...params, strategy: e.target.value })}>
            <option value="">All Strategies</option>
            {[...new Set(trades.map(t => t.strategy).filter(Boolean))].map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="number" value={params.numSims} onChange={e => setParams({ ...params, numSims: parseInt(e.target.value) })} min={50} max={1000} step={50} />
          <button className="btn-primary" onClick={runMonteCarlo}>Run Monte Carlo</button>
        </div>
        {results && (
          <div className="backtest-results">
            <div className="results-grid">
              <div className="result-item"><span>Median P&L</span><strong>${results.median.toFixed(2)}</strong></div>
              <div className="result-item"><span>10th Percentile</span><strong>${results.p10.toFixed(2)}</strong></div>
              <div className="result-item"><span>90th Percentile</span><strong>${results.p90.toFixed(2)}</strong></div>
              <div className="result-item"><span>Profitable Sims</span><strong>{results.profitable.toFixed(1)}%</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------- RULES & PROFILE -------------------------
const Rules = ({ user, showToast }) => {
  const [rules, setRules] = useState(user.tradingRules || '');
  const saveRules = async () => {
    await fetchWithAuth('/api/user/profile', { method: 'PUT', body: JSON.stringify({ tradingRules: rules }) });
    showToast('Rules saved');
  };
  return (
    <div className="page">
      <h1>Trading Rules</h1>
      <div className="card">
        <textarea value={rules} onChange={e => setRules(e.target.value)} rows={12} className="rules-textarea" placeholder="Write your trading rules here..." />
        <button className="btn-primary" onClick={saveRules}>Save Rules</button>
      </div>
    </div>
  );
};

const Profile = ({ user, showToast }) => {
  const [name, setName] = useState(user.name);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const updateProfile = async () => {
    await fetchWithAuth('/api/user/profile', { method: 'PUT', body: JSON.stringify({ name }) });
    showToast('Profile updated');
  };
  const changePassword = async () => {
    await fetchWithAuth('/api/user/change-password', { method: 'POST', body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }) });
    showToast('Password changed');
    setOldPwd(''); setNewPwd('');
  };
  return (
    <div className="page">
      <h1>Profile</h1>
      <div className="card">
        <div className="profile-form">
          <label>Email</label>
          <input type="email" value={user.email} disabled />
          <label>Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
          <button className="btn-primary" onClick={updateProfile}>Update Name</button>
        </div>
      </div>
      <div className="card">
        <h3>Change Password</h3>
        <div className="profile-form">
          <label>Current Password</label>
          <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
          <label>New Password</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          <button className="btn-primary" onClick={changePassword}>Change Password</button>
        </div>
      </div>
    </div>
  );
};

// ------------------------- COMMUNITY PAGES (Lounge & Leaderboard) -------------------------
const Lounge = () => (
  <div className="page">
    <h1>Traders Lounge</h1>
    <div className="lounge-hero">
      <div className="lounge-icon">💬</div>
      <h2>Connect with fellow traders</h2>
      <p>Join active trading rooms, share insights, and discuss markets in real time with the community.</p>
      <div className="active-count">481 traders active</div>
      <div className="upgrade-prompt">
        <p>Upgrade to Pro or Elite to unlock Traders Lounge</p>
        <button className="btn-primary" onClick={() => alert('Stripe integration coming soon!')}>Upgrade Now</button>
      </div>
    </div>
    <div className="features-grid">
      <div className="feature-card"><div className="feature-icon">📡</div><h4>Trade Signals</h4><p>Real-time entries, stop-loss, and take-profit levels from experienced traders</p></div>
      <div className="feature-card"><div className="feature-icon">📊</div><h4>Market Analysis</h4><p>Daily market updates, news, and technical analysis</p></div>
      <div className="feature-card"><div className="feature-icon">🎓</div><h4>Learn & Grow</h4><p>Educational content, strategies, and mentorship from pros</p></div>
      <div className="feature-card"><div className="feature-icon">👥</div><h4>Community</h4><p>Connect with like-minded traders, share ideas, and grow together</p></div>
    </div>
  </div>
);

const Leaderboard = ({ trades }) => {
  // Mock leaderboard data – in real app, fetch from backend
  const topTraders = [
    { name: 'Alice Chen', winRate: 78, totalPnl: 12450, trades: 142 },
    { name: 'Marcus V', winRate: 72, totalPnl: 9870, trades: 98 },
    { name: 'Sarah K', winRate: 68, totalPnl: 7650, trades: 210 },
    { name: 'David L', winRate: 65, totalPnl: 5430, trades: 76 },
    { name: 'Your Rank', winRate: trades.length ? (trades.filter(t=>t.outcome==='win').length / trades.length * 100).toFixed(1) : 0, totalPnl: trades.reduce((s,t)=>s + (t.exitPrice - t.entryPrice)*(t.direction==='long'?1:-1)*t.quantity,0), trades: trades.length, isYou: true }
  ].sort((a,b) => b.winRate - a.winRate);
  
  return (
    <div className="page">
      <h1>Leaderboard</h1>
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Rank</th><th>Trader</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th></tr></thead>
            <tbody>
              {topTraders.map((trader, idx) => (
                <tr key={trader.name} className={trader.isYou ? 'you-row' : ''}>
                  <td>{idx + 1}</td>
                  <td>{trader.name} {trader.isYou && <span className="you-badge">You</span>}</td>
                  <td>{trader.trades}</td>
                  <td>{trader.winRate}%</td>
                  <td style={{color: trader.totalPnl >=0 ? '#4ade80' : '#f87171'}}>${trader.totalPnl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ------------------------- GLOBAL STYLES (Complete Redesign) -------------------------
const GlobalStyle = () => (
  <style>{`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #070b14; font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif; color: #e6edf5; }
    
    /* App Layout */
    .app { display: flex; min-height: 100vh; background: radial-gradient(ellipse at 20% 30%, #0f1422, #05080f); }
    
    /* Sidebar */
    .sidebar { width: 280px; background: rgba(8, 12, 22, 0.85); backdrop-filter: blur(16px); border-right: 1px solid rgba(232, 160, 32, 0.2); padding: 1.5rem; position: fixed; height: 100vh; overflow-y: auto; z-index: 10; }
    .logo { display: flex; align-items: center; gap: 10px; font-size: 1.4rem; font-weight: bold; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(232,160,32,0.3); }
    .logo-icon { font-size: 1.8rem; }
    .logo span { color: #e8a020; }
    .logo span span { color: white; font-weight: normal; font-size: 0.9rem; }
    .sidebar-section { margin-bottom: 1.5rem; }
    .section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #7c85a0; margin-bottom: 0.75rem; font-weight: 600; }
    .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin: 4px 0; border-radius: 10px; color: #b8c0dc; text-decoration: none; transition: all 0.2s; }
    .sidebar-item:hover { background: rgba(232,160,32,0.1); color: white; }
    .sidebar-item.active { background: rgba(232,160,32,0.15); color: #e8a020; border-left: 2px solid #e8a020; }
    .sidebar-icon { font-size: 1.2rem; }
    .sidebar-label { font-size: 0.9rem; font-weight: 500; }
    
    /* Upgrade Card */
    .upgrade-card { background: linear-gradient(135deg, rgba(232,160,32,0.15), rgba(200,100,20,0.05)); border-radius: 16px; padding: 1rem; margin: 1rem 0; border: 1px solid rgba(232,160,32,0.4); text-align: center; }
    .upgrade-icon { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .upgrade-title { font-weight: bold; color: #e8a020; margin-bottom: 0.25rem; }
    .upgrade-desc { font-size: 0.7rem; color: #9ca3af; margin-bottom: 0.75rem; }
    .upgrade-btn { background: #e8a020; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; cursor: pointer; width: 100%; transition: all 0.2s; }
    .upgrade-btn:hover { background: #c47a10; transform: scale(0.98); }
    
    .logout-btn { display: flex; align-items: center; gap: 8px; background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.5); width: 100%; padding: 10px; border-radius: 10px; color: #f87171; cursor: pointer; margin-top: 1rem; justify-content: center; transition: all 0.2s; }
    .logout-btn:hover { background: rgba(248,113,113,0.25); }
    
    /* Main Area */
    .main-area { margin-left: 280px; flex: 1; display: flex; flex-direction: column; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: rgba(8,12,22,0.6); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(232,160,32,0.2); position: sticky; top: 0; z-index: 5; }
    .top-left { display: flex; gap: 12px; align-items: center; }
    .date-badge, .time-badge, .beta-badge { background: rgba(232,160,32,0.15); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; }
    .beta-badge { background: rgba(100,100,200,0.2); color: #a5b4fc; border: 1px solid #a5b4fc40; }
    .search-bar { display: flex; align-items: center; gap: 8px; background: rgba(15,20,35,0.8); border-radius: 40px; padding: 6px 16px; border: 1px solid #2a2e4a; width: 300px; }
    .search-bar input { background: transparent; border: none; color: white; outline: none; flex: 1; font-size: 0.85rem; }
    .search-shortcut { font-size: 0.7rem; color: #7c85a0; background: #1e2338; padding: 2px 6px; border-radius: 6px; }
    .top-right { display: flex; align-items: center; gap: 12px; }
    .user-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #e8a020, #c47a10); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .user-name { font-size: 0.9rem; font-weight: 500; }
    
    .page-content { padding: 2rem; }
    .dashboard-header { margin-bottom: 1.5rem; }
    h1 { font-size: 1.8rem; color: #e8a020; margin-bottom: 0.25rem; }
    .welcome { color: #9ca3af; }
    
    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: rgba(20, 25, 45, 0.7); backdrop-filter: blur(4px); border-radius: 20px; padding: 1rem; display: flex; align-items: center; gap: 1rem; border: 1px solid rgba(232,160,32,0.25); transition: all 0.2s; }
    .stat-card:hover { border-color: rgba(232,160,32,0.6); transform: translateY(-2px); }
    .stat-icon { font-size: 2rem; }
    .stat-info { flex: 1; }
    .stat-title { font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-value { font-size: 1.6rem; font-weight: bold; font-family: monospace; }
    
    .stats-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .mini-stat { background: #1a1f3a; border-radius: 16px; padding: 1rem; text-align: center; border: 1px solid #2a2e4a; }
    .mini-stat span { font-size: 0.7rem; color: #9ca3af; display: block; margin-bottom: 6px; }
    .mini-stat strong { font-size: 1.4rem; font-family: monospace; }
    
    /* Cards & Tables */
    .card { background: rgba(20, 25, 45, 0.6); backdrop-filter: blur(4px); border-radius: 20px; padding: 1.5rem; border: 1px solid rgba(232,160,32,0.25); margin-bottom: 1.5rem; }
    .card h3 { margin-bottom: 1rem; color: #e8a020; font-size: 1.1rem; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #2a2e4a; }
    .data-table th { color: #e8a020; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
    .data-table tr:hover { background: rgba(232,160,32,0.05); }
    
    .badge { padding: 4px 10px; border-radius: 30px; font-size: 0.7rem; font-weight: bold; display: inline-block; }
    .badge.long { background: #4ade8020; color: #4ade80; border: 1px solid #4ade80; }
    .badge.short { background: #f8717120; color: #f87171; border: 1px solid #f87171; }
    .badge.win { background: #4ade8020; color: #4ade80; }
    .badge.loss { background: #f8717120; color: #f87171; }
    
    .emotion-badge { padding: 4px 8px; border-radius: 20px; font-size: 0.7rem; }
    .emotion-badge.calm { background: #4ade8020; color: #4ade80; }
    .emotion-badge.fearful { background: #f8717120; color: #f87171; }
    .emotion-badge.fomo { background: #fbbf2420; color: #fbbf24; }
    .emotion-badge.confident { background: #e8a02020; color: #e8a020; }
    .emotion-badge.frustrated { background: #a855f720; color: #a855f7; }
    
    /* Forms & Buttons */
    .form-card { background: rgba(20, 25, 45, 0.6); border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 1rem; }
    .form-row input, .form-row select { background: #0f1222; border: 1px solid #2a2e4a; padding: 10px; border-radius: 12px; color: white; flex: 1 0 150px; }
    .form-actions { display: flex; gap: 12px; }
    .btn-primary { background: linear-gradient(135deg, #e8a020, #c47a10); border: none; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(232,160,32,0.4); }
    .btn-secondary { background: #2a2e4a; border: none; padding: 10px 20px; border-radius: 30px; color: white; cursor: pointer; }
    .icon-btn { background: none; border: none; color: #b0b8cc; font-size: 1.2rem; cursor: pointer; margin: 0 4px; }
    .icon-btn.delete:hover { color: #f87171; }
    
    .filters-bar { display: flex; gap: 12px; margin-bottom: 1rem; flex-wrap: wrap; }
    .filters-bar select { background: #0f1222; border: 1px solid #2a2e4a; padding: 8px 16px; border-radius: 30px; color: white; }
    
    .quick-actions { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .quick-btn { padding: 10px 20px; border-radius: 40px; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; }
    .quick-btn.primary { background: linear-gradient(135deg, #e8a020, #c47a10); color: black; }
    .quick-btn.secondary { background: #2a2e4a; color: white; border: 1px solid #e8a02040; }
    
    /* Calendar Heatmap */
    .heatmap-controls { display: flex; justify-content: center; gap: 20px; margin-bottom: 1rem; }
    .calendar-heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .weekday { text-align: center; font-size: 0.7rem; color: #e8a020; padding: 6px; }
    .heat-cell { background: #1e2340; border-radius: 10px; text-align: center; padding: 6px; font-size: 0.7rem; min-height: 55px; display: flex; flex-direction: column; justify-content: center; }
    .heat-day { font-weight: bold; }
    .heat-pnl { font-size: 0.6rem; opacity: 0.8; }
    .heat-cell.pos { background: #4ade80cc; color: black; }
    .heat-cell.neg { background: #f87171cc; }
    .heat-cell.neutral { background: #2a2e4a; }
    
    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    
    /* Backtest */
    .backtest-controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .backtest-results { margin-top: 1rem; }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
    .result-item { background: #0f1222; padding: 12px; border-radius: 12px; text-align: center; }
    .result-item span { font-size: 0.7rem; color: #9ca3af; display: block; margin-bottom: 4px; }
    
    /* Profile */
    .profile-form { display: flex; flex-direction: column; gap: 1rem; max-width: 400px; }
    .profile-form label { font-size: 0.75rem; color: #9ca3af; }
    .profile-form input { background: #0f1222; border: 1px solid #2a2e4a; padding: 10px; border-radius: 12px; color: white; }
    
    .rules-textarea { width: 100%; background: #0f1222; border: 1px solid #2a2e4a; border-radius: 16px; padding: 1rem; color: white; font-family: monospace; margin-bottom: 1rem; }
    
    /* Lounge */
    .lounge-hero { text-align: center; background: linear-gradient(135deg, #1a1f3a, #0f1222); border-radius: 32px; padding: 2rem; margin-bottom: 2rem; border: 1px solid rgba(232,160,32,0.3); }
    .lounge-icon { font-size: 4rem; margin-bottom: 1rem; }
    .active-count { font-size: 1.2rem; font-weight: bold; color: #e8a020; margin: 1rem 0; }
    .upgrade-prompt { background: rgba(232,160,32,0.1); border-radius: 20px; padding: 1rem; margin-top: 1rem; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
    .feature-card { background: rgba(20,25,45,0.5); border-radius: 20px; padding: 1.5rem; text-align: center; border: 1px solid #2a2e4a; transition: all 0.2s; }
    .feature-card:hover { border-color: #e8a020; transform: translateY(-4px); }
    .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .feature-card h4 { margin-bottom: 0.5rem; color: #e8a020; }
    
    .you-row { background: rgba(232,160,32,0.1); }
    .you-badge { background: #e8a020; color: black; padding: 2px 8px; border-radius: 20px; font-size: 0.65rem; margin-left: 8px; font-weight: bold; }
    
    .toast { position: fixed; bottom: 20px; right: 20px; background: #1a1f3a; border-left: 4px solid #e8a020; padding: 12px 20px; border-radius: 12px; box-shadow: 0 4px 20px black; z-index: 1000; }
    .toast.error { border-left-color: #f87171; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.5rem; color: #e8a020; background: #070b14; }
    
    @media (max-width: 768px) { .sidebar { width: 80px; padding: 1rem; } .sidebar .sidebar-label, .sidebar .section-label, .upgrade-card { display: none; } .main-area { margin-left: 80px; } .search-bar { width: 180px; } .stats-grid { grid-template-columns: 1fr; } .chart-row { grid-template-columns: 1fr; } }
  `}</style>
);

const AppWithStyles = () => (<><GlobalStyle/><App/></>);
export default AppWithStyles;