import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Stethoscope, Heart, Camera, Upload, Trash2, Map } from 'lucide-react';
import DynamicMap from '../components/DynamicMap';

export default function OrgDashboard() {
  const [activeTab, setActiveTab] = useState('injuries');

  // Injuries State
  const [injuries, setInjuries] = useState([]);
  const [loadingInjuries, setLoadingInjuries] = useState(true);
  const [ngoLoc, setNgoLoc] = useState(null);
  const [selectedRoutingInjury, setSelectedRoutingInjury] = useState(null);

  // Clinic State
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLat, setClinicLat] = useState('');
  const [clinicLng, setClinicLng] = useState('');

  // Adoption State
  const [adoptFile, setAdoptFile] = useState(null);
  const [adoptPreview, setAdoptPreview] = useState(null);
  const [adoptDescription, setAdoptDescription] = useState('');
  const [adoptContactDetails, setAdoptContactDetails] = useState('');
  const [postingAdoption, setPostingAdoption] = useState(false);

  useEffect(() => {
    if (activeTab === 'injuries') {
      fetchInjuries();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setNgoLoc([pos.coords.latitude, pos.coords.longitude]),
          () => console.warn("Failed to get NGO location")
        );
      }
    }
  }, [activeTab]);

  const fetchInjuries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/injuries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInjuries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInjuries(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/injuries/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInjuries();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteInjury = async (id) => {
    if (!window.confirm('Are you sure you want to delete this injury report?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/injuries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInjuries();
    } catch (err) {
      alert('Failed to delete injury');
    }
  };

  const handleAddClinic = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/clinics', { 
        name: clinicName, 
        phone: clinicPhone, 
        address: clinicAddress,
        latitude: clinicLat,
        longitude: clinicLng
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinicName('');
      setClinicPhone('');
      setClinicAddress('');
      setClinicLat('');
      setClinicLng('');
      alert('Clinic added successfully!');
    } catch (err) {
      alert('Failed to add clinic');
    }
  };

  const fillCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setClinicLat(pos.coords.latitude.toString());
        setClinicLng(pos.coords.longitude.toString());
      }, () => {
        alert("Failed to get location.");
      });
    }
  };

  const handleAdoptFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAdoptFile(e.target.files[0]);
      setAdoptPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePostAdoption = async (e) => {
    e.preventDefault();
    if (!adoptFile) return;

    setPostingAdoption(true);
    const formData = new FormData();
    formData.append('image', adoptFile);
    formData.append('description', adoptDescription);
    formData.append('contactDetails', adoptContactDetails);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/adoptions', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setAdoptFile(null);
      setAdoptPreview(null);
      setAdoptDescription('');
      setAdoptContactDetails('');
      alert('Adoption posted successfully!');
    } catch (err) {
      alert('Failed to post adoption');
    } finally {
      setPostingAdoption(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="heading-gradient" style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'injuries' ? '' : 'btn-outline'}`} 
          onClick={() => setActiveTab('injuries')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} /> Manage Injuries
        </button>
        <button 
          className={`btn ${activeTab === 'clinics' ? '' : 'btn-outline'}`} 
          onClick={() => setActiveTab('clinics')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Stethoscope size={18} /> Add Clinics
        </button>
        <button 
          className={`btn ${activeTab === 'adoptions' ? '' : 'btn-outline'}`} 
          onClick={() => setActiveTab('adoptions')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={18} /> Post Adoptions
        </button>
      </div>

      <div className="glass-panel">
        
        {/* INJURIES TAB */}
        {activeTab === 'injuries' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Recent Injury Reports</h2>
            
            {/* Routing Map Modal / View */}
            {selectedRoutingInjury && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--secondary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Map size={20} /> Route to Rescue Operation
                  </h3>
                  <button onClick={() => setSelectedRoutingInjury(null)} className="btn-outline" style={{ padding: '0.3rem 0.6rem' }}>Close Map</button>
                </div>
                
                {ngoLoc && selectedRoutingInjury.latitude && selectedRoutingInjury.longitude ? (
                  <DynamicMap 
                    center={ngoLoc} 
                    zoom={12} 
                    markers={[
                      { position: ngoLoc, popup: "NGO Current Base (You)", isRed: false },
                      { position: [parseFloat(selectedRoutingInjury.latitude), parseFloat(selectedRoutingInjury.longitude)], popup: "Emergency Site", isRed: true }
                    ]}
                    route={[
                      ngoLoc,
                      [parseFloat(selectedRoutingInjury.latitude), parseFloat(selectedRoutingInjury.longitude)]
                    ]}
                    style={{ height: '350px', width: '100%', borderRadius: '8px' }}
                  />
                ) : (
                  <p style={{ color: 'var(--danger)' }}>Could not compute route. Real-time geolocations missing.</p>
                )}
              </div>
            )}

            {loadingInjuries ? <p>Loading...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {injuries.map(inj => (
                  <div key={inj._id} className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-color)' }}>
                    <img src={`http://localhost:5000${inj.imageUrl}`} alt="injury" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                    <p><strong>Severity:</strong> <span style={{ color: inj.severity === 'high' ? 'var(--danger)' : inj.severity === 'medium' ? 'var(--accent-color)' : 'var(--success)' }}>{inj.severity.toUpperCase()}</span></p>
                    <p style={{ fontSize: '0.9rem' }}><strong>Location:</strong> {inj.latitude}, {inj.longitude}</p>
                    <p style={{ fontSize: '0.9rem' }}><strong>Reported By:</strong> {inj.reportedBy?.email || 'Unknown'}</p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      {inj.status === 'reported' ? (
                        <button className="btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }} onClick={() => updateStatus(inj._id, 'resolved')}>
                          Mark Resolved
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓ Resolved</span>
                      )}
                      <button className="btn-outline" style={{ padding: '0.4rem', color: 'var(--secondary-color)', border: 'none' }} onClick={() => setSelectedRoutingInjury(inj)} title="View Map Route">
                        <Map size={18} />
                      </button>
                      <button className="btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)', border: 'none' }} onClick={() => deleteInjury(inj._id)} title="Delete Post">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {injuries.length === 0 && <p>No injury reports found.</p>}
              </div>
            )}
          </div>
        )}

        {/* CLINICS TAB */}
        {activeTab === 'clinics' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Add Veterinary Clinic</h2>
            <form onSubmit={handleAddClinic} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Clinic Name</label>
                <input type="text" className="input-control" value={clinicName} onChange={e => setClinicName(e.target.value)} required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Phone Number</label>
                <input type="text" className="input-control" value={clinicPhone} onChange={e => setClinicPhone(e.target.value)} required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Physical Address</label>
                <input type="text" className="input-control" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label>Latitude</label>
                  <input type="text" className="input-control" value={clinicLat} onChange={e => setClinicLat(e.target.value)} placeholder="e.g. 40.7128" />
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label>Longitude</label>
                  <input type="text" className="input-control" value={clinicLng} onChange={e => setClinicLng(e.target.value)} placeholder="e.g. -74.0060" />
                </div>
              </div>
              <button type="button" className="btn-outline" onClick={fillCurrentLocation} style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Auto-Fill My Current Geolocation</button>
              <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Save Clinic to Database</button>
            </form>
          </div>
        )}

        {/* ADOPTIONS TAB */}
        {activeTab === 'adoptions' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Post Animal for Adoption</h2>
            <form onSubmit={handlePostAdoption} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {adoptPreview ? (
                  <img src={adoptPreview} alt="Preview" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <div style={{ flex: 1, height: '200px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(14, 165, 233, 0.05)' }} onClick={() => document.getElementById('admin-adopt-upload').click()}>
                      <Upload size={40} style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }} />
                      <p>Upload Device Photo</p>
                    </div>
                    <div style={{ flex: 1, height: '200px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.05)' }} onClick={() => document.getElementById('admin-adopt-camera').click()}>
                      <Camera size={40} style={{ marginBottom: '1rem', color: 'var(--success)' }} />
                      <p>Take Live Photo</p>
                    </div>
                  </div>
                )}
                <input id="admin-adopt-upload" type="file" accept="image/*" onChange={handleAdoptFileChange} style={{ display: 'none' }} />
                <input id="admin-adopt-camera" type="file" accept="image/*" capture="environment" onChange={handleAdoptFileChange} style={{ display: 'none' }} />
                {adoptPreview && <button type="button" className="btn-outline" style={{ marginTop: '1rem' }} onClick={() => {setAdoptFile(null); setAdoptPreview(null);}}>Change Image</button>}
              </div>

              <div className="input-group">
                <label>Animal Description & Background</label>
                <textarea 
                  className="input-control" 
                  rows="3" 
                  value={adoptDescription} 
                  onChange={e => setAdoptDescription(e.target.value)}
                  placeholder="Provide details about the animal..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Contact Details</label>
                <input 
                  type="text"
                  className="input-control" 
                  value={adoptContactDetails} 
                  onChange={e => setAdoptContactDetails(e.target.value)}
                  placeholder="Phone or Email..."
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={postingAdoption || !adoptFile}>
                {postingAdoption ? 'Posting...' : 'Publish Adoption Notice'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
