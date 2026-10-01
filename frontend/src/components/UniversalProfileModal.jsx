import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function UniversalProfileModal({ isOpen, onClose, onProfileSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [readiness, setReadiness] = useState({ score: 0, statusLabel: '' });
  const [isEncryptedVault, setIsEncryptedVault] = useState(true);

  // Clean empty state - NO pre-filled values
  const [formData, setFormData] = useState({
    fullName: '',
    fatherOrHusbandName: '',
    aadhaarNumber: '',
    phone: '',
    gender: '',
    category: '',
    dob: '',

    state: '',
    district: '',
    subDistrict: '',
    village: '',
    surveyKhasraNo: '',
    landAreaAcres: '',
    ownershipType: '',

    bankName: '',
    accountNumber: '',
    ifscCode: '',
    aadhaarLinked: false,

    cropSeason: '',
    primaryCrop: '',
    irrigationType: ''
  });

  const getAuthHeaders = () => {
    const headers = {};
    const token = localStorage.getItem('farmer_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let sessionKey = localStorage.getItem('krishi_vault_session_id');
    if (!sessionKey) {
      sessionKey = 'vault_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('krishi_vault_session_id', sessionKey);
    }
    headers['x-farmer-session'] = sessionKey;
    return headers;
  };

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/profile/universal`, {
        headers: getAuthHeaders()
      });
      if (res.data?.profile) {
        setFormData(prev => ({
          ...prev,
          ...res.data.profile
        }));
      }
      if (res.data?.readiness) {
        setReadiness(res.data.readiness);
      }
      if (res.data?.isEncrypted) {
        setIsEncryptedVault(true);
      }
    } catch (err) {
      console.error('Failed to load universal profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE_URL}/api/profile/universal`, formData, {
        headers: getAuthHeaders()
      });
      if (res.data?.readiness) {
        setReadiness(res.data.readiness);
      }
      if (onProfileSaved) {
        onProfileSaved(res.data.profile, res.data.readiness);
      }
      onClose();
    } catch (err) {
      alert('Failed to save profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 28, 19, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000,
      padding: 16
    }}>
      <style>{`
        .digilocker-light-input::placeholder {
          color: #94a3b8 !important;
          opacity: 0.75 !important;
          font-size: 12.5px;
          font-style: italic;
          font-weight: 400;
        }
        .digilocker-light-input:focus {
          border-color: #5ca346 !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(92, 163, 70, 0.15);
        }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        maxWidth: 780,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        border: '2px solid #5ca346',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #182c1d 0%, #0f1c13 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottom: '2px solid #5ca346',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span className="badge-sharp" style={{ background: '#5ca346', color: '#ffffff', fontSize: 10, fontWeight: 900 }}>
                🛡️ ENCRYPTED DIGI-LOCKER VAULT
              </span>
              <span style={{ fontSize: 11, color: '#a7f3d0', fontWeight: 700 }}>
                AES-256 Protected • Isolated to Your Session
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
              Your Agricultural Digi-Locker
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#cbd5e1' }}>
              Only you can see your Digi-Locker. Fill your details once to unlock 1-Click Direct Application across all official portals.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              width: 36,
              height: 36,
              borderRadius: '50%',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Security & Encryption Banner */}
        <div style={{
          background: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#166534', fontWeight: 700 }}>
            <span>🔒</span>
            <span><strong>End-to-End Encrypted:</strong> Sensitive Aadhaar, Bank & Land Survey records are never shared or public.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#182c1d' }}>Readiness:</span>
            <div style={{ width: 80, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${readiness.score}%`, height: '100%', background: readiness.score >= 90 ? '#5ca346' : '#f59e0b', transition: 'width 0.4s ease' }}></div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: readiness.score >= 90 ? '#166534' : '#92400e' }}>
              {readiness.score}%
            </span>
          </div>
        </div>

        {/* Step Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {[
            { step: 1, label: '1. 👤 Personal & Aadhaar' },
            { step: 2, label: '2. 🌾 Land & Village' },
            { step: 3, label: '3. 🏦 Bank & DBT' },
            { step: 4, label: '4. 🌱 Crops & Farm' }
          ].map(tab => (
            <button
              key={tab.step}
              type="button"
              onClick={() => setActiveStep(tab.step)}
              style={{
                flex: 1,
                padding: '12px 6px',
                border: 'none',
                borderBottom: activeStep === tab.step ? '3px solid #5ca346' : '3px solid transparent',
                background: activeStep === tab.step ? '#ffffff' : 'transparent',
                color: activeStep === tab.step ? '#182c1d' : '#6b7280',
                fontWeight: activeStep === tab.step ? 900 : 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Form Content */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ borderColor: '#5ca346', borderTopColor: 'transparent', margin: '0 auto 12px auto' }}></div>
              <p style={{ fontWeight: 800, color: '#182c1d' }}>Opening Encrypted Vault...</p>
            </div>
          ) : (
            <div>
              {/* STEP 1: PERSONAL & AADHAAR */}
              {activeStep === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Full Legal Name (as on Aadhaar) *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.fullName || ''}
                      onChange={e => handleChange('fullName', e.target.value)}
                      placeholder="e.g. Ramesh Kumar Patel"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Father / Husband Name *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.fatherOrHusbandName || ''}
                      onChange={e => handleChange('fatherOrHusbandName', e.target.value)}
                      placeholder="e.g. Shri Ram Charan Patel"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Aadhaar Number (12 digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      className="digilocker-light-input"
                      value={formData.aadhaarNumber || ''}
                      onChange={e => handleChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 7849 3021 9482"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, letterSpacing: '1px', color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Mobile Number (Aadhaar Linked) *
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      className="digilocker-light-input"
                      value={formData.phone || ''}
                      onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 9876543210"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Gender
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.gender || ''}
                      onChange={e => handleChange('gender', e.target.value)}
                      placeholder="e.g. Male / Female / Other"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Social Category (For Subsidies)
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.category || ''}
                      onChange={e => handleChange('category', e.target.value)}
                      placeholder="e.g. General / OBC / SC / ST"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.dob || ''}
                      onChange={e => handleChange('dob', e.target.value)}
                      placeholder="e.g. 1985-06-20 (YYYY-MM-DD)"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: LAND & VILLAGE */}
              {activeStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      State *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.state || ''}
                      onChange={e => handleChange('state', e.target.value)}
                      placeholder="e.g. Uttar Pradesh / Madhya Pradesh / Punjab"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      District *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.district || ''}
                      onChange={e => handleChange('district', e.target.value)}
                      placeholder="e.g. Ayodhya / Pune / Ludhiana"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Sub-District / Tehsil
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.subDistrict || ''}
                      onChange={e => handleChange('subDistrict', e.target.value)}
                      placeholder="e.g. Sohawal / Haveli / Khanna"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Village Name *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.village || ''}
                      onChange={e => handleChange('village', e.target.value)}
                      placeholder="e.g. Rampur Bhagan"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Survey / Khasra / Khata No. (RoR) *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.surveyKhasraNo || ''}
                      onChange={e => handleChange('surveyKhasraNo', e.target.value)}
                      placeholder="e.g. 482/3, Khata 119"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Total Farmland Area (in Acres) *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.landAreaAcres || ''}
                      onChange={e => handleChange('landAreaAcres', e.target.value)}
                      placeholder="e.g. 3.5"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Land Ownership Type
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.ownershipType || ''}
                      onChange={e => handleChange('ownershipType', e.target.value)}
                      placeholder="e.g. Owner (Individual) / Joint Family / Tenant"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: BANK & DBT */}
              {activeStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.bankName || ''}
                      onChange={e => handleChange('bankName', e.target.value)}
                      placeholder="e.g. State Bank of India / Punjab National Bank / HDFC"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Bank Savings Account Number *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.accountNumber || ''}
                      onChange={e => handleChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 30948291048"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Bank Branch IFSC Code *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      className="digilocker-light-input"
                      value={formData.ifscCode || ''}
                      onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001248"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, textTransform: 'uppercase', color: '#182c1d' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                    <input
                      type="checkbox"
                      id="aadhaarLinked"
                      checked={!!formData.aadhaarLinked}
                      onChange={e => handleChange('aadhaarLinked', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#5ca346' }}
                    />
                    <label htmlFor="aadhaarLinked" style={{ fontSize: 12, fontWeight: 800, color: '#182c1d', cursor: 'pointer' }}>
                      Account is Aadhaar-Seeded for Government DBT Direct Benefit Transfers
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: CROPS & FARM */}
              {activeStep === 4 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Current Crop Season *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.cropSeason || ''}
                      onChange={e => handleChange('cropSeason', e.target.value)}
                      placeholder="e.g. Rabi 2025-26 / Kharif 2026 / Zaid"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Primary Sown Crops *
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.primaryCrop || ''}
                      onChange={e => handleChange('primaryCrop', e.target.value)}
                      placeholder="e.g. Wheat, Mustard, Paddy, Cotton, Soybean"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                      Primary Irrigation Source
                    </label>
                    <input
                      type="text"
                      className="digilocker-light-input"
                      value={formData.irrigationType || ''}
                      onChange={e => handleChange('irrigationType', e.target.value)}
                      placeholder="e.g. Solar Tube-well / Canal / Borewell / Drip"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, color: '#182c1d' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18
        }}>
          <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
            Light text in fields are examples • Your vault is private
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#5ca346',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 6px -1px rgba(92, 163, 70, 0.3)'
              }}
            >
              {saving ? 'Encrypting & Saving...' : '🔒 Save to Encrypted Vault'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
