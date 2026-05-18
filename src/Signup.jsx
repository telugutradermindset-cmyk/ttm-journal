import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from './apiService';

const Signup = ({ C }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.signup(email, password, name);
      const { token, user } = response.data;

      // Save token and user to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'Rajdhani', 'Courier New', monospace",
    }}>
      <div style={{
        background: C.bgPanel,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{
          fontSize: '28px',
          marginBottom: '10px',
          color: C.accent,
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          TTM Journal
        </h1>
        <p style={{
          fontSize: '13px',
          color: C.textSecondary,
          textAlign: 'center',
          marginBottom: '30px',
        }}>
          Create Your Account
        </p>

        {error && (
          <div style={{
            background: C.red,
            color: '#fff',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: C.accent,
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              style={{
                width: '100%',
                padding: '10px',
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: '4px',
                color: C.text,
                fontFamily: 'inherit',
                fontSize: '13px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: C.accent,
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '10px',
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: '4px',
                color: C.text,
                fontFamily: 'inherit',
                fontSize: '13px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: C.accent,
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px',
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: '4px',
                color: C.text,
                fontFamily: 'inherit',
                fontSize: '13px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: C.accent,
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px',
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: '4px',
                color: C.text,
                fontFamily: 'inherit',
                fontSize: '13px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: C.accent,
              color: '#000',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontFamily: 'inherit',
              fontSize: '14px',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = C.accentLight)}
            onMouseLeave={(e) => e.target.style.background = C.accent}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '13px',
          color: C.textSecondary,
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: C.accent,
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
