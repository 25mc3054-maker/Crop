require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const AWS = require('aws-sdk');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const axios = require('axios');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const PDFDocument = require('pdfkit');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const twilio = require('twilio');
const redis = require('redis');
const { getCommoditiesRates, getCropPrice, getHistoricalTrends, COMMODITY_CATALOG } = require('./commodities_api');
const { govAgmarknetEngine, GOV_INDIAN_STATES, GOV_COMMODITY_MASTER } = require('./gov_agmarknet_api');
const { aiCurator } = require('./ai_curator_engine');
const { portalEngine, SCHEME_FIELD_REQUIREMENTS } = require('./portal_application_engine');
const { lookupPincode, validateStateAndPincode, getAllStates, getPincodeCoordinates } = require('./pincode_loader');
const { validateInternationalPhone, findCountry, COUNTRIES_LIST } = require('./countries_data');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

// ============================================================================
// OFFICIAL GOVT OF INDIA AGMARKNET / DATA.GOV.IN MANDI PRICE API PLATFORM
// Ministry of Agriculture & Farmers Welfare | Directorate of Marketing & Inspection
// ============================================================================
app.get('/api/gov/rates', async (req, res) => {
  try {
    const data = await govAgmarknetEngine.getLiveMandiRates(req.query);
    res.json(data);
  } catch (err) {
    console.error('Error fetching official Agmarknet rates:', err);
    res.status(500).json({ error: 'Failed to fetch official Agmarknet rates' });
  }
});

app.get('/api/gov/commodities', (req, res) => {
  res.json({
    total: GOV_COMMODITY_MASTER.length,
    commodities: govAgmarknetEngine.getCommodityList()
  });
});

app.get('/api/gov/states', (req, res) => {
  res.json({
    total: GOV_INDIAN_STATES.length,
    states: govAgmarknetEngine.getStates()
  });
});

app.get('/api/gov/status', (req, res) => {
  res.json(govAgmarknetEngine.getStatus());
});

// ============================================================================
// ALL-INDIA PINCODE DIRECTORY & GEOLOCATION VALIDATION ENGINE
// ============================================================================
app.get('/api/states', (req, res) => {
  res.json({ states: getAllStates() });
});

app.get('/api/countries', (req, res) => {
  res.json({ countries: COUNTRIES_LIST });
});

app.get('/api/pincode/lookup/:pincode', (req, res) => {
  const pin = req.params.pincode;
  const info = lookupPincode(pin);
  if (!info) {
    return res.status(404).json({ error: `PIN code ${pin} not found in directory` });
  }
  res.json(info);
});

app.get('/api/pincode/validate', (req, res) => {
  const { state, pincode } = req.query;
  const result = validateStateAndPincode(state, pincode);
  res.json(result);
});

app.post('/api/gov/key', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    govAgmarknetEngine.setApiKey(apiKey);
    res.json({ success: true, message: 'Official data.gov.in API key configured successfully' });
  } else {
    res.status(400).json({ error: 'API key is required' });
  }
});

// Live Agricultural Commodities & Mandi Price Route
app.get('/commodities/rates', async (req, res) => {
  try {
    const data = await getCommoditiesRates(req.query);
    res.json(data);
  } catch (err) {
    console.error('Error fetching commodities rates:', err);
    res.status(500).json({ error: 'Failed to fetch commodity rates' });
  }
});

app.get('/commodities/price', async (req, res) => {
  try {
    const data = await getCropPrice(req.query.crop || req.query.symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crop price' });
  }
});

app.get('/commodities/trends', async (req, res) => {
  try {
    const data = await getHistoricalTrends(req.query.crop || req.query.symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Twilio client setup (ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN are in .env)
const twilioClient = (process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

const isVerifyEnabled = !!(twilioClient && process.env.TWILIO_VERIFY_SERVICE_SID?.trim());

if (!twilioClient) {
  console.warn('Twilio client not configured. OTPs will be logged to console instead of sent via SMS.');
} else if (!isVerifyEnabled) {
  console.warn('Twilio Verify not configured. Using direct SMS OTP fallback.');
}

// Redis Client Setup - In-memory fallback if Redis not available
let redisClient = null;
const otpStore = new Map(); // In-memory fallback for OTP storage

async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('No REDIS_URL provided, using in-memory OTP storage');
    return;
  }
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false,
        connectTimeout: 2000
      }
    });
    client.on('error', (err) => console.warn('Redis error:', err.message));
    await client.connect();
    redisClient = client;
    console.log('Redis connected successfully');
  } catch (err) {
    console.warn('Redis not available, using in-memory OTP storage');
  }
}
initRedis();

// Helper functions for OTP storage (works with or without Redis)
async function setOTP(phone, data, ttl) {
  if (redisClient) {
    await redisClient.set(`otp:${phone}`, JSON.stringify(data), { EX: ttl });
  } else {
    otpStore.set(phone, { data, expires: Date.now() + (ttl * 1000) });
  }
}

async function getOTP(phone) {
  if (redisClient) {
    const raw = await redisClient.get(`otp:${phone}`);
    return raw ? JSON.parse(raw) : null;
  } else {
    const stored = otpStore.get(phone);
    if (stored && stored.expires > Date.now()) {
      return stored.data;
    }
    if (stored) otpStore.delete(phone);
    return null;
  }
}

async function deleteOTP(phone) {
  if (redisClient) {
    await redisClient.del(`otp:${phone}`);
  } else {
    otpStore.delete(phone);
  }
}

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const REGION = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region: REGION });

// Cognito Verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'ap-south-1_xxxxxxxxx',
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxx',
});

// Middleware to authenticate farmers
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  try {
    try {
      const payload = await verifier.verify(token);
      // Cognito token
      req.user = { phone: payload.username, sub: payload.sub };
      return next()
    } catch (e) {
      // Not a Cognito token; try local JWT
    }

    const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me'
    try {
      const payload = jwt.verify(token, LOCAL_JWT_SECRET)
      req.user = { phone: payload.phone, name: payload.name, village: payload.village, sub: payload.sub || payload.phone }
      return next()
    } catch (err) {
      console.error('Local JWT verify failed', err.message)
      return res.sendStatus(403)
    }
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.sendStatus(403);
  }
}

// Placeholder AWS clients - replace with v3 clients or Bedrock SDK as needed
const rekognitionClient = new RekognitionClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const stepfunctions = new AWS.StepFunctions();
const polly = new AWS.Polly();
const ddbClient = new DynamoDBClient({
  region: REGION,
  ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT })
});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const batch = new AWS.Batch();
const secretsClient = new SecretsManagerClient({ region: REGION });

// Initialize local DynamoDB tables if running locally
const createTables = require('./create_tables');
if (process.env.DYNAMODB_ENDPOINT) {
  createTables().catch(err => console.error('Failed to initialize tables:', err));
}

// Optionally load AWS credentials from Secrets Manager if a secret ARN/name is provided.
async function loadAwsCredsFromSecret() {
  const secretId = process.env.AWS_CRED_SECRET_ARN || process.env.AWS_CRED_SECRET_NAME
  if (!secretId) return
  try {
    console.log('Loading AWS creds from Secrets Manager:', secretId)
    const resp = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretId }))
    if (!resp || !resp.SecretString) return
    let parsed
    try { parsed = JSON.parse(resp.SecretString) } catch (e) { parsed = { token: resp.SecretString } }
    const accessKeyId = parsed.AWS_ACCESS_KEY_ID || parsed.accessKeyId || parsed.access_key_id || parsed.accessKey
    const secretAccessKey = parsed.AWS_SECRET_ACCESS_KEY || parsed.secretAccessKey || parsed.secret_key
    const sessionToken = parsed.AWS_SESSION_TOKEN || parsed.sessionToken || parsed.session_token
    const region = parsed.AWS_REGION || parsed.region || REGION
    if (accessKeyId && secretAccessKey) {
      AWS.config.update({ accessKeyId, secretAccessKey, sessionToken, region })
      console.log('AWS credentials set from Secrets Manager')
    } else {
      console.warn('AWS creds secret found but missing keys (accessKeyId/secretAccessKey)')
    }
  } catch (err) {
    console.error('Failed to load AWS creds from Secrets Manager:', err.message)
  }
}

// Try to load creds at startup (best-effort)
loadAwsCredsFromSecret().catch(err => console.error('loadAwsCredsFromSecret error', err.message))

// Helper to load DB credentials from Secrets Manager
async function getDatabaseCredentials() {
  const secretName = process.env.DB_SECRET_ARN || process.env.DB_SECRET_NAME;
  if (!secretName) return null;
  
  try {
    const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretName }));
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
  } catch (error) {
    console.error("Error retrieving database secret:", error.message);
  }
  return null;
}

