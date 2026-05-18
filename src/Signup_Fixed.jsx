import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://web-production-2c4af.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      // Save token
      localStorage.setItem('token', data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Connection error: ' + err.message);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    bg: '#0a0e27',
    card: '#1a1f3a',
    accent: '#e8a020',
    text: '#ffffff',
    textSecondary: '#b0b8cc',
    danger: '#f87171',
  };

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: colors.card,
          padding: '2rem',
          borderRadius: '0.5rem',
          border: `1px solid ${colors.accent}`,
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ textAlign: 'center', color: colors.accent, marginBottom: '0.5rem' }}>
          TTM Journal
        </h1>
        <p style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: '2rem' }}>
          Create Your Account
        </p>

        {error && (
          <div
            style={{
              backgroundColor: colors.danger,
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.25rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
              NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#000',
                border: `1px solid ${colors.accent}`,
                borderRadius: '0.25rem',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#000',
                border: `1px solid ${colors.accent}`,
                borderRadius: '0.25rem',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: colors.accent, fontSize: '0.85rem', fontWeight: 'bold' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#000',
                border: `1px solid ${colors.accent}`,
                borderRadius: '0.25rem',
                fontSize: '0.95rem',
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#000',
                border: `1px solid ${colors.accent}`,
                borderRadius: '0.25rem',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: colors.accent,
              color: '#000',
              border: 'none',
              borderRadius: '0.25rem',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: colors.textSecondary }}>
          Already have an account?{' '}
          <a
            href="/login"
            style={{ color: colors.accent, textDecoration: 'none', fontWeight: 'bold' }}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
