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
const twilio = require('twilio');
const redis = require('redis');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

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
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    client.on('error', (err) => console.warn('Redis not available, using in-memory storage'));
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

// Amazon Procurement Rates (Mock) - Returns structured data for the frontend table
app.get('/amazon-rates', authenticateToken, async (req, res) => {
  // Try fetching from DynamoDB if table is configured
  if (process.env.RATES_TABLE) {
    try {
      const data = await docClient.send(new ScanCommand({ TableName: process.env.RATES_TABLE }));
      if (data.Items && data.Items.length > 0) {
        return res.json({ 
          rates: data.Items, 
          terms: ["Farm-gate pickup (No transport cost)", "Payment within 24 hours", "No commission/middlemen"] 
        });
      }
    } catch (err) {
      console.error('Failed to fetch rates from DynamoDB, falling back to mock:', err.message);
    }
  }

  const fallbackRates = [
    { crop: 'Wheat (Grade A)', price: 2450, unit: 'qtl', note: 'Premium over Mandi' },
    { crop: 'Rice (Basmati)', price: 4500, unit: 'qtl', note: 'Export quality' },
    { crop: 'Cotton', price: 6200, unit: 'qtl', note: 'Long staple' },
    { crop: 'Turmeric', price: 7500, unit: 'qtl', note: 'High curcumin' },
    { crop: 'Soybeans', price: 4300, unit: 'qtl', note: 'Oil grade' }
  ]
  res.json({ 
    rates: fallbackRates, 
    terms: [
      "Farm-gate pickup (No transport cost)",
      "Payment within 24 hours",
      "No commission/middlemen"
    ]
  })
})

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
  // Try local file storage first
  if (usersCache[phone]) {
    return usersCache[phone];
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
  const { phone, name, village } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // Add country code if not present (default to +91 for India)
  const phoneWithCode = phone.startsWith('+') ? phone : `+91${phone}`;

  const existingUser = await getUserByPhone(phone);
  if (existingUser) return res.status(400).json({ error: 'User with this phone number already exists' });

  // Store user data with 10 minute (600s) expiration
  await setOTP(phone, {
    type: 'registration',
    userData: { name: name || '', village: village || '' }
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
    userData: { name: name || '', village: village || '' }
  }, 600);

  // Send OTP via SMS (fallback)
  const smsResult = await sendSms(phone, `Your registration OTP for Krishi-Net is: ${otp}`);

  if (!smsResult.success) {
    console.error('SMS send failed, but allowing registration to proceed for demo');
  }

  console.log(`Registration OTP for ${phone} is ${otp} (for testing)`);
  res.json({ success: true, message: 'OTP sent to your phone number for verification.' });
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
  const token = jwt.sign({ phone: newUser.phone, name: newUser.name, village: newUser.village }, LOCAL_JWT_SECRET, { expiresIn: '30d' });
  
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
  res.json({ success: true, message: 'OTP sent to your phone number for login.' });
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

// Step 1 for Login: Request OTP (LEGACY - kept for backward compatibility)
app.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // If password is provided, use password-based login
  if (password) {
    const user = await getUserByPhone(phone);
    if (!user) return res.status(404).json({ error: 'User not found. Please register first.' });
    
    // For demo, accept any password. In production, hash and compare passwords
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
  res.json({ success: true, message: 'OTP sent to your phone number for login.' });
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

// Community News: live farmer/agriculture news (India)
app.get('/community-news', async (req, res) => {
  const maxItems = Math.min(Math.max(Number(req.query.limit) || 20, 5), 50)
  const feeds = [
    {
      url: 'https://news.google.com/rss/search?q=Indian+farmers+agriculture+India&hl=en-IN&gl=IN&ceid=IN:en',
      label: 'Google News India'
    },
    {
      url: 'https://news.google.com/rss/search?q=India+farming+policy+crop+news&hl=en-IN&gl=IN&ceid=IN:en',
      label: 'Google News India'
    }
  ]

  try {
    const responses = await Promise.allSettled(
      feeds.map(feed => axios.get(feed.url, { timeout: 10000 }).then(resp => ({ feed, xml: resp.data })))
    )

    const collected = []
    for (const result of responses) {
      if (result.status !== 'fulfilled') continue
      const parsed = parseRssItems(result.value.xml, result.value.feed.label)
      collected.push(...parsed)
    }

    const dedupedMap = new Map()
    for (const item of collected) {
      if (!dedupedMap.has(item.url)) dedupedMap.set(item.url, item)
    }

    const news = Array.from(dedupedMap.values())
      .sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return bTime - aTime
      })
      .slice(0, maxItems)

    if (news.length === 0) {
      return res.status(503).json({ error: 'No live news available right now. Please try again shortly.' })
    }

    return res.json({
      news,
      source: 'google-news-rss',
      fetchedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('Failed to fetch community news:', err.message)
    return res.status(500).json({ error: 'Failed to fetch community news' })
  }
})

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

// Live mandi prices (demo/mock). If MANDI_API_URL set, you can fetch from there.
app.get('/prices', async (req, res) => {
  try {
    const crop = (req.query.crop || 'wheat').toLowerCase();
    // If an external API is provided via env, forward request
    if (process.env.MANDI_API_URL) {
      // Implement forwarding to real API here
      return res.json({ source: 'external', url: process.env.MANDI_API_URL, crop });
    }

    // Mock price generator (INR per quintal) with simple randomness
    const basePrices = { wheat: 2200, rice: 2600, sugarcane: 350, maize: 1800 };
    const base = basePrices[crop] || 1500;
    const fluct = Math.round((Math.random() - 0.5) * base * 0.08);
    const price = base + fluct;
    const timestamp = new Date().toISOString();
    res.json({ crop, price, unit: 'INR/qtl', ts: timestamp, source: 'mock' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Public proxy for Amazon rates (keeps API key server-side)
app.get('/amazon-rates/public', async (req, res) => {
  try {
    // If an external API URL is configured, proxy the request
    const external = process.env.AMAZON_RATES_API_URL
    let apiKey = process.env.AMAZON_API_KEY
    const headerName = process.env.AMAZON_API_KEY_HEADER || 'x-amazon-api-key'

    // If apiKey is not present in env, try Secrets Manager (optional)
    const apiKeySecret = process.env.AMAZON_API_KEY_SECRET_ARN || process.env.AMAZON_API_KEY_SECRET_NAME
    if (!apiKey && apiKeySecret) {
      try {
        const sec = await secretsClient.send(new GetSecretValueCommand({ SecretId: apiKeySecret }))
        if (sec.SecretString) {
          try {
            const parsed = JSON.parse(sec.SecretString)
            // support secret as JSON with key named amazon_api_key or api_key
            apiKey = parsed.amazon_api_key || parsed.api_key || parsed.AMAZON_API_KEY || parsed.key || apiKey
          } catch (e) {
            apiKey = sec.SecretString
          }
        }
      } catch (e) {
        console.error('Could not retrieve Amazon API key from Secrets Manager:', e.message)
      }
    }

    if (external) {
      try {
        const headers = {}
        if (apiKey) headers[headerName] = apiKey
        // Forward query params (e.g., crop, all=true)
        const resp = await axios.get(external, { params: req.query, headers, timeout: 10000 })
        // Return proxied response directly
        return res.json(resp.data)
      } catch (err) {
        console.error('Failed to proxy to external Amazon rates API:', err.message)
        // fall through to fallback
      }
    }

    // Fallback mock (same structure as existing /amazon-rates)
    const fallbackRates = [
      { crop: 'Wheat (Grade A)', price: 2450, unit: 'qtl', note: 'Premium over Mandi' },
      { crop: 'Rice (Basmati)', price: 4500, unit: 'qtl', note: 'Export quality' },
      { crop: 'Cotton', price: 6200, unit: 'qtl', note: 'Long staple' },
      { crop: 'Turmeric', price: 7500, unit: 'qtl', note: 'High curcumin' },
      { crop: 'Soybeans', price: 4300, unit: 'qtl', note: 'Oil grade' }
    ]
    return res.json({ rates: fallbackRates, terms: [
      "Farm-gate pickup (No transport cost)",
      "Payment within 24 hours",
      "No commission/middlemen"
    ] })
  } catch (err) {
    console.error('Public amazon-rates error', err)
    res.status(500).json({ error: err.message })
  }
})

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

    let lat = queryLat
    let lon = queryLon

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

// --- NEW: Market prices and SMS mock endpoints ---
// Return mock market prices for requested crop and location
app.get('/market/prices', async (req, res) => {
  try {
    const crop = (req.query.crop || 'wheat').toLowerCase()
    const location = req.query.location || 'local mandi'
    // Simple mock dataset (replace with real provider integration)
    const sample = {
      wheat: { price_qtl: 2200, unit: 'qtl', change_7d: -1.2 },
      rice: { price_qtl: 2600, unit: 'qtl', change_7d: 0.8 },
      maize: { price_qtl: 1850, unit: 'qtl', change_7d: -0.5 },
      cotton: { price_qtl: 6000, unit: 'qtl', change_7d: 2.3 },
      onion: { price_qtl: 1500, unit: 'qtl', change_7d: -3.1 }
    }

    const data = sample[crop] || { price_qtl: 1200, unit: 'qtl', change_7d: 0 }

    return res.json({ ok: true, crop, location, price: data, ts: Date.now() })
  } catch (err) {
    console.error('Market prices endpoint error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// Simple trends endpoint returning mock history
app.get('/market/prices/trends', async (req, res) => {
  try {
    const crop = (req.query.crop || 'wheat').toLowerCase()
    const now = Date.now()
    // generate 14 days of mock prices
    const points = Array.from({ length: 14 }).map((_, i) => ({
      ts: now - (13 - i) * 24 * 3600 * 1000,
      price_qtl: Math.round(2000 + Math.sin(i / 3) * 120 + Math.random() * 60)
    }))
    return res.json({ ok: true, crop, points })
  } catch (err) {
    console.error('Market trends error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

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
    // Use live cache if available
    let list = Array.isArray(schemesCache) && schemesCache.length ? schemesCache.slice() : SCHEMES.slice()
    if (type) list = list.filter(s => s.type === type)
    if (category) {
      if (category === 'government') {
        list = list.filter(s => (s.category === 'government') || (String(s.provider || '').toLowerCase().includes('government')))
      } else if (category === 'finance' || category === 'loans' || category === 'insurance') {
        // finance covers loans, insurance, credit products
        list = list.filter(s => s.category === 'finance' || ['loan','insurance','credit'].includes(s.type))
      }
    }
    return res.json({ ok: true, schemes: list, ts: Date.now() })
  } catch (err) {
    console.error('Schemes list error', err.message)
    return res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/schemes/apply', async (req, res) => {
  try {
    const { schemeId, name, phone, details, userId } = req.body || {}
    if (!schemeId || !name || !phone) return res.status(400).json({ ok: false, error: 'schemeId, name and phone required' })
    const scheme = SCHEMES.find(s => s.id === schemeId)
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

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  // Listen on localhost for local development
  app.listen(PORT, 'localhost', () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;
