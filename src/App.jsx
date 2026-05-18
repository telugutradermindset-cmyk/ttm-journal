import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-2c4af.up.railway.app';

// Helper functions
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

// ------------------------- LOGIN PAGE -------------------------
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>TTM Journal</h1>
        <h2>Login to your account</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
};

// ------------------------- SIGNUP PAGE -------------------------
const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>TTM Journal</h1>
        <h2>Create an account</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

// ------------------------- SIDEBAR (Professional) -------------------------
const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <div className="sidebar">
      <div className="logo">📈 TTM<span>Journal</span></div>
      <div className="sidebar-section">
        <div className="section-label">Trading</div>
        <SidebarItem to="/" label="Dashboard" active={isActive('/')} />
        <SidebarItem to="/trades" label="Trade Log" active={isActive('/trades')} />
        <SidebarItem to="/analytics" label="Analytics" active={isActive('/analytics')} />
        <SidebarItem to="/backtest" label="Backtesting" active={isActive('/backtest')} />
      </div>
      <div className="sidebar-section">
        <div className="section-label">Tools</div>
        <SidebarItem to="/rules" label="Trading Rules" active={isActive('/rules')} />
        <SidebarItem to="/profile" label="Profile" active={isActive('/profile')} />
      </div>
      <div className="sidebar-section">
        <div className="section-label">Community</div>
        <SidebarItem to="/lounge" label="Traders Lounge" active={isActive('/lounge')} />
        <SidebarItem to="/leaderboard" label="Leaderboard" active={isActive('/leaderboard')} />
      </div>
      <div className="upgrade-card">
        <div className="upgrade-icon">🚀</div>
        <div className="upgrade-title">Upgrade to Pro</div>
        <div className="upgrade-desc">Unlock AI reports & traders lounge</div>
        <button className="upgrade-btn" onClick={() => alert('Stripe coming soon!')}>Upgrade</button>
      </div>
      <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>Logout</button>
    </div>
  );
};

const SidebarItem = ({ to, label, active }) => (
  <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>{label}</Link>
);

// ------------------------- TOP BAR -------------------------
const TopBar = ({ user }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="top-bar">
      <div className="date-time">{time.toLocaleDateString()} {time.toLocaleTimeString()}</div>
      <div className="user-info">
        <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
        <span>{user?.name?.split(' ')[0] || 'Trader'}</span>
      </div>
    </div>
  );
};

