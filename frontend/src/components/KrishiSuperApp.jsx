import React, { useState, useEffect } from 'react'
import {
  Home,
  MessageSquare,
  ShoppingBag,
  Landmark,
  Mic,
  MicOff,
  CloudSun,
  Droplets,
  Wind,
  Plus,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Bell,
  Search,
  ShieldCheck,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  X,
  Filter,
  MapPin,
  Calendar,
  FileText,
  ArrowUpRight,
  Wrench,
  Sprout,
  Activity,
  CheckCircle2,
  DollarSign,
  Layers,
  Settings,
  LogOut,
  ChevronDown,
  Send,
  AlertTriangle,
  Tag,
  PhoneCall,
  UserCheck,
  Crown,
  Globe
} from 'lucide-react'
import { getCurrentFarmerUser, clearFarmerUserSession } from '../userSession'
import { REGIONAL_LANGUAGES, getDualCropName, playDualVoice } from '../languageHelper'

// Comprehensive Multi-Language Dictionary for KrishiSuperApp
const SUPERAPP_I18N = {
  en: {
    tagline: 'Unified Agricultural Operating & Social Platform',
    searchPlaceholder: 'Search mandi rates, crop diseases, schemes...',
    agriToolsSuite: 'Agri-Tools Suite',
    open12Tools: 'Open 12 Secondary Agri-Tools',
    accountSettings: 'Account & Farm Settings',
    saasProBenefits: 'SaaS Pro Benefits & Tier',
    switchAccount: 'Switch Account',
    signOut: 'Sign Out',
    homeAdvisory: 'Home / Advisory',
    homeAdvisorySub: 'Weather, soil, crop doctor',
    kisanSocial: 'Kisan Social Feed',
    kisanSocialSub: 'Community posts & queries',
    marketplace: 'Marketplace',
    marketplaceSub: 'Direct crop & produce trade',
    financeRecords: 'Finance & Records',
    financeRecordsSub: '4% KCC, DBT Subsidies, 7/12',
    haveDoubt: 'Have a crop doubt? Just speak!',
    doubtSub: 'Instant diagnosis & remedies in English, Hindi & regional languages.',
    askDoctorBtn: 'Ask Krishi AI Doctor',
    hyperlocalWeather: 'Hyperlocal Weather',
    sprayWindow: '✓ 48-hr Optimal Spray Window',
    radar: 'Radar →',
    allStreams: 'All Streams',
    farmerDiscussions: 'Farmer Discussions',
    cropListings: 'Crop Listings (Trade)',
    advisoryDoctor: 'Advisory & Doctor',
    noPosts: 'No posts in this category',
    viewAllPosts: 'View all posts',
    tradeLot: 'Trade Lot',
    cropClinic: 'Crop Clinic',
    advisory: 'Advisory',
    discussion: 'Discussion',
    quantity: 'Quantity',
    targetPrice: 'Target Price',
    location: 'Location',
    directConnect: 'Direct Connect / Offer',
    remedy: 'Remedy: ',
    replies: 'Replies',
    listen: 'Listen',
    playing: 'Playing...',
    share: 'Share',
    liveMandiBenchmarks: 'Live Mandi Benchmarks',
    pinnedCommodities: '4 Pinned Commodities',
    allMandiRates: 'All 120+ →',
    govtSchemes: 'Govt Schemes & Subsidies',
    viewAllSchemes: 'View All 20+ Govt Subsidies',
    kisanCallCenter: 'Kisan Call Center Helpline',
    voiceAgronomist: 'Krishi AI Voice Agronomist',
    speakNaturally: 'Speak naturally in English, Hindi or your regional language',
    yourQuery: 'Your query:',
    speakAgain: 'Speak Again',
    done: 'Done',
    listening: 'Listening... Ask about pest cure, mandi price, or weather',
    verifiedProducer: 'Verified Producer',
    seniorAgronomist: 'Senior Agronomist',
    naturalLeader: 'Natural Farming Leader',
    kisanMember: 'Kisan Member',
    publishedJustNow: 'Just now',
    publishPost: 'Publish to Kisan Feed',
    selectLanguageModal: 'Select Application Language'
  },
  hi: {
    tagline: 'भारतीय किसानों का एकीकृत डिजिटल कृषि मंच',
    searchPlaceholder: 'मंडी भाव, फसल रोग, या सरकारी योजनाएं खोजें...',
    agriToolsSuite: 'कृषि उपकरण सुइट',
    open12Tools: 'सभी 12 कृषि उपकरण खोलें',
    accountSettings: 'खाता व खेत सेटिंग्स',
    saasProBenefits: 'सास प्रो सदस्यता लाभ व विवरण',
    switchAccount: 'खाता बदलें',
    signOut: 'लॉग आउट',
    homeAdvisory: 'होम व फसल सलाह',
    homeAdvisorySub: 'मौसम, मिट्टी, फसल डॉक्टर',
    kisanSocial: 'किसान सोशल फीड',
    kisanSocialSub: 'किसान समुदाय और अनुभव',
    marketplace: 'मार्केटप्लेस (क्रय-विक्रय)',
    marketplaceSub: 'फसल उपज की सीधी बिक्री',
    financeRecords: 'वित्त व भूमि रिकॉर्ड',
    financeRecordsSub: '4% केसीसी, डीबीटी सब्सिडी, 7/12',
    haveDoubt: 'फसल में कोई समस्या? बस बोलें!',
    doubtSub: 'हिंदी, अंग्रेज़ी व अन्य भाषाओं में तुरंत रोग निदान और सलाह पाएं।',
    askDoctorBtn: 'कृषि एआई डॉक्टर से पूछें',
    hyperlocalWeather: 'स्थानीय मौसम सूचना',
    sprayWindow: '✓ 48 घंटे कीटनाशक छिड़काव हेतु अनुकूल',
    radar: 'राडार →',
    allStreams: 'सभी (All Feeds)',
    farmerDiscussions: 'किसान चर्चाएं',
    cropListings: 'फसल बिक्री सूची',
    advisoryDoctor: 'विशेषज्ञ सलाह',
    noPosts: 'इस श्रेणी में कोई पोस्ट नहीं है',
    viewAllPosts: 'सभी पोस्ट देखें',
    tradeLot: 'बिक्री लॉट',
    cropClinic: 'फसल क्लिनिक',
    advisory: 'सलाह',
    discussion: 'किसान चर्चा',
    quantity: 'मात्रा',
    targetPrice: 'अपेक्षित भाव',
    location: 'स्थान',
    directConnect: 'सीधा संपर्क / प्रस्ताव',
    remedy: 'सिफारिश उपचार: ',
    replies: 'प्रतिक्रियाएं',
    listen: 'सुनें',
    playing: 'सुनाई दे रहा है...',
    share: 'शेयर',
    liveMandiBenchmarks: 'लाइव मंडी भाव',
    pinnedCommodities: '4 मुख्य फसलें',
    allMandiRates: 'सभी 120+ →',
    govtSchemes: 'सरकारी योजनाएं व सब्सिडी',
    viewAllSchemes: 'सभी 20+ सरकारी योजनाएं देखें',
    kisanCallCenter: 'किसान कॉल सेंटर हेल्पलाइन',
    voiceAgronomist: 'कृषि एआई वॉयस एग्रोनॉमिस्ट',
    speakNaturally: 'अपनी भाषा में बोलें और तुरंत उपचार पाएं',
    yourQuery: 'आपका प्रश्न:',
    speakAgain: 'फिर से बोलें',
    done: 'पूर्ण',
    listening: 'सुन रहे हैं... फसल कीट, मंडी भाव या मौसम के बारे में पूछें',
    verifiedProducer: 'सत्यापित किसान',
    seniorAgronomist: 'वरिष्ठ कृषि वैज्ञानिक',
    naturalLeader: 'प्राकृतिक खेती प्रमुख',
    kisanMember: 'किसान सदस्य',
    publishedJustNow: 'अभी-अभी',
    publishPost: 'किसान फीड में पोस्ट करें',
    selectLanguageModal: 'भाषा का चयन करें'
  },
  te: {
    tagline: 'భారతీయ రైతుల సమగ్ర డిజిటల్ ప్లాట్‌ఫారమ్',
    searchPlaceholder: 'పంట ధరలు, తెగుళ్ల మందులు, లేదా పథకాలను వెతకండి...',
    agriToolsSuite: 'వ్యవసాయ సాధనాలు',
    open12Tools: 'అన్ని 12 వ్యవసాయ సాధనాలు చూడండి',
    accountSettings: 'ఖాతా & వ్యవసాయ సెట్టింగ్‌లు',
    saasProBenefits: 'SaaS సభ్యత్వ వివరాలు & ప్రయోజనాలు',
    switchAccount: 'ఖాతా మార్చండి',
    signOut: 'లాగ్ అవుట్',
    homeAdvisory: 'హోమ్ & పంట సలహాలు',
    homeAdvisorySub: 'వాతావరణం, సాయిల్, పంట డాక్టర్',
    kisanSocial: 'కిసాన్ సోషల్ ఫీడ్',
    kisanSocialSub: 'రైతుల సంఘం & అనుభవాలు',
    marketplace: 'మార్కెట్‌ప్లేస్ (కొనుగోలు & విక్రయం)',
    marketplaceSub: 'పంట ధాన్యాల నేరుగా అమ్మకాలు',
    financeRecords: 'ఆర్థికం & భూ రికార్డులు',
    financeRecordsSub: '4% KCC, DBT సబ్సిడీలు, 7/12',
    haveDoubt: 'ఏదైనా సందేహం ఉందా? మాట్లాడండి!',
    doubtSub: 'తెలుగు మరియు ఇతర భాషల్లో తక్షణ రోగ నిర్ధారణ & సలహా పొందండి.',
    askDoctorBtn: 'కృషి AI తో మాట్లాడండి',
    hyperlocalWeather: 'వాతావరణ సమాచారం',
    sprayWindow: '✓ 48 గంటలు మందు పిచికారీకి అనుకూలం',
    radar: 'రాడార్ →',
    allStreams: 'అన్నీ (All Feeds)',
    farmerDiscussions: 'రైతుల చర్చలు',
    cropListings: 'పంట అమ్మకాలు',
    advisoryDoctor: 'నిపుణుల సలహాలు',
    noPosts: 'ఈ విభాగంలో పోస్టులు లేవు',
    viewAllPosts: 'అన్ని పోస్టులను వీక్షించండి',
    tradeLot: 'అమ్మకం లాట్',
    cropClinic: 'రోగ నిర్ధారణ',
    advisory: 'అధికారిక సలహా',
    discussion: 'రైతు చర్చ',
    quantity: 'పరిమాణం',
    targetPrice: 'కోరుతున్న ధర',
    location: 'లొకేషన్',
    directConnect: 'నేరుగా సంప్రదించండి',
    remedy: 'సిఫార్సు చికిత్స: ',
    replies: 'వ్యాఖ్యలు',
    listen: 'వినండి',
    playing: 'వింటున్నారు...',
    share: 'షేర్',
    liveMandiBenchmarks: 'ప్రత్యక్ష మార్కెట్ ధరలు',
    pinnedCommodities: '4 ముఖ్యమైన పంటలు',
    allMandiRates: 'అన్ని 120+ →',
    govtSchemes: 'ప్రభుత్వ పథకాలు & DBT',
    viewAllSchemes: 'అన్ని 20+ పథకాల డైరెక్టరీ',
    kisanCallCenter: 'కిసాన్ కాల్ సెంటర్',
    voiceAgronomist: 'కృషి AI వాయిస్ అగ్రోనమిస్ట్',
    speakNaturally: 'మీ భాషలో మాట్లాడండి, తక్షణ నివారణ పొందండి',
    yourQuery: 'మీరు అడిగిన ప్రశ్న:',
    speakAgain: 'మళ్ళీ మాట్లాడండి',
    done: 'ముగించు',
    listening: 'వినబడుతోంది... మీ పంట సమస్యను చెప్పండి',
    verifiedProducer: 'ధృవీకరించబడిన రైతు',
    seniorAgronomist: 'వ్యవసాయ శాస్త్రవేత్త',
    naturalLeader: 'ప్రకృతి వ్యవసాయ నాయకుడు',
    kisanMember: 'కిసాన్ సభ్యుడు',
    publishedJustNow: 'ఇప్పుడే',
    publishPost: 'పోస్ట్ ప్రచురించండి',
    selectLanguageModal: 'భాషను ఎంచుకోండి'
  },
  ta: {
    tagline: 'இந்திய விவசாயிகளுக்கான ஒருங்கிணைந்த டிஜிட்டல் தளம்',
    searchPlaceholder: 'சந்தை விலைகள், பயிர் நோய்கள் அல்லது திட்டங்களைத் தேடுங்கள்...',
    agriToolsSuite: 'விவசாயக் கருவிகள்',
    open12Tools: 'அனைத்து 12 விவசாயக் கருவிகளைத் திறக்கவும்',
    accountSettings: 'கணக்கு மற்றும் பண்ணை அமைப்புகள்',
    saasProBenefits: 'சாஸ் ப்ரோ உறுப்பினர் பலன்கள்',
    switchAccount: 'கணக்கை மாற்றவும்',
    signOut: 'வெளியேறு',
    homeAdvisory: 'முகப்பு மற்றும் பயிர் ஆலோசனை',
    homeAdvisorySub: 'வானிலை, மண், பயிர் மருத்துவர்',
    kisanSocial: 'விவசாயி சமூக ஊடகம்',
    kisanSocialSub: 'சமூக பதிவுகள் மற்றும் கேள்விகள்',
    marketplace: 'சந்தை (வாங்குதல் மற்றும் விற்பனை)',
    marketplaceSub: 'நேரடி பயிர் வர்த்தகம்',
    financeRecords: 'நிதி மற்றும் நில பதிவுகள்',
    financeRecordsSub: '4% KCC, DBT மானியங்கள், 7/12',
    haveDoubt: 'பயிரில் சந்தேகமா? பேசுங்கள்!',
    doubtSub: 'தமிழ், ஆங்கிலம் மற்றும் பிற மொழிகளில் உடனடி தீர்வு பெறுங்கள்.',
    askDoctorBtn: 'கிருஷி AI மருத்துவரிடம் கேளுங்கள்',
    hyperlocalWeather: 'உள்ளூர் வானிலை தகவல்',
    sprayWindow: '✓ 48 மணிநேர உகந்த தெளிப்பு நேரம்',
    radar: 'ரேடார் →',
    allStreams: 'அனைத்தும் (All Streams)',
    farmerDiscussions: 'விவசாயிகள் கலந்துரையாடல்',
    cropListings: 'பயிர் விற்பனை பட்டியல்',
    advisoryDoctor: 'நிபுணர் ஆலோசனை',
    noPosts: 'இந்த பிரிவில் பதிவுகள் இல்லை',
    viewAllPosts: 'அனைத்து பதிவுகளையும் காண்க',
    tradeLot: 'விற்பனை லாட்',
    cropClinic: 'பயிர் மருத்துவமனை',
    advisory: 'ஆலோசனை',
    discussion: 'விவசாயி கலந்துரையாடல்',
    quantity: 'அளவு',
    targetPrice: 'எதிர்பார்க்கும் விலை',
    location: 'இடம்',
    directConnect: 'நேரடி தொடர்பு / சலுகை',
    remedy: 'பரிந்துரைக்கப்பட்ட சிகிச்சை: ',
    replies: 'பதில்கள்',
    listen: 'கேளுங்கள்',
    playing: 'ஒலிக்கிறது...',
    share: 'பகிர்',
    liveMandiBenchmarks: 'நேரலை சந்தை விலைகள்',
    pinnedCommodities: '4 முக்கிய பயிர்கள்',
    allMandiRates: 'அனைத்து 120+ →',
    govtSchemes: 'அரசு திட்டங்கள் & மானியங்கள்',
    viewAllSchemes: 'அனைத்து 20+ திட்டங்களையும் காண்க',
    kisanCallCenter: 'விவசாயி உதவி மையம்',
    voiceAgronomist: 'கிருஷி AI குரல் வேளாண் நிபுணர்',
    speakNaturally: 'உங்கள் மொழியில் பேசி உடனடி தீர்வு பெறுங்கள்',
    yourQuery: 'உங்கள் கேள்வி:',
    speakAgain: 'மீண்டும் பேசுங்கள்',
    done: 'முடிந்தது',
    listening: 'கேட்கிறது... பயிர் பூச்சி, சந்தை விலை அல்லது வானிலை பற்றி கேளுங்கள்',
    verifiedProducer: 'சரிபார்க்கப்பட்ட விவசாயி',
    seniorAgronomist: 'முதுநிலை வேளாண் விஞ்ஞானி',
    naturalLeader: 'இயற்கை விவசாய தலைவர்',
    kisanMember: 'விவசாயி உறுப்பினர்',
    publishedJustNow: 'சற்று முன்',
    publishPost: 'பதிவை வெளியிடுங்கள்',
    selectLanguageModal: 'மொழியைத் தேர்ந்தெடுக்கவும்'
  },
  kn: {
    tagline: 'ಭಾರತೀಯ ರೈತರ ಸಮಗ್ರ ಡಿಜಿಟಲ್ ವೇದಿಕೆ',
    searchPlaceholder: 'ಮಾರುಕಟ್ಟೆ ದರಗಳು, ಬೆಳೆ ರೋಗಗಳು ಅಥವಾ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ...',
    agriToolsSuite: 'ಕೃಷಿ ಉಪಕರಣಗಳು',
    open12Tools: 'ಎಲ್ಲಾ 12 ಕೃಷಿ ಉಪಕರಣಗಳನ್ನು ತೆರೆಯಿರಿ',
    accountSettings: 'ಖಾತೆ ಮತ್ತು ಕೃಷಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    saasProBenefits: 'SaaS ಪ್ರೊ ಸದಸ್ಯತ್ವ ವಿವರಗಳು',
    switchAccount: 'ಖಾತೆ ಬದಲಾಯಿಸಿ',
    signOut: 'ಸೈನ್ ಔಟ್',
    homeAdvisory: 'ಮುಖಪುಟ ಮತ್ತು ಬೆಳೆ ಸಲಹೆ',
    homeAdvisorySub: 'ಹವಾಮಾನ, ಮಣ್ಣು, ಬೆಳೆ ವೈದ್ಯ',
    kisanSocial: 'ಕಿಸಾನ್ ಸಾಮಾಜಿಕ ಫೀಡ್',
    kisanSocialSub: 'ರೈತರ ಸಮುದಾಯ ಮತ್ತು ಚರ್ಚೆಗಳು',
    marketplace: 'ಮಾರುಕಟ್ಟೆ (ಖರೀದಿ ಮತ್ತು ಮಾರಾಟ)',
    marketplaceSub: 'ನೇರ ಬೆಳೆ ವ್ಯಾಪಾರ',
    financeRecords: 'ಹಣಕಾಸು ಮತ್ತು ಭೂ ದಾಖಲೆಗಳು',
    financeRecordsSub: '4% KCC, DBT ಸಬ್ಸಿಡಿಗಳು, 7/12',
    haveDoubt: 'ಬೆಳೆಯ ಬಗ್ಗೆ ಸಂದೇಹವಿದೆಯೇ? ಮಾತನಾಡಿ!',
    doubtSub: 'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಇತರ ಭಾಷೆಗಳಲ್ಲಿ ತಕ್ಷಣದ ರೋಗ ಪತ್ತೆ ಮತ್ತು ಪರಿಹಾರ ಪಡೆಯಿರಿ.',
    askDoctorBtn: 'ಕೃಷಿ AI ವೈದ್ಯರನ್ನು ಕೇಳಿ',
    hyperlocalWeather: 'ಸ್ಥಳೀಯ ಹವಾಮಾನ ಮಾಹಿತಿ',
    sprayWindow: '✓ 48 ಗಂಟೆಗಳ ಔಷಧ ಸಿಂಪಡಣೆಗೆ ಸೂಕ್ತ ಸಮಯ',
    radar: 'ರಾಡಾರ್ →',
    allStreams: 'ಎಲ್ಲವೂ (All Streams)',
    farmerDiscussions: 'ರೈತರ ಚರ್ಚೆಗಳು',
    cropListings: 'ಬೆಳೆ ಮಾರಾಟ ಪಟ್ಟಿ',
    advisoryDoctor: 'ತಜ್ಞರ ಸಲಹೆ',
    noPosts: 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಪೋಸ್ಟ್‌ಗಳಿಲ್ಲ',
    viewAllPosts: 'ಎಲ್ಲಾ ಪೋಸ್ಟ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    tradeLot: 'ಮಾರಾಟ ಲಾಟ್',
    cropClinic: 'ಬೆಳೆ ಕ್ಲಿನಿಕ್',
    advisory: 'ಸಲಹೆ',
    discussion: 'ರೈತರ ಚರ್ಚೆ',
    quantity: 'ಪ್ರಮಾಣ',
    targetPrice: 'ನಿರೀಕ್ಷಿತ ದರ',
    location: 'ಸ್ಥಳ',
    directConnect: 'ನೇರ ಸಂಪರ್ಕ / ಆಫರ್',
    remedy: 'ಶಿಫಾರಸು ಮಾಡಿದ ಚಿಕಿತ್ಸೆ: ',
    replies: 'ಪ್ರತಿಕ್ರಿಯೆಗಳು',
    listen: 'ಕೇಳಿ',
    playing: 'ಪ್ಲೇ ಆಗುತ್ತಿದೆ...',
    share: 'ಹಂಚಿಕೊಳ್ಳಿ',
    liveMandiBenchmarks: 'ಲೈವ್ ಮಾರುಕಟ್ಟೆ ದರಗಳು',
    pinnedCommodities: '4 ಪ್ರಮುಖ ಬೆಳೆಗಳು',
    allMandiRates: 'ಎಲ್ಲಾ 120+ →',
    govtSchemes: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಸಬ್ಸಿಡಿ',
    viewAllSchemes: 'ಎಲ್ಲಾ 20+ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ',
    kisanCallCenter: 'ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್',
    voiceAgronomist: 'ಕೃಷಿ AI ಧ್ವನಿ ಕೃಷಿ ತಜ್ಞ',
    speakNaturally: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಮತ್ತು ತಕ್ಷಣದ ಪರಿಹಾರ ಪಡೆಯಿರಿ',
    yourQuery: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ:',
    speakAgain: 'ಮತ್ತೆ ಮಾತನಾಡಿ',
    done: 'ಮುಗಿದಿದೆ',
    listening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ... ಬೆಳೆ ಕೀಟ, ಮಾರುಕಟ್ಟೆ ದರ ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ಕೇಳಿ',
    verifiedProducer: 'ಪರಿಶೀಲಿಸಿದ ರೈತ',
    seniorAgronomist: 'ಹಿರಿಯ ಕೃಷಿ ವಿಜ್ಞಾನಿ',
    naturalLeader: 'ನೈಸರ್ಗಿಕ ಕೃಷಿ ನಾಯಕ',
    kisanMember: 'ಕಿಸಾನ್ ಸದಸ್ಯ',
    publishedJustNow: 'ಈಗಷ್ಟೇ',
    publishPost: 'ಪೋಸ್ಟ್ ಪ್ರಕಟಿಸಿ',
    selectLanguageModal: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ'
  },
  mr: {
    tagline: 'भारतीय शेतकऱ्यांचे एकात्मिक डिजिटल कृषी मंच',
    searchPlaceholder: 'बाजार भाव, पीक रोग किंवा सरकारी योजना शोधा...',
    agriToolsSuite: 'कृषी साधने',
    open12Tools: 'सर्व 12 कृषी साधने उघडा',
    accountSettings: 'खाते आणि शेती सेटिंग्ज',
    saasProBenefits: 'सास प्रो सदस्यत्व लाभ',
    switchAccount: 'खाते बदला',
    signOut: 'साइन आउट',
    homeAdvisory: 'होम आणि पीक सल्ला',
    homeAdvisorySub: 'हवामान, माती, पीक डॉक्टर',
    kisanSocial: 'किसान सोशल फीड',
    kisanSocialSub: 'शेतकरी समुदाय आणि अनुभव',
    marketplace: 'मार्केटप्लेस (खरेदी-विक्री)',
    marketplaceSub: 'थेट शेतमाल विक्री',
    financeRecords: 'वित्त आणि जमीन नोंदी',
    financeRecordsSub: '4% KCC, DBT सबसिडी, 7/12',
    haveDoubt: 'पिकात समस्या आहे? फक्त बोला!',
    doubtSub: 'मराठी, हिंदी आणि इंग्रजीत त्वरित रोग निदान आणि उपाय मिळवा.',
    askDoctorBtn: 'कृषी AI डॉक्टरला विचारा',
    hyperlocalWeather: 'स्थानिक हवामान माहिती',
    sprayWindow: '✓ 48 तास फवारणीसाठी अनुकूल वेळ',
    radar: 'रडार →',
    allStreams: 'सर्व (All Streams)',
    farmerDiscussions: 'शेतकरी चर्चा',
    cropListings: 'पीक विक्री यादी',
    advisoryDoctor: 'तज्ज्ञ सल्ला',
    noPosts: 'या श्रेणीत कोणतीही पोस्ट नाही',
    viewAllPosts: 'सर्व पोस्ट पहा',
    tradeLot: 'विक्री लॉट',
    cropClinic: 'पीक क्लिनिक',
    advisory: 'सल्ला',
    discussion: 'शेतकरी चर्चा',
    quantity: 'प्रमाण',
    targetPrice: 'अपेक्षित भाव',
    location: 'स्थान',
    directConnect: 'थेट संपर्क साधा',
    remedy: 'शिफारस केलेले उपचार: ',
    replies: 'प्रतिक्रिया',
    listen: 'ऐका',
    playing: 'चालू आहे...',
    share: 'शेअर',
    liveMandiBenchmarks: 'थेट बाजार भाव',
    pinnedCommodities: '4 मुख्य पिके',
    allMandiRates: 'सर्व 120+ →',
    govtSchemes: 'सरकारी योजना व सबसिडी',
    viewAllSchemes: 'सर्व 20+ योजना पहा',
    kisanCallCenter: 'किसान कॉल सेंटर',
    voiceAgronomist: 'कृषी AI व्हॉइस ॲग्रोनॉमिस्ट',
    speakNaturally: 'आपल्या भाषेत बोला आणि त्वरित उपाय मिळवा',
    yourQuery: 'आपला प्रश्न:',
    speakAgain: 'पुन्हा बोला',
    done: 'झाले',
    listening: 'ऐकत आहे... पीक कीड, बाजार भाव किंवा हवामानाबद्दल विचारा',
    verifiedProducer: 'प्रमाणित शेतकरी',
    seniorAgronomist: 'वरिष्ठ कृषी शास्त्रज्ञ',
    naturalLeader: 'नैसर्गिक शेती प्रमुख',
    kisanMember: 'शेतकरी सदस्य',
    publishedJustNow: 'आत्ताच',
    publishPost: 'पोस्ट प्रकाशित करा',
    selectLanguageModal: 'भाषा निवडा'
  }
}

