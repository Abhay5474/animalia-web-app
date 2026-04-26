import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Phone } from 'lucide-react';
import DynamicMap from '../components/DynamicMap';

export default function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    fetchClinics();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => {
        console.error("Could not get user location.");
      }, { timeout: 10000 });
    }
  }, []);

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/clinics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mapMarkers = clinics
    .filter(c => c.latitude && c.longitude)
    .map(c => ({
      position: [parseFloat(c.latitude), parseFloat(c.longitude)],
      popup: `${c.name} - ${c.phone}`
    }));

  if (userLoc) {
    mapMarkers.push({ position: userLoc, isRed: true, popup: 'Your Location' });
  }

  const mapCenter = userLoc || (mapMarkers.length > 0 ? mapMarkers[0].position : [40.7128, -74.0060]);

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="heading-gradient" style={{ marginBottom: '1rem', textAlign: 'center' }}>Veterinary Clinics</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>Find trusted and professional animal clinics around you.</p>
      
      {/* MAP SECTION */}
      <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '2rem', background: 'var(--bg-panel)' }}>
        <DynamicMap center={mapCenter} zoom={12} markers={mapMarkers} style={{ height: '400px', width: '100%', borderRadius: '8px', zIndex: 1 }} />
      </div>

      {loading ? <p style={{ textAlign: 'center' }}>Loading clinics...</p> : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {clinics.map(c => (
            <div key={c._id} className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.3rem' }}>{c.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)' }}>
                  <Phone size={18} color="var(--primary-color)" /> {c.phone}
                </p>
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', color: 'var(--text-muted)' }}>
                  <MapPin size={18} color="var(--secondary-color)" style={{ flexShrink: 0, marginTop: '0.2rem' }} /> 
                  <span>{c.address}</span>
                </p>
                {c.latitude && c.longitude && (
                   <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.5rem' }}>✓ Geolocation mapped</p>
                )}
              </div>
            </div>
          ))}
          {clinics.length === 0 && <p className="text-center" style={{ marginTop: '2rem', gridColumn: '1 / -1' }}>No clinics listed yet. Admins will add them soon.</p>}
        </div>
      )}
    </div>
  );
}