// ------------------------- PROTECTED DASHBOARD (App) -------------------------
const DashboardApp = () => {
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
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/backtest" element={<Backtest />} />
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

// ------------------------- DASHBOARD (Stats + Recent Trades) -------------------------
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
  return (
    <div>
      <h1>Welcome back, {user.name}</h1>
      <div className="stats">
        <div><strong>Total Trades</strong><br/>{totalTrades}</div>
        <div><strong>Win Rate</strong><br/>{winRate}%</div>
        <div><strong>Total P&L</strong><br/>${totalPnl.toFixed(2)}</div>
        <div><strong>Profit Factor</strong><br/>{profitFactor}</div>
      </div>
      <h3>Recent Trades</h3>
      <table className="trade-table">
        <thead><tr><th>Date</th><th>Pair</th><th>Direction</th><th>Outcome</th><th>P&L</th></tr></thead>
        <tbody>
          {trades.slice(0,5).map(t => {
            const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
            return (<tr key={t._id}>
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>{t.pair}</td>
              <td>{t.direction}</td>
              <td>{t.outcome}</td>
              <td>${pnl.toFixed(2)}</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  );
};

// ------------------------- TRADE LOG (Full functionality) -------------------------
const TradeLog = ({ trades, loadTrades, showToast }) => {
  const [editingTrade, setEditingTrade] = useState(null);
  const [form, setForm] = useState({ pair:'EURUSD', entryPrice:'', exitPrice:'', quantity:'1', direction:'long', outcome:'win', strategy:'', date:new Date().toISOString().slice(0,16) });
  const [filters, setFilters] = useState({ pair:'', outcome:'', strategy:'' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, entryPrice: parseFloat(form.entryPrice), exitPrice: parseFloat(form.exitPrice), quantity: parseFloat(form.quantity) };
    try {
      if (editingTrade) await fetchWithAuth(`/api/trades/${editingTrade._id}`, { method:'PUT', body: JSON.stringify(payload) });
      else await fetchWithAuth('/api/trades', { method:'POST', body: JSON.stringify(payload) });
      showToast(editingTrade ? 'Trade updated' : 'Trade added');
      loadTrades();
      setEditingTrade(null);
      setForm({ pair:'EURUSD', entryPrice:'', exitPrice:'', quantity:'1', direction:'long', outcome:'win', strategy:'', date:new Date().toISOString().slice(0,16) });
    } catch(err) { showToast('Error saving trade','error'); }
  };

  const handleDelete = async (id) => { if(window.confirm('Delete?')) { await fetchWithAuth(`/api/trades/${id}`, { method:'DELETE' }); loadTrades(); showToast('Deleted'); } };

  const filteredTrades = trades.filter(t => (!filters.pair || t.pair===filters.pair) && (!filters.outcome || t.outcome===filters.outcome) && (!filters.strategy || t.strategy===filters.strategy));

  const exportCSV = () => {
    const headers = ['Date','Pair','Direction','Entry','Exit','Quantity','Outcome','Strategy','P&L'];
    const rows = filteredTrades.map(t => [t.date, t.pair, t.direction, t.entryPrice, t.exitPrice, t.quantity, t.outcome, t.strategy||'', ((t.exitPrice-t.entryPrice)*(t.direction==='long'?1:-1)*t.quantity).toFixed(2)]);
    const csv = [headers,...rows].map(row=>row.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`trades_${new Date().toISOString()}.csv`; a.click();
    showToast('CSV exported');
  };

  return (
    <div>
      <h1>Trade Log</h1>
      <div className="filters">
        <select onChange={e=>setFilters({...filters,pair:e.target.value})}><option value="">All pairs</option>{[...new Set(trades.map(t=>t.pair))].map(p=><option key={p}>{p}</option>)}</select>
        <select onChange={e=>setFilters({...filters,outcome:e.target.value})}><option value="">All outcomes</option><option>win</option><option>loss</option><option>breakeven</option></select>
        <select onChange={e=>setFilters({...filters,strategy:e.target.value})}><option value="">All strategies</option>{[...new Set(trades.map(t=>t.strategy).filter(Boolean))].map(s=><option key={s}>{s}</option>)}</select>
        <button onClick={exportCSV}>Export CSV</button>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="datetime-local" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required />
        <input placeholder="Pair" value={form.pair} onChange={e=>setForm({...form,pair:e.target.value})} required />
        <input type="number" step="any" placeholder="Entry" value={form.entryPrice} onChange={e=>setForm({...form,entryPrice:e.target.value})} required />
        <input type="number" step="any" placeholder="Exit" value={form.exitPrice} onChange={e=>setForm({...form,exitPrice:e.target.value})} required />
        <input type="number" step="any" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} required />
        <select value={form.direction} onChange={e=>setForm({...form,direction:e.target.value})}><option>long</option><option>short</option></select>
        <select value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})}><option>win</option><option>loss</option><option>breakeven</option></select>
        <input placeholder="Strategy" value={form.strategy} onChange={e=>setForm({...form,strategy:e.target.value})} />
        <button type="submit">{editingTrade?'Update':'Save Trade'}</button>
        {editingTrade && <button onClick={()=>setEditingTrade(null)}>Cancel</button>}
      </form>
      <table className="trade-table">
        <thead><tr><th>Date</th><th>Pair</th><th>Dir</th><th>Entry/Exit</th><th>Qty</th><th>Outcome</th><th>P&L</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredTrades.map(t => {
            const pnl = (t.exitPrice-t.entryPrice)*(t.direction==='long'?1:-1)*t.quantity;
            return (<tr key={t._id}>
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>{t.pair}</td>
              <td>{t.direction}</td>
              <td>{t.entryPrice}/{t.exitPrice}</td>
              <td>{t.quantity}</td>
              <td>{t.outcome}</td>
              <td>${pnl.toFixed(2)}</td>
              <td><button onClick={()=>{setEditingTrade(t); setForm({...t, date:t.date.slice(0,16), entryPrice:t.entryPrice, exitPrice:t.exitPrice, quantity:t.quantity});}}>✏️</button> <button onClick={()=>handleDelete(t._id)}>🗑️</button></td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
  );
};

// Placeholder components
const Analytics = () => <div><h1>Analytics</h1><p>Charts coming soon.</p></div>;
const Backtest = () => <div><h1>Backtesting</h1><p>Monte Carlo coming soon.</p></div>;
const Rules = ({ user, showToast }) => {
  const [rules, setRules] = useState(user.tradingRules || '');
  const save = async () => { await fetchWithAuth('/api/user/profile', { method:'PUT', body: JSON.stringify({ tradingRules: rules }) }); showToast('Rules saved'); };
  return <div><h1>Trading Rules</h1><textarea value={rules} onChange={e=>setRules(e.target.value)} rows={10} /><button onClick={save}>Save</button></div>;
};
const Profile = ({ user, showToast }) => {
  const [name, setName] = useState(user.name);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const updateProfile = async () => { await fetchWithAuth('/api/user/profile', { method:'PUT', body: JSON.stringify({ name }) }); showToast('Profile updated'); };
  const changePassword = async () => { await fetchWithAuth('/api/user/change-password', { method:'POST', body: JSON.stringify({ oldPassword:oldPwd, newPassword:newPwd }) }); showToast('Password changed'); setOldPwd(''); setNewPwd(''); };
  return <div><h1>Profile</h1><input value={name} onChange={e=>setName(e.target.value)}/><button onClick={updateProfile}>Update Name</button><hr/><input type="password" placeholder="Old password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)}/><input type="password" placeholder="New password" value={newPwd} onChange={e=>setNewPwd(e.target.value)}/><button onClick={changePassword}>Change Password</button></div>;
};
const Lounge = () => <div><h1>Traders Lounge</h1><p>Upgrade to Pro to join the community.</p></div>;
const Leaderboard = ({ trades }) => <div><h1>Leaderboard</h1><p>Top traders will appear here.</p></div>;

// ------------------------- MAIN APP WITH ROUTES -------------------------
const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={<DashboardApp />} />
    </Routes>
  );
};

// ------------------------- GLOBAL STYLES (Professional Dark Theme) -------------------------
const GlobalStyle = () => (
  <style>{`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0c15; font-family: 'Inter', sans-serif; color: #e0e4f0; }
    /* Auth pages */
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: radial-gradient(circle at 20% 30%, #0f1222, #05070c); }
    .auth-card { background: rgba(26,31,58,0.9); backdrop-filter: blur(12px); padding: 2rem; border-radius: 24px; width: 400px; text-align: center; border: 1px solid rgba(232,160,32,0.3); }
    .auth-card h1 { color: #e8a020; margin-bottom: 0.5rem; }
    .auth-card h2 { font-size: 1.2rem; margin-bottom: 1.5rem; color: #b0b8cc; }
    .auth-card input { width: 100%; padding: 12px; margin: 8px 0; background: #0f1222; border: 1px solid #2a2e4a; border-radius: 8px; color: white; }
    .auth-card button { width: 100%; padding: 12px; background: #e8a020; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 8px; }
    .auth-card .error { color: #f87171; margin-bottom: 1rem; }
    .auth-card p { margin-top: 1rem; color: #b0b8cc; }
    .auth-card a { color: #e8a020; text-decoration: none; }
    /* Protected app */
    .app { display: flex; min-height: 100vh; background: radial-gradient(ellipse at 20% 30%, #0f1422, #05080f); }
    .sidebar { width: 260px; background: rgba(8,12,22,0.95); backdrop-filter: blur(12px); border-right: 1px solid rgba(232,160,32,0.3); padding: 1.5rem; position: fixed; height: 100vh; overflow-y: auto; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #e8a020; margin-bottom: 2rem; }
    .sidebar-section { margin-bottom: 1.5rem; }
    .section-label { font-size: 0.7rem; text-transform: uppercase; color: #7c85a0; margin-bottom: 0.5rem; letter-spacing: 1px; }
    .sidebar-item { display: block; padding: 8px 12px; margin: 4px 0; border-radius: 8px; color: #b8c0dc; text-decoration: none; transition: 0.2s; }
    .sidebar-item.active { background: rgba(232,160,32,0.15); color: #e8a020; border-left: 2px solid #e8a020; }
    .sidebar-item:hover { background: rgba(232,160,32,0.1); color: white; }
    .upgrade-card { background: linear-gradient(135deg, rgba(232,160,32,0.2), rgba(200,100,20,0.05)); border-radius: 12px; padding: 1rem; text-align: center; margin: 1rem 0; border: 1px solid rgba(232,160,32,0.4); }
    .upgrade-icon { font-size: 1.8rem; margin-bottom: 4px; }
    .upgrade-title { font-weight: bold; color: #e8a020; margin-bottom: 4px; }
    .upgrade-desc { font-size: 0.7rem; color: #9ca3af; margin-bottom: 8px; }
    .upgrade-btn { background: #e8a020; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer; width: 100%; }
    .logout-btn { width: 100%; background: rgba(248,113,113,0.2); border: 1px solid #f87171; color: #f87171; padding: 10px; border-radius: 8px; cursor: pointer; margin-top: 1rem; }
    .main-area { margin-left: 260px; flex: 1; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: rgba(8,12,22,0.6); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(232,160,32,0.2); }
    .date-time { font-size: 0.85rem; color: #b0b8cc; }
    .user-info { display: flex; align-items: center; gap: 8px; }
    .user-avatar { width: 32px; height: 32px; background: #e8a020; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: black; font-weight: bold; }
    .page-content { padding: 2rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 1rem; margin: 1rem 0; }
    .stats > div { background: #1a1f3a; padding: 1rem; border-radius: 12px; border: 1px solid #e8a02040; text-align: center; }
    .trade-table { width: 100%; border-collapse: collapse; background: #1a1f3a; border-radius: 12px; overflow: hidden; margin-top: 1rem; }
    .trade-table th, .trade-table td { padding: 10px; text-align: left; border-bottom: 1px solid #2a2e4a; }
    .filters { display: flex; gap: 10px; margin-bottom: 1rem; flex-wrap: wrap; }
    form { background: #1a1f3a; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    input, select, button { background: #0f1222; border: 1px solid #2a2e4a; padding: 8px 12px; border-radius: 8px; color: white; }
    button { background: #e8a020; color: black; cursor: pointer; border: none; font-weight: bold; }
    textarea { width: 100%; background: #0f1222; border: 1px solid #2a2e4a; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .toast { position: fixed; bottom: 20px; right: 20px; background: #1a1f3a; border-left: 4px solid #e8a020; padding: 12px 20px; border-radius: 8px; z-index: 1000; }
    .toast.error { border-left-color: #f87171; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.5rem; color: #e8a020; background: #0a0c15; }
    @media (max-width: 768px) { .sidebar { width: 80px; padding: 1rem; } .sidebar .sidebar-label, .sidebar .section-label, .upgrade-card { display: none; } .main-area { margin-left: 80px; } }
  `}</style>
);

const AppWithStyles = () => (<><GlobalStyle/><App/></>);
export default AppWithStyles;