function getI18n(lang) {
  const code = (lang === 'none' || !lang) ? 'en' : lang
  return SUPERAPP_I18N[code] || SUPERAPP_I18N.en
}

// Helper to generate proportionally exact SVG sparkline coordinates based on true percentage changes
function getSparklinePoints(sparklineData, width = 100, height = 20, maxPctScale = 5.0) {
  if (!sparklineData || sparklineData.length < 2) return '0,10 100,10'
  const initial = sparklineData[0] || 1
  const step = width / (sparklineData.length - 1)
  const midY = height / 2 // Neutral baseline
  const maxVisualRange = (height / 2) - 2 // Maximum vertical pixel deflection from baseline

  return sparklineData
    .map((val, idx) => {
      const x = (idx * step).toFixed(1)
      const pctChange = ((val - initial) / initial) * 100
      // Clamped deflection: positive pct decreases Y (rises up), negative increases Y (goes down)
      const deflection = (pctChange / maxPctScale) * maxVisualRange
      const y = Math.max(2, Math.min(height - 2, midY - deflection)).toFixed(1)
      return `${x},${y}`
    })
    .join(' ')
}

function getSparklineArea(sparklineData, width = 100, height = 20, maxPctScale = 5.0) {
  const linePoints = getSparklinePoints(sparklineData, width, height, maxPctScale)
  return `0,${height} ${linePoints} ${width},${height}`
}

