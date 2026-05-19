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
    <div className="auth-page">
      <div className="auth-bg"></div>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">📊</div>
              <div>
                <h1>TTM Journal</h1>
                <p>Professional Trading Analytics</p>
              </div>
            </div>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary-large">
              {loading ? '🔄 Logging in...' : '→ Enter War Room'}
            </button>
          </form>

          <div className="auth-footer">
            <p>New trader? <Link to="/signup">Create account</Link></p>
            <p><a href="#forgot">Forgot password?</a></p>
          </div>
        </div>

        <div className="auth-features">
          <div className="feature">
            <div className="feature-icon">📈</div>
            <h3>Advanced Analytics</h3>
            <p>Track P&L, win rate, drawdown & more</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Trade Logging</h3>
            <p>Log trades with emotions & ratings</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Smart Backtesting</h3>
            <p>Monte Carlo simulations for your strategy</p>
          </div>
        </div>
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
    <div className="auth-page">
      <div className="auth-bg"></div>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">📊</div>
              <div>
                <h1>TTM Journal</h1>
                <p>Professional Trading Analytics</p>
              </div>
            </div>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary-large">
              {loading ? '🔄 Creating account...' : '→ Start Trading'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already a trader? <Link to="/login">Login here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SIDEBAR ITEM ====================
const SidebarItem = ({ to, label, active, icon }) => (
  <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
    <span className="item-icon">{icon}</span>
    <span className="item-label">{label}</span>
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
      <div className="sidebar-header">
        <div className="logo-brand">
          <div className="logo-circle">📊</div>
          <div className="logo-text">
            <div className="logo-main">TTM</div>
            <div className="logo-sub">Journal</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">TRADING</div>
          <SidebarItem to="/" label="Dashboard" active={isActive('/')} icon="🎯" />
          <SidebarItem to="/trades" label="Trade Log" active={isActive('/trades')} icon="📝" />
          <SidebarItem to="/analytics" label="Analytics" active={isActive('/analytics')} icon="📊" />
          <SidebarItem to="/calendar" label="Calendar" active={isActive('/calendar')} icon="📅" />
          <SidebarItem to="/backtest" label="Backtest" active={isActive('/backtest')} icon="🧪" />
        </div>

        <div className="nav-section">
          <div className="nav-label">TOOLS</div>
          <SidebarItem to="/rules" label="Trading Rules" active={isActive('/rules')} icon="📖" />
          <SidebarItem to="/checklist" label="Pre-Trade Check" active={isActive('/checklist')} icon="✅" />
          <SidebarItem to="/profile" label="Settings" active={isActive('/profile')} icon="⚙️" />
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="premium-badge">
          <div className="badge-icon">👑</div>
          <div className="badge-text">
            <div className="badge-title">PRO MEMBER</div>
            <div className="badge-subtitle">Unlimited access</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

// ==================== TOAST NOTIFICATION ====================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`toast toast-${type}`}>{message}</div>;
};

// ==================== STAT CARD COMPONENT ====================
const StatCard = ({ icon, label, value, change, color = 'default' }) => {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value">{value}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  );
};

// ==================== CALENDAR HEATMAP ====================
const CalendarHeatmap = ({ trades }) => {
  const getDayColor = (day) => {
    const trades_for_day = trades.filter(
      (t) => new Date(t.date).toDateString() === day.toDateString()
    );
    if (trades_for_day.length === 0) return 'rgba(255, 255, 255, 0.05)';
    const pnl = trades_for_day.reduce(
      (sum, t) =>
        sum +
        (t.exitPrice - t.entryPrice) *
          (t.direction === 'long' ? 1 : -1) *
          t.quantity,
      0
    );
    if (pnl > 100) return '#10b981';
    if (pnl > 0) return '#84cc16';
    if (pnl > -100) return '#ef4444';
    return '#7f1d1d';
  };

  const last30Days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days.push(d);
  }

  return (
    <div className="heatmap-card">
      <h3>30-Day P&L Heatmap</h3>
      <div className="heatmap-grid">
        {last30Days.map((day, idx) => {
          const pnl = trades
            .filter((t) => new Date(t.date).toDateString() === day.toDateString())
            .reduce(
              (sum, t) =>
                sum +
                (t.exitPrice - t.entryPrice) *
                  (t.direction === 'long' ? 1 : -1) *
                  t.quantity,
              0
            );
          return (
            <div
              key={idx}
              className="heatmap-cell"
              style={{ backgroundColor: getDayColor(day) }}
              title={`${day.toDateString()}: $${pnl.toFixed(2)}`}
            />
          );
        })}
      </div>
    </div>
  );
};

