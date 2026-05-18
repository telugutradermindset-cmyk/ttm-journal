import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

// ------------------------- API CONFIGURATION -------------------------
const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-2c4af.up.railway.app';

// ------------------------- HELPER FUNCTIONS -------------------------
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

// Session detection based on UTC hour (London = 8-17, New York = 13-22, Asia = rest)
const getSession = (dateStr) => {
  const d = new Date(dateStr);
  const hour = d.getUTCHours();
  if (hour >= 8 && hour < 17) return 'London';
  if (hour >= 13 && hour < 22) return 'New York';
  return 'Asia';
};

// Calculate max drawdown percentage from equity curve
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

// Generate calendar heatmap data for current month view
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

// ------------------------- NAVIGATION SIDEBAR -------------------------
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
    } catch (err) {
      showToast('Error loading trades', 'error');
    }
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

// ------------------------- DASHBOARD -------------------------
const Dashboard = ({ trades, user }) => {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const losses = trades.filter(t => t.outcome === 'loss').length;
  const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(1) : 0;
  
  const totalPnl = trades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
  const avgWin = wins ? trades.filter(t => t.outcome === 'win').reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0) / wins : 0;
  const avgLoss = losses ? Math.abs(trades.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0) / losses) : 0;
  const profitFactor = avgLoss ? (avgWin / avgLoss).toFixed(2) : '∞';
  
  let grossProfit = 0, grossLoss = 0;
  trades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    if (pnl > 0) grossProfit += pnl;
    else grossLoss += Math.abs(pnl);
  });
  const netProfitFactor = grossLoss ? (grossProfit / grossLoss).toFixed(2) : '∞';
  
  // Equity curve for chart
  const sortedTrades = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
  let equityCurve = [];
  let runningEquity = 0;
  sortedTrades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    runningEquity += pnl;
    equityCurve.push({ date: t.date.slice(0,10), equity: runningEquity });
  });
  const maxDrawdown = computeMaxDrawdown(equityCurve);

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Welcome back, {user.name}</h1>
        <p className="subtitle">Your performance at a glance</p>
      </div>
      
      <div className="stat-grid">
        <StatCard title="Total Trades" value={totalTrades} icon="📊" />
        <StatCard title="Win Rate" value={`${winRate}%`} icon="🎯" />
        <StatCard title="Total P&L" value={`$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? '#4ade80' : '#f87171'} icon="💰" />
        <StatCard title="Profit Factor" value={netProfitFactor} icon="⚡" />
        <StatCard title="Max Drawdown" value={`${maxDrawdown.toFixed(1)}%`} icon="📉" />
        <StatCard title="Avg Win/Loss" value={`$${avgWin.toFixed(2)} / $${avgLoss.toFixed(2)}`} icon="📏" />
      </div>

      {/* Equity Curve Chart */}
      {equityCurve.length > 0 && (
        <div className="card">
          <h3>📈 Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityCurve}>
              <CartesianGrid stroke="#2a2e4a" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#b0b8cc' }} />
              <YAxis tick={{ fill: '#b0b8cc' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
              <Area type="monotone" dataKey="equity" stroke="#e8a020" fill="url(#colorEquity)" />
              <defs><linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8a020" stopOpacity={0.8}/><stop offset="95%" stopColor="#e8a020" stopOpacity={0}/></linearGradient></defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="recent-trades">
        <h3>📋 Recent Trades</h3>
        <div className="table-wrapper">
          <table className="trade-table">
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

const StatCard = ({ title, value, color, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="value" style={{color}}>{value}</div>
    </div>
  </div>
);

// ------------------------- TRADE LOG (with Emotion + Rating) -------------------------
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
    } catch (err) {
      showToast('Error saving trade', 'error');
    }
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
    showToast('CSV exported successfully');
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

      <form onSubmit={handleSubmit} className="trade-form">
        <h3>{editingTrade ? '✏️ Edit Trade' : '➕ Log New Trade'}</h3>
        <div className="form-row">
          <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          <input placeholder="Pair" value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value })} required />
          <input type="number" step="any" placeholder="Entry Price" value={form.entryPrice} onChange={e => setForm({ ...form, entryPrice: e.target.value })} required />
          <input type="number" step="any" placeholder="Exit Price" value={form.exitPrice} onChange={e => setForm({ ...form, exitPrice: e.target.value })} required />
          <input type="number" step="any" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
          <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
            <option>long</option><option>short</option>
          </select>
          <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
            <option>win</option><option>loss</option><option>breakeven</option>
          </select>
          <input placeholder="Strategy (optional)" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} />
          <select value={form.emotion} onChange={e => setForm({ ...form, emotion: e.target.value })}>
            <option>calm</option><option>fearful</option><option>fomo</option><option>confident</option><option>frustrated</option>
          </select>
          <select value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}>
            {[1,2,3,4,5].map(r => <option key={r}>{r}⭐</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">{editingTrade ? 'Update Trade' : 'Save Trade'}</button>
          {editingTrade && <button type="button" onClick={() => setEditingTrade(null)} className="btn-secondary">Cancel</button>}
        </div>
      </form>

      <div className="table-wrapper">
        <table className="trade-table">
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
                  <td style={{color: pnl >=0 ? '#4ade80' : '#f87171', fontWeight: 'bold'}}>${pnl.toFixed(2)}</td>
                  <td><span className={`emotion-badge ${t.emotion || 'calm'}`}>{t.emotion || 'calm'}</span></td>
                  <td>{t.rating ? '⭐'.repeat(t.rating) : '-'}</td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingTrade(t); setForm({ ...t, date: t.date.slice(0, 16), entryPrice: t.entryPrice, exitPrice: t.exitPrice, quantity: t.quantity, rating: t.rating || 3 }); }}>✏️</button>
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

// ------------------------- ANALYTICS (Full Professional Dashboard) -------------------------
const Analytics = ({ trades }) => {
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarWeeks = getCalendarData(trades, viewYear, viewMonth);

  // Calculate core statistics
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const losses = trades.filter(t => t.outcome === 'loss').length;
  const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(1) : 0;
  const totalPnl = trades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
  const avgRR = trades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) / t.entryPrice * 100, 0) / (totalTrades || 1);
  
  // Win/Loss distribution for pie chart
  const outcomeData = [
    { name: 'Wins', value: wins, color: '#4ade80' },
    { name: 'Losses', value: losses, color: '#f87171' },
    { name: 'Breakeven', value: totalTrades - wins - losses, color: '#fbbf24' }
  ];
  
  // Session-based analytics
  const sessionStats = ['London', 'New York', 'Asia'].map(sess => {
    const sessionTrades = trades.filter(t => getSession(t.date) === sess);
    const sessionWins = sessionTrades.filter(t => t.outcome === 'win').length;
    const sessionPnl = sessionTrades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
    return {
      session: sess,
      count: sessionTrades.length,
      winRate: sessionTrades.length ? (sessionWins / sessionTrades.length * 100).toFixed(1) : 0,
      pnl: sessionPnl
    };
  });
  
  // Emotional distribution
  const emotions = ['calm', 'fearful', 'fomo', 'confident', 'frustrated'];
  const emotionColors = ['#4ade80', '#f87171', '#fbbf24', '#e8a020', '#a855f7'];
  const emotionData = emotions.map(e => ({ name: e, value: trades.filter(t => t.emotion === e).length }));
  
  // Equity curve and drawdown
  const sortedTrades = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
  let equityCurve = [];
  let runningEquity = 0;
  sortedTrades.forEach(t => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    runningEquity += pnl;
    equityCurve.push({ date: t.date.slice(0,10), equity: runningEquity });
  });
  
  const drawdownData = (() => {
    if (!equityCurve.length) return [];
    let peak = equityCurve[0].equity;
    return equityCurve.map(point => {
      if (point.equity > peak) peak = point.equity;
      const drawdown = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
      return { date: point.date, drawdown: drawdown.toFixed(2) };
    });
  })();
  
  // Pair performance
  const pairs = [...new Set(trades.map(t => t.pair))];
  const pairPerformance = pairs.map(pair => {
    const pairTrades = trades.filter(t => t.pair === pair);
    const pairWins = pairTrades.filter(t => t.outcome === 'win').length;
    const pairPnl = pairTrades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
    return { pair, count: pairTrades.length, winRate: pairTrades.length ? (pairWins / pairTrades.length * 100).toFixed(1) : 0, pnl: pairPnl };
  }).sort((a,b) => b.pnl - a.pnl);
  
  // Strategy performance
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))];
  const strategyPerformance = strategies.map(strategy => {
    const stratTrades = trades.filter(t => t.strategy === strategy);
    const stratWins = stratTrades.filter(t => t.outcome === 'win').length;
    const stratPnl = stratTrades.reduce((sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity, 0);
    return { strategy, count: stratTrades.length, winRate: stratTrades.length ? (stratWins / stratTrades.length * 100).toFixed(1) : 0, pnl: stratPnl };
  }).sort((a,b) => b.pnl - a.pnl);

  return (
    <div className="page">
      <h1>Analytics War Room</h1>
      
      {/* Stats Overview Row */}
      <div className="stat-grid-mini">
        <div className="mini-stat"><span>Total Trades</span><strong>{totalTrades}</strong></div>
        <div className="mini-stat"><span>Win Rate</span><strong>{winRate}%</strong></div>
        <div className="mini-stat"><span>Total P&L</span><strong style={{color: totalPnl >= 0 ? '#4ade80' : '#f87171'}}>${totalPnl.toFixed(2)}</strong></div>
        <div className="mini-stat"><span>Avg R:R</span><strong>{avgRR.toFixed(1)}%</strong></div>
      </div>
      
      {/* Calendar Heatmap */}
      <div className="card">
        <h3>📅 Daily P&L Heatmap</h3>
        <div className="heatmap-controls">
          <button onClick={() => setViewMonth(m => m === 0 ? (setViewYear(y => y-1), 11) : m-1)}>◀</button>
          <span>{new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setViewMonth(m => m === 11 ? (setViewYear(y => y+1), 0) : m+1)}>▶</button>
        </div>
        <div className="calendar-heatmap">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="weekday">{d}</div>)}
          {calendarWeeks.flat().map((day, idx) => (
            <div key={idx} className={`heat-cell ${day ? (day.pnl > 0 ? 'pos' : day.pnl < 0 ? 'neg' : 'neutral') : 'empty'}`}
                 style={day ? { backgroundColor: day.pnl > 0 ? `rgba(74,222,128,${Math.min(0.9, day.pnl/500)})` : day.pnl < 0 ? `rgba(248,113,113,${Math.min(0.9, Math.abs(day.pnl)/500)})` : '#2a2e4a' } : {}}>
              {day ? <><div className="heat-day">{day.day}</div><div className="heat-pnl">${day.pnl.toFixed(0)}</div></> : ''}
            </div>
          ))}
        </div>
      </div>
      
      {/* Charts Row 1 - Equity & Drawdown */}
      <div className="chart-row">
        <div className="card">
          <h3>📈 Equity Curve</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={equityCurve}>
              <CartesianGrid stroke="#2a2e4a" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#b0b8cc' }} />
              <YAxis tick={{ fill: '#b0b8cc' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
              <Area type="monotone" dataKey="equity" stroke="#e8a020" fill="url(#equityGrad)" />
              <defs><linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8a020" stopOpacity={0.6}/><stop offset="95%" stopColor="#e8a020" stopOpacity={0}/></linearGradient></defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>📉 Drawdown %</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={drawdownData}>
              <CartesianGrid stroke="#2a2e4a" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#b0b8cc' }} />
              <YAxis tick={{ fill: '#b0b8cc' }} domain={[0, 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
              <Area type="monotone" dataKey="drawdown" stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Charts Row 2 - Session & Emotion */}
      <div className="chart-row">
        <div className="card">
          <h3>🌍 Session Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sessionStats} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: '#b0b8cc' }} />
              <YAxis type="category" dataKey="session" tick={{ fill: '#b0b8cc' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
              <Bar dataKey="pnl" fill="#e8a020" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>😌 Emotional Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={emotionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {emotionData.map((entry, index) => <Cell key={`cell-${index}`} fill={emotionColors[index % emotionColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Win/Loss Distribution */}
      <div className="chart-row-single">
        <div className="card">
          <h3>🎯 Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {outcomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #e8a020' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Pair Performance Table */}
      {pairPerformance.length > 0 && (
        <div className="card">
          <h3>📊 Pair Performance</h3>
          <div className="table-wrapper">
            <table className="performance-table">
              <thead><tr><th>Pair</th><th>Trades</th><th>Win Rate</th><th>P&L</th></tr></thead>
              <tbody>
                {pairPerformance.map(p => (
                  <tr key={p.pair}><td>{p.pair}</td><td>{p.count}</td><td>{p.winRate}%</td><td style={{color: p.pnl >= 0 ? '#4ade80' : '#f87171'}}>${p.pnl.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Strategy Performance Table */}
      {strategyPerformance.length > 0 && (
        <div className="card">
          <h3>⚡ Strategy Performance</h3>
          <div className="table-wrapper">
            <table className="performance-table">
              <thead><tr><th>Strategy</th><th>Trades</th><th>Win Rate</th><th>P&L</th></tr></thead>
              <tbody>
                {strategyPerformance.map(s => (
                  <tr key={s.strategy}><td>{s.strategy}</td><td>{s.count}</td><td>{s.winRate}%</td><td style={{color: s.pnl >= 0 ? '#4ade80' : '#f87171'}}>${s.pnl.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------- BACKTEST (Monte Carlo Simulation) -------------------------
const Backtest = ({ trades }) => {
  const [params, setParams] = useState({ strategy: '', numSims: 200 });
  const [results, setResults] = useState(null);
  
  const runMonteCarlo = () => {
    const strategyTrades = params.strategy ? trades.filter(t => t.strategy === params.strategy) : trades;
    if (strategyTrades.length < 5) { alert('Need at least 5 trades for meaningful backtest'); return; }
    const pnls = strategyTrades.map(t => (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity);
    const sims = [];
    for (let i = 0; i < params.numSims; i++) {
      let total = 0;
      for (let j = 0; j < strategyTrades.length; j++) total += pnls[Math.floor(Math.random() * pnls.length)];
      sims.push(total);
    }
    sims.sort((a,b) => a - b);
    setResults({
      median: sims[Math.floor(sims.length / 2)],
      p10: sims[Math.floor(sims.length * 0.1)],
      p90: sims[Math.floor(sims.length * 0.9)],
      profitable: sims.filter(s => s > 0).length / sims.length * 100,
      best: Math.max(...sims),
      worst: Math.min(...sims)
    });
  };
  
  return (
    <div className="page">
      <h1>Backtesting Lab</h1>
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
            <h3>Simulation Results ({params.numSims} iterations)</h3>
            <div className="results-grid">
              <div className="result-item"><span>Median P&L:</span><strong>${results.median.toFixed(2)}</strong></div>
              <div className="result-item"><span>10th Percentile:</span><strong>${results.p10.toFixed(2)}</strong></div>
              <div className="result-item"><span>90th Percentile:</span><strong>${results.p90.toFixed(2)}</strong></div>
              <div className="result-item"><span>Best Case:</span><strong style={{color: '#4ade80'}}>${results.best.toFixed(2)}</strong></div>
              <div className="result-item"><span>Worst Case:</span><strong style={{color: '#f87171'}}>${results.worst.toFixed(2)}</strong></div>
              <div className="result-item"><span>Profitable Sims:</span><strong>{results.profitable.toFixed(1)}%</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------- RULES PAGE -------------------------
const Rules = ({ user, showToast }) => {
  const [rules, setRules] = useState(user.tradingRules || '');
  const saveRules = async () => {
    await fetchWithAuth('/api/user/profile', { method: 'PUT', body: JSON.stringify({ tradingRules: rules }) });
    showToast('Trading rules saved');
  };
  return (
    <div className="page">
      <h1>Trading Rules</h1>
      <div className="card">
        <textarea value={rules} onChange={e => setRules(e.target.value)} rows={12} className="rules-textarea" placeholder="Write your trading rules here...&#10;&#10;Example:&#10;- Always use stop loss&#10;- Risk 1% per trade&#10;- Only trade during London/NY overlap" />
        <button className="btn-primary" onClick={saveRules}>Save Rules</button>
      </div>
    </div>
  );
};

// ------------------------- PROFILE PAGE -------------------------
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
    setOldPwd('');
    setNewPwd('');
  };
  
  return (
    <div className="page">
      <h1>Profile Settings</h1>
      <div className="card">
        <h3>Account Information</h3>
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

// ------------------------- GLOBAL STYLES -------------------------
const GlobalStyle = () => (
  <style>{`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0c15; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; color: #e0e4f0; }
    
    /* War Room Background */
    .war-room { display: flex; min-height: 100vh; background: radial-gradient(circle at 20% 30%, #0f1222, #05070c); position: relative; }
    .war-room::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: repeating-linear-gradient(0deg, rgba(0,255,0,0.02) 0px, rgba(0,255,0,0.02) 1px, transparent 1px, transparent 4px); pointer-events: none; z-index: 0; }
    
    /* Sidebar */
    .sidebar { width: 260px; background: rgba(10,14,30,0.85); backdrop-filter: blur(12px); border-right: 1px solid rgba(232,160,32,0.3); padding: 2rem 1rem; position: fixed; height: 100vh; z-index: 2; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #e8a020; margin-bottom: 2rem; text-shadow: 0 0 5px #e8a020; letter-spacing: 2px; }
    .logo span { color: white; font-weight: normal; font-size: 0.8rem; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin: 6px 0; color: #b0b8cc; text-decoration: none; border-radius: 8px; transition: all 0.2s ease; }
    .nav-item.active { background: rgba(232,160,32,0.15); color: #e8a020; border-left: 3px solid #e8a020; }
    .nav-item:hover { background: rgba(232,160,32,0.08); color: #fff; }
    .logout-btn { margin-top: 3rem; width: 100%; background: rgba(248,113,113,0.15); border: 1px solid #f87171; color: #f87171; padding: 10px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .logout-btn:hover { background: rgba(248,113,113,0.25); }
    
    /* Main Content */
    .main-content { margin-left: 260px; flex: 1; padding: 2rem; z-index: 1; }
    .page { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; color: #e8a020; }
    .subtitle { color: #b0b8cc; margin-bottom: 1.5rem; }
    
    /* Stats Cards */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
    .stat-card { background: rgba(26,31,58,0.7); backdrop-filter: blur(4px); border-radius: 16px; padding: 20px; border: 1px solid rgba(232,160,32,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 16px; transition: transform 0.2s, border-color 0.2s; }
    .stat-card:hover { border-color: rgba(232,160,32,0.6); transform: translateY(-2px); }
    .stat-icon { font-size: 2rem; }
    .stat-content { flex: 1; }
    .stat-card h3 { font-size: 0.85rem; color: #b0b8cc; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 1.75rem; font-weight: bold; font-family: monospace; }
    
    .stat-grid-mini { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .mini-stat { background: rgba(26,31,58,0.5); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(232,160,32,0.2); }
    .mini-stat span { font-size: 0.8rem; color: #b0b8cc; display: block; margin-bottom: 8px; }
    .mini-stat strong { font-size: 1.5rem; font-weight: bold; font-family: monospace; }
    
    /* Cards */
    .card { background: rgba(26,31,58,0.6); backdrop-filter: blur(4px); border-radius: 16px; padding: 24px; border: 1px solid rgba(232,160,32,0.25); margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    .card h3 { margin-bottom: 20px; font-size: 1.2rem; color: #e8a020; display: flex; align-items: center; gap: 8px; }
    
    /* Tables */
    .table-wrapper { overflow-x: auto; border-radius: 12px; }
    .trade-table, .performance-table { width: 100%; border-collapse: collapse; background: #1a1f3a; border-radius: 12px; overflow: hidden; }
    .trade-table th, .trade-table td, .performance-table th, .performance-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #2a2e4a; }
    .trade-table th, .performance-table th { background: rgba(232,160,32,0.1); color: #e8a020; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .trade-table tr:hover, .performance-table tr:hover { background: rgba(232,160,32,0.05); }
    
    /* Badges */
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; display: inline-block; }
    .badge.long { background: #4ade8020; color: #4ade80; border: 1px solid #4ade80; }
    .badge.short { background: #f8717120; color: #f87171; border: 1px solid #f87171; }
    .badge.win { background: #4ade8020; color: #4ade80; }
    .badge.loss { background: #f8717120; color: #f87171; }
    
    .emotion-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; }
    .emotion-badge.calm { background: #4ade8020; color: #4ade80; }
    .emotion-badge.fearful { background: #f8717120; color: #f87171; }
    .emotion-badge.fomo { background: #fbbf2420; color: #fbbf24; }
    .emotion-badge.confident { background: #e8a02020; color: #e8a020; }
    .emotion-badge.frustrated { background: #a855f720; color: #a855f7; }
    
    /* Forms */
    .trade-form { background: rgba(26,31,58,0.6); border-radius: 16px; padding: 24px; margin-bottom: 30px; border: 1px solid rgba(232,160,32,0.25); }
    .trade-form h3 { margin-bottom: 20px; color: #e8a020; }
    .form-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .form-row input, .form-row select { background: #0f1222; border: 1px solid #2a2e4a; padding: 12px; border-radius: 8px; color: white; flex: 1 0 150px; transition: border-color 0.2s; }
    .form-row input:focus, .form-row select:focus { outline: none; border-color: #e8a020; }
    .form-actions { display: flex; gap: 12px; }
    
    /* Buttons */
    .btn-primary { background: linear-gradient(135deg, #e8a020 0%, #c47a10 100%); border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(232,160,32,0.3); }
    .btn-secondary { background: #2a2e4a; border: none; padding: 12px 24px; border-radius: 8px; color: white; cursor: pointer; transition: background 0.2s; }
    .btn-secondary:hover { background: #3a3e5a; }
    .icon-btn { background: none; border: none; color: #b0b8cc; cursor: pointer; font-size: 1.2rem; margin: 0 4px; transition: color 0.2s; }
    .icon-btn:hover { color: #e8a020; }
    .icon-btn.delete:hover { color: #f87171; }
    
    /* Filters */
    .filters-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .filters-bar select { background: #0f1222; border: 1px solid #2a2e4a; padding: 10px 16px; border-radius: 8px; color: white; cursor: pointer; }
    
    /* Calendar Heatmap */
    .heatmap-controls { display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; }
    .heatmap-controls button { background: #2a2e4a; border: none; padding: 6px 16px; border-radius: 6px; color: #e8a020; cursor: pointer; font-size: 1rem; }
    .calendar-heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 10px; }
    .weekday { font-weight: bold; text-align: center; padding: 8px; color: #e8a020; font-size: 0.75rem; text-transform: uppercase; }
    .heat-cell { background: #1e2340; padding: 8px 4px; text-align: center; border-radius: 8px; font-size: 0.7rem; cursor: default; color: white; transition: transform 0.1s ease; min-height: 55px; display: flex; flex-direction: column; justify-content: center; }
    .heat-cell .heat-day { font-weight: bold; font-size: 0.8rem; }
    .heat-cell .heat-pnl { font-size: 0.65rem; opacity: 0.8; }
    .heat-cell.pos { background-color: #4ade80cc; color: #0a0c15; }
    .heat-cell.neg { background-color: #f87171cc; color: white; }
    .heat-cell.neutral { background-color: #2a2e4a; }
    .heat-cell.empty { background: rgba(26,31,58,0.4); }
    
    /* Charts */
    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .chart-row-single { display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 24px; }
    
    /* Backtest */
    .backtest-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
    .backtest-controls input { background: #0f1222; border: 1px solid #2a2e4a; padding: 10px; border-radius: 8px; color: white; width: 120px; }
    .backtest-results { margin-top: 20px; padding-top: 20px; border-top: 1px solid #2a2e4a; }
    .backtest-results h3 { margin-bottom: 16px; }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .result-item { background: #0f1222; padding: 12px; border-radius: 8px; }
    .result-item span { font-size: 0.7rem; color: #b0b8cc; display: block; margin-bottom: 4px; text-transform: uppercase; }
    .result-item strong { font-size: 1rem; font-family: monospace; }
    
    /* Profile */
    .profile-form { display: flex; flex-direction: column; gap: 16px; max-width: 400px; }
    .profile-form label { font-size: 0.8rem; color: #b0b8cc; margin-bottom: -8px; }
    .profile-form input { background: #0f1222; border: 1px solid #2a2e4a; padding: 12px; border-radius: 8px; color: white; }
    .profile-form input:disabled { opacity: 0.5; }
    
    /* Rules */
    .rules-textarea { width: 100%; background: #0f1222; border: 1px solid #2a2e4a; color: white; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 0.9rem; margin-bottom: 16px; }
    .rules-textarea:focus { outline: none; border-color: #e8a020; }
    
    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; background: #1a1f3a; border-left: 4px solid #e8a020; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 1000; font-size: 0.9rem; animation: slideIn 0.3s ease; }
    .toast.error { border-left-color: #f87171; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.5rem; color: #e8a020; background: #0a0c15; }
    
    /* Responsive */
    @media (max-width: 1024px) { .chart-row { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2, 1fr); } .stat-grid-mini { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .sidebar { width: 80px; } .sidebar .logo span, .sidebar .nav-item span:last-child { display: none; } .main-content { margin-left: 80px; padding: 1rem; } .stat-grid { grid-template-columns: 1fr; } .calendar-heatmap { gap: 4px; } .heat-cell { font-size: 0.6rem; padding: 4px 2px; min-height: 40px; } }
    @media (max-width: 480px) { .stat-grid-mini { grid-template-columns: 1fr; } }
  `}</style>
);

const AppWithStyles = () => (<><GlobalStyle/><App/></>);
export default AppWithStyles;