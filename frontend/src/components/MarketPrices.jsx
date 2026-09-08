import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { REGIONAL_LANGUAGES, DUAL_DICTIONARY, getDualCropName, UI_LANG_STRINGS, playDualVoice } from '../languageHelper'
import Navbar from './Navbar'

// Deterministic price history generation for every crop (7d, 15d, 30d)
export function getCropHistory(crop, timeframe = '7d') {
  const days = timeframe === '30d' ? 30 : timeframe === '15d' ? 15 : 7;
  const currentPrice = Number(crop.modalPrice || crop.priceInr || 2000);
  const change24h = Number(crop.change24h || 0);
  const totalChangePct = change24h !== 0 ? change24h * (days / 7) : 1.2;
  const baseDelta = (totalChangePct / 100) * currentPrice;
  const volatility = Math.max(currentPrice * 0.015, 12);

  let hash = 0;
  const key = String(crop.symbol || crop.crop || 'CROP');
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  const points = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (i === 0) {
      points.push({
        index: days - 1,
        dayLabel: 'Today',
        dateStr: dateLabel,
        price: currentPrice
      });
    } else {
      const progress = (days - 1 - i) / (days - 1);
      const wave = Math.sin(((hash % 100) + i * 23) * 0.1) * volatility;
      const sim = Math.round(currentPrice - (baseDelta * (1 - progress)) + wave);
      points.push({
        index: days - 1 - i,
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

// Mini Sparkline Graph for each card and table row
export function MiniPriceSparkline({ crop }) {
  const history = getCropHistory(crop, '7d');
  const { points, min, max, isUp, netChangePct } = history;
  const range = max - min || 1;

  const width = 200;
  const height = 44;
  const padX = 6;
  const padY = 6;

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
    <div style={{ marginTop: 8, padding: '6px 8px', background: '#f8faf8', border: '1px solid #e2ece0', borderRadius: '0px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          📈 7-Day Price Trend
        </span>
        <span style={{ fontSize: 10, fontWeight: 900, color: strokeColor }}>
          {isUp ? `+${netChangePct}%` : `${netChangePct}%`}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 34, display: 'block' }}>
        <path d={areaD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coords[0].x} cy={coords[0].y} r="2.5" fill={strokeColor} />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill={strokeColor} stroke="#ffffff" strokeWidth="1.5" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 1 }}>
        <span>₹{coords[0].price}</span>
        <span style={{ color: strokeColor, fontWeight: 800 }}>₹{coords[coords.length - 1].price}</span>
      </div>
    </div>
  );
}

// Full Interactive Price Chart with Timeframes & Tooltips
export function FullPriceGraph({ crop, timeframe = '7d', setTimeframe }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const history = getCropHistory(crop, timeframe);
  const { points, min, max, isUp, netChange, netChangePct, startPrice, endPrice } = history;
  const range = max - min || 1;

  const width = 480;
  const height = 180;
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
  const gradId = `full-grad-${crop.symbol}-${timeframe}`;

  const hoveredPoint = hoveredIndex !== null ? coords[hoveredIndex] : coords[coords.length - 1];

  return (
    <div>
      {/* Timeframe selector tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, border: '1px solid #cbd5e1' }}>
          {['7d', '15d', '30d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 900,
                border: 'none',
                background: timeframe === tf ? '#182c1d' : 'transparent',
                color: timeframe === tf ? '#ffffff' : '#334155',
                cursor: 'pointer'
              }}
            >
              {tf === '7d' ? '7 Days' : tf === '15d' ? '15 Days' : '30 Days'}
            </button>
          ))}
        </div>

        {/* Hovered or Current Price Point */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
            {hoveredPoint.dayLabel} Price:
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#065f46' }}>
            ₹{hoveredPoint.price.toLocaleString('en-US')}
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#ffffff', padding: '8px 10px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Current Price</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>₹{endPrice}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '8px 10px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Period High</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>₹{max}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '8px 10px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Period Low</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>₹{min}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '8px 10px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Net Change</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: isUp ? '#16a34a' : '#dc2626', marginTop: 2 }}>
            {isUp ? `+₹${netChange}` : `-₹${Math.abs(netChange)}`} ({isUp ? `+${netChangePct}%` : `${netChangePct}%`})
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div style={{ background: '#ffffff', border: '1.5px solid #d1d5db', padding: '14px 10px 8px', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 210, display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padTop + plotH * ratio;
            const priceVal = Math.round(max - ratio * range);
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="700">
                  ₹{priceVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${gradId})`} />

          {/* Line */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Data Points */}
          {coords.map((c, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="12"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 6 : (i === coords.length - 1 ? 4.5 : 3)}
                  fill={isHovered ? '#182c1d' : strokeColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none', transition: 'r 0.15s ease' }}
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {coords.filter((_, idx) => idx === 0 || idx === Math.floor(coords.length / 2) || idx === coords.length - 1).map((c, idx) => (
            <text
              key={idx}
              x={c.x}
              y={height - 6}
              textAnchor={idx === 0 ? 'start' : idx === 2 ? 'end' : 'middle'}
              fontSize="10"
              fill="#64748b"
              fontWeight="700"
            >
              {c.dateStr}
            </text>
          ))}
        </svg>
      </div>

      {/* Movement Insight */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: isUp ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isUp ? '#86efac' : '#fca5a5'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: isUp ? '#166534' : '#991b1b' }}>
          {isUp ? '📈 Price Momentum: Rising Trend' : '📉 Price Momentum: Softening Trend'}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
          Net {isUp ? '+' : ''}{netChangePct}% across {timeframe === '7d' ? '7 days' : timeframe === '15d' ? '15 days' : '30 days'}
        </div>
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
  const [modalTab, setModalTab] = useState('graph') // 'graph' | 'calc'
  const [graphTimeframe, setGraphTimeframe] = useState('7d') // '7d' | '15d' | '30d'
  const [calcQty, setCalcQty] = useState(10)
  const [speakingCrop, setSpeakingCrop] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
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

  const openCropGraphModal = (item) => {
    setSelectedCrop(item)
    setModalTab('graph')
    setCalcQty(10)
  }

  const openCropCalcModal = (item) => {
    setSelectedCrop(item)
    setModalTab('calc')
    setCalcQty(10)
  }

  // Voice Announcement (Speaks Regional First, English Second)
  const handleSpeakCropDual = (item, e) => {
    e && e.stopPropagation()
    const cropInfo = getDualCropName(item.symbol || item.crop, regLang)
    const priceNum = item.priceInr.toLocaleString('en-US')
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

  const openCropModal = (item) => {
    setSelectedCrop(item)
    setCalcQty(10)
    loadTrend(item)
  }

  const loadTrend = async (item) => {
    setTrendLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/commodities/trends`, {
        params: { symbol: item.symbol, crop: item.name }
      })
      if (res.data && res.data.points) {
        setTrendData(res.data)
      }
    } catch (e) {
      console.warn('Trend fetch error', e)
    } finally {
      setTrendLoading(false)
    }
  }

  const speakCalculatedTotalDual = () => {
    if (!selectedCrop) return
    const total = Math.round(selectedCrop.priceInr * calcQty).toLocaleString('en-US')
    const cropInfo = getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang)

    const enText = `For ${calcQty} quintals of ${cropInfo.en}, total amount you will receive is ₹${total}.`
    let regText = `${calcQty} quintal ${cropInfo.reg || cropInfo.en} = ₹${total}`
    if (regLang === 'te') regText = `${calcQty} క్వింటాళ్ల ${cropInfo.reg || cropInfo.en} అమ్మితే మీకు మొత్తం ${total} రూపాయలు వస్తాయి.`
    else if (regLang === 'kn') regText = `${calcQty} ಕ್ವಿಂಟಾಲ್ ${cropInfo.reg || cropInfo.en} ಮಾರಾಟಕ್ಕೆ ನಿಮಗೆ ಒಟ್ಟು ${total} ರೂಪಾಯಿ ಸಿಗುತ್ತದೆ.`
    else if (regLang === 'ta') regText = `${calcQty} குவிண்டால் ${cropInfo.reg || cropInfo.en} விற்றால் உங்களுக்கு மொத்தம் ${total} ரூபாய் கிடைக்கும்.`
    else if (regLang === 'ml') regText = `${calcQty} ക്വിന്റൽ ${cropInfo.reg || cropInfo.en} വിൽക്കുമ്പോൾ നിങ്ങൾക്ക് ആകെ ${total} രൂപ ലഭിക്കും.`
    else if (regLang === 'mr') regText = `${calcQty} क्विंटल ${cropInfo.reg || cropInfo.en} विकल्यावर तुम्हाला एकूण ${total} रुपये मिळतील.`
    else if (regLang === 'bn') regText = `${calcQty} কুইন্টাল ${cropInfo.reg || cropInfo.en} বিক্রিতে মোট ${total} টাকা পাবেন।`
    else if (regLang === 'pa') regText = `${calcQty} ਕੁਇੰਟਲ ${cropInfo.reg || cropInfo.en} ਵੇਚਣ ਤੇ ਕੁੱਲ ${total} ਰੁਪਏ ਮਿਲਣਗੇ।`
    else if (regLang === 'gu') regText = `${calcQty} ક્વિન્ટલ ${cropInfo.reg || cropInfo.en} વેચવા પર તમને કુલ ${total} રૂપિયા મળશે.`
    else if (regLang === 'or') regText = `${calcQty} କ୍ୱିଣ୍ଟାଲ ${cropInfo.reg || cropInfo.en} ବିକ୍ରିରେ ମୋଟ ${total} ଟଙ୍କା ମିଳିବ।`
    else if (regLang === 'as') regText = `${calcQty} কুইণ্টল ${cropInfo.reg || cropInfo.en} বিক্ৰীত মুঠ ${total} টকা লাভ কৰিব।`
    else if (regLang === 'ur') regText = `${calcQty} کوئنٹل ${cropInfo.reg || cropInfo.en} فروخت پر کل ${total} روپے ملیں گے۔`
    else if (regLang === 'hi') regText = `${calcQty} क्विंटल ${cropInfo.reg || cropInfo.en} बेचने पर आपको कुल ${total} रुपये मिलेंगे।`

    setSpeakingCrop('calc')
    playDualVoice(enText, isNone ? '' : regText, regLang, () => setSpeakingCrop(null))
  }

  // Filter rates by search and category (No locations)
  const displayedRates = rates.filter(r => {
    // 1. Search Query Match
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

    // 2. Category Match
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

  return (
    <div style={{ minHeight: '100vh', padding: '16px 12px 60px', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <div className="container">
        
        {/* Global Standard Navigation Bar */}
        <Navbar 
          title={`🌾 ${DUAL_DICTIONARY.mandiRatesTitle.en} ${isNone ? '' : `/ ${DUAL_DICTIONARY.mandiRatesTitle[regLang]}`}`}
          showBack={true}
          onBack={onBack}
        />

        {/* Hero Card with Live Market Rate Controls */}
        <div className="card" style={{ padding: '24px 22px', marginBottom: 24, borderRadius: '0px', border: '1px solid #e2ece0', background: '#ffffff' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(20px, 3.2vw, 26px)', fontWeight: 900, color: '#182c1d', display: 'flex', alignItems: 'center', gap: 10 }}>
                🌾 {DUAL_DICTIONARY.mandiRatesTitle.en} {isNone ? '' : `/ ${DUAL_DICTIONARY.mandiRatesTitle[regLang]}`}
              </h2>
              <p style={{ margin: '6px 0 0 0', color: '#496150', fontSize: 14, fontWeight: 600 }}>
                {DUAL_DICTIONARY.mandiRatesSubtitle.en} {isNone ? '' : `• ${DUAL_DICTIONARY.mandiRatesSubtitle[regLang]}`}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  const en = "Welcome to Krishi-Net live market price board. All benchmark commodity prices are updated with voice announcements."
                  const reg = currentStr.greeting || "తాజా మార్కెట్ ధరలు లోడ్ అయ్యాయి."
                  playDualVoice(en, isNone ? '' : reg, regLang)
                }}
                className="btn btn-dark"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, borderRadius: '0px' }}
              >
                🔊 Listen Prices
              </button>

              {/* View Mode Switcher */}
              <div style={{ display: 'flex', background: '#f0f7ee', padding: 3, border: '1.5px solid #5ca346' }}>
                <button
                  onClick={() => setViewMode('kisan')}
                  style={{
                    padding: '6px 14px',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 900,
                    background: viewMode === 'kisan' ? '#5ca346' : 'transparent',
                    color: viewMode === 'kisan' ? '#ffffff' : '#182c1d',
                    cursor: 'pointer'
                  }}
                >
                  🌾 Easy Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '6px 14px',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 900,
                    background: viewMode === 'table' ? '#5ca346' : 'transparent',
                    color: viewMode === 'table' ? '#ffffff' : '#182c1d',
                    cursor: 'pointer'
                  }}
                >
                  📊 Table View
                </button>
              </div>
            </div>
          </div>

          {/* Search & Voice Search Bar (No Locations) */}
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search by crop name or variety (e.g. Wheat, Basmati, Corn, Soybean, Chilli)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '12px 46px 12px 14px', background: '#ffffff', border: '1.5px solid #d1d5db', color: '#182c1d', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontWeight: 700, borderRadius: '0px' }}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, background: 'transparent', border: 'none', color: '#182c1d', fontSize: 16, cursor: 'pointer', fontWeight: 900 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Voice Search Button */}
            <button 
              type="button" 
              onClick={startVoiceSearch}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontSize: 14,
                borderRadius: '0px',
                background: '#5ca346',
                borderColor: '#5ca346'
              }}
            >
              {isListening ? '🎙️ Listening...' : '🎙️ Voice Search'}
            </button>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
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
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 900,
                    background: isSelected ? '#5ca346' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#182c1d',
                    border: isSelected ? '1.5px solid #5ca346' : '1px solid #d1d5db',
                    borderRadius: '0px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{cat.icon} {cat.en}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 16px auto', borderColor: '#00eb78', borderTopColor: 'transparent', borderWidth: 4 }}></div>
            <h3 style={{ color: '#ffffff', fontSize: 18, fontWeight: 800 }}>Loading Live Market Rates...</h3>
          </div>
        ) : displayedRates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p style={{ fontSize: 16, color: '#000000', fontWeight: 800 }}>No crops found matching "{search}"</p>
            <button onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="btn btn-dark" style={{ marginTop: 10, padding: '8px 20px' }}>
              🌾 Show All Crops
            </button>
          </div>
        ) : viewMode === 'kisan' ? (
          /* Kisan Cards Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {displayedRates.map(item => {
              const cropInfo = getDualCropName(item.symbol || item.crop, regLang)
              const isRateUp = item.change24h >= 0
              const isSpeakingThis = speakingCrop === item.symbol
              const unitEn = item.unit === 'litre' ? 'per Litre' : item.unit === 'kg' ? 'per kg' : 'per Quintal (100 kg)'

              return (
                <div
                  key={item.symbol}
                  onClick={() => openCropGraphModal(item)}
                  className="card"
                  style={{
                    margin: 0,
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isRateUp ? '2px solid #16a34a' : '2px solid #dc2626',
                    background: '#ffffff'
                  }}
                >
                  <div>
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, background: '#eaf7e6', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                          {cropInfo.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#000000', lineHeight: 1.2 }}>
                            {cropInfo.en}
                          </div>
                          {!isNone && cropInfo.reg && (
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                              {cropInfo.reg}
                            </div>
                          )}
                        </div>
                      </div>

                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        padding: '2px 8px',
                        background: isRateUp ? '#dcfce7' : '#fee2e2',
                        color: isRateUp ? '#15803d' : '#b91c1c',
                        border: `1px solid ${isRateUp ? '#86efac' : '#fca5a5'}`
                      }}>
                        {isRateUp ? `▲ +${item.change24h || 0}%` : `▼ ${item.change24h || 0}%`}
                      </span>
                    </div>

                    {/* Price Details Box */}
                    <div style={{ background: '#f9fcf8', padding: '12px 14px', border: '1px solid #e2ece0', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: 11, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Benchmark Price:</div>
                        {item.mspInr && (
                          <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '1px 5px', borderRadius: '0px' }}>
                            MSP: ₹{item.mspInr}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#065f46', marginTop: 2 }}>
                        ₹{(item.modalPrice || item.priceInr).toLocaleString('en-US')}
                      </div>
                      <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                        {unitEn}
                      </div>

                      {item.minPrice && item.maxPrice && (
                        <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, marginTop: 4, paddingTop: 4, borderTop: '1px dashed #e2e8f0' }}>
                          Price Range: <span style={{ color: '#047857' }}>₹{item.minPrice}</span> - <span style={{ color: '#b91c1c' }}>₹{item.maxPrice}</span>
                        </div>
                      )}

                      {item.variety && (
                        <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginTop: 4 }}>
                          Variety: <span style={{ color: '#0f172a' }}>{item.variety}</span>
                        </div>
                      )}

                      {/* Mini Price Sparkline Graph for Every Crop */}
                      <MiniPriceSparkline crop={item} />
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openCropGraphModal(item); }}
                      className="btn btn-primary"
                      style={{ flex: 1.2, padding: '8px 10px', fontSize: 12, borderRadius: '0px', background: '#5ca346', borderColor: '#5ca346', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      📈 Price Graph
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openCropCalcModal(item); }}
                      className="btn btn-dark"
                      style={{ flex: 1, padding: '8px 8px', fontSize: 12, borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      🧮 Calculator
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSpeakCropDual(item, e)}
                      style={{ padding: '8px 10px', fontSize: 13, borderRadius: '0px', background: '#ffffff', border: '1.5px solid #d1d5db', cursor: 'pointer' }}
                      title="Listen Rate"
                    >
                      {isSpeakingThis ? '🔊' : '🔈'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View with Mini Sparkline Graph */
          <div className="card" style={{ padding: 18, overflowX: 'auto', borderRadius: '0px', border: '1px solid #e2ece0', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#182c1d', color: '#ffffff' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 900 }}>Crop</th>
                  <th style={{ padding: '12px 14px', fontWeight: 900 }}>Category</th>
                  <th style={{ padding: '12px 14px', fontWeight: 900 }}>Live Benchmark Price</th>
                  <th style={{ padding: '12px 14px', fontWeight: 900 }}>Price Range</th>
                  <th style={{ padding: '12px 14px', fontWeight: 900 }}>24h Trend</th>
                  <th style={{ padding: '12px 14px', fontWeight: 900, minWidth: 160 }}>7-Day Price Graph</th>
                  <th style={{ padding: '12px 14px', fontWeight: 900, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRates.map((item, idx) => {
                  const cropInfo = getDualCropName(item.symbol || item.crop, regLang)
                  const isRateUp = item.change24h >= 0
                  return (
                    <tr key={item.symbol || idx} style={{ borderBottom: '1px solid #e2ece0', background: idx % 2 === 0 ? '#ffffff' : '#f9fcf8' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 900, color: '#182c1d' }}>
                        {cropInfo.icon} {cropInfo.en} {!isNone && cropInfo.reg ? `(${cropInfo.reg})` : ''}
                        {item.variety && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{item.variety}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 700 }}>{item.category}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 900, color: '#2e7d32', fontSize: 16 }}>
                        ₹{(item.modalPrice || item.priceInr || 0).toLocaleString('en-US')}
                        <div style={{ fontSize: 10, color: '#64748b' }}>per {item.unit === 'kg' ? 'kg' : item.unit === 'litre' ? 'litre' : 'quintal'}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 700, fontSize: 13 }}>
                        {item.minPrice && item.maxPrice ? `₹${item.minPrice} - ₹${item.maxPrice}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: isRateUp ? '#166534' : '#dc2626' }}>
                        {isRateUp ? `▲ +${item.change24h || 0}%` : `▼ ${item.change24h || 0}%`}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ width: 140 }}>
                          <MiniPriceSparkline crop={item} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => openCropGraphModal(item)} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12, borderRadius: '0px', background: '#5ca346', borderColor: '#5ca346' }}>
                            📈 Graph
                          </button>
                          <button onClick={() => openCropCalcModal(item)} className="btn btn-dark" style={{ padding: '6px 10px', fontSize: 12, borderRadius: '0px' }}>
                            🧮 Calc
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Interactive Modal: Price Change Graph & Cash Calculator */}
        {selectedCrop && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
            <div className="card" style={{ maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, margin: 0, background: '#ffffff', border: '2px solid #16a34a' }}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, background: '#bbf7d0', border: '1px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
                    {getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).icon}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#000000' }}>
                      {getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).en} {!isNone && getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).reg ? `/ ${getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).reg}` : ''}
                    </h2>
                    <div style={{ fontSize: 13, color: '#15803d', fontWeight: 800, marginTop: 2 }}>
                      {selectedCrop.category} {selectedCrop.variety ? `• Variety: ${selectedCrop.variety}` : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCrop(null)} className="btn btn-ghost" style={{ width: 34, height: 34, padding: 0, color: '#000', borderColor: '#000' }}>✕</button>
              </div>

              {/* Tab Switcher: [📈 Price Change Graph] | [🧮 Cash Calculator] */}
              <div style={{ display: 'flex', borderBottom: '2px solid #e2ece0', marginBottom: 16 }}>
                <button
                  onClick={() => setModalTab('graph')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 14,
                    fontWeight: 900,
                    border: 'none',
                    borderBottom: modalTab === 'graph' ? '3px solid #5ca346' : '3px solid transparent',
                    background: modalTab === 'graph' ? '#f0f7ee' : 'transparent',
                    color: modalTab === 'graph' ? '#182c1d' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  📈 Price Change Graph
                </button>
                <button
                  onClick={() => setModalTab('calc')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 14,
                    fontWeight: 900,
                    border: 'none',
                    borderBottom: modalTab === 'calc' ? '3px solid #5ca346' : '3px solid transparent',
                    background: modalTab === 'calc' ? '#f0f7ee' : 'transparent',
                    color: modalTab === 'calc' ? '#182c1d' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  🧮 Cash Payout Calculator
                </button>
              </div>

              {/* Price Banner */}
              <div style={{ background: '#f9fcf8', border: '1.5px solid #86efac', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Live Benchmark Price:</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#065f46' }}>
                    ₹{selectedCrop.priceInr.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803d', fontWeight: 800 }}>
                    per Quintal (100 kg) {selectedCrop.mspInr ? `• MSP: ₹${selectedCrop.mspInr}` : ''}
                  </div>
                </div>
                <button type="button" onClick={() => handleSpeakCropDual(selectedCrop)} className="btn btn-dark" style={{ padding: '8px 14px', fontSize: 13, borderRadius: '0px' }}>
                  🔊 Listen Rate
                </button>
              </div>

              {modalTab === 'graph' ? (
                /* Full Interactive Price Change Graph */
                <FullPriceGraph crop={selectedCrop} timeframe={graphTimeframe} setTimeframe={setGraphTimeframe} />
              ) : (
                /* Cash Payout Calculator */
                <div style={{ background: '#ffffff', border: '1.5px solid #000000', padding: 18, marginBottom: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', marginBottom: 6 }}>
                    🧮 Instant Cash Payout Calculator
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', fontWeight: 700, marginBottom: 10 }}>
                    Quantity in Quintals (100 kg):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => setCalcQty(prev => Math.max(1, prev - 5))} className="btn btn-ghost" style={{ padding: '8px 12px', color: '#000', borderColor: '#000' }}>-5</button>
                    <button onClick={() => setCalcQty(prev => Math.max(1, prev - 1))} className="btn btn-ghost" style={{ padding: '8px 12px', color: '#000', borderColor: '#000' }}>-1</button>
                    <input type="number" value={calcQty} onChange={e => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 900, padding: 8, border: '2px solid #000', color: '#000' }} />
                    <button onClick={() => setCalcQty(prev => prev + 1)} className="btn btn-ghost" style={{ padding: '8px 12px', color: '#000', borderColor: '#000' }}>+1</button>
                    <button onClick={() => setCalcQty(prev => prev + 5)} className="btn btn-ghost" style={{ padding: '8px 12px', color: '#000', borderColor: '#000' }}>+5</button>
                  </div>

                  <div style={{ background: '#e8f9ee', padding: '12px 14px', border: '2px solid #16a34a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#166534', fontWeight: 800 }}>Total Payout:</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#065f46', marginTop: 2 }}>
                        ₹{Math.round(selectedCrop.priceInr * calcQty).toLocaleString('en-US')}
                      </div>
                    </div>
                    <button onClick={speakCalculatedTotalDual} className="btn btn-dark" style={{ padding: '8px 12px', fontSize: 12 }}>
                      🔊 Listen Total
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => { setSelectedCrop(null); window.location.hash = '#/amazon-rates'; }} className="btn btn-primary btn-block" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 14 }}>
                🚜 Sell {getDualCropName(selectedCrop.symbol || selectedCrop.crop, regLang).en} →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
