import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from './apiService';
import './App.css';

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    pair: 'EURUSD',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    entryTime: '',
    exitTime: '',
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

  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    dayWins: {},
    pairStats: {},
    strategyStats: {},
  });

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await apiService.getMe();
        setUser(userData);
        loadTrades();
      } catch (err) {
        navigate('/login');
      }
    };
    loadUser();
  }, [navigate]);

  // Load trades
  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTrades();
      setTrades(data);
      calculateStats(data);
      calculateAnalytics(data);
    } catch (err) {
      setError('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const calculateStats = (tradeList) => {
    if (tradeList.length === 0) {
      setStats({ totalTrades: 0, winRate: 0, avgRiskReward: 0, profitFactor: 0, totalPnL: 0 });
      return;
    }

    const wins = tradeList.filter((t) => t.outcome === 'WIN').length;
    const losses = tradeList.filter((t) => t.outcome === 'LOSS').length;
    const breakevens = tradeList.filter((t) => t.outcome === 'BREAKEVEN').length;

    const totalRiskReward = tradeList.reduce((sum, t) => sum + (parseFloat(t.riskReward) || 0), 0);
    const winPnL = tradeList.filter((t) => t.outcome === 'WIN').reduce((sum, t) => {
      return sum + ((parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.quantity));
    }, 0);
    const lossPnL = tradeList.filter((t) => t.outcome === 'LOSS').reduce((sum, t) => {
      return sum + ((parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.quantity));
    }, 0);

    setStats({
      totalTrades: tradeList.length,
      winRate: ((wins / tradeList.length) * 100).toFixed(2),
      avgRiskReward: (totalRiskReward / tradeList.length).toFixed(2),
      profitFactor: lossPnL === 0 ? 0 : (Math.abs(winPnL) / Math.abs(lossPnL)).toFixed(2),
      totalPnL: (winPnL + lossPnL).toFixed(2),
    });
  };

  // Calculate analytics
  const calculateAnalytics = (tradeList) => {
    const dayWins = {};
    const pairStats = {};
    const strategyStats = {};

    tradeList.forEach((trade) => {
      const date = trade.entryTime ? new Date(trade.entryTime).toLocaleDateString() : 'Unknown';
      dayWins[date] = (dayWins[date] || 0) + (trade.outcome === 'WIN' ? 1 : 0);

      pairStats[trade.pair] = pairStats[trade.pair] || { wins: 0, total: 0 };
      pairStats[trade.pair].total += 1;
      if (trade.outcome === 'WIN') pairStats[trade.pair].wins += 1;

      strategyStats[trade.strategy] = strategyStats[trade.strategy] || { wins: 0, total: 0 };
      strategyStats[trade.strategy].total += 1;
      if (trade.outcome === 'WIN') strategyStats[trade.strategy].wins += 1;
    });

    setAnalyticsData({ dayWins, pairStats, strategyStats });
  };

  // Add/Update trade
  const handleAddTrade = async () => {
    try {
      if (!formData.pair || !formData.entryPrice || !formData.exitPrice) {
        setError('Please fill in required fields');
        return;
      }

      if (editingTrade) {
        await apiService.updateTrade(editingTrade._id, formData);
        setEditingTrade(null);
      } else {
        await apiService.addTrade(formData);
      }

      setFormData({
        pair: 'EURUSD',
        entryPrice: '',
        exitPrice: '',
        quantity: '',
        entryTime: '',
        exitTime: '',
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
    }
  };

  // Delete trade
  const handleDeleteTrade = async (tradeId) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await apiService.deleteTrade(tradeId);
        loadTrades();
      } catch (err) {
        setError('Failed to delete trade');
      }
    }
  };

  // Edit trade
  const handleEditTrade = (trade) => {
    setFormData({
      pair: trade.pair,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity || '',
      entryTime: trade.entryTime ? trade.entryTime.slice(0, 16) : '',
      exitTime: trade.exitTime ? trade.exitTime.slice(0, 16) : '',
      tradeType: trade.tradeType,
      strategy: trade.strategy || '',
      riskReward: trade.riskReward || '',
      notes: trade.notes || '',
      outcome: trade.outcome,
    });
    setEditingTrade(trade);
    setCurrentPage('log');
  };

  // Logout
  const handleLogout = async () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // UI Colors
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

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.text, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.accent}`, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.accent, margin: 0 }}>TTM Journal</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>{user?.name || 'Trader'}</span>
          <button onClick={handleLogout} style={{ backgroundColor: colors.danger, color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <nav style={{ width: '200px', backgroundColor: colors.card, borderRight: `1px solid ${colors.accent}`, padding: '1.5rem 0', display: 'flex', flexDirection: 'column' }}>
          {[
            { name: 'dashboard', label: '📊 Dashboard' },
            { name: 'log', label: '📝 Log Trade' },
            { name: 'trades', label: '📋 Trade Log' },
            { name: 'analytics', label: '📈 Analytics' },
            { name: 'summary', label: '✅ Final Summary' },
            { name: 'rules', label: '📖 Rules' },
          ].map((page) => (
            <button
              key={page.name}
              onClick={() => setCurrentPage(page.name)}
              style={{
                backgroundColor: currentPage === page.name ? colors.accent : 'transparent',
                color: currentPage === page.name ? '#000' : colors.text,
                border: 'none',
                padding: '0.75rem 1.5rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: currentPage === page.name ? 'bold' : 'normal',
                fontSize: '0.9rem',
              }}
            >
              {page.label}
            </button>
          ))}
        </nav>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {error && (
            <div style={{ backgroundColor: colors.danger, color: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {loading && <div>Loading...</div>}

          {/* Dashboard */}
          {currentPage === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Dashboard</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Trades', value: stats.totalTrades },
                  { label: 'Win Rate', value: `${stats.winRate}%` },
                  { label: 'Avg Risk/Reward', value: stats.avgRiskReward },
                  { label: 'Profit Factor', value: stats.profitFactor },
                  { label: 'Total P&L', value: `$${stats.totalPnL}` },
                ].map((stat, idx) => (
                  <div key={idx} style={{ backgroundColor: colors.card, padding: '1.5rem', borderRadius: '0.5rem', border: `1px solid ${colors.accent}` }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: colors.accent }}>{stat.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setCurrentPage('log')} style={{ backgroundColor: colors.accent, color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                + Log New Trade
              </button>
            </div>
          )}

          {/* Log Trade */}
          {currentPage === 'log' && (
            <div>
              <h2>{editingTrade ? 'Edit Trade' : 'Log New Trade'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Currency Pair', key: 'pair', type: 'text' },
                  { label: 'Entry Price', key: 'entryPrice', type: 'number' },
                  { label: 'Exit Price', key: 'exitPrice', type: 'number' },
                  { label: 'Quantity', key: 'quantity', type: 'number' },
                  { label: 'Entry Time', key: 'entryTime', type: 'datetime-local' },
                  { label: 'Exit Time', key: 'exitTime', type: 'datetime-local' },
                  { label: 'Trade Type', key: 'tradeType', type: 'select', options: ['LONG', 'SHORT'] },
                  { label: 'Strategy', key: 'strategy', type: 'text' },
                  { label: 'Risk/Reward', key: 'riskReward', type: 'number' },
                  { label: 'Outcome', key: 'outcome', type: 'select', options: ['WIN', 'LOSS', 'BREAKEVEN'] },
                ].map((field) => (
                  <div key={field.key}>
                    <label>{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', backgroundColor: colors.card, color: colors.text, border: `1px solid ${colors.accent}`, borderRadius: '0.25rem' }}
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', backgroundColor: colors.card, color: colors.text, border: `1px solid ${colors.accent}`, borderRadius: '0.25rem' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', marginTop: '1rem', backgroundColor: colors.card, color: colors.text, border: `1px solid ${colors.accent}`, borderRadius: '0.25rem', minHeight: '100px' }}
              />
              <button onClick={handleAddTrade} style={{ marginTop: '1rem', backgroundColor: colors.accent, color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingTrade ? 'Update Trade' : 'Save Trade'}
              </button>
              {editingTrade && (
                <button onClick={() => { setEditingTrade(null); setFormData({ pair: 'EURUSD', entryPrice: '', exitPrice: '', quantity: '', entryTime: '', exitTime: '', tradeType: 'LONG', strategy: '', riskReward: '', notes: '', outcome: 'WIN' }); }} style={{ marginTop: '1rem', marginLeft: '0.5rem', backgroundColor: colors.textSecondary, color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* Trade Log */}
          {currentPage === 'trades' && (
            <div>
              <h2>Trade Log</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                        <td style={{ padding: '1rem' }}>${parseFloat(trade.entryPrice).toFixed(2)}</td>
                        <td style={{ padding: '1rem' }}>${parseFloat(trade.exitPrice).toFixed(2)}</td>
                        <td style={{ padding: '1rem' }}>{trade.tradeType}</td>
                        <td style={{ padding: '1rem', color: trade.outcome === 'WIN' ? colors.success : trade.outcome === 'LOSS' ? colors.danger : colors.warning }}>
                          {trade.outcome}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => handleEditTrade(trade)} style={{ backgroundColor: colors.accent, color: '#000', border: 'none', padding: '0.35rem 0.75rem', marginRight: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteTrade(trade._id)} style={{ backgroundColor: colors.danger, color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics */}
          {currentPage === 'analytics' && (
            <div>
              <h2>Analytics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ backgroundColor: colors.card, padding: '1.5rem', borderRadius: '0.5rem', border: `1px solid ${colors.accent}` }}>
                  <h3>Pair Performance</h3>
                  {Object.entries(analyticsData.pairStats).map(([pair, stats]) => (
                    <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${colors.card}` }}>
                      <span>{pair}</span>
                      <span>{stats.wins}/{stats.total} wins</span>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: colors.card, padding: '1.5rem', borderRadius: '0.5rem', border: `1px solid ${colors.accent}` }}>
                  <h3>Strategy Performance</h3>
                  {Object.entries(analyticsData.strategyStats).map(([strategy, stats]) => (
                    <div key={strategy} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${colors.card}` }}>
                      <span>{strategy || 'No Strategy'}</span>
                      <span>{stats.wins}/{stats.total} wins</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Final Summary */}
          {currentPage === 'summary' && (
            <div>
              <h2>Final Summary</h2>
              <div style={{ backgroundColor: colors.card, padding: '2rem', borderRadius: '0.5rem', border: `1px solid ${colors.accent}` }}>
                <h3 style={{ color: colors.accent }}>Session Statistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Total Trades</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalTrades}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Win Rate</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.success }}>{stats.winRate}%</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Total P&L</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.totalPnL > 0 ? colors.success : colors.danger }}>
                      ${stats.totalPnL}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary }}>Profit Factor</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.profitFactor}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rules */}
          {currentPage === 'rules' && (
            <div>
              <h2>Trading Rules</h2>
              <div style={{ backgroundColor: colors.card, padding: '1.5rem', borderRadius: '0.5rem', border: `1px solid ${colors.accent}` }}>
                <h3>Create and manage your trading rules here</h3>
                <textarea
                  placeholder="Write your trading rules, checklist, and guidelines here..."
                  defaultValue={user?.rules || ''}
                  style={{ width: '100%', padding: '1rem', minHeight: '300px', backgroundColor: '#0a0e27', color: colors.text, border: `1px solid ${colors.accent}`, borderRadius: '0.25rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
