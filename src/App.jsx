import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'https://web-production-2c4af.up.railway.app';

  // Form state
  const [formData, setFormData] = useState({
    pair: 'EURUSD',
    entryPrice: '',
    exitPrice: '',
    quantity: '1',
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: new Date().toISOString().slice(0, 16),
    tradeType: 'LONG',
    strategy: '',
    riskReward: '',
    notes: '',
    outcome: 'WIN',
  });

  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    avgRiskReward: 0,
    profitFactor: 0,
    totalPnL: 0,
  });

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to load user');
      }

      const userData = await response.json();
      setUser(userData);
      loadTrades();
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await fetch(`${API_URL}/api/trades`, {
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to load trades');

      const data = await response.json();
      setTrades(Array.isArray(data) ? data : []);
      calculateStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading trades:', err);
      setError('Failed to load trades');
    }
  };

  const calculateStats = (tradeList) => {
    if (!tradeList || tradeList.length === 0) {
      setStats({
        totalTrades: 0,
        winRate: 0,
        avgRiskReward: 0,
        profitFactor: 0,
        totalPnL: 0,
      });
      return;
    }

    const wins = tradeList.filter((t) => t.outcome === 'WIN').length;
    const losses = tradeList.filter((t) => t.outcome === 'LOSS').length;

    const totalRiskReward = tradeList.reduce(
      (sum, t) => sum + (parseFloat(t.riskReward) || 0),
      0
    );

    const winPnL = tradeList
      .filter((t) => t.outcome === 'WIN')
      .reduce((sum, t) => {
        return (
          sum +
          (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) *
            parseFloat(t.quantity || 1)
        );
      }, 0);

    const lossPnL = tradeList
      .filter((t) => t.outcome === 'LOSS')
      .reduce((sum, t) => {
        return (
          sum +
          (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) *
            parseFloat(t.quantity || 1)
        );
      }, 0);

    setStats({
      totalTrades: tradeList.length,
      winRate: ((wins / tradeList.length) * 100).toFixed(2),
      avgRiskReward: (totalRiskReward / tradeList.length).toFixed(2),
      profitFactor: lossPnL === 0 ? 0 : (Math.abs(winPnL) / Math.abs(lossPnL)).toFixed(2),
      totalPnL: (winPnL + lossPnL).toFixed(2),
    });
  };

  const handleAddTrade = async () => {
    try {
      if (!formData.pair || !formData.entryPrice || !formData.exitPrice) {
        setError('Please fill in required fields');
        return;
      }

      const response = await fetch(`${API_URL}/api/trades`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save trade');

      setFormData({
        pair: 'EURUSD',
        entryPrice: '',
        exitPrice: '',
        quantity: '1',
        entryTime: new Date().toISOString().slice(0, 16),
        exitTime: new Date().toISOString().slice(0, 16),
        tradeType: 'LONG',
        strategy: '',
        riskReward: '',
        notes: '',
        outcome: 'WIN',
      });

      loadTrades();
      setCurrentPage('dashboard');
      setError(null);
    } catch (err) {
      setError('Failed to save trade');
      console.error(err);
    }
  };

  const handleDeleteTrade = async (tradeId) => {
    if (!window.confirm('Delete this trade?')) return;

    try {
      const response = await fetch(`${API_URL}/api/trades/${tradeId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete trade');
      loadTrades();
    } catch (err) {
      setError('Failed to delete trade');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const colors = {
    bg: '#0a0e27',
    card: '#1a1f3a',
    accent: '#e8a020',
    text: '#ffffff',
    textSecondary: '#b0b8cc',
    success: '#4ade80',
    danger: '#f87171',
    warning: '#fbbf24',
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: colors.card,
          borderBottom: `1px solid ${colors.accent}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: colors.accent,
            margin: 0,
          }}
        >
          TTM Journal
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>{user?.name || 'Trader'}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: colors.danger,
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <nav
          style={{
            width: '200px',
            backgroundColor: colors.card,
            borderRight: `1px solid ${colors.accent}`,
            padding: '1.5rem 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {[
            { name: 'dashboard', label: '📊 Dashboard' },
            { name: 'log', label: '📝 Log Trade' },
            { name: 'trades', label: '📋 Trade Log' },
            { name: 'analytics', label: '📈 Analytics' },
            { name: 'summary', label: '✅ Summary' },
          ].map((page) => (
            <button
              key={page.name}
              onClick={() => setCurrentPage(page.name)}
              style={{
                backgroundColor:
                  currentPage === page.name ? colors.accent : 'transparent',
                color: currentPage === page.name ? '#000' : colors.text,
                border: 'none',
                padding: '0.75rem 1.5rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: currentPage === page.name ? 'bold' : 'normal',
              }}
            >
              {page.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: colors.danger,
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Dashboard */}
          {currentPage === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
                Dashboard
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                {[
                  { label: 'Total Trades', value: stats.totalTrades },
                  { label: 'Win Rate', value: `${stats.winRate}%` },
                  { label: 'Avg RR', value: stats.avgRiskReward },
                  { label: 'Profit Factor', value: stats.profitFactor },
                  { label: 'Total P&L', value: `$${stats.totalPnL}` },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: colors.card,
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${colors.accent}`,
                    }}
                  >
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        color: colors.accent,
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage('log')}
                style={{
                  backgroundColor: colors.accent,
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                + Log New Trade
              </button>
            </div>
          )}

          {/* Log Trade */}
          {currentPage === 'log' && (
            <div>
              <h2>Log New Trade</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  backgroundColor: colors.card,
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                }}
              >
                {[
                  { label: 'Pair', key: 'pair', type: 'text' },
                  { label: 'Entry Price', key: 'entryPrice', type: 'number', step: '0.00001' },
                  { label: 'Exit Price', key: 'exitPrice', type: 'number', step: '0.00001' },
                  { label: 'Quantity', key: 'quantity', type: 'number' },
                  { label: 'Entry Time', key: 'entryTime', type: 'datetime-local' },
                  { label: 'Exit Time', key: 'exitTime', type: 'datetime-local' },
                  { label: 'Type', key: 'tradeType', type: 'select', options: ['LONG', 'SHORT'] },
                  { label: 'Strategy', key: 'strategy', type: 'text' },
                  { label: 'Risk/Reward', key: 'riskReward', type: 'number', step: '0.1' },
                  { label: 'Outcome', key: 'outcome', type: 'select', options: ['WIN', 'LOSS', 'BREAKEVEN'] },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.key]: e.target.value })
                        }
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#0a0e27',
                          color: colors.text,
                          border: `1px solid ${colors.accent}`,
                          borderRadius: '0.25rem',
                          marginTop: '0.25rem',
                        }}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        step={field.step}
                        value={formData[field.key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.key]: e.target.value })
                        }
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#0a0e27',
                          color: colors.text,
                          border: `1px solid ${colors.accent}`,
                          borderRadius: '0.25rem',
                          marginTop: '0.25rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginTop: '1rem',
                  backgroundColor: colors.card,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: '0.25rem',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleAddTrade}
                style={{
                  marginTop: '1rem',
                  backgroundColor: colors.accent,
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Save Trade
              </button>
            </div>
          )}

          {/* Trade Log */}
          {currentPage === 'trades' && (
            <div>
              <h2>Trade Log</h2>
              {trades.length === 0 ? (
                <p style={{ color: colors.textSecondary }}>No trades yet. Create one!</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.accent}` }}>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Pair</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Entry</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Exit</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Outcome</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => (
                        <tr key={trade._id} style={{ borderBottom: `1px solid ${colors.card}` }}>
                          <td style={{ padding: '1rem' }}>{trade.pair}</td>
                          <td style={{ padding: '1rem' }}>
                            ${parseFloat(trade.entryPrice).toFixed(5)}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            ${parseFloat(trade.exitPrice).toFixed(5)}
                          </td>
                          <td style={{ padding: '1rem' }}>{trade.tradeType}</td>
                          <td
                            style={{
                              padding: '1rem',
                              color:
                                trade.outcome === 'WIN'
                                  ? colors.success
                                  : trade.outcome === 'LOSS'
                                  ? colors.danger
                                  : colors.warning,
                            }}
                          >
                            {trade.outcome}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <button
                              onClick={() => handleDeleteTrade(trade._id)}
                              style={{
                                backgroundColor: colors.danger,
                                color: 'white',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {currentPage === 'analytics' && (
            <div>
              <h2>Analytics</h2>
              <div
                style={{
                  backgroundColor: colors.card,
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.accent}`,
                }}
              >
                <p style={{ color: colors.textSecondary }}>
                  Detailed analytics coming soon...
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          {currentPage === 'summary' && (
            <div>
              <h2>Trading Summary</h2>
              <div
                style={{
                  backgroundColor: colors.card,
                  padding: '2rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.accent}`,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Total Trades</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {stats.totalTrades}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Win Rate</div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: colors.success,
                      }}
                    >
                      {stats.winRate}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Total P&L</div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: stats.totalPnL > 0 ? colors.success : colors.danger,
                      }}
                    >
                      ${stats.totalPnL}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Profit Factor</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {stats.profitFactor}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
