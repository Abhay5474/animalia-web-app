import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export default function Register({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, { email, password, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate(res.data.user.role === 'org' ? '/org-dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="heading-gradient" style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" className="input-control" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" className="input-control" value={password} onChange={e => setPassword(e.target.value)} required minLength="8" />
          </div>
          <div className="input-group">
            <label>Role</label>
            <select className="input-control" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Customer</option>
              <option value="org">NGO (Organization)</option>
            </select>
          </div>
          <button type="submit" className="btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} /> Register
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
