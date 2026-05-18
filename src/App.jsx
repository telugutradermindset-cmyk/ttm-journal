import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { tradesAPI } from './apiService';

const App = () => {
  // ===================== COLOR SCHEME =====================
  const C = {
    bg: "#03080c",
    bgPanel: "#0a0f14",
    bgInput: "#0d1218",
    border: "#1a2332",
    text: "#e4e6eb",
    textSecondary: "#9ca3af",
    accent: "#e8a020",
    accentLight: "#f0b23b",
    green: "#00c853",
    red: "#ff1744",
    yellow: "#ffd600",
    blue: "#1e88e5",
    purple: "#9c27b0",
    hover: "#1a2332",
  };

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ===================== DROPDOWNS DATA =====================
  const PAIRS = [
    "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
    "EUR/GBP", "EUR/JPY", "GBP/JPY", "CHF/USD", "NZD/USD",
    "EUR/CHF", "AUD/JPY", "GBP/AUD", "XAU/USD", "BTC/USD"
  ];

  const SESSIONS = [
    "Asian Session", "London Session", "New York Session", "Sydney Session", "Overnight"
  ];

  const SETUPS = [
    "Support/Resistance", "Trend Following", "Breakout", "Range Trading",
    "Pullback", "Scalp", "News Trade", "Other"
  ];

  const EMOTIONS = [
    "Confident", "Neutral", "Anxious", "Frustrated",
    "Greedy", "Fearful", "Impatient", "Focused"
  ];

  const GRADES = ["A+", "A", "B", "C", "D", "F"];
  const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

  // ===================== STATE MANAGEMENT =====================
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Form state for new trade
  const emptyForm = {
    date: new Date().toISOString().split('T')[0],
    pair: PAIRS[0],
    direction: 'Long',
    entryTime: '09:00',
    entryPrice: '',
    exitTime: '10:00',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    riskAmount: '',
    rewardAmount: '',
    lotSize: '',
    pipsGained: '',
    session: SESSIONS[0],
    setup: SETUPS[0],
    confluences: [],
    emotion: EMOTIONS[0],
    mistake: '',
    outcome: 'Win',
    tradeIdea: '',
    executionNotes: '',
    lessonLearned: '',
    grade: GRADES[0],
    timeframe: TIMEFRAMES[4],
  };

  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPair, setFilterPair] = useState('All Pairs');
  const [summaryPeriod, setSummaryPeriod] = useState('week');

  // ===================== MT5 STATE =====================
  const [mt5Connected, setMt5Connected] = useState(false);
  const [mt5Account, setMt5Account] = useState(null);
  const [mt5OpenTrades, setMt5OpenTrades] = useState([]);
  const [mt5History, setMt5History] = useState([]);
  const [mt5Error, setMt5Error] = useState('');
  const [mt5HistoryDays, setMt5HistoryDays] = useState(30);
  const [mt5ActiveAccount, setMt5ActiveAccount] = useState(0);
  const [mt5Switching, setMt5Switching] = useState(false);
  const [mt5Accounts, setMt5Accounts] = useState([]);

  const MT5_URL = 'http://127.0.0.1:5000';

  // ===================== API FUNCTIONS =====================
  const loadTradesFromAPI = async () => {
    try {
      setLoading(true);
      const response = await tradesAPI.getAllTrades();
      setTrades(response.data);
    } catch (error) {
      console.error('Failed to load trades:', error);
      alert('Failed to load trades. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const saveTradeToAPI = async (trade) => {
    try {
      if (editingId) {
        await tradesAPI.updateTrade(editingId, trade);
      } else {
        await tradesAPI.createTrade(trade);
      }
      await loadTradesFromAPI();
      return true;
    } catch (error) {
      console.error('Failed to save trade:', error);
      alert('Failed to save trade: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };

  const deleteTradeFromAPI = async (id) => {
    try {
      await tradesAPI.deleteTrade(id);
      await loadTradesFromAPI();
    } catch (error) {
      console.error('Failed to delete trade:', error);
      alert('Failed to delete trade');
    }
  };

  // ===================== LOAD DATA ON MOUNT =====================
  useEffect(() => {
    loadTradesFromAPI();
  }, []);

  // ===================== MT5 FUNCTIONS =====================
  const fetchMt5Data = useCallback(async () => {
    try {
      const statusRes = await fetch(`${MT5_URL}/status`);
      const status = await statusRes.json();
      if (!status.connected) {
        setMt5Connected(false);
        setMt5Error('MT5 not connected. Make sure mt5_bridge.py is running.');
        return;
      }
      setMt5Connected(true);
      setMt5Error('');
      const [accountRes, openRes, , accountsRes] = await Promise.all([
        fetch(`${MT5_URL}/account`),
        fetch(`${MT5_URL}/open-trades`),
        fetch(`${MT5_URL}/summary`),
        fetch(`${MT5_URL}/accounts`),
      ]);
      setMt5Account(await accountRes.json());
      setMt5OpenTrades(await openRes.json());
      const accs = await accountsRes.json();
      setMt5Accounts(accs);
      const active = accs.findIndex(a => a.active);
      if (active >= 0) setMt5ActiveAccount(active);
    } catch (e) {
      setMt5Connected(false);
      setMt5Error('Cannot reach MT5 bridge. Make sure mt5_bridge.py is running.');
    }
  }, []);

  const fetchMt5History = useCallback(async (days) => {
    try {
      const res = await fetch(`${MT5_URL}/history/${days}`);
      setMt5History(await res.json());
    } catch (e) {}
  }, []);

  const switchMt5Account = useCallback(async (index) => {
    setMt5Switching(true);
    try {
      const res = await fetch(`${MT5_URL}/switch-account/${index}`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setMt5ActiveAccount(index);
        await fetchMt5Data();
        await fetchMt5History(mt5HistoryDays);
      } else {
        setMt5Error(result.error || 'Failed to switch account');
      }
    } catch (e) {
      setMt5Error('Failed to switch account');
    }
    setMt5Switching(false);
  }, [fetchMt5Data, fetchMt5History, mt5HistoryDays]);

  useEffect(() => {
    if (currentPage === 'mt5') {
      setMt5Loading(true);
      fetchMt5Data().finally(() => setMt5Loading(false));
      fetchMt5History(mt5HistoryDays);
      const interval = setInterval(() => fetchMt5Data(), 10000);
      return () => clearInterval(interval);
    }
  }, [currentPage, mt5HistoryDays, fetchMt5Data, fetchMt5History]);

  // ===================== FORM HANDLERS =====================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await saveTradeToAPI(formData);
    if (success) {
      setFormData(emptyForm);
      setEditingId(null);
      setCurrentPage('trade-log');
    }
  };

  const handleEdit = (trade) => {
    setFormData(trade);
    setEditingId(trade._id);
    setCurrentPage('log-trade');
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  // ===================== CALCULATIONS =====================
  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.pair?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.outcome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPair = filterPair === 'All Pairs' || t.pair === filterPair;
    return matchesSearch && matchesPair;
  });

  const getPeriodTrades = () => {
    const now = new Date();
    const trades_sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (summaryPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return trades_sorted.filter(t => new Date(t.date) >= weekAgo);
    } else if (summaryPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return trades_sorted.filter(t => new Date(t.date) >= monthAgo);
    }
    return trades_sorted;
  };

  const calculateStats = (tradesArray) => {
    if (tradesArray.length === 0) return {
      totalTrades: 0, wins: 0, losses: 0, winRate: '0%',
      totalProfit: 0, profitFactor: 0, avgWin: 0, avgLoss: 0,
      longestWinStreak: 0, longestLossStreak: 0,
    };

    const wins = tradesArray.filter(t => t.outcome === 'Win').length;
    const losses = tradesArray.length - wins;
    const winRate = ((wins / tradesArray.length) * 100).toFixed(1);

    const winPips = tradesArray
      .filter(t => t.outcome === 'Win')
      .reduce((sum, t) => sum + (parseFloat(t.pipsGained) || 0), 0);
    const lossPips = tradesArray
      .filter(t => t.outcome === 'Loss')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.pipsGained) || 0), 0);

    const profitFactor = lossPips > 0 ? (winPips / lossPips).toFixed(2) : (winPips > 0 ? '∞' : 0);

    let longestWinStreak = 0, longestLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
    tradesArray.forEach(t => {
      if (t.outcome === 'Win') {
        currentWinStreak++;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else {
        currentLossStreak++;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
        currentWinStreak = 0;
      }
    });

    return {
      totalTrades: tradesArray.length,
      wins,
      losses,
      winRate,
      totalProfit: winPips.toFixed(2),
      profitFactor,
      avgWin: wins > 0 ? (winPips / wins).toFixed(2) : 0,
      avgLoss: losses > 0 ? (lossPips / losses).toFixed(2) : 0,
      longestWinStreak,
      longestLossStreak,
    };
  };

  const allStats = calculateStats(trades);
  const periodStats = calculateStats(getPeriodTrades());

  // ===================== RENDER FUNCTIONS =====================
  const renderDashboard = () => {
    const recentTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const topPairs = Object.entries(
      trades.reduce((acc, t) => ({ ...acc, [t.pair]: (acc[t.pair] || 0) + 1 }), {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
      <div className="dashboard">
        <h1>📈 Dashboard</h1>
        
        <div className="header-stats">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div className="stat-box" style={{ borderColor: C.accent }}>
              <div className="stat-label">Total Trades</div>
              <div className="stat-value" style={{ color: C.accent }}>{allStats.totalTrades}</div>
            </div>
            <div className="stat-box" style={{ borderColor: C.green }}>
              <div className="stat-label">Win Rate</div>
              <div className="stat-value" style={{ color: C.green }}>{allStats.winRate}%</div>
            </div>
            <div className="stat-box" style={{ borderColor: C.blue }}>
              <div className="stat-label">Profit Factor</div>
              <div className="stat-value" style={{ color: C.blue }}>{allStats.profitFactor}</div>
            </div>
            <div className="stat-box" style={{ borderColor: C.yellow }}>
              <div className="stat-label">Total Pips</div>
              <div className="stat-value" style={{ color: C.yellow }}>{allStats.totalProfit}</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2>Recent Trades</h2>
            {recentTrades.length === 0 ? (
              <p style={{ color: C.textSecondary }}>No trades yet. Start logging!</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pair</th>
                      <th>Direction</th>
                      <th>Outcome</th>
                      <th>Pips</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map(trade => (
                      <tr key={trade._id}>
                        <td>{trade.date}</td>
                        <td style={{ fontWeight: 'bold', color: C.accent }}>{trade.pair}</td>
                        <td style={{ color: trade.direction === 'Long' ? C.green : C.red }}>{trade.direction}</td>
                        <td style={{ color: trade.outcome === 'Win' ? C.green : C.red }}>{trade.outcome}</td>
                        <td style={{ fontWeight: 'bold' }}>{trade.pipsGained}</td>
                        <td style={{ color: C.accent }}>{trade.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Top Pairs</h2>
            {topPairs.length === 0 ? (
              <p style={{ color: C.textSecondary }}>No data yet</p>
            ) : (
              <div style={{ marginTop: '12px' }}>
                {topPairs.map(([pair, count]) => (
                  <div key={pair} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ color: C.accent }}>{pair}</span>
                    <span style={{ fontWeight: 'bold' }}>{count} trades</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLogTrade = () => {
    return (
      <div className="log-trade">
        <h1>{editingId ? '✏️ Edit Trade' : '📝 Log Trade'}</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Trade Details</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Pair</label>
                <select name="pair" value={formData.pair} onChange={handleInputChange} required>
                  {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Direction</label>
                <select name="direction" value={formData.direction} onChange={handleInputChange} required>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>
              <div className="form-group">
                <label>Outcome</label>
                <select name="outcome" value={formData.outcome} onChange={handleInputChange} required>
                  <option value="Win">Win</option>
                  <option value="Loss">Loss</option>
                  <option value="Break Even">Break Even</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Entry & Exit</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Entry Time</label>
                <input type="time" name="entryTime" value={formData.entryTime} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Entry Price</label>
                <input type="number" name="entryPrice" value={formData.entryPrice} onChange={handleInputChange} step="0.00001" />
              </div>
              <div className="form-group">
                <label>Exit Time</label>
                <input type="time" name="exitTime" value={formData.exitTime} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Exit Price</label>
                <input type="number" name="exitPrice" value={formData.exitPrice} onChange={handleInputChange} step="0.00001" />
              </div>
              <div className="form-group">
                <label>Stop Loss</label>
                <input type="number" name="stopLoss" value={formData.stopLoss} onChange={handleInputChange} step="0.00001" />
              </div>
              <div className="form-group">
                <label>Take Profit</label>
                <input type="number" name="takeProfit" value={formData.takeProfit} onChange={handleInputChange} step="0.00001" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Risk & Reward</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Lot Size</label>
                <input type="number" name="lotSize" value={formData.lotSize} onChange={handleInputChange} step="0.01" />
              </div>
              <div className="form-group">
                <label>Risk Amount ($)</label>
                <input type="number" name="riskAmount" value={formData.riskAmount} onChange={handleInputChange} step="0.01" />
              </div>
              <div className="form-group">
                <label>Reward Amount ($)</label>
                <input type="number" name="rewardAmount" value={formData.rewardAmount} onChange={handleInputChange} step="0.01" />
              </div>
              <div className="form-group">
                <label>Pips Gained</label>
                <input type="number" name="pipsGained" value={formData.pipsGained} onChange={handleInputChange} step="0.1" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Setup & Context</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Session</label>
                <select name="session" value={formData.session} onChange={handleInputChange}>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Setup Type</label>
                <select name="setup" value={formData.setup} onChange={handleInputChange}>
                  {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Timeframe</label>
                <select name="timeframe" value={formData.timeframe} onChange={handleInputChange}>
                  {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Grade</label>
                <select name="grade" value={formData.grade} onChange={handleInputChange}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Emotion</label>
                <select name="emotion" value={formData.emotion} onChange={handleInputChange}>
                  {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Notes</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Trade Idea</label>
                <textarea name="tradeIdea" value={formData.tradeIdea} onChange={handleInputChange} rows="2"></textarea>
              </div>
              <div className="form-group full-width">
                <label>Execution Notes</label>
                <textarea name="executionNotes" value={formData.executionNotes} onChange={handleInputChange} rows="2"></textarea>
              </div>
              <div className="form-group full-width">
                <label>Lesson Learned</label>
                <textarea name="lessonLearned" value={formData.lessonLearned} onChange={handleInputChange} rows="2"></textarea>
              </div>
              <div className="form-group full-width">
                <label>Mistakes</label>
                <textarea name="mistake" value={formData.mistake} onChange={handleInputChange} rows="2"></textarea>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? '💾 Update Trade' : '➕ Save Trade'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  };

  const renderTradeLog = () => {
    return (
      <div className="trade-log">
        <h1>📋 Trade Log</h1>

        <div className="filter-section">
          <input
            type="text"
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={filterPair} onChange={(e) => setFilterPair(e.target.value)}>
            <option>All Pairs</option>
            {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {filteredTrades.length === 0 ? (
          <p style={{ color: C.textSecondary }}>No trades found</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Dir</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>SL</th>
                  <th>TP</th>
                  <th>Pips</th>
                  <th>Outcome</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(trade => (
                  <tr key={trade._id}>
                    <td>{trade.date}</td>
                    <td style={{ fontWeight: 'bold', color: C.accent }}>{trade.pair}</td>
                    <td style={{ color: trade.direction === 'Long' ? C.green : C.red }}>{trade.direction[0]}</td>
                    <td>{parseFloat(trade.entryPrice).toFixed(5)}</td>
                    <td>{parseFloat(trade.exitPrice).toFixed(5)}</td>
                    <td>{parseFloat(trade.stopLoss).toFixed(5)}</td>
                    <td>{parseFloat(trade.takeProfit).toFixed(5)}</td>
                    <td style={{ fontWeight: 'bold' }}>{trade.pipsGained}</td>
                    <td style={{ color: trade.outcome === 'Win' ? C.green : C.red }}>{trade.outcome}</td>
                    <td style={{ color: C.accent }}>{trade.grade}</td>
                    <td style={{ fontSize: '12px', display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-action"
                        onClick={() => handleEdit(trade)}
                        style={{ color: C.accent }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => {
                          if (window.confirm('Delete this trade?')) {
                            deleteTradeFromAPI(trade._id);
                          }
                        }}
                        style={{ color: C.red }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => {
    const getGradeBreakdown = () => {
      const breakdown = {};
      GRADES.forEach(g => {
        breakdown[g] = trades.filter(t => t.grade === g).length;
      });
      return breakdown;
    };

    const getSetupBreakdown = () => {
      const breakdown = {};
      SETUPS.forEach(s => {
        const setupTrades = trades.filter(t => t.setup === s);
        const wins = setupTrades.filter(t => t.outcome === 'Win').length;
        breakdown[s] = {
          total: setupTrades.length,
          wins,
          winRate: setupTrades.length > 0 ? ((wins / setupTrades.length) * 100).toFixed(1) : 0,
        };
      });
      return breakdown;
    };

    const gradeBreakdown = getGradeBreakdown();
    const setupBreakdown = getSetupBreakdown();

    return (
      <div className="analytics">
        <h1>📊 Analysis</h1>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setSummaryPeriod('week')}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              background: summaryPeriod === 'week' ? C.accent : C.bgPanel,
              color: summaryPeriod === 'week' ? '#000' : C.text,
              border: `1px solid ${C.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setSummaryPeriod('month')}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              background: summaryPeriod === 'month' ? C.accent : C.bgPanel,
              color: summaryPeriod === 'month' ? '#000' : C.text,
              border: `1px solid ${C.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            This Month
          </button>
          <button
            onClick={() => setSummaryPeriod('all')}
            style={{
              padding: '8px 16px',
              background: summaryPeriod === 'all' ? C.accent : C.bgPanel,
              color: summaryPeriod === 'all' ? '#000' : C.text,
              border: `1px solid ${C.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            All Time
          </button>
        </div>

        <div className="analytics-grid">
          <div className="analytics-section">
            <h2>Performance Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Trades</div>
                <div className="metric-value" style={{ color: C.accent }}>{periodStats.totalTrades}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Win Rate</div>
                <div className="metric-value" style={{ color: C.green }}>{periodStats.winRate}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Wins</div>
                <div className="metric-value" style={{ color: C.green }}>{periodStats.wins}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Losses</div>
                <div className="metric-value" style={{ color: C.red }}>{periodStats.losses}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Profit Factor</div>
                <div className="metric-value" style={{ color: C.blue }}>{periodStats.profitFactor}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Win</div>
                <div className="metric-value" style={{ color: C.green }}>+{periodStats.avgWin}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Loss</div>
                <div className="metric-value" style={{ color: C.red }}>-{periodStats.avgLoss}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Pips</div>
                <div className="metric-value" style={{ color: C.yellow }}>{periodStats.totalProfit}</div>
              </div>
            </div>
          </div>

          <div className="analytics-section">
            <h2>Grade Distribution</h2>
            <div style={{ marginTop: '12px' }}>
              {GRADES.map(grade => (
                <div key={grade} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.accent }}>{grade}</span>
                  <span style={{ fontWeight: 'bold' }}>{gradeBreakdown[grade] || 0} trades</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-section">
            <h2>Setup Win Rate</h2>
            <div style={{ marginTop: '12px' }}>
              {Object.entries(setupBreakdown)
                .filter(([, data]) => data.total > 0)
                .sort((a, b) => b[1].winRate - a[1].winRate)
                .map(([setup, data]) => (
                  <div key={setup} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ color: C.textSecondary }}>{setup}</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: parseFloat(data.winRate) > 50 ? C.green : C.red,
                    }}>
                      {data.winRate}% ({data.wins}/{data.total})
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinalSummary = () => {
    return (
      <div>
        <h1>🏆 Final Summary</h1>
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2>Overall Statistics</h2>
            <div style={{ marginTop: '15px' }}>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.textSecondary, fontSize: '12px' }}>Total Trades</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.accent }}>{allStats.totalTrades}</div>
              </div>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.textSecondary, fontSize: '12px' }}>Win Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.green }}>{allStats.winRate}%</div>
              </div>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.textSecondary, fontSize: '12px' }}>Profit Factor</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.blue }}>{allStats.profitFactor}</div>
              </div>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.textSecondary, fontSize: '12px' }}>Total Pips</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.yellow }}>{allStats.totalProfit}</div>
              </div>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.textSecondary, fontSize: '12px' }}>Longest Win Streak</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.green }}>{allStats.longestWinStreak}</div>
              </div>
              <div>
                <div style={{ color: C.textSecondary, fontSize: '12px' }}>Longest Loss Streak</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: C.red }}>{allStats.longestLossStreak}</div>
              </div>
            </div>
          </div>
          <div className="dashboard-section">
            <h2>Key Insights</h2>
            <ul style={{ marginTop: '15px', listStyle: 'none' }}>
              <li style={{ marginBottom: '10px', color: C.textSecondary }}>
                📌 You've completed <span style={{ color: C.accent, fontWeight: 'bold' }}>{allStats.totalTrades}</span> trades
              </li>
              <li style={{ marginBottom: '10px', color: C.textSecondary }}>
                ✅ Your win rate is <span style={{ color: allStats.winRate > 50 ? C.green : C.red, fontWeight: 'bold' }}>{allStats.winRate}%</span>
              </li>
              <li style={{ marginBottom: '10px', color: C.textSecondary }}>
                📊 Average win: <span style={{ color: C.green, fontWeight: 'bold' }}>+{allStats.avgWin}</span> pips
              </li>
              <li style={{ marginBottom: '10px', color: C.textSecondary }}>
                📉 Average loss: <span style={{ color: C.red, fontWeight: 'bold' }}>-{allStats.avgLoss}</span> pips
              </li>
              <li style={{ marginBottom: '10px', color: C.textSecondary }}>
                🔥 Best streak: <span style={{ color: C.green, fontWeight: 'bold' }}>{allStats.longestWinStreak}</span> wins
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderRules = () => {
    const rules = [
      { title: '📏 Risk Management', items: ['Never risk more than 2% per trade', 'Always use stop loss', 'Risk-Reward ratio min 1:2'] },
      { title: '🎯 Entry Rules', items: ['Wait for confirmation', 'Trade at key levels', 'Avoid news events'] },
      { title: '⛔ Exit Rules', items: ['Follow your stop loss', 'Take profit at target', 'Move SL to breakeven after +2% profit'] },
      { title: '🧠 Psychological', items: ['Never trade on emotion', 'Journal every trade', 'Review weekly'] },
      { title: '⏰ Time Management', items: ['Trade only during liquid hours', 'No revenge trading', 'Take breaks after 3 losses'] },
      { title: '📊 Analysis', items: ['Check higher timeframe', 'Look for confluence', 'Avoid over-trading'] },
    ];

    return (
      <div className="rules">
        <h1>📚 Trading Rules</h1>
        <div className="rules-grid">
          {rules.map((rule, idx) => (
            <div key={idx} className="rule-card">
              <h3>{rule.title}</h3>
              <ul>
                {rule.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMt5 = () => {
    return (
      <div>
        <h1>🔗 MT5 Sync</h1>

        {mt5Error && (
          <div style={{
            background: C.red,
            color: '#fff',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            ⚠️ {mt5Error}
          </div>
        )}

        {mt5Connected && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: C.accent, fontWeight: 'bold', marginRight: '10px' }}>Switch Account:</label>
              <select
                value={mt5ActiveAccount}
                onChange={(e) => switchMt5Account(parseInt(e.target.value))}
                disabled={mt5Switching}
                style={{
                  padding: '8px 10px',
                  background: C.bgInput,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: '4px',
                }}
              >
                {mt5Accounts.map((acc, idx) => (
                  <option key={idx} value={idx}>{acc.name} ({acc.balance})</option>
                ))}
              </select>
            </div>

            {mt5Account && (
              <div className="dashboard-section" style={{ marginBottom: '20px' }}>
                <h2>Account Info</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' }}>
                  <div>
                    <div style={{ color: C.textSecondary, fontSize: '12px' }}>Balance</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: C.accent }}>${mt5Account.balance}</div>
                  </div>
                  <div>
                    <div style={{ color: C.textSecondary, fontSize: '12px' }}>Equity</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: C.accent }}>${mt5Account.equity}</div>
                  </div>
                </div>
              </div>
            )}

            {mt5OpenTrades.length > 0 && (
              <div className="dashboard-section" style={{ marginBottom: '20px' }}>
                <h2>Open Trades ({mt5OpenTrades.length})</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Volume</th>
                        <th>Open Price</th>
                        <th>Current Price</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mt5OpenTrades.map(t => (
                        <tr key={t.ticket}>
                          <td>{t.ticket}</td>
                          <td style={{ fontWeight: 'bold', color: C.accent }}>{t.symbol}</td>
                          <td style={{ color: t.type === 'buy' ? C.green : C.red }}>{t.type}</td>
                          <td>{t.volume}</td>
                          <td>{t.open_price.toFixed(5)}</td>
                          <td>{t.current_price.toFixed(5)}</td>
                          <td style={{
                            fontWeight: 'bold',
                            color: t.profit >= 0 ? C.green : C.red,
                          }}>
                            ${t.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {mt5History.length > 0 && (
              <div className="dashboard-section">
                <h2>Trade History (Last {mt5HistoryDays} days)</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Close Time</th>
                        <th>Symbol</th>
                        <th>Entry</th>
                        <th>Volume</th>
                        <th>Price</th>
                        <th>Profit</th>
                        <th>Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mt5History.map((d, idx) => (
                        <tr key={idx}>
                          <td>{d.close_time}</td>
                          <td style={{ fontWeight: 'bold', color: C.accent }}>{d.symbol}</td>
                          <td style={{ color: d.entry === 'In' ? C.blue : C.yellow }}>{d.entry}</td>
                          <td>{d.volume}</td>
                          <td>{d.price}</td>
                          <td style={{ fontWeight: 'bold', color: d.profit >= 0 ? C.green : C.red }}>
                            {d.profit !== 0 ? `${d.profit >= 0 ? '+' : ''}$${d.profit}` : '—'}
                          </td>
                          <td style={{ color: C.red }}>{d.commission !== 0 ? `$${d.commission}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ===================== MAIN RENDER =====================
  return (
    <div className="app" style={{ background: C.bg, color: C.text }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Rajdhani', 'Courier New', monospace; background: ${C.bg}; color: ${C.text}; }
        .app { display: flex; height: 100vh; background: ${C.bg}; }

        .sidebar { width: 240px; background: ${C.bgPanel}; border-right: 1px solid ${C.border}; overflow-y: auto; padding: 20px 0; flex-shrink: 0; display: flex; flex-direction: column; }
        .sidebar-title { padding: 20px; font-size: 17px; font-weight: bold; color: ${C.accent}; border-bottom: 1px solid ${C.border}; text-align: center; }
        .sidebar-version { text-align: center; font-size: 11px; color: ${C.textSecondary}; padding: 6px; border-bottom: 1px solid ${C.border}; margin-bottom: 8px; }

        .nav-item { padding: 13px 20px; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; display: flex; align-items: center; gap: 10px; font-size: 14px; }
        .nav-item:hover { background: ${C.hover}; border-left-color: ${C.accent}; }
        .nav-item.active { background: rgba(232,160,32,0.1); border-left-color: ${C.accent}; color: ${C.accent}; }

        .main-content { flex: 1; overflow-y: auto; padding: 30px; background: ${C.bg}; }
        h1 { font-size: 26px; margin-bottom: 20px; color: ${C.accent}; font-weight: bold; }
        h2 { font-size: 18px; margin-bottom: 15px; color: ${C.text}; border-bottom: 1px solid ${C.border}; padding-bottom: 10px; }

        .dashboard { animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .header-stats { margin-bottom: 35px; }

        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-top: 20px; }
        .stat-box { background: ${C.bgPanel}; border: 1px solid; border-radius: 8px; padding: 18px; text-align: center; transition: all 0.2s; }
        .stat-box:hover { transform: translateY(-4px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .stat-label { font-size: 11px; text-transform: uppercase; color: ${C.textSecondary}; margin-bottom: 8px; font-weight: bold; letter-spacing: 0.5px; }
        .stat-value { font-size: 22px; font-weight: bold; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 25px; margin-bottom: 30px; }
        .dashboard-section { background: ${C.bgPanel}; border: 1px solid ${C.border}; border-radius: 8px; padding: 20px; }

        .table-container { overflow-x: auto; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 10px 12px; text-align: left; }
        th { background: rgba(232,160,32,0.08); color: ${C.accent}; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        tr:hover { background: ${C.hover}; }

        .log-trade { animation: fadeIn 0.3s; }
        .form-section { background: ${C.bgPanel}; border: 1px solid ${C.border}; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 18px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full-width { grid-column: 1 / -1; }
        label { margin-bottom: 6px; color: ${C.accent}; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        input, select, textarea { padding: 9px 10px; border: 1px solid ${C.border}; background: ${C.bgInput}; color: ${C.text}; border-radius: 4px; font-family: inherit; font-size: 13px; transition: all 0.2s; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${C.accent} !important; box-shadow: 0 0 5px rgba(232,160,32,0.25); }
        textarea { resize: vertical; }

        .form-actions { display: flex; gap: 15px; margin-top: 20px; padding-bottom: 30px; }
        .btn-primary { background: ${C.accent}; color: #000; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; font-family: inherit; font-size: 14px; }
        .btn-primary:hover { background: ${C.accentLight}; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(232,160,32,0.4); }
        .btn-secondary { background: ${C.red}; color: #fff; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; font-family: inherit; }
        .btn-secondary:hover { background: #ff4466; }
        .btn-action { background: none; border: none; cursor: pointer; font-weight: bold; padding: 4px 8px; border-radius: 3px; transition: all 0.2s; font-family: inherit; font-size: 12px; }
        .btn-action:hover { background: rgba(232,160,32,0.1); }

        .trade-log { animation: fadeIn 0.3s; }
        .filter-section { display: flex; gap: 12px; margin-bottom: 18px; }
        .filter-section input, .filter-section select { flex: 1; padding: 9px 10px; background: ${C.bgInput}; color: ${C.text}; border: 1px solid ${C.border}; border-radius: 4px; font-family: inherit; font-size: 13px; }

        .analytics { animation: fadeIn 0.3s; }
        .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 25px; margin-bottom: 25px; }
        .analytics-section { background: ${C.bgPanel}; border: 1px solid ${C.border}; border-radius: 8px; padding: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 15px; }
        .metric-card { background: ${C.bgInput}; border: 1px solid ${C.border}; border-radius: 8px; padding: 18px; text-align: center; }
        .metric-label { font-size: 10px; text-transform: uppercase; color: ${C.textSecondary}; margin-bottom: 8px; letter-spacing: 0.5px; }
        .metric-value { font-size: 20px; font-weight: bold; }

        .rules { animation: fadeIn 0.3s; }
        .rules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
        .rule-card { background: ${C.bgPanel}; border: 1px solid ${C.border}; border-radius: 8px; padding: 20px; transition: all 0.2s; }
        .rule-card:hover { transform: translateY(-4px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .rule-card h3 { margin-bottom: 14px; font-size: 15px; }
        .rule-card ul { list-style: none; }
        .rule-card li { padding: 6px 0; color: ${C.textSecondary}; font-size: 13px; line-height: 1.6; }
        .rule-card li:before { content: "→ "; color: ${C.accent}; }

        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-track { background: ${C.bgPanel}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.accent}; }

        @media (max-width: 900px) {
          .dashboard-grid, .analytics-grid { grid-template-columns: 1fr; }
          .sidebar { width: 200px; }
        }
      `}</style>

      {/* SIDEBAR */}
      <div className="sidebar">
        <div>
          <div className="sidebar-title">📊 TTM JOURNAL</div>
          <div className="sidebar-version">Web App v2.1</div>
          <div style={{ fontSize: '11px', color: C.textSecondary, padding: '0 20px', marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
            👤 {user.email || 'User'}
          </div>
          {[
            { page: 'dashboard', label: '📈 Dashboard' },
            { page: 'log-trade', label: '📝 Log Trade' },
            { page: 'trade-log', label: '📋 Trade Log' },
            { page: 'analytics', label: '📊 Analysis' },
            { page: 'summary', label: '🏆 Final Summary' },
            { page: 'rules', label: '📚 Rules' },
            { page: 'mt5', label: '🔗 MT5 Sync' },
          ].map(nav => (
            <div
              key={nav.page}
              className={`nav-item ${currentPage === nav.page ? 'active' : ''}`}
              onClick={() => setCurrentPage(nav.page)}
            >
              {nav.label}
            </div>
          ))}
        </div>
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${C.border}`,
          fontSize: 12,
          color: C.textSecondary,
        }}>
          <div style={{ marginBottom: 6 }}>Total Trades: <span style={{ color: C.accent, fontWeight: 'bold' }}>{trades.length}</span></div>
          <div style={{ marginBottom: 12 }}>Cloud Synced ✓</div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            style={{
              width: '100%',
              padding: '10px',
              background: C.red,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: C.textSecondary }}>
            ⏳ Loading your trades...
          </div>
        )}
        {!loading && (
          <>
            {currentPage === 'dashboard' && renderDashboard()}
            {currentPage === 'log-trade' && renderLogTrade()}
            {currentPage === 'trade-log' && renderTradeLog()}
            {currentPage === 'analytics' && renderAnalytics()}
            {currentPage === 'summary' && renderFinalSummary()}
            {currentPage === 'rules' && renderRules()}
            {currentPage === 'mt5' && renderMt5()}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