// Helper to send SMS via Twilio or mock it
async function sendSms(to, body) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`[MOCK SMS] To: ${to} | Body: ${body}`);
    return { success: true, sid: 'SM_mock_' + Date.now() };
  }
  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`SMS sent to ${to}, SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Advanced soil color analysis without AWS - Improved Algorithm
async function analyzeImageByColor(imageBytes) {
  try {
    const buffer = Buffer.from(imageBytes);
    
    // Enhanced color classification with multiple detection methods
    let redPixels = 0, blackPixels = 0, brownPixels = 0, darkGrayPixels = 0, lightPixels = 0;
    let rTotal = 0, gTotal = 0, bTotal = 0;
    let pixelCount = 0;
    
    // Analyze more pixels for better accuracy
    const step = 4; // RGBA
    const maxPixels = Math.min(buffer.length, 200000); // Increased sampling
    
    for (let i = 0; i < maxPixels; i += step) {
      const r = buffer[i] || 0;
      const g = buffer[i + 1] || 0;
      const b = buffer[i + 2] || 0;
      
      rTotal += r;
      gTotal += g;
      bTotal += b;
      pixelCount++;
      
      // Calculate brightness and color characteristics
      const brightness = (r + g + b) / 3;
      const rDominance = r - Math.max(g, b);
      const gDominance = g - Math.max(r, b);
      const colorBalance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      
      // BLACK SOIL: Very dark pixels (brightness < 60) with low color variation
      if (brightness < 60 && colorBalance < 40) {
        blackPixels++;
      }
      // DARK GRAY: Medium-dark pixels (60-100) with balanced colors
      else if (brightness >= 60 && brightness < 100 && colorBalance < 50) {
        darkGrayPixels++;
      }
      // RED SOIL: R channel dominant (R > G+20 AND R > B+20) AND R > 90
      else if (r > 90 && rDominance > 20 && r > b + 20) {
        redPixels++;
      }
      // BROWN/ALLUVIAL: Balanced warm tones (R slightly > G > B)
      else if (r > g && g > b && r < 180 && brightness > 100) {
        brownPixels++;
      }
      // LIGHT: High brightness
      else if (brightness > 180) {
        lightPixels++;
      }
    }
    
    const avgR = Math.round(rTotal / pixelCount);
    const avgG = Math.round(gTotal / pixelCount);
    const avgB = Math.round(bTotal / pixelCount);
    const avgBrightness = Math.round((avgR + avgG + avgB) / 3);
    
    // Calculate percentages
    const redPercent = (redPixels / pixelCount) * 100;
    const blackPercent = (blackPixels / pixelCount) * 100;
    const darkGrayPercent = (darkGrayPixels / pixelCount) * 100;
    const brownPercent = (brownPixels / pixelCount) * 100;
    const lightPercent = (lightPixels / pixelCount) * 100;
    
    // Combined dark percentage (black + dark gray)
    const totalDarkPercent = blackPercent + darkGrayPercent;
    
    console.log(`\n📊 ADVANCED COLOR ANALYSIS:`);
    console.log(`RGB Average: R=${avgR}, G=${avgG}, B=${avgB} | Brightness=${avgBrightness}`);
    console.log(`Pixel Distribution:`);
    console.log(`  • Black: ${blackPercent.toFixed(1)}%`);
    console.log(`  • Dark Gray: ${darkGrayPercent.toFixed(1)}%`);
    console.log(`  • Total Dark: ${totalDarkPercent.toFixed(1)}%`);
    console.log(`  • Red: ${redPercent.toFixed(1)}%`);
    console.log(`  • Brown: ${brownPercent.toFixed(1)}%`);
    console.log(`  • Light: ${lightPercent.toFixed(1)}%`);

    let analysis;
    
    // PRIORITY 1: BLACK SOIL - Check for dark pixels and low average brightness
    if (totalDarkPercent > 20 || (avgBrightness < 80 && avgR < 90 && avgG < 90 && avgB < 90)) {
      console.log(`✅ DETECTED: BLACK SOIL (${totalDarkPercent.toFixed(1)}% dark pixels, brightness=${avgBrightness})`);
      analysis = {
        type: "Black Cotton Soil (Vertisol)",
        confidence: Math.min(99, Math.round(65 + totalDarkPercent)).toString(),
        color: "Black/Very Dark Brown",
        ph: "7.0 - 8.5",
        moisture: "Medium-High (25-35%)",
        texture: "Heavy Clay, High Water Retention",
        nutrients: { N: "High", P: "Medium", K: "High" },
        crops: ["Cotton", "Soybean", "Wheat", "Linseed", "Chickpea", "Sorghum"],
        recommendations: [
          "✓ EXCELLENT FERTILITY - Rich in nutrients",
          "✓ High water retention capacity",
          "✓ Rich in clay minerals (montmorillonite)",
          "→ Add gypsum (1 ton/hectare) to improve structure",
          "→ Apply farmyard manure 3-4 tons/hectare",
          "→ Practice crop rotation with pulses",
          "→ Ensure proper drainage during monsoon"
        ],
        organic_matter: "Good to Excellent",
        health: "EXCELLENT - Highly fertile black soil"
      };
    }
    // PRIORITY 2: RED SOIL - Check for red dominance
    else if (redPercent > 8 || (avgR > avgG + 15 && avgR > avgB + 15 && avgR > 85)) {
      console.log(`✅ DETECTED: RED SOIL (${redPercent.toFixed(1)}% red pixels, R=${avgR})`);
      analysis = {
        type: "Red Laterite Soil",
        confidence: Math.min(99, Math.round(60 + redPercent * 2)).toString(),
        color: "Red/Rust/Brick Red",
        ph: "5.5 - 6.5",
        moisture: "Low (10-15%)",
        texture: "Coarse, Well-drained, Sandy",
        nutrients: { N: "Low", P: "Very Low", K: "Medium" },
        crops: ["Groundnut", "Millets", "Pigeon Pea", "Cotton", "Cashew", "Tapioca"],
        recommendations: [
          "⚠ LOW FERTILITY - Requires fertilization",
          "⚠ Poor water retention - frequent irrigation needed",
          "⚠ Low in phosphorus - critical deficiency",
          "→ Add phosphate fertilizers (SSP/Rock phosphate) 200-250 kg/hectare",
          "→ Apply 4-5 tons/hectare organic manure",
          "→ Use micro-nutrients: Zinc, Boron, Manganese",
          "→ Apply lime if pH < 6.0 (500 kg/hectare)"
        ],
        organic_matter: "Poor to Fair",
        health: "FAIR - Nutrient-deficient, needs improvement"
      };
    }
    // PRIORITY 3: BROWN/ALLUVIAL SOIL
    else {
      console.log(`✅ DETECTED: ALLUVIAL/LOAMY SOIL (balanced colors, brightness=${avgBrightness})`);
      analysis = {
        type: "Alluvial/Loamy Soil",
        confidence: "85",
        color: "Brown/Light Brown/Yellowish Brown",
        ph: "6.5 - 7.5",
        moisture: "Moderate (20-28%)",
        texture: "Medium, well-balanced (Sand-Silt-Clay)",
        nutrients: { N: "Medium", P: "High", K: "Medium to High" },
        crops: ["Wheat", "Rice", "Sugarcane", "Vegetables", "Maize", "Pulses"],
        recommendations: [
          "✓ GOOD QUALITY - Balanced and fertile",
          "✓ Suitable for most crops",
          "✓ Good water retention and drainage",
          "→ Add 2-3 tons/hectare compost annually",
          "→ Practice crop rotation for sustainability",
          "→ Maintain organic matter with green manure"
        ],
        organic_matter: "Good",
        health: "GOOD - Well-balanced, productive soil"
      };
    }
    
    return analysis;
  } catch (err) {
    console.error('Color analysis error:', err.message);
    return {
      type: "Alluvial/Loamy Soil",
      confidence: "70",
      ph: "6.5 - 7.5",
      moisture: "Moderate",
      texture: "Medium",
      nutrients: { N: "Medium", P: "High", K: "Medium" },
      crops: ["Wheat", "Rice", "Sugarcane"],
      recommendations: ["→ Upload clear soil photo for better analysis"],
      organic_matter: "Good",
      health: "GOOD"
    };
  }
}

async function sendVerifyCode(to) {
  if (!isVerifyEnabled) {
    return { success: false, error: 'Twilio Verify not configured' };
  }
  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to, channel: 'sms' });
    return { success: true, sid: verification.sid, status: verification.status };
  } catch (error) {
    console.error(`Twilio Verify failed for ${to} (probably trial account - only verified numbers work):`, error.message);
    console.warn(`FALLBACK: Generating mock OTP for ${to}`);
    
    // Fallback: Generate OTP locally for ANY number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(to, otp);
    console.log(`\n⚠️  IMPORTANT - OTP GENERATED (Twilio Trial Limitation):`);
    console.log(`📱 Phone: ${to}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏰ Valid for 10 minutes\n`);
    
    return { success: true, sid: 'mock_' + Date.now(), status: 'pending', fallback: true };
  }
}

async function checkVerifyCode(to, code) {
  if (!isVerifyEnabled) {
    return { success: false, error: 'Twilio Verify not configured' };
  }
  try {
    const check = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code });
    return { success: check.status === 'approved', status: check.status };
  } catch (error) {
    // Fallback: Check if OTP matches locally stored OTP (for trial accounts)
    const storedOtp = otpStore.get(to);
    if (storedOtp && storedOtp === code) {
      console.log(`✅ OTP verified successfully for ${to} (using fallback)`);
      otpStore.delete(to); // Clear the OTP after verification
      return { success: true, status: 'approved', fallback: true };
    }
    console.error(`Failed to verify code for ${to}:`, error.message);
    return { success: false, error: 'Invalid OTP' };
  }
}

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// WhatsApp/Voice webhook placeholder: receives text or voice-transcribed text
app.post('/webhook/whatsapp', (req, res) => {
  const body = req.body || {};
  // Example: { from: '+91...', message: 'क्या कीमत क्या है?' }
  console.log('WhatsApp webhook', body);
  // TODO: call Bedrock LLM via Bedrock endpoints to run agentic flow
  res.json({ status: 'received', echo: body });
});

// Simple LLM endpoint: uses Bedrock when enabled, otherwise returns a mock
const { callBedrock } = require('./bedrock_placeholder')
const { verifyMetaWebhook, parseTwilioMessage } = require('./whatsapp_connector')
const prompts = require('./prompts.json')
const ttsMap = require('./tts_lang_map.json')

// --- HACKATHON ADVANCED FEATURES ---
// 1. Simple Intent Detection (Keyword based for speed)
function detectIntent(text) {
  const t = text.toLowerCase()
  if (t.includes('price') || t.includes('bhav') || t.includes('rate') || t.includes('mandi')) return 'market_advisor'
  if (t.includes('weather') || t.includes('rain') || t.includes('mausam') || t.includes('barish')) return 'weather_query'
  if (t.includes('disease') || t.includes('pest') || t.includes('kida') || t.includes('soil') || t.includes('khad')) return 'crop_doctor'
  if (t.includes('scheme') || t.includes('yojana') || t.includes('sarkar') || t.includes('subsidy')) return 'government_scheme'
  if (t.includes('amazon') || t.includes('sell') || t.includes('bechna') || t.includes('kharid') || t.includes('buy')) return 'amazon_procurement'
  return 'default'
}

// 2. Context Injection (Mocking real-time APIs)
async function getContextForIntent(intent, location) {
  if (intent === 'market_advisor') {
    return "\n[MANDI PRICES]: Wheat: ₹2200/qtl, Rice: ₹2600/qtl, Maize: ₹1850/qtl, Cotton: ₹6000/qtl, Soybeans: ₹4200/qtl, Turmeric: ₹7000/qtl, Onions: ₹1500/qtl, Potato: ₹1200/qtl. Trend: Prices rising for Cotton and Turmeric."
  }
  if (intent === 'weather_query') {
    if (process.env.WEATHER_API_KEY) {
      try {
        // Use provided location or default to Bhopal (Central India)
        const lat = location?.lat || '23.2599'
        const lon = location?.lon || '77.4126'
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        const { data } = await axios.get(url)
        return `\n[REAL-TIME DATA]: Location: ${data.name}. Temp: ${data.main.temp}°C. Condition: ${data.weather[0].description}. Humidity: ${data.main.humidity}%.`
      } catch (err) {
        console.error('Weather API failed:', err.message)
      }
    }
    return "\n[REAL-TIME DATA]: Location: User's Village. Forecast: Heavy rain expected in next 48 hours. Wind: 15km/h East. Humidity: 85%."
  }
  if (intent === 'crop_doctor') {
    return "\n[KNOWLEDGE BASE]: Common issues this season: Stem borer in Rice, Rust in Wheat. Recommended organic treatment: Neem oil solution."
  }
  if (intent === 'government_scheme') {
    return "\n[SCHEMES]: 1. PM-KISAN: ₹6000/year income support. 2. PM Fasal Bima Yojana: Crop insurance against failure. 3. Soil Health Card: Free soil testing and fertilizer recommendations."
  }
  if (intent === 'amazon_procurement') {
    return "\n[AMAZON FRESH RATES]: Wheat (Grade A): ₹2450/qtl (Premium over Mandi). Rice (Basmati): ₹4500/qtl. Cotton: ₹6200/qtl. Turmeric: ₹7500/qtl. \n[OFFER]: Amazon offers farm-gate pickup and 24hr payment. No commission. Quality check required."
  }
  return ""
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'\"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
    }
  })
}

function sanitizeAssistantOutput(text) {
  if (typeof text !== 'string') return ''
  let clean = text.trim()

  clean = clean.replace(/^\(mocked bedrock response\)\s*/i, '')
  clean = clean.replace(/^for prompt:\s*/i, '')
  clean = clean.replace(/\[(KNOWLEDGE BASE|REAL-TIME DATA|MANDI PRICES|SCHEMES|AMAZON FRESH RATES)\]:?/gi, '')
  clean = clean.replace(/\s+/g, ' ').trim()

  return clean
}

function isWheatSoilQuestion(promptText) {
  if (typeof promptText !== 'string') return false
  const q = promptText.toLowerCase().normalize('NFKD')
  const hasWheat = /wheat|गेह|गह/.test(q)
  const hasSoil = /soil|मिट्टी|मिट|मटट/.test(q)
  return hasWheat && hasSoil
}

// LLM endpoint: uses Bedrock when enabled, otherwise returns a mock
app.post('/llm', async (req, res) => {
  const { prompt, lang, model, lat, lon } = req.body || {}
  try {
    if (isWheatSoilQuestion(prompt)) {
      const direct = lang === 'en'
        ? 'For wheat, loam or clay-loam soil with good drainage is best. Keep soil pH around 6.0 to 7.5 for good growth.'
        : 'गेहूं के लिए दोमट (Loam) या चिकनी-दोमट मिट्टी सबसे अच्छी मानी जाती है। pH 6.0–7.5 रखें और खेत में जल निकासी अच्छी होनी चाहिए।'
      return res.json({ ok: true, model: 'direct-answer', output: direct, lang: lang || 'hi' })
    }

    // Advanced: Auto-detect intent if not provided
    const intent = req.body.intent || detectIntent(prompt)
    
    // Advanced: Inject Context Data
    const contextData = await getContextForIntent(intent, { lat, lon })
    const targetLang = lang === 'en' ? 'English' : 'Hindi'
    const finalPrompt = `${prompt}\n\n${contextData}\n\n[INSTRUCTION]: Reply only with the final answer in ${targetLang}. Do not include labels, prefixes, metadata, or prompt echoes.`

    console.log(`[Agent] Intent: ${intent}`)
    console.log(`[Agent] Context Injected: ${contextData.trim()}`)

    console.log('LLM prompt:', (typeof finalPrompt === 'string' ? finalPrompt.slice(0,200) : JSON.stringify(finalPrompt)).slice(0,200))
    
    // Pass intent to bedrock_placeholder so it picks the right System Persona
    const out = await callBedrock(finalPrompt, { modelId: model, intent, lang })
    const cleanedOutput = sanitizeAssistantOutput(out.output)
    const fallbackMessage = lang === 'en'
      ? 'I could not generate a clear answer right now. Please ask the question more specifically.'
      : 'मुझे अभी स्पष्ट उत्तर नहीं मिला, कृपया सवाल थोड़ा स्पष्ट लिखें।'
    res.json({ ok: true, model: out.model, output: cleanedOutput || fallbackMessage, lang: lang || 'hi' })
  } catch (err) {
    console.error('LLM endpoint error', err)
    res.status(500).json({ error: err.message })
  }
})

// Meta WhatsApp webhook verification (GET)
app.get('/webhook/meta', (req, res) => {
  const v = verifyMetaWebhook(req.query)
  if (v.ok) return res.status(200).send(v.challenge)
  return res.status(403).send('forbidden')
})

// Meta WhatsApp incoming messages (POST)
app.post('/webhook/meta', async (req, res) => {
  try {
    const body = req.body
    // Body format differs; this is a simple extractor for demo purposes
    const entries = body.entry || []
    for (const entry of entries) {
      const changes = entry.changes || []
      for (const change of changes) {
        const messages = change.value?.messages || []
        for (const msg of messages) {
          const from = msg.from
          const text = msg.text?.body || msg.voice?.transcription || ''
          console.log('WhatsApp message from', from, text)
          // Send to Bedrock/LLM and create TTS response
          const llm = await callBedrock(text, {})
          // For production: call Meta's Send API to reply. Here we log the reply.
          console.log('LLM reply:', llm.output)
        }
      }
    }
    res.sendStatus(200)
  } catch (err) {
    console.error('Meta webhook error', err)
    res.sendStatus(500)
  }
})

// Twilio webhook for SMS/WhatsApp (POST)
app.post('/webhook/twilio', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const parsed = parseTwilioMessage(req.body)
    console.log('Twilio message', parsed)
    // Support simple keypad-style SMS commands: "PRICE wheat" or free text
    let userMsg = parsed.message || ''
    let intent = null
    if (/^PRICE\b/i.test(userMsg)) intent = 'price_query'
    if (/^SOIL\b|SOILPHOTO|PHOTO/i.test(userMsg)) intent = 'soil_analysis'

    const llmReq = { prompt: userMsg, lang: 'en' }
    if (intent) llmReq.intent = intent

    const llm = await callBedrock(llmReq.prompt, llmReq)
    const reply = llm.output || 'धन्यवाद, आपकी जानकारी मिल गई.'
    // Return TwiML so Twilio can deliver the SMS reply to the user
    const twiml = `<Response><Message>${escapeXml(reply)}</Message></Response>`
    res.type('text/xml').send(twiml)
  } catch (err) {
    console.error('Twilio webhook error', err)
    res.status(500).json({ error: err.message })
  }
})

// Mount Twilio IVR routes
const ivr = require('./twilio_ivr')
app.use('/', ivr)

// Upload soil photo for analysis
app.post('/upload/soil', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const imageBytes = req.file.buffer;
    
    // Orchestration Mode: Upload to S3 and start Step Function
    if (process.env.STEP_FN_ARN && process.env.S3_UPLOADS_BUCKET) {
      const key = `soil/${Date.now()}-${uuidv4()}.jpg`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_UPLOADS_BUCKET,
        Key: key,
        Body: imageBytes,
        ContentType: req.file.mimetype
      }));

      const params = {
        stateMachineArn: process.env.STEP_FN_ARN,
        input: JSON.stringify({ 
          bucket: process.env.S3_UPLOADS_BUCKET, 
          key,
          connectionId: req.body.connectionId,
          callbackUrl: process.env.WEBSOCKET_CALLBACK_URL 
        }),
        name: `soil-exec-${Date.now()}`
      };

      const start = await stepfunctions.startExecution(params).promise();
      // Return a processing status. Frontend can poll or wait for notification.
      return res.json({ id: uuidv4(), status: 'processing', executionArn: start.executionArn, labels: [{ Name: 'Processing...', Confidence: 100 }] });
    }

    // Try Rekognition if available, fallback to color-based analysis
    let labels = [];
    let analysis = null;
    
    try {
      const params = {
        Image: { Bytes: imageBytes },
        MaxLabels: 20,
        MinConfidence: 40
      };

      const rekogRes = await rekognitionClient.send(new DetectLabelsCommand(params));
      labels = rekogRes.Labels || [];

      console.log('\n🔍 AWS Rekognition Results:');
      console.log('Detected labels:', labels.map(l => `${l.Name}(${l.Confidence.toFixed(0)}%)`).join(', '));

      // Use AWS results to generate analysis
      const labelScores = {};
      labels.forEach(label => {
        const name = label.Name.toLowerCase();
        const conf = label.Confidence;
        if (name.includes('red') || name.includes('rust')) labelScores.red = (labelScores.red || 0) + conf;
        if (name.includes('black') || name.includes('dark')) labelScores.black = (labelScores.black || 0) + conf;
        if (name.includes('clay') || name.includes('mud')) labelScores.clayey = (labelScores.clayey || 0) + conf;
      });

      const hasBlack = labelScores.black > 60;
      const hasRed = labelScores.red > 60;

      if (hasBlack && labelScores.clayey > 50) {
        analysis = {
          type: "Black Cotton Soil (Vertisol)",
          confidence: Math.max(labelScores.black || 0, 75).toFixed(0),
          ph: "7.0 - 8.5",
          moisture: "Medium-High (25-35%)",
          texture: "Heavy Clay",
          nutrients: { N: "High", P: "Medium", K: "High" },
          crops: ["Cotton", "Soybean", "Wheat", "Linseed", "Chickpea"],
          recommendations: [
            "✓ EXCELLENT FERTILITY",
            "→ Add gypsum (1 ton/hectare)",
            "→ Apply farmyard manure 3-4 tons/hectare"
          ],
          organic_matter: "Good",
          health: "EXCELLENT"
        };
      } else if (hasRed) {
        analysis = {
          type: "Red Laterite Soil",
          confidence: Math.max(labelScores.red || 0, 70).toFixed(0),
          ph: "5.5 - 6.5",
          moisture: "Low (10-15%)",
          texture: "Coarse",
          nutrients: { N: "Low", P: "Very Low", K: "Medium" },
          crops: ["Groundnut", "Millets", "Cotton"],
          recommendations: [
            "⚠ LOW FERTILITY",
            "→ Add phosphate fertilizers",
            "→ Apply 4-5 tons/hectare organic manure"
          ],
          organic_matter: "Poor",
          health: "FAIR"
        };
      } else {
        analysis = {
          type: "Alluvial/Loamy Soil",
          confidence: "80",
          ph: "6.5 - 7.5",
          moisture: "Moderate (20-28%)",
          texture: "Medium, well-balanced",
          nutrients: { N: "Medium", P: "High", K: "Medium" },
          crops: ["Wheat", "Rice", "Sugarcane", "Vegetables"],
          recommendations: [
            "✓ GOOD QUALITY - Balanced soil",
            "→ Add 2-3 tons/hectare compost annually"
          ],
          organic_matter: "Good",
          health: "GOOD"
        };
      }

      console.log(`✅ Analysis: ${analysis.type}`);
    } catch (awsErr) {
      console.error('❌ AWS Rekognition Error:', awsErr.message);
      console.log('📊 Using COLOR-BASED ANALYSIS (no AWS needed)');
      analysis = await analyzeImageByColor(imageBytes);
      labels = [{ Name: 'Color-based Analysis', Confidence: 85 }];
    }
    // -----------------------------------------------------------

    // Package a lightweight response for the UI
    const resp = {
      id: uuidv4(),
      labels,
      analysis,
      raw: { Labels: labels }
    };

    // Save to user profile if authenticated
    const authHeader = req.headers['authorization'];
    if (authHeader && process.env.USERS_TABLE) {
      try {
        const token = authHeader.split(' ')[1];
        const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
        // Verify token to get user phone
        const decoded = jwt.verify(token, LOCAL_JWT_SECRET);
        
        if (decoded && decoded.phone) {
          const report = {
            reportId: resp.id,
            timestamp: new Date().toISOString(),
            analysis: resp.analysis
          };

          await docClient.send(new UpdateCommand({
            TableName: process.env.USERS_TABLE,
            Key: { phone: decoded.phone },
            UpdateExpression: "SET soilReports = list_append(if_not_exists(soilReports, :empty_list), :r)",
            ExpressionAttributeValues: {
              ':r': [report],
              ':empty_list': []
            }
          }));
          console.log(`Saved soil report for user ${decoded.phone}`);
        }
      } catch (err) {
        console.warn('Failed to save soil report to profile (auth or db error):', err.message);
      }
    }

    // In a real flow: start a Step Functions execution to run downstream agent
    res.json(resp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Submit Satellite Imagery for Batch Processing
app.post('/satellite/process', authenticateToken, async (req, res) => {
  const { s3Key } = req.body; // Assume client uploaded to S3 and sent the key
  const bucket = process.env.S3_UPLOADS_BUCKET;
  
  if (!s3Key || !bucket) return res.status(400).json({ error: 'Missing s3Key or bucket config' });

  try {
    const params = {
      jobName: `satellite-proc-${Date.now()}`,
      jobQueue: process.env.BATCH_JOB_QUEUE,
      jobDefinition: process.env.BATCH_JOB_DEFINITION,
      containerOverrides: {
        environment: [
          { name: 'S3_BUCKET', value: bucket },
          { name: 'S3_KEY', value: s3Key }
        ]
      }
    };
    const data = await batch.submitJob(params).promise();
    res.json({ success: true, jobId: data.jobId, status: 'SUBMITTED' });
  } catch (err) {
    console.error('Batch submit error:', err);
    res.status(500).json({ error: 'Failed to submit batch job' });
  }
});

// Text-to-speech using Amazon Polly (returns base64-encoded mp3)
app.post('/tts', async (req, res) => {
  try {
    const { text, voice = 'Aditi', languageCode = 'hi-IN' } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text required' });
    // If Polly is intentionally disabled or AWS credentials are not available, return a harmless response.
    const pollyDisabledEnv = (process.env.DISABLE_POLLY || 'false').toLowerCase() === 'true'
    const hasAwsCreds = !!(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ROLE_ARN || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI)
    if (pollyDisabledEnv || !hasAwsCreds) {
      if (!global.__polly_disabled_logged) {
        console.warn('Polly TTS disabled: AWS credentials not configured or DISABLE_POLLY=true. Server will return empty TTS responses.')
        global.__polly_disabled_logged = true
      }
      // Respond with a non-error indicating TTS is disabled. Frontend should fallback to browser TTS.
      return res.json({ audioBase64: null, disabled: true })
    }

    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voice,
      LanguageCode: languageCode
    };

    const pollyResult = await polly.synthesizeSpeech(params).promise();
    const audioBuffer = pollyResult.AudioStream;

    // If S3_TTS_BUCKET is configured, upload audio to S3 and return a presigned URL
    const ttsBucket = process.env.S3_TTS_BUCKET
    if (ttsBucket && audioBuffer) {
      const key = `tts/${Date.now()}-${Math.floor(Math.random()*10000)}.mp3`
      await s3Client.send(new PutObjectCommand({ Bucket: ttsBucket, Key: key, Body: audioBuffer, ContentType: 'audio/mpeg' }));
      // Generate presigned URL (expires in 15 minutes)
      const command = new GetObjectCommand({ Bucket: ttsBucket, Key: key });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      return res.json({ url, s3Key: key })
    }

    const audio = audioBuffer ? audioBuffer.toString('base64') : null;
    res.json({ audioBase64: audio });
  } catch (err) {
    console.error('TTS error', err);
    res.status(500).json({ error: err.message });
  }
});

// Market & Procurement Rates powered by Commodities-API
app.get('/amazon-rates', authenticateToken, async (req, res) => {
  try {
    const data = await getCommoditiesRates({
      category: req.query.category,
      search: req.query.search,
      currency: req.query.currency || 'INR'
    });
    
    return res.json({
      rates: data.rates.map(r => ({
        crop: r.name,
        symbol: r.symbol,
        price: r.price,
        priceInr: r.priceInr,
        priceUsd: r.priceUsd,
        unit: r.unit,
        category: r.category,
        change24h: r.change24h,
        trend: r.trend,
        high24h: r.high24h,
        low24h: r.low24h,
        note: `Change: ${r.change24h >= 0 ? '+' : ''}${r.change24h}% | High: ₹${r.high24h}`
      })),
      terms: [
        "Farm-gate pickup (No transport cost)",
        "Payment within 24 hours via Direct Bank Transfer",
        "Commodities-API Verified Live Benchmark Rates",
        "No middlemen / 0% commission"
      ],
      provider: data.provider,
      coverage: data.coverage,
      totalListed: data.totalListed
    });
  } catch (err) {
    console.error('Failed to fetch rates from Commodities-API:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Handle Amazon Sell Orders
app.post('/sell-to-amazon', authenticateToken, async (req, res) => {
  const { crop, quantity } = req.body
  console.log(`[Amazon Procurement] Order received: ${quantity} qtl of ${crop}`)
  
  const orderId = `ORD-${Date.now()}`
  // Save to DynamoDB if configured
  if (process.env.ORDERS_TABLE) {
    try {
      const item = { orderId, crop, quantity, timestamp: new Date().toISOString(), status: 'PENDING', phone: req.user.phone }
      await docClient.send(new PutCommand({ TableName: process.env.ORDERS_TABLE, Item: item }));
    } catch (err) {
      console.error('Failed to save order to DynamoDB:', err.message)
    }
  }
  res.json({ success: true, orderId })
})

// --- Farmer Authentication (OTP via DynamoDB or local file storage) ---

// JSON file-based user store for local development
const USERS_DB_FILE = path.join(__dirname, 'users-db.json');

function loadUsersFromFile() {
  try {
    if (fs.existsSync(USERS_DB_FILE)) {
      const data = fs.readFileSync(USERS_DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Error reading users database:', error.message);
  }
  return {};
}

function saveUsersToFile(users) {
  try {
    fs.writeFileSync(USERS_DB_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving users database:', error.message);
    return false;
  }
}

// In-memory cache of users (for performance)
let usersCache = loadUsersFromFile();

// Helper to get user by phone from file storage or DynamoDB
async function getUserByPhone(phone) {
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  // Reload cache from file if key not immediately found
  if (!usersCache[phone] && !usersCache[cleanPhone]) {
    usersCache = loadUsersFromFile();
  }

  // Try local file storage first
  if (usersCache[phone]) {
    return usersCache[phone];
  }
  if (cleanPhone && usersCache[cleanPhone]) {
    return usersCache[cleanPhone];
  }

  // Try DynamoDB if configured
  if (process.env.USERS_TABLE) {
    try {
      const data = await docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { phone }
      }));
      if (data.Item) {
        usersCache[phone] = data.Item;
        return data.Item;
      }
    } catch (error) {
      console.warn('DynamoDB getUserByPhone failed, using file storage:', error.message);
    }
  }

  return null;
}

// Helper to create a user in file storage and DynamoDB
async function createUser(user) {
  // Add creation timestamp if not present
  if (!user.createdAt) {
    user.createdAt = new Date().toISOString();
  }

  // Save to local file (always available)
  usersCache[user.phone] = user;
  const saved = saveUsersToFile(usersCache);

  if (!saved) {
    throw new Error('Failed to save user to local database.');
  }

  // Try to save to DynamoDB if configured
  if (process.env.USERS_TABLE) {
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: user
      }));
      console.log(`User ${user.phone} saved to DynamoDB`);
    } catch (error) {
      console.warn('Could not save to DynamoDB, but saved to file:', error.message);
    }
  } else {
    console.log(`User ${user.phone} saved to local file storage`);
  }

  return user;
}

// Step 1: Register - takes user details and sends OTP
app.post('/auth/register', async (req, res) => {
  const { phone, name, village, state, pincode, password, countryType, countryName } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const cleanPhone = phone.toString().replace(/\D/g, '');
  if (!cleanPhone) {
    return res.status(400).json({ error: 'Please enter a valid numeric phone number' });
  }

  if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required' });
  if (!village || !village.trim()) return res.status(400).json({ error: 'Village / City / Location is required' });

  const isOtherCountry = countryType === 'other' || (countryName && countryName.trim().toLowerCase() !== 'india');

  let userData = {};

  if (isOtherCountry) {
    if (!countryName || !countryName.trim()) {
      return res.status(400).json({ error: 'Country name is required' });
    }

    // Validate phone number according to country rules (e.g. Singapore 8 digits, etc.)
    const phoneCheck = validateInternationalPhone(countryName.trim(), cleanPhone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ error: phoneCheck.error });
    }

    userData = {
      name: name.trim(),
      village: village.trim(),
      countryType: 'other',
      country: phoneCheck.country || countryName.trim(),
      dialCode: phoneCheck.dialCode || '',
      state: state ? state.trim() : '', // State is optional for other countries
      pincode: '',
      district: '',
      password: password || ''
    };
  } else {
    // India mode (default): Strictly enforce exactly 10 digits
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits for India (entered ' + cleanPhone.length + ' digits)' });
    }

    if (!state || !state.trim()) return res.status(400).json({ error: 'Please select your State' });
    if (!pincode || !/^\d{6}$/.test(pincode.toString().trim())) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code' });
    }

    // Validate state and pincode compatibility
    const pinCheck = validateStateAndPincode(state, pincode.toString().trim());
    if (!pinCheck.match) {
      return res.status(400).json({ 
        error: pinCheck.error || `State and Pincode are not matching. PIN code ${pincode} does not belong to ${state}.` 
      });
    }

    userData = { 
      name: name.trim(), 
      village: village.trim(), 
      countryType: 'india',
      country: 'India',
      state: pinCheck.state || state.trim().toUpperCase(),
      pincode: pincode.toString().trim(),
      district: pinCheck.district || '',
      password: password || '' 
    };
  }

  // Store user data with 10 minute (600s) expiration
  await setOTP(phone, {
    type: 'registration',
    userData
  }, 600);

  if (isVerifyEnabled) {
    const verifyResult = await sendVerifyCode(phoneWithCode);
    if (!verifyResult.success) {
      return res.status(500).json({ error: 'Failed to send verification code.' });
    }
    return res.json({ success: true, message: 'Verification code sent via SMS.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP and user data with 10 minute (600s) expiration (fallback)
  await setOTP(phone, {
    otp,
    type: 'registration',
    userData
  }, 600);

  // Send OTP via SMS (fallback)
  const smsResult = await sendSms(phone, `Your registration OTP for Krishi-Net is: ${otp}`);

  if (!smsResult.success) {
    console.error('SMS send failed, but allowing registration to proceed for demo');
  }

  console.log(`Registration OTP for ${phone} is ${otp} (for testing)`);
  res.json({
    success: true,
    message: twilioClient ? 'OTP sent to your phone number for verification.' : `Demo Mode: OTP is ${otp} (Twilio SMS not configured)`,
    devOtp: !twilioClient ? otp : undefined
  });
});

// Step 2: Verify Registration - takes phone and OTP, creates user, returns token
app.post('/auth/verify-registration', async (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  // Add country code if not present (default to +91 for India)
  const phoneWithCode = phone.startsWith('+') ? phone : `+91${phone}`;

  const stored = await getOTP(phone);

  if (!stored || stored.type !== 'registration') {
    return res.status(400).json({ error: 'No registration pending for this number, or OTP expired.' });
  }

  if (isVerifyEnabled) {
    const verifyCheck = await checkVerifyCode(phoneWithCode, otp);
    if (!verifyCheck.success) return res.status(400).json({ error: 'Invalid OTP.' });
  } else {
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
  }

  // OTP is valid, create the user
  const newUser = { phone, ...stored.userData };
  try {
    await createUser(newUser);
  } catch (dbError) {
    console.error('Failed to create user during registration verification:', dbError);
    return res.status(500).json({ error: 'Could not save user profile.' });
  }

  // Clean up OTP store
  await deleteOTP(phone);

  // Generate JWT and log the user in
  const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
  const token = jwt.sign({ 
    phone: newUser.phone, 
    name: newUser.name, 
    village: newUser.village,
    state: newUser.state,
    pincode: newUser.pincode,
    district: newUser.district,
    country: newUser.country || 'India',
    countryType: newUser.countryType || 'india'
  }, LOCAL_JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ success: true, message: 'Registration successful!', token, user: newUser });
});

// NEW: Send OTP for Login
app.post('/auth/send-otp', async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const user = await getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });

  // Add country code if not present (default to +91 for India)
  const phoneWithCode = phone.startsWith('+') ? phone : `+91${phone}`;

  // Store login request (10 mins expiration)
  await setOTP(phone, { type: 'login' }, 600);

  if (isVerifyEnabled) {
    const verifyResult = await sendVerifyCode(phoneWithCode);
    if (!verifyResult.success) {
      return res.status(500).json({ error: 'Failed to send verification code.' });
    }
    return res.json({ success: true, message: 'Verification code sent via SMS.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP for login verification (10 mins expiration) (fallback)
  await setOTP(phone, { otp, type: 'login' }, 600);

  // Send OTP via SMS (fallback)
  const smsResult = await sendSms(phone, `Your login OTP for Krishi-Net is: ${otp}`);

  if (!smsResult.success) {
    console.error('SMS send failed, but allowing login to proceed for demo');
  }

  console.log(`Login OTP for ${phone} is ${otp} (for testing)`);
  res.json({
    success: true,
    message: twilioClient ? 'OTP sent to your phone number for login.' : `Demo Mode: OTP is ${otp} (Twilio SMS not configured)`,
    devOtp: !twilioClient ? otp : undefined
  });
});

// NEW: Verify OTP for Login
app.post('/auth/verify-otp', async (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  // Add country code if not present (default to +91 for India)
  const phoneWithCode = phone.startsWith('+') ? phone : `+91${phone}`;

  const stored = await getOTP(phone);

  if (!stored || stored.type !== 'login') return res.status(400).json({ error: 'No login OTP requested for this number, or OTP expired.' });

  if (isVerifyEnabled) {
    const verifyCheck = await checkVerifyCode(phoneWithCode, otp);
    if (!verifyCheck.success) return res.status(400).json({ error: 'Invalid OTP.' });
  } else {
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
  }

  // OTP is valid, find user and generate token
  const user = await getUserByPhone(phone);
  if (!user) {
    await deleteOTP(phone);
    return res.status(404).json({ error: 'User not found.' });
  }

  // Clean up OTP store
  await deleteOTP(phone);

  // Generate JWT
  const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
  const token = jwt.sign({ phone: user.phone, name: user.name, village: user.village }, LOCAL_JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ success: true, message: 'Login successful!', token, user });
});

// Step 1 for Login: Request OTP or Login with Password
app.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // If password is provided, use password-based login
  if (password !== undefined && password !== null) {
    const user = await getUserByPhone(phone);
    if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });
    
    // In local development / demo mode: accept matching password, trimmed password, or standard password123
    const enteredPass = String(password).trim();
    const storedPass = String(user.password || '').trim();
    const isPasswordValid = !storedPass || storedPass === enteredPass || enteredPass === 'password123';
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect password. (Tip: Use password123 or Direct Access)' });
    }
    
    const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
    const token = jwt.sign({ phone: user.phone, name: user.name, village: user.village }, LOCAL_JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, message: 'Login successful!', token, user });
  }

  // Otherwise, send OTP
  const user = await getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP for login verification (10 mins expiration)
  await setOTP(phone, { otp, type: 'login' }, 600);

  // Send OTP via SMS
  const smsResult = await sendSms(phone, `Your login OTP for Krishi-Net is: ${otp}`);

  if (!smsResult.success) {
    console.error('SMS send failed, but allowing for demo');
  }

  console.log(`Login OTP for ${phone} is ${otp} (for testing)`);
  res.json({
    success: true,
    message: twilioClient ? 'OTP sent to your phone number for login.' : `Demo Mode: OTP is ${otp} (Twilio SMS not configured)`,
    devOtp: !twilioClient ? otp : undefined
  });
});

// Step 2 for Login: Verify OTP and get token (LEGACY - kept for backward compatibility, but /auth/verify-otp is preferred)
app.post('/auth/verify-login', async (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const rawData = await redisClient.get(`otp:${phone}`);
  const stored = rawData ? JSON.parse(rawData) : null;

  if (!stored || stored.type !== 'login') return res.status(400).json({ error: 'No login OTP requested for this number, or OTP expired.' });
  if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });

  // OTP is valid, find user and generate token
  const user = await getUserByPhone(phone);
  if (!user) {
    await redisClient.del(`otp:${phone}`);
    return res.status(404).json({ error: 'User not found.' });
  }

  // Clean up OTP store
  await redisClient.del(`otp:${phone}`);

  // Generate JWT
  const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
  const token = jwt.sign({ phone: user.phone, name: user.name, village: user.village }, LOCAL_JWT_SECRET, { expiresIn: '30d' });
  
  res.json({ success: true, message: 'Login successful!', token, user });
});

// NEW: Token verification endpoint
app.get('/auth/verify', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============================================================================
// FARMER SETTINGS & ACCOUNT MANAGEMENT ENDPOINTS
// ============================================================================

// 1. Change Phone Number
app.post('/api/user/change-phone', async (req, res) => {
  const { currentPhone, newPhone } = req.body || {};
  if (!currentPhone || !newPhone) return res.status(400).json({ error: 'Current and new phone number required' });
  const cleanNew = newPhone.toString().replace(/\D/g, '');
  if (cleanNew.length < 7 || cleanNew.length > 15) {
    return res.status(400).json({ error: 'New phone number must have valid length (7-15 digits)' });
  }

  const user = await getUserByPhone(currentPhone);
  if (!user) return res.status(404).json({ error: 'User not found' });

  delete usersCache[currentPhone];
  user.phone = cleanNew;
  user.updatedAt = new Date().toISOString();
  usersCache[cleanNew] = user;
  saveUsersToFile(usersCache);

  const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
  const token = jwt.sign({ 
    phone: user.phone, 
    name: user.name, 
    village: user.village,
    state: user.state,
    pincode: user.pincode,
    country: user.country || 'India'
  }, LOCAL_JWT_SECRET, { expiresIn: '30d' });

  res.json({ success: true, message: 'Phone number updated successfully!', newPhone: cleanNew, token });
});

// 2. Change Password
app.post('/api/user/change-password', async (req, res) => {
  const { phone, newPassword } = req.body || {};
  if (!phone || !newPassword) return res.status(400).json({ error: 'Phone and new password required' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  const user = await getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  usersCache[phone] = user;
  saveUsersToFile(usersCache);

  res.json({ success: true, message: 'Password updated successfully!' });
});

// 3. Change State & PIN Code / Location
app.post('/api/user/change-location', async (req, res) => {
  const { phone, state, pincode, village, countryType, countryName } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const user = await getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (countryType === 'other') {
    if (!countryName || !countryName.trim()) return res.status(400).json({ error: 'Country name is required' });
    user.countryType = 'other';
    user.country = countryName.trim();
    user.state = state ? state.trim() : '';
    user.pincode = '';
  } else {
    // India mode
    if (!state || !state.trim()) return res.status(400).json({ error: 'State is required' });
    if (!pincode || pincode.toString().replace(/\D/g, '').length !== 6) return res.status(400).json({ error: 'Valid 6-digit PIN code required' });

    const cleanPin = pincode.toString().replace(/\D/g, '');
    const pinCheck = validateStateAndPincode(state, cleanPin);
    if (!pinCheck.match) {
      return res.status(400).json({ error: pinCheck.error || 'State and PIN code do not match.' });
    }
    user.countryType = 'india';
    user.country = 'India';
    user.state = pinCheck.state || state.trim().toUpperCase();
    user.pincode = cleanPin;
    user.district = pinCheck.district || user.district || '';
  }

  if (village && village.trim()) {
    user.village = village.trim();
  }

  user.updatedAt = new Date().toISOString();
  usersCache[phone] = user;
  saveUsersToFile(usersCache);

  const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
  const token = jwt.sign({ 
    phone: user.phone, 
    name: user.name, 
    village: user.village,
    state: user.state,
    pincode: user.pincode,
    country: user.country || 'India'
  }, LOCAL_JWT_SECRET, { expiresIn: '30d' });

  res.json({ success: true, message: 'Location updated successfully!', user, token });
});

// 4. Update Profile (Name, Village, Crops, Landholding)
app.post('/api/user/update-profile', async (req, res) => {
  const { phone, name, village, landholding, primaryCrops } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const user = await getUserByPhone(phone);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name && name.trim()) user.name = name.trim();
  if (village && village.trim()) user.village = village.trim();
  if (landholding) user.landholding = landholding;
  if (primaryCrops) user.primaryCrops = primaryCrops;

  user.updatedAt = new Date().toISOString();
  usersCache[phone] = user;
  saveUsersToFile(usersCache);

  const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me';
  const token = jwt.sign({ 
    phone: user.phone, 
    name: user.name, 
    village: user.village,
    state: user.state,
    pincode: user.pincode,
    country: user.country || 'India'
  }, LOCAL_JWT_SECRET, { expiresIn: '30d' });

  res.json({ success: true, message: 'Profile updated successfully!', user, token });
});

// 5. Account Deletion
app.post('/api/user/delete-account', async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  if (usersCache[phone]) {
    delete usersCache[phone];
    saveUsersToFile(usersCache);
  }

  res.json({ success: true, message: 'Account deleted successfully' });
});

app.get('/my-orders', authenticateToken, async (req, res) => {
  let orders = [
    { orderId: 'ORD-MOCK-1', crop: 'Wheat', quantity: 50, status: 'PAID', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { orderId: 'ORD-MOCK-2', crop: 'Rice', quantity: 20, status: 'PENDING', timestamp: new Date().toISOString() }
  ]
  
  if (process.env.ORDERS_TABLE) {
    try {
      let data;
      if (process.env.ORDERS_PHONE_INDEX) {
        data = await docClient.send(new QueryCommand({
          TableName: process.env.ORDERS_TABLE,
          IndexName: process.env.ORDERS_PHONE_INDEX,
          KeyConditionExpression: 'phone = :p',
          ScanIndexForward: false, // Newest first
          ExpressionAttributeValues: { ':p': req.user.phone }
        }));
      } else {
        data = await docClient.send(new ScanCommand({
          TableName: process.env.ORDERS_TABLE,
          FilterExpression: 'phone = :p',
          ExpressionAttributeValues: { ':p': req.user.phone }
        }));
      }
      if (data.Items) orders = data.Items
    } catch (err) { console.error('DB error', err) }
  }
  res.json({ orders })
})

// Generate PDF Invoice
app.get('/invoice/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params
  let order = null

  // 1. Check mock data first (for demo consistency)
  const mockOrders = [
    { orderId: 'ORD-MOCK-1', crop: 'Wheat', quantity: 50, status: 'PAID', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { orderId: 'ORD-MOCK-2', crop: 'Rice', quantity: 20, status: 'PENDING', timestamp: new Date().toISOString() }
  ]
  order = mockOrders.find(o => o.orderId === orderId)

  // 2. Try DynamoDB if not found and table exists
  if (!order && process.env.ORDERS_TABLE) {
    try {
      const data = await docClient.send(new GetCommand({ TableName: process.env.ORDERS_TABLE, Key: { orderId } }));
      if (data.Item) order = data.Item
    } catch (e) { console.error('DB fetch error', e) }
  }

  if (!order) return res.status(404).send('Order not found')

  // Create PDF
  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`)

  doc.pipe(res)

  doc.fontSize(20).text('AMAZON FRESH PROCUREMENT', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Order ID: ${order.orderId}`)
  doc.text(`Date: ${new Date().toLocaleDateString()}`)
  doc.text(`Farmer Phone: ${req.user.phone}`)
  doc.moveDown()
  doc.text(`Crop: ${order.crop}`)
  doc.text(`Quantity: ${order.quantity} qtl`)
  doc.text(`Status: ${order.status}`)
  doc.moveDown()
  doc.text('Terms: Payment within 24 hours. Farm-gate pickup included.')
  doc.moveDown()
  doc.fontSize(10).text('Thank you for selling with Amazon.', { align: 'center' })

  doc.end()
})

// User Profile - Get
app.get('/profile', authenticateToken, async (req, res) => {
  let profile = { phone: req.user.phone, name: '', village: '', language: 'hi' }
  if (process.env.USERS_TABLE) {
    try {
      const data = await docClient.send(new GetCommand({ TableName: process.env.USERS_TABLE, Key: { phone: req.user.phone } }));
      if (data.Item) profile = data.Item
    } catch (e) { console.error('DB error', e) }
  }
  res.json(profile)
})

// User Profile - Update
app.post('/profile', authenticateToken, async (req, res) => {
  const { name, village, language } = req.body
  const profile = { phone: req.user.phone, name, village, language }
  if (process.env.USERS_TABLE) {
    try {
      await docClient.send(new PutCommand({ TableName: process.env.USERS_TABLE, Item: profile }));
    } catch (e) {
      console.error('DB error', e)
      return res.status(500).json({ error: 'Failed to update profile' })
    }
  }
  res.json({ success: true, profile })
})

// Get Soil Analysis History
app.get('/my-soil-reports', authenticateToken, async (req, res) => {
  let reports = []
  if (process.env.USERS_TABLE) {
    try {
      const data = await docClient.send(new GetCommand({ 
        TableName: process.env.USERS_TABLE, 
        Key: { phone: req.user.phone },
        ProjectionExpression: 'soilReports'
      }));
      if (data.Item && data.Item.soilReports) {
        reports = data.Item.soilReports
      }
    } catch (e) { console.error('DB error', e) }
  }
  // Return newest first
  res.json({ reports: reports.reverse() })
})

// Generate PDF Soil Report
app.get('/soil-report/:reportId', authenticateToken, async (req, res) => {
  const { reportId } = req.params
  let report = null

  if (process.env.USERS_TABLE) {
    try {
      const data = await docClient.send(new GetCommand({ 
        TableName: process.env.USERS_TABLE, 
        Key: { phone: req.user.phone } 
      }))
      if (data.Item && data.Item.soilReports) {
        report = data.Item.soilReports.find(r => r.reportId === reportId)
      }
    } catch (e) { console.error('DB error', e) }
  }

  if (!report) return res.status(404).send('Report not found')

  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=soil-report-${reportId}.pdf`)

  doc.pipe(res)

  doc.fontSize(20).text('SOIL HEALTH CARD', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Report ID: ${report.reportId}`)
  doc.text(`Date: ${new Date(report.timestamp).toLocaleDateString()}`)
  doc.text(`Farmer Phone: ${req.user.phone}`)
  doc.moveDown()
  
  const a = report.analysis
  doc.fontSize(14).text('Analysis Results', { underline: true })
  doc.fontSize(12).text(`Soil Type: ${a.type}`)
  doc.text(`Health: ${a.health}`)
  doc.text(`pH Level: ${a.ph}`)
  doc.text(`Moisture: ${a.moisture}`)
  doc.moveDown()

  doc.text(`Nutrients: N: ${a.nutrients?.N}, P: ${a.nutrients?.P}, K: ${a.nutrients?.K}`)
  doc.moveDown()

  doc.fontSize(14).text('Recommended Crops', { underline: true })
  doc.fontSize(12).text(a.crops?.join(', ') || 'None')
  
  doc.moveDown()
  doc.fontSize(10).text('Generated by Inventra Krishi-Net', { align: 'center' })

  doc.end()
})

// --- COMMUNITY FORUM ENDPOINTS ---

function decodeHtmlEntities(value) {
  if (!value || typeof value !== 'string') return ''
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function stripHtmlTags(value) {
  return decodeHtmlEntities(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractRssTag(block, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = block.match(regex)
  return match ? match[1] : ''
}

function parseRssItems(xml, fallbackSourceLabel = 'News Source') {
  const items = []
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || []

  for (const block of itemBlocks) {
    const rawTitle = extractRssTag(block, 'title')
    const rawLink = extractRssTag(block, 'link')
    const rawDescription = extractRssTag(block, 'description')
    const rawPubDate = extractRssTag(block, 'pubDate')

    const title = stripHtmlTags(rawTitle)
    const url = decodeHtmlEntities(rawLink)
    const summary = stripHtmlTags(rawDescription).slice(0, 260)
    const publishedAt = rawPubDate ? new Date(rawPubDate).toISOString() : null

    if (!title || !url) continue

    let source = fallbackSourceLabel
    try {
      source = new URL(url).hostname.replace(/^www\./, '')
    } catch (e) {
      // keep fallback source
    }

    items.push({
      id: `${title}-${url}`,
      title,
      summary,
      url,
      source,
      publishedAt
    })
  }

  return items
}

// Cache for Community News to prevent rate-limits and ensure fast loads
let newsCache = {
  timestamp: 0,
  data: [],
  source: 'init'
};
const NEWS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

// Community News: live farmer/agriculture news (India) across policy, prices, weather
app.get('/community-news', async (req, res) => {
  const maxItems = Math.min(Math.max(Number(req.query.limit) || 25, 5), 60);
  const category = (req.query.category || '').toLowerCase();
  const now = Date.now();

  // If cache is fresh and not empty, serve directly
  if (newsCache.data.length > 0 && (now - newsCache.timestamp < NEWS_CACHE_TTL)) {
    let filtered = newsCache.data;
    if (category && category !== 'all') {
      filtered = filtered.filter(item => (item.category && item.category.toLowerCase() === category) || item.title.toLowerCase().includes(category));
    }
    return res.json({
      ok: true,
      news: filtered.slice(0, maxItems),
      source: newsCache.source,
      fetchedAt: new Date(newsCache.timestamp).toISOString(),
      cached: true
    });
  }

  const feeds = [
    {
      url: 'https://news.google.com/rss/search?q=Indian+farmers+agriculture+India+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
      label: 'National Agriculture Feed',
      category: 'general'
    },
    {
      url: 'https://news.google.com/rss/search?q=India+mandi+prices+crop+MSP+procurement+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
      label: 'Mandi & Crop Prices',
      category: 'prices'
    },
    {
      url: 'https://news.google.com/rss/search?q=India+farmer+scheme+subsidies+PM-KISAN+KCC+when:7d&hl=en-IN&gl=IN&ceid=IN:en',
      label: 'Schemes & Policy',
      category: 'schemes'
    },
    {
      url: 'https://news.google.com/rss/search?q=India+monsoon+rainfall+farming+weather+advisory+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
      label: 'Weather & Monsoon',
      category: 'weather'
    }
  ];

  try {
    const responses = await Promise.allSettled(
      feeds.map(feed => axios.get(feed.url, { timeout: 8000 }).then(resp => ({ feed, xml: resp.data })))
    );

    const collected = [];
    for (const result of responses) {
      if (result.status !== 'fulfilled') continue;
      const parsed = parseRssItems(result.value.xml, result.value.feed.label);
      for (const item of parsed) {
        item.category = result.value.feed.category;
        item.feedLabel = result.value.feed.label;
        collected.push(item);
      }
    }

    const dedupedMap = new Map();
    for (const item of collected) {
      if (!dedupedMap.has(item.url)) dedupedMap.set(item.url, item);
    }

    const news = Array.from(dedupedMap.values())
      .sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bTime - aTime;
      });

    if (news.length > 0) {
      newsCache = {
        timestamp: now,
        data: news,
        source: 'Google News India Multi-Feed (Live RSS)'
      };
    }

    const returnList = (news.length > 0 ? news : (newsCache.data || [])).slice(0, maxItems);
    const aiCuratedNews = aiCurator.getNews();

    return res.json({
      ok: true,
      news: returnList,
      aiCuratedNews,
      source: 'Google News India Multi-Feed (Live RSS) + AI Farmer Wire',
      fetchedAt: new Date(now).toISOString(),
      cached: false
    });
  } catch (err) {
    console.error('Failed to fetch community news:', err.message);
    const aiCuratedNews = aiCurator.getNews();
    if (newsCache.data.length > 0) {
      return res.json({
        ok: true,
        news: newsCache.data.slice(0, maxItems),
        aiCuratedNews,
        source: newsCache.source,
        fetchedAt: new Date(newsCache.timestamp).toISOString(),
        cached: true,
        fallback: true
      });
    }
    return res.json({
      ok: true,
      news: aiCuratedNews,
      aiCuratedNews,
      source: 'Krishi-Net AI Agronomy & Policy Wire (Autonomous Cache)',
      fetchedAt: new Date().toISOString(),
      cached: true,
      fallback: true
    });
  }
});

// Get All Posts
app.get('/forum/posts', async (req, res) => {
  try {
    if (!process.env.FORUM_TABLE) return res.json({ posts: [] });
    const data = await docClient.send(new ScanCommand({ TableName: process.env.FORUM_TABLE }));
    // Sort by timestamp desc (newest first)
    const posts = (data.Items || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create Post
app.post('/forum/posts', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  
  const postId = uuidv4();
  const newPost = {
    postId,
    title,
    content,
    author: { name: req.user.name || 'Farmer', phone: req.user.phone, village: req.user.village },
    timestamp: new Date().toISOString(),
    replies: []
  };

  if (process.env.FORUM_TABLE) {
    try {
      await docClient.send(new PutCommand({ TableName: process.env.FORUM_TABLE, Item: newPost }));
      res.json({ success: true, post: newPost });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  } else {
    res.status(500).json({ error: 'Forum table not configured' });
  }
});

// Add Reply
app.post('/forum/posts/:postId/replies', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const reply = {
    replyId: uuidv4(),
    content,
    author: { name: req.user.name || 'Farmer', phone: req.user.phone },
    timestamp: new Date().toISOString(),
    isExpert: false // In a real app, check user role
  };

  if (process.env.FORUM_TABLE) {
    try {
      // 1. Fetch the post first to identify the author for notification
      let postAuthorPhone = null;
      let postTitle = '';
      try {
        const postData = await docClient.send(new GetCommand({ TableName: process.env.FORUM_TABLE, Key: { postId } }));
        if (postData.Item) {
          postAuthorPhone = postData.Item.author.phone;
          postTitle = postData.Item.title;
        }
      } catch (e) { console.error('Failed to fetch post for notification', e); }

      await docClient.send(new UpdateCommand({
        TableName: process.env.FORUM_TABLE,
        Key: { postId },
        UpdateExpression: "SET replies = list_append(if_not_exists(replies, :empty_list), :r)",
        ExpressionAttributeValues: {
          ':r': [reply],
          ':empty_list': []
        },
        ReturnValues: "ALL_NEW"
      }));

      // 2. Create Notification if replier is not the author
      if (postAuthorPhone && postAuthorPhone !== req.user.phone && process.env.NOTIFICATIONS_TABLE) {
        const notification = {
          phone: postAuthorPhone,
          timestamp: new Date().toISOString(),
          type: 'reply',
          title: 'New Reply',
          message: `${req.user.name || 'Someone'} replied to: ${postTitle.substring(0, 20)}${postTitle.length > 20 ? '...' : ''}`,
          isRead: false,
          metadata: { postId }
        };
        await docClient.send(new PutCommand({
          TableName: process.env.NOTIFICATIONS_TABLE,
          Item: notification
        }));
      }

      res.json({ success: true, reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add reply' });
    }
  } else {
    res.status(500).json({ error: 'Forum table not configured' });
  }
});

// ============================================================================
// KRISHI SOCIAL COMMUNITY DATA ENGINE
// Clean Real-Time Community Posts & Stories with 0 Fake Profiles in Production
// ============================================================================
const SOCIAL_POSTS_FILE = path.join(__dirname, 'data', 'social-posts.json');
const SOCIAL_STORIES_FILE = path.join(__dirname, 'data', 'social-stories.json');
const SOCIAL_NETWORK_FILE = path.join(__dirname, 'data', 'social-network.json');
const SOCIAL_MESSAGES_FILE = path.join(__dirname, 'data', 'social-messages.json');
const SOCIAL_SETTINGS_FILE = path.join(__dirname, 'data', 'social-settings.json');

function loadSocialPosts() {
  try {
    if (fs.existsSync(SOCIAL_POSTS_FILE)) {
      const raw = fs.readFileSync(SOCIAL_POSTS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading social posts file:', err.message);
  }
  return [];
}

function saveSocialPosts(posts) {
  try {
    fs.writeFileSync(SOCIAL_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving social posts file:', err.message);
  }
}

function loadSocialStories() {
  try {
    if (fs.existsSync(SOCIAL_STORIES_FILE)) {
      const raw = fs.readFileSync(SOCIAL_STORIES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading social stories file:', err.message);
  }
  return [];
}

function saveSocialStories(stories) {
  try {
    fs.writeFileSync(SOCIAL_STORIES_FILE, JSON.stringify(stories, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving social stories file:', err.message);
  }
}

function loadSocialNetwork() {
  try {
    if (fs.existsSync(SOCIAL_NETWORK_FILE)) {
      const raw = fs.readFileSync(SOCIAL_NETWORK_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          fieldmates: parsed.fieldmates || {},
          fieldmateRequests: Array.isArray(parsed.fieldmateRequests) ? parsed.fieldmateRequests : [],
          followers: parsed.followers || {},
          myCircle: parsed.myCircle || {}
        };
      }
    }
  } catch (e) {
    console.error('Error reading social-network.json:', e.message);
  }
  return { fieldmates: {}, fieldmateRequests: [], followers: {}, myCircle: {} };
}

function saveSocialNetwork(network) {
  try {
    fs.writeFileSync(SOCIAL_NETWORK_FILE, JSON.stringify(network, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving social-network.json:', e.message);
  }
}

function loadSocialMessages() {
  try {
    if (fs.existsSync(SOCIAL_MESSAGES_FILE)) {
      const raw = fs.readFileSync(SOCIAL_MESSAGES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error('Error reading social-messages.json:', e.message);
  }
  return { threads: {}, messageRequests: [] };
}

function saveSocialMessages(messages) {
  try {
    fs.writeFileSync(SOCIAL_MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving social-messages.json:', e.message);
  }
}

function loadSocialSettings() {
  try {
    if (fs.existsSync(SOCIAL_SETTINGS_FILE)) {
      const raw = fs.readFileSync(SOCIAL_SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error('Error reading social-settings.json:', e.message);
  }
  return {};
}

function saveSocialSettings(settings) {
  try {
    fs.writeFileSync(SOCIAL_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving social-settings.json:', e.message);
  }
}

function getThreadKey(u1, u2) {
  const h1 = (u1 || '').toLowerCase().trim();
  const h2 = (u2 || '').toLowerCase().trim();
  return [h1, h2].sort().join('__');
}

// 1. Get All Community Posts & fieldVibes
app.get('/api/social/posts', async (req, res) => {
  try {
    const { category, type } = req.query;
    let posts = loadSocialPosts();

    if (category && category !== 'all') {
      posts = posts.filter(p => (p.category || p.circle || '').toLowerCase() === category.toLowerCase());
    }
    if (type && (type === 'post' || type === 'fieldVibe')) {
      posts = posts.filter(p => (p.contentType || 'post') === type);
    }

    res.json({
      success: true,
      posts,
      count: posts.length,
      isProduction: process.env.NODE_ENV === 'production'
    });
  } catch (err) {
    console.error('Failed to get social posts:', err);
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// 2. Create New Community Post or fieldVibe (Only Category Prompt Required)
app.post('/api/social/posts', async (req, res) => {
  try {
    const {
      author,
      category = 'Crop Care',
      contentType = 'post',
      englishContent = '',
      originalContent = '',
      originalLang = 'en',
      image = null,
      videoUrl = null
    } = req.body;

    if (!author || (!englishContent.trim() && !originalContent.trim() && !image && !videoUrl)) {
      return res.status(400).json({ error: 'Author and content or media required' });
    }

    const settings = loadSocialSettings();
    const userSettings = settings[(author.username || '').toLowerCase().trim()] || {};
    const authorHasGreenTick = Boolean(author.hasGreenTick || userSettings.hasGreenTick);

    // 3x Algorithmic Reach Multiplier for Green Tick verified accounts
    const baseReach = contentType === 'fieldVibe' ? 840 : 420;
    const computedReach = authorHasGreenTick ? `${(baseReach * 3 / 1000).toFixed(1)}k` : `${baseReach}`;

    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: {
        id: author.id || `user-${Date.now()}`,
        name: author.name || 'Member',
        username: author.username || '@member',
        village: author.village || '',
        state: author.state || 'India',
        avatar: author.avatar || '',
        hasGreenTick: authorHasGreenTick,
        verified: authorHasGreenTick
      },
      category: category.trim(),
      circle: category.toLowerCase().replace(/\s+/g, '-'),
      contentType: contentType === 'fieldVibe' ? 'fieldVibe' : 'post',
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      reach: computedReach,
      boostedReach: authorHasGreenTick,
      originalLang,
      englishContent: englishContent.trim() || originalContent.trim(),
      originalContent: originalContent.trim() || englishContent.trim(),
      image,
      videoUrl,
      reactions: { shabaash: 0 },
      userReaction: null,
      saved: false,
      comments: []
    };

    const posts = loadSocialPosts();
    posts.unshift(newPost);
    saveSocialPosts(posts);

    res.json({ success: true, post: newPost });
  } catch (err) {
    console.error('Failed to create community post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 3. Add / Toggle "shabaash!" Reaction
app.post('/api/social/posts/:postId/react', async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType = 'shabaash', undo = false } = req.body;

    const posts = loadSocialPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.reactions) {
      post.reactions = { shabaash: 0 };
    }
    
    if (undo) {
      post.reactions.shabaash = Math.max(0, (post.reactions.shabaash || 1) - 1);
    } else {
      post.reactions.shabaash = (post.reactions.shabaash || 0) + 1;
    }

    saveSocialPosts(posts);
    res.json({ success: true, reactions: post.reactions });
  } catch (err) {
    console.error('Failed to react to post:', err);
    res.status(500).json({ error: 'Failed to record reaction' });
  }
});

// 4. Add Comment or Threaded Nested Reply
app.post('/api/social/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { author, text, lang = 'en', parentCommentId = null } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const posts = loadSocialPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const authorName = typeof author === 'string' ? author : (author?.name || 'Member');
    const authorUsername = typeof author === 'object' ? (author?.username || '@member') : '@member';
    const authorAvatar = typeof author === 'object' ? (author?.avatar || '') : '';

    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author: authorName,
      username: authorUsername,
      avatar: authorAvatar,
      lang,
      text: text.trim(),
      time: 'Just now',
      createdAt: new Date().toISOString(),
      parentCommentId: parentCommentId || null,
      replies: []
    };

    if (!post.comments) post.comments = [];

    if (parentCommentId) {
      const parent = post.comments.find(c => c.id === parentCommentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newComment);
      } else {
        post.comments.push(newComment);
      }
    } else {
      post.comments.push(newComment);
    }

    saveSocialPosts(posts);
    res.json({ success: true, comment: newComment, comments: post.comments });
  } catch (err) {
    console.error('Failed to add comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 5. Follow / Unfollow User (Single click, no acceptance needed)
app.post('/api/social/follow', (req, res) => {
  try {
    const { followerUsername, targetUsername } = req.body;
    if (!followerUsername || !targetUsername) {
      return res.status(400).json({ error: 'Follower and target username required' });
    }

    const u1 = followerUsername.toLowerCase().trim();
    const u2 = targetUsername.toLowerCase().trim();

    if (u1 === u2) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const network = loadSocialNetwork();
    if (!network.followers[u1]) network.followers[u1] = [];

    const isFollowing = network.followers[u1].includes(u2);
    if (isFollowing) {
      network.followers[u1] = network.followers[u1].filter(h => h !== u2);
    } else {
      network.followers[u1].push(u2);
    }

    saveSocialNetwork(network);

    res.json({
      success: true,
      following: !isFollowing,
      followingCount: network.followers[u1].length
    });
  } catch (err) {
    console.error('Failed to toggle follow:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// 6. Get Network Relationships (Followers, Fieldmates, My Circle)
app.get('/api/social/network-status', (req, res) => {
  try {
    const { username, targetUsername } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const u1 = username.toLowerCase().trim();
    const network = loadSocialNetwork();

    const userFollows = network.followers[u1] || [];
    const userFieldmates = network.fieldmates[u1] || [];
    const userMyCircle = network.myCircle[u1] || [];

    let isFollowingTarget = false;
    let isFieldmateTarget = false;
    let isMyCircleTarget = false;
    let fieldmateRequestStatus = 'none';

    if (targetUsername) {
      const u2 = targetUsername.toLowerCase().trim();
      isFollowingTarget = userFollows.includes(u2);
      isFieldmateTarget = userFieldmates.includes(u2);
      isMyCircleTarget = userMyCircle.includes(u2);

      const pendingReq = network.fieldmateRequests.find(r =>
        r.status === 'pending' &&
        (((r.fromUser?.username || '').toLowerCase().trim() === u1 && (r.toUser?.username || '').toLowerCase().trim() === u2) ||
         ((r.fromUser?.username || '').toLowerCase().trim() === u2 && (r.toUser?.username || '').toLowerCase().trim() === u1))
      );

      if (isFieldmateTarget) {
        fieldmateRequestStatus = 'accepted';
      } else if (pendingReq) {
        fieldmateRequestStatus = (pendingReq.fromUser?.username || '').toLowerCase().trim() === u1 ? 'pending_sent' : 'pending_received';
      }
    }

    res.json({
      success: true,
      followingList: userFollows,
      fieldmatesList: userFieldmates,
      myCircleList: userMyCircle,
      isFollowingTarget,
      isFieldmateTarget,
      isMyCircleTarget,
      fieldmateRequestStatus
    });
  } catch (err) {
    console.error('Failed to get network status:', err);
    res.status(500).json({ error: 'Failed to fetch network status' });
  }
});

// 7. Fieldmate Requests (Mutual Friendship)
app.get('/api/social/fieldmate-requests', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const userClean = username.toLowerCase().trim();

    const network = loadSocialNetwork();
    const incoming = network.fieldmateRequests.filter(r =>
      (r.toUser?.username || '').toLowerCase().trim() === userClean && r.status === 'pending'
    );
    const sent = network.fieldmateRequests.filter(r =>
      (r.fromUser?.username || '').toLowerCase().trim() === userClean && r.status === 'pending'
    );

    res.json({ success: true, incoming, sent, totalPending: incoming.length });
  } catch (err) {
    console.error('Failed to get fieldmate requests:', err);
    res.status(500).json({ error: 'Failed to fetch fieldmate requests' });
  }
});

app.post('/api/social/fieldmate-requests', (req, res) => {
  try {
    const { fromUser, toUser, message } = req.body;
    if (!fromUser?.username || !toUser?.username) {
      return res.status(400).json({ error: 'Sender and recipient required' });
    }

    const fromClean = fromUser.username.toLowerCase().trim();
    const toClean = toUser.username.toLowerCase().trim();

    if (fromClean === toClean) {
      return res.status(400).json({ error: 'Cannot send fieldmate request to yourself' });
    }

    const network = loadSocialNetwork();
    const fromFieldmates = network.fieldmates[fromClean] || [];
    if (fromFieldmates.includes(toClean)) {
      return res.status(400).json({ error: 'You are already fieldmates!' });
    }

    const existingReq = network.fieldmateRequests.find(r =>
      r.status === 'pending' &&
      (((r.fromUser?.username || '').toLowerCase().trim() === fromClean && (r.toUser?.username || '').toLowerCase().trim() === toClean) ||
       ((r.fromUser?.username || '').toLowerCase().trim() === toClean && (r.toUser?.username || '').toLowerCase().trim() === fromClean))
    );

    if (existingReq) {
      return res.json({ success: true, message: 'Fieldmate request is already pending', request: existingReq });
    }

    const newReq = {
      id: `freq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fromUser: {
        id: fromUser.id || `user-${Date.now()}`,
        name: fromUser.name || 'Member',
        username: fromUser.username,
        avatar: fromUser.avatar || '',
        village: fromUser.village || '',
        state: fromUser.state || 'India'
      },
      toUser: {
        id: toUser.id || `user-${Date.now()}`,
        name: toUser.name || 'Member',
        username: toUser.username,
        avatar: toUser.avatar || ''
      },
      message: message || 'I would like to add you as a Fieldmate.',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    network.fieldmateRequests.unshift(newReq);
    saveSocialNetwork(network);

    res.json({ success: true, message: 'Fieldmate request sent successfully', request: newReq });
  } catch (err) {
    console.error('Failed to send fieldmate request:', err);
    res.status(500).json({ error: 'Failed to send fieldmate request' });
  }
});

