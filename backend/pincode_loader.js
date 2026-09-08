const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const CSV_URL = 'https://raw.githubusercontent.com/saravanakumargn/All-India-Pincode-Directory/refs/heads/master/all-india-pincode-html-csv.csv';
const DATA_DIR = path.join(__dirname, 'data');
const CSV_FILE = path.join(DATA_DIR, 'all-india-pincodes-raw.csv');
const JSON_FILE = path.join(DATA_DIR, 'all-india-pincodes.json');
const COORD_CACHE_FILE = path.join(DATA_DIR, 'pincode-coordinates-cache.json');

// Standardized list of all 28 Indian States and 8 Union Territories
const ALL_INDIAN_STATES = [
  'ANDAMAN & NICOBAR ISLANDS',
  'ANDHRA PRADESH',
  'ARUNACHAL PRADESH',
  'ASSAM',
  'BIHAR',
  'CHANDIGARH',
  'CHHATTISGARH',
  'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'DELHI',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JAMMU & KASHMIR',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'LADAKH',
  'LAKSHADWEEP',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUDUCHERRY',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL'
];

// Mapping helper to resolve anomalies in raw CSV statename column
const STATE_ALIAS_MAP = {
  'CHATTISGARH': 'CHHATTISGARH',
  'CHHATTISGARH': 'CHHATTISGARH',
  'PONDICHERRY': 'PUDUCHERRY',
  'PUDUCHERRY': 'PUDUCHERRY',
  'ORISSA': 'ODISHA',
  'ODISHA': 'ODISHA',
  'DAMAN & DIU': 'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'DADRA & NAGAR HAVELI': 'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'TAMILNADU': 'TAMIL NADU',
  'TAMIL NADU': 'TAMIL NADU',
  // Districts erroneously put into statename in the raw dataset
  'AIZAWL': 'MIZORAM',
  'AJMER': 'RAJASTHAN',
  'ALWAR': 'RAJASTHAN',
  'ALLAHABAD': 'UTTAR PRADESH',
  'ANGUL': 'ODISHA',
  'AURANGABAD': 'MAHARASHTRA',
  'AZAMGARH': 'UTTAR PRADESH',
  'BARAMULLA': 'JAMMU & KASHMIR',
  'CUDDALORE': 'TAMIL NADU',
  'CUTTACK': 'ODISHA',
  'EAST SINGHBHUM': 'JHARKHAND',
  'GULBARGA': 'KARNATAKA',
  'HISAR': 'HARYANA',
  'JAIPUR': 'RAJASTHAN',
  'JHAJJAR': 'HARYANA',
  'KORAPUT': 'ODISHA',
  'MADHEPURA': 'BIHAR',
  'MAU': 'UTTAR PRADESH',
  'MUZAFFARPUR': 'BIHAR',
  'NALGONDA': 'TELANGANA',
  'PRAKASAM': 'ANDHRA PRADESH',
  'PUDUKKOTTAI': 'TAMIL NADU',
  'RAIGARH(MH)': 'MAHARASHTRA',
  'RAYAGADA': 'ODISHA',
  'SAHARANPUR': 'UTTAR PRADESH',
  'SANGLI': 'MAHARASHTRA',
  'SERAIKELA-KHARSAWAN': 'JHARKHAND',
  'SONIPAT': 'HARYANA',
  'SOUTH DELHI': 'DELHI',
  'WEST DELHI': 'DELHI',
  'TIRUCHIRAPPALLI': 'TAMIL NADU',
  'VELLORE': 'TAMIL NADU',
  'YAVATMAL': 'MAHARASHTRA'
};

// Fallback inference by Indian Postal 2-digit Circle/Zone prefix
function inferStateFromPincode(pincode) {
  if (!pincode || pincode.length < 2) return null;
  const prefix2 = parseInt(pincode.slice(0, 2), 10);
  if (prefix2 === 11) return 'DELHI';
  if (prefix2 >= 12 && prefix2 <= 13) return 'HARYANA';
  if (prefix2 >= 14 && prefix2 <= 15) return 'PUNJAB';
  if (prefix2 === 16) return 'CHANDIGARH';
  if (prefix2 === 17) return 'HIMACHAL PRADESH';
  if (prefix2 >= 18 && prefix2 <= 19) return 'JAMMU & KASHMIR';
  if (prefix2 >= 20 && prefix2 <= 28) return 'UTTAR PRADESH';
  if (prefix2 === 24 || prefix2 === 26) return 'UTTARAKHAND';
  if (prefix2 >= 30 && prefix2 <= 34) return 'RAJASTHAN';
  if (prefix2 >= 36 && prefix2 <= 39) return 'GUJARAT';
  if (prefix2 >= 40 && prefix2 <= 44) return 'MAHARASHTRA';
  if (prefix2 === 40) return 'GOA';
  if (prefix2 >= 45 && prefix2 <= 48) return 'MADHYA PRADESH';
  if (prefix2 === 49) return 'CHHATTISGARH';
  if (prefix2 >= 50 && prefix2 <= 53) return 'ANDHRA PRADESH';
  if (prefix2 >= 50 && prefix2 <= 50) return 'TELANGANA';
  if (prefix2 >= 56 && prefix2 <= 59) return 'KARNATAKA';
  if (prefix2 >= 60 && prefix2 <= 64) return 'TAMIL NADU';
  if (prefix2 >= 67 && prefix2 <= 69) return 'KERALA';
  if (prefix2 >= 70 && prefix2 <= 74) return 'WEST BENGAL';
  if (prefix2 >= 75 && prefix2 <= 77) return 'ODISHA';
  if (prefix2 === 78) return 'ASSAM';
  if (prefix2 === 79) return 'ARUNACHAL PRADESH';
  if (prefix2 >= 80 && prefix2 <= 85) return 'BIHAR';
  if (prefix2 >= 81 && prefix2 <= 83) return 'JHARKHAND';
  return null;
}

