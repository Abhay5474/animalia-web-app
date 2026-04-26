import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Activity, UploadCloud, Camera, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function TraumaAnalytics() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/injuries/analyze', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Analysis Result:', res.data);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to analyze trauma properly.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (result && result.predictions && imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;

      // Set canvas to match image display size
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scale calculations: Roboflow returns coordinates based on original image size
      const scaleX = canvas.width / (result.imageSpecs?.width || img.naturalWidth);
      const scaleY = canvas.height / (result.imageSpecs?.height || img.naturalHeight);

      result.predictions.forEach(p => {
        // Roboflow coordinates are typically center_x, center_y, width, height
        const width = p.width * scaleX;
        const height = p.height * scaleY;
        const x = (p.x * scaleX) - (width / 2);
        const y = (p.y * scaleY) - (height / 2);

        // Draw bounding box
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        ctx.fillStyle = '#ef4444';
        const labelText = `${p.class} (${(p.confidence * 100).toFixed(1)}%)`;
        ctx.font = '14px sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(x, y - 24, textWidth + 10, 24);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x + 5, y - 7);
      });
    }
  }, [result]);

  return (
    <div className="animate-fade" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ textAlign: 'center' }}>
        <h1 className="heading-gradient" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Activity size={40} color="var(--secondary-color)" /> Trauma Analytics & First Aid Tool
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          Upload an image of the injured animal. Our hybrid AI pipeline uses Roboflow Object Detection to map the trauma, and Gemini LLM to synthesize a highly technical medical assessment and immediate stabilization protocol.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Upload & Vision Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          <div style={{ padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
            
            {!preview ? (
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <div 
                  style={{ flex: 1, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition)', background: 'rgba(14, 165, 233, 0.05)' }}
                  onClick={() => document.getElementById('analytic-upload').click()}
                >
                  <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <UploadCloud size={36} color="var(--secondary-color)" />
                  </div>
                  <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Upload from Files</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>JPG, PNG (Max 50MB)</p>
                </div>
                
                <div 
                  style={{ flex: 1, height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition)', background: 'rgba(16, 185, 129, 0.05)' }}
                  onClick={() => document.getElementById('analytic-camera').click()}
                >
                  <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <Camera size={36} color="var(--primary-color)" />
                  </div>
                  <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>Take Live Photo</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Capture direct to engine</p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <img 
                  ref={imageRef}
                  src={preview} 
                  alt="Subject" 
                  style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain', display: 'block', borderRadius: '8px' }} 
                  onLoad={() => {
                    // Re-trigger effect or adjust canvas if needed
                  }}
                />
                {result && <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />}
              </div>
            )}
            
            <input id="analytic-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <input id="analytic-camera" type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {preview && (
              <button className="btn-outline" onClick={() => {setFile(null); setPreview(null); setResult(null);}}>
                Clear Image
              </button>
            )}
            <button className="btn" onClick={handleAnalyze} disabled={analyzing || !file} style={{ flexGrow: preview ? 0 : 1 }}>
              {analyzing ? 'Synthesizing Data Pipelines...' : 'Run Diagnostics'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <p style={{ color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> {error}
              </p>
            </div>
          )}
        </div>

        {/* Analytics Readout Section */}
        <div className="glass-panel" style={{ minHeight: '500px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <Activity color="var(--secondary-color)" /> AI Assessment Report
          </h2>

          {!result && !analyzing && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Upload an image and run diagnostics to generate a report.</p>
            </div>
          )}

          {analyzing && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>Executing Vision Node...</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {result && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Telemetry Block */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Detected Nodes</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{result.predictions?.length || 0}</p>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Gravity Index</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', color: result.severity === 'high' ? 'var(--danger)' : result.severity === 'medium' ? 'var(--accent-color)' : 'var(--success)' }}>
                    {result.severity || 'UNKNOWN'}
                  </p>
                </div>
              </div>

              {/* Text Analytics */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>Trauma Analysis</h3>
                <p style={{ background: 'var(--bg-panel)', padding: '1.2rem', borderRadius: '8px', lineHeight: '1.6' }}>
                  {result.analysis?.assessment || 'No analytical assessment provided.'}
                </p>
              </div>

              {/* First Aid Steps */}
              {result.analysis?.first_aid_steps && result.analysis.first_aid_steps.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Immediate First Aid Protocol</h3>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {result.analysis.first_aid_steps.map((step, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', background: 'rgba(34, 197, 94, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
                        <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ lineHeight: '1.5' }}>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Precautions */}
              {result.analysis?.precautions && result.analysis.precautions.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Critical Handling Precautions</h3>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {result.analysis.precautions.map((prec, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                        <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ lineHeight: '1.5' }}>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
