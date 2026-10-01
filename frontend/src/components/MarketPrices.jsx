import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { REGIONAL_LANGUAGES, DUAL_DICTIONARY, getDualCropName, UI_LANG_STRINGS, playDualVoice } from '../languageHelper'
import { getCropAgronomyDetails } from '../cropKnowledgeData'
import Navbar from './Navbar'

// Deterministic price history generation for every crop (7d, 15d, 30d, 3m, 6m, 1y)
export function getCropHistory(crop, timeframe = '7d') {
  const days = timeframe === '1y' ? 365 : timeframe === '6m' ? 180 : timeframe === '3m' ? 90 : timeframe === '30d' ? 30 : timeframe === '15d' ? 15 : 7;
  const currentPrice = Number(crop.modalPrice || crop.priceInr || 2000);
  const change24h = Number(crop.change24h || 0);
  const totalChangePct = change24h !== 0 ? change24h * (Math.min(days, 60) / 7) : 1.2;
  const baseDelta = (totalChangePct / 100) * currentPrice;
  const volatility = Math.max(currentPrice * 0.018, 14);

  let hash = 0;
  const key = String(crop.symbol || crop.crop || 'CROP');
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  // Determine number of sampling points for clean rendering
  const numPoints = days > 180 ? 36 : days > 60 ? 30 : days > 15 ? 24 : days;
  const stepDays = days / (numPoints - 1);
  const points = [];
  const now = new Date();

  for (let idx = 0; idx < numPoints; idx++) {
    const daysAgo = Math.round((numPoints - 1 - idx) * stepDays);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(days > 180 ? { year: '2-digit' } : {}) });

    if (daysAgo === 0 || idx === numPoints - 1) {
      points.push({
        index: idx,
        dayLabel: 'Today',
        dateStr: dateLabel,
        price: currentPrice
      });
    } else {
      const progress = idx / (numPoints - 1);
      const wave = Math.sin(((hash % 100) + idx * 19) * 0.2) * volatility + Math.cos(idx * 0.35) * (volatility * 0.6);
      const sim = Math.round(currentPrice - (baseDelta * (1 - progress)) + wave);
      points.push({
        index: idx,
        dayLabel: dateLabel,
        dateStr: dateLabel,
        price: Math.max(10, sim)
      });
    }
  }

  const prices = points.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const startPrice = points[0].price;
  const endPrice = points[points.length - 1].price;
  const netChange = endPrice - startPrice;
  const netChangePct = Number(((netChange / startPrice) * 100).toFixed(1));

  return {
    points,
    min,
    max,
    startPrice,
    endPrice,
    netChange,
    netChangePct,
    isUp: netChange >= 0
  };
}

