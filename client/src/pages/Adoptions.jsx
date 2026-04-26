import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, Heart, Trash2 } from 'lucide-react';

export default function Adoptions() {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const fetchAdoptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/adoptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdoptions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!file) return;

    setPosting(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('description', description);
    formData.append('contactDetails', contactDetails);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/adoptions`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setFile(null);
      setPreview(null);
      setDescription('');
      setContactDetails('');
      fetchAdoptions();
    } catch (err) {
      alert('Failed to post adoption');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/adoptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdoptions();
    } catch (err) {
      alert('Failed to delete adoption');
    }
  };

  return (
    <div className="animate-fade">
      <h1 className="heading-gradient" style={{ marginBottom: '2rem', textAlign: 'center' }}>Adopt a Friend</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        
        {/* Post Form */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart color="var(--success)" /> Post Adoption
          </h3>
          <form onSubmit={handlePost}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              {preview ? (
                <img src={preview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <div style={{ flex: 1, height: '150px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(14, 165, 233, 0.05)', transition: 'var(--transition)' }} onClick={() => document.getElementById('adopt-file').click()}>
                    <Upload size={28} style={{ marginBottom: '0.5rem', color: 'var(--secondary-color)' }} />
                    <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>Upload Device Photo</p>
                  </div>
                  <div style={{ flex: 1, height: '150px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.05)', transition: 'var(--transition)' }} onClick={() => document.getElementById('adopt-camera').click()}>
                    <Camera size={28} style={{ marginBottom: '0.5rem', color: 'var(--success)' }} />
                    <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>Take Live Photo</p>
                  </div>
                </div>
              )}
              <input id="adopt-file" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <input id="adopt-camera" type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            <div className="input-group">
              <label>Animal Description & Background</label>
              <textarea 
                className="input-control" 
                rows="3" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell us about the animal..."
                required
              />
            </div>
            <div className="input-group">
              <label>Contact Details</label>
              <input 
                type="text"
                className="input-control" 
                value={contactDetails} 
                onChange={e => setContactDetails(e.target.value)}
                placeholder="Phone or Email for adoption..."
                required
              />
            </div>

            <button type="submit" className="btn" style={{ width: '100%' }} disabled={posting || !file}>
              {posting ? 'Posting...' : 'Post for Adoption'}
            </button>
          </form>
        </div>

        {/* Gallery */}
        <div className="glass-panel" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
          {loading ? <p>Loading adoptions...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {adoptions.map(adopt => (
                <div key={adopt._id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                  <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${adopt.imageUrl}`} alt="Animal" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                  <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>{adopt.description}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Contact: {adopt.contactDetails || adopt.postedBy?.email}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      <span>Status: <strong style={{ color: "var(--success)" }}>{adopt.status.toUpperCase()}</strong></span>
                      
                      {user && (user.role === 'org' || user.id === adopt.postedBy?._id) && (
                        <button className="btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--danger)' }} onClick={() => handleDelete(adopt._id)}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {adoptions.length === 0 && <p>No adoption posts yet. Be the first to post!</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