// Clean Pinned benchmark crop data with mathematically exact historical price arrays
const PINNED_CROPS = [
  {
    id: 'chilli',
    symbol: 'CHILLI',
    enName: 'Dry Red Chilli',
    variety: 'Teja S17',
    price: 17200,
    unit: 'Qtl',
    change: +4.2,
    trend: 'up',
    sparkline: [16507, 16620, 16750, 16890, 17050, 17200],
    mandi: 'Guntur APMC'
  },
  {
    id: 'cotton',
    symbol: 'COTTON',
    enName: 'Raw Cotton',
    variety: 'Shankar-6 Medium',
    price: 7450,
    unit: 'Qtl',
    change: +3.1,
    trend: 'up',
    sparkline: [7226, 7260, 7295, 7340, 7390, 7450],
    mandi: 'Warangal APMC'
  },
  {
    id: 'wheat',
    symbol: 'WHEAT',
    enName: 'Wheat',
    variety: 'Sharbati Lokwan',
    price: 2475,
    unit: 'Qtl',
    change: +1.8,
    trend: 'up',
    sparkline: [2431, 2440, 2445, 2455, 2465, 2475],
    mandi: 'Indore APMC'
  },
  {
    id: 'paddy',
    symbol: 'RICE',
    enName: 'Paddy Basmati',
    variety: 'Pusa 1121',
    price: 3850,
    unit: 'Qtl',
    change: -0.6,
    trend: 'down',
    sparkline: [3873, 3870, 3865, 3860, 3855, 3850],
    mandi: 'Eluru APMC'
  }
]