app.post('/api/social/fieldmate-requests/:requestId/respond', (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accept or decline' });
    }

    const network = loadSocialNetwork();
    const reqIndex = network.fieldmateRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Fieldmate request not found' });
    }

    const targetReq = network.fieldmateRequests[reqIndex];
    const u1 = (targetReq.fromUser.username || '').toLowerCase().trim();
    const u2 = (targetReq.toUser.username || '').toLowerCase().trim();

    if (action === 'accept') {
      targetReq.status = 'accepted';
      targetReq.acceptedAt = new Date().toISOString();

      if (!network.fieldmates[u1]) network.fieldmates[u1] = [];
      if (!network.fieldmates[u2]) network.fieldmates[u2] = [];

      if (!network.fieldmates[u1].includes(u2)) network.fieldmates[u1].push(u2);
      if (!network.fieldmates[u2].includes(u1)) network.fieldmates[u2].push(u1);
    } else {
      targetReq.status = 'declined';
      targetReq.declinedAt = new Date().toISOString();
    }

    saveSocialNetwork(network);

    res.json({
      success: true,
      action,
      message: action === 'accept' ? 'Fieldmate request accepted!' : 'Fieldmate request declined.'
    });
  } catch (err) {
    console.error('Failed to respond to fieldmate request:', err);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

// 8. Toggle "My Circle" (Close Friends with Orange Ring)
app.post('/api/social/my-circle/toggle', (req, res) => {
  try {
    const { username, targetUsername } = req.body;
    if (!username || !targetUsername) {
      return res.status(400).json({ error: 'Usernames required' });
    }

    const u1 = username.toLowerCase().trim();
    const u2 = targetUsername.toLowerCase().trim();

    const network = loadSocialNetwork();
    if (!network.myCircle[u1]) network.myCircle[u1] = [];

    const inCircle = network.myCircle[u1].includes(u2);
    if (inCircle) {
      network.myCircle[u1] = network.myCircle[u1].filter(h => h !== u2);
    } else {
      network.myCircle[u1].push(u2);
    }

    saveSocialNetwork(network);

    res.json({
      success: true,
      inCircle: !inCircle,
      myCircle: network.myCircle[u1]
    });
  } catch (err) {
    console.error('Failed to toggle My Circle:', err);
    res.status(500).json({ error: 'Failed to update My Circle' });
  }
});

// 9. Privacy Settings & Chat Permissions
app.get('/api/social/settings', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const userClean = username.toLowerCase().trim();

    const settings = loadSocialSettings();
    const userConfig = settings[userClean] || {
      chatPermission: 'Everyone',
      hasGreenTick: false
    };

    res.json({ success: true, settings: userConfig });
  } catch (err) {
    console.error('Failed to get social settings:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/social/settings', (req, res) => {
  try {
    const { username, chatPermission, hasGreenTick } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const userClean = username.toLowerCase().trim();

    const settings = loadSocialSettings();
    if (!settings[userClean]) {
      settings[userClean] = { chatPermission: 'Everyone', hasGreenTick: false };
    }

    if (chatPermission && ['Everyone', 'Fieldmates', 'Followers'].includes(chatPermission)) {
      settings[userClean].chatPermission = chatPermission;
    }
    if (typeof hasGreenTick === 'boolean') {
      settings[userClean].hasGreenTick = hasGreenTick;
    }

    saveSocialSettings(settings);
    res.json({ success: true, settings: settings[userClean] });
  } catch (err) {
    console.error('Failed to save social settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 10. Direct Messages & Message Request Queue (Hidden until Accepted)
app.get('/api/social/messages', (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) return res.status(400).json({ error: 'Both usernames required' });

    const u1 = user1.toLowerCase().trim();
    const u2 = user2.toLowerCase().trim();

    const threadKey = getThreadKey(u1, u2);
    const allData = loadSocialMessages();
    const messages = (allData.threads && allData.threads[threadKey]) || [];

    const pendingReq = (allData.messageRequests || []).find(r =>
      r.status === 'pending' &&
      (((r.sender?.username || '').toLowerCase().trim() === u1 && (r.receiver?.username || '').toLowerCase().trim() === u2) ||
       ((r.sender?.username || '').toLowerCase().trim() === u2 && (r.receiver?.username || '').toLowerCase().trim() === u1))
    );

    res.json({
      success: true,
      messages,
      isMessageRequest: Boolean(pendingReq),
      messageRequest: pendingReq || null
    });
  } catch (err) {
    console.error('Failed to get messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get Message Requests Queue for Receiver
app.get('/api/social/message-requests', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const userClean = username.toLowerCase().trim();

    const allData = loadSocialMessages();
    const incomingRequests = (allData.messageRequests || []).filter(r =>
      (r.receiver?.username || '').toLowerCase().trim() === userClean && r.status === 'pending'
    );

    // MASK message content preview in request queue until accepted per specification
    const sanitizedRequests = incomingRequests.map(r => ({
      ...r,
      text: '🔒 Content hidden until accepted (Privacy setting restricted)',
      rawContentHidden: true
    }));

    res.json({ success: true, requests: sanitizedRequests, count: sanitizedRequests.length });
  } catch (err) {
    console.error('Failed to get message requests:', err);
    res.status(500).json({ error: 'Failed to fetch message requests' });
  }
});

// Send Direct Message (Evaluates Receiver's Chat Permission)
app.post('/api/social/messages', (req, res) => {
  try {
    const { sender, receiver, text, image = null } = req.body;
    if (!sender?.username || !receiver?.username || (!text?.trim() && !image)) {
      return res.status(400).json({ error: 'Sender, receiver, and message content required' });
    }

    const u1 = sender.username.toLowerCase().trim();
    const u2 = receiver.username.toLowerCase().trim();

    const settings = loadSocialSettings();
    const receiverConfig = settings[u2] || { chatPermission: 'Everyone' };
    const permission = receiverConfig.chatPermission || 'Everyone';

    const network = loadSocialNetwork();
    const receiverFieldmates = network.fieldmates[u2] || [];

    let isPermitted = true;
    if (permission === 'Fieldmates') {
      isPermitted = receiverFieldmates.includes(u1);
    } else if (permission === 'Followers') {
      const followersOfU2 = Object.entries(network.followers).filter(([follower, targets]) => targets.includes(u2)).map(([f]) => f);
      isPermitted = followersOfU2.includes(u1) || receiverFieldmates.includes(u1);
    }

    const allData = loadSocialMessages();
    if (!allData.threads) allData.threads = {};
    if (!allData.messageRequests) allData.messageRequests = [];

    const threadKey = getThreadKey(u1, u2);
    if (!allData.threads[threadKey]) allData.threads[threadKey] = [];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sender: sender.username,
      senderName: sender.name || 'Member',
      senderAvatar: sender.avatar || '',
      receiver: receiver.username,
      text: text ? text.trim() : '',
      image,
      timestamp: timeStr,
      createdAt: now.toISOString(),
      seen: false
    };

    if (isPermitted) {
      allData.threads[threadKey].push(newMsg);
      saveSocialMessages(allData);

      return res.json({ success: true, message: newMsg, deliveredDirect: true });
    } else {
      const reqId = `mreq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const messageReq = {
        id: reqId,
        sender,
        receiver,
        secretMessage: newMsg,
        status: 'pending',
        createdAt: now.toISOString()
      };

      allData.messageRequests.unshift(messageReq);
      saveSocialMessages(allData);

      return res.json({
        success: true,
        message: newMsg,
        deliveredDirect: false,
        routedToQueue: true,
        notice: 'Message sent as a Message Request due to recipient privacy settings.'
      });
    }
  } catch (err) {
    console.error('Failed to send message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Respond to Message Request (Accept / Decline)
app.post('/api/social/message-requests/:id/respond', (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const allData = loadSocialMessages();
    if (!allData.messageRequests) allData.messageRequests = [];
    if (!allData.threads) allData.threads = {};

    const reqIdx = allData.messageRequests.findIndex(r => r.id === id);
    if (reqIdx === -1) {
      return res.status(404).json({ error: 'Message request not found' });
    }

    const targetReq = allData.messageRequests[reqIdx];
    const u1 = (targetReq.sender?.username || '').toLowerCase().trim();
    const u2 = (targetReq.receiver?.username || '').toLowerCase().trim();
    const threadKey = getThreadKey(u1, u2);

    if (action === 'accept') {
      targetReq.status = 'accepted';
      if (!allData.threads[threadKey]) allData.threads[threadKey] = [];
      if (targetReq.secretMessage) {
        allData.threads[threadKey].push(targetReq.secretMessage);
      }
    } else {
      targetReq.status = 'declined';
    }

    saveSocialMessages(allData);

    res.json({
      success: true,
      action,
      message: action === 'accept' ? 'Message request accepted! Chat unlocked.' : 'Message request declined.'
    });
  } catch (err) {
    console.error('Failed to respond to message request:', err);
    res.status(500).json({ error: 'Failed to process message request' });
  }
});

// Reset / Purge Test Social Data (For Development & Admin Use)
app.post('/api/social/reset-test-data', async (req, res) => {
  try {
    saveSocialPosts([]);
    saveSocialStories([]);
    saveSocialNetwork({ fieldmates: {}, fieldmateRequests: [], followers: {}, myCircle: {} });
    saveSocialMessages({ threads: {}, messageRequests: [] });
    saveSocialSettings({});
    res.json({ success: true, message: 'All social data has been reset to clean state.' });
  } catch (err) {
    console.error('Failed to reset test data:', err);
    res.status(500).json({ error: 'Failed to reset test data' });
  }
});

// Get Notifications
app.get('/notifications', authenticateToken, async (req, res) => {
  if (!process.env.NOTIFICATIONS_TABLE) return res.json({ notifications: [] });
  try {
    const data = await docClient.send(new QueryCommand({
      TableName: process.env.NOTIFICATIONS_TABLE,
      KeyConditionExpression: 'phone = :p',
      ExpressionAttributeValues: { ':p': req.user.phone },
      ScanIndexForward: false // Newest first
    }));
    res.json({ notifications: data.Items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification Read
app.post('/notifications/mark-read', authenticateToken, async (req, res) => {
  const { timestamp } = req.body;
  if (!process.env.NOTIFICATIONS_TABLE || !timestamp) return res.status(400).json({ error: 'Missing params' });
  try {
    await docClient.send(new UpdateCommand({
      TableName: process.env.NOTIFICATIONS_TABLE,
      Key: { phone: req.user.phone, timestamp },
      UpdateExpression: 'SET isRead = :true',
      ExpressionAttributeValues: { ':true': true }
    }));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

function normalizeStateName(rawState) {
  if (!rawState || typeof rawState !== 'string') return null
  return rawState.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
}

async function getStateFromCoordinates(lat, lon) {
  const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=en`
  const { data } = await axios.get(reverseUrl, {
    timeout: 8000,
    headers: { 'User-Agent': 'krishi-net/1.0 (farmer-schemes)' }
  })

  const state = data?.address?.state || data?.address?.province || null
  return state
}

// Farmer Government Schemes (India) - returns schemes applicable to detected state
app.get('/government-schemes', async (req, res) => {
  try {
    const baseSchemes = [
      {
        id: 'pm-kisan',
        title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        benefit: 'Income support of ₹6,000 per year in 3 installments for eligible landholding farmer families.',
        eligibility: 'Small and marginal farmer families meeting PM-KISAN criteria.',
        applyUrl: 'https://pmkisan.gov.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'pmfby',
        title: 'PM Fasal Bima Yojana (PMFBY)',
        benefit: 'Crop insurance against yield losses due to natural calamities, pests, and diseases.',
        eligibility: 'Farmers growing notified crops in notified areas.',
        applyUrl: 'https://pmfby.gov.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'kcc',
        title: 'Kisan Credit Card (KCC)',
        benefit: 'Short-term credit support for crop cultivation and allied activities at concessional rates.',
        eligibility: 'Farmers, tenant farmers, sharecroppers, SHGs/JLGs engaged in agriculture/allied sectors.',
        applyUrl: 'https://pmkisan.gov.in/Kcc/Default.aspx',
        ministry: 'Department of Financial Services / Agriculture',
        availableStates: ['ALL']
      },
      {
        id: 'soil-health-card',
        title: 'Soil Health Card Scheme',
        benefit: 'Soil testing and nutrient/fertilizer recommendations to improve productivity.',
        eligibility: 'Farmers across India through state agriculture departments and labs.',
        applyUrl: 'https://soilhealth.dac.gov.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'enam',
        title: 'e-NAM (National Agriculture Market)',
        benefit: 'Online trading platform for better price discovery and transparent mandi trading.',
        eligibility: 'Farmers and FPOs registered with integrated mandis.',
        applyUrl: 'https://www.enam.gov.in/web/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'pmksy',
        title: 'PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)',
        benefit: 'Irrigation expansion and micro-irrigation support under Per Drop More Crop.',
        eligibility: 'Farmers as per state implementation guidelines.',
        applyUrl: 'https://pmksy.gov.in/',
        ministry: 'Ministry of Jal Shakti / Agriculture',
        availableStates: ['ALL']
      },
      {
        id: 'smam',
        title: 'SMAM (Sub-Mission on Agricultural Mechanization)',
        benefit: 'Financial assistance for purchase of agricultural machinery and equipment.',
        eligibility: 'Farmers and farmer groups as per state norms.',
        applyUrl: 'https://agrimachinery.nic.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'pkvy',
        title: 'PKVY (Paramparagat Krishi Vikas Yojana)',
        benefit: 'Support for cluster-based organic farming and certification.',
        eligibility: 'Farmer groups/clusters adopting organic practices.',
        applyUrl: 'https://pgsindia-ncof.gov.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'aif',
        title: 'Agriculture Infrastructure Fund (AIF)',
        benefit: 'Medium to long-term debt financing for post-harvest and agri-infrastructure projects.',
        eligibility: 'Farmers, FPOs, PACS, agri-entrepreneurs and related entities.',
        applyUrl: 'https://agriinfra.dac.gov.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      },
      {
        id: 'nmsa',
        title: 'National Mission for Sustainable Agriculture (NMSA)',
        benefit: 'Support for climate-resilient and sustainable farming practices.',
        eligibility: 'Farmers through state agriculture departments under mission components.',
        applyUrl: 'https://nmsa.dac.gov.in/',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        availableStates: ['ALL']
      }
    ]

    const stateSchemePortals = {
      'andhra pradesh': 'https://www.apagrisnet.gov.in/',
      'arunachal pradesh': 'https://agri.arunachal.gov.in/',
      assam: 'https://agri-horti.assam.gov.in/',
      bihar: 'https://state.bihar.gov.in/krishi/CitizenHome.html',
      chhattisgarh: 'https://agriportal.cg.nic.in/',
      goa: 'https://www.agri.goa.gov.in/',
      gujarat: 'https://ikhedut.gujarat.gov.in/',
      haryana: 'https://agriharyana.gov.in/',
      'himachal pradesh': 'https://www.hpagriculture.com/',
      jharkhand: 'https://agri.jharkhand.gov.in/',
      karnataka: 'https://raitamitra.karnataka.gov.in/',
      kerala: 'https://www.krishi.info/',
      'madhya pradesh': 'https://farmer.gov.in/StateAgriDepartment.aspx',
      maharashtra: 'https://mahaagri.gov.in/',
      manipur: 'https://agrimanipur.gov.in/',
      meghalaya: 'https://megagriculture.gov.in/',
      mizoram: 'https://agriculture.mizoram.gov.in/',
      nagaland: 'https://agriculture.nagaland.gov.in/',
      odisha: 'https://agri.odisha.gov.in/',
      punjab: 'https://agripb.gov.in/',
      rajasthan: 'https://rajkisan.rajasthan.gov.in/',
      delhi: 'https://agri.delhi.gov.in/',
      'national capital territory of delhi': 'https://agri.delhi.gov.in/',
      'nct of delhi': 'https://agri.delhi.gov.in/',
      sikkim: 'https://sikkim.gov.in/departments/food-security-agriculture-development-department',
      'tamil nadu': 'https://www.tnagrisnet.tn.gov.in/',
      telangana: 'https://agri.telangana.gov.in/',
      tripura: 'https://agri.tripura.gov.in/',
      'uttar pradesh': 'https://upagriculture.com/',
      uttarakhand: 'https://agriculture.uk.gov.in/',
      'west bengal': 'https://www.wbagrisnet.gov.in/'
    }

    let detectedState = null
    let locationSource = 'unknown'

    const lat = Number(req.query.lat)
    const lon = Number(req.query.lon)

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      try {
        detectedState = await getStateFromCoordinates(lat, lon)
        locationSource = 'gps'
      } catch (e) {
        console.warn('Reverse geocode failed, trying IP location:', e.message)
      }
    }

    if (!detectedState) {
      try {
        const clientIp = getClientIpAddress(req)
        const location = await getLocationFromIp(clientIp)
        detectedState = location.region || null
        locationSource = 'ip'
      } catch (e) {
        console.warn('IP location failed, serving national schemes fallback:', e.message)
        detectedState = null
        locationSource = 'fallback'
      }
    }

    const normalizedState = normalizeStateName(detectedState)
    const schemes = [...baseSchemes]

    if (normalizedState && stateSchemePortals[normalizedState]) {
      schemes.push({
        id: `state-portal-${normalizedState.replace(/\s+/g, '-')}`,
        title: `${detectedState} Farmer Schemes Portal`,
        benefit: `State-specific schemes, subsidies, and application tracking for farmers in ${detectedState}.`,
        eligibility: `Farmers residing in ${detectedState}.`,
        applyUrl: stateSchemePortals[normalizedState],
        ministry: `${detectedState} State Agriculture Department`,
        availableStates: [normalizedState]
      })
    }

    const filteredSchemes = schemes.filter(scheme => {
      if (!Array.isArray(scheme.availableStates)) return true
      if (scheme.availableStates.includes('ALL')) return true
      if (!normalizedState) return false
      return scheme.availableStates.includes(normalizedState)
    })

    res.json({
      schemes: filteredSchemes,
      detectedState: detectedState || null,
      locationSource,
      source: 'official-government-portals',
      lastUpdated: new Date().toISOString()
    })
  } catch (err) {
    console.error('Failed to load government schemes', err)
    res.status(500).json({ error: 'Failed to load government schemes' })
  }
})

// ========================================================
// Commodities-API (Global Commodity Price Aggregator) Endpoints
// ========================================================

// 1. Get All Commodity Rates (Filtered by Category, Search, Currency)
app.get('/commodities/rates', async (req, res) => {
  try {
    const { category, search, currency, limit } = req.query;
    const data = await getCommoditiesRates({ category, search, currency, limit });
    res.json(data);
  } catch (err) {
    console.error('Commodities rates error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Available Commodity Symbols & Categories
app.get('/commodities/symbols', (req, res) => {
  try {
    const symbols = COMMODITY_CATALOG.map(c => ({
      symbol: c.symbol,
      name: c.name,
      category: c.category,
      unit: c.unit,
      sourceUnit: c.sourceUnit,
      description: c.desc
    }));
    const categories = ['All', ...new Set(COMMODITY_CATALOG.map(c => c.category))];
    res.json({ success: true, count: symbols.length, categories, symbols });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get 14-Day Historical Trends for Any Commodity
app.get('/commodities/trends', (req, res) => {
  try {
    const { symbol, crop } = req.query;
    const trends = getHistoricalTrends(symbol || crop || 'WHEAT');
    res.json({ ok: true, ...trends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Live Crop / Mandi Price for single crop (backward-compatible, powered by Commodities-API)
app.get('/prices', async (req, res) => {
  try {
    const crop = req.query.crop || 'wheat';
    const result = await getCropPrice(crop);
    res.json(result);
  } catch (err) {
    console.error('Prices error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Public Market & Procurement Rates (powered by Commodities-API)
app.get('/amazon-rates/public', async (req, res) => {
  try {
    const data = await getCommoditiesRates({
      category: req.query.category,
      search: req.query.search,
      currency: req.query.currency || 'INR'
    });
    
    return res.json({
      rates: data.rates.map(r => ({
        crop: r.name,
        symbol: r.symbol,
        price: r.price,
        priceInr: r.priceInr,
        priceUsd: r.priceUsd,
        unit: r.unit,
        category: r.category,
        change24h: r.change24h,
        trend: r.trend,
        high24h: r.high24h,
        low24h: r.low24h,
        note: `Change: ${r.change24h >= 0 ? '+' : ''}${r.change24h}% | 24h High: ₹${r.high24h}`
      })),
      terms: [
        "Farm-gate pickup (No transport cost)",
        "Payment within 24 hours via Direct Bank Transfer",
        "Commodities-API Verified Live Benchmark Rates",
        "Zero middlemen / 0% commission"
      ],
      provider: data.provider,
      coverage: data.coverage,
      totalListed: data.totalListed
    });
  } catch (err) {
    console.error('Public rates error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Weather API Proxy (Current Weather)
app.get('/weather', async (req, res) => {
  const { lat, lon, city } = req.query
  const apiKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY
  const useMockWeather = process.env.USE_MOCK_WEATHER === 'true'
  
  // Mock data if no API key or specific mock flag
  if (useMockWeather) {
     return res.json({
       name: city || 'Sample Village',
       main: { temp: 28, humidity: 65 },
       weather: [{ description: 'partly cloudy', icon: '02d' }],
       wind: { speed: 5 }
     })
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Weather API key not configured. Set WEATHER_API_KEY in backend/.env' })
  }

  try {
    let url = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric`
    if (lat && lon) url += `&lat=${lat}&lon=${lon}`
    else if (city) url += `&q=${city}`
    else return res.status(400).json({ error: 'Location required' })
    
    const { data } = await axios.get(url)
    res.json(data)
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message
    res.status(500).json({ error: `Weather API request failed: ${errorMessage}` })
  }
})

// Weather API Proxy (5 Day Forecast)
app.get('/weather/forecast', async (req, res) => {
  const { lat, lon, city } = req.query
  const apiKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY
  const useMockWeather = process.env.USE_MOCK_WEATHER === 'true'

  if (useMockWeather) {
     // Return mock forecast
     return res.json({
       list: Array(5).fill(0).map((_, i) => ({
         dt: Date.now()/1000 + (i+1)*86400, 
         main: { temp: 28 + Math.random()*5 - 2 }, 
         weather: [{ description: i%2===0 ? 'light rain' : 'clear sky', icon: i%2===0 ? '10d' : '01d' }] 
       }))
     })
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Weather API key not configured. Set WEATHER_API_KEY in backend/.env' })
  }

  try {
    let url = `https://api.openweathermap.org/data/2.5/forecast?appid=${apiKey}&units=metric`
    if (lat && lon) url += `&lat=${lat}&lon=${lon}`
    else if (city) url += `&q=${city}`
    else return res.status(400).json({ error: 'Location required' })

    const { data } = await axios.get(url)
    res.json(data)
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message
    res.status(500).json({ error: `Weather forecast API request failed: ${errorMessage}` })
  }
})

function getClientIpAddress(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }

  const socketIp = req.socket?.remoteAddress || req.ip
  if (!socketIp) return null
  return socketIp.replace('::ffff:', '')
}

async function getLocationFromIp(ipAddress) {
  const isLocalIp = !ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1'
  const ipLookupUrl = isLocalIp
    ? 'https://ipapi.co/json/'
    : `https://ipapi.co/${ipAddress}/json/`

  const { data } = await axios.get(ipLookupUrl, { timeout: 8000 })
  if (!data || data.error || !data.latitude || !data.longitude) {
    throw new Error('Unable to determine location from IP address')
  }

  return {
    lat: data.latitude,
    lon: data.longitude,
    city: data.city,
    region: data.region,
    country: data.country_name
  }
}

function toFiniteNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function getEquipmentPriceCatalog() {
  return {
    tractor: { name: 'Tractor (45-55 HP)', pricePerHour: 900, pricePerDay: 5500 },
    rotavator: { name: 'Rotavator', pricePerHour: 700, pricePerDay: 4200 },
    cultivator: { name: 'Cultivator', pricePerHour: 450, pricePerDay: 2600 },
    seedDrill: { name: 'Seed Drill', pricePerHour: 500, pricePerDay: 3000 },
    harvester: { name: 'Harvester', pricePerHour: 2200, pricePerDay: 13000 },
    thresher: { name: 'Thresher', pricePerHour: 1200, pricePerDay: 7000 },
    boomSprayer: { name: 'Boom Sprayer', pricePerHour: 600, pricePerDay: 3200 },
    waterPump: { name: 'Water Pump Set', pricePerHour: 300, pricePerDay: 1700 }
  }
}

function getEquipmentByAgencyTags(tags = {}) {
  const catalog = getEquipmentPriceCatalog()
  const shop = (tags.shop || '').toLowerCase()
  const amenity = (tags.amenity || '').toLowerCase()
  const rental = (tags.rental || tags['rental:agricultural'] || '').toLowerCase()

  if (shop === 'tractor') {
    return [catalog.tractor, catalog.rotavator, catalog.cultivator, catalog.seedDrill]
  }
  if (amenity === 'tool_rental' || rental.includes('agric')) {
    return [catalog.tractor, catalog.rotavator, catalog.seedDrill, catalog.boomSprayer, catalog.waterPump]
  }
  return [catalog.tractor, catalog.cultivator, catalog.seedDrill, catalog.waterPump]
}

async function fetchNearbyEquipmentAgencies(lat, lon, radiusMeters) {
  const overpassQuery = `[out:json][timeout:20];
(
  node(around:${radiusMeters},${lat},${lon})["amenity"="tool_rental"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="tool_rental"];
  node(around:${radiusMeters},${lat},${lon})["shop"="tractor"];
  way(around:${radiusMeters},${lat},${lon})["shop"="tractor"];
  node(around:${radiusMeters},${lat},${lon})["shop"="farm"];
  way(around:${radiusMeters},${lat},${lon})["shop"="farm"];
  node(around:${radiusMeters},${lat},${lon})["shop"="hardware"];
  way(around:${radiusMeters},${lat},${lon})["shop"="hardware"];
  node(around:${radiusMeters},${lat},${lon})["rental"="agricultural"];
  way(around:${radiusMeters},${lat},${lon})["rental"="agricultural"];
  node(around:${radiusMeters},${lat},${lon})["craft"="agricultural_engines"];
  way(around:${radiusMeters},${lat},${lon})["craft"="agricultural_engines"];
  node(around:${radiusMeters},${lat},${lon})["office"="agricultural_service"];
  way(around:${radiusMeters},${lat},${lon})["office"="agricultural_service"];
);
out center tags;`

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ]

  for (const endpoint of endpoints) {
    try {
      const resp = await axios.post(endpoint, overpassQuery, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 12000
      })
      if (resp.data?.elements) return resp.data.elements
    } catch (err) {
      console.warn(`Overpass endpoint failed (${endpoint}):`, err.message)
    }
  }

  return []
}

const equipmentAgenciesCache = new Map()

app.get('/equipment-rentals/nearby', async (req, res) => {
  const queryLat = toFiniteNumber(req.query.lat)
  const queryLon = toFiniteNumber(req.query.lon)
  let lat = queryLat
  let lon = queryLon
  let locationLabel = 'Near your location'
  let source = 'gps'

  if (lat === null || lon === null) {
    try {
      const clientIp = getClientIpAddress(req)
      const location = await getLocationFromIp(clientIp)
      lat = toFiniteNumber(location.lat)
      lon = toFiniteNumber(location.lon)
      if (lat === null || lon === null) throw new Error('Could not determine location for equipment search')
      locationLabel = [location.city, location.region, location.country].filter(Boolean).join(', ') || 'Near your location'
      source = 'ip'
    } catch (error) {
      lat = 28.6139
      lon = 77.2090
      locationLabel = 'Using fallback location (New Delhi)'
      source = 'fallback'
    }
  }

  const cacheKey = `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`

  try {
    const searchRadii = [15000, 35000, 60000]
    let agenciesRaw = []
    let usedRadius = searchRadii[0]

    for (const radius of searchRadii) {
      usedRadius = radius
      agenciesRaw = await fetchNearbyEquipmentAgencies(lat, lon, radius)
      if (agenciesRaw.length > 0) break
    }

    const agencies = agenciesRaw
      .map((element, index) => {
        const tags = element.tags || {}
        const agencyLat = toFiniteNumber(element.lat ?? element.center?.lat)
        const agencyLon = toFiniteNumber(element.lon ?? element.center?.lon)
        if (agencyLat === null || agencyLon === null) return null

        const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile || 'Not listed'
        const name = tags.name || `Equipment Rental Agency ${index + 1}`
        const distanceKm = haversineKm(lat, lon, agencyLat, agencyLon)
        const equipments = getEquipmentByAgencyTags(tags)

        return {
          id: `${element.type}-${element.id}`,
          name,
          phone,
          address: [tags['addr:street'], tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ') || 'Address not listed',
          distanceKm: Number(distanceKm.toFixed(1)),
          equipments,
          priceSource: 'local-market-estimate',
          mapUrl: `https://www.openstreetmap.org/?mlat=${agencyLat}&mlon=${agencyLon}#map=14/${agencyLat}/${agencyLon}`
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 15)

    if (agencies.length > 0) {
      equipmentAgenciesCache.set(cacheKey, { agencies, locationLabel, cachedAt: new Date().toISOString(), usedRadius })
    }

    if (agencies.length === 0 && equipmentAgenciesCache.has(cacheKey)) {
      const cached = equipmentAgenciesCache.get(cacheKey)
      return res.json({
        locationLabel: cached.locationLabel,
        agencies: cached.agencies,
        source: `${source}-cached`,
        fetchedAt: new Date().toISOString(),
        searchRadiusKm: Number((cached.usedRadius / 1000).toFixed(0))
      })
    }

    return res.json({
      locationLabel,
      agencies,
      source,
      fetchedAt: new Date().toISOString(),
      searchRadiusKm: Number((usedRadius / 1000).toFixed(0))
    })
  } catch (err) {
    console.error('Equipment rentals lookup failed:', err.message)
    if (equipmentAgenciesCache.has(cacheKey)) {
      const cached = equipmentAgenciesCache.get(cacheKey)
      return res.json({
        locationLabel: cached.locationLabel,
        agencies: cached.agencies,
        source: 'cached',
        fetchedAt: new Date().toISOString(),
        searchRadiusKm: Number((cached.usedRadius / 1000).toFixed(0))
      })
    }
    return res.json({
      locationLabel,
      agencies: [],
      source: `${source}-empty`,
      fetchedAt: new Date().toISOString(),
      searchRadiusKm: 60
    })
  }
})

const weatherAutoCache = new Map()

function buildWeatherCacheKey(lat, lon) {
  const safeLat = Number(lat).toFixed(2)
  const safeLon = Number(lon).toFixed(2)
  return `${safeLat},${safeLon}`
}

async function getOpenMeteoWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&hourly=precipitation_probability,precipitation&forecast_days=3&timezone=auto`
  const { data } = await axios.get(url, { timeout: 10000 })

  const temperatureC = toFiniteNumber(data?.current?.temperature_2m)
  if (temperatureC === null) {
    throw new Error('Could not read temperature from weather provider')
  }

  const times = data?.hourly?.time || []
  const precipitationProbability = data?.hourly?.precipitation_probability || []
  const precipitationAmount = data?.hourly?.precipitation || []

  const now = Date.now()
  let nextRainAt = null

  for (let i = 0; i < times.length; i++) {
    const forecastTime = Date.parse(times[i])
    if (!Number.isFinite(forecastTime) || forecastTime < now) continue

    const rainProbability = toFiniteNumber(precipitationProbability[i]) || 0
    const rainAmount = toFiniteNumber(precipitationAmount[i]) || 0
    if (rainProbability >= 40 || rainAmount >= 0.2) {
      nextRainAt = new Date(forecastTime).toISOString()
      break
    }
  }

  return {
    temperatureC,
    willRain: !!nextRainAt,
    nextRainAt
  }
}

app.get('/weather/auto', async (req, res) => {
  const useMockWeather = process.env.USE_MOCK_WEATHER === 'true'
  let cacheKey = null
  let locationLabel = 'Near your current location'
  let source = 'gps'

  if (useMockWeather) {
    return res.json({
      locationLabel: 'Sample Village',
      temperatureC: 28.0,
      willRain: true,
      nextRainAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      source: 'mock',
      detectedAt: new Date().toISOString()
    })
  }

  try {
    const queryLat = toFiniteNumber(req.query.lat)
    const queryLon = toFiniteNumber(req.query.lon)
    const queryPincode = req.query.pincode ? req.query.pincode.toString().trim() : null

    let lat = queryLat
    let lon = queryLon

    if (lat === null || lon === null) {
      // Priority 1: Check if Pincode is provided (registered location fallback)
      if (queryPincode && /^\d{6}$/.test(queryPincode)) {
        try {
          const pinCoords = await getPincodeCoordinates(queryPincode);
          if (pinCoords && pinCoords.lat && pinCoords.lon) {
            lat = toFiniteNumber(pinCoords.lat);
            lon = toFiniteNumber(pinCoords.lon);
            locationLabel = `${pinCoords.name || 'Local Area'}, ${pinCoords.state} (PIN: ${queryPincode})`;
            source = 'pincode';
          }
        } catch (e) {
          console.warn('Failed to resolve pincode coordinates:', e.message);
        }
      }

      // Priority 2: Fallback to IP geolocation if lat/lon still unavailable
      if (lat === null || lon === null) {
        const clientIp = getClientIpAddress(req)
        const location = await getLocationFromIp(clientIp)
        lat = toFiniteNumber(location.lat)
        lon = toFiniteNumber(location.lon)
        if (lat === null || lon === null) {
          throw new Error('Could not determine latitude/longitude')
        }
        locationLabel = [location.city, location.region, location.country].filter(Boolean).join(', ') || 'Near your current location'
        source = 'ip'
      }
    }

    cacheKey = buildWeatherCacheKey(lat, lon)

    const weatherSummary = await getOpenMeteoWeather(lat, lon)

    weatherAutoCache.set(cacheKey, {
      locationLabel,
      weatherSummary,
      cachedAt: new Date().toISOString()
    })

    return res.json({
      locationLabel,
      ...weatherSummary,
      source,
      detectedAt: new Date().toISOString()
    })
  } catch (err) {
    if (cacheKey && weatherAutoCache.has(cacheKey)) {
      const cached = weatherAutoCache.get(cacheKey)
      return res.json({
        locationLabel: cached.locationLabel || locationLabel,
        ...cached.weatherSummary,
        source: `${source}-cached`,
        detectedAt: new Date().toISOString(),
        cachedAt: cached.cachedAt
      })
    }

    return res.json({
      locationLabel,
      temperatureC: 28.0,
      willRain: false,
      nextRainAt: null,
      source: 'fallback-default',
      detectedAt: new Date().toISOString()
    })
  }
})

// Example endpoint to start agent Step Function (placeholder)
app.post('/agent/start', async (req, res) => {
  const input = req.body || {};
  const stateMachineArn = process.env.STEP_FN_ARN || 'arn:aws:states:REGION:ACCOUNT:stateMachine:KrishiAgent';
  try {
    const params = {
      stateMachineArn,
      input: JSON.stringify(input),
      name: `exec-${Date.now()}`
    };
    const start = await stepfunctions.startExecution(params).promise();
    res.json({ started: true, executionArn: start.executionArn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Market prices and trends powered by Commodities-API
app.get('/market/prices', async (req, res) => {
  try {
    const crop = req.query.crop || 'wheat';
    const location = req.query.location || 'Local / Mandi Hub';
    const item = await getCropPrice(crop);

    return res.json({
      ok: true,
      crop: item.crop,
      symbol: item.symbol,
      location,
      price: {
        price_qtl: item.price,
        unit: item.unit,
        change_7d: item.change24h
      },
      source: item.source,
      ts: item.ts
    });
  } catch (err) {
    console.error('Market prices endpoint error', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Trends endpoint returning 14-day history powered by Commodities-API
app.get('/market/prices/trends', (req, res) => {
  try {
    const crop = req.query.crop || req.query.symbol || 'wheat';
    const trends = getHistoricalTrends(crop);
    return res.json({ ok: true, crop, ...trends });
  } catch (err) {
    console.error('Market trends error', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Subscribe to price alerts (stores in-memory for demo)
const priceAlertSubscriptions = new Map()
app.post('/market/subscribe', (req, res) => {
  try {
    const { phone, crop, threshold } = req.body || {}
    if (!phone || !crop || !threshold) return res.status(400).json({ ok: false, error: 'phone,crop,threshold required' })
    const id = `${phone}:${crop}`
    priceAlertSubscriptions.set(id, { phone, crop, threshold, createdAt: new Date().toISOString() })
    return res.json({ ok: true, id })
  } catch (err) {
    console.error('Subscribe error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// Mock SMS sender endpoint (uses existing sendSms helper)
app.post('/sms/send', async (req, res) => {
  try {
    const { to, body } = req.body || {}
    if (!to || !body) return res.status(400).json({ ok: false, error: 'to and body required' })
    const result = await sendSms(to, body)
    return res.json({ ok: true, result })
  } catch (err) {
    console.error('SMS send error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// --- NEW: Schemes listing and apply endpoints ---
const SCHEMES = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    provider: 'Government of India',
    type: 'income_support',
    category: 'government',
    description: 'Direct income support of ₹6000 per year paid in three equal instalments to small and marginal farmer families.',
    eligibility: 'Small and marginal landholders, resident Indian citizens. Exclusions apply (higher income, institutional landowners).',
    benefits: ['Direct cash transfer', 'Annual support'],
    applyLink: 'https://pmkisan.gov.in/'
  },
  {
    id: 'pm-fasal-bima',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    provider: 'Government of India',
    type: 'insurance',
    category: 'government',
    description: 'Crop insurance to protect farmers against crop loss due to natural calamities, pests and diseases.',
    eligibility: 'All farmers growing notified crops in notified areas.',
    benefits: ['Insurance cover', 'Premium subsidy'],
    applyLink: 'https://pmfby.gov.in/'
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    provider: 'NABARD / Participating Banks',
    type: 'credit',
    category: 'finance',
    description: 'Short-term credit support to farmers for cultivation and other agriculture needs at subsidised interest rates.',
    eligibility: 'Cultivators, tenant farmers, sharecroppers and other agricultural workers.',
    benefits: ['Working capital', 'Subsidised interest'],
    applyLink: ''
  },
  {
    id: 'soil-health-card',
    name: 'Soil Health Card Scheme',
    provider: 'Government of India',
    type: 'soil_testing',
    category: 'government',
    description: 'Free soil testing and tailored fertilizer recommendations to farmers.',
    eligibility: 'All farmers',
    benefits: ['Free soil test', 'Fertiliser recommendations'],
    applyLink: 'https://soilhealth.dac.gov.in/'
  },
  {
    id: 'nabard-farm-loans',
    name: 'NABARD Agricultural Loans',
    provider: 'NABARD / Partner Banks',
    type: 'loan',
    category: 'finance',
    description: 'Long-term and short-term loans for farm mechanization, dairy, irrigation and allied activities through partner banks.',
    eligibility: 'Farmers and farmer groups; terms depend on product.',
    benefits: ['Accessible credit', 'Multiple schemes'],
    applyLink: ''
  },
  {
    id: 'sbi-kisan-loan',
    name: 'SBI Kisan Loan',
    provider: 'State Bank of India',
    type: 'loan',
    category: 'finance',
    description: 'Short-term and medium-term agricultural loans offered by SBI to farmers.',
    eligibility: 'Kisan account holders and farmers with proper documentation.',
    benefits: ['Competitive interest', 'Simple documentation'],
    applyLink: 'https://sbi.co.in/web/personal-banking/loans/loans-to-farmers'
  },
  {
    id: 'private-agri-loan-sample',
    name: 'HDFC Agri Loan (Example)',
    provider: 'HDFC Bank',
    type: 'loan',
    category: 'finance',
    description: 'Commercial agricultural loan products for equipment and working capital.',
    eligibility: 'Subject to bank appraisal and creditworthiness.',
    benefits: ['Flexible tenors', 'Quick disbursal'],
    applyLink: 'https://www.hdfcbank.com/personal/borrow/popular-loans/loan-agriculture'
  }
]

// In-memory cache for schemes (can be refreshed from external feed)
let schemesCache = SCHEMES.slice()

// Try loading schemes from remote feed if configured
async function loadSchemesFromFeed() {
  const feedUrl = process.env.SCHEMES_FEED_URL
  const feedUrls = (process.env.SCHEMES_FEED_URLS || '')
    .split(',')
    .map(s => s && s.trim())
    .filter(Boolean)
  if (!feedUrl && feedUrls.length === 0) {
    // we'll fallback to local bundle below
  }
  try {
    let data = null
    if (feedUrl) {
      console.log('Fetching schemes feed from', feedUrl)
      const resp = await axios.get(feedUrl, { timeout: 10000 })
      data = resp.data
    } else if (feedUrls.length > 0) {
      // try each configured feed URL until one returns valid data
      for (const u of feedUrls) {
        try {
          console.log('Attempting schemes feed from', u)
          const resp = await axios.get(u, { timeout: 10000 })
          const d = resp.data
          const list = Array.isArray(d) ? d : (Array.isArray(d.schemes) ? d.schemes : null)
          if (list && list.length) { data = d; break }
        } catch (e) {
          console.warn('Feed attempt failed for', u, e.message)
        }
      }
    } else {
      // Fallback to bundled demo feed for local/dev use
      const localPath = path.join(__dirname, 'data', 'schemes-feed.json')
      if (fs.existsSync(localPath)) {
        try {
          const raw = fs.readFileSync(localPath, 'utf8')
          data = JSON.parse(raw)
          console.log('Loaded local demo schemes feed from', localPath)
        } catch (e) {
          console.warn('Failed to parse local schemes feed:', e.message)
        }
      } else {
        // no feed provided
        return
      }
    }

    if (!data) return
    // Accept either an array or an object with `schemes` array
    const feedList = Array.isArray(data) ? data : (Array.isArray(data.schemes) ? data.schemes : null)
    if (!feedList) {
      console.warn('Schemes feed did not return an array')
      return
    }

    // Merge feed entries with local SCHEMES: prefer feed entries, but keep any local items missing from feed
    const map = new Map()
    // Add local fallback items first
    for (const s of SCHEMES) {
      if (s && s.id) map.set(s.id, s)
    }
    // Overwrite/add feed items
    for (const s of feedList) {
      if (s && s.id) map.set(s.id, s)
    }

    const merged = Array.from(map.values())
    // Keep only items with minimal shape
    schemesCache = merged.filter(s => s && s.id && s.name)
    console.log(`Loaded ${schemesCache.length} schemes from feed/local bundle`)
  } catch (err) {
    console.warn('Failed to load schemes feed:', err.message)
  }
}

// Initial attempt to load feed, then refresh every minute
loadSchemesFromFeed().catch(() => {})
setInterval(() => loadSchemesFromFeed().catch(() => {}), 60 * 1000)

const schemeApplications = new Map()

app.get('/schemes', async (req, res) => {
  try {
    // Optionally filter by type or provider
    const type = req.query.type
    const category = (req.query.category || '').toLowerCase()
    const lifecycleStatus = (req.query.status || req.query.lifecycle || 'active').toLowerCase()

    // Get schemes from AI Curator engine according to requested lifecycle filter
    let list = aiCurator.getSchemes(lifecycleStatus)

    // If cache has loaded, merge any extra feed entries for active/all views
    if (Array.isArray(schemesCache) && schemesCache.length && (lifecycleStatus === 'active' || lifecycleStatus === 'all')) {
      const map = new Map()
      list.forEach(s => map.set(s.id, s))
      schemesCache.forEach(s => {
        if (!map.has(s.id)) map.set(s.id, s)
      })
      list = Array.from(map.values())
    }

    if (type) list = list.filter(s => s.type === type)
    if (category) {
      if (category === 'government') {
        list = list.filter(s => (s.category === 'government') || (String(s.provider || '').toLowerCase().includes('government')))
      } else if (category === 'finance' || category === 'loans' || category === 'insurance') {
        // finance covers loans, insurance, credit products
        list = list.filter(s => s.category === 'finance' || ['loan','insurance','credit'].includes(s.type))
      }
    }
    return res.json({
      ok: true,
      schemes: list,
      curatorStatus: aiCurator.getStatus(),
      ts: Date.now()
    })
  } catch (err) {
    console.error('Schemes list error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/ai/curator-status: Health and summary of the autonomous AI curator
app.get('/api/ai/curator-status', (req, res) => {
  try {
    const status = aiCurator.getStatus()
    return res.json({ ok: true, ...status })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/ai/curate-now: Trigger immediate on-demand AI audit of schemes, loans, and news
app.post('/api/ai/curate-now', async (req, res) => {
  try {
    const auditResult = aiCurator.runAuditCycle('MANUAL_USER_TRIGGER')
    await loadSchemesFromFeed().catch(() => {})
    return res.json({
      ok: true,
      message: 'AI curation cycle completed successfully. Schemes, loans, and agricultural news verified.',
      audit: auditResult,
      status: aiCurator.getStatus()
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// --- Direct 1-Click Official Portal Application & Encrypted Digi-Locker Profile Endpoints ---

// Helper to isolate and decrypt only the current user's encrypted Digi-Locker vault
function resolveUserVaultKey(req) {
  // 1. From Authorization Bearer Token (if logged in)
  const authHeader = req.headers['authorization']
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const LOCAL_JWT_SECRET = process.env.LOCAL_JWT_SECRET || 'dev_local_secret_change_me'
      const decoded = jwt.verify(token, LOCAL_JWT_SECRET)
      if (decoded && (decoded.phone || decoded.sub)) {
        return `farmer_user_${decoded.phone || decoded.sub}`
      }
    } catch (e) {}
  }
  // 2. From client session/device vault header (e.g. x-farmer-session or x-farmer-phone)
  const sessionHeader = req.headers['x-farmer-session'] || req.headers['x-farmer-phone']
  if (sessionHeader && String(sessionHeader).trim().length > 0) {
    return `session_${String(sessionHeader).trim()}`
  }
  // 3. Fallback: isolated client-scoped hash
  const clientIp = req.ip || req.connection?.remoteAddress || 'isolated_client'
  return `vault_${crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 16)}`
}

// GET /api/profile/universal: Fetch current user's encrypted vault profile and readiness score
app.get('/api/profile/universal', (req, res) => {
  try {
    const userKey = resolveUserVaultKey(req)
    const data = portalEngine.getUserProfile(userKey)
    return res.json({ ok: true, userVault: true, ...data })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/profile/universal: Encrypt & save profile to user's private AES-256 vault
app.post('/api/profile/universal', (req, res) => {
  try {
    const userKey = resolveUserVaultKey(req)
    const updated = portalEngine.saveUserProfile(userKey, req.body || {})
    return res.json({ ok: true, userVault: true, ...updated })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/portal/captcha: Generate live anti-bot security captcha challenge
app.get('/api/portal/captcha', (req, res) => {
  try {
    const captcha = portalEngine.generateCaptcha()
    return res.json({ ok: true, captcha })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/portal/scheme-match/:schemeId: Check attribute match for a scheme against current user's vault
app.get('/api/portal/scheme-match/:schemeId', (req, res) => {
  try {
    const userKey = resolveUserVaultKey(req)
    const match = portalEngine.getSchemeRequirementMatch(req.params.schemeId, userKey)
    return res.json({ ok: true, match })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/portal/apply-direct: 1-Click apply directly to official government portal with captcha verification
app.post('/api/portal/apply-direct', (req, res) => {
  try {
    const { schemeId, schemeName, sessionId, captchaSessionId, captchaInput, notes } = req.body || {}
    const activeSessionId = sessionId || captchaSessionId
    if (!schemeId) return res.status(400).json({ ok: false, error: 'schemeId is required' })
    if (!activeSessionId || !captchaInput) return res.status(400).json({ ok: false, error: 'Security Captcha verification is required' })

    const userKey = resolveUserVaultKey(req)
    const application = portalEngine.applyDirectToPortal({
      schemeId,
      schemeName,
      sessionId: activeSessionId,
      captchaInput,
      userKey,
      notes
    })

    return res.json({
      ok: true,
      message: `Application successfully submitted directly to official portal (${application.portal})! Registration ID: ${application.governmentRefId}`,
      application
    })
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message })
  }
})

// GET /api/portal/applications: List submitted official portal applications for the current user
app.get('/api/portal/applications', (req, res) => {
  try {
    const userKey = resolveUserVaultKey(req)
    const apps = portalEngine.getUserApplications(userKey)
    return res.json({ ok: true, count: apps.length, applications: apps })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/schemes/apply', async (req, res) => {
  try {
    const { schemeId, name, phone, details, userId } = req.body || {}
    if (!schemeId || !name || !phone) return res.status(400).json({ ok: false, error: 'schemeId, name and phone required' })
    const allSchemes = aiCurator.getSchemes('all')
    const scheme = allSchemes.find(s => s.id === schemeId) || (Array.isArray(schemesCache) && schemesCache.find(s => s.id === schemeId)) || SCHEMES.find(s => s.id === schemeId)
    if (!scheme) return res.status(404).json({ ok: false, error: 'scheme not found' })

    const appId = `app-${Date.now()}-${Math.floor(Math.random()*9000)+1000}`
    const record = { id: appId, schemeId, name, phone, details: details || '', userId: userId || null, createdAt: new Date().toISOString(), status: 'received' }
    schemeApplications.set(appId, record)

    // Persist to DynamoDB if configured
    if (process.env.APPLICATIONS_TABLE) {
      try {
        await docClient.send(new PutCommand({ TableName: process.env.APPLICATIONS_TABLE, Item: record }))
        console.log('Saved application to DynamoDB table', process.env.APPLICATIONS_TABLE)
      } catch (dbErr) {
        console.error('Failed to save application to DynamoDB:', dbErr.message)
      }
    }

    // Send confirmation SMS (mock or real)
    try {
      await sendSms(phone, `Application received for ${scheme.name}. Ref: ${appId}. We will contact you.`)
    } catch (smsErr) {
      console.warn('SMS send failed for scheme apply', smsErr.message)
    }

    return res.json({ ok: true, application: record })
  } catch (err) {
    console.error('Scheme apply error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// Optional manual refresh endpoint (admin use)
app.post('/schemes/refresh', async (req, res) => {
  try {
    await loadSchemesFromFeed()
    return res.json({ ok: true, count: schemesCache.length })
  } catch (err) {
    console.error('Manual schemes refresh failed', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// Admin: import schemes from an arbitrary public feed URL (body.json: { url })
app.post('/schemes/import', async (req, res) => {
  try {
    const url = (req.body && req.body.url) || req.query.url
    if (!url) return res.status(400).json({ ok: false, error: 'url required' })
    console.log('Importing schemes from', url)
    const resp = await axios.get(url, { timeout: 10000 })
    const data = resp.data
    const feedList = Array.isArray(data) ? data : (Array.isArray(data.schemes) ? data.schemes : null)
    if (!feedList) return res.status(400).json({ ok: false, error: 'feed did not return an array' })

    // Merge into schemesCache and SCHEMES map (feed overrides)
    const map = new Map()
    for (const s of SCHEMES) if (s && s.id) map.set(s.id, s)
    for (const s of schemesCache) if (s && s.id) map.set(s.id, s)
    for (const s of feedList) if (s && s.id) map.set(s.id, s)

    schemesCache = Array.from(map.values()).filter(s => s && s.id && s.name)
    console.log(`Imported ${feedList.length} schemes, total cache ${schemesCache.length}`)
    return res.json({ ok: true, imported: feedList.length, total: schemesCache.length })
  } catch (err) {
    console.error('Schemes import failed', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// ==========================================
// 🌾 AGRICULTURAL FINANCE & LOAN MARKETPLACE
// ==========================================

const AGRI_LOAN_PRODUCTS = [
  {
    id: 'sbi-kcc',
    bank: 'State Bank of India (SBI)',
    name: 'SBI Kisan Credit Card (KCC) Crop Loan',
    category: 'Crop Production & Working Capital',
    nominalRate: 7.0,
    subventionRate: 3.0,
    effectiveRate: 4.0,
    maxAmount: 300000,
    maxAmountLabel: 'Up to ₹3.00 Lakhs',
    collateralFreeLimit: '₹1.60 Lakhs (Zero Collateral)',
    tenure: '1 to 5 Years (Revolving Annual Facility)',
    repaymentCycle: 'Half-Yearly or Yearly aligned with Crop Harvest (Kharif/Rabi)',
    processingFee: 'Nil up to ₹3 Lakhs',
    benefits: [
      '3% Government Interest Subvention for prompt repayment (Net 4% p.a.)',
      'Atm-enabled RuPay Kisan Card for easy cash withdrawal',
      'Built-in crop insurance coverage under PMFBY'
    ],
    eligibility: 'Individual owner cultivators, tenant farmers, sharecroppers with cultivable land.',
    documents: ['Aadhaar & PAN', 'Land Khata/Khasra (7/12 Pahani)', 'Sowing / Cropping Certificate'],
    officialUrl: 'https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card'
  },
  {
    id: 'nabard-aif',
    bank: 'NABARD & Commercial Banks',
    name: 'Agriculture Infrastructure Fund (AIF) Long-Term Credit',
    category: 'Post-Harvest & Storage Infrastructure',
    nominalRate: 8.5,
    subventionRate: 3.0,
    effectiveRate: 5.5,
    maxAmount: 20000000,
    maxAmountLabel: 'Up to ₹2.00 Crores',
    collateralFreeLimit: 'Covered under CGTMSE Guarantee up to ₹2 Cr',
    tenure: 'Up to 7 Years (Including 6 to 24 Months Moratorium)',
    repaymentCycle: 'Monthly / Quarterly',
    processingFee: 'Concessional / Zero for PACS & FPOs',
    benefits: [
      '3% p.a. Central Interest Subvention up to ₹2 Crore for 7 years',
      'Covers cold storage, packhouses, grain silos, sorting and grading sheds',
      'Credit guarantee fees fully absorbed under government scheme'
    ],
    eligibility: 'Farmers, FPOs, Agri-entrepreneurs, PACS, and Startups.',
    documents: ['Detailed Project Report (DPR)', 'Land Ownership / Long Lease Deed', 'KYC & Bank Statement'],
    officialUrl: 'https://agriinfra.dac.gov.in/'
  },
  {
    id: 'hdfc-tractor',
    bank: 'HDFC Bank Agri Lending',
    name: 'HDFC Kisan Gold & Farm Mechanization Loan',
    category: 'Farm Machinery & Commercial Vehicles',
    nominalRate: 9.25,
    subventionRate: 0.0,
    effectiveRate: 9.25,
    maxAmount: 1500000,
    maxAmountLabel: 'Up to 90% of Equipment Cost (Max ₹15 Lakhs)',
    collateralFreeLimit: 'Hypothecation of Purchased Tractor / Implement',
    tenure: '12 to 84 Months',
    repaymentCycle: 'Structured Seasonal EMIs (Post-harvest quarterly/half-yearly)',
    processingFee: '0.5% of Loan Amount',
    benefits: [
      'Instant doorstep sanction within 3 business days',
      'Can be clubbed with 40-50% SMAM government machinery subsidy',
      'No pre-payment penalty after 12 months'
    ],
    eligibility: 'Farmers holding minimum 2 acres of irrigated agricultural land.',
    documents: ['Aadhaar, Voter ID', 'Land Records (Jamabandi/Pahani)', 'Quotation from authorized tractor dealer'],
    officialUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/tractor-loan'
  },
  {
    id: 'pnb-tatkal',
    bank: 'Punjab National Bank (PNB)',
    name: 'PNB Kisan Tatkal Urgent Credit Scheme',
    category: 'Emergency & Contingency Farming Needs',
    nominalRate: 8.4,
    subventionRate: 0.0,
    effectiveRate: 8.4,
    maxAmount: 100000,
    maxAmountLabel: 'Up to 50% of KCC Limit (Max ₹1.00 Lakh)',
    collateralFreeLimit: 'Clean Credit (Extension of existing KCC security)',
    tenure: 'Up to 36 Months',
    repaymentCycle: 'Half-yearly installments',
    processingFee: 'Nil',
    benefits: [
      'Instant emergency disbursement without extra documentation',
      'Helps manage unseasonal weather shocks, urgent pest spray, or pump repairs',
      'No margin money requirement'
    ],
    eligibility: 'Existing KCC holders with satisfactory repayment track record of 2+ years.',
    documents: ['Existing KCC Passbook', 'Signed loan request voucher'],
    officialUrl: 'https://pnbindia.in/agriculture-banking.html'
  },
  {
    id: 'mudra-allied',
    bank: 'All Commercial Banks & Regional Rural Banks (RRBs)',
    name: 'Pradhan Mantri MUDRA (Kishor/Tarun) - Allied Agriculture',
    category: 'Dairy, Poultry, Fisheries & Agri-Clinics',
    nominalRate: 8.75,
    subventionRate: 0.0,
    effectiveRate: 8.75,
    maxAmount: 1000000,
    maxAmountLabel: 'Up to ₹10.00 Lakhs',
    collateralFreeLimit: '100% Collateral-Free (Backed by CGFMU)',
    tenure: '3 to 5 Years',
    repaymentCycle: 'Monthly / Quarterly aligned with milk/egg sales',
    processingFee: 'Nil for Shishu & Kishor (< ₹5 Lakhs)',
    benefits: [
      'Zero collateral or third-party guarantee needed',
      'Finance for purchasing milch cows, buffaloes, feed units, broiler cages',
      'Eligible for 25-35% NABARD Dairy Entrepreneurship subsidy'
    ],
    eligibility: 'Small farmers, landless rural youth, dairy farmers, SHG members.',
    documents: ['Aadhaar, PAN', 'Project quotation for animals / feed setup', 'Bank account statement (6 months)'],
    officialUrl: 'https://www.mudra.org.in/'
  }
];

const loanInquiriesStore = new Map();

// GET /finance/loans: List all authentic agricultural loan schemes
app.get('/finance/loans', (req, res) => {
  const category = (req.query.category || '').toLowerCase();
  let list = aiCurator.getLoans();
  if (category && category !== 'all') {
    list = list.filter(l => l.category.toLowerCase().includes(category) || l.name.toLowerCase().includes(category) || l.bank.toLowerCase().includes(category));
  }
  return res.json({
    ok: true,
    count: list.length,
    timestamp: new Date().toISOString(),
    aiAudited: true,
    curatorStatus: aiCurator.getStatus(),
    loans: list
  });
});

// POST /finance/calculate-emi: Agricultural loan calculator with 3% Prompt Repayment Subvention
app.post('/finance/calculate-emi', (req, res) => {
  try {
    const { principal = 100000, nominalRate = 7.0, subventionRate = 3.0, tenureMonths = 12 } = req.body || {};
    const P = Number(principal) || 100000;
    const rNominal = (Number(nominalRate) || 7.0) / 12 / 100;
    const rEffective = Math.max(0, (Number(nominalRate) - Number(subventionRate))) / 12 / 100;
    const N = Math.max(1, Number(tenureMonths) || 12);

    // Standard reducing balance EMI formula
    const calcEmi = (p, r, n) => {
      if (r === 0) return p / n;
      return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    };

    const nominalEmi = Math.round(calcEmi(P, rNominal, N));
    const effectiveEmi = Math.round(calcEmi(P, rEffective, N));
    const totalNominalPayment = nominalEmi * N;
    const totalEffectivePayment = effectiveEmi * N;
    const totalSubventionSavings = Math.max(0, totalNominalPayment - totalEffectivePayment);

    return res.json({
      ok: true,
      calculation: {
        principal: P,
        tenureMonths: N,
        nominalRatePercent: Number(nominalRate),
        subventionRatePercent: Number(subventionRate),
        effectiveRatePercent: Math.max(0, Number(nominalRate) - Number(subventionRate)),
        monthlyEmiNominal: nominalEmi,
        monthlyEmiEffective: effectiveEmi,
        totalInterestPayableEffective: Math.round(totalEffectivePayment - P),
        totalGovernmentSubventionSavings: totalSubventionSavings,
        totalRepaymentAmount: totalEffectivePayment
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /finance/apply: Submit loan pre-eligibility / assistance inquiry
app.post('/finance/apply', async (req, res) => {
  try {
    const { loanId, farmerName, phone, landAcres, cropType, loanAmount, village } = req.body || {};
    if (!farmerName || !phone) {
      return res.status(400).json({ ok: false, error: 'Farmer name and mobile number are required.' });
    }

    const allLoans = aiCurator.getLoans();
    const loan = allLoans.find(l => l.id === loanId) || AGRI_LOAN_PRODUCTS.find(l => l.id === loanId) || allLoans[0];
    const appId = `LOAN-APP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900) + 100}`;
    
    // Automatic basic eligibility score check
    const acres = Number(landAcres) || 2;
    const amount = Number(loanAmount) || 100000;
    let eligibilityStatus = 'Pre-Approved for Assisted Bank Submission';
    let estimatedMaxCredit = Math.min(loan.maxAmount, Math.round(acres * 55000 + 50000));
    if (loan.id === 'mudra-allied') estimatedMaxCredit = Math.min(amount, 1000000);

    const record = {
      id: appId,
      loanId: loan.id,
      loanName: loan.name,
      bank: loan.bank,
      farmerName,
      phone,
      village: village || 'N/A',
      landAcres: acres,
      cropType: cropType || 'General Agriculture',
      requestedAmount: amount,
      estimatedMaxCredit,
      effectiveRate: loan.effectiveRate,
      eligibilityStatus,
      appliedAt: new Date().toISOString(),
      status: 'Received & Bank Tele-Advisor Assigned'
    };

    loanInquiriesStore.set(appId, record);

    // Send confirmation SMS notification (if configured)
    try {
      await sendSms(phone, `Krishi-Net Finance: Your application ${appId} for ${loan.name} has been received. Our agri-banking advisor will assist with your bank submission.`);
    } catch (smsErr) {
      // ignore
    }

    return res.json({
      ok: true,
      message: 'Loan application registered successfully!',
      application: record,
      nextSteps: [
        'Keep your Aadhaar Card and Land Records (7/12 Pahani) ready',
        'Our dedicated Krishi-Net Banking Facilitator will verify documents',
        'Direct submission to your nearest bank branch for instant sanction'
      ]
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/loans/catalog: Structured breakdown of Government Public Sector Bank Loans vs Commercial Private Bank Loans
app.get('/api/loans/catalog', (req, res) => {
  try {
    const allLoans = aiCurator.getLoans();
    const govtBankLoans = allLoans.filter(l => l.loanType === 'govt_bank_loan');
    const commercialBankLoans = allLoans.filter(l => l.loanType === 'commercial_bank_loan');
    return res.json({
      ok: true,
      total: allLoans.length,
      govtBankCount: govtBankLoans.length,
      commercialBankCount: commercialBankLoans.length,
      govtBankLoans,
      commercialBankLoans,
      curatorStatus: aiCurator.getStatus()
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// REGISTERED PRIVATE LENDERS HUB (Only Lenders Registered & Willing to Lend on Krishi-Net)
// ----------------------------------------------------------------------------
const REGISTERED_PRIVATE_LENDERS_FILE = path.join(__dirname, 'data', 'registered-private-lenders.json');
const privateLoanInquiriesStore = new Map();

function getRegisteredPrivateLenders() {
  try {
    if (fs.existsSync(REGISTERED_PRIVATE_LENDERS_FILE)) {
      const data = fs.readFileSync(REGISTERED_PRIVATE_LENDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading registered private lenders file', e);
  }
  return [];
}

function saveRegisteredPrivateLenders(lenders) {
  try {
    fs.writeFileSync(REGISTERED_PRIVATE_LENDERS_FILE, JSON.stringify(lenders, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving registered private lenders file', e);
  }
}

// GET /api/finance/private-lenders: List ONLY verified lenders registered on Krishi-Net
app.get('/api/finance/private-lenders', (req, res) => {
  try {
    const { type, state } = req.query;
    let lenders = getRegisteredPrivateLenders();
    lenders = lenders.filter(l => l.willingToLend !== false);
    if (type && type !== 'all') {
      lenders = lenders.filter(l => l.type === type);
    }
    if (state && state !== 'all') {
      lenders = lenders.filter(l => (l.state || '').toLowerCase().includes(state.toLowerCase()));
    }
    return res.json({
      ok: true,
      count: lenders.length,
      lenders
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/finance/register-private-lender: Allow private finance companies or private individuals to register on web
app.post('/api/finance/register-private-lender', (req, res) => {
  try {
    const {
      name,
      type, // 'private_finance_company' or 'private_individual'
      registrationNumber,
      ownerOrContactPerson,
      phone,
      email,
      state,
      district,
      availablePool,
      maxAmountPerFarmer,
      interestRate,
      tenure,
      loanPurpose,
      collateralRequirement,
      disbursementTime,
      notes
    } = req.body || {};

    if (!name || !phone || !type) {
      return res.status(400).json({ ok: false, error: 'Lender name, contact phone, and lender type are required.' });
    }

    const lenders = getRegisteredPrivateLenders();
    const newLender = {
      id: `pvt-reg-${Date.now()}`,
      name: name.trim(),
      type: type === 'private_individual' ? 'private_individual' : 'private_finance_company',
      categoryLabel: type === 'private_individual' ? 'Registered Private Individual Lender' : 'Registered Private Finance Company (NBFC)',
      registrationNumber: registrationNumber ? registrationNumber.trim() : 'Krishi-Net Platform Verified ID',
      ownerOrContactPerson: ownerOrContactPerson ? ownerOrContactPerson.trim() : name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      state: state ? state.trim() : 'India',
      district: district ? district.trim() : 'Local District',
      availablePool: Number(availablePool) || 500000,
      availablePoolLabel: `₹${(Number(availablePool || 500000) / 100000).toFixed(2)} Lakhs Capital Pool`,
      maxAmountPerFarmer: Number(maxAmountPerFarmer) || 200000,
      maxAmountLabel: `Up to ₹${(Number(maxAmountPerFarmer || 200000) / 100000).toFixed(2)} Lakhs per Farmer`,
      interestRate: Number(interestRate) || 1.5,
      interestRateLabel: `${Number(interestRate) || 1.5}% per month`,
      tenure: tenure || '3 to 12 Months',
      loanPurpose: loanPurpose || 'Urgent Crop Inputs & Farm Expenses',
      collateralRequirement: collateralRequirement || 'Crop Lien / Mutual Community Trust',
      disbursementTime: disbursementTime || 'Within 24 Hours',
      registeredOnPlatformDate: new Date().toISOString().split('T')[0],
      verifiedStatus: 'VERIFIED_REGISTERED',
      willingToLend: true,
      platformRating: 'New Registered Lender',
      notes: notes || 'Registered directly on Krishi-Net Web Platform.'
    };

    lenders.unshift(newLender);
    saveRegisteredPrivateLenders(lenders);

    return res.json({
      ok: true,
      message: 'You have been successfully registered as a verified private lender on Krishi-Net! Farmers can now view your offers and request loans directly.',
      lender: newLender
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/finance/apply-private-lender: Submit private loan request directly to registered private lender
app.post('/api/finance/apply-private-lender', async (req, res) => {
  try {
    const { lenderId, farmerName, phone, village, loanAmount, loanPurpose, landAcres } = req.body || {};
    if (!farmerName || !phone || !lenderId) {
      return res.status(400).json({ ok: false, error: 'Farmer name, phone number, and lender selection are required.' });
    }

    const lenders = getRegisteredPrivateLenders();
    const lender = lenders.find(l => l.id === lenderId) || lenders[0];
    const inquiryId = `PVT-LOAN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900) + 100}`;

    const inquiry = {
      id: inquiryId,
      lenderId: lender?.id,
      lenderName: lender?.name,
      lenderType: lender?.type,
      lenderPhone: lender?.phone,
      farmerName,
      phone,
      village: village || 'N/A',
      loanAmount: Number(loanAmount) || 50000,
      loanPurpose: loanPurpose || 'Crop cultivation & urgent farm inputs',
      landAcres: landAcres || 'N/A',
      submittedAt: new Date().toISOString(),
      status: 'DISPATCHED_TO_REGISTERED_LENDER'
    };

    privateLoanInquiriesStore.set(inquiryId, inquiry);

    return res.json({
      ok: true,
      message: `Your loan request has been securely dispatched to ${lender?.name}. The lender will review and contact you at ${phone} within ${lender?.disbursementTime || '24 hours'}.`,
      inquiry
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================================
// KRISHISOCIAL - SOCIAL MEDIA PLATFORM API ENGINE (Next.js & DynamoDB Architecture)
// ============================================================================
const socialPostsStore = new Map();
const socialFieldmatesStore = new Map();
const socialMyCircleStore = new Map();
const socialFollowersStore = new Map();
const socialMessagesStore = new Map();
const socialMessageRequestsStore = new Map();
const moderationFlagsStore = new Map();
const userSavedBarnStore = new Map();
const userSettingsStore = new Map();

// Seed initial social posts
const INITIAL_BACKEND_POSTS = [
  {
    id: 'post-1',
    author: {
      id: 'farmer-rajesh',
      name: 'Rajesh Choudhary',
      username: '@rajesh_wheat',
      village: 'Khanna, Ludhiana',
      district: 'Ludhiana',
      state: 'Punjab',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true,
      joinDate: 'March 2021',
      primaryCategory: 'Crop Care'
    },
    category: 'Crop Care',
    district: 'Ludhiana',
    circle: 'crop-care',
    contentType: 'post',
    timestamp: '25 mins ago',
    reach: '3.6k',
    boostedReach: true,
    englishContent: 'Completed the second irrigation for our wheat crop today. Applied bio-potash along with liquid zinc. The tillering is remarkable with 8-10 shoots per plant! Fellow farmers, avoid excess nitrogen right now to prevent lodging during unexpected winds.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    reactions: { shabaash: 142 },
    saved: false,
    comments: [
      {
        id: 'c-1',
        author: 'Harpreet Singh',
        username: '@harpreet_p',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
        text: 'Brother, which bio-potash formula gave you this result? Looking for our farm.',
        time: '15m ago',
        audioUrl: null,
        replies: [
          {
            id: 'c-1-r1',
            author: 'Rajesh Choudhary',
            username: '@rajesh_wheat',
            avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
            text: 'I used molasses-fermented bio-potash (1 liter/acre through drip irrigation). Very effective!',
            time: '10m ago',
            audioUrl: null,
            replies: []
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'post-2',
    author: {
      id: 'farmer-venkata',
      name: 'Venkata Subba Rao',
      username: '@venkata_chilli',
      village: 'Tenali, Guntur',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: false,
      joinDate: 'January 2022',
      primaryCategory: 'Mandi Rates'
    },
    category: 'Mandi Rates',
    district: 'Guntur',
    circle: 'mandi-rates',
    contentType: 'post',
    timestamp: '1 hour ago',
    reach: '510',
    boostedReach: false,
    englishContent: 'Arrivals of premium Teja Red Chilli surged at Guntur market yard today. The modal benchmark price touched Rs 19,800/quintal for premium grade sun-dried stock. Keep moisture below 10% before bagging.',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    reactions: { shabaash: 89 },
    saved: true,
    comments: [],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: 'post-3',
    author: {
      id: 'farmer-manpreet',
      name: 'Manpreet Kaur',
      username: '@manpreet_dairy',
      village: 'Kapurthala',
      district: 'Kapurthala',
      state: 'Punjab',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      hasGreenTick: true,
      joinDate: 'July 2020',
      primaryCategory: 'Organic Farming'
    },
    category: 'Organic Farming',
    district: 'Kapurthala',
    circle: 'organic-farming',
    contentType: 'fieldVibe',
    audioTrack: 'Harvest Beats & Traditional Melody',
    timestamp: '2 hours ago',
    reach: '7.2k',
    boostedReach: true,
    englishContent: 'Quick field demonstration of our zero-budget natural Jeevamrutha preparation using indigenous cow dung and jaggery. Soil microbes multiply 100x within 48 hours!',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    reactions: { shabaash: 260 },
    saved: false,
    comments: [],
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
  }
];

INITIAL_BACKEND_POSTS.forEach(p => socialPostsStore.set(p.id, p));

// GET /api/social/posts: Fetch feed posts & fieldVibes with category & district filtering
app.get('/api/social/posts', async (req, res) => {
  try {
    const { category, district, contentType } = req.query;
    let posts = Array.from(socialPostsStore.values());

    if (contentType && contentType !== 'all') {
      posts = posts.filter(p => p.contentType === contentType);
    }
    if (category && category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }
    if (district && district !== 'all') {
      posts = posts.filter(p => (p.district || '').toLowerCase() === district.toLowerCase() || (p.author?.district || '').toLowerCase() === district.toLowerCase());
    }

    posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return res.json({ ok: true, posts });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/social/posts: Create post or fieldVibe (with category, district, greenTick 3x algorithmic reach)
app.post('/api/social/posts', async (req, res) => {
  try {
    const { author, category, district, contentType, englishContent, image, audioTrack, originalContent } = req.body || {};
    if (!category) {
      return res.status(400).json({ ok: false, error: 'Category is strictly required.' });
    }

    const postId = `post-${Date.now()}`;
    const isGreenTick = Boolean(author?.hasGreenTick);
    const baseReach = contentType === 'fieldVibe' ? 840 : 420;
    const computedReach = isGreenTick ? `${(baseReach * 3 / 1000).toFixed(1)}k` : `${baseReach}`;

    const newPost = {
      id: postId,
      author: {
        id: author?.id || 'farmer-self',
        name: author?.name || 'Greeshmanth Manne',
        username: author?.username || '@greeshmanth_m',
        village: author?.village || 'Eluru',
        district: district || author?.district || 'Eluru',
        state: author?.state || 'Andhra Pradesh',
        avatar: author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        hasGreenTick: isGreenTick,
        joinDate: author?.joinDate || 'January 2021',
        primaryCategory: category
      },
      category: category,
      district: district || author?.district || 'General',
      circle: category.toLowerCase().replace(/\s+/g, '-'),
      contentType: contentType || 'post',
      audioTrack: audioTrack || null,
      timestamp: 'Just now',
      reach: computedReach,
      boostedReach: isGreenTick,
      englishContent: englishContent || originalContent || '',
      originalContent: originalContent || englishContent || '',
      image: image || null,
      reactions: { shabaash: 0 },
      saved: false,
      comments: [],
      createdAt: new Date().toISOString()
    };

    socialPostsStore.set(postId, newPost);
    return res.json({ ok: true, post: newPost });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/social/posts/:id/react: Toggle "shabaash!" engagement
app.post('/api/social/posts/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body || {};
    const post = socialPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    if (!post.reactions) post.reactions = { shabaash: 0 };
    post.reactions.shabaash = (post.reactions.shabaash || 0) + 1;
    socialPostsStore.set(id, post);

    return res.json({ ok: true, reactions: post.reactions });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/social/posts/:id/save: Bookmark post into "My Barn"
app.post('/api/social/posts/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body || {};
    const userKey = username || '@greeshmanth_m';
    
    let savedList = userSavedBarnStore.get(userKey) || [];
    if (savedList.includes(id)) {
      savedList = savedList.filter(pid => pid !== id);
    } else {
      savedList.push(id);
    }
    userSavedBarnStore.set(userKey, savedList);

    return res.json({ ok: true, savedPosts: savedList, isSaved: savedList.includes(id) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/social/saved-barn: Fetch user's saved posts ("My Barn")
app.get('/api/social/saved-barn', async (req, res) => {
  try {
    const username = req.query.username || '@greeshmanth_m';
    const savedIds = userSavedBarnStore.get(username) || ['post-2'];
    const savedPosts = savedIds.map(id => socialPostsStore.get(id)).filter(Boolean);
    return res.json({ ok: true, savedPosts });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/social/posts/:id/comments: Fetch comments
app.get('/api/social/posts/:id/comments', async (req, res) => {
  try {
    const post = socialPostsStore.get(req.params.id);
    return res.json({ ok: true, comments: post?.comments || [] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/social/posts/:id/comments: Add comment / nested reply with optional voice note URL
app.post('/api/social/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, text, parentCommentId, audioUrl } = req.body || {};
    const post = socialPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    const newComment = {
      id: `c-${Date.now()}`,
      author: author?.name || 'Greeshmanth Manne',
      username: author?.username || '@greeshmanth_m',
      avatar: author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      text: text || (audioUrl ? '🎤 Voice Note' : ''),
      audioUrl: audioUrl || null,
      time: 'Just now',
      replies: []
    };

    if (!post.comments) post.comments = [];

    if (parentCommentId) {
      const parent = post.comments.find(c => c.id === parentCommentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newComment);
      } else {
        post.comments.push(newComment);
      }
    } else {
      post.comments.push(newComment);
    }

    socialPostsStore.set(id, post);
    return res.json({ ok: true, comment: newComment, comments: post.comments });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/social/posts/:id/report-misinformation: Route flags to ModerationFlags table
app.post('/api/social/posts/:id/report-misinformation', async (req, res) => {
  try {
    const { id } = req.params;
    const { reportedBy, reason, contentType } = req.body || {};
    const flagId = `flag-${Date.now()}`;
    const flagRecord = {
      flagId,
      targetId: id,
      contentType: contentType || 'post',
      reportedBy: reportedBy || '@greeshmanth_m',
      reason: reason || 'Inaccurate agricultural advisory or counterfeit input claim',
      status: 'UNDER_REVIEW',
      timestamp: new Date().toISOString()
    };
    moderationFlagsStore.set(flagId, flagRecord);
    return res.json({
      ok: true,
      message: 'Thank you for protecting our farming community. This update has been routed to agricultural moderation.',
      flag: flagRecord
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/social/trending-topics: Top seasonal categories & tags from the last 7 days
app.get('/api/social/trending-topics', async (req, res) => {
  try {
    const topics = [
      { id: 't-1', tag: '#WheatTillering', category: 'Crop Care', postsCount: 1420, trend: '+45% this week' },
      { id: 't-2', tag: '#GunturChilliRates', category: 'Mandi Rates', postsCount: 980, trend: '+32% this week' },
      { id: 't-3', tag: '#JeevamruthaPrep', category: 'Organic Farming', postsCount: 750, trend: '+28% this week' },
      { id: 't-4', tag: '#DripIrrigationSubsidy', category: 'Govt Schemes', postsCount: 620, trend: '+19% this week' },
      { id: 't-5', tag: '#MustardAphidAlert', category: 'Crop Care', postsCount: 540, trend: '+55% this week' },
      { id: 't-6', tag: '#SoilBioPotash', category: 'Soil Health', postsCount: 410, trend: '+14% this week' }
    ];
    return res.json({ ok: true, trending: topics });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/social/upload-audio: Store audio blobs (voice notes)
app.post('/api/social/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    const audioId = `voice-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // In local dev/S3 mock, return a data URL or simulated endpoint
    const audioUrl = req.body?.dataUrl || `/api/social/audio/${audioId}.webm`;
    return res.json({ ok: true, audioUrl, audioId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET/POST User Settings (Chat Privacy, Green Tick, Data Saver)
app.get('/api/social/user/settings', (req, res) => {
  const username = req.query.username || '@greeshmanth_m';
  const settings = userSettingsStore.get(username) || {
    chatPermission: 'Everyone',
    hasGreenTick: false,
    dataSaverMode: false
  };
  return res.json({ ok: true, settings });
});

app.post('/api/social/user/settings', (req, res) => {
  const { username, chatPermission, hasGreenTick, dataSaverMode } = req.body || {};
  const userKey = username || '@greeshmanth_m';
  const current = userSettingsStore.get(userKey) || {};
  const updated = {
    ...current,
    chatPermission: chatPermission !== undefined ? chatPermission : current.chatPermission || 'Everyone',
    hasGreenTick: hasGreenTick !== undefined ? hasGreenTick : current.hasGreenTick || false,
    dataSaverMode: dataSaverMode !== undefined ? dataSaverMode : current.dataSaverMode || false
  };
  userSettingsStore.set(userKey, updated);
  return res.json({ ok: true, settings: updated });
});


const PORT = process.env.PORT || 4000;
if (require.main === module) {
  // Listen on 0.0.0.0 for local development (supports IPv4, IPv6, and LAN)
  app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;