// ==================== DASHBOARD PAGE ====================
const Dashboard = ({ trades, user }) => {
  const stats = {
    totalTrades: trades.length,
    wins: trades.filter((t) => t.outcome === 'win').length,
    losses: trades.filter((t) => t.outcome === 'loss').length,
    winRate:
      trades.length > 0
        ? ((trades.filter((t) => t.outcome === 'win').length / trades.length) * 100).toFixed(1)
        : 0,
    totalPnL: trades.reduce(
      (sum, t) =>
        sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity,
      0
    ),
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayTrades = trades.filter((t) => new Date(t.date).toDateString() === today);
    return todayTrades.reduce(
      (sum, t) =>
        sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity,
      0
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Trading Dashboard</h1>
          <p>Welcome back, {user.name}!</p>
        </div>
        <Link to="/trades" className="btn-secondary">+ Log Trade</Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="🎯"
          label="Total Trades"
          value={stats.totalTrades}
          color="primary"
        />
        <StatCard
          icon="📈"
          label="Win Rate"
          value={`${stats.winRate}%`}
          color={stats.winRate >= 50 ? 'success' : 'warning'}
        />
        <StatCard
          icon="💰"
          label="Total P&L"
          value={`$${stats.totalPnL.toFixed(2)}`}
          color={stats.totalPnL >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          icon="📊"
          label="Today P&L"
          value={`$${getTodayStats().toFixed(2)}`}
          color={getTodayStats() >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Recent Trades</h3>
          {trades.length > 0 ? (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Dir</th>
                  <th>Outcome</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(-5).map((t) => {
                  const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
                  return (
                    <tr key={t._id}>
                      <td>{t.pair}</td>
                      <td>{t.direction === 'long' ? '📈' : '📉'}</td>
                      <td>
                        <span className={`badge badge-${t.outcome}`}>{t.outcome}</span>
                      </td>
                      <td style={{ color: pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        ${pnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="empty">Start logging trades to see them here</p>
          )}
        </div>

        <CalendarHeatmap trades={trades} />
      </div>
    </div>
  );
};

// ==================== TRADE LOG PAGE ====================
const TradeLog = ({ trades, setTrades, showToast }) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    pair: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    direction: 'long',
    outcome: 'win',
    strategy: '',
    emotion: 'calm',
    rating: 0,
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
        rating: parseInt(form.rating),
      };

      if (editingTrade) {
        await fetchWithAuth(`/api/trades/${editingTrade._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setTrades(trades.map((t) => (t._id === editingTrade._id ? { ...t, ...payload } : t)));
        showToast('✓ Trade updated!', 'success');
        setEditingTrade(null);
      } else {
        const newTrade = await fetchWithAuth('/api/trades', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setTrades([...trades, newTrade]);
        showToast('✓ Trade logged!', 'success');
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
        emotion: 'calm',
        rating: 0,
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trade?')) return;
    try {
      await fetchWithAuth(`/api/trades/${id}`, { method: 'DELETE' });
      setTrades(trades.filter((t) => t._id !== id));
      showToast('✓ Trade deleted', 'success');
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
    const headers = ['Date', 'Pair', 'Direction', 'Entry', 'Exit', 'Qty', 'Outcome', 'P&L', 'Emotion', 'Rating'];
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
        pnl.toFixed(2),
        t.emotion,
        t.rating,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('✓ CSV exported!', 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{editingTrade ? '✏️ Edit Trade' : '📝 Log New Trade'}</h1>
        {filteredTrades.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary">📥 Export CSV</button>
        )}
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Pair</label>
              <input
                placeholder="EURUSD"
                value={form.pair}
                onChange={(e) => setForm({ ...form, pair: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label>Entry</label>
              <input
                type="number"
                step="any"
                placeholder="1.0950"
                value={form.entryPrice}
                onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Exit</label>
              <input
                type="number"
                step="any"
                placeholder="1.0960"
                value={form.exitPrice}
                onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                step="any"
                placeholder="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Direction</label>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option>long</option>
                <option>short</option>
              </select>
            </div>
            <div className="form-group">
              <label>Outcome</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
                <option>win</option>
                <option>loss</option>
                <option>breakeven</option>
              </select>
            </div>
            <div className="form-group">
              <label>Strategy</label>
              <input
                placeholder="e.g. Support Bounce"
                value={form.strategy}
                onChange={(e) => setForm({ ...form, strategy: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Emotion</label>
              <select value={form.emotion} onChange={(e) => setForm({ ...form, emotion: e.target.value })}>
                <option value="calm">😌 Calm</option>
                <option value="confident">😎 Confident</option>
                <option value="fearful">😨 Fearful</option>
                <option value="fomo">🤑 FOMO</option>
                <option value="frustrated">😤 Frustrated</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rating</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, rating: r })}
                    className={`rating-btn ${form.rating >= r ? 'active' : ''}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingTrade ? '✏️ Update Trade' : '💾 Save Trade'}
            </button>
            {editingTrade && (
              <button type="button" onClick={() => setEditingTrade(null)} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

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
      </div>

      <div className="card">
        <h3>Trade History</h3>
        {filteredTrades.length > 0 ? (
          <table className="trade-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Pair</th>
                <th>Dir</th>
                <th>Entry/Exit</th>
                <th>Outcome</th>
                <th>P&L</th>
                <th>Emotion</th>
                <th>Rating</th>
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
                    <td>{t.direction === 'long' ? '📈' : '📉'}</td>
                    <td>{t.entryPrice.toFixed(5)}/{t.exitPrice.toFixed(5)}</td>
                    <td>
                      <span className={`badge badge-${t.outcome}`}>{t.outcome}</span>
                    </td>
                    <td style={{ color: pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      ${pnl.toFixed(2)}
                    </td>
                    <td>{t.emotion || '-'}</td>
                    <td>{'⭐'.repeat(t.rating || 0) || '-'}</td>
                    <td>
                      <button
                        className="action-btn"
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
                            emotion: t.emotion,
                            rating: t.rating,
                          });
                        }}
                      >
                        ✏️
                      </button>
                      <button className="action-btn" onClick={() => handleDelete(t._id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty">No trades found</p>
        )}
      </div>
    </div>
  );
};

// ==================== ANALYTICS PAGE ====================
const Analytics = ({ trades }) => {
  const calculateStats = () => {
    const wins = trades.filter((t) => t.outcome === 'win');
    const losses = trades.filter((t) => t.outcome === 'loss');
    const totalPnL = trades.reduce(
      (sum, t) => sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity,
      0
    );
    const avgWin =
      wins.length > 0
        ? wins.reduce(
            (sum, t) =>
              sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity,
            0
          ) / wins.length
        : 0;
    const avgLoss =
      losses.length > 0
        ? losses.reduce(
            (sum, t) =>
              sum + (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity,
            0
          ) / losses.length
        : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0;

    return { totalPnL, avgWin, avgLoss, profitFactor, wins: wins.length, losses: losses.length };
  };

  const stats = calculateStats();

  const pairStats = {};
  trades.forEach((t) => {
    if (!pairStats[t.pair]) pairStats[t.pair] = { total: 0, count: 0 };
    pairStats[t.pair].total +=
      (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    pairStats[t.pair].count += 1;
  });

  return (
    <div className="page">
      <h1>📊 Analytics</h1>

      <div className="stats-grid">
        <StatCard
          icon="💰"
          label="Total P&L"
          value={`$${stats.totalPnL.toFixed(2)}`}
          color={stats.totalPnL >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          icon="📈"
          label="Avg Win"
          value={`$${stats.avgWin.toFixed(2)}`}
          color="success"
        />
        <StatCard
          icon="📉"
          label="Avg Loss"
          value={`$${stats.avgLoss.toFixed(2)}`}
          color="danger"
        />
        <StatCard
          icon="⚖️"
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          color="primary"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Pair Performance</h3>
          <table className="mini-table">
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
                  <td style={{ color: data.total >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
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

// ==================== CALENDAR PAGE ====================
const Calendar = ({ trades }) => {
  return (
    <div className="page">
      <h1>📅 Calendar</h1>
      <div className="card">
        <CalendarHeatmap trades={trades} />
      </div>
    </div>
  );
};

// ==================== BACKTEST PAGE ====================
const Backtest = ({ trades }) => {
  const [simulations, setSimulations] = useState(100);

  const runBacktest = () => {
    if (trades.length < 10) {
      alert('Need at least 10 trades for backtesting');
      return;
    }

    const paths = [];
    for (let sim = 0; sim < simulations; sim++) {
      let equity = 1000;
      for (let i = 0; i < trades.length; i++) {
        const randomTrade = trades[Math.floor(Math.random() * trades.length)];
        const pnl =
          (randomTrade.exitPrice - randomTrade.entryPrice) *
          (randomTrade.direction === 'long' ? 1 : -1) *
          randomTrade.quantity;
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
🧪 Monte Carlo Backtest (${simulations} simulations)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Median: $${median.toFixed(0)}
Pessimistic (10%): $${p10.toFixed(0)}
Optimistic (90%): $${p90.toFixed(0)}
Profitable: ${((profitableCount / simulations) * 100).toFixed(1)}%
    `);
  };

  return (
    <div className="page">
      <h1>🧪 Backtesting</h1>
      <div className="card">
        <label>
          Simulations:
          <input
            type="number"
            value={simulations}
            onChange={(e) => setSimulations(parseInt(e.target.value))}
            min="50"
            max="1000"
            style={{ marginLeft: '1rem', width: '100px' }}
          />
        </label>
        <button onClick={runBacktest} className="btn-primary" style={{ marginLeft: '1rem' }}>
          ▶️ Run Backtest
        </button>
      </div>
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
      showToast('✓ Rules saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page">
      <h1>📖 Trading Rules</h1>
      <div className="card">
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={15}
          placeholder="Document your trading rules here..."
          className="textarea-large"
        />
        <button onClick={save} className="btn-primary">
          💾 Save Rules
        </button>
      </div>
    </div>
  );
};

// ==================== CHECKLIST PAGE ====================
const Checklist = ({ user, showToast }) => {
  const [checklist, setChecklist] = useState(user?.tradingChecklist || '');

  const save = async () => {
    try {
      await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ tradingChecklist: checklist }),
      });
      showToast('✓ Checklist saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page">
      <h1>✅ Pre-Trade Checklist</h1>
      <div className="card">
        <textarea
          value={checklist}
          onChange={(e) => setChecklist(e.target.value)}
          rows={15}
          placeholder="☐ Item 1
☐ Item 2..."
          className="textarea-large"
        />
        <button onClick={save} className="btn-primary">
          💾 Save Checklist
        </button>
      </div>
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
      showToast('✓ Profile updated!', 'success');
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
      showToast('✓ Password changed!', 'success');
      setOldPwd('');
      setNewPwd('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page">
      <h1>⚙️ Settings</h1>

      <div className="card">
        <h3>Account Information</h3>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button onClick={updateProfile} className="btn-primary">
          Update Name
        </button>
      </div>

      <div className="card">
        <h3>Change Password</h3>
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
        </div>
        <button onClick={changePassword} className="btn-primary">
          Change Password
        </button>
      </div>
    </div>
  );
};

// ==================== DASHBOARD APP ====================
const DashboardApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your trading dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="app-container">
      {!isAuthPage && <Sidebar />}
      <div className={isAuthPage ? 'full-width' : 'main-content'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Dashboard trades={trades} user={user} />} />
          <Route path="/trades" element={<TradeLog trades={trades} setTrades={setTrades} showToast={showToast} />} />
          <Route path="/analytics" element={<Analytics trades={trades} />} />
          <Route path="/calendar" element={<Calendar trades={trades} />} />
          <Route path="/backtest" element={<Backtest trades={trades} />} />
          <Route path="/rules" element={<Rules user={user} showToast={showToast} />} />
          <Route path="/checklist" element={<Checklist user={user} showToast={showToast} />} />
          <Route path="/profile" element={<Profile user={user} showToast={showToast} />} />
          <Route path="*" element={<Dashboard trades={trades} user={user} />} />
        </Routes>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ==================== MAIN APP ====================
const App = () => {
  return <DashboardApp />;
};

// ==================== GLOBAL STYLES - PROFESSIONAL UI ====================
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f8f9fa;
      color: #1f2937;
      line-height: 1.6;
    }

    /* ===== AUTH PAGES ===== */
    .auth-page {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }

    .auth-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
      background-size: cover;
      background-position: bottom;
    }

    .auth-container {
      position: relative;
      z-index: 10;
      max-width: 1200px;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      padding: 2rem;
      align-items: center;
    }

    .auth-card {
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
    }

    .auth-header {
      margin-bottom: 2rem;
    }

    .auth-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .logo-icon {
      font-size: 2.5rem;
    }

    .auth-logo h1 {
      font-size: 1.8rem;
      color: #667eea;
      margin-bottom: 0.25rem;
    }

    .auth-logo p {
      color: #9ca3af;
      font-size: 0.9rem;
    }

    .error-alert {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .form-group input,
    .form-group select {
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn-primary-large {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.875rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary-large:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .auth-footer {
      text-align: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .auth-footer p {
      margin-bottom: 0.5rem;
    }

    .auth-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: 0.2s;
    }

    .auth-footer a:hover {
      color: #764ba2;
    }

    .auth-features {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .feature {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 1.5rem;
      border-radius: 12px;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .feature h3 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .feature p {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .auth-container {
        grid-template-columns: 1fr;
      }
      .auth-features {
        display: none;
      }
    }

    /* ===== SIDEBAR ===== */
    .app-container {
      display: flex;
      min-height: 100vh;
      background: #f8f9fa;
    }

    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #e5e7eb;
      box-shadow: 2px 0 8px rgba(0,0,0,0.05);
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .logo-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-circle {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .logo-text {
      flex: 1;
    }

    .logo-main {
      font-weight: 700;
      color: #1f2937;
      font-size: 1rem;
    }

    .logo-sub {
      font-size: 0.75rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-section {
      padding: 0 0.75rem 1.5rem 0.75rem;
    }

    .nav-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #9ca3af;
      padding: 0 1rem 0.5rem;
      letter-spacing: 0.5px;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin: 0.25rem 0;
      border-radius: 8px;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.2s;
      font-size: 0.95rem;
    }

    .sidebar-item:hover {
      background: #f3f4f6;
      color: #667eea;
    }

    .sidebar-item.active {
      background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
      color: #667eea;
      font-weight: 600;
      border-left: 3px solid #667eea;
      padding-left: calc(1rem - 3px);
    }

    .item-icon {
      font-size: 1.1rem;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .premium-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }

    .badge-icon {
      font-size: 1.2rem;
    }

    .badge-title {
      font-weight: 600;
      font-size: 0.85rem;
    }

    .badge-subtitle {
      font-size: 0.7rem;
      opacity: 0.9;
    }

    .btn-logout {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
      padding: 0.75rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-logout:hover {
      background: #fecaca;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      margin-left: 280px;
      flex: 1;
      overflow-y: auto;
    }

    .full-width {
      flex: 1;
    }

    .page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page h1 {
      font-size: 2rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .page h3 {
      font-size: 1.1rem;
      color: #1f2937;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title h1 {
      margin-bottom: 0.25rem;
    }

    .page-title p {
      color: #9ca3af;
      font-size: 0.9rem;
    }

    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .stat-card:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat-icon {
      font-size: 1.5rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      font-variant-numeric: tabular-nums;
    }

    .stat-change {
      font-size: 0.85rem;
      color: #10b981;
      margin-top: 0.5rem;
    }

    .stat-primary .stat-value { color: #667eea; }
    .stat-success .stat-value { color: #10b981; }
    .stat-danger .stat-value { color: #ef4444; }
    .stat-warning .stat-value { color: #f59e0b; }

    /* ===== CARDS ===== */
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin-bottom: 1.5rem;
    }

    .card h3 {
      margin-bottom: 1rem;
    }

    .form-card {
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
    }

    /* ===== FORMS ===== */
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .rating-selector {
      display: flex;
      gap: 0.5rem;
    }

    .rating-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1.1rem;
    }

    .rating-btn:hover {
      border-color: #667eea;
    }

    .rating-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: #667eea;
      color: white;
    }

    .textarea-large {
      width: 100%;
      min-height: 300px !important;
      resize: vertical;
    }

    /* ===== BUTTONS ===== */
    .btn-primary,
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #1f2937;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .action-btn {
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
      margin-right: 0.25rem;
    }

    .action-btn:hover {
      background: #e5e7eb;
    }

    /* ===== FILTERS ===== */
    .filters {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .filters select {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .filters select:hover {
      border-color: #667eea;
    }

    /* ===== TABLES ===== */
    .trade-table,
    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .trade-table thead,
    .mini-table thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }

    .trade-table th,
    .mini-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.5px;
    }

    .trade-table td,
    .mini-table td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
    }

    .trade-table tbody tr:hover,
    .mini-table tbody tr:hover {
      background: #f9fafb;
    }

    /* ===== BADGES ===== */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-win {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-loss {
      background: #fee2e2;
      color: #7f1d1d;
    }

    .badge-breakeven {
      background: #fef3c7;
      color: #78350f;
    }

    /* ===== HEATMAP ===== */
    .heatmap-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 1rem;
    }

    .heatmap-cell {
      aspect-ratio: 1;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(0,0,0,0.1);
    }

    .heatmap-cell:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    /* ===== DASHBOARD GRID ===== */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    /* ===== TOAST ===== */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 2000;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .toast-success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    .toast-error {
      background: #fee2e2;
      color: #7f1d1d;
      border-left: 4px solid #ef4444;
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
    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty {
      color: #9ca3af;
      text-align: center;
      padding: 2rem;
      font-style: italic;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .sidebar {
        width: 70px;
        padding: 1rem 0.5rem;
      }

      .logo-brand, .nav-label, .sidebar-footer {
        display: none;
      }

      .sidebar-item {
        justify-content: center;
        padding: 0.75rem;
      }

      .item-label {
        display: none;
      }

      .main-content {
        margin-left: 70px;
      }

      .page {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
      }
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #f3f4f6;
    }

    ::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
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