// Initial Unified Feed items with complete multilingual translations
const INITIAL_FEED = [
  {
    id: 1,
    type: 'trade',
    author: {
      name: 'Rambabu Varma',
      village: 'Kaikalur, Eluru Dist',
      state: 'Andhra Pradesh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      badgeKey: 'verifiedProducer'
    },
    time: '25 mins ago',
    title: '40 Quintals BPT 5204 (Sona Masuri) Ready for Harvest Sale',
    content: 'Paddy grain moisture certified at 12.5%. Zero pesticide residues in last 3 weeks. Available for direct farm-gate inspection or APMC weighment. Asking ₹2,650/qtl negotiable for bulk millers.',
    translations: {
      hi: {
        title: '40 क्विंटल बीपीटी 5204 (सोना मसूरी) धान बिक्री हेतु तैयार',
        content: 'धान की नमी 12.5% प्रमाणित है। पिछले 3 हफ्तों में कोई कीटनाशक नहीं छिड़का गया। फार्म गेट निरीक्षण या मंडी तौल उपलब्ध है। अपेक्षित भाव ₹2,650/क्विंटल।'
      },
      te: {
        title: '40 క్వింటాళ్ల BPT 5204 సోనా మసూరి వరి విక్రయానికి సిద్ధంగా ఉంది',
        content: 'వరి ధాన్యంలో తేమ 12.5% ఉంది. గత 3 వారాల్లో పురుగుమందులు వాడలేదు. మిల్లు యజమానులు నేరుగా పొలం వద్ద పరిశీలించవచ్చు. ధర క్వింటాలుకు ₹2,650.'
      },
      ta: {
        title: '40 குவிண்டால் சோனா மசூரி நெல் அறுவடை விற்பனைக்கு தயார்',
        content: 'நெல் தானிய ஈரப்பதம் 12.5% சான்றளிக்கப்பட்டது. கடந்த 3 வாரங்களில் பூச்சிக்கொல்லி எச்சங்கள் இல்லை. நேரடி ஆய்வு செய்யலாம். விலை குவிண்டாலுக்கு ₹2,650.'
      },
      kn: {
        title: '40 ಕ್ವಿಂಟಾಲ್ ಸೋನಾ ಮಸೂರಿ ಭತ್ತ ಕೊಯ್ಲು ಮಾರಾಟಕ್ಕೆ ಸಿದ್ಧವಾಗಿದೆ',
        content: 'ಭತ್ತದ ಧಾನ್ಯದ ತೇವಾಂಶ 12.5% ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ. ನೇರ ಪರಿಶೀಲನೆಗೆ ಲಭ್ಯವಿದೆ. ಕ್ವಿಂಟಾಲ್‌ಗೆ ₹2,650 ದರ.'
      },
      mr: {
        title: '40 क्विंटल सोना मसुरी धान विक्रीसाठी तयार',
        content: 'धान्य ओलावा 12.5% प्रमाणित आहे. थेट शेतातून पाहणी उपलब्ध. अपेक्षित दर ₹2,650/क्विंटल.'
      }
    },
    tags: ['Crop Sale', 'Paddy', 'Eluru Mandi'],
    cropDetails: {
      crop: 'Paddy (BPT 5204)',
      quantity: '40 Quintals',
      price: '₹2,650 / Qtl',
      lotLocation: 'Kaikalur Farmgate'
    },
    likes: 18,
    isLiked: false,
    comments: 4,
    hasVoice: true
  },
  {
    id: 2,
    type: 'disease',
    author: {
      name: 'Suresh Reddy',
      village: 'Nandyal',
      state: 'Andhra Pradesh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      badgeKey: 'kisanMember'
    },
    time: '2 hours ago',
    title: 'Yellowing Leaf Tip on Chilli Crop - Urgent Diagnosis Needed',
    content: 'Noticed curling and chlorosis on 2nd-tier leaves after heavy fog 3 nights ago. Is this Thrips or early bacterial spot? Please advise bio-friendly remedies.',
    translations: {
      hi: {
        title: 'मिर्च की पत्तियों के सिरे पीले पड़ रहे हैं - तत्काल समाधान चाहिए',
        content: '3 रात पहले पड़े घने कोहरे के बाद पत्तियों में मरोड़ और पीलापन देखा गया। क्या यह थ्रिप्स है या जीवाणु धब्बा? कृपया जैविक उपचार बताएं।'
      },
      te: {
        title: 'మిర్చి ఆకుల చివర్లు పసుపు రంగులోకి మారుతున్నాయి - సలహా కావాలి',
        content: 'మూడు రోజుల క్రితం కురిసిన మంచు వల్ల మిర్చి ఆకులు ముడుచుకుపోతున్నాయి. ఇది తామర పురుగు దాడా లేక బ్యాక్టీరియా తెగులా? నివారణ తెలపండి.'
      },
      ta: {
        title: 'மிளகாய் இலை நுனிகள் மஞ்சள் நிறமாக மாறுகிறது - உடனடி ஆலோசனை தேவை',
        content: 'இலை சுருட்டல் மற்றும் மஞ்சள் நிறம் காணப்படுகிறது. இது அசுவினி தாக்குதலா? தயவுசெய்து இயற்கை மருந்துகளை பரிந்துரைக்கவும்.'
      },
      kn: {
        title: 'ಮೆಣಸಿನಕಾಯಿ ಎಲೆಗಳ ತುದಿ ಹಳದಿಯಾಗುತ್ತಿದೆ - ತುರ್ತು ಸಲಹೆ ಬೇಕು',
        content: 'ಎಲೆಗಳು ಮುದುಡಿಕೊಳ್ಳುತ್ತಿವೆ ಮತ್ತು ಹಳದಿಯಾಗುತ್ತಿವೆ. ಜೈವಿಕ ಪರಿಹಾರಗಳನ್ನು ಸೂಚಿಸಿ.'
      },
      mr: {
        title: 'मिरचीच्या पानांचे टोक पिवळे पडत आहेत - त्वरित उपाय सुचवा',
        content: 'पाने आकसणे आणि पिवळेपणा दिसून येत आहे. थ्रिप्स किंवा जीवाणू डाग आहे का? जैविक उपाय सांगा.'
      }
    },
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910a473?w=600&auto=format&fit=crop&q=80',
    aiDiagnosis: {
      confidence: '91% High Confidence',
      disease: 'Chilli Thrips & Minor Die-back',
      treatment: 'Spray Neem Oil (10,000 PPM) @ 3ml/L or Spinosad 45% SC @ 0.3ml/L in evening hours.',
      translations: {
        hi: 'शाम के समय नीम तेल (10,000 PPM) @ 3ml/L या स्पिनोसाड 45% SC @ 0.3ml/L का छिड़काव करें।',
        te: 'సాయంత్రం వేళల్లో వేప నూనె (10,000 PPM) 3 మి.లీ/లీ లేదా స్పినోసాడ్ 45% SC 0.3 మి.లీ/లీ నీటిలో కలిపి పిచికారీ చేయండి.',
        ta: 'மாலை நேரங்களில் வேப்பெண்ணெய் (10,000 PPM) 3 மிலி/லிட்டர் தெளிக்கவும்.',
        kn: 'ಸಂಜೆ ವೇಳೆ ಬೇವಿನ ಎಣ್ಣೆ (10,000 PPM) 3 ಮಿಲಿ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.',
        mr: 'संध्याकाळी कडुनिंब तेल (10,000 PPM) @ 3 मिली/लिटर फवारणी करा.'
      }
    },
    tags: ['Crop Doctor', 'Chilli', 'Pest Alert'],
    likes: 34,
    isLiked: true,
    comments: 12,
    hasVoice: true
  },
  {
    id: 3,
    type: 'advisory',
    author: {
      name: 'Dr. M. Venkat Rao',
      village: 'Regional Agri Research Station',
      state: 'Lam, Guntur',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badgeKey: 'seniorAgronomist'
    },
    time: '4 hours ago',
    title: 'Cotton Spray Window Alert: Low Humidity Window for 48 Hours',
    content: 'Forecast indicates calm wind (<9 km/h) and moderate temperature (30°C) across Krishna-Godavari delta. Ideal timing for micro-nutrient booster sprays (Boron + Zinc). Avoid nitrogen overdosing.',
    translations: {
      hi: {
        title: 'कपास किसानों हेतु अलर्ट: अगले 48 घंटे छिड़काव के लिए उत्तम',
        content: 'हवा की गति शांत (<9 किमी/घंटा) और तापमान अनुकूल रहेगा। सूक्ष्म पोषक तत्वों (बोरॉन + जिंक) के छिड़काव का यह सबसे सही समय है। अतिरिक्त यूरिया से बचें।'
      },
      te: {
        title: 'పత్తి రైతులకు హెచ్చరిక: రాబోయే 48 గంటలు మందు పిచికారీకి అనుకూలం',
        content: 'కృష్ణా-గోదావరి డెల్టాలో గాలుల వేగం తక్కువగా ఉంటుంది. సూక్ష్మపోషకాలైన బోరాన్, జింక్ పిచికారీ చేయడానికి ఇది సరైన సమయం. అధిక నత్రజని వాడవద్దు.'
      },
      ta: {
        title: 'பருத்தி விவசாயிகளுக்கு எச்சரிக்கை: அடுத்த 48 மணிநேரம் மருந்து தெளிக்க ஏற்றது',
        content: 'நுண்ணூட்டச்சத்துக்கள் (போரான் + துத்தநாகம்) தெளிக்க இது சரியான நேரம். அதிகப்படியான நைட்ரஜனை தவிர்க்கவும்.'
      },
      kn: {
        title: 'ಹತ್ತಿ ಬೆಳೆಗಾರರಿಗೆ ಎಚ್ಚರಿಕೆ: ಮುಂದಿನ 48 ಗಂಟೆಗಳು ಸಿಂಪರಣೆಗೆ ಸೂಕ್ತ',
        content: 'ಲಘು ಪೋಷಕಾಂಶಗಳಾದ ಬೋರಾನ್ ಮತ್ತು ಸತುವನ್ನು ಸಿಂಪಡಿಸಲು ಇದು ಸೂಕ್ತ ಸಮಯ.'
      },
      mr: {
        title: 'कापूस उत्पादकांसाठी सल्ला: पुढील 48 तास फवारणीसाठी अनुकूल',
        content: 'सूक्ष्म पोषक घटकांची (बोरॉन + झिंक) फवारणी करण्यासाठी ही योग्य वेळ आहे.'
      }
    },
    tags: ['Weather Advisory', 'Cotton', 'Lam RARS'],
    likes: 62,
    isLiked: false,
    comments: 9,
    hasVoice: true
  },
  {
    id: 4,
    type: 'discussion',
    author: {
      name: 'Kavitha Devi',
      village: 'Tirupati',
      state: 'Andhra Pradesh',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      badgeKey: 'naturalLeader'
    },
    time: '6 hours ago',
    title: 'Sub-surface Drip Irrigation experience on Groundnut crop',
    content: 'Reduced water pumping hours from 6 hrs to 2.5 hrs daily with 90% subsidy under APMIP. Weed germination reduced significantly. Happy to share setup costs with local farmers.',
    translations: {
      hi: {
        title: 'मूंगफली की फसल में ड्रिप सिंचाई (टपक सिंचाई) का अनुभव',
        content: 'सरकारी सब्सिडी ड्रिप प्रणाली से दैनिक पानी पंपिंग का समय 6 घंटे से घटकर 2.5 घंटे रह गया। खरपतवार की समस्या भी काफी कम हुई। किसानों के साथ अनुभव साझा करने में खुशी होगी।'
      },
      te: {
        title: 'వేరుశనగ పంటలో బిందు సేద్యం (డ్రిప్) అనుభవాలు',
        content: 'సబ్సిడీ డ్రిప్ ద్వారా నీటి వినియోగం బాగా తగ్గింది. కలుపు సమస్య కూడా తగ్గింది. ఇతర రైతులకు వివరాలు పంచుకోవడానికి సిద్ధం.'
      },
      ta: {
        title: 'நிலக்கடலை பயிரில் சொட்டு நீர் பாசன அனுபவங்கள்',
        content: 'மானிய சொட்டு நீர் பாசனம் மூலம் நீர் நுகர்வு கணிசமாகக் குறைந்துள்ளது. களைகளும் குறைந்துள்ளன.'
      },
      kn: {
        title: 'ಕಡಲೆಕಾಯಿ ಬೆಳೆಯಲ್ಲಿ ಹನಿ ನೀರಾವರಿ ಅನುಭವಗಳು',
        content: 'ಹನಿ ನೀರಾವರಿಯಿಂದ ನೀರಿನ ಬಳಕೆ ಗಣನೀಯವಾಗಿ ಕಡಿಮೆಯಾಗಿದೆ. ಕಳೆ ಸಮಸ್ಯೆಯೂ ಕಡಿಮೆಯಾಗಿದೆ.'
      },
      mr: {
        title: 'भुईमूग पिकात ठिबक सिंचनाचा यशस्वी अनुभव',
        content: 'ठिबक सिंचनामुळे पाण्याची बचत झाली आणि तणांचा प्रादुर्भावही कमी झाला. शेतकऱ्यांना माहिती देण्यास आनंद होईल.'
      }
    },
    tags: ['Water Saving', 'Groundnut', 'Drip Tech'],
    likes: 47,
    isLiked: false,
    comments: 15,
    hasVoice: true
  }
]

