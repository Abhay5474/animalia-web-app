import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import OrgDashboard from './pages/OrgDashboard';
import ReportInjury from './pages/ReportInjury';
import Adoptions from './pages/Adoptions';
import Clinics from './pages/Clinics';
import AIFirstAidChat from './pages/AIFirstAidChat';
import TraumaAnalytics from './pages/TraumaAnalytics';
import { PawPrint, LogOut, Home, AlertCircle, Heart, Stethoscope, MessageSquare } from 'lucide-react';

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'org' ? '/org-dashboard' : '/dashboard'} />;
  return children;
}

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div>
      <nav className="navbar">
        <div className="brand" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <PawPrint color="var(--primary-color)" /> Animalia
        </div>
        <div className="nav-links">
          {user ? (
            <>
              <Link to={user.role === 'org' ? '/org-dashboard' : '/dashboard'} className="btn btn-outline" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem'}}>
                <Home size={18} /> Home
              </Link>
              <button className="btn" onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem'}}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn">Register</Link>
            </>
          )}
        </div>
      </nav>

      <div className="page-container">
        <Routes>
          <Route path="/" element={user ? <Navigate to={user.role === 'org' ? '/org-dashboard' : '/dashboard'} /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          
          <Route path="/dashboard" element={<ProtectedRoute role="user"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/org-dashboard" element={<ProtectedRoute role="org"><OrgDashboard /></ProtectedRoute>} />
          
          <Route path="/report-injury" element={<ProtectedRoute role="user"><ReportInjury /></ProtectedRoute>} />
          <Route path="/adoptions" element={<ProtectedRoute><Adoptions /></ProtectedRoute>} />
          <Route path="/clinics" element={<ProtectedRoute><Clinics /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute role="user"><AIFirstAidChat /></ProtectedRoute>} />
          <Route path="/trauma-analytics" element={<ProtectedRoute role="user"><TraumaAnalytics /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