function normalizeStateName(rawState, circleName, pincode) {
  if (!rawState || rawState.trim() === '' || rawState.toUpperCase() === 'NULL') {
    if (circleName && STATE_ALIAS_MAP[circleName.toUpperCase().trim()]) {
      return STATE_ALIAS_MAP[circleName.toUpperCase().trim()];
    }
    const inferred = inferStateFromPincode(pincode);
    if (inferred) return inferred;
    return 'UNKNOWN';
  }

  const clean = rawState.trim().toUpperCase();
  if (STATE_ALIAS_MAP[clean]) {
    return STATE_ALIAS_MAP[clean];
  }

  // Exact match against standard list
  const matched = ALL_INDIAN_STATES.find(s => s === clean);
  if (matched) return matched;

  // Partial or circle fallback
  if (circleName && STATE_ALIAS_MAP[circleName.toUpperCase().trim()]) {
    return STATE_ALIAS_MAP[circleName.toUpperCase().trim()];
  }

  return clean;
}

let pincodesInMemory = null;
let coordsCacheInMemory = null;

function loadCoordsCache() {
  if (coordsCacheInMemory) return coordsCacheInMemory;
  try {
    if (fs.existsSync(COORD_CACHE_FILE)) {
      coordsCacheInMemory = JSON.parse(fs.readFileSync(COORD_CACHE_FILE, 'utf8'));
      return coordsCacheInMemory;
    }
  } catch (e) {
    console.warn('Failed to read coordinates cache:', e.message);
  }
  coordsCacheInMemory = {};
  return coordsCacheInMemory;
}

function saveCoordsCache() {
  try {
    if (coordsCacheInMemory) {
      fs.writeFileSync(COORD_CACHE_FILE, JSON.stringify(coordsCacheInMemory, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('Failed to save coordinates cache:', e.message);
  }
}

async function downloadCsvIfNeeded() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(CSV_FILE) && fs.statSync(CSV_FILE).size > 1000000) {
    return CSV_FILE;
  }

  console.log('Downloading All-India Pincode Directory CSV from GitHub...');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(CSV_FILE);
    https.get(CSV_URL, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r2 => {
          r2.pipe(file);
          file.on('finish', () => { file.close(); resolve(CSV_FILE); });
        }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(CSV_FILE); });
      }
    }).on('error', err => {
      fs.unlink(CSV_FILE, () => {});
      reject(err);
    });
  });
}

async function parseAndBuildPincodeDatabase() {
  await downloadCsvIfNeeded();

  console.log('Parsing All-India Pincode Directory into indexed database...');
  const fileStream = fs.createReadStream(CSV_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const map = {};
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // Header

    // officename,pincode,officeType,Deliverystatus,divisionname,regionname,circlename,Taluk,Districtname,statename
    const parts = line.split(',');
    if (parts.length < 10) continue;

    const office = parts[0]?.trim();
    const pincode = parts[1]?.trim();
    if (!pincode || !/^\d{6}$/.test(pincode)) continue;

    const circle = parts[6]?.trim();
    const district = parts[8]?.trim() || '';
    const rawState = parts[9]?.trim() || '';

    const normalizedState = normalizeStateName(rawState, circle, pincode);

    if (!map[pincode]) {
      map[pincode] = {
        pincode,
        state: normalizedState,
        district: district === 'NULL' ? '' : district,
        offices: office && office !== 'NULL' ? [office] : []
      };
    } else {
      const entry = map[pincode];
      // If previous state was UNKNOWN and we now have a valid state, update it
      if (entry.state === 'UNKNOWN' && normalizedState !== 'UNKNOWN') {
        entry.state = normalizedState;
      }
      if (!entry.district && district && district !== 'NULL') {
        entry.district = district;
      }
      if (office && office !== 'NULL' && entry.offices.length < 8 && !entry.offices.includes(office)) {
        entry.offices.push(office);
      }
    }
  }

  console.log(`Indexed ${Object.keys(map).length} unique PIN codes across India.`);
  fs.writeFileSync(JSON_FILE, JSON.stringify(map), 'utf8');
  pincodesInMemory = map;
  return map;
}

