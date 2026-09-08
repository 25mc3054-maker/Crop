import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Navbar from './Navbar'
import { API_BASE_URL } from '../config'
import { CACHE_KEYS, readLiveCache, writeLiveCache } from '../livePreload'
import { autoTranslate, detectScriptLanguage, LANGUAGE_NAMES } from '../translationEngine'
import { REGIONAL_LANGUAGES } from '../languageHelper'

// Authentic multilingual farmer posts covering diverse states & agronomy categories
const INITIAL_SOCIAL_POSTS = [
  {
    id: 'post-1',
    author: {
      id: 'farmer-rajesh',
      name: 'Rajesh Choudhary',
      village: 'Khanna, Ludhiana',
      state: 'Punjab',
      crop: 'Wheat & Mustard',
      badge: '🌾 Progressive Farmer (15 Acres)',
      avatar: '👨‍🌾',
      verified: true
    },
    circle: 'crop-care',
    timestamp: '25 mins ago',
    originalLang: 'hi',
    cropIcon: '🌾',
    cropTag: 'Sharbati Wheat',
    englishContent: 'Just completed the second irrigation for our Sharbati Wheat crop. Applied bio-potash along with liquid zinc. The tillering is extraordinary this year with 8-10 shoots per plant! Fellow wheat farmers, avoid excess nitrogen right now to prevent lodging during unexpected winds.',
    originalContent: 'गेहूं की दूसरी सिंचाई पूरी कर ली है। बायो-पोटाश और जिंक का छिड़काव किया। इस बार प्रति पौधे 8-10 कल्ले निकले हैं! ज्यादा यूरिया न डालें ताकि फसल गिरे नहीं।',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    reactions: { like: 24, insightful: 18, shabaash: 35, support: 6, love: 12 },
    userReaction: null,
    saved: false,
    comments: [
      { id: 'c-1', author: 'Harpreet Singh', lang: 'pa', text: 'Brother, which bio-potash brand gave you this result? Looking for our farm.', time: '15m ago' },
      { id: 'c-1b', author: 'Dr. Arvind Sharma (KVK)', lang: 'en', text: 'Timely advice on nitrogen Rajesh ji. Excessive vegetative growth increases susceptibility to aphids as temperature rises.', time: '8m ago' }
    ]
  },
  {
    id: 'post-2',
    author: {
      id: 'farmer-venkata',
      name: 'Venkata Subba Rao',
      village: 'Tenali, Guntur',
      state: 'Andhra Pradesh',
      crop: 'Teja Red Chilli',
      badge: '🌶️ Spice Exporter & Farmer',
      avatar: '👨‍🌾',
      verified: true
    },
    circle: 'mandi',
    timestamp: '1 hour ago',
    originalLang: 'te',
    cropIcon: '🌶️',
    cropTag: 'Teja Chilli',
    englishContent: 'Arrivals of Teja Red Chilli have surged at the Guntur market yard today. The modal benchmark rate touched ₹19,800/quintal for premium grade sun-dried stock. Make sure your moisture content is below 10% before bagging to get top grade rates.',
    originalContent: 'గుంటూరు మార్కెట్ యార్డులో తేజ మిర్చి రాకలు పెరిగాయి. మోడల్ రేటు క్వింటాలుకు ₹19,800 పలికింది. తేమ శాతం 10% కంటే తక్కువగా ఉండేలా చూసుకుంటే నాణ్యమైన ధర వస్తుంది.',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    reactions: { like: 45, insightful: 29, shabaash: 51, support: 14, love: 20 },
    userReaction: 'shabaash',
    saved: true,
    comments: [
      { id: 'c-2', author: 'Suresh Patil', lang: 'mr', text: 'Excellent benchmark from Guntur yard brother! Nashik traders are also watching closely.', time: '40m ago' }
    ]
  },
  {
    id: 'post-3',
    author: {
      id: 'farmer-gurwinder',
      name: 'Gurwinder Singh',
      village: 'Moga, Malwa',
      state: 'Punjab',
      crop: 'Basmati Rice & Wheat',
      badge: '🚜 Custom Hiring Operator',
      avatar: '👨‍🌾',
      verified: true
    },
    circle: 'machinery',
    timestamp: '2 hours ago',
    originalLang: 'pa',
    cropIcon: '🚜',
    cropTag: 'Super Seeder Wheat',
    englishContent: 'Wheat sown directly using the 7-foot Super Seeder without burning paddy stubble is standing lush green at 35 days. The mulch layer prevented soil moisture evaporation during recent hot afternoons. We saved over ₹2,400 per acre on diesel and field preparation.',
    originalContent: 'ਸੁਪਰ ਸੀਡਰ ਨਾਲ ਬੀਜੀ ਕਣਕ 35 ਦਿਨਾਂ ਬਾਅਦ ਬਹੁਤ ਸ਼ਾਨਦਾਰ ਖੜ੍ਹੀ ਹੈ। ਪਰਾਲੀ ਦੀ ਮਲਚਿੰਗ ਨੇ ਜ਼ਮੀਨ ਦੀ ਨਮੀ ਬਚਾਈ। ਡੀਜ਼ਲ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ₹2,400 ਖਰਚਾ ਵੀ ਬਚਿਆ।',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    reactions: { like: 82, insightful: 41, shabaash: 96, support: 30, love: 38 },
    userReaction: null,
    saved: false,
    comments: [
      { id: 'c-3', author: 'Baljit Singh', lang: 'pa', text: 'Best decision veer ji. Soil organic carbon will increase substantially within 2 seasons.', time: '1h ago' }
    ]
  },
  {
    id: 'post-4',
    author: {
      id: 'farmer-ananya',
      name: 'Ananya Deshmukh',
      village: 'Sangamner, Ahmednagar',
      state: 'Maharashtra',
      crop: 'Organic Pomegranate & Tomato',
      badge: '🌿 Certified Organic Grower (PGS)',
      avatar: '👩‍🌾',
      verified: true
    },
    circle: 'organic',
    timestamp: '3 hours ago',
    originalLang: 'mr',
    cropIcon: '🍅',
    cropTag: 'Bio-Fungicide Recipe',
    englishContent: 'Prepared fresh Dashaparni Kashayam and buttermilk spray for our polyhouse tomatoes. It completely prevented bacterial leaf spot and mites without a single drop of chemical pesticide. Recipe: 10 local bitter leaves fermented with cow urine and turmeric for 21 days.',
    originalContent: 'टोमॅटो पिकासाठी घरगुती दशपर्णी कषाय आणि ताक फवारणी केली. रासायनिक औषधांशिवाय पानांवरील करपा आणि कोळी पूर्णपणे नियंत्रणात आले. पर्यावरणपूरक शेतीचा विजय!',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23995?auto=format&fit=crop&w=800&q=80',
    reactions: { like: 62, insightful: 88, shabaash: 74, support: 22, love: 53 },
    userReaction: 'insightful',
    saved: true,
    comments: [
      { id: 'c-4', author: 'Ramesh Patel (Gujarat)', lang: 'gu', text: 'Can we also use this formulation for cumin crop powdery mildew Ananya ben?', time: '2h ago' }
    ]
  },
  {
    id: 'post-5',
    author: {
      id: 'farmer-suresh',
      name: 'Suresh Patil',
      village: 'Lasalgaon, Nashik',
      state: 'Maharashtra',
      crop: 'Red Onion',
      badge: '🧅 Onion Association Member',
      avatar: '👨‍🌾',
      verified: true
    },
    circle: 'mandi',
    timestamp: '5 hours ago',
    originalLang: 'mr',
    cropIcon: '🧅',
    cropTag: 'Lasalgaon Mandi',
    englishContent: 'Lasalgaon onion market modal price closed at ₹2,280/quintal with total arrivals touching 22,000 quintals. Exporters for Bangladesh and Gulf are active today. Farmers with well-ventilated chawl storage should release stock in staggered batches rather than panic selling.',
    originalContent: 'लासलगाव कांदा मार्केटमध्ये आज लाल कांद्याला सरासरी ₹२,२८० प्रतिक्विंटल भाव मिळाला. आवक २२,००० क्विंटल झाली. शेतकऱ्यांनी टप्प्याटप्प्याने माल बाजारात आणावा.',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
    reactions: { like: 53, insightful: 34, shabaash: 41, support: 19, love: 16 },
    userReaction: null,
    saved: false,
    comments: []
  },
  {
    id: 'post-6',
    author: {
      id: 'farmer-arvind',
      name: 'Dr. Arvind Sharma',
      village: 'ICAR-KVK Karnal',
      state: 'Haryana',
      crop: 'Senior Agronomist',
      badge: '🔬 Agri Scientist & Soil Doctor',
      avatar: '👨‍🔬',
      verified: true
    },
    circle: 'qa',
    timestamp: '6 hours ago',
    originalLang: 'en',
    cropIcon: '⚠️',
    cropTag: 'Wheat Disease Advisory',
    englishContent: 'WEATHER & CROP ALERT: Humid and cloudy weather across North-Western plains is creating ideal conditions for Yellow Rust (Puccinia striiformis) on susceptible wheat cultivars. Inspect the central leaves in morning hours for yellow powdery stripes. If detected, immediately apply Propiconazole 25% EC @ 1ml/litre water with flat fan nozzle.',
    originalContent: 'WEATHER & CROP ALERT: Humid and cloudy weather across North-Western plains is creating ideal conditions for Yellow Rust on wheat cultivars. Inspect central leaves for yellow stripes and apply Propiconazole 25% EC if seen.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    reactions: { like: 110, insightful: 145, shabaash: 78, support: 39, love: 44 },
    userReaction: 'insightful',
    saved: true,
    comments: [
      { id: 'c-6', author: 'Rajesh Choudhary', lang: 'hi', text: 'Thank you doctor sahab! Will inspect our Ludhiana fields right away this morning.', time: '5h ago' }
    ]
  }
]

