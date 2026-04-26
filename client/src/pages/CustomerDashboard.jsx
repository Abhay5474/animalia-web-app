import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Heart, Stethoscope, MessageSquare, Activity, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [points, setPoints] = useState(0);
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    fetchUserPoints();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/analytics/impact');
      setAnalyticsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPoints(res.data.rescuePoints || 0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 className="heading-gradient" style={{ marginBottom: '0.5rem' }}>Customer Dashboard</h1>
          <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.2rem' }}>Welcome back, <strong style={{ color: 'var(--primary-color)' }}>{user?.email}</strong>!</p>
        </div>
        
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--success)', padding: '1rem 2.5rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.15)' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '1.5px', fontWeight: 'bold' }}>Rescue Points</p>
          <h2 style={{ color: 'var(--success)', margin: '0.5rem 0 0 0', fontSize: '2.8rem' }}>{points}</h2>
        </div>
      </div>
      
      {/* Real-world Analytics Chart */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--secondary-color)' }}>
          <TrendingUp /> Global Platform Impact
        </h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={analyticsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRescues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAdopts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="reported" stroke="#ef4444" fillOpacity={1} fill="url(#colorRescues)" name="Total Reported Cases" />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" fillOpacity={1} fill="url(#colorAdopts)" name="Resolved Rescues" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        <Link to="/report-injury" className="glass-panel hover-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%' }}>
            <AlertCircle size={40} color="var(--danger)" />
          </div>
          <h3>Report Animal Injury</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Upload a photo and auto-detect severity using AI.</p>
        </Link>
        
        <Link to="/adoptions" className="glass-panel hover-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '50%' }}>
            <Heart size={40} color="var(--success)" />
          </div>
          <h3>Adopt a Pet</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Find your new best friend or post an adoption notice.</p>
        </Link>
        
        <Link to="/clinics" className="glass-panel hover-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%' }}>
            <Stethoscope size={40} color="var(--primary-color)" />
          </div>
          <h3>Vet Clinics</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>View a database of reliable veterinary clinics.</p>
        </Link>

        {/* AI & Analytics Options */}
        <Link to="/trauma-analytics" className="glass-panel hover-card highlight-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '50%' }}>
            <Activity size={40} color="var(--secondary-color)" />
          </div>
          <h3 style={{ color: 'var(--secondary-color)' }}>Trauma Analytics</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Advanced visual AI mapped trauma analysis & protocols.</p>
        </Link>
        
        <Link to="/chat" className="glass-panel hover-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '50%' }}>
            <MessageSquare size={40} color="var(--accent-color)" />
          </div>
          <h3>First Aid Chat</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Upload an image for conversational AI guidance.</p>
        </Link>
      </div>
    </div>
  );
}