function getPincodesDatabase() {
  if (pincodesInMemory) return pincodesInMemory;

  if (fs.existsSync(JSON_FILE)) {
    try {
      pincodesInMemory = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
      return pincodesInMemory;
    } catch (e) {
      console.error('Failed to parse pincodes JSON from disk, rebuilding...', e);
    }
  }

  return null;
}

/**
 * Lookup details for a 6-digit Indian Pincode
 */
function lookupPincode(pincode) {
  if (!pincode || typeof pincode !== 'string') return null;
  const cleanPin = pincode.trim();
  if (!/^\d{6}$/.test(cleanPin)) return null;

  const db = getPincodesDatabase();
  if (!db || !db[cleanPin]) {
    // Fallback: infer state from postal circle prefix if missing
    const inferred = inferStateFromPincode(cleanPin);
    if (inferred) {
      return {
        pincode: cleanPin,
        state: inferred,
        district: 'Regional Postal Zone',
        offices: ['Head Post Office'],
        inferred: true,
        valid: true
      };
    }
    return null;
  }

  return { ...db[cleanPin], valid: true };
}

/**
 * Validates whether the given State and Pincode match each other
 */
function validateStateAndPincode(selectedState, pincode) {
  if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
    return { valid: false, match: false, error: 'Please enter a valid 6-digit PIN code.' };
  }

  if (!selectedState || selectedState.trim() === '') {
    return { valid: false, match: false, error: 'Please select a state first.' };
  }

  const pinInfo = lookupPincode(pincode.trim());
  if (!pinInfo) {
    return { valid: false, match: false, error: `PIN code ${pincode} is not recognized in the Indian Postal Directory.` };
  }

  const sNorm = selectedState.trim().toUpperCase();
  const actualStateNorm = pinInfo.state.trim().toUpperCase();

  // Check direct or alias match
  const matches = (
    sNorm === actualStateNorm ||
    (STATE_ALIAS_MAP[sNorm] && STATE_ALIAS_MAP[sNorm] === actualStateNorm) ||
    (STATE_ALIAS_MAP[actualStateNorm] && STATE_ALIAS_MAP[actualStateNorm] === sNorm)
  );

  if (!matches) {
    return {
      valid: true,
      match: false,
      pincode: pinInfo.pincode,
      selectedState: selectedState,
      actualState: pinInfo.state,
      district: pinInfo.district,
      error: `State and Pincode are not matching. PIN code ${pincode} belongs to ${pinInfo.state}, not ${selectedState}.`
    };
  }

  return {
    valid: true,
    match: true,
    pincode: pinInfo.pincode,
    state: pinInfo.state,
    district: pinInfo.district,
    offices: pinInfo.offices
  };
}

function getAllStates() {
  return ALL_INDIAN_STATES;
}

/**
 * Resolve approximate Lat/Lon for an Indian Pincode or District/State
 */
async function getPincodeCoordinates(pincode) {
  const cleanPin = pincode ? pincode.toString().trim() : '';
  if (!/^\d{6}$/.test(cleanPin)) return null;

  const cache = loadCoordsCache();
  if (cache[cleanPin]) {
    return cache[cleanPin];
  }

  const pinInfo = lookupPincode(cleanPin);
  const district = pinInfo?.district || '';
  const state = pinInfo?.state || '';

  // 1. Try Open-Meteo Geocoding by PIN or District
  try {
    const query = `${cleanPin}, India`;
    const res = await fetchOpenMeteoGeocoding(cleanPin);
    if (res && res.lat && res.lon) {
      cache[cleanPin] = { lat: res.lat, lon: res.lon, name: res.name || district, state };
      saveCoordsCache();
      return cache[cleanPin];
    }
  } catch (e) {
    // fallback
  }

  // 2. Try by District + State
  if (district && district !== 'NULL') {
    try {
      const res = await fetchOpenMeteoGeocoding(district);
      if (res && res.lat && res.lon) {
        cache[cleanPin] = { lat: res.lat, lon: res.lon, name: district, state };
        saveCoordsCache();
        return cache[cleanPin];
      }
    } catch (e) {}
  }

  return null;
}

function fetchOpenMeteoGeocoding(term) {
  return new Promise((resolve, reject) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&country=IN&count=1`;
    https.get(url, { headers: { 'User-Agent': 'KrishiNet/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const r = json.results?.[0];
          if (r) {
            resolve({ lat: r.latitude, lon: r.longitude, name: r.name });
          } else {
            resolve(null);
          }
        } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = {
  parseAndBuildPincodeDatabase,
  getPincodesDatabase,
  lookupPincode,
  validateStateAndPincode,
  getAllStates,
  getPincodeCoordinates,
  ALL_INDIAN_STATES
};