// 24-Hour Kisan Stories / Field Moments (Instagram-inspired, 100% farming-focused)
const INITIAL_FIELD_STORIES = [
  {
    id: 'story-1',
    farmerId: 'farmer-rajesh',
    farmerName: 'Rajesh Choudhary',
    village: 'Ludhiana, Punjab',
    cropTag: 'Sharbati Wheat',
    avatar: '👨‍🌾',
    verified: true,
    previewImg: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    caption: '🌾 Sunrise field check! 8 tillers per plant recorded after bio-potash spray.',
    timeAgo: '2h ago',
    unread: true
  },
  {
    id: 'story-2',
    farmerId: 'farmer-venkata',
    farmerName: 'Venkata Subba Rao',
    village: 'Guntur, AP',
    cropTag: 'Teja Chilli Yard',
    avatar: '👨‍🌾',
    verified: true,
    previewImg: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    caption: '🌶️ Drying Yard in full swing! Sun-dried Teja batch grading 1st quality.',
    timeAgo: '4h ago',
    unread: true
  },
  {
    id: 'story-3',
    farmerId: 'farmer-ananya',
    farmerName: 'Ananya Deshmukh',
    village: 'Ahmednagar, MH',
    cropTag: 'Drip Polyhouse',
    avatar: '👩‍🌾',
    verified: true,
    previewImg: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23995?auto=format&fit=crop&w=600&q=80',
    caption: '💧 Automatic venturi fertilizer injector test succeeded! Saves 40% water.',
    timeAgo: '5h ago',
    unread: true
  },
  {
    id: 'story-4',
    farmerId: 'farmer-gurwinder',
    farmerName: 'Gurwinder Singh',
    village: 'Moga, Punjab',
    cropTag: 'Super Seeder',
    avatar: '🚜',
    verified: true,
    previewImg: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    caption: '🚜 In action! 45 HP Tractor handling paddy straw effortlessly.',
    timeAgo: '7h ago',
    unread: false
  },
  {
    id: 'story-5',
    farmerId: 'farmer-arvind',
    farmerName: 'Dr. Arvind Sharma',
    village: 'KVK Karnal',
    cropTag: 'Yellow Rust Warning',
    avatar: '🔬',
    verified: true,
    previewImg: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    caption: '⚠️ Leaf diagnostic protocol posted for all northern wheat belts.',
    timeAgo: '8h ago',
    unread: false
  },
  {
    id: 'story-6',
    farmerId: 'farmer-suresh',
    farmerName: 'Suresh Patil',
    village: 'Nashik, MH',
    cropTag: 'Onion Storage Chawl',
    avatar: '🧅',
    verified: true,
    previewImg: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    caption: '🧅 Bamboo chawl natural airflow setup keeping 50 tonnes rot-free.',
    timeAgo: '11h ago',
    unread: false
  }
]

// LinkedIn-style Interactive Farmer Poll
const INITIAL_POLL = {
  id: 'poll-rabi-2026',
  question: 'Rabi Season Agronomy Poll: What is your primary irrigation method for the upcoming wheat/chilli flowering stage?',
  author: 'Dr. Arvind Sharma (KVK Karnal)',
  badge: '🔬 Official KVK Agronomy Survey',
  totalVotes: 428,
  userVotedIndex: null,
  options: [
    { text: '💧 Drip / Micro-fertigation system', votes: 168 },
    { text: '🌊 Border Strip / Furrow Surface Flood', votes: 142 },
    { text: '🌧️ Portable Overhead Sprinklers', votes: 84 },
    { text: '☀️ Solar Powered Submersible with Canal', votes: 34 }
  ]
}

// Agri-Circles / Topic Taxonomy (Facebook Group style)
const AGRI_CIRCLES = [
  { id: 'all', label: '🌾 All Farm Feeds', icon: '🌍' },
  { id: 'crop-care', label: '🌱 Crop Health & Sowing', icon: '🌱' },
  { id: 'organic', label: '🌿 Bio-Fertilizer & Organic', icon: '🌿' },
  { id: 'machinery', label: '🚜 Tractors & Implements', icon: '🚜' },
  { id: 'mandi', label: '📈 Mandi Prices & Trade', icon: '📈' },
  { id: 'qa', label: '❓ Ask Agri Scientists & KVK', icon: '🔬' }
]

// Multi-Reaction Definitions (LinkedIn inspired, customized for Kisan pride)
const REACTION_TYPES = [
  { key: 'shabaash', label: '🌾 Shabaash', color: '#2e7d32', desc: 'Celebrate Farm Yield' },
  { key: 'insightful', label: '💡 Insightful', color: '#d97706', desc: 'Valuable Agri Tip' },
  { key: 'like', label: '👍 Agree', color: '#2563eb', desc: 'Farmer Consensus' },
  { key: 'support', label: '🤝 Support', color: '#7c3aed', desc: 'Community Solidarity' },
  { key: 'love', label: '❤️ Grateful', color: '#e11d48', desc: 'Farmer Gratitude' }
]

// Initial In-App Kisan Messenger Conversations
const INITIAL_MESSENGER_CHATS = [
  {
    farmerId: 'farmer-arvind',
    name: 'Dr. Arvind Sharma (KVK Karnal)',
    avatar: '👨‍🔬',
    online: true,
    badge: 'KVK Senior Agronomist',
    lastSeen: 'Online Now',
    unreadCount: 1,
    messages: [
      { id: 'm-1', sender: 'them', text: 'Namaste! Welcome to KVK Krishi Advisory. How are your Rabi crops standing this week?', time: '10:15 AM' },
      { id: 'm-2', sender: 'them', text: 'Remember to look for yellow powdery pustules on lower leaves before spraying any fungicide.', time: '10:16 AM' }
    ]
  },
  {
    farmerId: 'farmer-rajesh',
    name: 'Rajesh Choudhary',
    avatar: '👨‍🌾',
    online: true,
    badge: 'Progressive Wheat Grower, Ludhiana',
    lastSeen: 'Active 10m ago',
    unreadCount: 0,
    messages: [
      { id: 'm-3', sender: 'them', text: 'Brother, I saw your interest in the Sharbati Wheat crop. Did you apply the first irrigation on day 21?', time: 'Yesterday' },
      { id: 'm-4', sender: 'me', text: 'Yes Rajesh ji! CRI stage was completed on time. Will be adding bio-potash next.', time: 'Yesterday' },
      { id: 'm-5', sender: 'them', text: 'Splendid! Make sure liquid zinc is chelated EDTA 12% so it blends smoothly without precipitate.', time: '8:45 AM' }
    ]
  },
  {
    farmerId: 'farmer-venkata',
    name: 'Venkata Subba Rao',
    avatar: '👨‍🌾',
    online: false,
    badge: 'Chilli Yard Leader, Guntur',
    lastSeen: 'Active 1h ago',
    unreadCount: 0,
    messages: [
      { id: 'm-6', sender: 'them', text: 'Guntur market benchmark is staying steady at ₹19,800. Let me know if you need transport contact from your district.', time: '2h ago' }
    ]
  },
  {
    farmerId: 'farmer-ananya',
    name: 'Ananya Deshmukh',
    avatar: '👩‍🌾',
    online: true,
    badge: 'Organic Farm Expert, Nashik',
    lastSeen: 'Online Now',
    unreadCount: 0,
    messages: [
      { id: 'm-7', sender: 'them', text: 'Happy to share the exact 21-day fermentation schedule for Dashaparni kashayam whenever you need!', time: 'Yesterday' }
    ]
  }
]