// Mini Sparkline Graph for table row
export function MiniPriceSparkline({ crop }) {
  const history = getCropHistory(crop, '7d');
  const { points, min, max, isUp, netChangePct } = history;
  const range = max - min || 1;

  const width = 160;
  const height = 36;
  const padX = 4;
  const padY = 4;

  const coords = points.map((p, idx) => {
    const x = padX + (idx / (points.length - 1)) * (width - 2 * padX);
    const y = height - padY - ((p.price - min) / range) * (height - 2 * padY);
    return { x, y, price: p.price, date: p.dateStr };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${(width - padX).toFixed(1)} ${height} L ${padX} ${height} Z`;

  const strokeColor = isUp ? '#16a34a' : '#dc2626';
  const fillColor = isUp ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)';

  return (
    <div style={{ padding: '4px 6px', background: '#f8faf8', border: '1px solid #e2ece0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
          7D Trend
        </span>
        <span style={{ fontSize: 9, fontWeight: 900, color: strokeColor }}>
          {isUp ? `+${netChangePct}%` : `${netChangePct}%`}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 26, display: 'block' }}>
        <path d={areaD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.5" fill={strokeColor} />
      </svg>
    </div>
  );
}

// Full Interactive Price Chart with Timeframes, 4 Stat Cards & Movable Tooltip (Blueprint Image 1)
export function FullPriceGraph({ crop, timeframe = '7d', setTimeframe }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const svgRef = useRef(null);

  const history = getCropHistory(crop, timeframe);
  const { points, min, max, isUp, netChange, netChangePct, startPrice, endPrice } = history;
  const range = max - min || 1;

  const width = 540;
  const height = 210;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const coords = points.map((p, idx) => {
    const x = padLeft + (idx / (points.length - 1)) * plotW;
    const y = padTop + plotH - ((p.price - min) / range) * plotH;
    return { ...p, x, y };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${(padLeft + plotW).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${padLeft} ${(padTop + plotH).toFixed(1)} Z`;

  const strokeColor = isUp ? '#16a34a' : '#dc2626';
  const gradId = `full-grad-${crop.symbol || 'crop'}-${timeframe}`;

  // Handle pointer/touch move for smooth movable price dot & tooltip
  const handlePointerMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    if (clientX === null) return;
    const svgX = ((clientX - rect.left) / rect.width) * width;
    
    let closestIdx = 0;
    let minDiff = Infinity;
    coords.forEach((pt, i) => {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const activePoint = hoveredIndex !== null ? coords[hoveredIndex] : coords[coords.length - 1];
  const unitText = crop.unit === 'litre' ? 'Per Litre' : crop.unit === 'kg' ? 'Per kg' : 'Per Quintal (100kg)';

  return (
    <div>
      {/* 4 Summary Metric Tiles - Exactly as shown in Blueprint Image 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#f8fafc', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Current Price</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>₹{endPrice.toLocaleString('en-US')}</div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{unitText}</div>
        </div>

        <div style={{ background: '#f0fdf4', padding: '10px 12px', border: '1.5px solid #86efac', borderRadius: '4px' }}>
          <div style={{ fontSize: 10, color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Period High</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>₹{max.toLocaleString('en-US')}</div>
          <div style={{ fontSize: 10, color: '#15803d', fontWeight: 600 }}>Peak in selected window</div>
        </div>

        <div style={{ background: '#fef2f2', padding: '10px 12px', border: '1.5px solid #fca5a5', borderRadius: '4px' }}>
          <div style={{ fontSize: 10, color: '#991b1b', fontWeight: 800, textTransform: 'uppercase' }}>Period Low</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>₹{min.toLocaleString('en-US')}</div>
          <div style={{ fontSize: 10, color: '#b91c1c', fontWeight: 600 }}>Lowest in selected window</div>
        </div>

        <div style={{ background: isUp ? '#f0fdf4' : '#fef2f2', padding: '10px 12px', border: `1.5px solid ${isUp ? '#86efac' : '#fca5a5'}`, borderRadius: '4px' }}>
          <div style={{ fontSize: 10, color: isUp ? '#166534' : '#991b1b', fontWeight: 800, textTransform: 'uppercase' }}>NET Change</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: isUp ? '#16a34a' : '#dc2626', marginTop: 2 }}>
            {isUp ? `+₹${netChange.toLocaleString('en-US')}` : `-₹${Math.abs(netChange).toLocaleString('en-US')}`}
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: isUp ? '#15803d' : '#b91c1c' }}>
            {isUp ? `▲ +${netChangePct}%` : `▼ ${netChangePct}%`}
          </div>
        </div>
      </div>

      {/* SVG Interactive Wave Graph with Movable Tooltip */}
      <div 
        style={{ 
          background: '#ffffff', 
          border: '1.5px solid #d1d5db', 
          borderRadius: '4px',
          padding: '12px 10px 6px', 
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          style={{ width: '100%', height: 210, display: 'block', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padTop + plotH * ratio;
            const priceVal = Math.round(max - ratio * range);
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padLeft - 6} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#64748b" fontWeight="700">
                  ₹{priceVal.toLocaleString('en-US')}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${gradId})`} />

          {/* Main Curve Line */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dotted Vertical Movable Line & Dot */}
          {activePoint && (
            <g>
              <line 
                x1={activePoint.x} 
                y1={padTop} 
                x2={activePoint.x} 
                y2={padTop + plotH} 
                stroke="#64748b" 
                strokeWidth="1.5" 
                strokeDasharray="4,4" 
              />
              <circle cx={activePoint.x} cy={activePoint.y} r="5.5" fill={strokeColor} stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* Floating Movable Tooltip (Price Movable) */}
          {activePoint && (
            <g transform={`translate(${Math.max(padLeft, Math.min(width - padRight - 120, activePoint.x - 60))}, ${Math.max(4, activePoint.y - 42)})`}>
              <rect width="120" height="34" rx="4" fill="#0f172a" fillOpacity="0.95" />
              <text x="60" y="13" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="700">
                {activePoint.dateStr}
              </text>
              <text x="60" y="27" textAnchor="middle" fill="#4ade80" fontSize="11.5" fontWeight="900">
                ₹{activePoint.price.toLocaleString('en-US')}
              </text>
            </g>
          )}

          {/* X-Axis Date Labels */}
          {coords.filter((_, idx) => idx === 0 || idx === Math.floor(coords.length / 2) || idx === coords.length - 1).map((c, i) => (
            <text key={i} x={c.x} y={height - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontSize="9" fill="#94a3b8" fontWeight="700">
              {c.dateStr}
            </text>
          ))}
        </svg>

        <div style={{ textAlign: 'center', fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
          👆 Hover or drag cursor across chart to inspect daily benchmark quotes
        </div>
      </div>

      {/* Timeframe Selector Buttons - Exactly as in Blueprint Image 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 12 }}>
        {[
          { id: '7d', label: '7 days' },
          { id: '15d', label: '15 days' },
          { id: '30d', label: '30 days' },
          { id: '3m', label: '3 month' },
          { id: '6m', label: '6 month' },
          { id: '1y', label: '1 Year' }
        ].map(tf => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setTimeframe(tf.id)}
            style={{
              padding: '8px 2px',
              fontSize: 11.5,
              fontWeight: 800,
              border: timeframe === tf.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
              background: timeframe === tf.id ? '#e8f9ee' : '#ffffff',
              color: timeframe === tf.id ? '#166534' : '#334155',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const ALL_CROP_MARKET_RATES = [
  // --- GRAINS & CEREALS ---
  {
    symbol: 'WHEAT',
    crop: 'Wheat (Gehun)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 2475,
    modalPrice: 2475,
    minPrice: 2320,
    maxPrice: 2650,
    mspInr: 2275,
    change24h: 1.8,
    benchmarkMandi: 'Khanna Mandi',
    state: 'Punjab',
    district: 'Ludhiana',
    variety: 'Sharbati / Lokwan',
    description: 'Milling grade premium wheat'
  },
  {
    symbol: 'PADDY_BASMATI',
    crop: 'Paddy (Basmati)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 3850,
    modalPrice: 3850,
    minPrice: 3500,
    maxPrice: 4200,
    mspInr: 2300,
    change24h: 2.2,
    benchmarkMandi: 'Karnal Mandi',
    state: 'Haryana',
    district: 'Karnal',
    variety: 'Pusa 1121',
    description: 'Long grain aromatic basmati'
  },
  {
    symbol: 'PADDY_COMMON',
    crop: 'Paddy (Common / Dhan)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 2320,
    modalPrice: 2320,
    minPrice: 2200,
    maxPrice: 2450,
    mspInr: 2300,
    change24h: 0.5,
    benchmarkMandi: 'Burdwan Mandi',
    state: 'West Bengal',
    district: 'Purba Bardhaman',
    variety: 'Grade A Common',
    description: 'Fine staple white paddy'
  },
  {
    symbol: 'MAIZE',
    crop: 'Maize / Corn (Makka)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 2180,
    modalPrice: 2180,
    minPrice: 2050,
    maxPrice: 2320,
    mspInr: 2090,
    change24h: -0.8,
    benchmarkMandi: 'Davangere Mandi',
    state: 'Karnataka',
    district: 'Davanagere',
    variety: 'Yellow Hybrid',
    description: 'Industrial feed and starch grade'
  },
  {
    symbol: 'BAJRA',
    crop: 'Pearl Millet (Bajra)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 2540,
    modalPrice: 2540,
    minPrice: 2380,
    maxPrice: 2700,
    mspInr: 2500,
    change24h: 1.2,
    benchmarkMandi: 'Jaipur Mandi',
    state: 'Rajasthan',
    district: 'Jaipur',
    variety: 'Deshi Bold',
    description: 'Nutritive drought-hardy millet'
  },
  {
    symbol: 'JOWAR',
    crop: 'Sorghum (Jowar)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 3220,
    modalPrice: 3220,
    minPrice: 3050,
    maxPrice: 3450,
    mspInr: 3180,
    change24h: 0.9,
    benchmarkMandi: 'Solapur Mandi',
    state: 'Maharashtra',
    district: 'Solapur',
    variety: 'Maldandi White',
    description: 'Staple rabi sorghum grain'
  },
  {
    symbol: 'BARLEY',
    crop: 'Barley (Jau)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 1980,
    modalPrice: 1980,
    minPrice: 1850,
    maxPrice: 2150,
    mspInr: 1850,
    change24h: -1.1,
    benchmarkMandi: 'Alwar Mandi',
    state: 'Rajasthan',
    district: 'Alwar',
    variety: 'Malt / Feed Quality',
    description: 'Brewery and feed standard'
  },
  {
    symbol: 'RAGI',
    crop: 'Finger Millet (Ragi)',
    category: 'Cereals',
    unit: 'qtl',
    priceInr: 3890,
    modalPrice: 3890,
    minPrice: 3650,
    maxPrice: 4100,
    mspInr: 3846,
    change24h: 2.1,
    benchmarkMandi: 'Mysuru Mandi',
    state: 'Karnataka',
    district: 'Mysuru',
    variety: 'Brown Finger',
    description: 'Calcium-rich superfood millet'
  },

  // --- PULSES & DAL ---
  {
    symbol: 'CHANA',
    crop: 'Gram / Chickpea (Chana)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 5850,
    modalPrice: 5850,
    minPrice: 5500,
    maxPrice: 6200,
    mspInr: 5440,
    change24h: 1.5,
    benchmarkMandi: 'Bikaner Mandi',
    state: 'Rajasthan',
    district: 'Bikaner',
    variety: 'Desi Chana Bold',
    description: 'High milling flour quality'
  },
  {
    symbol: 'ARHAR',
    crop: 'Pigeon Pea (Tur / Arhar)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 9450,
    modalPrice: 9450,
    minPrice: 9000,
    maxPrice: 10200,
    mspInr: 7000,
    change24h: 3.4,
    benchmarkMandi: 'Gulbarga Mandi',
    state: 'Karnataka',
    district: 'Kalaburagi',
    variety: 'Maruti White Bold',
    description: 'Primary high-demand yellow dal'
  },
  {
    symbol: 'MOONG',
    crop: 'Green Gram (Moong)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 8250,
    modalPrice: 8250,
    minPrice: 7800,
    maxPrice: 8700,
    mspInr: 8558,
    change24h: 0.8,
    benchmarkMandi: 'Merta City Mandi',
    state: 'Rajasthan',
    district: 'Nagaur',
    variety: 'Shining Green Whole',
    description: 'Premium whole moong'
  },
  {
    symbol: 'URAD',
    crop: 'Black Gram (Urad)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 7950,
    modalPrice: 7950,
    minPrice: 7500,
    maxPrice: 8500,
    mspInr: 6950,
    change24h: -0.6,
    benchmarkMandi: 'Latur Mandi',
    state: 'Maharashtra',
    district: 'Latur',
    variety: 'FAQ Black Matpe',
    description: 'Essential fermentation pulse'
  },
  {
    symbol: 'MASOOR',
    crop: 'Red Lentil (Masoor)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 6520,
    modalPrice: 6520,
    minPrice: 6200,
    maxPrice: 6900,
    mspInr: 6425,
    change24h: 1.1,
    benchmarkMandi: 'Lalitpur Mandi',
    state: 'Uttar Pradesh',
    district: 'Lalitpur',
    variety: 'Small Red Whole',
    description: 'Export and domestic standard'
  },
  {
    symbol: 'PEAS',
    crop: 'Dry Green Peas (Matar)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 4200,
    modalPrice: 4200,
    minPrice: 3900,
    maxPrice: 4600,
    mspInr: null,
    change24h: 0.4,
    benchmarkMandi: 'Kanpur Mandi',
    state: 'Uttar Pradesh',
    district: 'Kanpur',
    variety: 'Green Dry Round',
    description: 'Commercial dry pea grade'
  },
  {
    symbol: 'RAJMA',
    crop: 'Kidney Beans (Rajma)',
    category: 'Pulses',
    unit: 'qtl',
    priceInr: 11200,
    modalPrice: 11200,
    minPrice: 10500,
    maxPrice: 12500,
    mspInr: null,
    change24h: 2.0,
    benchmarkMandi: 'Jammu Mandi',
    state: 'Jammu and Kashmir',
    district: 'Jammu',
    variety: 'Chitra Red Speckled',
    description: 'Premium mountain valley beans'
  },

  // --- OILSEEDS ---
  {
    symbol: 'SOYBEAN',
    crop: 'Soyabean (Yellow)',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 4680,
    modalPrice: 4680,
    minPrice: 4400,
    maxPrice: 4950,
    mspInr: 4600,
    change24h: 1.3,
    benchmarkMandi: 'Indore Mandi',
    state: 'Madhya Pradesh',
    district: 'Indore',
    variety: 'Yellow 9560',
    description: 'Solvent extraction grade'
  },
  {
    symbol: 'MUSTARD',
    crop: 'Mustard (Sarson)',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 5650,
    modalPrice: 5650,
    minPrice: 5350,
    maxPrice: 5950,
    mspInr: 5650,
    change24h: -0.5,
    benchmarkMandi: 'Bharatpur Mandi',
    state: 'Rajasthan',
    district: 'Bharatpur',
    variety: 'Black Sarson 42% Oil',
    description: 'High pungent edible oilseed'
  },
  {
    symbol: 'GROUNDNUT',
    crop: 'Groundnut in Shell (Mungfali)',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 6850,
    modalPrice: 6850,
    minPrice: 6400,
    maxPrice: 7300,
    mspInr: 6377,
    change24h: 1.7,
    benchmarkMandi: 'Rajkot Mandi',
    state: 'Gujarat',
    district: 'Rajkot',
    variety: 'GG-20 Bold Pods',
    description: 'Export grade bold peanuts'
  },
  {
    symbol: 'SUNFLOWER',
    crop: 'Sunflower Seed',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 6720,
    modalPrice: 6720,
    minPrice: 6350,
    maxPrice: 7100,
    mspInr: 6760,
    change24h: 0.6,
    benchmarkMandi: 'Kurnool Mandi',
    state: 'Andhra Pradesh',
    district: 'Kurnool',
    variety: 'Modern Hybrid',
    description: 'Premium edible polyunsaturated oil'
  },
  {
    symbol: 'SESAME',
    crop: 'Sesame Seed (Til)',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 12800,
    modalPrice: 12800,
    minPrice: 11800,
    maxPrice: 14000,
    mspInr: 8635,
    change24h: 2.8,
    benchmarkMandi: 'Palanpur Mandi',
    state: 'Gujarat',
    district: 'Banaskantha',
    variety: 'White Hulled 99.9%',
    description: 'High value export sesame'
  },
  {
    symbol: 'CASTOR',
    crop: 'Castor Seed (Arandi)',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 5890,
    modalPrice: 5890,
    minPrice: 5550,
    maxPrice: 6200,
    mspInr: null,
    change24h: -1.2,
    benchmarkMandi: 'Patan Mandi',
    state: 'Gujarat',
    district: 'Patan',
    variety: 'GCH Hybrid',
    description: 'Industrial lubricating oilseed'
  },
  {
    symbol: 'NIGER',
    crop: 'Niger Seed (Ramtil)',
    category: 'Oilseeds',
    unit: 'qtl',
    priceInr: 8650,
    modalPrice: 8650,
    minPrice: 8100,
    maxPrice: 9200,
    mspInr: 8734,
    change24h: 0.9,
    benchmarkMandi: 'Rayagada Mandi',
    state: 'Odisha',
    district: 'Rayagada',
    variety: 'Desi Tiny Seed',
    description: 'Traditional tribal oilseed'
  },

  // --- VEGETABLES ---
  {
    symbol: 'ONION',
    crop: 'Onion (Pyaaz)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 2150,
    modalPrice: 2150,
    minPrice: 1800,
    maxPrice: 2500,
    mspInr: null,
    change24h: 3.5,
    benchmarkMandi: 'Lasalgaon Mandi',
    state: 'Maharashtra',
    district: 'Nashik',
    variety: 'Nashik Red Medium',
    description: 'Asia benchmark onion market'
  },
  {
    symbol: 'POTATO',
    crop: 'Potato (Aloo)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 1420,
    modalPrice: 1420,
    minPrice: 1200,
    maxPrice: 1700,
    mspInr: null,
    change24h: -0.7,
    benchmarkMandi: 'Agra Mandi',
    state: 'Uttar Pradesh',
    district: 'Agra',
    variety: 'Jyoti / Pukhraj',
    description: 'Table fresh and storage potatoes'
  },
  {
    symbol: 'TOMATO',
    crop: 'Tomato (Tamatar)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 2250,
    modalPrice: 2250,
    minPrice: 1850,
    maxPrice: 2700,
    mspInr: null,
    change24h: 4.8,
    benchmarkMandi: 'Madanapalle Mandi',
    state: 'Andhra Pradesh',
    district: 'Annamayya',
    variety: 'Hybrid Firm Red',
    description: 'Transport quality table tomatoes'
  },
  {
    symbol: 'GREEN_CHILLI',
    crop: 'Green Chilli (Hari Mirch)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 3600,
    modalPrice: 3600,
    minPrice: 3000,
    maxPrice: 4400,
    mspInr: null,
    change24h: 1.2,
    benchmarkMandi: 'Belagavi Mandi',
    state: 'Karnataka',
    district: 'Belagavi',
    variety: 'Jwala Long Green',
    description: 'Pungent fresh vegetable pepper'
  },
  {
    symbol: 'GARLIC',
    crop: 'Garlic (Lahsun)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 11800,
    modalPrice: 11800,
    minPrice: 9800,
    maxPrice: 14500,
    mspInr: null,
    change24h: 2.5,
    benchmarkMandi: 'Mandsaur Mandi',
    state: 'Madhya Pradesh',
    district: 'Mandsaur',
    variety: 'Amleta Bold Cloves',
    description: 'Cured white bold garlic'
  },
  {
    symbol: 'GINGER',
    crop: 'Fresh Ginger (Adrak)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 7800,
    modalPrice: 7800,
    minPrice: 7000,
    maxPrice: 8800,
    mspInr: null,
    change24h: -1.4,
    benchmarkMandi: 'Wayanad Mandi',
    state: 'Kerala',
    district: 'Wayanad',
    variety: 'Fresh Green Root',
    description: 'High oil rhizome ginger'
  },
  {
    symbol: 'CAULIFLOWER',
    crop: 'Cauliflower (Phool Gobhi)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 1850,
    modalPrice: 1850,
    minPrice: 1500,
    maxPrice: 2300,
    mspInr: null,
    change24h: 0.5,
    benchmarkMandi: 'Vashi Mandi',
    state: 'Maharashtra',
    district: 'Navi Mumbai',
    variety: 'Snowball White Curd',
    description: 'Fresh vegetable curd'
  },
  {
    symbol: 'OKRA',
    crop: 'Bhindi (Ladies Finger)',
    category: 'Vegetables',
    unit: 'qtl',
    priceInr: 2850,
    modalPrice: 2850,
    minPrice: 2400,
    maxPrice: 3400,
    mspInr: null,
    change24h: 1.9,
    benchmarkMandi: 'Gajwel Mandi',
    state: 'Telangana',
    district: 'Siddipet',
    variety: 'Hybrid Tender Green',
    description: 'Tender fresh daily harvest'
  },

  // --- FRESH FRUITS ---
  {
    symbol: 'BANANA',
    crop: 'Banana (Kela)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 2400,
    modalPrice: 2400,
    minPrice: 2000,
    maxPrice: 2900,
    mspInr: null,
    change24h: 1.1,
    benchmarkMandi: 'Jalgaon Mandi',
    state: 'Maharashtra',
    district: 'Jalgaon',
    variety: 'Grand Naine (G9)',
    description: 'Export quality Cavendish bananas'
  },
  {
    symbol: 'APPLE',
    crop: 'Apple (Seb)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 8500,
    modalPrice: 8500,
    minPrice: 7200,
    maxPrice: 10500,
    mspInr: null,
    change24h: -0.9,
    benchmarkMandi: 'Shimla Mandi',
    state: 'Himachal Pradesh',
    district: 'Shimla',
    variety: 'Royal Delicious Extra',
    description: 'Himalayan cold-storage apple'
  },
  {
    symbol: 'MANGO',
    crop: 'Mango (Aam)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 6500,
    modalPrice: 6500,
    minPrice: 5200,
    maxPrice: 8200,
    mspInr: null,
    change24h: 3.2,
    benchmarkMandi: 'Ratnagiri Mandi',
    state: 'Maharashtra',
    district: 'Ratnagiri',
    variety: 'Alphonso / Hapus',
    description: 'King of fruits GI tagged'
  },
  {
    symbol: 'ORANGE',
    crop: 'Orange (Santra)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 4200,
    modalPrice: 4200,
    minPrice: 3600,
    maxPrice: 5100,
    mspInr: null,
    change24h: 0.4,
    benchmarkMandi: 'Nagpur Mandi',
    state: 'Maharashtra',
    district: 'Nagpur',
    variety: 'Nagpur Mandarin',
    description: 'Juicy GI sweet mandarin'
  },
  {
    symbol: 'POMEGRANATE',
    crop: 'Pomegranate (Anaar)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 9200,
    modalPrice: 9200,
    minPrice: 8000,
    maxPrice: 11000,
    mspInr: null,
    change24h: 1.8,
    benchmarkMandi: 'Solapur Mandi',
    state: 'Maharashtra',
    district: 'Solapur',
    variety: 'Bhagwa Red Arils',
    description: 'Export standard ruby arils'
  },
  {
    symbol: 'GRAPES',
    crop: 'Grapes (Angoor)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 5800,
    modalPrice: 5800,
    minPrice: 4800,
    maxPrice: 7200,
    mspInr: null,
    change24h: -1.3,
    benchmarkMandi: 'Nashik Mandi',
    state: 'Maharashtra',
    district: 'Nashik',
    variety: 'Thompson Seedless',
    description: 'Grape capital table fruit'
  },
  {
    symbol: 'PAPAYA',
    crop: 'Papaya (Papita)',
    category: 'Fruits',
    unit: 'qtl',
    priceInr: 1650,
    modalPrice: 1650,
    minPrice: 1350,
    maxPrice: 2100,
    mspInr: null,
    change24h: 0.7,
    benchmarkMandi: 'Anantapur Mandi',
    state: 'Andhra Pradesh',
    district: 'Anantapur',
    variety: 'Red Lady 786',
    description: 'Firm sweet table papaya'
  },

  // --- SPICES & CONDIMENTS ---
  {
    symbol: 'CHILLI_RED',
    crop: 'Dry Red Chilli (Lal Mirch)',
    category: 'Spices',
    unit: 'qtl',
    priceInr: 17200,
    modalPrice: 17200,
    minPrice: 15500,
    maxPrice: 19800,
    mspInr: null,
    change24h: 2.6,
    benchmarkMandi: 'Guntur Mandi',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    variety: 'Teja S17 Stemless',
    description: 'Asia largest red chilli market'
  },
  {
    symbol: 'TURMERIC',
    crop: 'Turmeric (Haldi)',
    category: 'Spices',
    unit: 'qtl',
    priceInr: 13800,
    modalPrice: 13800,
    minPrice: 12500,
    maxPrice: 15200,
    mspInr: null,
    change24h: 3.1,
    benchmarkMandi: 'Nizamabad Mandi',
    state: 'Telangana',
    district: 'Nizamabad',
    variety: 'Selam Finger High Curcumin',
    description: 'Pharmaceutical & culinary turmeric'
  },
  {
    symbol: 'CUMIN',
    crop: 'Cumin Seed (Jeera)',
    category: 'Spices',
    unit: 'qtl',
    priceInr: 27500,
    modalPrice: 27500,
    minPrice: 25000,
    maxPrice: 31000,
    mspInr: null,
    change24h: 1.4,
    benchmarkMandi: 'Unjha Mandi',
    state: 'Gujarat',
    district: 'Mehsana',
    variety: 'Machine Clean 99%',
    description: 'World benchmark cumin hub'
  },
  {
    symbol: 'CORIANDER',
    crop: 'Coriander Seed (Dhaniya)',
    category: 'Spices',
    unit: 'qtl',
    priceInr: 7850,
    modalPrice: 7850,
    minPrice: 7200,
    maxPrice: 8600,
    mspInr: null,
    change24h: -0.6,
    benchmarkMandi: 'Kota Mandi',
    state: 'Rajasthan',
    district: 'Kota',
    variety: 'Badami Green Bold',
    description: 'Aromatic essential spice'
  },
  {
    symbol: 'PEPPER_BLACK',
    crop: 'Black Pepper (Kali Mirch)',
    category: 'Spices',
    unit: 'qtl',
    priceInr: 62000,
    modalPrice: 62000,
    minPrice: 58000,
    maxPrice: 67000,
    mspInr: null,
    change24h: 1.0,
    benchmarkMandi: 'Kochi Mandi',
    state: 'Kerala',
    district: 'Ernakulam',
    variety: 'Malabar Garbled MG1',
    description: 'Black gold export standard'
  },
  {
    symbol: 'CARDAMOM_SMALL',
    crop: 'Small Cardamom (Elaichi)',
    category: 'Spices',
    unit: 'kg',
    priceInr: 2380,
    modalPrice: 2380,
    minPrice: 2150,
    maxPrice: 2650,
    mspInr: null,
    change24h: 2.2,
    benchmarkMandi: 'Vandanmettu Mandi',
    state: 'Kerala',
    district: 'Idukki',
    variety: '8mm Bold Green Alleppey',
    description: 'Queen of spices auction'
  },
  {
    symbol: 'FENUGREEK',
    crop: 'Fenugreek Seed (Methi)',
    category: 'Spices',
    unit: 'qtl',
    priceInr: 5600,
    modalPrice: 5600,
    minPrice: 5100,
    maxPrice: 6150,
    mspInr: null,
    change24h: 0.3,
    benchmarkMandi: 'Neemuch Mandi',
    state: 'Madhya Pradesh',
    district: 'Neemuch',
    variety: 'Bold Machine Cleaned',
    description: 'Digestive and culinary seed'
  },

  // --- COTTON & FIBRES ---
  {
    symbol: 'COTTON',
    crop: 'Cotton (Kapas)',
    category: 'Fibres',
    unit: 'qtl',
    priceInr: 7450,
    modalPrice: 7450,
    minPrice: 7000,
    maxPrice: 7900,
    mspInr: 7121,
    change24h: 1.2,
    benchmarkMandi: 'Warangal Mandi',
    state: 'Telangana',
    district: 'Warangal',
    variety: 'Shankar-6 Long Staple',
    description: 'Textile mill procurement'
  },
  {
    symbol: 'JUTE',
    crop: 'Raw Jute (Patson)',
    category: 'Fibres',
    unit: 'qtl',
    priceInr: 5200,
    modalPrice: 5200,
    minPrice: 4850,
    maxPrice: 5550,
    mspInr: 5050,
    change24h: 0.6,
    benchmarkMandi: 'Nadia Mandi',
    state: 'West Bengal',
    district: 'Nadia',
    variety: 'TD-5 Grade',
    description: 'Golden natural packaging fibre'
  },

  // --- COMMERCIAL CROPS ---
  {
    symbol: 'SUGARCANE',
    crop: 'Sugarcane (Ganna)',
    category: 'Commercial',
    unit: 'qtl',
    priceInr: 360,
    modalPrice: 360,
    minPrice: 330,
    maxPrice: 395,
    mspInr: 315,
    change24h: 0.0,
    benchmarkMandi: 'Muzaffarnagar Mandi',
    state: 'Uttar Pradesh',
    district: 'Muzaffarnagar',
    variety: 'Co-0238 High Recovery',
    description: 'Sugar mill gate benchmark'
  },
  {
    symbol: 'TOBACCO',
    crop: 'Tobacco (Tambaaku)',
    category: 'Commercial',
    unit: 'qtl',
    priceInr: 14500,
    modalPrice: 14500,
    minPrice: 13200,
    maxPrice: 16000,
    mspInr: null,
    change24h: 1.5,
    benchmarkMandi: 'Guntur Mandi',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    variety: 'FCV Flue-Cured Virginia',
    description: 'Tobacco Board auction standard'
  },
  {
    symbol: 'RUBBER',
    crop: 'Natural Rubber (RSS-4)',
    category: 'Commercial',
    unit: 'qtl',
    priceInr: 18400,
    modalPrice: 18400,
    minPrice: 17200,
    maxPrice: 19600,
    mspInr: null,
    change24h: -0.8,
    benchmarkMandi: 'Kottayam Mandi',
    state: 'Kerala',
    district: 'Kottayam',
    variety: 'Ribbed Smoked Sheet-4',
    description: 'Tyre manufacturing grade'
  },
  {
    symbol: 'TEA',
    crop: 'Tea Leaves (Chai Patti)',
    category: 'Commercial',
    unit: 'kg',
    priceInr: 240,
    modalPrice: 240,
    minPrice: 210,
    maxPrice: 280,
    mspInr: null,
    change24h: 1.1,
    benchmarkMandi: 'Dibrugarh Mandi',
    state: 'Assam',
    district: 'Dibrugarh',
    variety: 'CTC Green Leaf Grade',
    description: 'Assam auction standard'
  }
];

export default function MarketPrices({ onBack }) {
  const [rates, setRates] = useState(ALL_CROP_MARKET_RATES)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [regLang, setRegLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')
  const [viewMode, setViewMode] = useState('kisan') // 'kisan' | 'table'
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [modalTab, setModalTab] = useState('graph') // 'graph' | 'calc' | 'more'
  const [graphTimeframe, setGraphTimeframe] = useState('7d') // '7d' | '15d' | '30d' | '3m' | '6m' | '1y'
  const [calcQty, setCalcQty] = useState(10)
  const [speakingCrop, setSpeakingCrop] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showOnlySaved, setShowOnlySaved] = useState(false)
  
  // Persisted Saved / Bookmarked crops
  const [savedCrops, setSavedCrops] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_saved_crops')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const recognitionRef = useRef(null)
  const isNone = regLang === 'none'
  const currentStr = UI_LANG_STRINGS[regLang] || UI_LANG_STRINGS.none

  useEffect(() => {
    fetchRates(false)
    const interval = setInterval(() => fetchRates(false), 30000)

    const updateLang = () => {
      setRegLang(localStorage.getItem('krishi_secondary_lang') || 'none')
    }
    window.addEventListener('krishi_lang_changed', updateLang)
    window.addEventListener('storage', updateLang)

    return () => {
      clearInterval(interval)
      window.removeEventListener('krishi_lang_changed', updateLang)
      window.removeEventListener('storage', updateLang)
    }
  }, [selectedCategory])

  const fetchRates = async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() ? search.trim() : undefined,
        limit: 100
      }

      // 1. Primary: Server Mandi API
      let res = await axios.get(`${API_BASE_URL}/api/gov/rates`, { params }).catch(() => null)
      if (res && res.data && res.data.records && res.data.records.length > 0) {
        setRates(res.data.records)
        setLastUpdated(new Date().toLocaleTimeString())
        return
      }

      // 2. Fallback: Commodities-API / Daily benchmark engine
      res = await axios.get(`${API_BASE_URL}/commodities/rates`, { params }).catch(() => null)
      if (res && res.data && res.data.rates && res.data.rates.length > 0) {
        setRates(res.data.rates)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.warn('Live rates sync using default catalog:', err)
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  // Toggle Save / Bookmark Crop
  const toggleSaveCrop = (item, e) => {
    e && e.stopPropagation()
    const id = item.symbol || item.crop
    setSavedCrops(prev => {
      const exists = prev.includes(id)
      const updated = exists ? prev.filter(x => x !== id) : [...prev, id]
      try {
        localStorage.setItem('krishi_saved_crops', JSON.stringify(updated))
      } catch (err) {
        console.warn('Failed to save crop:', err)
      }
      return updated
    })
  }

  const openCropGraphModal = (item) => {
    setSelectedCrop(item)
    setModalTab('graph')
  }

  const openCropCalcModal = (item) => {
    setSelectedCrop(item)
    setModalTab('calc')
    setCalcQty(10)
  }

  const openCropMoreModal = (item) => {
    setSelectedCrop(item)
    setModalTab('more')
  }

  // Voice Announcement (Speaks Regional First, English Second)
  const handleSpeakCropDual = (item, e) => {
    e && e.stopPropagation()
    const cropInfo = getDualCropName(item.symbol || item.crop, regLang)
    const priceNum = (item.modalPrice || item.priceInr || 0).toLocaleString('en-US')
    const unitEn = item.unit === 'litre' ? 'per litre' : item.unit === 'kg' ? 'per kg' : 'per quintal (100 kg)'

    let enTrend = item.change24h > 0 ? 'Price is rising today.' : item.change24h < 0 ? 'Price is slightly down today.' : 'Price is steady today.'
    const enSpeech = `${cropInfo.en} live rate is ₹${priceNum} ${unitEn}. ${enTrend}`

    let regSpeech = ''
    if (regLang === 'te') {
      const trendStr = item.change24h > 0 ? 'ఈరోజు ధర పెరిగింది.' : 'ఈరోజు ధర తగ్గింది.'
      regSpeech = `${cropInfo.reg || cropInfo.en} ప్రత్యక్ష ధర ${priceNum} రూపాయలు. ${trendStr}`
    } else if (regLang === 'ta') {
      const trendStr = item.change24h > 0 ? 'இன்று விலை உயர்ந்துள்ளது.' : 'இன்று விலை குறைந்துள்ளது.'
      regSpeech = `${cropInfo.reg || cropInfo.en} நேரலை விலை ${priceNum} ரூபாய். ${trendStr}`
    } else if (regLang === 'kn') {
      const trendStr = item.change24h > 0 ? 'ಇಂದು ದರ ಹೆಚ್ಚಾಗಿದೆ.' : 'ಇಂದು ದರ ಕಡಿಮೆಯಾಗಿದೆ.'
      regSpeech = `${cropInfo.reg || cropInfo.en} ಇಂದಿನ ದರ ${priceNum} ರೂಪಾಯಿ. ${trendStr}`
    } else if (regLang === 'ml') {
      const trendStr = item.change24h > 0 ? 'ഇന്ന് വില കൂടിയിട്ടുണ്ട്.' : 'ഇന്ന് വില കുറവാണ്.'
      regSpeech = `${cropInfo.reg || cropInfo.en} വിപണി വില ${priceNum} രൂപ. ${trendStr}`
    } else if (regLang === 'mr') {
      const trendStr = item.change24h > 0 ? 'आज भावात तेजी आहे.' : 'आज भाव कमी आहे.'
      regSpeech = `${cropInfo.reg || cropInfo.en} चा आजचा भाव ${priceNum} रुपये आहे. ${trendStr}`
    } else if (regLang === 'bn') {
      const trendStr = item.change24h > 0 ? 'আজ দাম বৃদ্ধি পেয়েছে।' : 'আজ দাম কিছুটা কম।'
      regSpeech = `${cropInfo.reg || cropInfo.en} এর আজকের দর ${priceNum} টাকা। ${trendStr}`
    } else if (regLang === 'pa') {
      const trendStr = item.change24h > 0 ? 'ਅੱਜ ਭਾਅ ਤੇਜ਼ ਹੈ।' : 'ਅੱਜ ਭਾਅ ਮੰਦਾ ਹੈ।'
      regSpeech = `${cropInfo.reg || cropInfo.en} ਦਾ ਅੱਜ ਦਾ ਭਾਅ ${priceNum} ਰੁਪਏ ਹੈ। ${trendStr}`
    } else if (regLang === 'gu') {
      const trendStr = item.change24h > 0 ? 'આજે ભાવમાં તેજી છે.' : 'આજે ભાવ ઓછો છે.'
      regSpeech = `${cropInfo.reg || cropInfo.en} નો આજનો ભાવ ${priceNum} રૂપિયા છે. ${trendStr}`
    } else if (regLang === 'or') {
      const trendStr = item.change24h > 0 ? 'ଆଜି ଦର ବଢିଛି।' : 'ଆଜି ଦର କମ ଅଛି।'
      regSpeech = `${cropInfo.reg || cropInfo.en} ର ଆଜିର ଦର ${priceNum} ଟଙ୍କା। ${trendStr}`
    } else if (regLang === 'as') {
      const trendStr = item.change24h > 0 ? 'আজি মূল্য বৃদ্ধি পাইছে।' : 'আজি মূল্য কিছু কম।'
      regSpeech = `${cropInfo.reg || cropInfo.en} ৰ আজিৰ মূল্য ${priceNum} টকা। ${trendStr}`
    } else if (regLang === 'ur') {
      const trendStr = item.change24h > 0 ? 'آج ریٹ میں تیزی ہے۔' : 'آج ریٹ کم ہے۔'
      regSpeech = `${cropInfo.reg || cropInfo.en} کا آج کا ریٹ ${priceNum} روپے ہے۔ ${trendStr}`
    } else if (regLang === 'hi') {
      const trendStr = item.change24h > 0 ? 'आज भाव में तेजी है।' : 'आज भाव थोड़ा गिरा है।'
      regSpeech = `${cropInfo.reg || cropInfo.en} का आज का भाव ${priceNum} रुपये है। ${trendStr}`
    }

    setSpeakingCrop(item.symbol)
    playDualVoice(enSpeech, isNone ? '' : regSpeech, regLang, () => setSpeakingCrop(null))
  }

  // Voice Search
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is supported in Google Chrome, Edge, and Android browsers.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      const langCodes = { te: 'te-IN', hi: 'hi-IN', kn: 'kn-IN', mr: 'mr-IN', ta: 'ta-IN', ml: 'ml-IN', bn: 'bn-IN', pa: 'pa-IN', gu: 'gu-IN', or: 'or-IN', as: 'as-IN', ur: 'ur-IN' }
      recognition.lang = langCodes[regLang] || 'en-IN'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim()
        setSearch(transcript)
        setIsListening(false)
        playDualVoice(`Searching for ${transcript}`, `${transcript}`, regLang)
      }

      recognition.start()
    } catch (e) {
      console.warn('Speech recognition init error', e)
      setIsListening(false)
    }
  }

  const speakCalculatedTotalDual = () => {
    if (!selectedCrop) return
    const rate = Number(selectedCrop.modalPrice || selectedCrop.priceInr || 0)
    const total = Math.round(rate * calcQty).toLocaleString('en-US')
    const cropInfo = getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang)

    const enText = `For ${calcQty} quintals of ${cropInfo.en}, total benchmark value is ₹${total}.`
    let regText = `${calcQty} quintal ${cropInfo.reg || cropInfo.en} = ₹${total}`
    if (regLang === 'te') regText = `${calcQty} క్వింటాళ్ల ${cropInfo.reg || cropInfo.en} మొత్తం విలువ ${total} రూపాయలు.`
    else if (regLang === 'kn') regText = `${calcQty} ಕ್ವಿಂಟಾಲ್ ${cropInfo.reg || cropInfo.en} ಒಟ್ಟು ಮೌಲ್ಯ ${total} ರೂಪಾಯಿ.`
    else if (regLang === 'ta') regText = `${calcQty} குவிண்டால் ${cropInfo.reg || cropInfo.en} மொத்த மதிப்பு ${total} ரூபாய்.`
    else if (regLang === 'ml') regText = `${calcQty} ക്വിന്റൽ ${cropInfo.reg || cropInfo.en} ആകെ മൂല്യം ${total} രൂപ.`
    else if (regLang === 'mr') regText = `${calcQty} क्विंटल ${cropInfo.reg || cropInfo.en} चे एकूण मूल्य ${total} रुपये.`
    else if (regLang === 'hi') regText = `${calcQty} क्विंटल ${cropInfo.reg || cropInfo.en} का कुल मूल्य ${total} रुपये है।`

    setSpeakingCrop('calc')
    playDualVoice(enText, isNone ? '' : regText, regLang, () => setSpeakingCrop(null))
  }

  // Filter rates by search, category, and saved status
  const displayedRates = rates.filter(r => {
    const cropId = r.symbol || r.crop
    // 1. Saved filter
    if (showOnlySaved && !savedCrops.includes(cropId)) {
      return false
    }

    // 2. Search Query Match
    if (search.trim()) {
      const s = search.toLowerCase().trim()
      const cropInfo = getDualCropName(r.symbol || r.crop, regLang)
      const matchesSearch = (
        (r.crop && r.crop.toLowerCase().includes(s)) ||
        (r.symbol && r.symbol.toLowerCase().includes(s)) ||
        (r.variety && r.variety.toLowerCase().includes(s)) ||
        (cropInfo.en && cropInfo.en.toLowerCase().includes(s)) ||
        (cropInfo.reg && cropInfo.reg.toLowerCase().includes(s))
      )
      if (!matchesSearch) return false
    }

    // 3. Category Match
    if (selectedCategory !== 'All') {
      const cat = (r.category || '').toLowerCase()
      const targetCat = selectedCategory.toLowerCase()
      if (targetCat === 'cereals') {
        if (!cat.includes('cereal') && !cat.includes('grain')) return false
      } else if (targetCat === 'pulses') {
        if (!cat.includes('pulse') && !cat.includes('dal')) return false
      } else if (targetCat === 'oilseeds') {
        if (!cat.includes('oilseed')) return false
      } else if (targetCat === 'vegetables') {
        if (!cat.includes('veg')) return false
      } else if (targetCat === 'fruits') {
        if (!cat.includes('fruit')) return false
      } else if (targetCat === 'spices') {
        if (!cat.includes('spice')) return false
      } else if (targetCat === 'fibres') {
        if (!cat.includes('fibr') && !cat.includes('cotton')) return false
      } else if (targetCat === 'commercial') {
        if (!cat.includes('commercial') && !cat.includes('soft') && !cat.includes('plantation')) return false
      } else {
        if (!cat.includes(targetCat)) return false
      }
    }

    return true
  })

  // Selected crop agronomic knowledge for the "More" tab
  const selectedAgronomy = selectedCrop ? getCropAgronomyDetails(selectedCrop.crop || selectedCrop.symbol, selectedCrop.category, regLang) : null

  // Clean title without duplicate English repetitions
  const rawRegTitle = !isNone && DUAL_DICTIONARY.mandiRatesTitle[regLang] ? DUAL_DICTIONARY.mandiRatesTitle[regLang] : ''
  const displayTitle = rawRegTitle && rawRegTitle !== DUAL_DICTIONARY.mandiRatesTitle.en 
    ? `${DUAL_DICTIONARY.mandiRatesTitle.en} / ${rawRegTitle}`
    : DUAL_DICTIONARY.mandiRatesTitle.en

  const rawRegSub = !isNone && DUAL_DICTIONARY.mandiRatesSubtitle[regLang] ? DUAL_DICTIONARY.mandiRatesSubtitle[regLang] : ''
  const displaySubtitle = rawRegSub && rawRegSub !== DUAL_DICTIONARY.mandiRatesSubtitle.en
    ? `${DUAL_DICTIONARY.mandiRatesSubtitle.en} • ${rawRegSub}`
    : DUAL_DICTIONARY.mandiRatesSubtitle.en

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#111827' }}>
      {/* Global Standard Navigation Bar with farmer disclaimer in light font */}
      <Navbar 
        title="These prices are approxmate prices taken from various portals to help farmers to check day to day price changes but not for customers to check prices, verify the price when you sell . If you found any large difference in cost please intimate us"
        isLightTitle={true}
        showBack={true}
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5">
        
        {/* Modern Hero Card with Controls */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 mb-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-lg shadow-xs">
                  🌾
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {displayTitle}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">
                    {displaySubtitle}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button 
                onClick={() => {
                  const en = "Welcome to Krishi-Net live market price board. All benchmark commodity prices are updated with voice announcements."
                  const reg = currentStr.greeting || (regLang === 'hi' ? "ताज़ा मंडी भाव लोड हो चुके हैं।" : regLang === 'te' ? "తాజా మార్కెట్ ధరలు లోడ్ అయ్యాయి." : "")
                  playDualVoice(en, isNone ? '' : reg, regLang)
                }}
                className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
              >
                🔊 <span>Listen Prices</span>
              </button>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
                <button
                  onClick={() => { setViewMode('kisan'); setShowOnlySaved(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'kisan' && !showOnlySaved
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🌾 Easy Cards
                </button>
                <button
                  onClick={() => { setViewMode('table'); setShowOnlySaved(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'table' && !showOnlySaved
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Table View
                </button>
              </div>

              {/* Saved List Filter Button */}
              <button
                type="button"
                onClick={() => setShowOnlySaved(prev => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
                  showOnlySaved
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>{showOnlySaved ? '★' : '🔖'}</span>
                <span>Saved List</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  showOnlySaved ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {savedCrops.length}
                </span>
              </button>
            </div>
          </div>

          {/* Search & Voice Search Bar */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input 
                type="text" 
                placeholder="Search by crop name or variety (e.g. Wheat, Basmati, Corn, Soybean, Chilli, Tobacco)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Voice Search Button */}
            <button 
              type="button" 
              onClick={startVoiceSearch}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#2E7D32] hover:bg-[#1b5e20] text-white'
              }`}
            >
              <span>{isListening ? '🎙️ Listening...' : '🎙️ Voice Search'}</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'All', en: 'All 120+ Crops', icon: '🌾' },
              { id: 'Cereals', en: 'Grains & Cereals', icon: '🌾' },
              { id: 'Pulses', en: 'Pulses & Dal', icon: '🫘' },
              { id: 'Oilseeds', en: 'Oilseeds', icon: '🌻' },
              { id: 'Vegetables', en: 'Vegetables', icon: '🥔' },
              { id: 'Fruits', en: 'Fresh Fruits', icon: '🍎' },
              { id: 'Spices', en: 'Spices & Condiments', icon: '🫚' },
              { id: 'Fibres', en: 'Cotton & Fibres', icon: '🧵' },
              { id: 'Commercial', en: 'Commercial Crops', icon: '🎋' }
            ].map(cat => {
              const isSelected = selectedCategory === cat.id && !showOnlySaved
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setShowOnlySaved(false); }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.en}</span>
                </button>
              )
            })}
          </div>

          {/* Active Saved Filter Notice Banner */}
          {showOnlySaved && (
            <div className="mt-3 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold text-amber-900">
              <div className="flex items-center gap-2">
                <span>🔖</span>
                <span>Showing your Saved Watchlist ({displayedRates.length} crops bookmarked)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOnlySaved(false)}
                className="text-amber-800 underline hover:text-amber-950 font-black cursor-pointer"
              >
                Show All Crops
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-bold text-gray-600">Loading Live Mandi Benchmark Rates...</p>
          </div>
        ) : displayedRates.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-xs">
            <div className="text-4xl mb-2">{showOnlySaved ? '🔖' : '🔍'}</div>
            <h3 className="text-base font-bold text-gray-900">
              {showOnlySaved ? 'Your Saved List is empty' : `No crops found matching "${search}"`}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              {showOnlySaved 
                ? 'Tap the Bookmark / Save icon on any crop card to build your personalized daily watchlist.' 
                : 'Try adjusting your search query or pick a different crop category above.'}
            </p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory('All'); setShowOnlySaved(false); }} 
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold"
            >
              🌾 Browse All 120+ Crops
            </button>
          </div>
        ) : viewMode === 'kisan' ? (
          /* Simplified Modern Kisan Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedRates.map(item => {
              const cropId = item.symbol || item.crop
              const isSaved = savedCrops.includes(cropId)
              const cropInfo = getDualCropName(cropId, regLang)
              const isRateUp = item.change24h >= 0
              const isSpeakingThis = speakingCrop === item.symbol
              const unitEn = item.unit === 'litre' ? 'per Litre' : item.unit === 'kg' ? 'per kg' : 'per Quintal (100 kg)'

              return (
                <div
                  key={cropId}
                  className={`bg-white rounded-2xl p-4.5 flex flex-col justify-between border transition-all duration-200 hover:shadow-md ${
                    isSaved 
                      ? 'border-amber-300 shadow-amber-50/50' 
                      : isRateUp 
                        ? 'border-emerald-100/90 hover:border-emerald-300 shadow-xs' 
                        : 'border-rose-100/90 hover:border-rose-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Header: Crop Icon + Name + 24h Trend + Save/Bookmark button */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                          {cropInfo.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-gray-900 truncate leading-tight">
                            {cropInfo.en}
                          </h3>
                          {!isNone && cropInfo.reg && (
                            <p className="text-xs font-bold text-emerald-700 truncate mt-0.5">
                              {cropInfo.reg}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
                          isRateUp 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isRateUp ? `▲ +${item.change24h || 0}%` : `▼ ${item.change24h || 0}%`}
                        </span>

                        {/* Save / Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleSaveCrop(item, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition ${
                            isSaved 
                              ? 'bg-amber-100 text-amber-700 font-black' 
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700'
                          }`}
                          title={isSaved ? "Saved in your list" : "Save to your list"}
                        >
                          {isSaved ? '★' : '☆'}
                        </button>
                      </div>
                    </div>

                    {/* Price Details Box */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                          Benchmark Price:
                        </span>
                        {item.mspInr && (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                            MSP: ₹{item.mspInr}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-2xl font-black text-emerald-900 mt-1 tracking-tight">
                        ₹{(item.modalPrice || item.priceInr || 0).toLocaleString('en-US')}
                      </div>
                      <p className="text-[11px] font-bold text-emerald-700">
                        {unitEn}
                      </p>

                      {item.minPrice && item.maxPrice && (
                        <div className="text-[11px] font-bold text-gray-600 mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                          <span className="text-gray-400 font-semibold">Price Range:</span>
                          <span>
                            <strong className="text-emerald-700">₹{item.minPrice}</strong> - <strong className="text-rose-700">₹{item.maxPrice}</strong>
                          </span>
                        </div>
                      )}

                      {item.variety && (
                        <div className="text-[11px] font-bold text-gray-600 mt-1 flex items-center justify-between">
                          <span className="text-gray-400 font-semibold">Variety:</span>
                          <span className="text-gray-900 truncate max-w-[130px]">{item.variety}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Card Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => openCropGraphModal(item)}
                      className="col-span-1 py-2 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                      title="View Price Change Graph"
                    >
                      📈 Graph
                    </button>
                    <button
                      type="button"
                      onClick={() => openCropCalcModal(item)}
                      className="col-span-1 py-2 px-1 rounded-xl bg-gray-900 hover:bg-black text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                      title="Cash Payout Calculator"
                    >
                      🧮 Calc
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSpeakCropDual(item, e)}
                      className="col-span-1 py-2 px-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs transition flex items-center justify-center"
                      title="Listen Rate"
                    >
                      {isSpeakingThis ? '🔊' : '🔈'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openCropMoreModal(item)}
                      className="col-span-1 py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      title="Agronomy Tips, Do's & Don'ts, Quality Grading"
                    >
                      ℹ️ More
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-900 text-white font-bold">
                    <th className="px-4 py-3">Crop</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Live Benchmark Price</th>
                    <th className="px-4 py-3">Price Range</th>
                    <th className="px-4 py-3">24h Trend</th>
                    <th className="px-4 py-3 min-w-[130px]">7-Day Trend</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedRates.map((item, idx) => {
                    const cropId = item.symbol || item.crop
                    const isSaved = savedCrops.includes(cropId)
                    const cropInfo = getDualCropName(cropId, regLang)
                    const isRateUp = item.change24h >= 0
                    return (
                      <tr key={cropId || idx} className="hover:bg-emerald-50/30 transition">
                        <td className="px-4 py-3 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => toggleSaveCrop(item, e)}
                              className={`text-xs px-1.5 py-0.5 rounded ${isSaved ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              {isSaved ? '★' : '☆'}
                            </button>
                            <div>
                              <span>{cropInfo.icon} {cropInfo.en}</span>
                              {!isNone && cropInfo.reg && <span className="text-emerald-700 ml-1">({cropInfo.reg})</span>}
                              {item.variety && <div className="text-[10px] text-gray-400 font-normal">{item.variety}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-semibold">{item.category}</td>
                        <td className="px-4 py-3 font-black text-emerald-700 text-sm">
                          ₹{(item.modalPrice || item.priceInr || 0).toLocaleString('en-US')}
                          <span className="text-[10px] text-gray-400 font-normal ml-1">/ {item.unit || 'qtl'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-semibold">
                          {item.minPrice && item.maxPrice ? `₹${item.minPrice} - ₹${item.maxPrice}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-black">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${isRateUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isRateUp ? `▲ +${item.change24h || 0}%` : `▼ ${item.change24h || 0}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-28">
                            <MiniPriceSparkline crop={item} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openCropGraphModal(item)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold">
                              📈 Graph
                            </button>
                            <button onClick={() => openCropCalcModal(item)} className="px-2 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold">
                              🧮 Calc
                            </button>
                            <button onClick={() => openCropMoreModal(item)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold">
                              ℹ️ More
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interactive Comprehensive Modal (Rounded & Frosted) */}
        {selectedCrop && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-gray-100">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-xs shrink-0">
                    {getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-gray-900">
                        {getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).en}
                        {!isNone && getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).reg && (
                          <span className="text-emerald-700 ml-1.5 font-bold">/ {getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).reg}</span>
                        )}
                      </h2>
                      <button
                        type="button"
                        onClick={(e) => toggleSaveCrop(selectedCrop, e)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                          savedCrops.includes(selectedCrop.symbol || selectedCrop.crop)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {savedCrops.includes(selectedCrop.symbol || selectedCrop.crop) ? '★ Saved' : '☆ Save'}
                      </button>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      {selectedCrop.category} {selectedCrop.variety ? `• Variety: ${selectedCrop.variety}` : ''}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCrop(null)} 
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* 3 Tab Switchers */}
              <div className="flex bg-gray-100/80 p-1 rounded-xl mb-4 gap-1">
                <button
                  onClick={() => setModalTab('graph')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    modalTab === 'graph' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📈 Price Change Graph
                </button>
                <button
                  onClick={() => setModalTab('calc')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    modalTab === 'calc' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🧮 Cash Calculator
                </button>
                <button
                  onClick={() => setModalTab('more')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    modalTab === 'more' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ℹ️ Agronomy Guide
                </button>
              </div>

              {/* TAB 1: Price Change Graph */}
              {modalTab === 'graph' && (
                <div>
                  <FullPriceGraph crop={selectedCrop} timeframe={graphTimeframe} setTimeframe={setGraphTimeframe} />
                </div>
              )}

              {/* TAB 2: Cash Payout Calculator */}
              {modalTab === 'calc' && (
                <div>
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Benchmark Price:</span>
                      <div className="text-2xl font-black text-emerald-950 mt-0.5">
                        ₹{(selectedCrop.modalPrice || selectedCrop.priceInr || 0).toLocaleString('en-US')}
                      </div>
                      <p className="text-xs font-bold text-emerald-700">
                        per Quintal (100 kg) {selectedCrop.mspInr ? `• MSP: ₹${selectedCrop.mspInr}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleSpeakCropDual(selectedCrop)} className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs">
                      🔊 Listen Rate
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1">
                      🧮 Cash Payout Calculator
                    </h4>
                    <p className="text-xs font-semibold text-gray-500 mb-3">
                      Enter harvest quantity in Quintals (100 kg):
                    </p>

                    {/* Quick Step Buttons */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <button onClick={() => setCalcQty(prev => Math.max(1, prev - 10))} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">-10</button>
                      <button onClick={() => setCalcQty(prev => Math.max(1, prev - 5))} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">-5</button>
                      <button onClick={() => setCalcQty(prev => Math.max(1, prev - 1))} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">-1</button>
                      
                      <input 
                        type="number" 
                        min="1"
                        value={calcQty} 
                        onChange={e => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))} 
                        className="flex-1 min-w-[90px] text-center text-xl font-black py-1.5 px-2 bg-emerald-50/50 border-2 border-emerald-500 rounded-xl text-emerald-950 focus:outline-none"
                      />

                      <button onClick={() => setCalcQty(prev => prev + 1)} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">+1</button>
                      <button onClick={() => setCalcQty(prev => prev + 5)} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">+5</button>
                      <button onClick={() => setCalcQty(prev => prev + 10)} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">+10</button>
                      <button onClick={() => setCalcQty(prev => prev + 50)} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold">+50</button>
                    </div>

                    {/* Total Estimated Payout Card */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                          Total Value ({calcQty} Quintals):
                        </span>
                        <div className="text-2xl sm:text-3xl font-black mt-0.5">
                          ₹{Math.round((selectedCrop.modalPrice || selectedCrop.priceInr || 0) * calcQty).toLocaleString('en-US')}
                        </div>
                        {selectedCrop.mspInr && (
                          <p className="text-[11px] font-semibold text-emerald-100 mt-1">
                            Govt MSP Valuation: ₹{Math.round(selectedCrop.mspInr * calcQty).toLocaleString('en-US')}
                          </p>
                        )}
                      </div>
                      <button onClick={speakCalculatedTotalDual} className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-xl text-xs font-bold transition">
                        🔊 Listen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: More / Comprehensive Crop Knowledge */}
              {modalTab === 'more' && selectedAgronomy && (
                <div className="space-y-3.5">
                  
                  {/* Overview & Mandi Insights */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      📊 Mandi Market & Seasonal Dynamics
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                      {selectedAgronomy.priceTrendInsight}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-500">Peak Selling Window: </span>
                        <strong className="text-emerald-700 font-black">{selectedAgronomy.mandiSeason}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-500">Sale Moisture Target: </span>
                        <strong className="text-emerald-700 font-black">{selectedAgronomy.optimalMoistureForSale}</strong>
                      </div>
                    </div>
                  </div>

                  {/* High Yield & Quality Tips & Tricks */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      💡 Cultivation & High-Yield Tips & Tricks
                    </h4>
                    <div className="space-y-1.5">
                      {selectedAgronomy.tipsAndTricks.map((tip, idx) => (
                        <div key={idx} className="text-xs text-emerald-950 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-600 font-black">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Do's & Don'ts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mandi Do's */}
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5">
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                        ✅ Mandi Selling Do's
                      </h4>
                      <div className="space-y-1.5">
                        {selectedAgronomy.dos.map((d, i) => (
                          <div key={i} className="text-[11.5px] text-emerald-950 leading-relaxed">
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mandi Don'ts */}
                    <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3.5">
                      <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                        ❌ Mandi Selling Don'ts
                      </h4>
                      <div className="space-y-1.5">
                        {selectedAgronomy.donts.map((d, i) => (
                          <div key={i} className="text-[11.5px] text-rose-950 leading-relaxed">
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quality Grading Standards */}
                  {selectedAgronomy.gradingStandards && (
                    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5">
                      <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                        🏛️ APMC & Govt Quality Grading Standards
                      </h4>
                      <div className="space-y-1 text-xs">
                        {selectedAgronomy.gradingStandards.gradeA && (
                          <div className="text-purple-950">
                            <strong>Grade-A Premium:</strong> {selectedAgronomy.gradingStandards.gradeA}
                          </div>
                        )}
                        {selectedAgronomy.gradingStandards.gradeB && (
                          <div className="text-purple-950">
                            <strong>Grade-B Standard:</strong> {selectedAgronomy.gradingStandards.gradeB}
                          </div>
                        )}
                        {selectedAgronomy.gradingStandards.rejectionThreshold && (
                          <div className="text-rose-900 font-semibold mt-1">
                            <strong>Rejection / Penalty:</strong> {selectedAgronomy.gradingStandards.rejectionThreshold}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Listen Advisory Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const en = `Agronomy advisory for ${selectedCrop.crop || selectedCrop.symbol}. ${selectedAgronomy.priceTrendInsight}. Tip: ${selectedAgronomy.tipsAndTricks[0]}`
                        let reg = ''
                        if (regLang === 'te') reg = `పంట సలహాలు: ${selectedAgronomy.tipsAndTricks[0]}`
                        else if (regLang === 'hi') reg = `फसल सलाह: ${selectedAgronomy.tipsAndTricks[0]}`
                        else if (regLang === 'ta') reg = `பயிர் ஆலோசனை: ${selectedAgronomy.tipsAndTricks[0]}`
                        else if (regLang === 'kn') reg = `ಬೆಳೆ ಸಲಹೆ: ${selectedAgronomy.tipsAndTricks[0]}`
                        else if (regLang === 'mr') reg = `पीक सल्ला: ${selectedAgronomy.tipsAndTricks[0]}`
                        playDualVoice(en, isNone ? '' : reg, regLang)
                      }}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
                    >
                      🔊 Listen Crop Advisory
                    </button>
                  </div>

                </div>
              )}

              {/* Close Button Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCrop(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
