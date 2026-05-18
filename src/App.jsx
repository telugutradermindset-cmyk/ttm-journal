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
  const [editingTrade, setEditingTrade] = useState(null);

  const API_URL = 'https://web-production-2c4af.up.railway.app';

  // Filter states
  const [filterPair, setFilterPair] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

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

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Rules state
  const [rules, setRules] = useState('');
  const [editingRules, setEditingRules] = useState(false);

  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    avgRiskReward: 0,
    profitFactor: 0,
    totalPnL: 0,
    winningTrades: 0,
    losingTrades: 0,
    breakevenTrades: 0,
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
      setProfileForm({ name: userData.name, email: userData.email, oldPassword: '', newPassword: '', confirmPassword: '' });
      setRules(userData.rules || '');
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

  // Filter trades
  const getFilteredTrades = () => {
    return trades.filter((trade) => {
      if (filterPair && trade.pair !== filterPair) return false;
      if (filterOutcome && trade.outcome !== filterOutcome) return false;
      if (filterStrategy && trade.strategy !== filterStrategy) return false;
      if (filterDateFrom && new Date(trade.entryTime) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(trade.entryTime) > new Date(filterDateTo)) return false;
      return true;
    });
  };

  const calculateStats = (tradeList) => {
    if (!tradeList || tradeList.length === 0) {
      setStats({
        totalTrades: 0,
        winRate: 0,
        avgRiskReward: 0,
        profitFactor: 0,
        totalPnL: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
      });
      return;
    }

    const wins = tradeList.filter((t) => t.outcome === 'WIN').length;
    const losses = tradeList.filter((t) => t.outcome === 'LOSS').length;
    const breakevens = tradeList.filter((t) => t.outcome === 'BREAKEVEN').length;

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
      winningTrades: wins,
      losingTrades: losses,
      breakevenTrades: breakevens,
    });
  };

  const handleAddTrade = async () => {
    try {
      if (!formData.pair || !formData.entryPrice || !formData.exitPrice) {
        setError('Please fill in required fields');
        return;
      }

      const method = editingTrade ? 'PUT' : 'POST';
      const url = editingTrade 
        ? `${API_URL}/api/trades/${editingTrade._id}`
        : `${API_URL}/api/trades`;

      const response = await fetch(url, {
        method,
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
      setEditingTrade(null);

      loadTrades();
      setCurrentPage('dashboard');
      setError(null);
    } catch (err) {
      setError('Failed to save trade');
      console.error(err);
    }
  };

  const handleEditTrade = (trade) => {
    setFormData({
      pair: trade.pair,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity || '1',
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

  const handleSaveRules = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ rules }),
      });

      if (!response.ok) throw new Error('Failed to save rules');
      setEditingRules(false);
      setError(null);
    } catch (err) {
      setError('Failed to save rules');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (profileForm.newPassword) {
        const response = await fetch(`${API_URL}/api/user/change-password`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            oldPassword: profileForm.oldPassword,
            newPassword: profileForm.newPassword,
          }),
        });

        if (!response.ok) throw new Error('Failed to update password');
      }

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: profileForm.name }),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      setProfileForm({ ...profileForm, oldPassword: '', newPassword: '', confirmPassword: '' });
      setError(null);
      loadUser();
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleExportCSV = () => {
    const filteredTrades = getFilteredTrades();
    if (filteredTrades.length === 0) {
      setError('No trades to export');
      return;
    }

    let csv = 'Pair,Entry Price,Exit Price,Quantity,Entry Time,Exit Time,Type,Strategy,Risk/Reward,Outcome,Notes\n';
    
    filteredTrades.forEach((trade) => {
      csv += `${trade.pair},${trade.entryPrice},${trade.exitPrice},${trade.quantity || 1},"${trade.entryTime}","${trade.exitTime}",${trade.tradeType},"${trade.strategy || ''}",${trade.riskReward || ''},"${trade.outcome}","${(trade.notes || '').replace(/"/g, '""')}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `ttm-journal-trades-${new Date().toISOString().slice(0, 10)}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

  const filteredTrades = getFilteredTrades();

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
            { name: 'rules', label: '📖 Rules' },
            { name: 'profile', label: '👤 Profile' },
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
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
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
                  { label: 'Wins', value: stats.winningTrades, color: colors.success },
                  { label: 'Losses', value: stats.losingTrades, color: colors.danger },
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
                        color: stat.color || colors.accent,
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
              <h2>{editingTrade ? '✏️ Edit Trade' : '📝 Log New Trade'}</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  backgroundColor: colors.card,
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
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
                  marginBottom: '1rem',
                  backgroundColor: colors.card,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: '0.25rem',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleAddTrade}
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
                  {editingTrade ? '✅ Update Trade' : '💾 Save Trade'}
                </button>
                {editingTrade && (
                  <button
                    onClick={() => {
                      setEditingTrade(null);
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
                    }}
                    style={{
                      backgroundColor: colors.textSecondary,
                      color: '#000',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trade Log */}
          {currentPage === 'trades' && (
            <div>
              <h2>📋 Trade Log</h2>
              
              {/* Filters */}
              <div
                style={{
                  backgroundColor: colors.card,
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  border: `1px solid ${colors.accent}`,
                }}
              >
                <h3 style={{ marginTop: 0, color: colors.accent }}>🔍 Filters</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Filter by pair (e.g., EURUSD)"
                    value={filterPair}
                    onChange={(e) => setFilterPair(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                    }}
                  />
                  <select
                    value={filterOutcome}
                    onChange={(e) => setFilterOutcome(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                    }}
                  >
                    <option value="">All Outcomes</option>
                    <option value="WIN">WIN</option>
                    <option value="LOSS">LOSS</option>
                    <option value="BREAKEVEN">BREAKEVEN</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Filter by strategy"
                    value={filterStrategy}
                    onChange={(e) => setFilterStrategy(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                    }}
                  />
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                    }}
                  />
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                    }}
                  />
                  <button
                    onClick={() => {
                      setFilterPair('');
                      setFilterOutcome('');
                      setFilterStrategy('');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }}
                    style={{
                      backgroundColor: colors.warning,
                      color: '#000',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      backgroundColor: colors.success,
                      color: '#000',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    📥 Export CSV
                  </button>
                </div>
                <div style={{ marginTop: '1rem', color: colors.textSecondary }}>
                  Showing {filteredTrades.length} of {trades.length} trades
                </div>
              </div>

              {filteredTrades.length === 0 ? (
                <p style={{ color: colors.textSecondary }}>No trades found. Try adjusting filters!</p>
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
                        <th style={{ padding: '1rem', textAlign: 'left' }}>P&L</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Outcome</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade) => {
                        const pnl = (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * parseFloat(trade.quantity || 1);
                        return (
                          <tr key={trade._id} style={{ borderBottom: `1px solid ${colors.card}` }}>
                            <td style={{ padding: '1rem' }}>{trade.pair}</td>
                            <td style={{ padding: '1rem' }}>
                              ${parseFloat(trade.entryPrice).toFixed(5)}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              ${parseFloat(trade.exitPrice).toFixed(5)}
                            </td>
                            <td
                              style={{
                                padding: '1rem',
                                color: pnl > 0 ? colors.success : pnl < 0 ? colors.danger : colors.warning,
                                fontWeight: 'bold',
                              }}
                            >
                              ${pnl.toFixed(2)}
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
                                onClick={() => handleEditTrade(trade)}
                                style={{
                                  backgroundColor: colors.accent,
                                  color: '#000',
                                  border: 'none',
                                  padding: '0.35rem 0.75rem',
                                  marginRight: '0.5rem',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                }}
                              >
                                ✏️
                              </button>
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
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {currentPage === 'analytics' && (
            <div>
              <h2>📈 Analytics</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {/* Pair Performance */}
                <div
                  style={{
                    backgroundColor: colors.card,
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  <h3 style={{ marginTop: 0, color: colors.accent }}>💱 Pair Performance</h3>
                  {trades.length === 0 ? (
                    <p style={{ color: colors.textSecondary }}>No trades yet</p>
                  ) : (
                    <>
                      {Array.from(new Set(trades.map((t) => t.pair))).map((pair) => {
                        const pairTrades = trades.filter((t) => t.pair === pair);
                        const wins = pairTrades.filter((t) => t.outcome === 'WIN').length;
                        const total = pairTrades.length;
                        const winRate = ((wins / total) * 100).toFixed(2);
                        return (
                          <div
                            key={pair}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.75rem 0',
                              borderBottom: `1px solid ${colors.card}`,
                            }}
                          >
                            <span>{pair}</span>
                            <span style={{ color: colors.success }}>
                              {wins}/{total} ({winRate}%)
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Strategy Performance */}
                <div
                  style={{
                    backgroundColor: colors.card,
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  <h3 style={{ marginTop: 0, color: colors.accent }}>🎯 Strategy Performance</h3>
                  {trades.length === 0 ? (
                    <p style={{ color: colors.textSecondary }}>No trades yet</p>
                  ) : (
                    <>
                      {Array.from(new Set(trades.map((t) => t.strategy || 'No Strategy'))).map((strategy) => {
                        const strategyTrades = trades.filter((t) => (t.strategy || 'No Strategy') === strategy);
                        const wins = strategyTrades.filter((t) => t.outcome === 'WIN').length;
                        const total = strategyTrades.length;
                        const winRate = ((wins / total) * 100).toFixed(2);
                        return (
                          <div
                            key={strategy}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.75rem 0',
                              borderBottom: `1px solid ${colors.card}`,
                            }}
                          >
                            <span>{strategy}</span>
                            <span style={{ color: colors.success }}>
                              {wins}/{total} ({winRate}%)
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Monthly Stats */}
                <div
                  style={{
                    backgroundColor: colors.card,
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  <h3 style={{ marginTop: 0, color: colors.accent }}>📅 This Month</h3>
                  {trades.length === 0 ? (
                    <p style={{ color: colors.textSecondary }}>No trades yet</p>
                  ) : (
                    <>
                      {(() => {
                        const now = new Date();
                        const monthTrades = trades.filter((t) => {
                          const tradeDate = new Date(t.entryTime);
                          return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
                        });
                        const wins = monthTrades.filter((t) => t.outcome === 'WIN').length;
                        const losses = monthTrades.filter((t) => t.outcome === 'LOSS').length;
                        const total = monthTrades.length;

                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                              <span>Total Trades:</span>
                              <span style={{ fontWeight: 'bold' }}>{total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                              <span>Wins:</span>
                              <span style={{ color: colors.success, fontWeight: 'bold' }}>{wins}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                              <span>Losses:</span>
                              <span style={{ color: colors.danger, fontWeight: 'bold' }}>{losses}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: `1px solid ${colors.card}` }}>
                              <span>Win Rate:</span>
                              <span style={{ color: colors.accent, fontWeight: 'bold' }}>
                                {total > 0 ? ((wins / total) * 100).toFixed(2) : 0}%
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rules */}
          {currentPage === 'rules' && (
            <div>
              <h2>📖 Trading Rules</h2>
              <div
                style={{
                  backgroundColor: colors.card,
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.accent}`,
                }}
              >
                {editingRules ? (
                  <>
                    <textarea
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="Write your trading rules, checklist, and guidelines here..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        minHeight: '400px',
                        backgroundColor: '#0a0e27',
                        color: colors.text,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: '0.25rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={handleSaveRules}
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
                        💾 Save Rules
                      </button>
                      <button
                        onClick={() => setEditingRules(false)}
                        style={{
                          backgroundColor: colors.danger,
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        minHeight: '200px',
                        padding: '1rem',
                        backgroundColor: '#0a0e27',
                        borderRadius: '0.25rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {rules || 'No rules yet. Click edit to add your trading rules.'}
                    </div>
                    <button
                      onClick={() => setEditingRules(true)}
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
                      ✏️ Edit Rules
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Profile */}
          {currentPage === 'profile' && (
            <div>
              <h2>👤 Profile Settings</h2>
              <div
                style={{
                  backgroundColor: colors.card,
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.accent}`,
                  maxWidth: '500px',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
                    NAME
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
                    EMAIL (Read-only)
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.textSecondary,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <hr style={{ borderColor: colors.accent, margin: '2rem 0' }} />

                <h3 style={{ color: colors.accent, marginTop: 0 }}>Change Password</h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
                    CURRENT PASSWORD
                  </label>
                  <input
                    type="password"
                    value={profileForm.oldPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
                    NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    value={profileForm.newPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
                    CONFIRM PASSWORD
                  </label>
                  <input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '0.5rem',
                      backgroundColor: '#0a0e27',
                      color: colors.text,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  onClick={handleUpdateProfile}
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
                  💾 Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          {currentPage === 'summary' && (
            <div>
              <h2>✅ Trading Summary</h2>
              <div
                style={{
                  backgroundColor: colors.card,
                  padding: '2rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.accent}`,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ backgroundColor: '#0a0e27', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Total Trades</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.accent }}>
                      {stats.totalTrades}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0a0e27', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Winning Trades</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.success }}>
                      {stats.winningTrades}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0a0e27', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Losing Trades</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.danger }}>
                      {stats.losingTrades}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0a0e27', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Win Rate</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.accent }}>
                      {stats.winRate}%
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0a0e27', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Profit Factor</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.accent }}>
                      {stats.profitFactor}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0a0e27', padding: '1.5rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Total P&L</div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: stats.totalPnL > 0 ? colors.success : colors.danger,
                      }}
                    >
                      ${stats.totalPnL}
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