export default function KisanSocial({ onBack }) {
  // Read viewer's chosen language saved on Krishi-Net website
  const [viewerLang, setViewerLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')
  
  // Real-time automatic translation store for viewer's selected language
  const [regionalTranslations, setRegionalTranslations] = useState({})
  const [commentTranslations, setCommentTranslations] = useState({})

  // Audio reading state: tracking which post is playing
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null)

  // Voice Mic recording state
  const [isListening, setIsListening] = useState(false)

  // Social Posts state with localStorage persistence
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_social_posts_v2')
      return saved ? JSON.parse(saved) : INITIAL_SOCIAL_POSTS
    } catch (e) {
      return INITIAL_SOCIAL_POSTS
    }
  })

  // Selected Agri-Circle Filter
  const [activeCircle, setActiveCircle] = useState('all')
  const [activeTab, setActiveTab] = useState('feed') // 'feed' | 'saved' | 'poll'

  // Post Creator State
  const [postText, setPostText] = useState('')
  const [postCrop, setPostCrop] = useState('Sharbati Wheat')
  const [postCircle, setPostCircle] = useState('crop-care')
  const [postImagePreview, setPostImagePreview] = useState(null)
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [hoveredReactionPostId, setHoveredReactionPostId] = useState(null)

  // Interactive Poll State
  const [poll, setPoll] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_social_poll')
      return saved ? JSON.parse(saved) : INITIAL_POLL
    } catch (e) {
      return INITIAL_POLL
    }
  })

  // Stories State & Modal Viewer
  const [stories, setStories] = useState(INITIAL_FIELD_STORIES)
  const [activeStoryModal, setActiveStoryModal] = useState(null)
  const [storyProgress, setStoryProgress] = useState(0)

  // In-App Kisan Messenger State
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [messengerExpanded, setMessengerExpanded] = useState(false)
  const [activeChatFarmerId, setActiveChatFarmerId] = useState('farmer-arvind')
  const [chats, setChats] = useState(INITIAL_MESSENGER_CHATS)
  const [chatInputText, setChatInputText] = useState('')
  const [chatIsTyping, setChatIsTyping] = useState(false)

  // Top Charter Note Visibility Toggle
  const [charterCollapsed, setCharterCollapsed] = useState(false)

  // Current logged in user name
  const [userName, setUserName] = useState('Farmer')
  const chatMessagesEndRef = useRef(null)

  useEffect(() => {
    try {
      const token = localStorage.getItem('farmer_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.name) setUserName(payload.name)
        else if (payload.phone) setUserName(`Farmer (${payload.phone.slice(-4)})`)
      }
    } catch (e) {}

    const onLangChanged = () => {
      const current = localStorage.getItem('krishi_secondary_lang') || 'none'
      setViewerLang(current)
    }
    window.addEventListener('krishi_lang_changed', onLangChanged)
    window.addEventListener('storage', onLangChanged)
    return () => {
      window.removeEventListener('krishi_lang_changed', onLangChanged)
      window.removeEventListener('storage', onLangChanged)
    }
  }, [])

  // Persist posts
  useEffect(() => {
    try {
      localStorage.setItem('krishi_social_posts_v2', JSON.stringify(posts))
    } catch (e) {}
  }, [posts])

  // Persist poll
  useEffect(() => {
    try {
      localStorage.setItem('krishi_social_poll', JSON.stringify(poll))
    } catch (e) {}
  }, [poll])

  // Automatic Dual Translation for viewer's chosen language
  useEffect(() => {
    if (!viewerLang || viewerLang === 'none' || viewerLang === 'en') return

    posts.forEach(async (post) => {
      const baseText = post.englishContent || post.content
      const translated = await autoTranslate(baseText, viewerLang, 'en')
      setRegionalTranslations(prev => ({ ...prev, [post.id]: translated }))

      if (post.comments && post.comments.length > 0) {
        post.comments.forEach(async (c) => {
          const cTrans = await autoTranslate(c.text, viewerLang, c.lang || 'en')
          setCommentTranslations(prev => ({ ...prev, [c.id]: cTrans }))
        })
      }
    })
  }, [posts, viewerLang])

  // Scroll active chat to bottom
  useEffect(() => {
    if (messengerOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chats, activeChatFarmerId, messengerOpen])

  // Story Progress Auto-timer
  useEffect(() => {
    let timer
    if (activeStoryModal) {
      setStoryProgress(0)
      const interval = 80 // ms
      timer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer)
            // advance to next story or close
            const currIdx = stories.findIndex(s => s.id === activeStoryModal.id)
            if (currIdx < stories.length - 1) {
              setActiveStoryModal(stories[currIdx + 1])
              return 0
            } else {
              setActiveStoryModal(null)
              return 0
            }
          }
          return prev + 2
        })
      }, interval)
    }
    return () => clearInterval(timer)
  }, [activeStoryModal, stories])

  // Speech synthesis audio reader
  const speakPostText = (id, textToSpeak, langCode) => {
    if (!window.speechSynthesis) {
      alert('Audio voice synthesis is not supported in this browser.')
      return
    }

    if (currentlySpeakingId === id) {
      window.speechSynthesis.cancel()
      setCurrentlySpeakingId(null)
      return
    }

    window.speechSynthesis.cancel()
    setCurrentlySpeakingId(id)

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    const langMap = {
      te: 'te-IN', hi: 'hi-IN', pa: 'pa-IN', ta: 'ta-IN', kn: 'kn-IN',
      ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', ur: 'ur-IN', en: 'en-IN'
    }
    utterance.lang = langMap[langCode] || 'en-IN'
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onend = () => setCurrentlySpeakingId(null)
    utterance.onerror = () => setCurrentlySpeakingId(null)
    window.speechSynthesis.speak(utterance)
  }

  // Voice Mic Speech-to-Text Input
  const handleVoiceMicInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in Google Chrome or Microsoft Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    const langMap = {
      te: 'te-IN', hi: 'hi-IN', pa: 'pa-IN', ta: 'ta-IN', kn: 'kn-IN',
      ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', en: 'en-IN'
    }
    recognition.lang = langMap[viewerLang] || 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    setIsListening(true)
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setPostText(prev => prev ? `${prev} ${transcript}` : transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  // Create New Post with strictly agricultural categorization
  const handleCreatePost = (e) => {
    e.preventDefault()
    if (!postText.trim()) return

    const detected = detectScriptLanguage(postText)

    const newPost = {
      id: `post-${Date.now()}`,
      author: {
        id: 'farmer-current-user',
        name: userName,
        village: 'Local Block Farm',
        state: 'India',
        crop: postCrop,
        badge: '🌾 Progressive Farmer',
        avatar: '🌾',
        verified: true
      },
      circle: postCircle,
      timestamp: 'Just now',
      originalLang: detected,
      cropIcon: '🌱',
      cropTag: postCrop,
      englishContent: postText.trim(),
      originalContent: postText.trim(),
      image: postImagePreview || null,
      reactions: { like: 1, insightful: 0, shabaash: 1, support: 0, love: 0 },
      userReaction: 'shabaash',
      saved: false,
      comments: []
    }

    setPosts([newPost, ...posts])
    setPostText('')
    setPostImagePreview(null)
  }

  // Handle LinkedIn-style Reactions (Shabaash, Insightful, Agree, Support, Love)
  const handleSelectReaction = (postId, reactionKey) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const oldReaction = p.userReaction
      const currentCount = p.reactions[reactionKey] || 0

      if (oldReaction === reactionKey) {
        // Unreact
        return {
          ...p,
          userReaction: null,
          reactions: {
            ...p.reactions,
            [reactionKey]: Math.max(0, currentCount - 1)
          }
        }
      } else {
        // Change reaction
        const updated = { ...p.reactions }
        if (oldReaction && updated[oldReaction] > 0) {
          updated[oldReaction] -= 1
        }
        updated[reactionKey] = (updated[reactionKey] || 0) + 1
        return {
          ...p,
          userReaction: reactionKey,
          reactions: updated
        }
      }
    }))
    setHoveredReactionPostId(null)
  }

  // Double Tap photo to Shabaash/Like (Instagram-style)
  const handleDoubleTapPhoto = (postId) => {
    handleSelectReaction(postId, 'shabaash')
  }

  // Bookmark / Save to Field Notebook
  const handleToggleSave = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p))
  }

  // Add Comment to Post
  const handleAddComment = (postId) => {
    if (!newCommentText.trim()) return
    const newComment = {
      id: `c-${Date.now()}`,
      author: userName,
      lang: 'en',
      text: newCommentText.trim(),
      time: 'Just now'
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...(p.comments || []), newComment] }
      }
      return p
    }))
    setNewCommentText('')
  }

  // Handle WhatsApp Share
  const handleWhatsAppShare = (post) => {
    const text = `🌾 *Kisan Social Agronomy Update by ${post.author.name}*:\n"${post.englishContent || post.content}"\n\n📌 Crop: ${post.cropTag} | Location: ${post.author.village}, ${post.author.state}\nRead on Krishi-Net Farmers Network!`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Vote on Weekly Agri Poll
  const handleVotePoll = (optionIdx) => {
    if (poll.userVotedIndex !== null) return
    const updatedOptions = poll.options.map((opt, idx) => {
      if (idx === optionIdx) return { ...opt, votes: opt.votes + 1 }
      return opt
    })
    setPoll({
      ...poll,
      totalVotes: poll.totalVotes + 1,
      userVotedIndex: optionIdx,
      options: updatedOptions
    })
  }

  // Launch In-App Kisan Messenger with a specific Farmer from a post or story
  const handleOpenDirectMessage = (farmer, initialContextText = '') => {
    // Check if conversation exists, if not create
    const existing = chats.find(c => c.farmerId === farmer.id || c.name === farmer.name)
    if (!existing) {
      const newChat = {
        farmerId: farmer.id || `f-${Date.now()}`,
        name: farmer.name,
        avatar: farmer.avatar || '👨‍🌾',
        online: true,
        badge: farmer.badge || `${farmer.crop} Specialist`,
        lastSeen: 'Online Now',
        unreadCount: 0,
        messages: [
          {
            id: `m-init-${Date.now()}`,
            sender: 'them',
            text: `Ram Ram! ${farmer.name} here from ${farmer.village || farmer.state}. Glad to connect with a fellow farmer!`,
            time: 'Just now'
          }
        ]
      }
      setChats([newChat, ...chats])
      setActiveChatFarmerId(newChat.farmerId)
    } else {
      setActiveChatFarmerId(existing.farmerId)
    }

    if (initialContextText) {
      setChatInputText(initialContextText)
    }
    setMessengerOpen(true)
  }

  // Send Message in Active Chat with simulated intelligent farmer reply
  const handleSendChatMessage = (textToSend = null) => {
    const messageContent = (textToSend || chatInputText).trim()
    if (!messageContent) return

    const activeChat = chats.find(c => c.farmerId === activeChatFarmerId)
    if (!activeChat) return

    const myMsg = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: messageContent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedChats = chats.map(c => {
      if (c.farmerId === activeChatFarmerId) {
        return {
          ...c,
          messages: [...c.messages, myMsg]
        }
      }
      return c
    })
    setChats(updatedChats)
    setChatInputText('')

    // Simulated authentic farmer reply after 1.5s
    setChatIsTyping(true)
    setTimeout(() => {
      let replyReply = 'Got your question brother! In our field, we recommend 100% soil testing before finalizing application. Let us keep sharing updates.'
      if (messageContent.toLowerCase().includes('fertilizer') || messageContent.toLowerCase().includes('spray')) {
        replyReply = 'For fertilizer dosage, we strictly applied 25kg bio-potash along with liquid zinc at the 2nd watering. Avoid excess urea to prevent lodging!'
      } else if (messageContent.toLowerCase().includes('price') || messageContent.toLowerCase().includes('mandi') || messageContent.toLowerCase().includes('rate')) {
        replyReply = 'In today\'s mandi yard, arrivals have increased. Clean dry stock is getting a ₹200 to ₹350 premium per quintal.'
      } else if (messageContent.toLowerCase().includes('super seeder') || messageContent.toLowerCase().includes('tractor')) {
        replyReply = 'We ran the 7-ft super seeder at 4-5 km/hr speed on low 1st gear with 50HP tractor. Diesel consumption was just ~5.5 litres per acre!'
      }

      const farmerMsg = {
        id: `m-reply-${Date.now()}`,
        sender: 'them',
        text: replyReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setChats(prev => prev.map(c => {
        if (c.farmerId === activeChatFarmerId) {
          return {
            ...c,
            messages: [...c.messages, farmerMsg]
          }
        }
        return c
      }))
      setChatIsTyping(false)
    }, 1400)
  }

  // Filter posts by Circle & Saved tab
  const displayedPosts = posts.filter(post => {
    if (activeTab === 'saved') {
      return post.saved
    }
    if (activeCircle === 'all') return true
    return post.circle === activeCircle
  })

  const isNone = viewerLang === 'none' || viewerLang === 'en'
  const currentLangObj = REGIONAL_LANGUAGES.find(l => l.code === viewerLang) || { name: 'English', englishName: 'English' }
  const activeChat = chats.find(c => c.farmerId === activeChatFarmerId) || chats[0]
  const totalUnreadMessages = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', padding: '14px 10px 80px', backgroundColor: '#f4f7f4', color: '#182c1d', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="container" style={{ width: '96%', maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* Top Segmented Navbar */}
        <Navbar 
          title={isNone ? '📱 Krishi-Net Social' : `📱 Krishi-Net Social (${currentLangObj.name})`} 
          showBack={true} 
          onBack={onBack} 
        />

        {/* ========================================================================= */}
        {/* MANDATORY TOP CHARTER NOTE: Strictly Agriculture & Farming Ideas Policy */}
        {/* ========================================================================= */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
            color: '#ffffff',
            border: '2px solid #52b788',
            borderRadius: '0px',
            padding: charterCollapsed ? '12px 20px' : '22px 24px',
            marginBottom: 20,
            boxShadow: '0 4px 16px rgba(27, 67, 50, 0.25)',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 280 }}>
              <div style={{
                width: 44,
                height: 44,
                background: '#40916c',
                color: '#d8f3dc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
                border: '1px solid #74c69d'
              }}>
                🛡️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d8f3dc', color: '#1b4332', padding: '3px 10px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  <span>🌾</span> OFFICIAL COMMUNITY CHARTER & PUBLISHING POLICY
                </div>
                <h2 style={{ fontSize: 'clamp(17px, 2.4vw, 22px)', fontWeight: 900, margin: '2px 0 6px', color: '#d8f3dc', letterSpacing: -0.2 }}>
                  Notice: Pure Farming, Agronomy & Rural Inventions Only
                </h2>

                {!charterCollapsed && (
                  <>
                    <p style={{ margin: '0 0 12px 0', fontSize: 14.5, color: '#e8f5e9', lineHeight: 1.6, fontWeight: 500 }}>
                      <strong>Mandatory Community Standard:</strong> Every post, field moment, discussion, and inquiry shared on Krishi-Net Social must strictly pertain to <em>agriculture, crop cultivation, pest management, soil health, dairy, livestock, agri-machinery, mandi market intelligence, or innovative farming ideas</em>. Commercial spam, politics, non-agricultural banter, and irrelevant posts are prohibited to preserve this space as India’s purest agricultural knowledge exchange.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px 12px', borderLeft: '3px solid #74c69d', fontSize: 12.5 }}>
                        <strong>🌱 Crop Science & Soil:</strong> Sowing times, organic pest sprays, micro-nutrients & yields.
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px 12px', borderLeft: '3px solid #74c69d', fontSize: 12.5 }}>
                        <strong>🚜 Agri-Machinery & Tools:</strong> Super seeders, drones, solar pumps & implement reviews.
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px 12px', borderLeft: '3px solid #74c69d', fontSize: 12.5 }}>
                        <strong>📈 Mandi Arrivals & Rates:</strong> Verified yard prices, grading benchmarks & trade contacts.
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px 12px', borderLeft: '3px solid #74c69d', fontSize: 12.5 }}>
                        <strong>💡 Rural Inventions & Ideas:</strong> Bio-enzymes, water conservation & low-cost hacks.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setCharterCollapsed(!charterCollapsed)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  borderRadius: '0px'
                }}
              >
                {charterCollapsed ? '📖 View Guidelines' : '▲ Collapse'}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO HEADER: Network Status & Language Translation Selector */}
        {/* ========================================================================= */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #6cba55 0%, #4e9436 100%)',
            color: '#ffffff',
            borderRadius: '0px',
            padding: '24px 28px',
            marginBottom: 20,
            boxShadow: '0 4px 14px rgba(78, 148, 54, 0.22)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 18,
            border: '1px solid #4e9436'
          }}
        >
          <div style={{ maxWidth: 740 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', color: '#2d6a4f', padding: '3px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
              <span>🌾</span> ALL-INDIA KISAN SOCIAL ECOSYSTEM
            </div>
            <h1 style={{ fontSize: 'clamp(20px, 3.2vw, 28px)', fontWeight: 900, margin: '2px 0 6px', color: '#ffffff', lineHeight: 1.25 }}>
              Connect With Progressive Farmers & Agronomists Nationwide
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.5 }}>
              Exchange live field moments, discover verified mandi benchmarks, vote in agronomy surveys, and direct chat via Kisan Messenger.
            </p>
            {!isNone && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: '#eaf7e6', fontWeight: 800 }}>
                🌐 Active Regional Translation: {currentLangObj.name} ({currentLangObj.englishName})
              </div>
            )}
          </div>

          {/* Clean White Language Selector Box */}
          <div style={{ background: '#ffffff', padding: '12px 16px', border: '1px solid #e2ece0', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4e9436', textTransform: 'uppercase', marginBottom: 4 }}>
              Select Regional Language:
            </div>
            <select
              value={viewerLang}
              onChange={(e) => {
                const val = e.target.value
                setViewerLang(val)
                localStorage.setItem('krishi_secondary_lang', val)
                window.dispatchEvent(new Event('krishi_lang_changed'))
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '0px',
                border: '1.5px solid #6cba55',
                background: '#f8faf7',
                fontSize: 13,
                fontWeight: 800,
                color: '#2e7d32',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="none">🌐 English Only</option>
              {REGIONAL_LANGUAGES.filter(l => l.code !== 'none').map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.englishName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INSTAGRAM FEATURE: 24-Hour Kisan Stories / Field Moments Bar */}
        {/* ========================================================================= */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #d8e5d6',
          padding: '16px 18px',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📸</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#1b4332', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                24-Hour Field Moments (Live Stories)
              </span>
              <span style={{ background: '#eaf7e6', color: '#2e7d32', fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>
                Active Now
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#5ca346', fontWeight: 700 }}>
              Tap circle to view live field highlights
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
            {/* Add Your Story Item */}
            <div 
              onClick={() => {
                const sampleText = prompt('Share a quick 24-hour field moment status (e.g. Completed drip irrigation on 3 acres!):')
                if (sampleText) {
                  const newStory = {
                    id: `story-${Date.now()}`,
                    farmerId: 'me',
                    farmerName: userName,
                    village: 'My Farm',
                    cropTag: 'Field Update',
                    avatar: '🌾',
                    verified: true,
                    previewImg: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
                    caption: sampleText,
                    timeAgo: 'Just now',
                    unread: true
                  }
                  setStories([newStory, ...stories])
                  setActiveStoryModal(newStory)
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 84,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: 66,
                height: 66,
                borderRadius: '50%',
                background: '#eaf7e6',
                border: '2px dashed #4e9436',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                color: '#4e9436',
                position: 'relative',
                transition: 'transform 0.15s ease'
              }}>
                <span>➕</span>
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  background: '#2e7d32',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 900,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}>
                  +
                </span>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#2e7d32', marginTop: 6 }}>
                Your Story
              </span>
              <span style={{ fontSize: 10, color: '#799080' }}>Add Field</span>
            </div>

            {/* Other Farmers' Live Stories */}
            {stories.map(story => (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStoryModal(story)
                  // mark as read
                  setStories(prev => prev.map(s => s.id === story.id ? { ...s, unread: false } : s))
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 84,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  padding: 3,
                  background: story.unread 
                    ? 'linear-gradient(45deg, #2e7d32, #6cba55, #f59e0b)' 
                    : '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: story.unread ? '0 2px 8px rgba(46, 125, 50, 0.35)' : 'none',
                  transition: 'transform 0.15s ease'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#ffffff',
                    border: '2px solid #ffffff',
                    position: 'relative'
                  }}>
                    <img
                      src={story.previewImg}
                      alt={story.farmerName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <span style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#182c1d',
                  marginTop: 6,
                  maxWidth: 84,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {story.farmerName.split(' ')[0]}
                </span>
                <span style={{ fontSize: 10, color: '#5ca346', fontWeight: 700 }}>
                  {story.cropTag.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FACEBOOK / LINKEDIN NAVIGATION: Agri-Circles & Filter Tabs */}
        {/* ========================================================================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20
        }}>
          {/* Main Content View Switcher */}
          <div style={{ display: 'flex', gap: 6, background: '#ffffff', padding: 4, border: '1px solid #d8e5d6' }}>
            <button
              onClick={() => setActiveTab('feed')}
              style={{
                background: activeTab === 'feed' ? '#2e7d32' : 'transparent',
                color: activeTab === 'feed' ? '#ffffff' : '#182c1d',
                border: 'none',
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                borderRadius: '0px'
              }}
            >
              📰 Feed & Updates
            </button>
            <button
              onClick={() => setActiveTab('poll')}
              style={{
                background: activeTab === 'poll' ? '#2e7d32' : 'transparent',
                color: activeTab === 'poll' ? '#ffffff' : '#182c1d',
                border: 'none',
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                borderRadius: '0px'
              }}
            >
              📊 Weekly Agri Poll
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              style={{
                background: activeTab === 'saved' ? '#2e7d32' : 'transparent',
                color: activeTab === 'saved' ? '#ffffff' : '#182c1d',
                border: 'none',
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                borderRadius: '0px'
              }}
            >
              🔖 Field Notebook ({posts.filter(p => p.saved).length})
            </button>
          </div>

          {/* Quick Messenger Trigger */}
          <button
            onClick={() => setMessengerOpen(true)}
            style={{
              background: '#ffffff',
              border: '2px solid #2e7d32',
              color: '#2e7d32',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(46, 125, 50, 0.15)'
            }}
          >
            <span>💬</span>
            <span>Open Kisan Messenger</span>
            {totalUnreadMessages > 0 && (
              <span style={{ background: '#ef4444', color: '#ffffff', fontSize: 11, fontWeight: 900, padding: '1px 6px', borderRadius: '10px' }}>
                {totalUnreadMessages}
              </span>
            )}
          </button>
        </div>

        {/* Agri-Circles Filter Ribbon (if on feed tab) */}
        {activeTab === 'feed' && (
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 10,
            marginBottom: 20,
            scrollbarWidth: 'none'
          }}>
            {AGRI_CIRCLES.map(circle => (
              <button
                key={circle.id}
                onClick={() => setActiveCircle(circle.id)}
                style={{
                  background: activeCircle === circle.id ? '#1b4332' : '#ffffff',
                  color: activeCircle === circle.id ? '#ffffff' : '#2d6a4f',
                  border: activeCircle === circle.id ? '1.5px solid #1b4332' : '1px solid #d8e5d6',
                  padding: '7px 16px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  boxShadow: activeCircle === circle.id ? '0 2px 6px rgba(27, 67, 50, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{circle.icon}</span> {circle.label}
              </button>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN FEED & SIDEBAR GRID */}
        {/* ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', maxWidth: 900, margin: '0 auto', gap: 24 }}>

          {/* TAB 1: WEEKLY AGRI POLL (LINKEDIN FEATURE) */}
          {activeTab === 'poll' && (
            <div style={{
              background: '#ffffff',
              border: '2px solid #6cba55',
              padding: 24,
              boxShadow: '0 4px 14px rgba(78, 148, 54, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#2e7d32', textTransform: 'uppercase' }}>
                  Weekly National Agronomy Poll
                </span>
                <span style={{ background: '#eaf7e6', color: '#2e7d32', fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>
                  {poll.badge}
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#182c1d', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {poll.question}
              </h3>
              <div style={{ fontSize: 12, color: '#799080', marginBottom: 18 }}>
                Curated by <strong>{poll.author}</strong> • Total {poll.totalVotes} Verified Farmer Votes
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                {poll.options.map((opt, idx) => {
                  const percent = Math.round((opt.votes / poll.totalVotes) * 100) || 0
                  const isUserChoice = poll.userVotedIndex === idx

                  return (
                    <div
                      key={idx}
                      onClick={() => handleVotePoll(idx)}
                      style={{
                        position: 'relative',
                        background: isUserChoice ? '#eaf7e6' : '#f8faf7',
                        border: isUserChoice ? '2px solid #2e7d32' : '1px solid #d8e5d6',
                        padding: '14px 16px',
                        cursor: poll.userVotedIndex === null ? 'pointer' : 'default',
                        overflow: 'hidden',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Animated Percentage Bar */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${percent}%`,
                          background: isUserChoice ? 'rgba(78, 148, 54, 0.2)' : 'rgba(216, 229, 214, 0.4)',
                          zIndex: 0,
                          transition: 'width 0.5s ease'
                        }}
                      />

                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: isUserChoice ? 900 : 700, color: isUserChoice ? '#1b4332' : '#182c1d' }}>
                          {isUserChoice && '✓ '} {opt.text}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#2e7d32' }}>
                          {percent}% <span style={{ fontSize: 11, fontWeight: 600, color: '#799080' }}>({opt.votes})</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#496150' }}>
                <span>{poll.userVotedIndex !== null ? '✓ Thank you for casting your agronomy vote!' : '👉 Click any option above to cast your vote.'}</span>
                <button
                  onClick={() => setActiveTab('feed')}
                  style={{ background: '#2e7d32', color: '#ffffff', border: 'none', padding: '6px 14px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Back to Feed
                </button>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: SOCIAL FEED & SAVED FIELD NOTEBOOK */}
          {activeTab !== 'poll' && (
            <>
              {/* POST COMPOSER CARD (Facebook/LinkedIn styled, Farmer-First) */}
              {activeTab === 'feed' && (
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #a7e096',
                  borderRadius: '0px',
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(92, 163, 70, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '0px', background: '#eaf7e6', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, border: '1px solid #a7e096' }}>
                        🌾
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#182c1d' }}>{userName}</div>
                        <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 700 }}>
                          Share field results, ask agronomy doubts, or post mandi prices
                        </div>
                      </div>
                    </div>

                    {/* Light Green Voice Mic Button */}
                    <button
                      type="button"
                      onClick={handleVoiceMicInput}
                      style={{
                        background: isListening ? '#ef4444' : '#2e7d32',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0px',
                        padding: '8px 16px',
                        fontWeight: 800,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(46, 125, 50, 0.25)'
                      }}
                    >
                      <span>{isListening ? '⏹️' : '🎤'}</span>
                      <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleCreatePost}>
                    <textarea
                      rows={3}
                      placeholder="What is happening on your farm today? Share yield numbers, pest observations, bio-fertilizer recipes, or mandi arrivals..."
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 14,
                        borderRadius: '0px',
                        border: '1px solid #d1d5db',
                        fontSize: 14.5,
                        fontWeight: 500,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        lineHeight: 1.6,
                        background: '#f8faf7'
                      }}
                    />

                    {postImagePreview && (
                      <div style={{ position: 'relative', marginTop: 10, width: 140, height: 90, border: '1px solid #d1d5db' }}>
                        <img src={postImagePreview} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setPostImagePreview(null)}
                          style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, padding: '2px 6px' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#496150' }}>Category:</span>
                          <select
                            value={postCircle}
                            onChange={(e) => setPostCircle(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '0px', border: '1px solid #d1d5db', fontSize: 12.5, fontWeight: 700, background: '#ffffff' }}
                          >
                            <option value="crop-care">🌱 Crop Care & Sowing</option>
                            <option value="organic">🌿 Organic & Bio-Fertilizer</option>
                            <option value="machinery">🚜 Machinery & Implements</option>
                            <option value="mandi">📈 Mandi Prices & Trade</option>
                            <option value="qa">❓ Ask Agri Scientists</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#496150' }}>Crop:</span>
                          <select
                            value={postCrop}
                            onChange={(e) => setPostCrop(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '0px', border: '1px solid #d1d5db', fontSize: 12.5, fontWeight: 700, background: '#ffffff' }}
                          >
                            <option>Sharbati Wheat</option>
                            <option>Paddy / Basmati</option>
                            <option>Teja Chilli</option>
                            <option>Red Onion</option>
                            <option>Cotton</option>
                            <option>Pomegranate</option>
                            <option>Mustard</option>
                            <option>Dairy & Cattle</option>
                          </select>
                        </div>

                        {/* Quick Photo attachment simulator */}
                        <button
                          type="button"
                          onClick={() => {
                            const sample = prompt('Paste image link or choose sample photo (Wheat, Chilli, Onion, Machinery):', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80')
                            if (sample) setPostImagePreview(sample)
                          }}
                          style={{
                            background: '#f8faf7',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>📷 Add Photo</span>
                        </button>
                      </div>

                      {/* Publish Button */}
                      <button
                        type="submit"
                        disabled={!postText.trim()}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '0px',
                          border: 'none',
                          background: postText.trim() ? '#2e7d32' : '#94a3b8',
                          color: '#ffffff',
                          fontSize: 13.5,
                          fontWeight: 900,
                          cursor: postText.trim() ? 'pointer' : 'not-allowed',
                          boxShadow: postText.trim() ? '0 2px 6px rgba(46, 125, 50, 0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📢 Publish Post
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SAVED POSTS HEADER */}
              {activeTab === 'saved' && (
                <div style={{ background: '#eaf7e6', border: '1px solid #a7e096', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1b4332' }}>
                      🔖 My Saved Field Notebook ({posts.filter(p => p.saved).length} Posts)
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#2d6a4f' }}>
                      Quick reference guide for pesticide recipes, mandi rates, and machinery advice you bookmarked.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('feed')}
                    style={{ background: '#2e7d32', color: '#ffffff', border: 'none', padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    View All Posts
                  </button>
                </div>
              )}

              {/* POSTS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {displayedPosts.length === 0 ? (
                  <div style={{ background: '#ffffff', border: '1px solid #d8e5d6', padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🌾</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#182c1d' }}>No posts found in this category</div>
                    <p style={{ fontSize: 13, color: '#799080', margin: '6px 0 16px' }}>
                      Be the first farmer to share an update or question in this topic!
                    </p>
                    <button
                      onClick={() => { setActiveTab('feed'); setActiveCircle('all'); }}
                      style={{ background: '#2e7d32', color: '#ffffff', border: 'none', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Reset Category Filter
                    </button>
                  </div>
                ) : (
                  displayedPosts.map((post) => {
                    const originalLang = post.originalLang || detectScriptLanguage(post.originalContent || post.content)
                    const englishText = post.englishContent || post.content
                    const regionalText = regionalTranslations[post.id]
                    const isSpeakingThis = currentlySpeakingId === post.id
                    const isHoveringReactions = hoveredReactionPostId === post.id

                    // Total reaction counter
                    const totalReactionsCount = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0)
                    const currentReactionObj = REACTION_TYPES.find(r => r.key === post.userReaction)

                    return (
                      <div
                        key={post.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d8e5d6',
                          borderRadius: '0px',
                          padding: 22,
                          boxShadow: '0 2px 8px rgba(24, 44, 29, 0.05)',
                          position: 'relative'
                        }}
                      >
                        {/* Farmer Author Header (LinkedIn-style Professional Credentials) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '0px', background: '#eaf7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '1px solid #a7e096' }}>
                              {post.author.avatar || '👨‍🌾'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 16, fontWeight: 900, color: '#182c1d' }}>
                                  {post.author.name}
                                </span>
                                {post.author.verified && (
                                  <span style={{ background: '#d8f3dc', color: '#1b4332', fontSize: 11, fontWeight: 900, padding: '2px 8px' }}>
                                    ✓ Verified Agri Member
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 800, marginTop: 1 }}>
                                {post.author.badge || `${post.author.crop} Cultivator`}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#799080', fontWeight: 600 }}>
                                {post.author.village}, {post.author.state} • <span style={{ color: '#496150' }}>{post.timestamp}</span>
                              </div>
                            </div>
                          </div>

                          {/* Direct Message & Bookmark Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* In-App Messenger Direct Trigger */}
                            <button
                              type="button"
                              onClick={() => handleOpenDirectMessage(post.author, `Hi ${post.author.name}, saw your post on ${post.cropTag}...`)}
                              title={`Direct message ${post.author.name}`}
                              style={{
                                background: '#eaf7e6',
                                border: '1px solid #74c69d',
                                color: '#1b4332',
                                padding: '5px 12px',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span>💬</span>
                              <span>Message</span>
                            </button>

                            {/* Bookmark / Field Notebook Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleSave(post.id)}
                              title={post.saved ? 'Saved in Field Notebook' : 'Save to Field Notebook'}
                              style={{
                                background: post.saved ? '#fef3c7' : '#f8faf7',
                                border: '1px solid',
                                borderColor: post.saved ? '#f59e0b' : '#cbd5e1',
                                color: post.saved ? '#b45309' : '#64748b',
                                padding: '5px 10px',
                                fontSize: 13,
                                cursor: 'pointer'
                              }}
                            >
                              {post.saved ? '🔖' : '📑'}
                            </button>
                          </div>
                        </div>

                        {/* Crop Tag & Circle Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ background: '#f0f7ee', color: '#1b4332', padding: '3px 10px', fontSize: 12, fontWeight: 800, border: '1px solid #d8e5d6' }}>
                            {post.cropIcon || '🌾'} {post.cropTag}
                          </span>
                          <span style={{ background: '#f8faf7', color: '#5ca346', padding: '3px 10px', fontSize: 11.5, fontWeight: 700, border: '1px solid #e2ece0' }}>
                            📁 {AGRI_CIRCLES.find(c => c.id === post.circle)?.label || 'Agronomy'}
                          </span>
                        </div>

                        {/* Multilingual Voice Reader Bar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          background: '#f8faf7',
                          border: '1px solid #e3f3df',
                          padding: '6px 12px',
                          marginBottom: 14,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#2e7d32'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🌐</span>
                            <span>
                              Farmer post from {post.author.state} (Original: {LANGUAGE_NAMES[originalLang] || originalLang})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => speakPostText(post.id, regionalText || englishText, isNone ? 'en' : viewerLang)}
                            style={{
                              background: isSpeakingThis ? '#ef4444' : '#2e7d32',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 12px',
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>{isSpeakingThis ? '⏹️ Stop' : '🔊 Listen (Audio)'}</span>
                          </button>
                        </div>

                        {/* 1. PRIMARY ENGLISH AGRONOMY CONTENT */}
                        <p style={{
                          fontSize: 'clamp(15px, 2.4vw, 16.5px)',
                          lineHeight: 1.65,
                          color: '#182c1d',
                          fontWeight: 500,
                          margin: '0 0 12px 0',
                          whiteSpace: 'pre-line'
                        }}>
                          {englishText}
                        </p>

                        {/* 2. REGIONAL TRANSLATION IF SELECTED */}
                        {!isNone && regionalText && regionalText !== englishText && (
                          <div style={{
                            background: '#f0f7ee',
                            borderLeft: '4px solid #2e7d32',
                            padding: '12px 16px',
                            marginBottom: 14
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#2e7d32', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>🌐</span> {currentLangObj.name} ({currentLangObj.englishName}):
                            </div>
                            <p style={{
                              fontSize: 15.5,
                              lineHeight: 1.65,
                              color: '#1b4332',
                              fontWeight: 600,
                              margin: 0,
                              whiteSpace: 'pre-line'
                            }}>
                              {regionalText}
                            </p>
                          </div>
                        )}

                        {/* Attached Farm Photo with Double-Tap to Shabaash (Instagram feature) */}
                        {post.image && (
                          <div 
                            onDoubleClick={() => handleDoubleTapPhoto(post.id)}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              marginBottom: 14,
                              maxHeight: 400,
                              border: '1px solid #e2ece0',
                              cursor: 'pointer'
                            }}
                            title="Double-tap photo to give Shabaash! 🌾"
                          >
                            <img 
                              src={post.image} 
                              alt="Farm Harvest" 
                              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} 
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              background: 'rgba(0, 0, 0, 0.65)',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px'
                            }}>
                              👆 Double-tap photo to give Shabaash
                            </div>
                          </div>
                        )}

                        {/* Reaction Breakdown Stats Bar (LinkedIn style) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #f1f5f0', fontSize: 12, color: '#799080' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>🌾💡👍</span>
                            <span style={{ fontWeight: 700, color: '#182c1d' }}>
                              {totalReactionsCount} Agri Endorsements
                            </span>
                          </div>
                          <div>
                            <span style={{ cursor: 'pointer' }} onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}>
                              {post.comments?.length || 0} Farmer Replies
                            </span>
                          </div>
                        </div>

                        {/* MULTI-REACTION PICKER POPUP (LinkedIn Hover Palette) */}
                        {isHoveringReactions && (
                          <div
                            onMouseEnter={() => setHoveredReactionPostId(post.id)}
                            onMouseLeave={() => setHoveredReactionPostId(null)}
                            style={{
                              position: 'absolute',
                              bottom: 60,
                              left: 20,
                              background: '#ffffff',
                              border: '1px solid #a7e096',
                              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
                              padding: '8px 12px',
                              display: 'flex',
                              gap: 12,
                              zIndex: 10
                            }}
                          >
                            {REACTION_TYPES.map(r => (
                              <button
                                key={r.key}
                                onClick={() => handleSelectReaction(post.id, r.key)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 2,
                                  transition: 'transform 0.1s ease',
                                  padding: 4
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <span style={{ fontSize: 22 }}>{r.label.split(' ')[0]}</span>
                                <span style={{ fontSize: 10, fontWeight: 800, color: r.color }}>{r.label.split(' ')[1]}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Action Bar (Multi-reaction, Replies, WhatsApp) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                            {/* Reaction Trigger Button */}
                            <button
                              onMouseEnter={() => setHoveredReactionPostId(post.id)}
                              onClick={() => handleSelectReaction(post.id, post.userReaction ? post.userReaction : 'shabaash')}
                              style={{
                                background: post.userReaction ? '#eaf7e6' : '#f8faf7',
                                border: '1px solid',
                                borderColor: post.userReaction ? '#74c69d' : '#d1d5db',
                                color: currentReactionObj ? currentReactionObj.color : '#182c1d',
                                fontSize: 12.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px'
                              }}
                            >
                              <span>{currentReactionObj ? currentReactionObj.label.split(' ')[0] : '🌾'}</span>
                              <span>{currentReactionObj ? currentReactionObj.label : 'Endorse'}</span>
                            </button>

                            {/* Replies Button */}
                            <button
                              onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                              style={{
                                background: '#f8faf7',
                                border: '1px solid #d1d5db',
                                color: '#182c1d',
                                fontSize: 12.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px'
                              }}
                            >
                              <span>💬</span>
                              <span>{post.comments?.length || 0} Replies</span>
                            </button>

                            {/* WhatsApp Share */}
                            <button
                              onClick={() => handleWhatsAppShare(post)}
                              style={{
                                background: '#eaf7e6',
                                border: '1px solid #a7e096',
                                color: '#2e7d32',
                                fontSize: 12.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px'
                              }}
                            >
                              <span>📲</span>
                              <span>Share</span>
                            </button>
                          </div>

                          {/* Message Author Shortcut */}
                          <button
                            type="button"
                            onClick={() => handleOpenDirectMessage(post.author, `Hi ${post.author.name}, asking regarding your post about ${post.cropTag}: `)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#2e7d32',
                              fontWeight: 800,
                              fontSize: 12.5,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>💬 Chat Farmer</span>
                          </button>
                        </div>

                        {/* Interactive Replies Section */}
                        {activeCommentPostId === post.id && (
                          <div style={{ marginTop: 14, borderTop: '1px solid #eaf7e6', paddingTop: 14, background: '#f8faf7', padding: 14, border: '1px solid #e3f3df' }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#2e7d32', marginBottom: 10, textTransform: 'uppercase' }}>
                              💬 Farmer Advice & Discussion ({post.comments?.length || 0})
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                              {post.comments && post.comments.length > 0 ? (
                                post.comments.map((comment) => {
                                  const cRegional = commentTranslations[comment.id]
                                  return (
                                    <div key={comment.id} style={{ background: '#ffffff', padding: '10px 14px', border: '1px solid #e3f3df' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#2e7d32' }}>{comment.author}</span>
                                        <span style={{ fontSize: 11, color: '#799080' }}>{comment.time}</span>
                                      </div>
                                      
                                      <p style={{ margin: 0, fontSize: 13, color: '#182c1d', fontWeight: 500, lineHeight: 1.5 }}>
                                        {comment.text}
                                      </p>

                                      {!isNone && cRegional && cRegional !== comment.text && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#2e7d32', fontWeight: 700 }}>
                                          {cRegional}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })
                              ) : (
                                <div style={{ fontSize: 12.5, color: '#799080', fontStyle: 'italic' }}>
                                  No replies yet. Share your experience or ask a question!
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                placeholder="Add your farming experience or answer..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id) }}
                                style={{ flex: 1, padding: '8px 14px', border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff' }}
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                style={{ padding: '8px 20px', background: '#2e7d32', color: '#ffffff', border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

        </div>

        {/* ========================================================================= */}
        {/* STORY VIEWER MODAL (Instagram-style Fullscreen Story with Progress Bar) */}
        {/* ========================================================================= */}
        {activeStoryModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}>
            <div style={{
              width: '100%',
              maxWidth: 460,
              background: '#111827',
              color: '#ffffff',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              overflow: 'hidden'
            }}>
              {/* Story Top Progress Bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'rgba(255, 255, 255, 0.3)', zIndex: 10 }}>
                <div style={{ height: '100%', width: `${storyProgress}%`, background: '#52b788', transition: 'width 0.08s linear' }} />
              </div>

              {/* Story Header */}
              <div style={{ position: 'absolute', top: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {activeStoryModal.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 900 }}>{activeStoryModal.farmerName}</div>
                    <div style={{ fontSize: 11, color: '#a7f3d0' }}>{activeStoryModal.village} • {activeStoryModal.timeAgo}</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryModal(null)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>

              {/* Story Image */}
              <div style={{ width: '100%', height: 480, overflow: 'hidden' }}>
                <img
                  src={activeStoryModal.previewImg}
                  alt={activeStoryModal.farmerName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Story Caption & Quick Direct Chat */}
              <div style={{ padding: 16, background: '#182c1d' }}>
                <div style={{ display: 'inline-block', background: '#2e7d32', color: '#ffffff', fontSize: 11, fontWeight: 900, padding: '2px 8px', marginBottom: 6 }}>
                  {activeStoryModal.cropTag}
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: 14, lineHeight: 1.5, color: '#f0fdf4' }}>
                  {activeStoryModal.caption}
                </p>

                {/* Quick Reaction & Message Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      alert(`Shabaash sent to ${activeStoryModal.farmerName}! 🌾`)
                    }}
                    style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                  >
                    🌾 Shabaash
                  </button>
                  <button
                    onClick={() => {
                      setActiveStoryModal(null)
                      handleOpenDirectMessage({ id: activeStoryModal.farmerId, name: activeStoryModal.farmerName, avatar: activeStoryModal.avatar }, `Saw your field moment: "${activeStoryModal.caption}"`)
                    }}
                    style={{ flex: 1, padding: '8px', background: '#2e7d32', border: 'none', color: '#ffffff', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}
                  >
                    💬 Chat Farmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* IN-APP KISAN MESSENGER (Facebook / LinkedIn Chat Drawer at Bottom Right) */}
        {/* ========================================================================= */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          right: 20,
          zIndex: 9000,
          width: messengerOpen ? (messengerExpanded ? 640 : 360) : 'auto',
          maxWidth: '92vw',
          boxShadow: messengerOpen ? '0 -4px 24px rgba(0, 0, 0, 0.2)' : 'none',
          transition: 'all 0.2s ease'
        }}>
          {/* Messenger Dock Bar (Minimised state) */}
          {!messengerOpen ? (
            <button
              onClick={() => setMessengerOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #1b4332 0%, #2e7d32 100%)',
                color: '#ffffff',
                border: '2px solid #74c69d',
                borderRadius: '0px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 14,
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                marginBottom: 10
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              <span>Kisan Messenger</span>
              {totalUnreadMessages > 0 && (
                <span style={{ background: '#ef4444', color: '#ffffff', fontSize: 11, fontWeight: 900, padding: '2px 7px', borderRadius: '10px' }}>
                  {totalUnreadMessages}
                </span>
              )}
            </button>
          ) : (
            /* Open Messenger Drawer */
            <div style={{
              background: '#ffffff',
              border: '2px solid #2e7d32',
              display: 'flex',
              flexDirection: 'column',
              height: messengerExpanded ? 580 : 460,
              maxHeight: '85vh'
            }}>
              {/* Messenger Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1b4332 0%, #2e7d32 100%)',
                color: '#ffffff',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 900, lineHeight: 1.2 }}>
                      {activeChat.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#a7f3d0' }}>
                      {activeChat.online ? '🟢 Online Now' : activeChat.lastSeen}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setMessengerExpanded(!messengerExpanded)}
                    title={messengerExpanded ? 'Shrink' : 'Expand'}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 14 }}
                  >
                    {messengerExpanded ? '🗗' : '🗖'}
                  </button>
                  <button
                    onClick={() => setMessengerOpen(false)}
                    title="Close Messenger"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body: Farmer Tabs & Active Chat Feed */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Farmer Contact List (shown in expanded mode or as top pill on mobile) */}
                {messengerExpanded && (
                  <div style={{ width: 220, borderRight: '1px solid #d8e5d6', background: '#f8faf7', overflowY: 'auto' }}>
                    <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 900, color: '#2e7d32', textTransform: 'uppercase', borderBottom: '1px solid #e2ece0' }}>
                      Active Farmers
                    </div>
                    {chats.map(chat => (
                      <div
                        key={chat.farmerId}
                        onClick={() => setActiveChatFarmerId(chat.farmerId)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #eef2ed',
                          cursor: 'pointer',
                          background: activeChatFarmerId === chat.farmerId ? '#eaf7e6' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{chat.avatar}</span>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#182c1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {chat.name}
                            </div>
                            <div style={{ fontSize: 10, color: chat.online ? '#2e7d32' : '#799080' }}>
                              {chat.online ? '🟢 Online' : 'Offline'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8faf7' }}>
                  {/* Active Farmer Mini-Banner if not expanded */}
                  {!messengerExpanded && (
                    <div style={{ display: 'flex', gap: 6, padding: '6px 10px', overflowX: 'auto', background: '#eef5ec', borderBottom: '1px solid #d8e5d6' }}>
                      {chats.map(chat => (
                        <button
                          key={chat.farmerId}
                          onClick={() => setActiveChatFarmerId(chat.farmerId)}
                          style={{
                            background: activeChatFarmerId === chat.farmerId ? '#2e7d32' : '#ffffff',
                            color: activeChatFarmerId === chat.farmerId ? '#ffffff' : '#182c1d',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {chat.avatar} {chat.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Messages Bubble Area */}
                  <div style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeChat.messages.map(msg => {
                      const isMe = msg.sender === 'me'
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '82%',
                            background: isMe ? '#2e7d32' : '#ffffff',
                            color: isMe ? '#ffffff' : '#182c1d',
                            padding: '8px 12px',
                            border: isMe ? 'none' : '1px solid #d8e5d6',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word' }}>
                            {msg.text}
                          </div>
                          <div style={{
                            fontSize: 9.5,
                            color: isMe ? '#d8f3dc' : '#799080',
                            marginTop: 4,
                            textAlign: 'right',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 4
                          }}>
                            <span>{msg.time}</span>
                            {isMe && <span>✓✓</span>}
                          </div>
                        </div>
                      )
                    })}

                    {chatIsTyping && (
                      <div style={{ alignSelf: 'flex-start', background: '#ffffff', padding: '6px 12px', border: '1px solid #d8e5d6', fontSize: 11, color: '#2e7d32', fontStyle: 'italic' }}>
                        ✍️ {activeChat.name} is typing agronomy advice...
                      </div>
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Quick Agri-Chips for Fast Questions */}
                  <div style={{ display: 'flex', gap: 6, padding: '6px 10px', overflowX: 'auto', background: '#ffffff', borderTop: '1px solid #e2ece0' }}>
                    <button
                      onClick={() => handleSendChatMessage('What fertilizer dose per acre did you use?')}
                      style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      🌱 Fertilizer dose?
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('What was your diesel consumption with the Super Seeder?')}
                      style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      🚜 Diesel per acre?
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('What benchmark mandi rate did you receive today?')}
                      style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      📈 Mandi rate?
                    </button>
                  </div>

                  {/* Input & Send Bar */}
                  <div style={{ padding: 10, background: '#ffffff', borderTop: '1px solid #d8e5d6', display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder={`Message ${activeChat.name.split(' ')[0]}...`}
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage() }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        fontSize: 13,
                        outline: 'none',
                        background: '#f8faf7'
                      }}
                    />
                    <button
                      onClick={() => handleSendChatMessage()}
                      disabled={!chatInputText.trim()}
                      style={{
                        padding: '8px 14px',
                        background: chatInputText.trim() ? '#2e7d32' : '#94a3b8',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 900,
                        cursor: chatInputText.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Send
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
