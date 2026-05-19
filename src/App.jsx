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
        <h2>War Room Access</h2>
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
            {loading ? 'Authenticating...' : 'Enter War Room'}
          </button>
        </form>
        <p>
          New to TTM? <Link to="/signup">Start your journey</Link>
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
        <h2>Join the War Room</h2>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Trader Name"
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
            {loading ? 'Setting up...' : 'Create Account'}
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
      <div className="logo">
        <span className="logo-glow">⚡</span>
        <div>
          <div className="logo-title">TTM</div>
          <div className="logo-subtitle">War Room</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-label">COMMAND CENTER</div>
        <SidebarItem to="/" label="Dashboard" active={isActive('/')} icon="🎯" />
        <SidebarItem to="/trades" label="Trade Log" active={isActive('/trades')} icon="📊" />
        <SidebarItem to="/analytics" label="Analytics" active={isActive('/analytics')} icon="📈" />
        <SidebarItem to="/calendar" label="Calendar" active={isActive('/calendar')} icon="📅" />
        <SidebarItem to="/backtest" label="Backtest" active={isActive('/backtest')} icon="🧪" />
      </div>

      <div className="sidebar-section">
        <div className="section-label">ARSENAL</div>
        <SidebarItem to="/rules" label="Trading Rules" active={isActive('/rules')} icon="📖" />
        <SidebarItem to="/checklist" label="Pre-Trade Check" active={isActive('/checklist')} icon="✅" />
        <SidebarItem to="/profile" label="Profile" active={isActive('/profile')} icon="👤" />
      </div>

      <div className="upgrade-card">
        <div className="upgrade-icon">🚀</div>
        <div className="upgrade-title">ELITE TRADER</div>
        <div className="upgrade-desc">Unlock pro features</div>
        <button className="upgrade-btn">Upgrade</button>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        🚪 Exit War Room
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
      {type === 'success' && '✓'} {type === 'error' && '⚠'} {message}
    </div>
  );
};

// ==================== CALENDAR HEATMAP ====================
const CalendarHeatmap = ({ trades }) => {
  const getDayColor = (day) => {
    const trades_for_day = trades.filter(
      (t) => new Date(t.date).toDateString() === day.toDateString()
    );
    if (trades_for_day.length === 0) return '#0f1222';
    const pnl = trades_for_day.reduce(
      (sum, t) =>
        sum +
        (t.exitPrice - t.entryPrice) *
          (t.direction === 'long' ? 1 : -1) *
          t.quantity,
      0
    );
    if (pnl > 100) return '#22c55e';
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
    <div className="heatmap">
      <h3>Last 30 Days P&L Heatmap</h3>
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
      <div className="heatmap-legend">
        <div style={{ backgroundColor: '#22c55e' }}>+$100</div>
        <div style={{ backgroundColor: '#84cc16' }}>+$0</div>
        <div style={{ backgroundColor: '#ef4444' }}>-$100</div>
        <div style={{ backgroundColor: '#7f1d1d' }}>-$100+</div>
      </div>
    </div>
  );
};

