import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-2c4af.up.railway.app';

// ==================== STYLES ====================
const styles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #1a1f3a;
  --secondary: #2d3561;
  --accent: #00d4ff;
  --accent-alt: #00ffaa;
  --text-primary: #ffffff;
  --text-secondary: #a0aec0;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --border: #3d4573;
  --card-bg: #242b48;
  --input-bg: #1a1f3a;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f3a 100%);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
}

/* ========== LAYOUT ========== */
.app-container {
  display: flex;
  height: 100vh;
  background: var(--primary);
}

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1a1f3a 0%, #151a2f 100%);
  border-right: 1px solid var(--border);
  padding: 24px 0;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

.logo {
  padding: 0 24px 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-item {
  padding: 12px 24px;
  margin: 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.05);
  color: var(--accent);
  border-left-color: var(--accent);
}

.nav-item.active {
  background: rgba(0, 212, 255, 0.1);
  color: var(--accent);
  border-left-color: var(--accent);
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f3a 100%);
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

/* ========== HEADER ========== */
.page-header {
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 212, 255, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-alt) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--primary);
}

.user-name {
  font-size: 13px;
  font-weight: 600;
}

/* ========== BUTTONS ========== */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent) 0%, #0099cc 100%);
  color: var(--primary);
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--secondary);
  border-color: var(--accent);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

/* ========== CARDS ========== */
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title-icon {
  font-size: 20px;
}

/* ========== STAT CARDS ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-alt) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.1);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  font-weight: 600;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-change {
  font-size: 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: var(--success);
}

.stat-change.negative {
  color: var(--danger);
}

/* ========== FORMS ========== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
  background: rgba(0, 212, 255, 0.02);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* ========== TABLE ========== */
.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead {
  background: rgba(0, 212, 255, 0.05);
  border-bottom: 2px solid var(--border);
}