// Secondary tools for the clean slide-out drawer
const SECONDARY_TOOLS = [
  { 
    id: 'soil', 
    name: 'Soil Health & NPK Clinic', 
    icon: Sprout, 
    path: '#/soil-analyser', 
    desc: 'NPK macronutrient balance & bio-dosage',
    translations: {
      hi: { name: 'मृदा स्वास्थ्य व एनपीके जांच', desc: 'एनपीके पोषक तत्व संतुलन और खाद मात्रा' },
      te: { name: 'నేల ఆరోగ్య పరీక్ష & NPK', desc: 'NPK పోషక సమతుల్యత మరియు మోతాదు' },
      ta: { name: 'மண் பரிசோதனை & NPK', desc: 'NPK சத்து சமநிலை மற்றும் உரம்' },
      kn: { name: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ & NPK', desc: 'NPK ಪೋಷಕಾಂಶ ಸಮತೋಲನ ಮತ್ತು ಗೊಬ್ಬರ' },
      mr: { name: 'माती परीक्षण व NPK', desc: 'NPK खत मात्रा व नियोजन' }
    }
  },
  { 
    id: 'radar', 
    name: '7-Day Radar Weather', 
    icon: CloudSun, 
    path: '#/weather', 
    desc: 'Rain probabilities & wind vectors',
    translations: {
      hi: { name: '7-दिवसीय राडार मौसम पूर्वानुमान', desc: 'बारिश की संभावना और हवा की गति' },
      te: { name: '7 రోజుల వాతావరణ రాడార్', desc: 'వర్ష సూచన మరియు గాలుల వేగం' },
      ta: { name: '7 நாள் வானிலை ரேடார்', desc: 'மழை வாய்ப்பு மற்றும் காற்றின் வேகம்' },
      kn: { name: '7 ದಿನಗಳ ಹವಾಮಾನ ರಾಡಾರ್', desc: 'ಮಳೆಯ ಸಂಭವನೀಯತೆ ಮತ್ತು ಗಾಳಿ' },
      mr: { name: '7 दिवसांचा हवामान अंदाज', desc: 'पावसाची शक्यता आणि वारा' }
    }
  },
  { 
    id: 'disease', 
    name: 'AI Disease Diagnostic Clinic', 
    icon: Activity, 
    path: '#/pest-disease', 
    desc: 'Scan leaf symptoms for instant remedy',
    translations: {
      hi: { name: 'एआई फसल रोग निदान क्लिनिक', desc: 'पत्तियों के लक्षण स्कैन कर त्वरित उपचार पाएं' },
      te: { name: 'తెగుళ్ల గుర్తింపు క్లినిక్', desc: 'ఆకు లక్షణాలను స్కాన్ చేసి నివారణ పొందండి' },
      ta: { name: 'AI நோய் கண்டறிதல் மையம்', desc: 'இலை அறிகுறிகளை ஸ்கேன் செய்து தீர்வு பெறுங்கள்' },
      kn: { name: 'AI ರೋಗ ಪತ್ತೆ ಕ್ಲಿನಿಕ್', desc: 'ಎಲೆ ಲಕ್ಷಣಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಪರಿಹಾರ ಪಡೆಯಿರಿ' },
      mr: { name: 'AI पीक रोग निदान क्लिनिक', desc: 'पाने स्कॅन करून त्वरित उपाय मिळवा' }
    }
  },
  { 
    id: 'planner', 
    name: 'Crop Season Calendar', 
    icon: Calendar, 
    path: '#/crop-planner', 
    desc: 'Sowing timelines and rotation advice',
    translations: {
      hi: { name: 'फसल मौसम योजना व कैलेंडर', desc: 'बुआई समय सारणी और फसल चक्र सलाह' },
      te: { name: 'పంట ప్రణాళిక క్యాలెండర్', desc: 'విత్తనాలు, నాట్లు మరియు కాలెండర్ ప్రణాళిక' },
      ta: { name: 'பயிர் பருவ காலண்டர்', desc: 'விதைப்பு கால அட்டவணை மற்றும் பயிர் சுழற்சி' },
      kn: { name: 'ಬೆಳೆ ಋತು ಕ್ಯಾಲೆಂಡರ್', desc: 'ಬಿತ್ತನೆ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಬೆಳೆ ಸರದಿ' },
      mr: { name: 'पीक नियोजन दिनदर्शिका', desc: 'पेरणी वेळ आणि पीक फेरपालट' }
    }
  },
  { 
    id: 'satellite', 
    name: 'Satellite NDVI Crop Stress', 
    icon: Layers, 
    path: '#/satellite', 
    desc: 'Sentinel-2 chlorophyll vegetative health',
    translations: {
      hi: { name: 'सैटेलाइट एनडीवीआई फसल निगरानी', desc: 'उपग्रह से फसलों के स्वास्थ्य व क्लोरोफिल की जांच' },
      te: { name: 'ఉపగ్రహ పంట పర్యవేక్షణ', desc: 'ఉపగ్రహం ద్వారా పంట ఆరోగ్యం పరిశీలన' },
      ta: { name: 'செயற்கைக்கோள் NDVI பயிர் கண்காணிப்பு', desc: 'செயற்கைக்கோள் மூலம் பயிர் ஆரோக்கியம்' },
      kn: { name: 'ಉಪಗ್ರಹ ಬೆಳೆ ಮೇಲ್ವಿಚಾರಣೆ', desc: 'ಉಪಗ್ರಹದ ಮೂಲಕ ಬೆಳೆ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ' },
      mr: { name: 'उपग्रह पीक निरीक्षण', desc: 'उपग्रहाद्वारे पिकांचे आरोग्य तपासणी' }
    }
  },
  { 
    id: 'records', 
    name: 'Digital Farm Ledger & Book', 
    icon: FileText, 
    path: '#/records', 
    desc: 'Seasonal income, seed costs and receipts',
    translations: {
      hi: { name: 'डिजिटल फार्म खाता-बही', desc: 'मौसमी आय, बीज-खाद खर्च और रसीदें' },
      te: { name: 'డిజిటల్ వ్యవసాయ లెక్కల పుస్తకం', desc: 'ఆదాయం, ఖర్చులు మరియు రసీదుల నమోదు' },
      ta: { name: 'டிஜிட்டல் பண்ணை கணக்கு புத்தகம்', desc: 'வருமானம், செலவுகள் மற்றும் ரசீதுகள்' },
      kn: { name: 'ಡಿಜಿಟಲ್ ಕೃಷಿ ಲೆಕ್ಕಪುಸ್ತಕ', desc: 'ಆದಾಯ, ವೆಚ್ಚಗಳು ಮತ್ತು ರಶೀದಿಗಳು' },
      mr: { name: 'डिजिटल शेती हिशोब वही', desc: 'हंगामी उत्पन्न, खर्च आणि पावत्या' }
    }
  },
  { 
    id: 'equipment', 
    name: 'Equipment & Harvester Hub', 
    icon: Wrench, 
    path: '#/equipment', 
    desc: 'Nearby tractors, rotavators & drone fleets',
    translations: {
      hi: { name: 'ट्रैक्टर व कृषि उपकरण किराया केंद्र', desc: 'निकटवर्ती ट्रैक्टर, रोटावेटर व ड्रोन किराए पर लें' },
      te: { name: 'వ్యవసాయ యంత్రాలు & అద్దె', desc: 'ట్రాక్టర్లు, డ్రోన్లు అద్దెకు తీసుకోండి' },
      ta: { name: 'டிராக்டர் & உபகரண வாடகை மையம்', desc: 'அருகிலுள்ள டிராக்டர்கள் மற்றும் ட்ரோன்கள்' },
      kn: { name: 'ಕೃಷಿ ಉಪಕರಣಗಳು & ಬಾಡಿಗೆ', desc: 'ಟ್ರಾಕ್ಟರ್‌ಗಳು, ಡ್ರೋನ್ ಬಾಡಿಗೆ ಕೇಂದ್ರ' },
      mr: { name: 'ट्रॅक्टर व कृषी यंत्रे भाडे केंद्र', desc: 'जवळपासचे ट्रॅक्टर व ड्रोन भाड्याने घ्या' }
    }
  },
  { 
    id: 'schemes', 
    name: 'Government DBT Directory', 
    icon: Landmark, 
    path: '#/schemes', 
    desc: '20+ Central & State financial programs',
    translations: {
      hi: { name: 'सरकारी योजना व डीबीटी सब्सिडी पोर्टल', desc: '20+ केंद्र व राज्य कृषि अनुदान योजनाएं' },
      te: { name: 'ప్రభుత్వ సబ్సిడీ పథకాలు', desc: '20+ అధికారిక కేంద్ర, రాష్ట్ర పథకాలు' },
      ta: { name: 'அரசு திட்டங்கள் & மானிய போர்டல்', desc: '20+ மத்திய மற்றும் மாநில திட்டங்கள்' },
      kn: { name: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು & ಸಬ್ಸಿಡಿ', desc: '20+ ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಯೋಜನೆಗಳು' },
      mr: { name: 'शासकीय योजना व डीबीटी पोर्टल', desc: '20+ केंद्र व राज्य कृषी अनुदान योजना' }
    }
  }
]

export default function KrishiSuperApp({ onLogout, onOpenSettings }) {
  // Dynamic Logged-in Farmer User & SaaS Subscription State
  const [farmerUser, setFarmerUser] = useState(getCurrentFarmerUser)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSaaSModal, setShowSaaSModal] = useState(false)
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)

  // Active language code: 'none' | 'hi' | 'te' | 'ta' | 'kn' | 'mr' | 'pa' | 'gu' | 'bn' etc.
  const [language, setLanguage] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')

  useEffect(() => {
    const handleSync = () => {
      setFarmerUser(getCurrentFarmerUser())
    }
    const handleLangSync = () => {
      setLanguage(localStorage.getItem('krishi_secondary_lang') || 'none')
    }
    window.addEventListener('krishi_user_session_changed', handleSync)
    window.addEventListener('krishi_lang_changed', handleLangSync)
    window.addEventListener('storage', handleSync)
    window.addEventListener('storage', handleLangSync)
    return () => {
      window.removeEventListener('krishi_user_session_changed', handleSync)
      window.removeEventListener('krishi_lang_changed', handleLangSync)
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('storage', handleLangSync)
    }
  }, [])

  // Navigation tabs: 'advisory' | 'feed' | 'market' | 'finance'
  const [activeTab, setActiveTab] = useState('feed')
  
  // Feed category filter: 'all' | 'discussions' | 'listings' | 'advisory'
  const [feedFilter, setFeedFilter] = useState('all')
  
  // Feed list state
  const [feedPosts, setFeedPosts] = useState(INITIAL_FEED)
  
  // Modals & Drawers
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalType, setCreateModalType] = useState('discussion') // 'discussion' | 'crop_sale' | 'disease'
  const [showToolsDrawer, setShowToolsDrawer] = useState(false)
  
  // Voice AI simulation state
  const [isAiListening, setIsAiListening] = useState(false)
  const [aiSpeechText, setAiSpeechText] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  
  // New Post Form State
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postCrop, setPostCrop] = useState('')
  const [postQty, setPostQty] = useState('')
  const [postPrice, setPostPrice] = useState('')
  
  // Audio playing simulation
  const [playingPostId, setPlayingPostId] = useState(null)

  const t = getI18n(language)
  const currentLangObj = REGIONAL_LANGUAGES.find(l => l.code === language) || REGIONAL_LANGUAGES[0]

  // Toggle Like on feed post
  const handleToggleLike = (postId) => {
    setFeedPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : p.likes - 1
        }
      }
      return p
    }))
  }

  // Handle Play Voice simulation
  const handlePlayVoice = (postId, text) => {
    if (playingPostId === postId) {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      setPlayingPostId(null)
      return
    }
    setPlayingPostId(postId)
    const enText = text
    playDualVoice(enText, language !== 'none' ? text : '', language, () => {
      setPlayingPostId(null)
    })
  }

  // Handle Voice AI Assistant Trigger
  const handleTriggerVoiceAI = () => {
    setShowVoiceAssistant(true)
    setIsAiListening(true)
    setAiSpeechText(t.listening)
    setAiResponse(null)

    setTimeout(() => {
      setIsAiListening(false)
      if (language === 'hi') {
        setAiSpeechText('धान में तना छेदक कीट की रोकथाम के क्या उपाय हैं?')
        setAiResponse({
          title: 'धान का पीला तना छेदक (Yellow Stem Borer)',
          action: 'प्रति एकड़ 4-5 किग्रा कारटाप हाइड्रोक्लोराइड 4G डालें या क्लोरेंट्रानिलीप्रोल 18.5% SC @ 0.3 मिली/लीटर पानी में मिलाकर छिड़कें।',
          warning: 'दवा के अच्छे प्रभाव के लिए खेत में 2-3 सेमी हल्का पानी बनाए रखें।'
        })
      } else if (language === 'te') {
        setAiSpeechText('వరిలో కాండం తొలిచే పురుగు నివారణ ఏమిటి?')
        setAiResponse({
          title: 'వరి కాండం తొలిచే పురుగు (Yellow Stem Borer)',
          action: 'ఎకరానికి 4 కిలోల కార్టాప్ హైడ్రోక్లోరైడ్ 4G గుళికలు వేయండి లేదా క్లోరాంట్రానిలిప్రోల్ 0.3 మి.లీ/లీటరు నీటిలో కలిపి పిచికారీ చేయండి.',
          warning: 'పైరు దుబ్బు చేసే దశలో ఉన్నందున నీరు పలచగా ఉంచి మందు వేయాలి.'
        })
      } else if (language === 'ta') {
        setAiSpeechText('நெல்லில் தண்டு துளைப்பான் பூச்சியை கட்டுப்படுத்துவது எப்படி?')
        setAiResponse({
          title: 'நெல் தண்டு துளைப்பான் (Yellow Stem Borer)',
          action: 'கார்டாப் ஹைட்ரோகுளோரைடு 4G அல்லது குளோரான்ட்ரனிலிப்ரோல் 18.5% SC @ 0.3 மிலி/லிட்டர் தெளிக்கவும்.',
          warning: 'வயலில் லேசான நீர்மட்டத்தை பராமரிக்கவும்.'
        })
      } else {
        setAiSpeechText('What is the best treatment for yellow stem borer in Paddy?')
        setAiResponse({
          title: 'Paddy Yellow Stem Borer Diagnosis',
          action: 'Apply Cartap Hydrochloride 4G @ 4-5 kg/acre in standing water or spray Chlorantraniliprole 18.5% SC @ 0.3 ml/Litre.',
          warning: 'Maintain 2-3 cm shallow water level in field for optimum systemic absorption.'
        })
      }
    }, 2500)
  }

  // Handle New Post Submission
  const handleCreatePost = (e) => {
    e.preventDefault()
    if (!postTitle.trim() && !postContent.trim()) return

    const newPost = {
      id: Date.now(),
      type: createModalType === 'crop_sale' ? 'trade' : createModalType === 'disease' ? 'disease' : 'discussion',
      author: {
        name: `${farmerUser.name} (You)`,
        village: farmerUser.village || 'Local Farm',
        state: farmerUser.state || 'Karnataka',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        badgeKey: 'verifiedProducer'
      },
      time: t.publishedJustNow,
      title: postTitle || (createModalType === 'crop_sale' ? `${postQty} of ${postCrop} for Sale` : 'Agricultural Discussion'),
      content: postContent,
      tags: createModalType === 'crop_sale' ? ['Crop Sale', postCrop || 'Produce', `${farmerUser.village || 'Local'} Mandi`] : ['Farmer Post', 'Field Update'],
      cropDetails: createModalType === 'crop_sale' ? {
        crop: postCrop || 'Farm Produce',
        quantity: postQty || 'Ready Lot',
        price: postPrice ? `₹${postPrice} / Qtl` : 'Best APMC Offer',
        lotLocation: farmerUser.village || farmerUser.state || 'Farm Gate'
      } : null,
      likes: 1,
      isLiked: true,
      comments: 0,
      hasVoice: true
    }

    setFeedPosts([newPost, ...feedPosts])
    setPostTitle('')
    setPostContent('')
    setPostCrop('')
    setPostQty('')
    setPostPrice('')
    setShowCreateModal(false)
  }

  const handleSelectLanguage = (code) => {
    setLanguage(code)
    localStorage.setItem('krishi_secondary_lang', code)
    localStorage.setItem('krishi_lang_chosen', 'true')
    window.dispatchEvent(new Event('krishi_lang_changed'))
    window.dispatchEvent(new Event('storage'))
    setShowLanguagePicker(false)
  }

  // Filter feed logic
  const filteredFeed = feedPosts.filter(item => {
    if (feedFilter === 'all') return true
    if (feedFilter === 'discussions') return item.type === 'discussion'
    if (feedFilter === 'listings') return item.type === 'trade'
    if (feedFilter === 'advisory') return item.type === 'advisory' || item.type === 'disease'
    return true
  })

  // Helpers to get language-appropriate post and crop titles
  const getPostTitle = (post) => {
    if (language === 'none' || language === 'en') return post.title
    return post.translations?.[language]?.title || post.title
  }

  const getPostContent = (post) => {
    if (language === 'none' || language === 'en') return post.content
    return post.translations?.[language]?.content || post.content
  }

  const getPostRemedy = (post) => {
    if (!post.aiDiagnosis) return ''
    if (language === 'none' || language === 'en') return post.aiDiagnosis.treatment
    return post.aiDiagnosis.translations?.[language] || post.aiDiagnosis.treatment
  }

  const getBadgeText = (badgeKey) => {
    return t[badgeKey] || t.verifiedProducer
  }

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 text-slate-800 flex flex-col font-sans lg:overflow-hidden">
      
      {/* 1. TOP GLOBAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 ring-2 ring-emerald-600/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-slate-900 tracking-tight">Krishi<span className="text-emerald-700">Net</span></span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SuperApp
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-all"
              />
            </div>
          </div>

          {/* Action Hub (Language Toggle, Tools Drawer Trigger, Profile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Multi-Language Selector Trigger Button */}
            <div className="relative">
              <button
                onClick={() => setShowLanguagePicker(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-sm"
                title="Change Application Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-800 font-extrabold text-xs">
                  {currentLangObj.code === 'none' ? 'EN' : currentLangObj.code.toUpperCase()}
                </span>
                <span className="text-slate-600 font-medium hidden md:inline truncate max-w-[80px]">
                  {currentLangObj.code === 'none' ? 'English' : currentLangObj.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Language Selection Popover Dropdown */}
              {showLanguagePicker && (
                <div 
                  className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-slate-100 text-xs font-black text-slate-800">
                    {t.selectLanguageModal}
                  </div>
                  <div className="divide-y divide-slate-50 mt-1">
                    {REGIONAL_LANGUAGES.map(lang => {
                      const isSelected = language === lang.code
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs font-semibold transition ${
                            isSelected ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{lang.englishName}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Tools Drawer Trigger */}
            <button
              onClick={() => setShowToolsDrawer(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition border border-emerald-200/60"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t.agriToolsSuite}</span>
            </button>

            {/* Notifications Shortcut */}
            <button 
              onClick={() => window.location.hash = '#/notifications'}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white"></span>
            </button>

            {/* Farmer Profile Avatar Badge & Floating SaaS Profile Menu */}
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-slate-200 hover:border-emerald-400 bg-white cursor-pointer transition shadow-sm select-none"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-inner">
                  {farmerUser.initials}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[140px] truncate">{farmerUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Floating Profile & SaaS Management Dropdown */}
              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {farmerUser.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">{farmerUser.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{farmerUser.phone ? `+91 ${farmerUser.phone}` : farmerUser.locationDisplay}</p>
                      <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        <Crown className="w-3 h-3 text-emerald-700" />
                        <span>SaaS Pro Member</span>
                      </div>
                    </div>
                  </div>

                  {/* Farm Overview stats */}
                  <div className="my-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Farm Land:</span>
                      <strong className="text-slate-900">{farmerUser.land} Acres</strong>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>Crops:</span>
                      <strong className="text-slate-900 truncate max-w-[140px]">{farmerUser.crops}</strong>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>Location:</span>
                      <strong className="text-slate-900 truncate max-w-[140px]">{farmerUser.village}, {farmerUser.state}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        onOpenSettings && onOpenSettings()
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition text-left"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{t.accountSettings}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setShowSaaSModal(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition text-left"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.saasProBenefits}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        clearFarmerUserSession()
                        onLogout && onLogout()
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-left"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.switchAccount}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        clearFarmerUserSession()
                        onLogout && onLogout()
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>


      {/* =========================================================================
          2. THREE-COLUMN COMMAND CENTER (Clean, Responsive, Scalable)
         ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
          
          {/* =========================================================================
              COLUMN 1: LEFT SIDEBAR (Farmer Identity, 4-Pillar Nav & AI Doctor Hub)
             ========================================================================= */}
          <aside className="lg:col-span-3 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-1 scrollbar-none pb-16">
            
            {/* Identity Badge Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-inner ring-2 ring-emerald-500/20">
                  {farmerUser.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">{farmerUser.name}</h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{farmerUser.locationDisplay}</p>
                </div>
              </div>

              {/* Sub-tier info */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">{farmerUser.land} Acres • {farmerUser.crops}</span>
                <button
                  onClick={() => onOpenSettings && onOpenSettings()}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Edit Profile →
                </button>
              </div>
            </div>

            {/* Primary 4-Pillar Navigation Bar */}
            <nav className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-sm space-y-1">
              
              {/* Tab 1: Home / Advisory */}
              <button
                onClick={() => setActiveTab('advisory')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition ${
                  activeTab === 'advisory'
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className={`w-4 h-4 ${activeTab === 'advisory' ? 'text-white' : 'text-emerald-700'}`} />
                  <div className="text-left">
                    <div className="leading-tight">{t.homeAdvisory}</div>
                    <div className={`text-[10px] font-normal ${activeTab === 'advisory' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {t.homeAdvisorySub}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'advisory' ? 'text-white/80' : 'text-slate-300'}`} />
              </button>

              {/* Tab 2: Kisan Social Feed (Interactive Heart) */}
              <button
                onClick={() => setActiveTab('feed')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition ${
                  activeTab === 'feed'
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-4 h-4 ${activeTab === 'feed' ? 'text-white' : 'text-emerald-700'}`} />
                  <div className="text-left">
                    <div className="leading-tight">{t.kisanSocial}</div>
                    <div className={`text-[10px] font-normal ${activeTab === 'feed' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {t.kisanSocialSub}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'feed' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Live
                </span>
              </button>

              {/* Tab 3: Marketplace (Buy & Sell Produce) */}
              <button
                onClick={() => setActiveTab('market')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition ${
                  activeTab === 'market'
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`w-4 h-4 ${activeTab === 'market' ? 'text-white' : 'text-emerald-700'}`} />
                  <div className="text-left">
                    <div className="leading-tight">{t.marketplace}</div>
                    <div className={`text-[10px] font-normal ${activeTab === 'market' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {t.marketplaceSub}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'market' ? 'text-white/80' : 'text-slate-300'}`} />
              </button>

              {/* Tab 4: Finance & Records */}
              <button
                onClick={() => setActiveTab('finance')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition ${
                  activeTab === 'finance'
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Landmark className={`w-4 h-4 ${activeTab === 'finance' ? 'text-white' : 'text-emerald-700'}`} />
                  <div className="text-left">
                    <div className="leading-tight">{t.financeRecords}</div>
                    <div className={`text-[10px] font-normal ${activeTab === 'finance' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {t.financeRecordsSub}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'finance' ? 'text-white/80' : 'text-slate-300'}`} />
              </button>
            </nav>

            {/* 1-Click Voice AI Agronomist Button */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-4 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-600/20 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  24/7 Krishi AI Doctor
                </span>
              </div>

              <h3 className="text-sm font-black leading-snug">
                {t.haveDoubt}
              </h3>
              <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
                {t.doubtSub}
              </p>

              <button
                onClick={handleTriggerVoiceAI}
                className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-emerald-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <Mic className="w-4 h-4 animate-pulse text-emerald-950" />
                <span>{t.askDoctorBtn}</span>
              </button>
            </div>

            {/* Compact Hyperlocal Weather Widget */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CloudSun className="w-4 h-4 text-amber-500" />
                  <span>{t.hyperlocalWeather}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                  {farmerUser.village ? `${farmerUser.village}, ${farmerUser.state ? farmerUser.state.slice(0, 2).toUpperCase() : 'IN'}` : (farmerUser.state || 'India')}
                </span>
              </div>

              <div className="flex items-center justify-between my-2">
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">31°C</div>
                  <div className="text-[11px] text-slate-500 font-medium">Partly Sunny & Dry</div>
                </div>
                <div className="text-right text-[11px] font-semibold text-slate-600 space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>68% Humidity</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Wind className="w-3 h-3 text-teal-600" />
                    <span>9 km/h NE</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold">
                  {t.sprayWindow}
                </span>
                <button
                  onClick={() => window.location.hash = '#/weather'}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  {t.radar}
                </button>
              </div>
            </div>

            {/* Quick Secondary Tools Button on Mobile / Desktop */}
            <button
              onClick={() => setShowToolsDrawer(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>{t.open12Tools}</span>
            </button>

          </aside>


          {/* =========================================================================
              COLUMN 2: CENTER STREAM (Unified Social, Trade Feed & Advisory)
             ========================================================================= */}
          <section className="lg:col-span-6 space-y-4 lg:h-full lg:overflow-y-auto lg:px-1 scrollbar-none pb-16">
            
            {/* Pill Filters Bar: [All, Farmer Discussions, Crop Listings, Advisory Alerts] */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  feedFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t.allStreams}
              </button>

              <button
                onClick={() => setFeedFilter('discussions')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  feedFilter === 'discussions'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t.farmerDiscussions}</span>
              </button>

              <button
                onClick={() => setFeedFilter('listings')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  feedFilter === 'listings'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t.cropListings}</span>
              </button>

              <button
                onClick={() => setFeedFilter('advisory')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  feedFilter === 'advisory'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.advisoryDoctor}</span>
              </button>
            </div>

            {/* Main Stream Feed List */}
            <div className="space-y-4">
              {filteredFeed.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                  <Sprout className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">{t.noPosts}</p>
                  <button
                    onClick={() => setFeedFilter('all')}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    {t.viewAllPosts}
                  </button>
                </div>
              ) : (
                filteredFeed.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition duration-200"
                  >
                    {/* Post Header: Author, Village, Type Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900">{post.author.name}</h4>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md">
                              {getBadgeText(post.author.badgeKey)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                            <span>{post.author.village}</span>
                            <span>•</span>
                            <span>{post.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post Category Tag */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        post.type === 'trade'
                          ? 'bg-amber-100 text-amber-800'
                          : post.type === 'disease'
                          ? 'bg-rose-100 text-rose-800'
                          : post.type === 'advisory'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {post.type === 'trade'
                          ? t.tradeLot
                          : post.type === 'disease'
                          ? t.cropClinic
                          : post.type === 'advisory'
                          ? t.advisory
                          : t.discussion}
                      </span>
                    </div>

                    {/* Post Title */}
                    <h3 className="text-sm font-black text-slate-900 leading-snug mb-1.5">
                      {getPostTitle(post)}
                    </h3>

                    {/* Post Content */}
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {getPostContent(post)}
                    </p>

                    {/* TRADE SPECIAL: Crop Listing Details Box with Direct Buyer Connect */}
                    {post.type === 'trade' && post.cropDetails && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">{t.quantity}</span>
                            <span className="font-extrabold text-slate-900">{post.cropDetails.quantity}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">{t.targetPrice}</span>
                            <span className="font-black text-emerald-700 text-sm">{post.cropDetails.price}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">{t.location}</span>
                            <span className="font-bold text-slate-700">{post.cropDetails.lotLocation}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => alert(`Connecting you to ${post.author.name} for trade offer.`)}
                          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{t.directConnect}</span>
                        </button>
                      </div>
                    )}

                    {/* CROP DOCTOR SPECIAL: Image Attachment + AI Diagnosis Badge */}
                    {post.image && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-h-72">
                        <img
                          src={post.image}
                          alt="Crop symptom"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {post.aiDiagnosis && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center gap-2 text-emerald-900 font-extrabold">
                          <Sparkles className="w-4 h-4 text-emerald-700" />
                          <span>AI Doctor Verified: {post.aiDiagnosis.disease}</span>
                          <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full ml-auto">
                            {post.aiDiagnosis.confidence}
                          </span>
                        </div>
                        <p className="text-emerald-800 text-[11px] font-medium leading-relaxed">
                          <strong>{t.remedy}</strong>{getPostRemedy(post)}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Post Footer Action Bar (Like, Comment, Voice Read-Aloud, Share) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                      
                      {/* Like Button */}
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition ${
                          post.isLiked ? 'text-rose-600 bg-rose-50' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      {/* Comments */}
                      <button
                        onClick={() => alert('Comments discussion drawer')}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments} {t.replies}</span>
                      </button>

                      {/* Voice Audio Listen Button */}
                      <button
                        onClick={() => handlePlayVoice(post.id, getPostContent(post))}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition ${
                          playingPostId === post.id
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                        title="Listen in your selected language"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {playingPostId === post.id ? t.playing : t.listen}
                        </span>
                      </button>

                      {/* Share */}
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: post.title, text: post.content, url: window.location.href })
                          } else {
                            alert('Post link copied to clipboard!')
                          }
                        }}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.share}</span>
                      </button>

                    </div>
                  </article>
                ))
              )}
            </div>

          </section>


          {/* =========================================================================
              COLUMN 3: RIGHT PANEL (Live Market Sparklines & Govt Schemes)
             ========================================================================= */}
          <aside className="lg:col-span-3 space-y-4 lg:h-full lg:overflow-y-auto lg:pl-1 scrollbar-none pb-16">
            
            {/* Pinned Market Rates with Compact Sparklines */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      {t.liveMandiBenchmarks}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{t.pinnedCommodities}</p>
                </div>
                
                <button
                  onClick={() => window.location.hash = '#/market-prices'}
                  className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                >
                  <span>{t.allMandiRates}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Stacked sparkline cards */}
              <div className="space-y-2.5">
                {PINNED_CROPS.map((crop) => {
                  const isUp = crop.trend === 'up'
                  const dual = getDualCropName(crop.symbol, language)
                  const cropDisplayName = (language === 'none' || language === 'en')
                    ? crop.enName
                    : (dual?.reg ? `${crop.enName} (${dual.reg})` : crop.enName)

                  return (
                    <div
                      key={crop.id}
                      onClick={() => window.location.hash = '#/market-prices'}
                      className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 bg-slate-50/60 hover:bg-white cursor-pointer transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-slate-900 truncate">{cropDisplayName}</h5>
                          <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${
                            isUp ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isUp ? `+${crop.change}%` : `${crop.change}%`}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-sm font-black text-slate-900">
                            ₹{crop.price.toLocaleString('en-IN')}
                            <span className="text-[10px] font-medium text-slate-500 ml-0.5">/{crop.unit}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{crop.mandi}</span>
                        </div>

                        {/* Dynamic Real-Time SVG Sparkline */}
                        <div className="mt-1.5 h-4 w-full">
                          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
                            <defs>
                              <linearGradient id={`sparkGrad-${crop.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isUp ? '#16a34a' : '#e11d48'} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={isUp ? '#16a34a' : '#e11d48'} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <polygon
                              fill={`url(#sparkGrad-${crop.id})`}
                              points={getSparklineArea(crop.sparkline, 100, 20, 5.0)}
                            />
                            <polyline
                              fill="none"
                              stroke={isUp ? '#15803d' : '#e11d48'}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={getSparklinePoints(crop.sparkline, 100, 20, 5.0)}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* APMC Mandi Ticker Status */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Agmarknet Daily Verified
                </span>
                <span className="font-bold text-slate-700">100% MSP Monitored</span>
              </div>
            </div>

            {/* Instant Government Scheme & DBT Shortcuts Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  <span>{t.govtSchemes}</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full">
                  DBT Active
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Scheme Item 1: PM-Kisan */}
                <div 
                  onClick={() => window.location.hash = '#/schemes'}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">PM-Kisan 17th Installment</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Credited
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ₹2,000 sent to Aadhaar-linked Bank A/C. e-KYC is active.
                  </p>
                </div>

                {/* Scheme Item 2: 4% KCC Crop Loan */}
                <div 
                  onClick={() => window.location.hash = '#/finance'}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">4% Net KCC Loan Window</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Sanctioned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Subvention applicable up to ₹3,00,000 limit with prompt repayment.
                  </p>
                </div>

                {/* Scheme Item 3: DigiLocker Land Records */}
                <div 
                  onClick={() => window.location.hash = '#/documents'}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Digital Land Records (7/12)</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      Synced
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    e-Pattadar Passbook verified on state portal.
                  </p>
                </div>
              </div>

              <button
                onClick={() => window.location.hash = '#/schemes'}
                className="mt-3 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>{t.viewAllSchemes}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Helpline Emergency Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold">{t.kisanCallCenter}</div>
                <div className="font-black text-emerald-950 text-sm">1800-180-1551 (Toll Free)</div>
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* =========================================================================
          MODAL 1: VOICE AI AGRONOMIST DIALOG (Clean, animated, high accessibility)
         ========================================================================= */}
      {showVoiceAssistant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowVoiceAssistant(false)
                setIsAiListening(false)
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {t.voiceAgronomist}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t.speakNaturally}
                </p>
              </div>
            </div>

            {/* Visualizer Waves */}
            <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              {isAiListening ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-1.5 h-10">
                    <span className="w-1.5 h-6 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-10 bg-emerald-700 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-8 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-10 bg-emerald-700 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  </div>
                  <p className="text-xs font-bold text-emerald-800">{aiSpeechText}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-slate-500">
                    {t.yourQuery}
                  </div>
                  <div className="text-sm font-black text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                    "{aiSpeechText}"
                  </div>
                </div>
              )}
            </div>

            {/* AI Response Card */}
            {aiResponse && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{aiResponse.title}</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  {aiResponse.action}
                </p>
                <div className="text-[11px] text-emerald-700 bg-emerald-100/60 p-2 rounded-lg font-semibold">
                  ⚠️ {aiResponse.warning}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerVoiceAI}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Mic className="w-4 h-4" />
                <span>{t.speakAgain}</span>
              </button>
              <button
                onClick={() => {
                  setShowVoiceAssistant(false)
                  setIsAiListening(false)
                }}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
              >
                {t.done}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: NEW POST / CROP SALE / DISEASE QUERY CREATOR
         ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tabs for modal type */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <button
                onClick={() => setCreateModalType('discussion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  createModalType === 'discussion' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.discussion}
              </button>

              <button
                onClick={() => setCreateModalType('crop_sale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  createModalType === 'crop_sale' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.tradeLot}
              </button>

              <button
                onClick={() => setCreateModalType('disease')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  createModalType === 'disease' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.cropClinic}
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder={createModalType === 'crop_sale' ? 'e.g. 50 Quintals Sona Masuri Paddy' : 'e.g. Yellow leaf curl disease query'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              {/* Crop Sale Lot Specific Inputs */}
              {createModalType === 'crop_sale' && (
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t.cropListings}</label>
                    <input
                      type="text"
                      value={postCrop}
                      onChange={(e) => setPostCrop(e.target.value)}
                      placeholder="Paddy / Chilli"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t.quantity}</label>
                    <input
                      type="text"
                      value={postQty}
                      onChange={(e) => setPostQty(e.target.value)}
                      placeholder="e.g. 40 Qtl"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t.targetPrice} (₹/Qtl)</label>
                    <input
                      type="text"
                      value={postPrice}
                      onChange={(e) => setPostPrice(e.target.value)}
                      placeholder="2650"
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Details
                </label>
                <textarea
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Provide complete details regarding field condition, moisture or pricing..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              {/* Photo Upload Simulation */}
              <div className="p-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-600">
                  Attach Leaf / Produce Photo
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t.publishPost}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: SECONDARY AGRI-TOOLS
         ========================================================================= */}
      {showToolsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {t.agriToolsSuite}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Secondary tools organized in one drawer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowToolsDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tools List */}
              <div className="divide-y divide-slate-100 mt-4">
                {SECONDARY_TOOLS.map((tool) => {
                  const Icon = tool.icon
                  const toolTitle = (language === 'none' || language === 'en')
                    ? tool.name
                    : (tool.translations?.[language]?.name || tool.name)
                  const toolDesc = (language === 'none' || language === 'en')
                    ? tool.desc
                    : (tool.translations?.[language]?.desc || tool.desc)

                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        window.location.hash = tool.path
                        setShowToolsDrawer(false)
                      }}
                      className="py-3 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {toolTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {toolDesc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-200 text-center">
              <button
                onClick={() => {
                  setShowToolsDrawer(false)
                  onLogout && onLogout()
                }}
                className="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.signOut}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('advisory')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'advisory' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t.homeAdvisory.split('/')[0].trim()}</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'feed' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t.kisanSocial.split(' ')[0]}</span>
        </button>

        <button
          onClick={handleTriggerVoiceAI}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/40 ring-4 ring-white">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-emerald-800 mt-0.5">AI Doctor</span>
        </button>

        <button
          onClick={() => setActiveTab('market')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'market' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t.marketplace.split(' ')[0]}</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'finance' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Landmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t.financeRecords.split(' ')[0]}</span>
        </button>
      </div>

      {/* SaaS Plan & Features Modal */}
      {showSaaSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Krishi SaaS Pro Membership</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[280px]">Active Farmer: {farmerUser.name} ({farmerUser.locationDisplay})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSaaSModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Included SaaS Capabilities</span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full">Active</span>
              </div>
              <ul className="text-xs space-y-2 text-emerald-950 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>24/7 Voice AI Agronomist in all Indian languages (Unlimited Queries)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>Real-time Agmarknet Mandi Daily MSP & Settlement Price Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>GPS Drone Sprayers & Harvester Fleet Direct Booking Hub</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>4% Net KCC Crop Loan Waiver Subvention Calculator & Fast Track</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>Sentinel-2 Multispectral Satellite NDVI Chlorophyll Stress Monitoring</span>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Tenant ID / Phone:</span>
                <strong className="text-slate-900">{farmerUser.phone ? `+91 ${farmerUser.phone}` : 'Demo Profile'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Registered Land Size:</span>
                <strong className="text-slate-900">{farmerUser.land} Acres</strong>
              </div>
              <div className="flex justify-between">
                <span>Primary Farm Crops:</span>
                <strong className="text-slate-900">{farmerUser.crops}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowSaaSModal(false)
                  onOpenSettings && onOpenSettings()
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Edit Farm Profile
              </button>
              <button
                onClick={() => setShowSaaSModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-md shadow-emerald-700/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
