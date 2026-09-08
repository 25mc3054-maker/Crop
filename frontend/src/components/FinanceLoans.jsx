import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import Navbar from './Navbar';

export default function FinanceLoans({ onBack }) {
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'private_finance_company' | 'private_individual'
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // EMI / Interest Calculator State
  const [calcAmount, setCalcAmount] = useState(50000);
  const [calcRatePerMonth, setCalcRatePerMonth] = useState(1.25);
  const [calcMonths, setCalcMonths] = useState(6);

  // Farmer Loan Request Modal State
  const [selectedLender, setSelectedLender] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [village, setVillage] = useState('');
  const [landAcres, setLandAcres] = useState('2.5');
  const [requestedAmount, setRequestedAmount] = useState('50000');
  const [loanPurpose, setLoanPurpose] = useState('Urgent Seed, Fertilizer & Labor Expenses');
  const [applying, setApplying] = useState(false);

  // Register New Private Lender Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [newLenderData, setNewLenderData] = useState({
    name: '',
    type: 'private_finance_company',
    registrationNumber: '',
    ownerOrContactPerson: '',
    phone: '',
    email: '',
    state: 'Andhra Pradesh',
    district: '',
    availablePool: '500000',
    maxAmountPerFarmer: '150000',
    interestRate: '1.25',
    tenure: '3 to 12 Months',
    loanPurpose: 'Urgent Farm Inputs & Crop Cultivation',
    collateralRequirement: 'Crop Lien / Mutual Community Trust',
    disbursementTime: 'Within 24 Hours',
    notes: 'Registered lender willing to provide direct seasonal credit to farmers.'
  });

  useEffect(() => {
    fetchPrivateLenders();
    // Pre-fill user profile info if logged in
    try {
      const token = localStorage.getItem('farmer_token');
      const name = localStorage.getItem('farmer_name');
      const phone = localStorage.getItem('farmer_phone');
      const vill = localStorage.getItem('farmer_village');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setFarmerName(name || payload.name || '');
        setFarmerPhone(phone || payload.phone || '');
        setVillage(vill || payload.village || '');
      } else {
        if (name) setFarmerName(name);
        if (phone) setFarmerPhone(phone);
        if (vill) setVillage(vill);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchPrivateLenders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/finance/private-lenders`);
      if (res.data?.lenders) {
        setLenders(res.data.lenders);
      }
    } catch (err) {
      console.error('Failed to fetch private lenders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (lender) => {
    setSelectedLender(lender);
    setCalcRatePerMonth(lender.interestRate || 1.25);
    setRequestedAmount(String(Math.min(50000, lender.maxAmountPerFarmer || 50000)));
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!farmerName || !farmerPhone) {
      setToast({ type: 'error', message: 'Please provide your full name and 10-digit mobile number' });
      return;
    }
    if (farmerPhone.replace(/\D/g, '').length !== 10) {
      setToast({ type: 'error', message: 'Mobile number must be exactly 10 digits' });
      return;
    }

    setApplying(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/finance/apply-private-lender`, {
        lenderId: selectedLender?.id,
        farmerName,
        phone: farmerPhone,
        village,
        loanAmount: requestedAmount,
        loanPurpose,
        landAcres
      });

      if (res.data?.ok) {
        setShowApplyModal(false);
        setToast({
          type: 'success',
          message: `✓ Loan request dispatched to ${selectedLender?.name}! They will contact you directly at ${farmerPhone}.`
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to submit loan request.' });
    } finally {
      setApplying(false);
    }
  };

  const handleRegisterLenderSubmit = async (e) => {
    e.preventDefault();
    if (!newLenderData.name || !newLenderData.phone) {
      setToast({ type: 'error', message: 'Lender name and contact phone are required' });
      return;
    }

    setRegistering(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/finance/register-private-lender`, newLenderData);
      if (res.data?.ok) {
        setShowRegisterModal(false);
        setToast({
          type: 'success',
          message: `✓ Registered successfully! ${newLenderData.name} is now active and listed on Krishi-Net.`
        });
        fetchPrivateLenders();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to register as private lender.' });
    } finally {
      setRegistering(false);
    }
  };

  const filteredLenders = lenders.filter(l => {
    const matchesType = typeFilter === 'all' ? true : l.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q ? true : (
      l.name.toLowerCase().includes(q) ||
      (l.ownerOrContactPerson && l.ownerOrContactPerson.toLowerCase().includes(q)) ||
      (l.district && l.district.toLowerCase().includes(q)) ||
      (l.state && l.state.toLowerCase().includes(q)) ||
      (l.loanPurpose && l.loanPurpose.toLowerCase().includes(q))
    );
    return matchesType && matchesQ;
  });

  // Calculate monthly interest outgo
  const monthlyInterestRateFraction = Number(calcRatePerMonth) / 100;
  const monthlyInterestAmount = Math.round(Number(calcAmount) * monthlyInterestRateFraction);
  const totalInterestOverTenure = monthlyInterestAmount * Number(calcMonths);
  const totalRepayment = Number(calcAmount) + totalInterestOverTenure;

  return (
    <div style={{ minHeight: '100vh', padding: '16px 12px 60px', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <div className="container" style={{ width: '96%', maxWidth: '1720px', margin: '0 auto' }}>
        
        {toast && (
          <div style={{ position: 'fixed', right: 24, top: 24, zIndex: 6000, maxWidth: 460 }}>
            <div className="card" style={{ padding: '14px 20px', background: toast.type === 'success' ? '#182c1d' : '#fee2e2', color: toast.type === 'success' ? '#dcfce7' : '#991b1b', border: toast.type === 'success' ? '2px solid #5ca346' : '2px solid #ef4444', boxShadow: '0 12px 28px rgba(0,0,0,0.35)', borderRadius: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.4 }}>{toast.message}</div>
            </div>
          </div>
        )}

        <Navbar 
          title="🤝 Registered Private Farmer Lending Network" 
          showBack={true} 
          onBack={onBack} 
        />

        {/* Hero Banner: Verified Registered Private Lenders Notice */}
        <div style={{
          background: 'linear-gradient(135deg, #182c1d 0%, #0f1c13 100%)',
          border: '2px solid #f59e0b',
          borderRadius: 16,
          padding: '22px 26px',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(24, 44, 29, 0.25)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ maxWidth: 840 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className="badge-sharp" style={{ background: '#f59e0b', color: '#000000', fontSize: 11, fontWeight: 900 }}>
                  🤝 REGISTERED PLATFORM LENDERS ONLY
                </span>
                <span style={{ fontSize: 12, color: '#fef08a', fontWeight: 700 }}>
                  Private Finance Companies & Private Individuals Willing to Lend on Krishi-Net
                </span>
              </div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: 'clamp(20px, 3.2vw, 28px)', fontWeight: 900 }}>
                Direct Private Agricultural Lending Hub
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#fef9c3', lineHeight: 1.5 }}>
                This section exclusively features <strong>Private Finance Companies (NBFCs / Microfinance Institutions)</strong> and <strong>Private Individuals (Rural Agri-Financiers & P2P Lenders)</strong> who have explicitly <strong>registered on our web platform</strong> and are actively willing to provide loans to farmers. All lenders are verified through registration records.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="btn btn-primary"
                style={{
                  padding: '12px 22px',
                  fontSize: 14,
                  fontWeight: 900,
                  backgroundColor: '#f59e0b',
                  borderColor: '#d97706',
                  color: '#000000',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}
              >
                <span>➕</span> Register as Private Lender
              </button>
            </div>
          </div>

          {/* Key Trust Guarantees */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fef9c3' }}>
              <span>✓</span>
              <span><strong>100% Platform Verified:</strong> Registration ID & Contact confirmed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fef9c3' }}>
              <span>✓</span>
              <span><strong>No Random Ads:</strong> Only lenders actively offering capital here</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fef9c3' }}>
              <span>✓</span>
              <span><strong>Fast 24-Hour Disbursement:</strong> Same-day cash or UPI to farmer</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setTypeFilter('all')}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 900,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: typeFilter === 'all' ? '#f59e0b' : '#ffffff',
                color: typeFilter === 'all' ? '#000000' : '#182c1d',
                boxShadow: typeFilter === 'all' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              All Registered Lenders ({lenders.length})
            </button>

            <button
              onClick={() => setTypeFilter('private_finance_company')}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 900,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: typeFilter === 'private_finance_company' ? '#f59e0b' : '#ffffff',
                color: typeFilter === 'private_finance_company' ? '#000000' : '#182c1d',
                boxShadow: typeFilter === 'private_finance_company' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              🏢 Private Finance Companies (NBFCs) ({lenders.filter(l => l.type === 'private_finance_company').length})
            </button>

            <button
              onClick={() => setTypeFilter('private_individual')}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 900,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: typeFilter === 'private_individual' ? '#f59e0b' : '#ffffff',
                color: typeFilter === 'private_individual' ? '#000000' : '#182c1d',
                boxShadow: typeFilter === 'private_individual' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)'
              }}
            >
              👤 Private Individuals / Rural Financiers ({lenders.filter(l => l.type === 'private_individual').length})
            </button>
          </div>

          <input
            type="text"
            placeholder="🔍 Search by lender, district, state..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              width: '280px',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        {/* Two-Column Layout: Registered Lenders Grid + Interactive Monthly Interest Calculator */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
          
          {/* COLUMN 1: REGISTERED PRIVATE LENDERS DIRECTORY */}
          <div style={{ gridColumn: 'span 2' }}>
            {loading ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ borderColor: '#f59e0b', borderTopColor: 'transparent', margin: '0 auto 12px auto' }}></div>
                <p style={{ color: '#182c1d', fontWeight: 800 }}>Loading verified registered private lenders...</p>
              </div>
            ) : filteredLenders.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', background: '#ffffff' }}>
                <span style={{ fontSize: 40 }}>🤝</span>
                <h3 style={{ margin: '8px 0', color: '#182c1d' }}>No Registered Private Lenders Matching Search</h3>
                <p style={{ color: '#64748b', fontSize: 13 }}>
                  Only private finance companies and individuals registered on our web platform are displayed.
                </p>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="btn btn-primary"
                  style={{ marginTop: 12, backgroundColor: '#f59e0b', color: '#000000', fontWeight: 900 }}
                >
                  Register as the First Private Lender in this Area →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {filteredLenders.map(lender => (
                  <div
                    key={lender.id}
                    className="card"
                    style={{
                      padding: 22,
                      background: '#ffffff',
                      color: '#000000',
                      borderLeft: lender.type === 'private_finance_company' ? '6px solid #f59e0b' : '6px solid #10b981',
                      border: '1px solid #e2ece0',
                      borderRadius: 14,
                      boxShadow: '0 4px 14px rgba(24, 44, 29, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: lender.type === 'private_finance_company' ? '#fef3c7' : '#eaf7e6',
                            color: lender.type === 'private_finance_company' ? '#92400e' : '#2e7d32'
                          }}>
                            {lender.type === 'private_finance_company' ? '🏢 Registered Private Finance Company (NBFC)' : '👤 Registered Private Individual Lender'}
                          </span>
                          <span className="badge-sharp" style={{ background: '#15803d', color: '#ffffff', fontSize: 10 }}>
                            ✓ Registered & Willing to Lend
                          </span>
                        </div>

                        <h3 style={{ margin: '4px 0 2px 0', fontSize: 19, fontWeight: 900, color: '#0f172a' }}>
                          {lender.name}
                        </h3>
                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                          Contact: <strong>{lender.ownerOrContactPerson}</strong> • 📍 {lender.district ? `${lender.district}, ` : ''}{lender.state}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', background: '#fffbeb', padding: '8px 14px', borderRadius: 8, border: '1px solid #fef3c7' }}>
                        <span style={{ fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Monthly Interest</span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#b45309' }}>
                          {lender.interestRate}% <span style={{ fontSize: 12, color: '#78350f' }}>/ month</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>
                          {lender.interestRateLabel || 'Simple Interest'}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, margin: '10px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Available Capital Pool:</span>
                        <strong style={{ color: '#0f172a' }}>{lender.availablePoolLabel}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Max Loan per Farmer:</span>
                        <strong style={{ color: '#15803d' }}>{lender.maxAmountLabel}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Disbursement Speed:</span>
                        <strong style={{ color: '#0f172a' }}>⚡ {lender.disbursementTime}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Tenure:</span>
                        <strong style={{ color: '#0f172a' }}>{lender.tenure}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#334155', margin: '8px 0', lineHeight: 1.45 }}>
                      <div><strong>🎯 Loan Purpose:</strong> {lender.loanPurpose}</div>
                      <div style={{ marginTop: 2 }}><strong>🔒 Collateral / Security:</strong> {lender.collateralRequirement}</div>
                      {lender.notes && <div style={{ marginTop: 4, color: '#475569', fontStyle: 'italic' }}>💬 "{lender.notes}"</div>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                        ★ Platform Track Record: {lender.platformRating || 'Verified Registered Lender'}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          href={`tel:${lender.phone}`}
                          className="btn btn-outline"
                          style={{ padding: '9px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          📞 Call Lender
                        </a>
                        <button
                          type="button"
                          onClick={() => handleApplyClick(lender)}
                          className="btn btn-primary"
                          style={{ padding: '9px 18px', fontSize: 13, fontWeight: 900, backgroundColor: '#f59e0b', borderColor: '#d97706', color: '#000000' }}
                        >
                          ⚡ Request Loan from {lender.name.split(' ')[0]} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: INTERACTIVE PRIVATE LOAN INTEREST CALCULATOR */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div className="card" style={{ padding: 22, background: '#ffffff', color: '#000000', border: '2px solid #f59e0b', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🧮</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#182c1d' }}>
                    Private Loan Monthly Interest Calculator
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Calculate monthly simple interest outgo</span>
                </div>
              </div>

              {/* Amount Slider */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>Loan Amount:</label>
                  <strong style={{ color: '#b45309', fontSize: 15 }}>₹{Number(calcAmount).toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="300000"
                  step="10000"
                  value={calcAmount}
                  onChange={e => setCalcAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                  <span>₹10,000</span>
                  <span>₹1.50 Lakh</span>
                  <span>₹3.00 Lakh</span>
                </div>
              </div>

              {/* Rate Selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Interest Rate (% per month):
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1.0, 1.25, 1.5, 2.0].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCalcRatePerMonth(r)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        fontSize: 12,
                        fontWeight: 800,
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: calcRatePerMonth === r ? '#f59e0b' : '#f1f5f9',
                        color: calcRatePerMonth === r ? '#000000' : '#334155'
                      }}
                    >
                      {r}% / mo
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Slider */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>Tenure:</label>
                  <strong style={{ color: '#334155', fontSize: 14 }}>{calcMonths} Months</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={calcMonths}
                  onChange={e => setCalcMonths(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>

              {/* Result Summary */}
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#78350f' }}>Monthly Interest Due:</span>
                  <strong style={{ fontSize: 16, color: '#b45309' }}>₹{monthlyInterestAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#78350f' }}>Total Interest for {calcMonths} mos:</span>
                  <strong style={{ fontSize: 14, color: '#b45309' }}>₹{totalInterestOverTenure.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #fef08a', fontSize: 13, fontWeight: 900 }}>
                  <span style={{ color: '#182c1d' }}>Total Principal + Interest:</span>
                  <span style={{ color: '#15803d' }}>₹{totalRepayment.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Banner for prospective lenders */}
              <div style={{ marginTop: 18, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                  Are you a private lender or finance company?
                </div>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="btn btn-outline"
                  style={{ marginTop: 8, width: '100%', padding: '8px', fontSize: 12, fontWeight: 900 }}
                >
                  Register on Krishi-Net →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: FARMER LOAN REQUEST TO REGISTERED LENDER */}
        {showApplyModal && selectedLender && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6000,
            padding: 16
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 560,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                  <span className="badge-sharp" style={{ background: '#f59e0b', color: '#000000', fontSize: 10 }}>
                    Direct Private Lender Request
                  </span>
                  <h3 style={{ margin: '4px 0 2px 0', fontSize: 19, fontWeight: 900, color: '#182c1d' }}>
                    Request Loan from {selectedLender.name}
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Contact: {selectedLender.ownerOrContactPerson} • Rate: {selectedLender.interestRate}%/month
                  </span>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4b5563' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fefce8', padding: 12, borderRadius: 8, border: '1px solid #fef08a', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Lender Limit:</span>
                    <strong>{selectedLender.maxAmountLabel}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Disbursement:</span>
                    <strong>⚡ {selectedLender.disbursementTime}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmerName}
                    onChange={e => setFarmerName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      10-Digit Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={farmerPhone}
                      onChange={e => setFarmerPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Village / Area
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={e => setVillage(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Amount Requested (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="5000"
                      max={selectedLender.maxAmountPerFarmer || 300000}
                      step="5000"
                      value={requestedAmount}
                      onChange={e => setRequestedAmount(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Farm Land (Acres)
                    </label>
                    <input
                      type="text"
                      value={landAcres}
                      onChange={e => setLandAcres(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                    Purpose of Loan
                  </label>
                  <input
                    type="text"
                    value={loanPurpose}
                    onChange={e => setLoanPurpose(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '10px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 900, backgroundColor: '#f59e0b', borderColor: '#d97706', color: '#000000' }}
                  >
                    {applying ? 'Dispatching Request...' : 'Send Loan Request to Lender →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: REGISTER AS A PRIVATE LENDER ON KRISHI-NET */}
        {showRegisterModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6000,
            padding: 16
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 640,
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                  <span className="badge-sharp" style={{ background: '#f59e0b', color: '#000000', fontSize: 10 }}>
                    Lender Onboarding
                  </span>
                  <h3 style={{ margin: '4px 0 2px 0', fontSize: 20, fontWeight: 900, color: '#182c1d' }}>
                    Register as a Private Lender on Krishi-Net
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Offer direct agricultural financing to verified farmers across India
                  </span>
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4b5563' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterLenderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Lender Type Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                    Select Lender Category *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setNewLenderData({ ...newLenderData, type: 'private_finance_company' })}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: newLenderData.type === 'private_finance_company' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                        background: newLenderData.type === 'private_finance_company' ? '#fef3c7' : '#ffffff',
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                        color: '#92400e'
                      }}
                    >
                      🏢 Private Finance Company / NBFC
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewLenderData({ ...newLenderData, type: 'private_individual' })}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: newLenderData.type === 'private_individual' ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: newLenderData.type === 'private_individual' ? '#eaf7e6' : '#ffffff',
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                        color: '#2e7d32'
                      }}
                    >
                      👤 Private Individual / Rural Financier
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      {newLenderData.type === 'private_finance_company' ? 'Company / Firm Name *' : 'Your Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={newLenderData.type === 'private_finance_company' ? 'e.g. Kisan Samriddhi Finance Ltd' : 'e.g. K. Narayana Rao'}
                      value={newLenderData.name}
                      onChange={e => setNewLenderData({ ...newLenderData, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      placeholder="Managing Director / Owner"
                      value={newLenderData.ownerOrContactPerson}
                      onChange={e => setNewLenderData({ ...newLenderData, ownerOrContactPerson: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      10-Digit Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="98XXXXXXXX"
                      value={newLenderData.phone}
                      onChange={e => setNewLenderData({ ...newLenderData, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Registration / License / PAN / ID
                    </label>
                    <input
                      type="text"
                      placeholder="RBI NBFC ID or PAN / Aadhaar"
                      value={newLenderData.registrationNumber}
                      onChange={e => setNewLenderData({ ...newLenderData, registrationNumber: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Operating State
                    </label>
                    <input
                      type="text"
                      value={newLenderData.state}
                      onChange={e => setNewLenderData({ ...newLenderData, state: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      District / Operating Region
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. West Godavari / All Districts"
                      value={newLenderData.district}
                      onChange={e => setNewLenderData({ ...newLenderData, district: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Total Available Lending Pool (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="500000"
                      value={newLenderData.availablePool}
                      onChange={e => setNewLenderData({ ...newLenderData, availablePool: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Max Loan per Farmer (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="150000"
                      value={newLenderData.maxAmountPerFarmer}
                      onChange={e => setNewLenderData({ ...newLenderData, maxAmountPerFarmer: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Proposed Interest Rate (% per month) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      placeholder="1.25"
                      value={newLenderData.interestRate}
                      onChange={e => setNewLenderData({ ...newLenderData, interestRate: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Disbursement Speed
                    </label>
                    <select
                      value={newLenderData.disbursementTime}
                      onChange={e => setNewLenderData({ ...newLenderData, disbursementTime: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    >
                      <option value="Same Day Cash">Same Day Cash / UPI</option>
                      <option value="Within 24 Hours">Within 24 Hours</option>
                      <option value="Within 48 Hours">Within 48 Hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                    Collateral / Trust Requirements
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mutual Trust & Village Reference (No Land Mortgage)"
                    value={newLenderData.collateralRequirement}
                    onChange={e => setNewLenderData({ ...newLenderData, collateralRequirement: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                    Additional Terms / Notes for Farmers
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Repayment accepted post-harvest directly at local mandi or through UPI."
                    value={newLenderData.notes}
                    onChange={e => setNewLenderData({ ...newLenderData, notes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '10px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registering}
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 900, backgroundColor: '#f59e0b', borderColor: '#d97706', color: '#000000' }}
                  >
                    {registering ? 'Registering...' : '✓ Complete Registration & List On Platform'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
