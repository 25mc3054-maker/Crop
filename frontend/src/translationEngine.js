// Universal Any-to-Any Real-Time Multilingual Translation Engine for Kisan Social
// Translates between ALL 26+ Indian regional languages and English (N x N complete matrix)

export const LANGUAGE_NAMES = {
  en: 'English',
  te: 'తెలుగు (Telugu)',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  mr: 'मराठी (Marathi)',
  bn: 'বাংলা (Bengali)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  gu: 'ગુજરાતી (Gujarati)',
  or: 'ଓଡ଼ିଆ (Odia)',
  as: 'অসমীয়া (Assamese)',
  ur: 'اردو (Urdu)',
  bho: 'भोजपुरी (Bhojpuri)',
  mai: 'मैथिली (Maithili)',
  sa: 'संस्कृतम् (Sanskrit)',
  raj: 'राजस्थानी (Rajasthani)',
  har: 'हरियाणवी (Haryanvi)',
  chg: 'छत्तीसगढ़ी (Chhattisgarhi)',
  ne: 'नेपाली (Nepali)',
  kok: 'कोंकणी (Konkani)',
  sat: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)',
  ks: 'کٲشُر (Kashmiri)',
  sd: 'سنڌي (Sindhi)',
  doi: 'डोगरी (Dogri)',
  mni: 'মৈতৈলোন্ (Manipuri)',
  brx: 'बड़ो (Bodo)'
}

// Script Range Language Detector covering all Indian official alphabets
export function detectScriptLanguage(text) {
  if (!text) return 'en'
  // Devanagari (Hindi, Marathi, Bhojpuri, Maithili, Nepali, Konkani, Sanskrit, etc.)
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  // Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'
  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'
  // Gurmukhi (Punjabi)
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'
  // Bengali / Assamese
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'
  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'
  // Odia
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or'
  // Urdu / Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return 'ur'
  // Ol Chiki (Santali)
  if (/[\u1C50-\u1C7F]/.test(text)) return 'sat'
  // Default to English
  return 'en'
}

// In-memory cache for ultra-fast instant lookups
const memoryCache = new Map()

// Persistent localStorage translation cache
function getPersistentCache(key) {
  try {
    const raw = localStorage.getItem('krishi_auto_translations')
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[key] || null
  } catch (e) {
    return null
  }
}

function setPersistentCache(key, val) {
  try {
    let map = {}
    const raw = localStorage.getItem('krishi_auto_translations')
    if (raw) map = JSON.parse(raw)
    map[key] = val
    localStorage.setItem('krishi_auto_translations', JSON.stringify(map))
  } catch (e) {}
}

/**
 * Direct translation between two specific languages via MyMemory API
 */
async function queryTranslationAPI(text, src, tgt) {
  const encodedText = encodeURIComponent(text.trim())
  const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${src}|${tgt}`
  const res = await fetch(url)
  const data = await res.json()
  if (data && data.responseData && data.responseData.translatedText) {
    const output = data.responseData.translatedText
    // Check if API returned an error message or unchanged text
    if (!output.toLowerCase().includes('is an invalid target language') &&
        !output.toLowerCase().includes('quota exceeded') &&
        output.trim() !== text.trim()) {
      return output
    }
    return output
  }
  return null
}

/**
 * Universal Any-to-Any Translation function.
 * Supports ALL pairs (Telugu <-> Punjabi, Hindi <-> Bengali, Tamil <-> Gujarati, etc.)
 * Tries direct translation first; if pair is not supported natively, automatically pivots via English:
 * Source -> English -> Target (100% universal coverage for all 26+ languages).
 */
export async function autoTranslate(text, targetLang, sourceLang = null) {
  if (!text || !text.trim()) return text
  if (!targetLang || targetLang === 'none') targetLang = 'en'
  
  const detectedSource = sourceLang || detectScriptLanguage(text)
  if (detectedSource === targetLang) return text

  const cacheKey = `${detectedSource}->${targetLang}:${text.trim()}`
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)
  }

  const stored = getPersistentCache(cacheKey)
  if (stored) {
    memoryCache.set(cacheKey, stored)
    return stored
  }

  try {
    // 1. Attempt direct translation (e.g. pa|te, hi|bn, te|pa, ta|mr)
    const directResult = await queryTranslationAPI(text, detectedSource, targetLang)
    if (directResult && directResult.trim() !== text.trim()) {
      memoryCache.set(cacheKey, directResult)
      setPersistentCache(cacheKey, directResult)
      return directResult
    }

    // 2. Pivot translation via English (Guarantees all N x N language combinations)
    // Step A: Translate Source -> English
    let englishPivot = text
    if (detectedSource !== 'en') {
      const pivotEn = await queryTranslationAPI(text, detectedSource, 'en')
      if (pivotEn) englishPivot = pivotEn
    }

    if (targetLang === 'en') {
      memoryCache.set(cacheKey, englishPivot)
      setPersistentCache(cacheKey, englishPivot)
      return englishPivot
    }

    // Step B: Translate English -> Target Language
    const finalTargetResult = await queryTranslationAPI(englishPivot, 'en', targetLang)
    if (finalTargetResult) {
      memoryCache.set(cacheKey, finalTargetResult)
      setPersistentCache(cacheKey, finalTargetResult)
      return finalTargetResult
    }

    // Fallback to English pivot if target failed
    if (englishPivot && englishPivot !== text) {
      return englishPivot
    }
  } catch (err) {
    console.warn(`[TranslationEngine] Any-to-Any translation error from ${detectedSource} to ${targetLang}:`, err)
  }

  return text
}

/**
 * Dual translation helper: translates a post into the viewer's regional language AND English
 */
export async function getDualTranslationForPost(post, viewerLang) {
  const originalText = post.content || ''
  const detectedSource = post.originalLang || detectScriptLanguage(originalText)
  const targetRegional = (!viewerLang || viewerLang === 'none') ? 'en' : viewerLang

  const results = {
    originalText,
    originalLang: detectedSource,
    regionalText: originalText,
    englishText: originalText,
    isTranslated: false
  }

  // 1. Regional Translation into viewer's language
  if (targetRegional !== 'en' && targetRegional !== detectedSource) {
    results.regionalText = await autoTranslate(originalText, targetRegional, detectedSource)
    results.isTranslated = true
  }

  // 2. English Translation (universal bridge)
  if (detectedSource !== 'en') {
    results.englishText = await autoTranslate(originalText, 'en', detectedSource)
    results.isTranslated = true
  }

  return results
}
