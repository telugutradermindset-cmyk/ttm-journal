import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'https://web-production-2c4af.up.railway.app';

// ==================== GLOBAL STYLES ====================
const globalStyles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  background: #0a0e27;
  color: #ffffff;
  overflow: hidden;
}

body {
  background: linear-gradient(135deg, #0a0e27 0%, #151932 100%);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #00d4ff;
  border-radius: 4px;
  opacity: 0.3;
}

::-webkit-scrollbar-thumb:hover {
  background: #00d4ff;
  opacity: 0.6;
}
`;

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

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
      background: 'linear-gradient(135deg, #0a0e27 0%, #151932 100%)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
          }}>📈</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ffaa 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            TTM Journal Pro
          </h1>
          <p style={{
            color: '#8a92b2',
            fontSize: '14px',
          }}>Professional Trading Journal</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#1a1f3a',
          border: '1px solid #2d3561',
          borderRadius: '12px',
          padding: '32px',
          backdropFilter: 'blur(10px)',
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: '#8a92b2',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0a0e27',
                  border: '1px solid #2d3561',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#00d4ff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2d3561';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#8a92b2',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0a0e27',
                border: '1px solid #2d3561',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00d4ff';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2d3561';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#8a92b2',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0a0e27',
                border: '1px solid #2d3561',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00d4ff';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2d3561';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
              color: '#0a0e27',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
            }}
          >
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
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = '#00ffaa'}
            onMouseLeave={(e) => e.target.style.color = '#00d4ff'}
          >
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ trades, user }) {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'win').length;
  const losses = trades.filter(t => t.outcome === 'loss').length;
  const breakeven = trades.filter(t => t.outcome === 'breakeven').length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : 0;
  const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);

  const chartData = trades
    .map(t => ({
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: parseFloat(t.pnl) || 0,
    }))
    .slice(-30);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: '#8a92b2', fontSize: '14px' }}>Trading Performance Overview</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {[
          { label: '📊 Total Trades', value: totalTrades, color: '#00d4ff' },
          { label: '✅ Wins', value: wins, color: '#10b981' },
          { label: '❌ Losses', value: losses, color: '#ef4444' },
          { label: '⚖️ Breakeven', value: breakeven, color: '#f59e0b' },
          { label: '📈 Win Rate', value: `${winRate}%`, color: '#00d4ff' },
          { label: '💰 Total P&L', value: `$${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? '#10b981' : '#ef4444' },
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: '#1a1f3a',
            border: '1px solid #2d3561',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00d4ff';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 212, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2d3561';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#8a92b2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: stat.color,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{
          background: '#1a1f3a',
          border: '1px solid #2d3561',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#00d4ff' }}>
            📊 30-Day Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3561" />
              <XAxis dataKey="date" stroke="#8a92b2" />
              <YAxis stroke="#8a92b2" />
              <Tooltip
                contentStyle={{
                  background: '#1a1f3a',
                  border: '1px solid #2d3561',
                  borderRadius: '8px',
                  color: '#00d4ff',
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

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div style={{
          background: '#1a1f3a',
          border: '1px solid #2d3561',
          borderRadius: '12px',
          padding: '24px',
          overflowX: 'auto',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#00d4ff' }}>
            📋 Recent Trades
          </h2>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2d3561' }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>Date</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>Pair</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>Direction</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>Entry</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>Exit</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>Result</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontWeight: '700',
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                }}>P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(-5).reverse().map(trade => (
                <tr key={trade._id} style={{
                  borderBottom: '1px solid #2d3561',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>{new Date(trade.date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600' }}>{trade.pair}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: trade.direction === 'long' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: trade.direction === 'long' ? '#10b981' : '#ef4444',
                    }}>
                      {trade.direction === 'long' ? '📈 Long' : '📉 Short'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{trade.entryPrice?.toFixed(4)}</td>
                  <td style={{ padding: '14px 16px' }}>{trade.exitPrice?.toFixed(4)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: trade.outcome === 'win' ? 'rgba(16, 185, 129, 0.2)' : trade.outcome === 'loss' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: trade.outcome === 'win' ? '#10b981' : trade.outcome === 'loss' ? '#ef4444' : '#f59e0b',
                    }}>
                      {trade.outcome === 'win' ? '✅ Win' : trade.outcome === 'loss' ? '❌ Loss' : '⚖️ BE'}
                    </span>
                  </td>
                  <td style={{
                    padding: '14px 16px',
                    fontWeight: '600',
                    color: trade.pnl >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    ${trade.pnl?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== TRADE LOG ====================
function TradeLog({ onAddTrade, trades }) {
  const [showForm, setShowForm] = useState(false);
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
      const response = await fetch(`${API_URL}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onAddTrade();
        setShowForm(false);
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
    <div style={{ padding: '32px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Trade Log</h1>
          <p style={{ color: '#8a92b2', fontSize: '14px' }}>Record and Manage Your Trades</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: '#0a0e27',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Trade'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: '#1a1f3a',
          border: '1px solid #2d3561',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                { label: 'Date', type: 'date', field: 'date' },
                { label: 'Currency Pair', type: 'text', field: 'pair', placeholder: 'EURUSD' },
                { label: 'Entry Price', type: 'number', field: 'entryPrice', step: '0.0001' },
                { label: 'Exit Price', type: 'number', field: 'exitPrice', step: '0.0001' },
                { label: 'Quantity (Lots)', type: 'number', field: 'quantity', step: '0.01' },
                { label: 'Strategy', type: 'text', field: 'strategy', placeholder: 'Breakout' },
              ].map(field => (
                <div key={field.field}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#8a92b2',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={formData[field.field]}
                    onChange={(e) => handleChange(field.field, e.target.value)}
                    placeholder={field.placeholder}
                    step={field.step}
                    required={field.field !== 'strategy'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0e27',
                      border: '1px solid #2d3561',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00d4ff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#2d3561';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                { label: 'Direction', field: 'direction', options: [{ value: 'long', label: '📈 Long' }, { value: 'short', label: '📉 Short' }] },
                { label: 'Outcome', field: 'outcome', options: [{ value: 'win', label: '✅ Win' }, { value: 'loss', label: '❌ Loss' }, { value: 'breakeven', label: '⚖️ Breakeven' }] },
                { label: 'Emotion', field: 'emotion', options: [{ value: 'calm', label: '😊 Calm' }, { value: 'confident', label: '💪 Confident' }, { value: 'fearful', label: '😰 Fearful' }, { value: 'fomo', label: '🚀 FOMO' }, { value: 'frustrated', label: '😤 Frustrated' }] },
              ].map(field => (
                <div key={field.field}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#8a92b2',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}>{field.label}</label>
                  <select
                    value={formData[field.field]}
                    onChange={(e) => handleChange(field.field, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0e27',
                      border: '1px solid #2d3561',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00d4ff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#2d3561';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style({
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: '#8a92b2',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>Trade Rating</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => handleChange('rating', star)}
                    style={{
                      fontSize: '28px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: formData.rating >= star ? 1 : 0.3,
                      transform: formData.rating >= star ? 'scale(1.2)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.3)';
                    }}
                    onMouseLeave={() => {
                      if (formData.rating >= star) {
                        // keep transform
                      }
                    }}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(0, 212, 255, 0.05)',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid rgba(0, 212, 255, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: '#8a92b2', marginBottom: '4px' }}>Calculated P&L</p>
              <p style={{
                fontSize: '20px',
                fontWeight: '700',
                color: formData.pnl >= 0 ? '#10b981' : '#ef4444',
              }}>
                ${formData.pnl?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  color: '#0a0e27',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
                }}
              >
                + Add Trade
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#1a1f3a',
                  color: '#ffffff',
                  border: '1px solid #2d3561',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#00d4ff';
                  e.target.style.color = '#00d4ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#2d3561';
                  e.target.style.color = '#ffffff';
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {trades.length > 0 && (
        <div style={{
          background: '#1a1f3a',
          border: '1px solid #2d3561',
          borderRadius: '12px',
          padding: '24px',
          overflowX: 'auto',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#00d4ff' }}>
            📋 All Trades
          </h2>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2d3561' }}>
                {['Date', 'Pair', 'Direction', 'Entry', 'Exit', 'Qty', 'Result', 'P&L', 'Emotion', 'Rating'].map(header => (
                  <th key={header} style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: '700',
                    color: '#00d4ff',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade._id} style={{
                  borderBottom: '1px solid #2d3561',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 8px' }}>{new Date(trade.date).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>{trade.pair}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: trade.direction === 'long' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: trade.direction === 'long' ? '#10b981' : '#ef4444',
                    }}>
                      {trade.direction === 'long' ? 'LONG' : 'SHORT'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{trade.entryPrice?.toFixed(4)}</td>
                  <td style={{ padding: '10px 8px' }}>{trade.exitPrice?.toFixed(4)}</td>
                  <td style={{ padding: '10px 8px' }}>{trade.quantity}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: trade.outcome === 'win' ? 'rgba(16, 185, 129, 0.2)' : trade.outcome === 'loss' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: trade.outcome === 'win' ? '#10b981' : trade.outcome === 'loss' ? '#ef4444' : '#f59e0b',
                    }}>
                      {trade.outcome === 'win' ? 'WIN' : trade.outcome === 'loss' ? 'LOSS' : 'BE'}
                    </span>
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    fontWeight: '600',
                    color: trade.pnl >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    ${trade.pnl?.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{trade.emotion?.substring(0, 1).toUpperCase() + trade.emotion?.substring(1)}</td>
                  <td style={{ padding: '10px 8px' }}>{'⭐'.repeat(trade.rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== ANALYTICS ====================
function Analytics({ trades }) {
  const pairStats = {};
  
  trades.forEach(t => {
    if (!pairStats[t.pair]) {
      pairStats[t.pair] = { wins: 0, losses: 0, total: 0, pnl: 0 };
    }

    pairStats[t.pair].total++;
    pairStats[t.pair].pnl += parseFloat(t.pnl) || 0;

    if (t.outcome === 'win') {
      pairStats[t.pair].wins++;
    } else if (t.outcome === 'loss') {
      pairStats[t.pair].losses++;
    }
  });

  const pairData = Object.entries(pairStats).map(([pair, stats]) => ({
    name: pair,
    'Wins': stats.wins,
    'Losses': stats.losses,
    winRate: ((stats.wins / stats.total) * 100).toFixed(1),
    pnl: stats.pnl.toFixed(2),
  }));

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Analytics</h1>
        <p style={{ color: '#8a92b2', fontSize: '14px' }}>Performance Analysis</p>
      </div>

      {pairData.length > 0 && (
        <>
          <div style={{
            background: '#1a1f3a',
            border: '1px solid #2d3561',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#00d4ff' }}>
              📊 Pair Performance Chart
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pairData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3561" />
                <XAxis dataKey="name" stroke="#8a92b2" />
                <YAxis stroke="#8a92b2" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f3a',
                    border: '1px solid #2d3561',
                    borderRadius: '8px',
                    color: '#00d4ff',
                  }}
                />
                <Legend />
                <Bar dataKey="Wins" fill="#10b981" />
                <Bar dataKey="Losses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: '#1a1f3a',
            border: '1px solid #2d3561',
            borderRadius: '12px',
            padding: '24px',
            overflowX: 'auto',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#00d4ff' }}>
              📈 Detailed Statistics
            </h2>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2d3561' }}>
                  {['Pair', 'Total', 'Wins', 'Losses', 'Win Rate', 'P&L'].map(header => (
                    <th key={header} style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '700',
                      color: '#00d4ff',
                      textTransform: 'uppercase',
                      fontSize: '11px',
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pairData.map(row => (
                  <tr key={row.name} style={{
                    borderBottom: '1px solid #2d3561',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>{row.name}</td>
                    <td style={{ padding: '14px 16px' }}>{row.Wins + row.Losses}</td>
                    <td style={{ padding: '14px 16px', color: '#10b981', fontWeight: '600' }}>{row.Wins}</td>
                    <td style={{ padding: '14px 16px', color: '#ef4444', fontWeight: '600' }}>{row.Losses}</td>
                    <td style={{ padding: '14px 16px', color: '#00d4ff', fontWeight: '600' }}>{row.winRate}%</td>
                    <td style={{ padding: '14px 16px', color: row.pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      ${row.pnl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== SETTINGS ====================
function Settings({ user, onLogout }) {
  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: '#8a92b2', fontSize: '14px' }}>Account & Preferences</p>
      </div>

      <div style={{
        background: '#1a1f3a',
        border: '1px solid #2d3561',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#00d4ff' }}>
          👤 Profile
        </h2>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#8a92b2', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>Name</p>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>{user?.name}</p>
        </div>
        <div>
          <p style={{ color: '#8a92b2', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>Email</p>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>{user?.email}</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: '#ef4444',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#dc2626';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#ef4444';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        🚪 Logout
      </button>
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
        <style>{globalStyles}</style>
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#8a92b2',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #2d3561',
              borderTopColor: '#00d4ff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}></div>
            <p>Loading your trading data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        display: 'flex',
        height: '100vh',
        background: '#0a0e27',
      }}>
        {/* Sidebar */}
        <div style={{
          width: '280px',
          background: 'linear-gradient(180deg, #1a1f3a 0%, #151932 100%)',
          borderRight: '1px solid #2d3561',
          padding: '24px 0',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '0 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ fontSize: '24px' }}>📈</div>
            <div style={{
              fontWeight: '700',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ffaa 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              TTM Journal
            </div>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'trade-log', label: 'Trade Log', icon: '📝' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(item => (
            <div
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                padding: '12px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: currentPage === item.id ? '#00d4ff' : '#8a92b2',
                background: currentPage === item.id ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                borderLeft: currentPage === item.id ? '3px solid #00d4ff' : '3px solid transparent',
                transition: 'all 0.3s ease',
                fontWeight: currentPage === item.id ? '600' : '400',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
                  e.currentTarget.style.color = '#00d4ff';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#8a92b2';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ flex: 1 }}></div>

          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #2d3561',
            marginTop: 'auto',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              background: 'rgba(0, 212, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid #2d3561',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffaa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                color: '#0a0e27',
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p style={{ fontSize: '11px', color: '#8a92b2' }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #0a0e27 0%, #151932 100%)',
        }}>
          {currentPage === 'dashboard' && <Dashboard trades={trades} user={user} />}
          {currentPage === 'trade-log' && <TradeLog onAddTrade={fetchTrades} trades={trades} />}
          {currentPage === 'analytics' && <Analytics trades={trades} />}
          {currentPage === 'settings' && <Settings user={user} onLogout={handleLogout} />}
        </div>
      </div>
    </>
  );
}