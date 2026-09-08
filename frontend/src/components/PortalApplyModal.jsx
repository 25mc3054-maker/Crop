import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function PortalApplyModal({
  isOpen,
  onClose,
  scheme,
  batchSchemes = [],
  onApplicationSuccess,
  onOpenProfile
}) {
  const isBatch = Array.isArray(batchSchemes) && batchSchemes.length > 0;
  
  // Captcha state
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(true);

  // Scheme Requirement Match state
  const [matchData, setMatchData] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(true);

  // Dispatch progress state
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStage, setDispatchStage] = useState(0); // 0: Idle, 1: Validating, 2: Captcha Handshake, 3: DBT Gateway Dispatch, 4: Done
  const [receipt, setReceipt] = useState(null);
  const [batchReceipts, setBatchReceipts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setReceipt(null);
      setBatchReceipts([]);
      setCaptchaInput('');
      setDispatchStage(0);
      loadCaptcha();
      if (!isBatch && scheme?.id) {
        loadSchemeMatch(scheme.id);
      } else {
        setLoadingMatch(false);
      }
    }
  }, [isOpen, scheme, batchSchemes]);

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

  const loadCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await axios.get(`${API_BASE_URL}/api/portal/captcha`);
      if (res.data?.captcha) {
        setCaptchaData(res.data.captcha);
        setCaptchaInput('');
      }
    } catch (err) {
      console.error('Failed to load captcha', err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  const loadSchemeMatch = async (schemeId) => {
    try {
      setLoadingMatch(true);
      const res = await axios.get(`${API_BASE_URL}/api/portal/scheme-match/${schemeId}`, {
        headers: getAuthHeaders()
      });
      if (res.data?.match) {
        setMatchData(res.data.match);
      }
    } catch (err) {
      console.error('Failed to load scheme match', err);
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaInput.trim()) {
      setError('Please enter the security verification captcha characters.');
      return;
    }

    try {
      setError(null);
      setDispatching(true);

      // Visual step animation
      setDispatchStage(1); // Validating attributes
      await new Promise(r => setTimeout(r, 600));

      setDispatchStage(2); // Captcha handshake
      await new Promise(r => setTimeout(r, 600));

      setDispatchStage(3); // Direct DBT Gateway transmission

      if (isBatch) {
        // Batch Apply
        const res = await axios.post(`${API_BASE_URL}/api/portal/batch-apply`, {
          schemeIds: batchSchemes.map(s => s.id),
          sessionId: captchaData?.sessionId,
          captchaInput: captchaInput.trim()
        }, {
          headers: getAuthHeaders()
        });

        if (res.data?.ok) {
          setBatchReceipts(res.data.receipts || []);
          setDispatchStage(4);
          if (onApplicationSuccess) onApplicationSuccess(res.data);
        }
      } else {
        // Single Scheme Apply
        const res = await axios.post(`${API_BASE_URL}/api/portal/apply-direct`, {
          schemeId: scheme.id,
          schemeName: scheme.name,
          sessionId: captchaData?.sessionId,
          captchaInput: captchaInput.trim()
        }, {
          headers: getAuthHeaders()
        });

        if (res.data?.ok) {
          setReceipt(res.data.application);
          setDispatchStage(4);
          if (onApplicationSuccess) onApplicationSuccess(res.data.application);
        }
      }
    } catch (err) {
      console.error('Portal dispatch failed', err);
      setError(err.response?.data?.error || 'Portal submission failed. Please verify the Captcha code and try again.');
      setDispatchStage(0);
      loadCaptcha();
    } finally {
      setDispatching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 28, 19, 0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5100,
      padding: 16
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        maxWidth: 680,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge-sharp" style={{ background: '#5ca346', color: '#ffffff', fontSize: 10, fontWeight: 900 }}>
                DIRECT PORTAL DISPATCH GATEWAY
              </span>
              <span style={{ fontSize: 12, color: '#a7f3d0' }}>
                Encrypted Auto-Submission Protocol
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
              {isBatch 
                ? `⚡ Batch 1-Click Submission (${batchSchemes.length} Schemes)`
                : `⚡ 1-Click Apply: ${scheme?.name || 'Government Scheme'}`
              }
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          
          {/* Dispatch Animation Stage Indicator */}
          {dispatchStage > 0 && dispatchStage < 4 && (
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #5ca346',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              marginBottom: 20
            }}>
              <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4, borderColor: '#5ca346', borderTopColor: 'transparent', margin: '0 auto 16px auto' }}></div>
              <h3 style={{ color: '#182c1d', fontWeight: 900, margin: '0 0 6px 0', fontSize: 18 }}>
                {dispatchStage === 1 && '🔐 Step 1: Matching Universal Digi-Locker Attributes...'}
                {dispatchStage === 2 && '🛡️ Step 2: Authenticating Security Captcha Handshake...'}
                {dispatchStage === 3 && '🚀 Step 3: Transmitting Signed Application to Ministry DBT Gateway...'}
              </h3>
              <p style={{ color: '#496150', fontSize: 13, margin: 0 }}>
                Directly registering your credentials with the government database. Please do not close this window.
              </p>
            </div>
          )}

          {/* SUCCESS RECEIPT VIEW (Single or Batch) */}
          {dispatchStage === 4 && (receipt || batchReceipts.length > 0) && (
            <div>
              <div style={{
                background: '#ecfdf5',
                border: '2px solid #10b981',
                borderRadius: 14,
                padding: '20px 24px',
                textAlign: 'center',
                marginBottom: 20
              }}>
                <span style={{ fontSize: 44 }}>✅</span>
                <h3 style={{ color: '#065f46', fontSize: 20, fontWeight: 900, margin: '8px 0 4px 0' }}>
                  Official Government Application Registered!
                </h3>
                <p style={{ color: '#047857', fontSize: 13, margin: 0 }}>
                  Your application has been directly dispatched to the official ministry portal via the Krishi-Net Digi-Locker Gateway.
                </p>
              </div>

              {/* Single Application Digital Receipt */}
              {receipt && (
                <div style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 10, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#065f46', textTransform: 'uppercase' }}>Government Registration No:</span>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#182c1d', letterSpacing: '0.5px' }}>
                        {receipt.governmentRefId}
                      </div>
                    </div>
                    <span className="badge-sharp" style={{ background: '#10b981', color: '#ffffff', fontSize: 11 }}>
                      ✓ TRANSMITTED
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, color: '#334155', marginBottom: 14 }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Applicant Name:</strong>
                      <span>{receipt.applicantSnapshot?.fullName}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Aadhaar Number:</strong>
                      <span>{receipt.applicantSnapshot?.aadhaarMasked}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Farmland / Khasra:</strong>
                      <span>{receipt.applicantSnapshot?.surveyKhasraNo}, {receipt.applicantSnapshot?.village}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Target Official Portal:</strong>
                      <span style={{ color: '#047857', fontWeight: 800 }}>{receipt.portal}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Submission Timestamp:</strong>
                      <span>{new Date(receipt.submissionTimestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Verification Token:</strong>
                      <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{receipt.verificationHash}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                    <a
                      href={receipt.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '10px 14px', fontSize: 13, fontWeight: 900, backgroundColor: '#5ca346' }}
                    >
                      Track on Official Portal ↗
                    </a>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="btn btn-dark"
                      style={{ padding: '10px 18px', fontSize: 13, fontWeight: 800, backgroundColor: '#182c1d' }}
                    >
                      🖨️ Print Digi-Receipt
                    </button>
                  </div>
                </div>
              )}

              {/* Batch Applications List */}
              {batchReceipts.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 900, color: '#182c1d' }}>
                    Submitted Schemes & Registration Tracking Numbers:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {batchReceipts.map((br, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{br.schemeName}</div>
                          <div style={{ fontSize: 12, color: '#047857', fontWeight: 900, marginTop: 2 }}>
                            Ref ID: {br.governmentRefId}
                          </div>
                        </div>
                        <a
                          href={br.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: '#5ca346', fontWeight: 800, textDecoration: 'none' }}
                        >
                          Track Status ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontSize: 13, fontWeight: 900, backgroundColor: '#182c1d' }}
                >
                  Done & Back to Schemes
                </button>
              </div>
            </div>
          )}

          {/* NORMAL APPLICATION FLOW: MATCH CHECK + CAPTCHA ENTRY */}
          {dispatchStage === 0 && (
            <form onSubmit={handleSubmit}>
              
              {/* Batch Schemes Overview */}
              {isBatch && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#166534', marginBottom: 6 }}>
                    🌾 {batchSchemes.length} Schemes Selected for Simultaneous Submission:
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {batchSchemes.map(s => (
                      <span key={s.id} className="badge-sharp" style={{ background: '#182c1d', color: '#ffffff', fontSize: 10 }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Scheme Attributes Match Status */}
              {!isBatch && matchData && (
                <div style={{
                  background: matchData.isFullyMatched ? '#f7faf6' : '#fffbeb',
                  border: `1px solid ${matchData.isFullyMatched ? '#5ca346' : '#f59e0b'}`,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 18
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, color: '#182c1d' }}>
                      📋 Universal Profile Attributes Mapping:
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: matchData.isFullyMatched ? '#166534' : '#92400e' }}>
                      {matchData.matchedCount} of {matchData.totalRequired} Attributes Matched (100%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {matchData.matchedFields.map(m => (
                      <span key={m.field} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#334155' }}>
                        ✓ {m.field}: <strong>{String(m.value).slice(0, 16)}</strong>
                      </span>
                    ))}
                  </div>

                  {!matchData.isFullyMatched && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #fcd34d', fontSize: 12, color: '#92400e' }}>
                      Missing required fields: {matchData.missingFields.join(', ')}.
                      <button
                        type="button"
                        onClick={onOpenProfile}
                        style={{ marginLeft: 8, color: '#b45309', fontWeight: 800, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Click to Complete Profile →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE SECURITY CAPTCHA SECTION */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #5ca346',
                borderRadius: 12,
                padding: '18px 20px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 900, color: '#182c1d', display: 'block' }}>
                      🛡️ Official Portal Anti-Bot Security Captcha
                    </label>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Mandated by Government Direct Benefit Transfer security standards
                    </span>
                  </div>
                  <span className="badge-sharp" style={{ background: '#16a34a', color: '#ffffff', fontSize: 10 }}>
                    LIVE SECURITY TOKEN
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* Captcha Image / SVG */}
                  {loadingCaptcha ? (
                    <div style={{ width: 140, height: 42, background: '#e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Generating...</span>
                    </div>
                  ) : captchaData?.captchaImage ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={captchaData.captchaImage}
                        alt="Security Captcha"
                        style={{ height: 44, borderRadius: 6, border: '1px solid #cbd5e1', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#ef4444' }}>Failed to load captcha</div>
                  )}

                  {/* Reload button */}
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    title="Generate new Captcha"
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      color: '#1e293b'
                    }}
                  >
                    🔄 New Code
                  </button>

                  {/* Captcha Input */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={captchaInput}
                      onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="Enter 5-character Captcha"
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '2px solid #5ca346',
                        fontSize: 15,
                        fontWeight: 900,
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        color: '#182c1d',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 6, color: '#991b1b', fontSize: 12, fontWeight: 700 }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Submission Notice & Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 11, color: '#6b7280', maxWidth: 360 }}>
                  By clicking Submit, your Digi-Locker profile will be formatted according to ministry specifications and transmitted to the official portal.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline"
                    style={{ padding: '9px 16px', fontSize: 13, fontWeight: 800 }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={dispatching || !captchaInput.trim()}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: 14,
                      fontWeight: 900,
                      backgroundColor: '#5ca346',
                      borderColor: '#5ca346',
                      cursor: (dispatching || !captchaInput.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isBatch ? '🚀 Verify & Batch Apply' : '🚀 Verify & Dispatch to Portal'}
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
