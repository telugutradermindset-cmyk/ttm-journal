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

// ==================== LOGIN PAGE ====================
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">📈 TTM Journal</div>
        <h2>Login to your account</h2>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

// ==================== SIGNUP PAGE ====================
const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">📈 TTM Journal</div>
        <h2>Create an account</h2>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

// ==================== SIDEBAR ITEM ====================
const SidebarItem = ({ to, label, active }) => (
  <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
    {label}
  </Link>
);

// ==================== SIDEBAR ====================
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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

      <div className="upgrade-card">
        <div className="upgrade-icon">🚀</div>
        <div className="upgrade-title">Upgrade to Pro</div>
        <div className="upgrade-desc">Unlock advanced features</div>
        <button className="upgrade-btn">Upgrade Now</button>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        🚪 Logout
      </button>
    </div>
  );
};

// ==================== TOAST NOTIFICATION ====================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' && '✓'} {type === 'error' && '✕'} {message}
    </div>
  );
};

// ==================== DASHBOARD PAGE ====================
const Dashboard = ({ trades, user }) => {
  const stats = {
    totalTrades: trades.length,
    wins: trades.filter((t) => t.outcome === 'win').length,
    losses: trades.filter((t) => t.outcome === 'loss').length,
    winRate: trades.length > 0 ? ((trades.filter((t) => t.outcome === 'win').length / trades.length) * 100).toFixed(1) : 0,
    totalPnL: trades.reduce((sum, t) => sum + ((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity), 0),
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="welcome-banner">
        Welcome back, <strong>{user.name}</strong>! 👋
      </div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{stats.totalTrades}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value" style={{ color: stats.winRate >= 50 ? '#4ade80' : '#f87171' }}>
            {stats.winRate}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Wins / Losses</div>
          <div className="stat-value">
            <span style={{ color: '#4ade80' }}>{stats.wins}</span> / <span style={{ color: '#f87171' }}>{stats.losses}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total P&L</div>
          <div className="stat-value" style={{ color: stats.totalPnL >= 0 ? '#4ade80' : '#f87171' }}>
            ${stats.totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Recent Trades</h2>
      {trades.length > 0 ? (
        <table className="trade-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pair</th>
              <th>Dir</th>
              <th>Entry/Exit</th>
              <th>Qty</th>
              <th>Outcome</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(-5).map((t) => {
              const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
              return (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.pair}</td>
                  <td>{t.direction}</td>
                  <td>{t.entryPrice.toFixed(5)}/{t.exitPrice.toFixed(5)}</td>
                  <td>{t.quantity}</td>
                  <td>
                    <span className={`badge badge-${t.outcome}`}>{t.outcome}</span>
                  </td>
                  <td style={{ color: pnl >= 0 ? '#4ade80' : '#f87171' }}>${pnl.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#b0b8cc', marginTop: '1rem' }}>No trades logged yet. Start logging trades to see them here!</p>
      )}
    </div>
  );
};

// ==================== TRADE LOG PAGE ====================
const TradeLog = ({ trades, setTrades, showToast }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    pair: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    direction: 'long',
    outcome: 'win',
    strategy: '',
  });
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState({ pair: '', outcome: '', strategy: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        entryPrice: parseFloat(form.entryPrice),
        exitPrice: parseFloat(form.exitPrice),
        quantity: parseFloat(form.quantity),
      };

      if (editingTrade) {
        await fetchWithAuth(`/api/trades/${editingTrade._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setTrades(trades.map((t) => (t._id === editingTrade._id ? { ...t, ...payload } : t)));
        showToast('Trade updated successfully!', 'success');
        setEditingTrade(null);
      } else {
        const newTrade = await fetchWithAuth('/api/trades', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setTrades([...trades, newTrade]);
        showToast('Trade logged successfully!', 'success');
      }

      setForm({
        date: new Date().toISOString().slice(0, 16),
        pair: '',
        entryPrice: '',
        exitPrice: '',
        quantity: '',
        direction: 'long',
        outcome: 'win',
        strategy: '',
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await fetchWithAuth(`/api/trades/${id}`, { method: 'DELETE' });
      setTrades(trades.filter((t) => t._id !== id));
      showToast('Trade deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredTrades = trades.filter((t) => {
    if (filters.pair && t.pair !== filters.pair) return false;
    if (filters.outcome && t.outcome !== filters.outcome) return false;
    if (filters.strategy && t.strategy !== filters.strategy) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Pair', 'Direction', 'Entry Price', 'Exit Price', 'Quantity', 'Outcome', 'Strategy', 'P&L'];
    const rows = filteredTrades.map((t) => {
      const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
      return [
        new Date(t.date).toLocaleDateString(),
        t.pair,
        t.direction,
        t.entryPrice.toFixed(5),
        t.exitPrice.toFixed(5),
        t.quantity,
        t.outcome,
        t.strategy,
        pnl.toFixed(2),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV exported!', 'success');
  };

  return (
    <div>
      <h1>{editingTrade ? '✏️ Edit Trade' : '📝 Log New Trade'}</h1>

      <div className="filters">
        <select value={filters.pair} onChange={(e) => setFilters({ ...filters, pair: e.target.value })}>
          <option value="">All pairs</option>
          {[...new Set(trades.map((t) => t.pair))].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select value={filters.outcome} onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}>
          <option value="">All outcomes</option>
          <option>win</option>
          <option>loss</option>
          <option>breakeven</option>
        </select>
        <select value={filters.strategy} onChange={(e) => setFilters({ ...filters, strategy: e.target.value })}>
          <option value="">All strategies</option>
          {[...new Set(trades.map((t) => t.strategy).filter(Boolean))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button onClick={exportCSV} style={{ marginLeft: 'auto' }}>
          📥 Export CSV
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <input
          placeholder="Pair (e.g., EURUSD)"
          value={form.pair}
          onChange={(e) => setForm({ ...form, pair: e.target.value.toUpperCase() })}
          required
        />
        <input
          type="number"
          step="any"
          placeholder="Entry Price"
          value={form.entryPrice}
          onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
          required
        />
        <input
          type="number"
          step="any"
          placeholder="Exit Price"
          value={form.exitPrice}
          onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
          required
        />
        <input
          type="number"
          step="any"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
          <option>long</option>
          <option>short</option>
        </select>
        <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
          <option>win</option>
          <option>loss</option>
          <option>breakeven</option>
        </select>
        <input
          placeholder="Strategy (optional)"
          value={form.strategy}
          onChange={(e) => setForm({ ...form, strategy: e.target.value })}
        />
        <button type="submit">{editingTrade ? '✏️ Update Trade' : '💾 Save Trade'}</button>
        {editingTrade && <button type="button" onClick={() => setEditingTrade(null)}>Cancel</button>}
      </form>

      <h2>Trade History</h2>
      {filteredTrades.length > 0 ? (
        <table className="trade-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pair</th>
              <th>Dir</th>
              <th>Entry/Exit</th>
              <th>Qty</th>
              <th>Outcome</th>
              <th>P&L</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map((t) => {
              const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
              return (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.pair}</td>
                  <td>{t.direction}</td>
                  <td>{t.entryPrice.toFixed(5)}/{t.exitPrice.toFixed(5)}</td>
                  <td>{t.quantity}</td>
                  <td>
                    <span className={`badge badge-${t.outcome}`}>{t.outcome}</span>
                  </td>
                  <td style={{ color: pnl >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    ${pnl.toFixed(2)}
                  </td>
                  <td>
                    <button
                      className="action-btn edit"
                      onClick={() => {
                        setEditingTrade(t);
                        setForm({
                          date: new Date(t.date).toISOString().slice(0, 16),
                          pair: t.pair,
                          entryPrice: t.entryPrice,
                          exitPrice: t.exitPrice,
                          quantity: t.quantity,
                          direction: t.direction,
                          outcome: t.outcome,
                          strategy: t.strategy,
                        });
                      }}
                    >
                      ✏️
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(t._id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#b0b8cc', marginTop: '1rem' }}>No trades found. Start logging some trades!</p>
      )}
    </div>
  );
};

// ==================== ANALYTICS PAGE ====================
const Analytics = ({ trades }) => {
  const calculateStats = () => {
    const wins = trades.filter((t) => t.outcome === 'win');
    const losses = trades.filter((t) => t.outcome === 'loss');
    const totalPnL = trades.reduce((sum, t) => sum + ((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity), 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + ((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + ((t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity), 0) / losses.length : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0;

    return { totalPnL, avgWin, avgLoss, profitFactor, wins: wins.length, losses: losses.length };
  };

  const stats = calculateStats();

  const pairStats = {};
  trades.forEach((t) => {
    if (!pairStats[t.pair]) pairStats[t.pair] = { total: 0, count: 0 };
    pairStats[t.pair].total += (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    pairStats[t.pair].count += 1;
  });

  const strategyStats = {};
  trades.forEach((t) => {
    const strat = t.strategy || 'Unknown';
    if (!strategyStats[strat]) strategyStats[strat] = { total: 0, count: 0 };
    strategyStats[strat].total += (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    strategyStats[strat].count += 1;
  });

  return (
    <div>
      <h1>📊 Analytics</h1>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Total P&L</div>
          <div className="stat-value" style={{ color: stats.totalPnL >= 0 ? '#4ade80' : '#f87171' }}>
            ${stats.totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Win</div>
          <div className="stat-value" style={{ color: '#4ade80' }}>
            ${stats.avgWin.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Loss</div>
          <div className="stat-value" style={{ color: '#f87171' }}>
            ${stats.avgLoss.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Profit Factor</div>
          <div className="stat-value">{stats.profitFactor.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h2>Pair Performance</h2>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Trades</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pairStats).map(([pair, data]) => (
                <tr key={pair}>
                  <td>{pair}</td>
                  <td>{data.count}</td>
                  <td style={{ color: data.total >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    ${data.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Strategy Performance</h2>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Trades</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(strategyStats).map(([strategy, data]) => (
                <tr key={strategy}>
                  <td>{strategy}</td>
                  <td>{data.count}</td>
                  <td style={{ color: data.total >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    ${data.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== BACKTESTING PAGE ====================
const Backtest = ({ trades }) => {
  const [simulations, setSimulations] = useState(100);
  const [selectedStrategy, setSelectedStrategy] = useState('');

  const runBacktest = () => {
    const filteredTrades = selectedStrategy
      ? trades.filter((t) => t.strategy === selectedStrategy)
      : trades;

    if (filteredTrades.length < 10) {
      alert('Need at least 10 trades for backtesting');
      return;
    }

    const paths = [];
    for (let sim = 0; sim < simulations; sim++) {
      let equity = 1000;
      for (let i = 0; i < filteredTrades.length; i++) {
        const randomTrade = filteredTrades[Math.floor(Math.random() * filteredTrades.length)];
        const pnl = (randomTrade.exitPrice - randomTrade.entryPrice) * (randomTrade.direction === 'long' ? 1 : -1) * randomTrade.quantity;
        equity += pnl;
      }
      paths.push(equity);
    }

    const sorted = paths.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p10 = sorted[Math.floor(sorted.length * 0.1)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const profitableCount = paths.filter((p) => p > 1000).length;

    alert(`
Monte Carlo Backtesting Results (${simulations} simulations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Median: $${median.toFixed(0)}
Pessimistic (10th %): $${p10.toFixed(0)}
Optimistic (90th %): $${p90.toFixed(0)}
Profitable: ${((profitableCount / simulations) * 100).toFixed(1)}%
    `);
  };

  const strategies = [...new Set(trades.map((t) => t.strategy).filter(Boolean))];

  return (
    <div>
      <h1>🧪 Monte Carlo Backtesting</h1>
      <div style={{ background: '#1a1f3a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <label>
          Simulations:
          <input
            type="number"
            value={simulations}
            onChange={(e) => setSimulations(parseInt(e.target.value))}
            min="50"
            max="1000"
            style={{ marginLeft: '0.5rem', width: '100px' }}
          />
        </label>
        <label style={{ marginLeft: '1rem' }}>
          Strategy:
          <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)} style={{ marginLeft: '0.5rem' }}>
            <option value="">All trades</option>
            {strategies.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button onClick={runBacktest} style={{ marginLeft: '1rem' }}>
          Run Backtest
        </button>
      </div>
      <p style={{ color: '#b0b8cc' }}>
        Monte Carlo backtesting simulates {simulations} random paths through your trade history to estimate future performance distributions.
      </p>
    </div>
  );
};

// ==================== RULES PAGE ====================
const Rules = ({ user, showToast }) => {
  const [rules, setRules] = useState(user?.tradingRules || '');

  const save = async () => {
    try {
      await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ tradingRules: rules }),
      });
      showToast('Trading rules saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <h1>📖 Trading Rules</h1>
      <div style={{ marginBottom: '1rem', color: '#b0b8cc' }}>
        Document your trading rules, entry criteria, and risk management guidelines here.
      </div>
      <textarea
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        rows={15}
        placeholder="Enter your trading rules here..."
        style={{
          width: '100%',
          background: '#1a1f3a',
          border: '1px solid #2a2e4a',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
        }}
      />
      <button onClick={save} style={{ marginTop: '1rem' }}>
        💾 Save Rules
      </button>
    </div>
  );
};

// ==================== PROFILE PAGE ====================
const Profile = ({ user, showToast }) => {
  const [name, setName] = useState(user?.name || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const updateProfile = async () => {
    try {
      await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const changePassword = async () => {
    try {
      await fetchWithAuth('/api/user/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });
      showToast('Password changed!', 'success');
      setOldPwd('');
      setNewPwd('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <h1>👤 Profile Settings</h1>

      <div style={{ background: '#1a1f3a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', maxWidth: '500px' }}>
        <h2>Account Information</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button onClick={updateProfile}>Update Name</button>
      </div>

      <div style={{ background: '#1a1f3a', padding: '1.5rem', borderRadius: '8px', maxWidth: '500px' }}>
        <h2>Change Password</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
        </div>
        <button onClick={changePassword}>Change Password</button>
      </div>
    </div>
  );
};

// ==================== DASHBOARD APP (Main Protected App) ====================
const DashboardApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Load user and trades on mount
  useEffect(() => {
    const loadData = async () => {
      const token = getAuthToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = await fetchWithAuth('/api/auth/me');
        setUser(userData);

        const tradesData = await fetchWithAuth('/api/trades');
        setTrades(tradesData || []);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading your trading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Don't show sidebar on login/signup pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="app">
      {!isAuthPage && <Sidebar />}
      <div className={isAuthPage ? '' : 'main-area'}>
        {!isAuthPage && (
          <div className="top-bar">
            <div className="date-time">
              {new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="user-info">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <span>{user.name}</span>
            </div>
          </div>
        )}
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard trades={trades} user={user} />} />
            <Route path="/trades" element={<TradeLog trades={trades} setTrades={setTrades} showToast={showToast} />} />
            <Route path="/analytics" element={<Analytics trades={trades} />} />
            <Route path="/backtest" element={<Backtest trades={trades} />} />
            <Route path="/rules" element={<Rules user={user} showToast={showToast} />} />
            <Route path="/profile" element={<Profile user={user} showToast={showToast} />} />
            <Route path="*" element={<Dashboard trades={trades} user={user} />} />
          </Routes>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <GlobalStyle />
    </div>
  );
};

// ==================== MAIN APP WITH ROUTES ====================
const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={<DashboardApp />} />
    </Routes>
  );
};

// ==================== GLOBAL STYLES ====================
const GlobalStyle = () => (
  <style>{`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body, #root {
      width: 100%;
      height: 100%;
    }

    body {
      background: #0a0c15;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      color: #e0e4f0;
    }

    /* ===== AUTH PAGES ===== */
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at 20% 30%, #0f1222, #05070c);
    }

    .auth-card {
      background: rgba(26, 31, 58, 0.9);
      backdrop-filter: blur(12px);
      padding: 2.5rem;
      border-radius: 24px;
      width: 100%;
      max-width: 420px;
      text-align: center;
      border: 1px solid rgba(232, 160, 32, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    .auth-logo {
      font-size: 1.8rem;
      font-weight: bold;
      color: #e8a020;
      margin-bottom: 1.5rem;
      letter-spacing: -0.5px;
    }

    .auth-card h2 {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      color: #b0b8cc;
      font-weight: 500;
    }

    .error-box {
      background: rgba(248, 113, 113, 0.1);
      border-left: 3px solid #f87171;
      padding: 0.75rem;
      border-radius: 6px;
      color: #f87171;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .auth-card form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .auth-card input {
      width: 100%;
      padding: 10px 12px;
      background: #0f1222;
      border: 1px solid #2a2e4a;
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      transition: 0.2s;
    }

    .auth-card input:focus {
      outline: none;
      border-color: #e8a020;
      box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.1);
    }

    .auth-card button {
      width: 100%;
      padding: 10px;
      background: #e8a020;
      border: none;
      border-radius: 8px;
      color: #0a0c15;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }

    .auth-card button:hover:not(:disabled) {
      background: #f0a835;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);
    }

    .auth-card button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .auth-card p {
      margin-top: 1rem;
      color: #b0b8cc;
      font-size: 0.9rem;
    }

    .auth-card a {
      color: #e8a020;
      text-decoration: none;
      font-weight: 600;
      transition: 0.2s;
    }

    .auth-card a:hover {
      color: #f0a835;
    }

    /* ===== PROTECTED APP ===== */
    .app {
      display: flex;
      min-height: 100vh;
      background: #0a0c15;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 260px;
      background: rgba(8, 12, 22, 0.95);
      backdrop-filter: blur(12px);
      border-right: 1px solid rgba(232, 160, 32, 0.2);
      padding: 1.5rem;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      z-index: 100;
    }

    .logo {
      font-size: 1.3rem;
      font-weight: bold;
      color: #e8a020;
      margin-bottom: 2rem;
      display: flex;
      gap: 0.5rem;
    }

    .logo span {
      color: #b0b8cc;
    }

    .sidebar-section {
      margin-bottom: 1.5rem;
    }

    .section-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: #7c85a0;
      margin-bottom: 0.7rem;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .sidebar-item {
      display: block;
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 8px;
      color: #b8c0dc;
      text-decoration: none;
      transition: 0.2s;
      font-size: 0.9rem;
      border-left: 2px solid transparent;
    }

    .sidebar-item.active {
      background: rgba(232, 160, 32, 0.15);
      color: #e8a020;
      border-left-color: #e8a020;
      font-weight: 500;
    }

    .sidebar-item:hover {
      background: rgba(232, 160, 32, 0.1);
      color: white;
    }

    .upgrade-card {
      background: linear-gradient(135deg, rgba(232, 160, 32, 0.15), rgba(200, 100, 20, 0.05));
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      margin: 1.5rem 0;
      border: 1px solid rgba(232, 160, 32, 0.4);
    }

    .upgrade-icon {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }

    .upgrade-title {
      font-weight: bold;
      color: #e8a020;
      font-size: 0.9rem;
      margin-bottom: 0.3rem;
    }

    .upgrade-desc {
      font-size: 0.7rem;
      color: #9ca3af;
      margin-bottom: 0.8rem;
    }

    .upgrade-btn {
      background: #e8a020;
      border: none;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      width: 100%;
      color: #0a0c15;
      font-weight: 600;
      font-size: 0.8rem;
      transition: 0.2s;
    }

    .upgrade-btn:hover {
      background: #f0a835;
    }

    .logout-btn {
      width: 100%;
      background: rgba(248, 113, 113, 0.15);
      border: 1px solid rgba(248, 113, 113, 0.5);
      color: #f87171;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
      font-weight: 600;
      transition: 0.2s;
    }

    .logout-btn:hover {
      background: rgba(248, 113, 113, 0.25);
    }

    /* ===== MAIN AREA ===== */
    .main-area {
      margin-left: 260px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(8, 12, 22, 0.6);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(232, 160, 32, 0.1);
    }

    .date-time {
      font-size: 0.85rem;
      color: #b0b8cc;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #e8a020, #d98810);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0a0c15;
      font-weight: bold;
      font-size: 1rem;
    }

    .page-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .page-content h1 {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }

    .page-content h2 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      margin-top: 1.5rem;
      color: #e0e4f0;
    }

    /* ===== WELCOME BANNER ===== */
    .welcome-banner {
      background: rgba(232, 160, 32, 0.15);
      border-left: 3px solid #e8a020;
      padding: 1rem;
      border-radius: 8px;
      color: #e0e4f0;
      margin-bottom: 1.5rem;
    }

    /* ===== STATS ===== */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .stat-card {
      background: linear-gradient(135deg, #1a1f3a 0%, #151a33 100%);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(232, 160, 32, 0.2);
      text-align: center;
      transition: 0.2s;
    }

    .stat-card:hover {
      border-color: rgba(232, 160, 32, 0.4);
      transform: translateY(-2px);
    }

    .stat-label {
      font-size: 0.8rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #e8a020;
    }

    /* ===== TABLES ===== */
    .trade-table {
      width: 100%;
      border-collapse: collapse;
      background: #1a1f3a;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 1rem;
      border: 1px solid rgba(232, 160, 32, 0.1);
    }

    .trade-table thead {
      background: rgba(8, 12, 22, 0.6);
    }

    .trade-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(232, 160, 32, 0.2);
    }

    .trade-table td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(232, 160, 32, 0.1);
      color: #e0e4f0;
    }

    .trade-table tr:nth-child(even) {
      background: rgba(26, 31, 58, 0.6);
    }

    .trade-table tr:hover {
      background: rgba(232, 160, 32, 0.1);
    }

    /* ===== BADGES ===== */
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-win {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
    }

    .badge-loss {
      background: rgba(248, 113, 113, 0.15);
      color: #f87171;
    }

    .badge-breakeven {
      background: rgba(191, 144, 0, 0.15);
      color: #fbbf24;
    }

    /* ===== FILTERS ===== */
    .filters {
      display: flex;
      gap: 10px;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filters select,
    .filters button {
      padding: 8px 12px;
      background: #1a1f3a;
      border: 1px solid rgba(232, 160, 32, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      cursor: pointer;
      transition: 0.2s;
    }

    .filters select:hover,
    .filters button:hover {
      border-color: #e8a020;
      background: rgba(232, 160, 32, 0.05);
    }

    .filters button {
      background: #e8a020;
      color: #0a0c15;
      font-weight: 600;
      border: none;
    }

    .filters button:hover {
      background: #f0a835;
    }

    /* ===== FORMS ===== */
    form {
      background: #1a1f3a;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-end;
      border: 1px solid rgba(232, 160, 32, 0.1);
    }

    input,
    select,
    textarea {
      background: #0f1222;
      border: 1px solid rgba(232, 160, 32, 0.2);
      padding: 10px 12px;
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      transition: 0.2s;
      font-family: inherit;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #e8a020;
      box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.1);
    }

    input,
    select {
      flex: 1;
      min-width: 120px;
    }

    textarea {
      width: 100%;
      resize: vertical;
      min-height: 200px;
    }

    button {
      background: #e8a020;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      color: #0a0c15;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    button:hover {
      background: #f0a835;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);
    }

    button:active {
      transform: translateY(0);
    }

    .action-btn {
      padding: 6px 10px;
      font-size: 0.85rem;
      margin: 0 2px;
    }

    .action-btn.edit {
      background: rgba(232, 160, 32, 0.2);
      color: #e8a020;
      border: 1px solid rgba(232, 160, 32, 0.4);
    }

    .action-btn.delete {
      background: rgba(248, 113, 113, 0.2);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.4);
    }

    /* ===== TOAST NOTIFICATIONS ===== */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1a1f3a;
      border-left: 4px solid #e8a020;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 2000;
      animation: slideIn 0.3s ease-out;
      color: #e0e4f0;
      font-weight: 500;
    }

    .toast.error {
      border-left-color: #f87171;
      color: #f87171;
    }

    .toast.success {
      border-left-color: #4ade80;
      color: #4ade80;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* ===== LOADING ===== */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.1rem;
      color: #e8a020;
      background: #0a0c15;
      flex-direction: column;
      gap: 1rem;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .sidebar {
        width: 70px;
        padding: 1rem 0.5rem;
      }

      .sidebar .logo,
      .sidebar .section-label,
      .sidebar .upgrade-card,
      .sidebar-item span {
        display: none;
      }

      .sidebar-item {
        padding: 8px;
        text-align: center;
      }

      .main-area {
        margin-left: 70px;
      }

      .page-content {
        padding: 1rem;
      }

      .stats {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
      }

      form {
        flex-direction: column;
      }

      input,
      select {
        min-width: 100%;
      }
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(26, 31, 58, 0.5);
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(232, 160, 32, 0.3);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgba(232, 160, 32, 0.5);
    }
  `}</style>
);

// ==================== FINAL EXPORT ====================
const AppWithStyles = () => (
  <>
    <GlobalStyle />
    <App />
  </>
);

export default AppWithStyles;
