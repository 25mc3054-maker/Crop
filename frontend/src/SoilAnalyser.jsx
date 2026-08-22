import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
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

      const res = await axios.get(`${API_BASE_URL}/soil-report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const file = new File([res.data], `soil-report-${reportId}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Soil Health Report',
          text: `Soil Health Report: ${analysis?.type || 'Analysis'}`
        });
        return;
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Share failed', e);
    }

    // Fallback: WhatsApp Text Share
    const a = analysis || {};
    const text = `*SOIL HEALTH REPORT*\nType: ${a.type}\nHealth: ${a.health}\npH: ${a.ph}\nCrops: ${a.crops?.join(', ') || 'N/A'}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleUpload = async () => {
    if (!photo) return alert("Please select a soil photo first");
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
      
      // Refresh history
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

  // Prepare chart data (reverse history to show oldest to newest)
  const chartData = {
    labels: [...history].reverse().map(h => new Date(h.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'pH Level',
        data: [...history].reverse().map(h => parseFloat(h.analysis?.ph || 0)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Moisture (%)',
        data: [...history].reverse().map(h => parseFloat(h.analysis?.moisture || 0)),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Use CSS utility classes for buttons to follow theme
  // small helper inline styles kept only for spacing where needed

  return (
    <div className="container">
      <button onClick={onBack} style={{ ...secondaryButtonStyle, marginBottom: '1rem' }}>&larr; Back to Dashboard</button>
      <h1>Soil Health Analyser</h1>
      <p>Upload a photo of your farm soil to get a health report and crop recommendations.</p>

      <div className="card">
        <input
          id="soil-photo-input"
          type="file"
          accept="image/*"
          onChange={e => setPhoto(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="soil-photo-input" className="btn btn-ghost" style={{ display: 'inline-block' }}>
            Choose Soil Photo
          </label>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {photo ? photo.name : 'No file selected'}
          </span>
        </div>
        <button onClick={handleUpload} disabled={loading} className="btn btn-primary" style={{ marginTop: '14px', opacity: loading ? 0.75 : 1 }}>
          {loading ? 'Analyzing Soil...' : 'Analyze Health & Crops'}
        </button>
      </div>
      
      {result && (
        <div className="card result" style={{ borderLeft: '5px solid #4CAF50' }}>
          <h3>Analysis Report</h3>
          <p><strong>Soil Type:</strong> {result.type}</p>
          <p><strong>Health Condition:</strong> {result.health}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '10px 0' }}>
            <div style={{ background: '#f1f8e9', padding: '10px', borderRadius: '5px' }}>
              <strong>pH Level:</strong> {result.ph}
            </div>
            <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '5px' }}>
              <strong>Moisture:</strong> {result.moisture}
            </div>
          </div>
          <p><strong>Nutrients (N-P-K):</strong> {result.nutrients?.N} - {result.nutrients?.P} - {result.nutrients?.K}</p>
          
          <div style={{ marginTop: '15px' }}>
            <strong>Recommended Crops:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
              {result.crops?.map(c => <span key={c} style={{ background: '#2e7d32', color: 'white', padding: '5px 12px', borderRadius: '15px' }}>{c}</span>)}
            </div>
          </div>
          
          {result.reportId && (
            <div style={{ marginTop: '15px' }}>
              <button onClick={() => handleDownloadPdf(result.reportId)} className="btn btn-ghost" style={{ marginRight: '10px' }}>Download PDF</button>
              <button onClick={() => handleShare(result.reportId, result)} className="btn btn-primary" style={{ padding: '10px 18px' }}>Share on WhatsApp</button>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Health Trends</h3>
          <div className="card" style={{ marginBottom: '20px' }}>
            <Line options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Soil pH & Moisture Over Time' } } }} data={chartData} />
          </div>

          <h3>Previous Reports</h3>
          {history.map((h, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>{new Date(h.timestamp).toLocaleString()}</div>
                <div style={{ fontWeight: 'bold' }}>{h.analysis?.type || 'Unknown Soil'}</div>
              </div>
              <div>
                <button onClick={() => handleDownloadPdf(h.reportId)} className="btn btn-ghost" style={{ padding: '7px 12px', marginRight: '6px' }}>PDF</button>
                <button onClick={() => handleShare(h.reportId, h.analysis)} className="btn btn-primary" style={{ padding: '7px 12px', marginRight: '6px', boxShadow: 'none' }}>Share</button>
                <button onClick={() => setResult({ ...h.analysis, reportId: h.reportId })} className="btn btn-ghost" style={{ padding: '7px 12px' }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}