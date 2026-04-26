import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, MapPin, Send } from 'lucide-react';

export default function ReportInjury() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [location, setLocation] = useState({ lat: '', lng: '' });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ lat: position.coords.latitude.toString(), lng: position.coords.longitude.toString() }),
        () => alert('Please enable location access.')
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !location.lat) {
      setError('Please provide an image and your location.');
      return;
    }
    
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('latitude', location.lat);
    formData.append('longitude', location.lng);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/injuries/report', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setResult(res.data);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="heading-gradient" style={{ marginBottom: '2rem', textAlign: 'center' }}>Report Animal Injury</h1>
      
      <div className="glass-panel">
        {result && (
          <div style={{ padding: '1rem', background: 'rgba(76, 175, 80, 0.2)', border: '1px solid var(--success)', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Success!</h3>
            <p>{result.message}</p>
          </div>
        )}
        
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ textAlign: 'center' }}>
            {preview ? (
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--surface-light)' }} />
            ) : (
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <div style={{ flex: 1, height: '160px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(14, 165, 233, 0.05)', transition: 'var(--transition)' }} onClick={() => document.getElementById('file-input').click()}>
                  <Upload size={32} style={{ marginBottom: '0.5rem', color: 'var(--secondary-color)' }} />
                  <p style={{ fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>Upload Device Photo</p>
                </div>
                <div style={{ flex: 1, height: '160px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.05)', transition: 'var(--transition)' }} onClick={() => document.getElementById('camera-input').click()}>
                  <Camera size={32} style={{ marginBottom: '0.5rem', color: 'var(--success)' }} />
                  <p style={{ fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>Take Live Photo</p>
                </div>
              </div>
            )}
            <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <input id="camera-input" type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
            {preview && <button type="button" className="btn btn-outline" style={{ marginTop: '1rem', padding: '0.4rem 1rem' }} onClick={() => {setFile(null); setPreview(null);}}>Change Image</button>}
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Location Coordinates</span>
              <button type="button" onClick={getLocation} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <MapPin size={16} /> Get Current Location
              </button>
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" className="input-control" placeholder="Latitude" value={location.lat} readOnly />
              <input type="text" className="input-control" placeholder="Longitude" value={location.lng} readOnly />
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? 'Analyzing with Roboflow...' : <><Send size={20} /> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
}
