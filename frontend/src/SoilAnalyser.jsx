import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import Navbar from './components/Navbar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SoilAnalyser({ onBack }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('farmer_token');
    if (token) {
      axios.get(`${API_BASE_URL}/my-soil-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setHistory(res.data.reports || []))
      .catch(err => console.error('Failed to load history', err));
    }
  }, []);

  const handleDownloadPdf = async (reportId) => {
    if (!reportId) return;
    try {
      const token = localStorage.getItem('farmer_token');
      if (!token) return alert('Please login to download reports');
      
      const res = await axios.get(`${API_BASE_URL}/soil-report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `soil-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not download report');
    }
  };

  const handleShare = async (reportId, analysis) => {
    if (!reportId) return;
    try {
      const token = localStorage.getItem('farmer_token');
      if (!token) return alert('Please login to share reports');

      const res = await axios.post(`${API_BASE_URL}/soil-report/${reportId}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const shareUrl = res.data.publicUrl || `${window.location.origin}/#/soil-report/${reportId}`;
      const text = `🌱 *Krishi-Net Soil Health Card*\nType: ${analysis?.type}\npH: ${analysis?.ph}\nMoisture: ${analysis?.moisture}\nRecommended Crops: ${analysis?.crops?.join(', ')}\nView full report: ${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch (e) {
      console.error(e);
      alert('Failed to generate share link');
    }
  };

  const handleUpload = async () => {
    if (!photo) return alert("Please select or capture a soil photo first.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', photo);
      
      const token = localStorage.getItem('farmer_token');
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.post(`${API_BASE_URL}/upload/soil`, fd, { headers });
      
      const data = res.data.analysis || { error: "Could not analyze soil." };
      if (res.data.id) data.reportId = res.data.id;
      setResult(data);
      
      if (token) {
        axios.get(`${API_BASE_URL}/my-soil-reports`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setHistory(res.data.reports || []));
      }
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: [...history].reverse().map(h => new Date(h.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'pH Level',
        data: [...history].reverse().map(h => parseFloat(h.analysis?.ph || 0)),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.5)',
      },
      {
        label: 'Moisture (%)',
        data: [...history].reverse().map(h => parseFloat(h.analysis?.moisture || 0)),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.5)',
      },
    ],
  };

  return (
    <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar title="🌱 Soil Health Analyser" showBack={true} onBack={onBack} />

      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#a7f3d0', fontSize: 14 }}>Upload a photo of your farm soil to get a comprehensive health report, nutrient breakdown, and crop recommendations.</p>
      </div>

      <div className="card">
        <input
          id="soil-photo-input"
          type="file"
          accept="image/*"
          onChange={e => setPhoto(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
          <label htmlFor="soil-photo-input" className="btn btn-dark" style={{ margin: 0, cursor: 'pointer' }}>
            📷 Choose Soil Photo
          </label>
          <span style={{ color: '#000000', fontSize: '14px', fontWeight: 700 }}>
            {photo ? `Selected: ${photo.name}` : 'No file selected'}
          </span>
        </div>
        <button onClick={handleUpload} disabled={loading} className="btn btn-primary" style={{ padding: '12px 24px' }}>
          {loading ? '⏳ Analyzing Soil Sample...' : '🔬 Analyze Health & Crop Suitability'}
        </button>
      </div>
      
      {result && (
        <div className="card" style={{ borderLeft: '8px solid #16a34a' }}>
          <div style={{ display: 'inline-block', background: '#bbf7d0', color: '#000000', padding: '3px 8px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
            Diagnostic Results
          </div>
          <h3 style={{ color: '#000000', fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Analysis Report</h3>
          <p><strong>Soil Type:</strong> {result.type}</p>
          <p><strong>Health Condition:</strong> {result.health}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '14px 0' }}>
            <div style={{ background: '#ffffff', padding: '12px', border: '2px solid #16a34a', color: '#000000' }}>
              <strong>pH Level:</strong> <span style={{ fontSize: 18, fontWeight: 900, color: '#15803d' }}>{result.ph}</span>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', border: '2px solid #0284c7', color: '#000000' }}>
              <strong>Moisture:</strong> <span style={{ fontSize: 18, fontWeight: 900, color: '#0369a1' }}>{result.moisture}</span>
            </div>
          </div>
          <p><strong>Nutrients (N-P-K):</strong> {result.nutrients?.N} - {result.nutrients?.P} - {result.nutrients?.K}</p>
          
          <div style={{ marginTop: '16px' }}>
            <strong style={{ color: '#000000' }}>Recommended Crops for High Yield:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {result.crops?.map(c => (
                <span key={c} style={{ background: '#00eb78', color: '#000000', padding: '6px 14px', fontWeight: 900, border: '1px solid #000000' }}>
                  🌾 {c}
                </span>
              ))}
            </div>
          </div>
          
          {result.reportId && (
            <div style={{ marginTop: '18px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => handleDownloadPdf(result.reportId)} className="btn btn-dark">
                📄 Download Official PDF
              </button>
              <button onClick={() => handleShare(result.reportId, result)} className="btn btn-primary">
                💬 Share Report on WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ color: '#ffffff', fontWeight: 900, marginBottom: 12 }}>📈 Historical Health Trends</h3>
          <div className="card" style={{ marginBottom: '24px' }}>
            <Line options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Soil pH & Moisture Timeline' } } }} data={chartData} />
          </div>

          <h3 style={{ color: '#ffffff', fontWeight: 900, marginBottom: 12 }}>📋 Previous Soil Health Reports</h3>
          {history.map((h, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>{new Date(h.timestamp).toLocaleString()}</div>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#000000' }}>{h.analysis?.type || 'Standard Soil Profile'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleDownloadPdf(h.reportId)} className="btn btn-dark" style={{ padding: '8px 14px', fontSize: 12 }}>PDF</button>
                <button onClick={() => handleShare(h.reportId, h.analysis)} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>Share</button>
                <button onClick={() => setResult({ ...h.analysis, reportId: h.reportId })} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, borderColor: '#000000', color: '#000000' }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}