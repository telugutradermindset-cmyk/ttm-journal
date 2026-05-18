import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './Login';
import Signup from './Signup';

// Color scheme for auth pages
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

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<Login C={C} />} />
        <Route path="/signup" element={<Signup C={C} />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/app/dashboard" />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