.table th {
  padding: 16px;
  text-align: left;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.table tbody tr:hover {
  background: rgba(0, 212, 255, 0.03);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* ========== BADGES ========== */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.badge-info {
  background: rgba(0, 212, 255, 0.2);
  color: var(--accent);
}

/* ========== MODAL ========== */
.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.modal-overlay.active {
  display: flex;
}

.modal {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: var(--accent);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

/* ========== TABS ========== */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  transition: color 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.tab:hover {
  color: var(--accent);
}

.tab.active {
  color: var(--accent);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-alt) 100%);
}

/* ========== RATING ========== */
.rating {
  display: flex;
  gap: 8px;
  align-items: center;
}

.star {
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.star:hover,
.star.active {
  color: var(--warning);
  transform: scale(1.2);
}

/* ========== TOAST ========== */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2000;
  animation: slideInRight 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
}

.toast.success {
  border-left: 4px solid var(--success);
}

.toast.error {
  border-left: 4px solid var(--danger);
}

.toast.info {
  border-left: 4px solid var(--accent);
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== LOADING ========== */
.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 70px;
    padding: 0 20px;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }

  .logo {
    padding: 0;
    margin: 0;
    border: none;
  }

  .nav-item {
    padding: 12px 16px;
    margin: 0;
    white-space: nowrap;
  }

  .main-content {
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    padding: 20px;
  }
}
`;

// ==================== COMPONENTS ====================

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      {message}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup 
        ? { name, email, password }
        : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a1f3a 100%)',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ffaa 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            📈
          </div>
          <h1 style={{ fontSize: '28px', color: '#fff', marginBottom: '8px', fontWeight: '700' }}>
            TTM Journal Pro
          </h1>
          <p style={{ color: '#a0aec0', fontSize: '14px' }}>
            Professional Trading Journal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '0' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>

          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              background: 'none',
              color: '#00d4ff',
              cursor: 'pointer',
              marginTop: '16px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ trades, user }) {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const losses = trades.filter(t => t.outcome === 'loss').length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : 0;
  const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
  
  const chartData = trades.map(t => ({
    date: new Date(t.date).toLocaleDateString(),
    pnl: parseFloat(t.pnl) || 0,
  })).slice(-30);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Trading Performance Overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">📊 Total Trades</div>
          <div className="stat-value">{totalTrades}</div>
          <div className="stat-change positive">↑ All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Winning Trades</div>
          <div className="stat-value">{wins}</div>
          <div className="stat-change positive">+{wins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">❌ Losing Trades</div>
          <div className="stat-value">{losses}</div>
          <div className="stat-change negative">-{losses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📈 Win Rate</div>
          <div className="stat-value">{winRate}%</div>
          <div className="stat-change positive">Professional</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💰 Total P&L</div>
          <div className="stat-value" style={{ color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
            ${totalPnL.toFixed(2)}
          </div>
          <div className={`stat-change ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {totalPnL >= 0 ? '↑' : '↓'} Performance
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">📊</span>
            30-Day Performance
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d4573" />
              <XAxis dataKey="date" stroke="#a0aec0" />
              <YAxis stroke="#a0aec0" />
              <Tooltip
                contentStyle={{
                  background: '#242b48',
                  border: '1px solid #3d4573',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {trades.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">📋</span>
            Recent Trades
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Direction</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Result</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(-5).reverse().map(trade => (
                  <tr key={trade._id}>
                    <td>{new Date(trade.date).toLocaleDateString()}</td>
                    <td><strong>{trade.pair}</strong></td>
                    <td>
                      <span className={`badge ${trade.direction === 'long' ? 'badge-success' : 'badge-danger'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td>{trade.entryPrice.toFixed(4)}</td>
                    <td>{trade.exitPrice.toFixed(4)}</td>
                    <td>
                      <span className={`badge badge-${trade.outcome === 'win' ? 'success' : trade.outcome === 'loss' ? 'danger' : 'warning'}`}>
                        {trade.outcome}
                      </span>
                    </td>
                    <td style={{ color: trade.pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      ${trade.pnl?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TradeLog({ onAddTrade, trades }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    direction: 'long',
    outcome: 'win',
    strategy: '',
    emotion: 'calm',
    rating: 3,
    pnl: 0,
  });

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate P&L
      if (['entryPrice', 'exitPrice', 'quantity', 'direction'].includes(field)) {
        const entry = parseFloat(updated.entryPrice) || 0;
        const exit = parseFloat(updated.exitPrice) || 0;
        const qty = parseFloat(updated.quantity) || 0;
        const diff = updated.direction === 'long' ? (exit - entry) * qty : (entry - exit) * qty;
        updated.pnl = diff;
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editId 
        ? `${API_URL}/api/trades/${editId}`
        : `${API_URL}/api/trades`;
      
      const method = editId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onAddTrade();
        setShowForm(false);
        setEditId(null);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          pair: '',
          entryPrice: '',
          exitPrice: '',
          quantity: '',
          direction: 'long',
          outcome: 'win',
          strategy: '',
          emotion: 'calm',
          rating: 3,
          pnl: 0,
        });
      }
    } catch (err) {
      console.error('Error saving trade:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trade Log</h1>
          <p className="page-subtitle">Record and Manage Your Trades</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Trade'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency Pair</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EURUSD"
                  value={formData.pair}
                  onChange={(e) => handleChange('pair', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entry Price</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.0001"
                  value={formData.entryPrice}
                  onChange={(e) => handleChange('entryPrice', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exit Price</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.0001"
                  value={formData.exitPrice}
                  onChange={(e) => handleChange('exitPrice', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity (Lots)</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Direction</label>
                <select
                  className="form-select"
                  value={formData.direction}
                  onChange={(e) => handleChange('direction', e.target.value)}
                >
                  <option value="long">Long 📈</option>
                  <option value="short">Short 📉</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Strategy</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Breakout, Reversal"
                  value={formData.strategy}
                  onChange={(e) => handleChange('strategy', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emotion</label>
                <select
                  className="form-select"
                  value={formData.emotion}
                  onChange={(e) => handleChange('emotion', e.target.value)}
                >
                  <option value="calm">😊 Calm</option>
                  <option value="confident">💪 Confident</option>
                  <option value="fearful">😰 Fearful</option>
                  <option value="fomo">🚀 FOMO</option>
                  <option value="frustrated">😤 Frustrated</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Outcome</label>
                <select
                  className="form-select"
                  value={formData.outcome}
                  onChange={(e) => handleChange('outcome', e.target.value)}
                >
                  <option value="win">✅ Win</option>
                  <option value="loss">❌ Loss</option>
                  <option value="breakeven">⚖️ Breakeven</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${formData.rating >= star ? 'active' : ''}`}
                      onClick={() => handleChange('rating', star)}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Calculated P&L</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.pnl}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary">
                {editId ? '✓ Update Trade' : '+ Add Trade'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {trades.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">📋</span>
            All Trades
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Direction</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Qty</th>
                  <th>Result</th>
                  <th>P&L</th>
                  <th>Emotion</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade._id}>
                    <td>{new Date(trade.date).toLocaleDateString()}</td>
                    <td><strong>{trade.pair}</strong></td>
                    <td><span className={`badge ${trade.direction === 'long' ? 'badge-success' : 'badge-danger'}`}>{trade.direction}</span></td>
                    <td>{trade.entryPrice?.toFixed(4)}</td>
                    <td>{trade.exitPrice?.toFixed(4)}</td>
                    <td>{trade.quantity}</td>
                    <td><span className={`badge badge-${trade.outcome === 'win' ? 'success' : trade.outcome === 'loss' ? 'danger' : 'warning'}`}>{trade.outcome}</span></td>
                    <td style={{ color: trade.pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      ${trade.pnl?.toFixed(2) || '0.00'}
                    </td>
                    <td>{trade.emotion}</td>
                    <td>{'⭐'.repeat(trade.rating)}</td>
                    <td>
                      <button className="btn btn-small btn-secondary" onClick={() => {
                        setFormData(trade);
                        setEditId(trade._id);
                        setShowForm(true);
                      }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Analytics({ trades }) {
  const pairStats = {};
  const strategyStats = {};

  trades.forEach(t => {
    if (!pairStats[t.pair]) {
      pairStats[t.pair] = { wins: 0, losses: 0, total: 0 };
    }
    if (!strategyStats[t.strategy]) {
      strategyStats[t.strategy] = { wins: 0, losses: 0, total: 0 };
    }

    pairStats[t.pair].total++;
    strategyStats[t.strategy].total++;

    if (t.outcome === 'win') {
      pairStats[t.pair].wins++;
      strategyStats[t.strategy].wins++;
    } else if (t.outcome === 'loss') {
      pairStats[t.pair].losses++;
      strategyStats[t.strategy].losses++;
    }
  });

  const pairData = Object.entries(pairStats).map(([pair, stats]) => ({
    name: pair,
    'Win Rate': ((stats.wins / stats.total) * 100).toFixed(1),
    Wins: stats.wins,
    Losses: stats.losses,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Performance Analysis by Pair & Strategy</p>
        </div>
      </div>

      {pairData.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">📊</span>
            Pair Performance
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pairData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d4573" />
              <XAxis dataKey="name" stroke="#a0aec0" />
              <YAxis stroke="#a0aec0" />
              <Tooltip
                contentStyle={{
                  background: '#242b48',
                  border: '1px solid #3d4573',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="Wins" fill="#10b981" />
              <Bar dataKey="Losses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {pairData.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">📈</span>
            Detailed Statistics
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Total Trades</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {pairData.map(row => (
                  <tr key={row.name}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.Wins + row.Losses}</td>
                    <td><span className="badge badge-success">{row.Wins}</span></td>
                    <td><span className="badge badge-danger">{row.Losses}</span></td>
                    <td><strong style={{ color: '#00d4ff' }}>{row['Win Rate']}%</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Settings({ user, onLogout }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      alert('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account & Preferences</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">👤</span>
          Profile Information
        </div>
        <div style={{ padding: '20px 0', borderBottom: '1px solid #3d4573' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '4px' }}>Name</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{user?.name}</p>
          </div>
          <div>
            <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '4px' }}>Email</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">🔒</span>
          Change Password
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">🚪</span>
          Session
        </div>
        <button className="btn btn-danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (token) {
      fetchTrades();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchTrades = async () => {
    try {
      const response = await fetch(`${API_URL}/api/trades`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setTrades(data || []);
    } catch (err) {
      console.error('Error fetching trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (!token) {
    return (
      <>
        <style>{styles}</style>
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your trading data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <div className="sidebar">
          <div className="logo">
            <div className="logo-icon">📈</div>
            <div className="logo-text">TTM Journal</div>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'trade-log', label: 'Trade Log', icon: '📝' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <div className="main-content">
          <div className="page-header" style={{ position: 'absolute', top: '20px', right: '32px', marginBottom: 0 }}>
            <div className="user-info">
              <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <span className="user-name">{user?.name}</span>
            </div>
          </div>

          {currentPage === 'dashboard' && <Dashboard trades={trades} user={user} />}
          {currentPage === 'trade-log' && <TradeLog onAddTrade={fetchTrades} trades={trades} />}
          {currentPage === 'analytics' && <Analytics trades={trades} />}
          {currentPage === 'settings' && <Settings user={user} onLogout={handleLogout} />}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