// ==================== SESSION BREAKDOWN ====================
const SessionBreakdown = ({ trades }) => {
  const getSession = (date) => {
    const hour = new Date(date).getUTCHours();
    if ((hour >= 8 && hour < 16) || (hour >= 7 && hour < 15)) return 'London';
    if ((hour >= 13 && hour < 21) || (hour >= 12 && hour < 20)) return 'NY';
    return 'Asia';
  };

  const sessions = { London: 0, NY: 0, Asia: 0, LondonWins: 0, NYWins: 0, AsiaWins: 0 };
  trades.forEach((t) => {
    const session = getSession(t.date);
    sessions[session]++;
    if (t.outcome === 'win') sessions[`${session}Wins`]++;
  });

  return (
    <div className="session-breakdown">
      <h3>📍 Trading Sessions</h3>
      <div className="session-grid">
        <div className="session-card london">
          <div className="session-name">🇬🇧 London</div>
          <div className="session-stats">
            <div>{sessions.London} trades</div>
            <div className="win-rate">
              {sessions.London > 0
                ? ((sessions.LondonWins / sessions.London) * 100).toFixed(0)
                : 0}
              % win
            </div>
          </div>
        </div>
        <div className="session-card ny">
          <div className="session-name">🇺🇸 New York</div>
          <div className="session-stats">
            <div>{sessions.NY} trades</div>
            <div className="win-rate">
              {sessions.NY > 0 ? ((sessions.NYWins / sessions.NY) * 100).toFixed(0) : 0}% win
            </div>
          </div>
        </div>
        <div className="session-card asia">
          <div className="session-name">🌏 Asia</div>
          <div className="session-stats">
            <div>{sessions.Asia} trades</div>
            <div className="win-rate">
              {sessions.Asia > 0
                ? ((sessions.AsiaWins / sessions.Asia) * 100).toFixed(0)
                : 0}
              % win
            </div>
          </div>
        </div>
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
    avgRR:
      trades.length > 0
        ? (
            trades.reduce((sum, t) => sum + Math.abs(t.exitPrice - t.entryPrice), 0) /
            trades.length
          ).toFixed(4)
        : 0,
  };

  const emotionalStats = trades.reduce(
    (acc, t) => {
      if (t.emotion) acc[t.emotion] = (acc[t.emotion] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1>⚡ War Room Command Center</h1>
      <div className="welcome-banner">
        Welcome, <strong>{user.name}</strong>! Your trading war room is live.
      </div>

      <div className="stats-grid-large">
        <div className="stat-card large">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{stats.totalTrades}</div>
        </div>
        <div className="stat-card large success">
          <div className="stat-icon">🎯</div>
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{stats.winRate}%</div>
        </div>
        <div className="stat-card large">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Total P&L</div>
          <div className="stat-value" style={{ color: stats.totalPnL >= 0 ? '#22c55e' : '#ef4444' }}>
            ${stats.totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="stat-card large">
          <div className="stat-icon">⚖️</div>
          <div className="stat-label">Avg R/R</div>
          <div className="stat-value">{stats.avgRR}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <CalendarHeatmap trades={trades} />
        <SessionBreakdown trades={trades} />
      </div>

      <h2 style={{ marginTop: '2rem' }}>📝 Recent Battles</h2>
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
              <th>Emotion</th>
              <th>Rating</th>
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
                  <td style={{ color: pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                    ${pnl.toFixed(2)}
                  </td>
                  <td>{t.emotion || '-'}</td>
                  <td>{'⭐'.repeat(t.rating || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#b0b8cc', marginTop: '1rem' }}>
          🚀 Begin your first trade! Click "Trade Log" to log a battle.
        </p>
      )}
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
  const [showPreCheck, setShowPreCheck] = useState(false);

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
        showToast('✓ Trade logged successfully!', 'success');
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
      setShowPreCheck(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirm deletion?')) return;
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
    const headers = ['Date', 'Pair', 'Direction', 'Entry', 'Exit', 'Qty', 'Outcome', 'Strategy', 'P&L', 'Emotion', 'Rating'];
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
    <div>
      <h1>📝 Trade Log & Battle History</h1>

      {showPreCheck && (
        <div className="pre-check-modal">
          <div className="modal-content">
            <h2>⚠️ Pre-Trade Checklist</h2>
            <div className="checklist-items">
              <label>
                <input type="checkbox" /> Risk/Reward ratio acceptable?
              </label>
              <label>
                <input type="checkbox" /> Following trading plan?
              </label>
              <label>
                <input type="checkbox" /> Position size appropriate?
              </label>
              <label>
                <input type="checkbox" /> Emotional state clear?
              </label>
              <label>
                <input type="checkbox" /> Market conditions analyzed?
              </label>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowPreCheck(false)}>✓ Proceed to Log</button>
              <button onClick={() => setShowPreCheck(false)}>✕ Review Plan</button>
            </div>
          </div>
        </div>
      )}

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
          placeholder="Pair (EURUSD)"
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
          placeholder="Strategy"
          value={form.strategy}
          onChange={(e) => setForm({ ...form, strategy: e.target.value })}
        />
        <select value={form.emotion} onChange={(e) => setForm({ ...form, emotion: e.target.value })}>
          <option value="calm">😌 Calm</option>
          <option value="confident">😎 Confident</option>
          <option value="fearful">😨 Fearful</option>
          <option value="fomo">🤑 FOMO</option>
          <option value="frustrated">😤 Frustrated</option>
        </select>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <label>Rating:</label>
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, rating: r })}
              style={{
                background: form.rating >= r ? '#e8a020' : '#1a1f3a',
                border: '1px solid #2a2e4a',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              ⭐
            </button>
          ))}
        </div>
        <button type="submit">{editingTrade ? '✏️ Update' : '💾 Save Trade'}</button>
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
                  <td>{t.direction}</td>
                  <td>{t.entryPrice.toFixed(5)}/{t.exitPrice.toFixed(5)}</td>
                  <td>{t.quantity}</td>
                  <td>
                    <span className={`badge badge-${t.outcome}`}>{t.outcome}</span>
                  </td>
                  <td style={{ color: pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                    ${pnl.toFixed(2)}
                  </td>
                  <td>{t.emotion || '-'}</td>
                  <td>{'⭐'.repeat(t.rating || 0) || '-'}</td>
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
                          emotion: t.emotion,
                          rating: t.rating,
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
        <p style={{ color: '#b0b8cc' }}>No trades found.</p>
      )}
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

  const strategyStats = {};
  trades.forEach((t) => {
    const strat = t.strategy || 'Unknown';
    if (!strategyStats[strat]) strategyStats[strat] = { total: 0, count: 0 };
    strategyStats[strat].total +=
      (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    strategyStats[strat].count += 1;
  });

  // Drawdown calculation
  let maxEquity = 1000;
  let maxDrawdown = 0;
  let currentEquity = 1000;
  trades.forEach((t) => {
    const pnl = (t.exitPrice - t.entryPrice) * (t.direction === 'long' ? 1 : -1) * t.quantity;
    currentEquity += pnl;
    if (currentEquity > maxEquity) maxEquity = currentEquity;
    const drawdown = ((maxEquity - currentEquity) / maxEquity) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  return (
    <div>
      <h1>📊 Advanced Analytics</h1>

      <div className="stats-grid-large">
        <div className="stat-card large">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Total P&L</div>
          <div
            className="stat-value"
            style={{ color: stats.totalPnL >= 0 ? '#22c55e' : '#ef4444' }}
          >
            ${stats.totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="stat-card large">
          <div className="stat-icon">📈</div>
          <div className="stat-label">Avg Win</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>
            ${stats.avgWin.toFixed(2)}
          </div>
        </div>
        <div className="stat-card large">
          <div className="stat-icon">📉</div>
          <div className="stat-label">Avg Loss</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            ${stats.avgLoss.toFixed(2)}
          </div>
        </div>
        <div className="stat-card large">
          <div className="stat-icon">⚖️</div>
          <div className="stat-label">Profit Factor</div>
          <div className="stat-value">{stats.profitFactor.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                  <td style={{ color: data.total >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
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
                  <td style={{ color: data.total >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                    ${data.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '2rem', background: '#1a1f3a', padding: '1rem', borderRadius: '8px' }}>
        <h3>Maximum Drawdown: {maxDrawdown.toFixed(2)}%</h3>
        <p style={{ color: '#b0b8cc', marginTop: '0.5rem' }}>
          Largest peak-to-trough decline in your trading account
        </p>
      </div>
    </div>
  );
};

// ==================== CALENDAR PAGE ====================
const Calendar = ({ trades }) => {
  return (
    <div>
      <h1>📅 Trading Calendar & Heatmap</h1>
      <CalendarHeatmap trades={trades} />
      <SessionBreakdown trades={trades} />
    </div>
  );
};

// ==================== BACKTEST PAGE ====================
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
🧪 Monte Carlo Backtest Results (${simulations} simulations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Median Outcome: $${median.toFixed(0)}
Pessimistic (10th %ile): $${p10.toFixed(0)}
Optimistic (90th %ile): $${p90.toFixed(0)}
Profitable Simulations: ${((profitableCount / simulations) * 100).toFixed(1)}%
    `);
  };

  const strategies = [...new Set(trades.map((t) => t.strategy).filter(Boolean))];

  return (
    <div>
      <h1>🧪 Monte Carlo Backtesting</h1>
      <div style={{ background: '#1a1f3a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
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
          ▶️ Run Backtest
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
    <div>
      <h1>✅ Pre-Trade Checklist</h1>
      <div style={{ marginBottom: '1rem', color: '#b0b8cc' }}>
        Create your pre-trade checklist to ensure consistency and discipline
      </div>
      <textarea
        value={checklist}
        onChange={(e) => setChecklist(e.target.value)}
        rows={15}
        placeholder="☐ Risk/Reward ratio?
☐ Trading plan confirmation?
☐ Position size aligned?
☐ Emotional clarity?
☐ Market analysis complete?
☐ Entry point valid?
☐ Exit strategy set?
☐ Time frame correct?
"
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
        💾 Save Checklist
      </button>
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
    <div>
      <h1>📖 Trading Rules & Playbook</h1>
      <div style={{ marginBottom: '1rem', color: '#b0b8cc' }}>
        Document your edge, setups, and risk rules
      </div>
      <textarea
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        rows={15}
        placeholder="RULE 1: Never risk more than 2% per trade
RULE 2: Always use stop loss
RULE 3: Follow the trend
RULE 4: Scale in on winners
RULE 5: Cut losses at -50 pips
..."
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
    <div>
      <h1>👤 War Room Profile</h1>

      <div style={{ background: '#1a1f3a', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', maxWidth: '500px' }}>
        <h2>Account Information</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Trader Name</label>
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
            placeholder="••••••••"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
          <input
            type="password"
            placeholder="••••••••"
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
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
        <div>Initializing War Room...</div>
      </div>
    );
  }

  if (!user) return null;

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
            <Route path="/calendar" element={<Calendar trades={trades} />} />
            <Route path="/backtest" element={<Backtest trades={trades} />} />
            <Route path="/checklist" element={<Checklist user={user} showToast={showToast} />} />
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

// ==================== MAIN APP ====================
const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={<DashboardApp />} />
    </Routes>
  );
};

// ==================== GLOBAL STYLES - WAR ROOM AESTHETIC ====================
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
      background: linear-gradient(135deg, #0a0c15 0%, #0f1222 100%);
      font-family: 'Segoe UI', 'Roboto', sans-serif;
      color: #e0e4f0;
      line-height: 1.6;
    }

    /* ===== AUTH PAGES ===== */
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(ellipse at 20% 30%, #1a1f3a, #05070c);
      position: relative;
      overflow: hidden;
    }

    .auth-container::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(232,160,32,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: gridShift 20s linear infinite;
    }

    @keyframes gridShift {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }

    .auth-card {
      background: rgba(26, 31, 58, 0.95);
      backdrop-filter: blur(16px);
      padding: 3rem 2.5rem;
      border-radius: 20px;
      width: 100%;
      max-width: 450px;
      text-align: center;
      border: 2px solid rgba(232, 160, 32, 0.4);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 10;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .auth-logo {
      font-size: 2rem;
      font-weight: bold;
      color: #e8a020;
      margin-bottom: 1.5rem;
      letter-spacing: -0.5px;
      text-shadow: 0 0 20px rgba(232, 160, 32, 0.5);
    }

    .auth-card h2 {
      font-size: 1.2rem;
      margin-bottom: 1.5rem;
      color: #b0b8cc;
      font-weight: 400;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .error-box {
      background: rgba(248, 113, 113, 0.15);
      border-left: 4px solid #ef4444;
      padding: 0.875rem;
      border-radius: 6px;
      color: #f87171;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      backdrop-filter: blur(8px);
    }

    .auth-card form {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .auth-card input {
      width: 100%;
      padding: 11px 14px;
      background: rgba(15, 18, 34, 0.8);
      border: 1px solid rgba(232, 160, 32, 0.25);
      border-radius: 8px;
      color: white;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .auth-card input:focus {
      outline: none;
      border-color: #e8a020;
      box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.15);
      background: rgba(15, 18, 34, 0.95);
    }

    .auth-card button {
      width: 100%;
      padding: 11px;
      background: linear-gradient(135deg, #e8a020, #d98810);
      border: none;
      border-radius: 8px;
      color: #0a0c15;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.95rem;
      margin-top: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 15px rgba(232, 160, 32, 0.3);
    }

    .auth-card button:hover:not(:disabled) {
      background: linear-gradient(135deg, #f0a835, #e89810);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(232, 160, 32, 0.4);
    }

    .auth-card button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .auth-card p {
      margin-top: 1.2rem;
      color: #9ca3af;
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
      text-shadow: 0 0 10px rgba(232, 160, 32, 0.5);
    }

    /* ===== PROTECTED APP ===== */
    .app {
      display: flex;
      min-height: 100vh;
      background: #0a0c15;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, rgba(8,12,22,0.98) 0%, rgba(15,18,34,0.95) 100%);
      backdrop-filter: blur(16px);
      border-right: 1px solid rgba(232, 160, 32, 0.15);
      padding: 1.5rem;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      z-index: 100;
      box-shadow: 8px 0 30px rgba(0, 0, 0, 0.5);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 2.5rem;
      padding: 0.8rem;
      background: rgba(232, 160, 32, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(232, 160, 32, 0.2);
    }

    .logo-glow {
      font-size: 1.6rem;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .logo-title {
      font-size: 1.1rem;
      font-weight: bold;
      color: #e8a020;
      letter-spacing: 1px;
    }

    .logo-subtitle {
      font-size: 0.65rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .sidebar-section {
      margin-bottom: 2rem;
    }

    .section-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: #7c85a0;
      margin-bottom: 0.8rem;
      letter-spacing: 1.2px;
      font-weight: 700;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.7rem 1rem;
      margin: 4px 0;
      border-radius: 8px;
      color: #b8c0dc;
      text-decoration: none;
      transition: all 0.2s;
      font-size: 0.9rem;
      border-left: 2px solid transparent;
    }

    .sidebar-item.active {
      background: rgba(232, 160, 32, 0.2);
      color: #e8a020;
      border-left-color: #e8a020;
      font-weight: 600;
      box-shadow: inset 4px 0 0 rgba(232, 160, 32, 0.3);
    }

    .sidebar-item:hover {
      background: rgba(232, 160, 32, 0.12);
      color: white;
      transform: translateX(4px);
    }

    .item-icon {
      font-size: 1.1rem;
    }

    .item-label {
      flex: 1;
    }

    .upgrade-card {
      background: linear-gradient(135deg, rgba(232, 160, 32, 0.2), rgba(200, 100, 20, 0.08));
      border-radius: 12px;
      padding: 1.2rem;
      text-align: center;
      margin: 2rem 0;
      border: 1px solid rgba(232, 160, 32, 0.3);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .upgrade-icon {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .upgrade-title {
      font-weight: bold;
      color: #e8a020;
      font-size: 0.9rem;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .upgrade-desc {
      font-size: 0.7rem;
      color: #9ca3af;
      margin-bottom: 0.8rem;
    }

    .upgrade-btn {
      background: linear-gradient(135deg, #e8a020, #d98810);
      border: none;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      width: 100%;
      color: #0a0c15;
      font-weight: 700;
      font-size: 0.8rem;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .upgrade-btn:hover {
      background: linear-gradient(135deg, #f0a835, #e89810);
      transform: scale(1.05);
    }

    .logout-btn {
      width: 100%;
      background: rgba(248, 113, 113, 0.15);
      border: 1px solid rgba(248, 113, 113, 0.4);
      color: #f87171;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 2rem;
      font-weight: 700;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.85rem;
    }

    .logout-btn:hover {
      background: rgba(248, 113, 113, 0.25);
      border-color: #f87171;
    }

    /* ===== MAIN AREA ===== */
    .main-area {
      margin-left: 280px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 2rem;
      background: rgba(8, 12, 22, 0.7);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(232, 160, 32, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .date-time {
      font-size: 0.85rem;
      color: #b0b8cc;
      font-weight: 500;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #e8a020, #d98810);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0a0c15;
      font-weight: bold;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);
    }

    .page-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .page-content h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #ffffff;
      font-weight: 700;
    }

    .page-content h2 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      margin-top: 1.5rem;
      color: #e0e4f0;
      font-weight: 600;
    }

    .page-content h3 {
      font-size: 1.1rem;
      color: #e8a020;
      margin-bottom: 0.8rem;
      font-weight: 600;
    }

    /* ===== WELCOME BANNER ===== */
    .welcome-banner {
      background: linear-gradient(135deg, rgba(232, 160, 32, 0.2), rgba(232, 160, 32, 0.05));
      border-left: 4px solid #e8a020;
      padding: 1.2rem;
      border-radius: 8px;
      color: #e0e4f0;
      margin-bottom: 2rem;
      border: 1px solid rgba(232, 160, 32, 0.2);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    /* ===== STATS ===== */
    .stats-grid-large {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .stat-card {
      background: linear-gradient(135deg, rgba(26, 31, 58, 0.8), rgba(26, 31, 58, 0.4));
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(232, 160, 32, 0.15);
      text-align: center;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .stat-card:hover {
      border-color: rgba(232, 160, 32, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(232, 160, 32, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .stat-card.large {
      padding: 2rem;
    }

    .stat-card.success {
      border-color: rgba(34, 197, 94, 0.3);
    }

    .stat-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
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
      font-size: 2rem;
      font-weight: bold;
      color: #e8a020;
      font-variant-numeric: tabular-nums;
    }

    /* ===== HEATMAP ===== */
    .heatmap {
      background: #1a1f3a;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(232, 160, 32, 0.1);
    }

    .heatmap h3 {
      margin-bottom: 1rem;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
      margin-bottom: 1rem;
    }

    .heatmap-cell {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(232, 160, 32, 0.1);
    }

    .heatmap-cell:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);
    }

    .heatmap-legend {
      display: flex;
      gap: 1rem;
      justify-content: center;
      font-size: 0.8rem;
    }

    .heatmap-legend > div {
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      color: white;
      font-weight: 600;
    }

    /* ===== SESSION BREAKDOWN ===== */
    .session-breakdown {
      background: #1a1f3a;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(232, 160, 32, 0.1);
    }

    .session-breakdown h3 {
      margin-bottom: 1.5rem;
    }

    .session-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .session-card {
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid rgba(232, 160, 32, 0.2);
      text-align: center;
      background: rgba(26, 31, 58, 0.6);
      transition: all 0.2s;
    }

    .session-card:hover {
      transform: translateY(-2px);
    }

    .session-card.london {
      border-color: rgba(59, 130, 246, 0.3);
    }

    .session-card.ny {
      border-color: rgba(168, 85, 247, 0.3);
    }

    .session-card.asia {
      border-color: rgba(34, 197, 94, 0.3);
    }

    .session-name {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.8rem;
      color: #e8a020;
    }

    .session-stats {
      color: #b0b8cc;
      font-size: 0.9rem;
    }

    .win-rate {
      font-size: 1.2rem;
      font-weight: bold;
      color: #22c55e;
      margin-top: 0.3rem;
    }

    /* ===== TABLES ===== */
    .trade-table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(26, 31, 58, 0.7);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 1rem;
      border: 1px solid rgba(232, 160, 32, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .trade-table thead {
      background: rgba(8, 12, 22, 0.8);
      border-bottom: 2px solid rgba(232, 160, 32, 0.2);
    }

    .trade-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 0.5px;
    }

    .trade-table td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(232, 160, 32, 0.08);
      color: #e0e4f0;
      font-size: 0.9rem;
    }

    .trade-table tr:nth-child(even) {
      background: rgba(26, 31, 58, 0.4);
    }

    .trade-table tr:hover {
      background: rgba(232, 160, 32, 0.1);
    }

    /* ===== BADGES ===== */
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid;
    }

    .badge-win {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .badge-loss {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .badge-breakeven {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      border-color: rgba(251, 191, 36, 0.3);
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
      background: rgba(26, 31, 58, 0.8);
      border: 1px solid rgba(232, 160, 32, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .filters select:hover,
    .filters button:hover {
      border-color: #e8a020;
      background: rgba(232, 160, 32, 0.08);
    }

    .filters button {
      background: linear-gradient(135deg, #e8a020, #d98810);
      color: #0a0c15;
      font-weight: 700;
      border: none;
    }

    .filters button:hover {
      background: linear-gradient(135deg, #f0a835, #e89810);
      box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);
    }

    /* ===== FORMS ===== */
    form {
      background: linear-gradient(135deg, rgba(26, 31, 58, 0.7), rgba(26, 31, 58, 0.4));
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-end;
      border: 1px solid rgba(232, 160, 32, 0.15);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    input,
    select,
    textarea {
      background: rgba(15, 18, 34, 0.8);
      border: 1px solid rgba(232, 160, 32, 0.2);
      padding: 10px 12px;
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      transition: all 0.2s;
      font-family: inherit;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #e8a020;
      box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.15);
      background: rgba(15, 18, 34, 0.95);
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
      background: linear-gradient(135deg, #e8a020, #d98810);
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      color: #0a0c15;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);
    }

    button:hover {
      background: linear-gradient(135deg, #f0a835, #e89810);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(232, 160, 32, 0.4);
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
      box-shadow: none;
    }

    .action-btn.delete {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.4);
      box-shadow: none;
    }

    /* ===== TOAST NOTIFICATIONS ===== */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(26, 31, 58, 0.95);
      backdrop-filter: blur(8px);
      border-left: 4px solid #e8a020;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 2000;
      animation: slideIn 0.3s ease-out;
      color: #e8a020;
      font-weight: 600;
      border: 1px solid rgba(232, 160, 32, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .toast.error {
      border-left-color: #ef4444;
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
    }

    .toast.success {
      border-left-color: #22c55e;
      color: #22c55e;
      border-color: rgba(34, 197, 94, 0.2);
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

    /* ===== PRE-CHECK MODAL ===== */
    .pre-check-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: linear-gradient(135deg, rgba(26, 31, 58, 0.95), rgba(26, 31, 58, 0.85));
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      border: 1px solid rgba(232, 160, 32, 0.3);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    }

    .modal-content h2 {
      color: #e8a020;
      margin-bottom: 1.5rem;
    }

    .checklist-items {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      margin-bottom: 1.5rem;
    }

    .checklist-items label {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      cursor: pointer;
      color: #b0b8cc;
      transition: 0.2s;
    }

    .checklist-items label:hover {
      color: #e8a020;
    }

    .checklist-items input {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    /* ===== LOADING ===== */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.1rem;
      color: #e8a020;
      background: linear-gradient(135deg, #0a0c15 0%, #0f1222 100%);
      flex-direction: column;
      gap: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .sidebar {
        width: 80px;
        padding: 1rem 0.5rem;
      }

      .logo, .sidebar .section-label, .upgrade-card {
        display: none;
      }

      .sidebar-item {
        justify-content: center;
        padding: 8px;
      }

      .item-label {
        display: none;
      }

      .main-area {
        margin-left: 80px;
      }

      .page-content {
        padding: 1rem;
      }

      .stats-grid-large {
        grid-template-columns: repeat(2, 1fr);
      }

      form {
        flex-direction: column;
      }

      input, select {
        min-width: 100%;
      }

      .session-grid {
        grid-template-columns: 1fr;
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
