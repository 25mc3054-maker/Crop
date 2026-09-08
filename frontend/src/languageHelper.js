// Comprehensive Multi-Language Engine and Dual-Voice System for Krishi-Net

export const REGIONAL_LANGUAGES = [
  { code: 'none', name: 'None (English Only)', englishName: 'English Only', script: 'English', tag: 'IN-EN', flag: '🌐' },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', script: 'నమస్కారం', tag: 'IN-TE', flag: '🇮🇳' },
  { code: 'hi', name: 'हिंदी', englishName: 'Hindi', script: 'नमस्ते', tag: 'IN-HI', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', script: 'வணக்கம்', tag: 'IN-TA', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', script: 'ನಮಸ್ಕಾರ', tag: 'IN-KN', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', script: 'നമസ്കാരം', tag: 'IN-ML', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi', script: 'नमस्कार', tag: 'IN-MR', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', script: 'নমস্কার', tag: 'IN-BN', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', script: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', tag: 'IN-PA', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', script: 'નમસ્તે', tag: 'IN-GU', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', englishName: 'Odia', script: 'ନମସ୍କାର', tag: 'IN-OR', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া', englishName: 'Assamese', script: 'নমস্কাৰ', tag: 'IN-AS', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', englishName: 'Urdu', script: 'السلام علیکم', tag: 'IN-UR', flag: '🇮🇳' },
  { code: 'bho', name: 'भोजपुरी', englishName: 'Bhojpuri', script: 'प्रणाम', tag: 'IN-BHO', flag: '🇮🇳' },
  { code: 'mai', name: 'मैथिली', englishName: 'Maithili', script: 'प्रणाम', tag: 'IN-MAI', flag: '🇮🇳' },
  { code: 'sa', name: 'संस्कृतम्', englishName: 'Sanskrit', script: 'नमस्ते', tag: 'IN-SA', flag: '🇮🇳' },
  { code: 'raj', name: 'राजस्थानी / मारवाड़ी', englishName: 'Rajasthani', script: 'खम्मा घणी', tag: 'IN-RAJ', flag: '🇮🇳' },
  { code: 'har', name: 'हरियाणवी', englishName: 'Haryanvi', script: 'राम राम', tag: 'IN-HAR', flag: '🇮🇳' },
  { code: 'chg', name: 'छत्तीसगढ़ी', englishName: 'Chhattisgarhi', script: 'जय जोहार', tag: 'IN-CHG', flag: '🇮🇳' },
  { code: 'ne', name: 'नेपाली', englishName: 'Nepali', script: 'नमस्ते', tag: 'IN-NE', flag: '🇮🇳' },
  { code: 'kok', name: 'कोंकणी', englishName: 'Konkani', script: 'नमस्कार', tag: 'IN-KOK', flag: '🇮🇳' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', englishName: 'Santali', script: 'ᱡᱚᱦᱟᱨ', tag: 'IN-SAT', flag: '🇮🇳' },
  { code: 'ks', name: 'کٲشُر / कश्मीरी', englishName: 'Kashmiri', script: 'سلام', tag: 'IN-KS', flag: '🇮🇳' },
  { code: 'sd', name: 'سنڌي / सिन्धी', englishName: 'Sindhi', script: 'سلام', tag: 'IN-SD', flag: '🇮🇳' },
  { code: 'doi', name: 'डोगरी', englishName: 'Dogri', script: 'नमस्ते', tag: 'IN-DOI', flag: '🇮🇳' },
  { code: 'mni', name: 'মৈতৈলোন্ / মণিপুরী', englishName: 'Manipuri', script: 'খুরুমজরি', tag: 'IN-MNI', flag: '🇮🇳' },
  { code: 'brx', name: 'बड़ो (Bodo)', englishName: 'Bodo', script: 'खुलुमबाय', tag: 'IN-BRX', flag: '🇮🇳' }
];

export const UI_LANG_STRINGS = {
  none: {
    dashboardTitle: 'Krishi-Net Dashboard',
    chooseSubtitle: 'English Only mode selected',
    selectLabel: 'Select Language Preference',
    continueBtn: 'Continue to Dashboard',
    changeLanguageBtn: 'Change Language 🔄',
    greeting: 'English selected. Welcome to Krishi-Net.',
    englishNotice: 'English is active as your primary language throughout the entire application.',
    exploreCrops: 'Explore 700+ Crops',
    loadingPrices: 'Loading live rates...',
    needSupport: 'Need Direct Assistance?',
    whatsAppSupport: 'WhatsApp Support',
    unitQuintal: 'per 100 kg (1 Quintal)',
    unitLitre: 'per Litre',
    unitKg: 'per kg',
    unitPcs: 'per 100 pcs'
  },
  te: {
    dashboardTitle: 'కృషి-నెట్ డ్యాష్‌బోర్డ్',
    chooseSubtitle: 'మీ ప్రాంతీయ భాషను ఎంచుకోండి',
    selectLabel: 'ప్రాంతీయ భాషను ఎంచుకోండి',
    continueBtn: 'డ్యాష్‌బోర్డ్‌కు వెళ్లండి',
    changeLanguageBtn: 'భాషను మార్చండి 🔄',
    greeting: 'తెలుగు మరియు ఇంగ్లీష్ భాష ఎంపిక చేయబడింది. కృషి-నెట్ కు స్వాగతం.',
    englishNotice: 'ఇంగ్లీష్ ప్రాథమిక భాషగా ఎల్లప్పుడూ అందుబాటులో ఉంటుంది. అన్ని సంఖ్యలు ఇంగ్లీష్ అంకెల్లో (0-9) ఉంటాయి.',
    exploreCrops: 'అన్ని పంటలు చూడండి',
    loadingPrices: 'ధరలు లోడ్ అవుతున్నాయి...',
    needSupport: 'సహాయం కావాలా?',
    whatsAppSupport: 'వాట్సాప్ సహాయం',
    unitQuintal: '100 కేజీలకు (1 క్వింటాల్)',
    unitLitre: 'లీటరుకు',
    unitKg: 'కేజీకి',
    unitPcs: '100 నంబర్లకు'
  },
  hi: {
    dashboardTitle: 'कृषि-नेट डैशबोर्ड',
    chooseSubtitle: 'अपनी क्षेत्रीय भाषा चुनें',
    selectLabel: 'क्षेत्रीय भाषा का चयन करें',
    continueBtn: 'डैशबोर्ड पर आगे बढ़ें',
    changeLanguageBtn: 'भाषा बदलें 🔄',
    greeting: 'हिंदी और अंग्रेज़ी भाषा चुनी गई। कृषि-नेट में आपका स्वागत है।',
    englishNotice: 'अंग्रेज़ी मुख्य भाषा के रूप में हमेशा सक्रिय रहेगी। सभी नंबर अंग्रेज़ी अंकों (0-9) में दिखेंगे।',
    exploreCrops: 'सभी फसलें देखें',
    loadingPrices: 'भाव लोड हो रहे हैं...',
    needSupport: 'सहायता चाहिए?',
    whatsAppSupport: 'व्हाट्सएप सहायता',
    unitQuintal: 'प्रति 100 किलो (1 क्विंटल)',
    unitLitre: 'प्रति लीटर',
    unitKg: 'प्रति किलो',
    unitPcs: 'प्रति 100 नग'
  },
  ta: {
    dashboardTitle: 'கிருஷி-நெட் முகப்பு',
    chooseSubtitle: 'உங்கள் பிராந்திய மொழியைத் தேர்வுசெய்க',
    selectLabel: 'பிராந்திய மொழியைத் தேர்ந்தெடுக்கவும்',
    continueBtn: 'முகப்புக்குச் செல்லவும்',
    changeLanguageBtn: 'மொழியை மாற்றவும் 🔄',
    greeting: 'தமிழ் மற்றும் ஆங்கில மொழி தேர்ந்தெடுக்கப்பட்டது. கிருஷி-நெட்டிற்கு வரவேற்கிறோம்.',
    englishNotice: 'ஆங்கிலம் முதன்மை மொழியாக எப்போதும் செயலில் இருக்கும். அனைத்து எண்களும் ஆங்கிலத்தில் (0-9) இருக்கும்.',
    exploreCrops: 'அனைத்து பயிர்களையும் காண்க',
    loadingPrices: 'விலைகள் ஏற்றப்படுகின்றன...',
    needSupport: 'உதவி தேவையா?',
    whatsAppSupport: 'வாட்ஸ்அப் உதவி',
    unitQuintal: '100 கிலோவுக்கு (1 குவிண்டால்)',
    unitLitre: 'ஒரு லிட்டருக்கு',
    unitKg: 'ஒரு கிலோவுக்கு',
    unitPcs: '100 எண்ணிக்கைக்கு'
  },
  kn: {
    dashboardTitle: 'ಕೃಷಿ-ನೆಟ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    chooseSubtitle: 'ನಿಮ್ಮ ಪ್ರಾದೇಶಿಕ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectLabel: 'ಪ್ರಾದೇಶಿಕ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    continueBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
    changeLanguageBtn: 'ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ 🔄',
    greeting: 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಕೃಷಿ-ನೆಟ್ ಗೆ ಸ್ವಾಗತ.',
    englishNotice: 'ಇಂಗ್ಲಿಷ್ ಮುಖ್ಯ ಭಾಷೆಯಾಗಿ ಸದಾ ಸಕ್ರಿಯವಾಗಿರುತ್ತದೆ. ಎಲ್ಲಾ ಸಂಖ್ಯೆಗಳು ಇಂಗ್ಲಿಷ್ ಅಂಕಿಗಳಲ್ಲಿ (0-9) ಇರುತ್ತವೆ.',
    exploreCrops: 'ಎಲ್ಲಾ ಬೆಳೆಗಳನ್ನು ನೋಡಿ',
    loadingPrices: 'ದರಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...',
    needSupport: 'ಸಹಾಯ ಬೇಕೇ?',
    whatsAppSupport: 'ವಾಟ್ಸಾಪ್ ಸಹಾಯ',
    unitQuintal: '100 ಕೆಜಿಗೆ (1 ಕ್ವಿಂಟಾಲ್)',
    unitLitre: 'ಪ್ರತಿ ಲೀಟರ್',
    unitKg: 'ಪ್ರತಿ ಕೆಜಿ',
    unitPcs: '100 ತುಣುಕುಗಳಿಗೆ'
  },
  ml: {
    dashboardTitle: 'കൃഷി-നെറ്റ് ഡാഷ്‌ബോർഡ്',
    chooseSubtitle: 'നിങ്ങളുടെ പ്രാദേശിക ഭാഷ തിരഞ്ഞെടുക്കുക',
    selectLabel: 'പ്രാദേശിക ഭാഷ തിരഞ്ഞെടുക്കുക',
    continueBtn: 'ഡാഷ്‌ബോർഡിലേക്ക് തുടരുക',
    changeLanguageBtn: 'ഭാഷ മാറ്റുക 🔄',
    greeting: 'മലയാളവും ഇംഗ്ലീഷും തിരഞ്ഞെടുത്തു. കൃഷി-നെറ്റിലേക്ക് സ്വാഗതം.',
    englishNotice: 'ഇംഗ്ലീഷ് പ്രധാന ഭാഷയായി എപ്പോഴും സജീവമായിരിക്കും. എല്ലാ സംഖ്യകളും ഇംഗ്ലീഷ് അക്കങ്ങളിൽ (0-9) കാണിക്കും.',
    exploreCrops: 'എല്ലാ വിളകളും കാണുക',
    loadingPrices: 'വിലകൾ ലോഡ് ചെയ്യുന്നു...',
    needSupport: 'സഹായം വേണോ?',
    whatsAppSupport: 'വാട്ട്‌സ്ആപ്പ് സഹായം',
    unitQuintal: '100 കിലോയ്ക്ക് (1 ക്വിന്റൽ)',
    unitLitre: 'ലിറ്ററിന്',
    unitKg: 'കിലോയ്ക്ക്',
    unitPcs: '100 എണ്ണത്തിന്'
  },
  mr: {
    dashboardTitle: 'कृषी-नेट डॅशबोर्ड',
    chooseSubtitle: 'आपली प्रादेशिक भाषा निवडा',
    selectLabel: 'प्रादेशिक भाषा निवडा',
    continueBtn: 'डॅशबोर्डवर सुरू ठेवा',
    changeLanguageBtn: 'भाषा बदला 🔄',
    greeting: 'मराठी आणि इंग्रजी भाषा निवडली आहे. कृषी-नेटमध्ये आपले स्वागत आहे.',
    englishNotice: 'इंग्रजी मुख्य भाषा म्हणून नेहमी सक्रिय राहील. सर्व आकडे इंग्रजी अंकांमध्ये (0-9) दिसतील.',
    exploreCrops: 'सर्व पिके पहा',
    loadingPrices: 'भाव लोड होत आहेत...',
    needSupport: 'मदत हवी आहे का?',
    whatsAppSupport: 'व्हॉट्सॲप मदत',
    unitQuintal: 'प्रति १०० किलो (१ क्विंटल)',
    unitLitre: 'प्रति लिटर',
    unitKg: 'प्रति किलो',
    unitPcs: 'प्रति १०० नग'
  },
  bn: {
    dashboardTitle: 'কৃষি-নেট ড্যাশবোর্ড',
    chooseSubtitle: 'আপনার আঞ্চলিক ভাষা নির্বাচন করুন',
    selectLabel: 'আঞ্চলিক ভাষা নির্বাচন করুন',
    continueBtn: 'ড্যাশবোর্ডে এগিয়ে যান',
    changeLanguageBtn: 'ভাষা পরিবর্তন করুন 🔄',
    greeting: 'বাংলা এবং ইংরেজি ভাষা নির্বাচন করা হয়েছে। কৃষি-নেটে স্বাগতম।',
    englishNotice: 'ইংরেজি প্রধান ভাষা হিসেবে সর্বদা সক্রিয় থাকবে। সমস্ত সংখ্যা ইংরেজিতে (0-9) থাকবে।',
    exploreCrops: 'সব ফসল দেখুন',
    loadingPrices: 'দর লোড হচ্ছে...',
    needSupport: 'সাহায্য প্রয়োজন?',
    whatsAppSupport: 'হোয়াটসঅ্যাপ সহায়তা',
    unitQuintal: 'প্রতি ১০০ কেজি (১ কুইন্টাল)',
    unitLitre: 'প্রতি লিটার',
    unitKg: 'প্রতি কেজি',
    unitPcs: 'প্রতি ১০০ টি'
  },
  pa: {
    dashboardTitle: 'ਕ੍ਰਿਸ਼ੀ-ਨੈੱਟ ਡੈਸ਼ਬੋਰਡ',
    chooseSubtitle: 'ਆਪਣੀ ਖੇਤਰੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    selectLabel: 'ਖੇਤਰੀ ਭਾਸ਼ਾ ਦੀ ਚੋਣ ਕਰੋ',
    continueBtn: 'ਡੈਸ਼ਬੋਰਡ ਵੱਲ ਵਧੋ',
    changeLanguageBtn: 'ਭਾਸ਼ਾ ਬਦਲੋ 🔄',
    greeting: 'ਪੰਜਾਬੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਭਾਸ਼ਾ ਚੁਣੀ ਗਈ ਹੈ। ਕ੍ਰਿਸ਼ੀ-ਨੈੱਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।',
    englishNotice: 'ਅੰਗਰੇਜ਼ੀ ਮੁੱਖ ਭਾਸ਼ਾ ਵਜੋਂ ਹਮੇਸ਼ਾ ਕਿਰਿਆਸ਼ੀਲ ਰਹੇਗੀ। ਸਾਰੇ ਨੰਬਰ ਅੰਗਰੇਜ਼ੀ ਅੰਕਾਂ (0-9) ਵਿੱਚ ਹੋਣਗੇ।',
    exploreCrops: 'ਸਾਰੀਆਂ ਫਸਲਾਂ ਦੇਖੋ',
    loadingPrices: 'ਭਾਅ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...',
    needSupport: 'ਮਦਦ ਚਾਹੀਦੀ ਹੈ?',
    whatsAppSupport: 'ਵਟਸਐਪ ਸਹਾਇਤਾ',
    unitQuintal: 'ਪ੍ਰਤੀ 100 ਕਿਲੋ (1 ਕੁਇੰਟਲ)',
    unitLitre: 'ਪ੍ਰਤੀ ਲੀਟਰ',
    unitKg: 'ਪ੍ਰਤੀ ਕਿਲੋ',
    unitPcs: 'ਪ੍ਰਤੀ 100 ਨਗ'
  },
  gu: {
    dashboardTitle: 'કૃષિ-નેટ ડેશબોર્ડ',
    chooseSubtitle: 'તમારી પ્રાદેશિક ભાષા પસંદ કરો',
    selectLabel: 'પ્રાદેશિક ભાષા પસંદ કરો',
    continueBtn: 'ડેશબોર્ડ પર આગળ વધો',
    changeLanguageBtn: 'ભાષા બદલો 🔄',
    greeting: 'ગુજરાતી અને અંગ્રેજી ભાષા પસંદ કરવામાં આવી છે. કૃષિ-નેટમાં તમારું સ્વાગત છે.',
    englishNotice: 'અંગ્રેજી મુખ્ય ભાષા તરીકે હંમેશા સક્રિય રહેશે. તમામ નંબરો અંગ્રેજી અંકો (0-9) માં દેખાશે.',
    exploreCrops: 'બધા પાક જુઓ',
    loadingPrices: 'ભાવ લોડ થઈ રહ્યા છે...',
    needSupport: 'મદદ જોઈએ છે?',
    whatsAppSupport: 'વોટ્સએપ સહાય',
    unitQuintal: 'પ્રતિ 100 કિલો (1 ક્વિન્ટલ)',
    unitLitre: 'પ્રતિ લિટર',
    unitKg: 'પ્રતિ કિલો',
    unitPcs: 'પ્રતિ 100 નંગ'
  },
  or: {
    dashboardTitle: 'କୃଷି-ନେଟ୍ ଡ୍ୟାସବୋର୍ଡ',
    chooseSubtitle: 'ଆପଣଙ୍କର ଆଞ୍ଚଳିକ ଭାଷା ବାଛନ୍ତୁ',
    selectLabel: 'ଆଞ୍ଚଳିକ ଭାଷା ବାଛନ୍ତୁ',
    continueBtn: 'ଡ୍ୟାସବୋର୍ଡକୁ ଯାଆନ୍ତୁ',
    changeLanguageBtn: 'ଭାଷା ବଦଳାନ୍ତୁ 🔄',
    greeting: 'ଓଡ଼ିଆ ଏବଂ ଇଂରାଜୀ ଭାଷା ଚୟନ କରାଗଲା। କୃଷି-ନେଟ୍‌କୁ ସ୍ୱାଗତ।',
    englishNotice: 'ଇଂରାଜୀ ମୁଖ୍ୟ ଭାଷା ଭାବରେ ସର୍ବଦା ସକ୍ରିୟ ରହିବ। ସମସ୍ତ ସଂଖ୍ୟା ଇଂରାଜୀ (0-9) ରେ ରହିବ।',
    exploreCrops: 'ସମସ୍ତ ଫସଲ ଦେଖନ୍ତୁ',
    loadingPrices: 'ଦର ଲୋଡ୍ ହେଉଛି...',
    needSupport: 'ସହାୟତା ଦରକାର କି?',
    whatsAppSupport: 'ହ୍ୱାଟସ୍‌ଆପ୍ ସହାୟତା',
    unitQuintal: 'ପ୍ରତି ୧୦୦ କିଗ୍ରା (୧ କ୍ୱିଣ୍ଟାଲ)',
    unitLitre: 'ପ୍ରତି ଲିଟର',
    unitKg: 'ପ୍ରତି କିଗ୍ରା',
    unitPcs: 'ପ୍ରତି ୧୦୦ ଖଣ୍ଡ'
  },
  as: {
    dashboardTitle: 'কৃষি-নেট ডেছব\'ৰ্ড',
    chooseSubtitle: 'আপোনাৰ আঞ্চলিক ভাষা বাছক',
    selectLabel: 'আঞ্চলিক ভাষা বাছক',
    continueBtn: 'ডেছব\'ৰ্ডলৈ আগবাঢ়ক',
    changeLanguageBtn: 'ভাষা সলনি কৰক 🔄',
    greeting: 'অসমীয়া আৰু ইংৰাজী ভাষা নিৰ্বাচন কৰা হ\'ল। কৃষি-নেটলৈ স্বাগতম।',
    englishNotice: 'ইংৰাজী মুখ্য ভাষা হিচাপে সদায় সক্ৰিয় থাকিব। সকলো সংখ্যা ইংৰাজীত (0-9) থাকিব।',
    exploreCrops: 'সকলো শস্য চাওক',
    loadingPrices: 'মূল্য লোড হৈ আছে...',
    needSupport: 'সহায়ৰ প্ৰয়োজন নেকি?',
    whatsAppSupport: 'হোৱাটছএপ সহায়',
    unitQuintal: 'প্ৰতি ১০০ কিঃগ্ৰাঃ (১ কুইণ্টল)',
    unitLitre: 'প্ৰতি লিটাৰ',
    unitKg: 'প্ৰতি কিঃগ্ৰাঃ',
    unitPcs: 'প্ৰতি ১০০ টা'
  },
  ur: {
    dashboardTitle: 'کرشی نیٹ ڈیش بورڈ',
    chooseSubtitle: 'اپنی علاقائی زبان منتخب کریں',
    selectLabel: 'علاقائی زبان کا انتخاب کریں',
    continueBtn: 'ڈیش بورڈ پر جاری رکھیں',
    changeLanguageBtn: 'زبان تبدیل کریں 🔄',
    greeting: 'اردو اور انگریزی زبان منتخب کی گئی ہے۔ کرشی نیٹ میں خوش آمدید۔',
    englishNotice: 'انگریزی ہمیشہ بنیادی زبان کے طور پر فعال رہے گی۔ تمام نمبر انگریزی ہندسوں (0-9) میں ہوں گے۔',
    exploreCrops: 'تمام فصلیں دیکھیں',
    loadingPrices: 'ریٹ لوڈ ہو رہے ہیں...',
    needSupport: 'مدد درکار ہے؟',
    whatsAppSupport: 'واٹس ایپ سپورٹ',
    unitQuintal: 'فی 100 کلو (1 کوئنٹل)',
    unitLitre: 'فی لیٹر',
    unitKg: 'فی کلو',
    unitPcs: 'فی 100 عدد'
  }
};

export const DASHBOARD_MODULES = {
  liveMarketRates: {
    en: 'Live Market Rates',
    dEn: 'Browse live benchmark prices & trends for 700+ crops with voice announcements',
    te: { title: 'ప్రత్యక్ష మార్కెట్ ధరలు', desc: '700+ పంటల ప్రత్యక్ష ధరలు మరియు ధ్వని సహాయం' },
    hi: { title: 'ताजा मंडी व फसल भाव', desc: '700+ फसलों के ताजा रेट और आवाज सहायता' },
    ta: { title: 'நேரலை சந்தை விலைகள்', desc: '700+ பயிர்களின் நேரலை விலைகள் மற்றும் குரல் வழிகாட்டல்' },
    kn: { title: 'ನೇರ ಮಾರುಕಟ್ಟೆ ದರಗಳು', desc: '700+ ಬೆಳೆಗಳ ನೇರ ದರಗಳು ಮತ್ತು ಧ್ವನಿ ಸೌಲಭ್ಯ' },
    ml: { title: 'തത്സമയ വിപണി നിരക്കുകൾ', desc: '700+ വിളകളുടെ വിപണി വിലകളും ശബ്ദ സഹായവും' },
    mr: { title: 'ताजे बाजार भाव', desc: '७००+ पिकांचे ताजे दर व आवाज सुविधा' },
    bn: { title: 'লাইভ বাজার দর', desc: '৭০০+ ফসলের লাইভ রেট এবং ভয়েস সহায়তা' },
    pa: { title: 'ਲਾਈਵ ਮੰਡੀ ਭਾਅ', desc: '700+ ਫਸਲਾਂ ਦੇ ਤਾਜ਼ਾ ਰੇਟ ਅਤੇ ਆਵਾਜ਼ ਸਹਾਇਤਾ' },
    gu: { title: 'લાઈવ બજાર ભાવ', desc: '700+ પાકના તાજા દર અને અવાજ સહાય' },
    or: { title: 'ପ୍ରତ୍ୟକ୍ଷ ବଜାର ଦର', desc: '୭୦୦+ ଫସଲର ଲାଇଭ୍ ଦର ଓ ଭଏସ ସହାୟତା' },
    as: { title: 'বজাৰৰ লাইভ মূল্য', desc: '৭০০+ শস্যৰ লাইভ মূল্য আৰু ভয়েচ সহায়' },
    ur: { title: 'تازہ ترین منڈی ریٹ', desc: '700+ فصلوں کے ریٹ اور صوتی امداد' }
  },
  finance: {
    en: 'Finance & Kisan Credit Loans',
    dEn: 'Concessional KCC crop loans at 4% net interest, tractor credit & EMI calculator',
    te: { title: 'వ్యవసాయ రుణాలు (Finance)', desc: '4% వడ్డీతో కిసాన్ క్రెడిట్ కార్డు రుణాలు మరియు EMI కాలిక్యులేటర్' },
    hi: { title: 'कृषि ऋण (Finance)', desc: '4% रियायती ब्याज पर केसीसी ऋण और ईएमआई कैलकुलेटर' },
    ta: { title: 'விவசாய கடன்கள் (Finance)', desc: '4% வட்டியில் கிசான் கிரெடிட் கார்டு கடன்கள் மற்றும் தவணை கணக்கீடு' },
    kn: { title: 'ಕೃಷಿ ಸಾಲಗಳು (Finance)', desc: '4% ಬಡ್ಡಿದರದಲ್ಲಿ ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಸಾಲಗಳು ಮತ್ತು ಇಎಂಐ ಕ್ಯಾಲ್ಕುಲೇಟರ್' },
    ml: { title: 'കാർഷിക വായ്പകൾ (Finance)', desc: '4% പലിശയിൽ കിസാൻ ക്രെഡിറ്റ് കാർഡ് വായ്പകളും ഇമി കണക്കുകൂട്ടലും' },
    mr: { title: 'कृषी कर्ज व पतपुरवठा (Finance)', desc: '४% सवलतीच्या दरात किसान क्रेडिट कार्ड कर्ज व ईएमआय कॅल्क्युलेटर' },
    bn: { title: 'কৃষি ঋণ (Finance)', desc: '৪% সুদে কিষাণ ক্রেডিট কার্ড ঋণ ও ইএমআই ক্যালকুলেটর' },
    pa: { title: 'ਖੇਤੀ ਕਰਜ਼ੇ (Finance)', desc: '4% ਵਿਆਜ ਤੇ ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਕਰਜ਼ੇ ਅਤੇ EMI ਕੈਲਕੁਲੇਟਰ' },
    gu: { title: 'ખેતી લોન (Finance)', desc: '4% વ્યાજે કિસાન ક્રેડિટ કાર્ડ લોન અને EMI કેલ્ક્યુલેટર' },
    or: { title: 'କୃଷି ଋଣ (Finance)', desc: '୪% ସୁଧରେ କିଷାନ କ୍ରେଡିଟ୍ କାର୍ଡ ଋଣ ଓ EMI କାଲକୁଲେଟର' },
    as: { title: 'কৃষি ঋণ (Finance)', desc: '৪% সুতত কিষাণ ক্ৰেডিট কাৰ্ড ঋণ আৰু ইএমআই কেলকুলেটৰ' },
    ur: { title: 'زرعی قرضہ جات (Finance)', desc: '4 فیصد شرح سود پر کسان کریڈٹ کارڈ اور EMI کیلکولیٹر' }
  },
  soilHealth: {
    en: 'Soil Health Analyser',
    dEn: 'Upload soil photos for instant health analysis & recommendations',
    te: { title: 'నేల పరీక్ష & విశ్లేషణ', desc: 'నేల ఫోటోను అప్‌లోడ్ చేసి తక్షణ విశ్లేషణ పొందండి' },
    hi: { title: 'मिट्टी की जांच', desc: 'मिट्टी की फोटो अपलोड करें और जांच रिपोर्ट पाएं' },
    ta: { title: 'மண் பரிசோதனை', desc: 'மண் புகைப்படத்தை பதிவேற்றி அறிக்கை பெறுங்கள்' },
    kn: { title: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ತಪಾಸಣೆ', desc: 'ಮಣ್ಣಿನ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ವರದಿ ಪಡೆಯಿರಿ' },
    ml: { title: 'മണ്ണ് പരിശോധന', desc: 'മണ്ണ് ഫോട്ടോ അപ്‌ലോഡ് ചെയ്ത് റിപ്പോർട്ട് നേടുക' },
    mr: { title: 'माती आरोग्य तपासणी', desc: 'मातीचा फोटो अपलोड करा आणि अहवाल मिळवा' },
    bn: { title: 'মাটি পরীক্ষা', desc: 'মাটির ছবি আপলোড করে রিপোর্ট পান' },
    pa: { title: 'ਮਿੱਟੀ ਦੀ ਜਾਂਚ', desc: 'ਮਿੱਟੀ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ ਅਤੇ ਰਿਪੋਰਟ ਪ੍ਰਾਪਤ ਕਰੋ' },
    gu: { title: 'જમીનની ચકાસણી', desc: 'માટીનો ફોટો અપલોડ કરીને રિપોર્ટ મેળવો' },
    or: { title: 'ମାଟି ପରୀକ୍ଷା', desc: 'ମାଟି ଫଟୋ ଅପଲୋଡ୍ କରି ତୁରନ୍ତ ରିପୋର୍ଟ ପାଆନ୍ତୁ' },
    as: { title: 'মাটি পৰীক্ষা', desc: 'মাটিৰ ফটো আপলোড কৰি ৰিপোৰ্ট লাভ কৰক' },
    ur: { title: 'مٹی کا تجزیہ', desc: 'مٹی کی تصویر اپ لوڈ کر کے رپورٹ حاصل کریں' }
  },
  weather: {
    en: 'Weather Forecast',
    dEn: 'Hyper-local weather & precipitation forecast for your farm',
    te: { title: 'వాతావరణ అంచనా', desc: 'మీ పొలానికి వాతావరణం మరియు వర్ష సూచన' },
    hi: { title: 'मौसम का हाल', desc: 'अपने खेत के लिए मौसम व बारिश का अनुमान' },
    ta: { title: 'வானிலை முன்னறிவிப்பு', desc: 'உங்கள் பண்ணைக்கான வானிலை மற்றும் மழை முன்னறிவிப்பு' },
    kn: { title: 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ', desc: 'ನಿಮ್ಮ ಜಮೀನಿನ ಹವಾಮಾನ ಮತ್ತು ಮಳೆಯ ವಿವರ' },
    ml: { title: 'കാലാവസ്ഥാ പ്രവചനം', desc: 'നിങ്ങളുടെ കൃഷിയിടത്തിലെ കാലാവസ്ഥയും മഴയും' },
    mr: { title: 'हवामान अंदाज', desc: 'आपल्या शेतासाठी हवामान व पावसाचा अंदाज' },
    bn: { title: 'আবহাওয়ার পূর্বাভাস', desc: 'আপনার খামারের আবহাওয়া ও বৃষ্টির পূর্বাভাস' },
    pa: { title: 'ਮੌਸਮ ਦੀ ਭਵਿੱਖਬਾਣੀ', desc: 'ਆਪਣੇ ਖੇਤ ਲਈ ਮੌਸਮ ਅਤੇ ਮੀਂਹ ਦਾ ਅਨੁਮਾਨ' },
    gu: { title: 'હવામાનની આગાહી', desc: 'તમારા ખેતર માટે હવામાન અને વરસાદની આગાહી' },
    or: { title: 'ପାଣିପାଗ ପୂର୍ବାନୁମାନ', desc: 'ଆପଣଙ୍କ ଜମି ପାଇଁ ପାଣିପାଗ ଓ ବର୍ଷା ସୂଚନା' },
    as: { title: 'বতৰৰ পূৰ্বাভাস', desc: 'আপোনাৰ পথাৰৰ বতৰ আৰু বৰষুণৰ তথ্য' },
    ur: { title: 'موسم کی پیش گوئی', desc: 'آپ کے کھیت کے لیے موسم اور بارش کا حال' }
  },
  directProcurement: {
    en: 'Direct Farm-Gate Selling',
    dEn: 'Sell crops directly to verified commercial buyers at benchmark rates',
    te: { title: 'నేరుగా పంట అమ్మకాలు', desc: 'మధ్యవర్తులు లేకుండా నేరుగా గిట్టుబాటు ధరకు అమ్మండి' },
    hi: { title: 'सीधी फसल बिक्री', desc: 'मंडी के बिचौलियों के बिना सीधे उचित भाव पर बेचें' },
    ta: { title: 'நேரடி பயிர் விற்பனை', desc: 'இடைத்தரகர்கள் இன்றி சிறந்த விலையில் விற்கலாம்' },
    kn: { title: 'ನೇರ ಬೆಳೆ ಮಾರಾಟ', desc: 'ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ನೇರವಾಗಿ ಉತ್ತಮ ಬೆಲೆಗೆ ಮಾರಿ' },
    ml: { title: 'നേരിട്ടുള്ള വിള വില്പന', desc: 'ഇടനിലക്കാരില്ലാതെ മികച്ച വിലയ്ക്ക് വിൽക്കുക' },
    mr: { title: 'थेट पीक विक्री', desc: 'दलालांशिवाय थेट रास्त भावात शेतमाल विका' },
    bn: { title: 'সরাসরি ফসল বিক্রি', desc: 'দালাল ছাড়া সরাসরি সঠিক মূল্যে বিক্রি করুন' },
    pa: { title: 'ਸਿੱਧੀ ਫਸਲ ਵਿਕਰੀ', desc: 'ਬਿਨਾਂ ਵਿਚੋਲਿਆਂ ਦੇ ਸਿੱਧੇ ਸਹੀ ਮੁੱਲ ਤੇ ਵੇਚੋ' },
    gu: { title: 'સીધું પાક વેચાણ', desc: 'વચેટિયા વગર સીધા યોગ્ય ભાવે વેચો' },
    or: { title: 'ସିଧାସଳଖ ଫସଲ ବିକ୍ରି', desc: 'ଦଲାଲ ମୁକ୍ତ ସିଧାସଳଖ ଉଚିତ୍ ମୂଲ୍ୟରେ ବିକ୍ରୟ କରନ୍ତୁ' },
    as: { title: 'পোনপটীয়া শস্য বিক্ৰী', desc: 'মধ্যভোগী নোহোৱাকৈ উপযুক্ত মূল্যত বিক্ৰী কৰক' },
    ur: { title: 'براہ راست فصل کی فروخت', desc: 'بغیر کسی درمیانی آدمی کے مناسب قیمت پر بیچیں' }
  },
  aiAssistant: {
    en: 'AI Agronomy Specialist',
    dEn: '24/7 intelligent voice assistant for crop diseases and diagnosis',
    te: { title: 'AI వ్యవసాయ నిపుణుడు', desc: 'పంట తెగుళ్లు, ఎరువుల నిర్వహణకు AI సహాయకుడు' },
    hi: { title: 'कृषि-नेट AI विशेषज्ञ', desc: 'फसल रोग, खाद व कीट नियंत्रण के लिए 24/7 AI सहायक' },
    ta: { title: 'AI வேளாண் நிபுணர்', desc: 'பயிர் நோய்கள் மற்றும் பூச்சி மேலாண்மைக்கான AI' },
    kn: { title: 'AI ಕೃಷಿ ತಜ್ಞ', desc: 'ಬೆಳೆ ರೋಗ ಮತ್ತು ಕೀಟ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ AI ಸಹಾಯಕ' },
    ml: { title: 'AI കാർഷിക വിദഗ്ദ്ധൻ', desc: 'വിള രോഗങ്ങൾക്കും കീടനിയന്ത്രണത്തിനുമുള്ള AI' },
    mr: { title: 'AI कृषी सल्लागार', desc: 'पीक रोग व खत व्यवस्थापनासाठी AI सहाय्यक' },
    bn: { title: 'AI কৃষি বিশেষজ্ঞ', desc: 'ফসলের রোগ ও সার ব্যবস্থাপনায় ২৪/৭ AI' },
    pa: { title: 'AI ਖੇਤੀਬਾੜੀ ਮਾਹਰ', desc: 'ਫਸਲੀ ਬਿਮਾਰੀਆਂ ਅਤੇ ਕੀੜਿਆਂ ਦੇ ਹੱਲ ਲਈ AI' },
    gu: { title: 'AI કૃષિ નિષ્ણાत', desc: 'પાકના રોગ અને ખાતર વ્યવસ્થાપન માટે AI' },
    or: { title: 'AI କୃଷି ବିଶେଷଜ୍ଞ', desc: 'ଫସଲ ରୋଗ ଓ ଖତ ପରିଚାଳନା ପାଇଁ AI ସହାୟକ' },
    as: { title: 'AI কৃষি বিশেষজ্ঞ', desc: 'শস্যৰ ৰোগ আৰু কীট নিয়ন্ত্ৰণৰ বাবে AI' },
    ur: { title: 'AI زرعی ماہر', desc: 'فصلوں کی بیماریوں کے علاج کے لیے AI اسسٹنٹ' }
  },
  schemes: {
    en: 'Government Schemes & Subsidies',
    dEn: 'Official subsidies, financial grants and government schemes',
    te: { title: 'ప్రభుత్వ పథకాలు & సబ్సిడీలు', desc: 'రైతుల కోసం అధికారిక సబ్సిడీలు మరియు పథకాలు' },
    hi: { title: 'सरकारी योजनाएं व सब्सिडी', desc: 'किसानों के लिए सरकारी योजनाएं व सब्सिडी' },
    ta: { title: 'அரசு திட்டங்கள் & மானியங்கள்', desc: 'விவசாயிகளுக்கான அரசு திட்டங்கள் மற்றும் மானியங்கள்' },
    kn: { title: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು & ಸಹಾಯಧನ', desc: 'ರೈತರಿಗಾಗಿ ಅಧಿಕೃತ ಸಬ್ಸಿಡಿ ಮತ್ತು ಯೋಜನೆಗಳು' },
    ml: { title: 'സർക്കാർ പദ്ധതികളും സബ്‌സിഡിയും', desc: 'കർഷകർക്കായുള്ള ധനസഹായങ്ങളും പദ്ധതികളും' },
    mr: { title: 'शासकीय योजना व सबसिडी', desc: 'शेतकऱ्यांसाठी शासकीय अनुदान व योजना' },
    bn: { title: 'সরকারি প্রকল্প ও ভর্তুকি', desc: 'কৃষকদের জন্য সরকারি অনুদান ও স্কিম' },
    pa: { title: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਤੇ ਸਬਸਿਡੀਆਂ', desc: 'ਕਿਸਾਨਾਂ ਲਈ ਸਰਕਾਰੀ ਸਹਾਇਤਾ ਤੇ ਸਕੀਮਾਂ' },
    gu: { title: 'સરકારી યોજનાઓ અને સબસિડી', desc: 'ખેડૂતો માટે સત્તાવાર સહાય અને યોજનાઓ' },
    or: { title: 'ସରକାରୀ ଯୋଜନା ଓ ସବସିଡି', desc: 'ଚାଷୀଙ୍କ ପାଇଁ ସରକାରୀ ଅନୁଦାନ ଓ ଯୋଜନା' },
    as: { title: 'চৰকাৰী আঁচনি আৰু ৰাজসাহায্য', desc: 'কৃষকৰ বাবে চৰকাৰী অনুদান আৰু আঁচনি' },
    ur: { title: 'سرکاری اسکیمیں اور سبسڈی', desc: 'کسانوں کے لیے سرکاری مراعات اور فنڈز' }
  },
  equipment: {
    en: 'Equipment Rental Near You',
    dEn: 'Rent tractors, harvesters, and implements with live GPS rates',
    te: { title: 'యంత్రాల అద్దె సేవలు', desc: 'ట్రాక్టర్లు మరియు కోత యంత్రాలను అద్దెకు తీసుకోండి' },
    hi: { title: 'कृषि यंत्र किराया', desc: 'ट्रैक्टर, कंबाइन व उपकरण किराए पर लें' },
    ta: { title: 'வேளாண் உபகரண வாடகை', desc: 'டிராக்டர்கள் மற்றும் அறுவடை இயந்திரங்கள் வாடகைக்கு' },
    kn: { title: 'ಕೃಷಿ ಉಪಕರಣಗಳ ಬಾಡಿಗೆ', desc: 'ಟ್ರಾಕ್ಟರ್ ಮತ್ತು ಕೊಯ್ಲು ಯಂತ್ರಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ' },
    ml: { title: 'കാർഷിക ഉപകരണ വാടക', desc: 'ട്രാക്ടറുകളും യന്ത്രങ്ങളും വാടകയ്‌ക്കെടുക്കുക' },
    mr: { title: 'यंत्रसामग्री भाडेतत्त्वावर', desc: 'ट्रॅक्टर व शेती अवजारे वाजवी दरात मिळवा' },
    bn: { title: 'কৃষি যন্ত্রপাতি ভাড়া', desc: 'ট্রাক্টর ও ফসল কাটার মেশিন ভাড়া নিন' },
    pa: { title: 'ਖੇਤੀ ਸੰਦ ਕਿਰਾਏ ਤੇ', desc: 'ਟਰੈਕਟਰ ਅਤੇ ਹਾਰਵੈਸਟਰ ਕਿਰਾਏ ਤੇ ਲਵੋ' },
    gu: { title: 'કૃષિ સાધનો ભાડે', desc: 'ટ્રેક્ટર અને હાર્વેસ્ટર યોગ્ય ભાડે મેળવો' },
    or: { title: 'କୃଷି ଯନ୍ତ୍ରପାତି ଭଡ଼ା', desc: 'ଟ୍ରାକ୍ଟର ଓ ଅମଳ ଯନ୍ତ୍ର ଭଡ଼ାରେ ନିଅନ୍ତୁ' },
    as: { title: 'কৃষি সঁজুলি ভাড়া', desc: 'ট্ৰেক্টৰ আৰু চপোৱা মেচিন ভাড়া লওক' },
    ur: { title: 'زرعی آلات کرایہ پر', desc: 'ٹریکٹر اور کٹائی کی مشینیں کرائے پر حاصل کریں' }
  },
  communityNews: {
    en: 'Community News & Advisories',
    dEn: 'Real-time agricultural news, monsoon updates, and farmer bulletins',
    te: { title: 'రైతు వార్తలు & సమాచారం', desc: 'వ్యవసాయ విధానాలు మరియు మార్కెట్ తాజా సమాచారం' },
    hi: { title: 'किसान समाचार व सूचनाएं', desc: 'कृषि नीतियां, मौसम और बाजार की ताजा खबरें' },
    ta: { title: 'விவசாய செய்திகள்', desc: 'வேளாண் கொள்கைகள் மற்றும் சந்தை செய்திகள்' },
    kn: { title: 'ರೈತ ಸುದ್ದಿ ಮತ್ತು ಸಮಾಚಾರ', desc: 'ಕೃಷಿ ನೀತಿಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆ ತಾಜಾ ಸುದ್ದಿ' },
    ml: { title: 'കർഷക വാർത്തകൾ', desc: 'കാർഷിക നയങ്ങളും വിപണി വിവരങ്ങളും' },
    mr: { title: 'शेतकरी बातम्या', desc: 'शेती विषयक धोरणे व बाजारातील घडामोडी' },
    bn: { title: 'কৃষক খবর ও আপডেট', desc: 'কৃষি নীতি এবং বাজারের সর্বশেষ খবর' },
    pa: { title: 'ਕਿਸਾਨ ਖ਼ਬਰਾਂ ਤੇ ਅੱਪਡੇਟ', desc: 'ਖੇਤੀ ਨੀਤੀਆਂ ਅਤੇ ਮੰਡੀ ਦੀਆਂ ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ' },
    gu: { title: 'ખેડૂત સમાચારો', desc: 'કૃષિ નીતિઓ અને બજારના તાજા સમાચાર' },
    or: { title: 'କୃଷକ ଖବର ଓ ସୂଚନା', desc: 'କୃଷି ନୀତି ଓ ବଜାରର ସଦ୍ୟତମ ତଥ୍ୟ' },
    as: { title: 'কৃষকৰ বাৰ্তা আৰু খবৰ', desc: 'কৃষি নীতি আৰু বজাৰৰ শেহতীয়া খবৰ' },
    ur: { title: 'کسان خبریں اور تجاویز', desc: 'زرعی پالیسیاں اور مارکیٹ کے تازہ ترین حالات' }
  },
  cropPlanner: {
    en: 'Crop Season Planner',
    dEn: 'AI crop calendar, seed selection & sowing timeline optimization',
    te: { title: 'పంట ప్రణాళిక (Crop Planner)', desc: 'విత్తనాలు, నాట్లు మరియు కాలెండర్ ప్రణాళిక' },
    hi: { title: 'फसल चक्र व योजना', desc: 'बुआई समय, बीज चयन व मौसम अनुसार फसल योजना' }
  },
  pestDisease: {
    en: 'Pest & Disease Clinic',
    dEn: 'Instant diagnosis of crop pathogens, symptoms & eco-friendly sprays',
    te: { title: 'తెగుళ్ల నివారణ (Pest Clinic)', desc: 'పంట రోగాల గుర్तिంపు మరియు ఔషధాల సలహా' },
    hi: { title: 'कीट व रोग निदान', desc: 'फसल रोगों की तुरंत पहचान और उपचार परामर्श' }
  },
  irrigation: {
    en: 'Smart Irrigation Schedule',
    dEn: 'Moisture tracking, pump automation timings & water conservation',
    te: { title: 'నీటి పారుదల (Smart Irrigation)', desc: 'తేమ ఆధారంగా నీటి విడుదల సమయాల ప్రణాళిక' },
    hi: { title: 'सिंचाई प्रबंधन', desc: 'मृदा नमी अनुसार सिंचाई समय व जल संरक्षण' }
  }
};

export const DUAL_DICTIONARY = {
  welcome: {
    en: 'Welcome',
    none: 'Welcome',
    te: 'స్వాగతం',
    hi: 'स्वागत है',
    ta: 'வரவேற்கிறோம்',
    kn: 'ಸ್ವಾಗತ',
    ml: 'സ്വാഗതം',
    mr: 'स्वागत आहे',
    bn: 'স্বাগতম',
    pa: 'ਸੁਆਗਤ ਹੈ',
    gu: 'સ્વાગત છે',
    or: 'ସ୍ୱାଗତ',
    as: 'স্বাগতম',
    ur: 'خوش آمدید'
  },
  mandiRatesTitle: {
    en: 'Live Market Benchmark Rates',
    none: 'Live Market Benchmark Rates',
    te: 'ప్రత్యక్ష మార్కెట్ ధరలు',
    hi: 'ताजा मंडी भाव',
    ta: 'நேரலை சந்தை விலைகள்',
    kn: 'ನೇರ ಮಾರುಕಟ್ಟೆ ದರಗಳು',
    ml: 'തത്സമയ വിപണി നിരക്കുകൾ',
    mr: 'ताजे बाजार भाव',
    bn: 'লাইভ বাজার দর',
    pa: 'ਲਾਈਵ ਮੰਡੀ ਭਾਅ',
    gu: 'લાઈવ બજાર ભાવ',
    or: 'ପ୍ରତ୍ୟକ୍ଷ ବଜାର ଦର',
    as: 'বজাৰৰ লাইভ মূল্য',
    ur: 'تازہ ترین منڈی ریٹ'
  },
  mandiRatesSubtitle: {
    en: '700+ Global & Domestic Commodities',
    none: '700+ Global & Domestic Commodities',
    te: '700+ పంటల ప్రత్యక్ష ధరలు మరియు విశ్లేషణ',
    hi: '700+ प्रमुख फसलों के ताजा भाव व रुझान',
    ta: '700+ பயிர்களின் நேரலை விலைகள்',
    kn: '700+ ಬೆಳೆಗಳ ನೇರ ದರಗಳು',
    ml: '700+ വിളകളുടെ വിപണി വിലകൾ',
    mr: '७००+ पिकांचे ताजे दर',
    bn: '৭০০+ ফসলের লাইভ রেট',
    pa: '700+ ਫਸਲਾਂ ਦੇ ਤਾਜ਼ਾ ਰੇਟ',
    gu: '700+ પાકના તાજા દર',
    or: '୭୦୦+ ଫସଲର ଲାଇଭ୍ ଦର',
    as: '৭০০+ শস্যৰ লাইভ মূল্য',
    ur: '700+ فصلوں کے ریٹ'
  },
  exploreCropsBtn: {
    en: 'Explore 700+ Crops',
    none: 'Explore 700+ Crops',
    te: 'అన్ని పంటలు చూడండి',
    hi: 'सभी फसलें देखें',
    ta: 'அனைத்து பயிர்களையும் காண்க',
    kn: 'ಎಲ್ಲಾ ಬೆಳೆಗಳನ್ನು ನೋಡಿ',
    ml: 'എല്ലാ വിളകളും കാണുക',
    mr: 'सर्व पिके पहा',
    bn: 'সব ফসল দেখুন',
    pa: 'ਸਾਰੀਆਂ ਫਸਲਾਂ ਦੇਖੋ',
    gu: 'બધા પાક જુઓ',
    or: 'ସମସ୍ତ ଫସଲ ଦେଖନ୍ତୁ',
    as: 'সকলো শস্য চাওক',
    ur: 'تمام فصلیں دیکھیں'
  }
};

/**
 * Clean & Comprehensive Crop Name Dictionary across all commodity codes
 */
export const CROP_DUAL_NAMES = {
  // Grains & Cereals
  WHEAT: { en: 'Wheat', te: 'గోధుమలు', hi: 'गेहूँ', ta: 'கோதுமை', kn: 'ಗೋಧಿ', ml: 'ഗോതമ്പ്', mr: 'गहू', bn: 'গম', pa: 'ਕਣਕ', gu: 'ઘઉં', or: 'ଗହମ', as: 'ঘেঁহু', ur: 'گندم', icon: '🌾' },
  RICE: { en: 'Paddy / Rice', te: 'వరి / బియ్యం', hi: 'धान / चावल', ta: 'நெல் / அரிசி', kn: 'ಭತ್ತ / ಅಕ್ಕಿ', ml: 'നെല്ല് / അരി', mr: 'भात / तांदूळ', bn: 'ধান / চাল', pa: 'ਝੋਨਾ / ਚੌਲ', gu: 'ડાંગર / ચોખા', or: 'ଧାନ / ଚାଉଳ', as: 'ধান / চাউল', ur: 'دھان / چاول', icon: '🍚' },
  CORN: { en: 'Corn / Maize', te: 'మొక్కజొన్న', hi: 'मक्का', ta: 'மக்காச்சோளம்', kn: 'ಮೆಕ್ಕೆಜೋಳ', ml: 'മക്കച്ചോളം', mr: 'मका', bn: 'ভুট্টা', pa: 'ਮੱਕੀ', gu: 'મકાઈ', or: 'ମକା', as: 'মাকৈ', ur: 'مکئی', icon: '🌽' },
  MAIZE: { en: 'Corn / Maize', te: 'మొక్కజొన్న', hi: 'मक्का', ta: 'மக்காச்சோளம்', kn: 'ಮೆಕ್ಕೆಜೋಳ', ml: 'മക്കച്ചോളം', mr: 'मका', bn: 'ভুট্টা', pa: 'ਮੱਕੀ', gu: 'મકાઈ', or: 'ମକା', as: 'মাকৈ', ur: 'مکئی', icon: '🌽' },
  BARLEY: { en: 'Barley', te: 'బార్లీ (యావలు)', hi: 'जौ', ta: 'பார்லி', kn: 'ಬಾರ್ಲಿ (ಜವೆಗೋಧಿ)', ml: 'ബാർലി', mr: 'जवस / सातू', bn: 'যব', pa: 'ਜੌਂ', gu: 'જવ', or: 'ଯବ', as: 'বাৰ্লি', ur: 'جَو', icon: '🌾' },
  OATS: { en: 'Oats', te: 'ఓట్స్', hi: 'जई (ओट्स)', ta: 'ஓட்ஸ்', kn: 'ಓಟ್ಸ್', ml: 'ഓട്സ്', mr: 'ओट्स', bn: 'ওটস', pa: 'ਜਵੀ', gu: 'ઓટ્સ', or: 'ଓଟ୍ସ', as: 'ওটচ', ur: 'اوٹس', icon: '🌾' },
  SORGHUM: { en: 'Sorghum / Jowar', te: 'జొన్నలు', hi: 'ज्वार', ta: 'சோளம்', kn: 'ಜೋಳ', ml: 'ചോളം', mr: 'ज्वारी', bn: 'জোয়ার', pa: 'ਜਵਾਰ', gu: 'જુવાર', or: 'ଜୁଆର', as: 'জোৱাৰ', ur: 'جوار', icon: '🌾' },
  JOWAR: { en: 'Sorghum / Jowar', te: 'జొన్నలు', hi: 'ज्वार', ta: 'சோளம்', kn: 'ಜೋಳ', ml: 'ചോളം', mr: 'ज्वारी', bn: 'জোয়ার', pa: 'ਜਵਾਰ', gu: 'જુવાર', or: 'ଜୁଆର', as: 'জোৱাৰ', ur: 'جوار', icon: '🌾' },
  MILLET: { en: 'Pearl Millet / Bajra', te: 'సజ్జలు', hi: 'बाजरा', ta: 'கம்பு', kn: 'ಸಜ್ಜೆ', ml: 'കമ്പം', mr: 'बाजरी', bn: 'বাজরা', pa: 'ਬਾਜਰਾ', gu: 'બાજરી', or: 'ବାଜରା', as: 'বাজৰা', ur: 'باجرہ', icon: '🌾' },
  BAJRA: { en: 'Pearl Millet / Bajra', te: 'సజ్జలు', hi: 'बाजरा', ta: 'கம்பு', kn: 'ಸಜ್ಜೆ', ml: 'കമ്പം', mr: 'बाजरी', bn: 'বাজরা', pa: 'ਬਾਜਰਾ', gu: 'બાજરી', or: 'ବାଜରା', as: 'বাজৰা', ur: 'باجرہ', icon: '🌾' },
  RAGI: { en: 'Finger Millet / Ragi', te: 'రాగులు (చోళ్ళు)', hi: 'रागी (मडुआ)', ta: 'கேழ்வரகு (ராகி)', kn: 'ರಾಗಿ', ml: 'പഞ്ഞപ്പുല്ല് (റാഗി)', mr: 'नाचणी (रागी)', bn: 'মারুয়া (রাগি)', pa: 'ਰਾਗੀ', gu: 'નાગલી (રાગી)', or: 'ମାଣ୍ଡିଆ', as: 'মৰুৱা ধান', ur: 'راگی', icon: '🌾' },

  // Softs & Plantation
  COFFEE: { en: 'Arabica Coffee', te: 'కాఫీ గింజలు', hi: 'कॉफी', ta: 'காபி கொட்டை', kn: 'ಕಾಫಿ ಬೀಜ', ml: 'കാപ്പി കുരു', mr: 'कॉफी बिया', bn: 'কফি', pa: 'ਕੌਫ਼ੀ', gu: 'કોફી', or: 'କଫି', as: 'কফি', ur: 'کافی', icon: '☕' },
  ROBUSTA: { en: 'Robusta Coffee', te: 'రొబస్టా కాఫీ', hi: 'रोबस्टा कॉफी', ta: 'ரோபஸ்டா காபி', kn: 'ರೊಬಸ್ಟಾ ಕಾಫಿ', ml: 'റോബസ്റ്റ കാപ്പി', mr: 'रोबस्टा कॉफी', bn: 'রোবাস্টা কফি', pa: 'ਰੋਬਸਟਾ ਕੌਫੀ', gu: 'રોબસ્ટા કોફી', or: 'ରୋବଷ୍ଟା କଫି', as: 'ৰোবাষ্টা কফি', ur: 'روبسٹا کافی', icon: '☕' },
  COCOA: { en: 'Cocoa', te: 'కోకో గింజలు', hi: 'कोको', ta: 'கோகோ', kn: 'ಕೋಕೋ', ml: 'കൊക്കോ', mr: 'कोको', bn: 'কোকো', pa: 'ਕੋਕੋ', gu: 'કોકો', or: 'କୋକୋ', as: 'কোকো', ur: 'کوکو', icon: '🍫' },
  SUGAR: { en: 'Refined Sugar', te: 'చక్కెర (పంచదార)', hi: 'चीनी (शक्कर)', ta: 'சர்க்கரை', kn: 'ಸಕ್ಕರೆ', ml: 'പഞ്ചസാര', mr: 'साखर', bn: 'চিনি', pa: 'ਖੰਡ', gu: 'ખાંડ', or: 'ଚିନି', as: 'চেনি', ur: 'چینی', icon: '🍬' },
  SUGARCANE: { en: 'Raw Sugarcane', te: 'చెరకు', hi: 'गन्ना', ta: 'கரும்பு', kn: 'ಕಬ್ಬು', ml: 'കരിമ്പ്', mr: 'ऊस', bn: 'আখ', pa: 'ਗੰਨਾ', gu: 'શેરડી', or: 'ଆଖୁ', as: 'কুঁহিয়াৰ', ur: 'گنا', icon: '🎋' },
  COTTON: { en: 'Raw Cotton', te: 'పత్తి', hi: 'कपास', ta: 'பருத்தி', kn: 'ಹತ್ತಿ', ml: 'പരുത്തി', mr: 'कापूस', bn: 'তুলা', pa: 'ਕਪਾਹ', gu: 'કપાસ', or: 'କପା', as: 'কপাহ', ur: 'کپاس', icon: '☁️' },
  RUBBER: { en: 'Natural Rubber', te: 'రబ్బరు', hi: 'रबर', ta: 'ரப்பர்', kn: 'ರಬ್ಬರ್', ml: 'റബ്ബർ', mr: 'रबर', bn: 'রাবার', pa: 'ਰਬੜ', gu: 'રબર', or: 'ରବର', as: 'ৰবৰ', ur: 'ربڑ', icon: '🌲' },
  TEA: { en: 'CTC / Orthodox Tea', te: 'టీ పొడి / తేయాకు', hi: 'चाय पत्ती', ta: 'தேயிலை', kn: 'ಟೀ ಪುಡಿ', ml: 'തേയില', mr: 'चहा पावडर', bn: 'চা পাতা', pa: 'ਚਾਹ ਪੱਤੀ', gu: 'ચા પત્તી', or: 'ଚାହା ପତି', as: 'চাহ পাত', ur: 'چائے کی پتی', icon: '🍵' },

  // Oilseeds & Pulses
  SOYBEAN: { en: 'Soybean', te: 'సోయాబీన్', hi: 'सोयाबीन', ta: 'சோயாபீன்', kn: 'ಸೋಯಾಬೀನ್', ml: 'സോയാബീൻ', mr: 'सोयाबीन', bn: 'সয়াবিন', pa: 'ਸੋਇਆਬੀਨ', gu: 'સોયાબીન', or: 'ସୋୟାବିନ୍', as: 'ছয়াবিন', ur: 'سویا بین', icon: '🌱' },
  PALMOIL: { en: 'Crude Palm Oil', te: 'పామాయిల్', hi: 'पाम तेल', ta: 'பனை எண்ணெய்', kn: 'ಪಾಮ್ ಎಣ್ಣೆ', ml: 'പാമോയിൽ', mr: 'पाम तेल', bn: 'পাম তেল', pa: 'ਪਾਮ ਤੇਲ', gu: 'પામ તેલ', or: 'ପାମ ତେଲ', as: 'পাম তেল', ur: 'پام آئل', icon: '🛢️' },
  CANOLA: { en: 'Rapeseed / Mustard', te: 'ఆవాలు', hi: 'सरसों / राई', ta: 'கடுகு', kn: 'ಸಾಸಿವೆ', ml: 'കടുക്', mr: 'मोहरी', bn: 'সরিষা', pa: 'ਸਰ੍ਹੋਂ', gu: 'રાઈ / સરસવ', or: 'ସୋରିଷ', as: 'সৰিয়হ', ur: 'سرسوں', icon: '🌼' },
  MUSTARD: { en: 'Rapeseed / Mustard', te: 'ఆవాలు', hi: 'सरसों / राई', ta: 'கடுகு', kn: 'ಸಾಸಿವೆ', ml: 'കടുക്', mr: 'मोहरी', bn: 'সরিষা', pa: 'ਸਰ੍ਹੋਂ', gu: 'રાઈ / સરસવ', or: 'ସୋରିଷ', as: 'সৰিয়হ', ur: 'سرسوں', icon: '🌼' },
  SUNFLOWER: { en: 'Sunflower Seed', te: 'పొద్దుతిరుగుడు గింజలు', hi: 'सूरजमुखी बीज', ta: 'சூரியகாந்தி விதை', kn: 'ಸೂರ್ಯಕಾಂತಿ ಬೀಜ', ml: 'സൂര്യകാന്തി വിത്ത്', mr: 'सूर्यफूल बिया', bn: 'সূর্যমুখী বীজ', pa: 'ਸੂਰਜਮੁਖੀ ਬੀਜ', gu: 'સૂર્યમુખી બીજ', or: 'ସୂର୍ଯ୍ୟମୁଖୀ ମଞ୍ଜି', as: 'সূৰ্যমুখী বীজ', ur: 'سورج مکھی کے بیج', icon: '🌻' },
  GROUNDNUT: { en: 'Groundnut / Peanut', te: 'వేరుశనగ / పల్లీలు', hi: 'मूंगफली', ta: 'வேர்க்கடலை', kn: 'ಕಡಲೆಕಾಯಿ', ml: 'നിലക്കടല', mr: 'भुईमूग / शेंगदाणे', bn: 'চীনাবাদাম', pa: 'ਮੂੰਗਫਲੀ', gu: 'મગફળી', or: 'ଚିନାବାଦାମ', as: 'বাদাম', ur: 'مونگ پھلی', icon: '🥜' },
  CHICKPEA: { en: 'Chickpea / Chana', te: 'శనగలు', hi: 'चना', ta: 'கொண்டைக்கடலை', kn: 'ಕಡಲೆ ಕಾಳು', ml: 'കടല', mr: 'हरभरा / चणा', bn: 'ছোলা', pa: 'ਛੋਲੇ', gu: 'ચણા', or: 'ବୁଟ', as: 'বুটমাহ', ur: 'چنا', icon: '🫘' },
  CHANA: { en: 'Chickpea / Chana', te: 'శనగలు', hi: 'चना', ta: 'கொண்டைக்கடலை', kn: 'ಕಡಲೆ ಕಾಳು', ml: 'കടല', mr: 'हरभरा / चणा', bn: 'ছোলা', pa: 'ਛੋਲੇ', gu: 'ચણા', or: 'ବୁଟ', as: 'বুটমাহ', ur: 'چنا', icon: '🫘' },
  TUR_DAL: { en: 'Pigeon Pea / Arhar Dal', te: 'కందులు / కందిపప్పు', hi: 'अरहर / तुअर दाल', ta: 'துவரம் பருப்பு', kn: 'ತೊಗರಿ ಬೇಳೆ', ml: 'തുവര പരിപ്പ്', mr: 'तूर डाळ', bn: 'অড়হর ডাল', pa: 'ਅਰਹਰ ਦਾਲ', gu: 'તુવેર દાળ', or: 'ହରଡ଼ ଡାଲି', as: 'ৰহৰ দাইল', ur: 'ارہر کی دال', icon: '🫘' },
  MOONG: { en: 'Green Gram / Moong', te: 'పెసలు / పెసరపప్పు', hi: 'मूंग दाल', ta: 'பாசிப் பருப்பு', kn: 'ಹೆಸರು ಕಾಳು', ml: 'ചെറുപയർ', mr: 'मूग डाळ', bn: 'মুগ ডাল', pa: 'ਮੂੰਗੀ ਦਾਲ', gu: 'મગ', or: 'ମୁଗ ଡାଲି', as: 'মগু দাইল', ur: 'مونگ کی دال', icon: '🫘' },
  URAD: { en: 'Black Gram / Urad', te: 'మినుములు / మినప్పప్పు', hi: 'उड़द दाल', ta: 'உளுத்தம் பருப்பு', kn: 'ಉದ್ದಿನ ಬೇಳೆ', ml: 'ഉഴുന്ന്', mr: 'उडीद डाळ', bn: 'কলাই ডাল', pa: 'ਮਾਂਹ ਦੀ ਦਾਲ (ਉੜਦ)', gu: 'અડદ', or: 'ବିରି ଡାଲି', as: 'মাটি মাহ', ur: 'ماش / اڑد کی دال', icon: '🫘' },
  LENTILS: { en: 'Red Lentil / Masoor', te: 'ఎర్ర కందిపప్పు / మసూర్', hi: 'मसूर दाल', ta: 'மைசூர் பருப்பு', kn: 'ಮಸೂರ ಬೇಳೆ', ml: 'മസൂർ പരിപ്പ്', mr: 'मसूर डाळ', bn: 'মসুর ডাল', pa: 'ਮਸਰਾਂ ਦੀ ਦਾਲ', gu: 'મસૂર દાળ', or: 'ମସୁର ଡାଲି', as: 'মচুৰ দাইল', ur: 'مسور کی دال', icon: '🫘' },

  // Spices & Condiments
  TURMERIC: { en: 'Turmeric', te: 'పసుపు', hi: 'हल्दी', ta: 'மஞ்சள்', kn: 'ಅರಿಶಿನ', ml: 'മഞ്ഞൾ', mr: 'हळद', bn: 'হলুদ', pa: 'ਹਲਦੀ', gu: 'હળદર', or: 'ହଳଦୀ', as: 'হালধি', ur: 'ہلدی', icon: '🫚' },
  CARDAMOM: { en: 'Small Cardamom', te: 'ఏలకులు', hi: 'हरी इलायची', ta: 'ஏலக்காய்', kn: 'ಏಲಕ್ಕಿ', ml: 'ഏലം', mr: 'वेलची', bn: 'এলাচ', pa: 'ਇਲਾਇਚੀ', gu: 'એલચી', or: 'ଗୁଜୁରାତି', as: 'ইলাচি', ur: 'سبز الائچی', icon: '🌿' },
  PEPPER: { en: 'Black Pepper', te: 'మిరియాలు', hi: 'काली मिर्च', ta: 'மிளகு', kn: 'ಕಾಳುಮೆಣಸು', ml: 'കുരുമുളക്', mr: 'काळी मिरी', bn: 'গোলমরিচ', pa: 'ਕਾਲੀ ਮਿਰਚ', gu: 'કાળા મરી', or: 'ଗୋଲମରିଚ', as: 'জালুক', ur: 'کالی مرچ', icon: '⚫' },
  BLACK_PEPPER: { en: 'Black Pepper', te: 'మిరియాలు', hi: 'काली मिर्च', ta: 'மிளகு', kn: 'ಕಾಳುಮೆಣಸು', ml: 'കുരുമുളക്', mr: 'काळी मिरी', bn: 'গোলমরিচ', pa: 'ਕਾਲੀ ਮਿਰਚ', gu: 'કાળા મરી', or: 'ଗୋଲମରିଚ', as: 'জালুক', ur: 'کالی مرچ', icon: '⚫' },
  CORIANDER: { en: 'Coriander / Dhaniya', te: 'ధనియాలు / కొత్తిమీర', hi: 'धनिया', ta: 'கொத்தமல்லி (தனியா)', kn: 'ಕೊತ್ತಂಬರಿ ಬೀಜ', ml: 'മല്ലി', mr: 'धने', bn: 'ধনে', pa: 'ਧਨੀਆ', gu: 'ધાણા', or: 'ଧନିଆ', as: 'ধনিয়া', ur: 'دھنیا', icon: '🌿' },
  JEERA: { en: 'Cumin / Jeera', te: 'జీలకర్ర', hi: 'जीरा', ta: 'சீரகம்', kn: 'ಜೀರಿಗೆ', ml: 'ജീരകം', mr: 'जिरे', bn: 'জিরে', pa: 'ਜੀਰਾ', gu: 'જીરું', or: 'ଜିରା', as: 'জীৰা', ur: 'زیرہ', icon: '🌱' },
  CHILLI: { en: 'Red Chilli', te: 'ఎండిన మిరపకాయలు / కారం', hi: 'लाल मिर्च', ta: 'காய்ந்த மிளகாய்', kn: 'ಒಣ ಮೆಣಸಿನಕಾಯಿ', ml: 'വറ്റൽ മുളക്', mr: 'लाल मिरची', bn: 'শুকনো লঙ্কা', pa: 'ਲਾਲ ਮਿਰਚ', gu: 'લાલ મરચું', or: 'ଶୁଖିଲା ଲଙ୍କା', as: 'ৰঙা জলকীয়া', ur: 'لال مرچ', icon: '🌶️' },
  GINGER: { en: 'Dry Ginger', te: 'అల్లం / శొంఠి', hi: 'अदरक / सोंठ', ta: 'சுக்கு / இஞ்சி', kn: 'ಶುಂಠಿ', ml: 'ചുക്ക് / ഇഞ്ചി', mr: 'आले / सुंठ', bn: 'আদা / শুঁঠ', pa: 'ਅਦਰਕ / ਸੁੰਢ', gu: 'સૂંઠ / આદુ', or: 'ଶୁଣ୍ଠି / ଅଦା', as: 'শুকান আদা', ur: 'ادرک / سونٹھ', icon: '🫚' },

  // Vegetables & Tubers
  POTATO: { en: 'Potato', te: 'బంగాళాదుంప / ఆలుగడ్డ', hi: 'आलू', ta: 'உருளைக்கிழங்கு', kn: 'ಆಲೂಗಡ್ಡೆ', ml: 'ഉരുളക്കിഴങ്ങ്', mr: 'बटाटा', bn: 'আলু', pa: 'ਆਲੂ', gu: 'બટાકા', or: 'ଆଳୁ', as: 'আলু', ur: 'آلو', icon: '🥔' },
  ONION: { en: 'Onion', te: 'ఉల్లిపాయలు', hi: 'प्याज', ta: 'வெங்காயம்', kn: 'ಈರುಳ್ಳಿ', ml: 'സവാള', mr: 'कांदा', bn: 'পেঁয়াজ', pa: 'ਪਿਆਜ਼', gu: 'ડુંગળી', or: 'ପିଆଜ', as: 'পিয়াঁজ', ur: 'پیاز', icon: '🧅' },
  TOMATO: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर', ta: 'தக்காளி', kn: 'ಟೊಮೆಟೊ', ml: 'തക്കാളി', mr: 'टोमॅटो', bn: 'টমেটো', pa: 'ਟਮਾਟਰ', gu: 'ટામેટા', or: 'ଟମାଟୋ', as: 'টমেটো', ur: 'ٹماٹر', icon: '🍅' },
  GARLIC: { en: 'Garlic', te: 'వెల్లుల్లి', hi: 'लहसुन', ta: 'பூண்டு', kn: 'ಬೆಳ್ಳುಳ್ಳಿ', ml: 'വെളുത്തുള്ളി', mr: 'लसूण', bn: 'রসুন', pa: 'ਲਸਣ', gu: 'લસણ', or: 'ରସୁଣ', as: 'নহৰু', ur: 'لہسن', icon: '🧄' },

  // Dairy & Livestock
  MILK: { en: 'Raw Cow Milk', te: 'తాజా ఆవు పాలు', hi: 'ताजा गाय का दूध', ta: 'பசும்பால்', kn: 'ಹಸುವಿನ ಹಾಲು', ml: 'പശുവിൻ പാൽ', mr: 'गाईचे दूध', bn: 'গরুর দুধ', pa: 'ਗਾਂ ਦਾ ਦੁੱਧ', gu: 'ગાયનું દૂધ', or: 'ଗାଈ କ୍ଷୀର', as: 'গৰুৰ গাখীৰ', ur: 'تازہ گائے کا دودھ', icon: '🥛' },
  BUTTER: { en: 'Pasteurized Butter', te: 'వెన్న', hi: 'मक्खन', ta: 'வெண்ணெய்', kn: 'ಬೆಣ್ಣೆ', ml: 'വെണ്ണ', mr: 'लोणी / बटर', bn: 'মাখন', pa: 'ਮੱਖਣ', gu: 'માખણ', or: 'ଲହୁଣୀ', as: 'মাখন', ur: 'مکھن', icon: '🧈' },
  CHEESE: { en: 'Cheddar / Cheese / Paneer', te: 'పన్నీర్ / చీజ్', hi: 'पनीर / चीज़', ta: 'பன்னீர் / சீஸ்', kn: 'ಪನೀರ್ / ಚೀಸ್', ml: 'പനീർ / ചീസ്', mr: 'पनीर / चीज', bn: 'পনির / চিজ', pa: 'ਪਨੀਰ / ਚੀਜ਼', gu: 'પનીર / ચીઝ', or: 'ଛେନା / ପନିର', as: 'পনীৰ / চীজ', ur: 'پنیر', icon: '🧀' },
  LCATTLE: { en: 'Live Cattle', te: 'పశువులు / పశుసంపద', hi: 'पशुधन', ta: 'கால்நடைகள்', kn: 'ಜಾನುವಾರು', ml: 'കന്നുകാലികൾ', mr: 'पशुधन / जनावरे', bn: 'গবাদি পশু', pa: 'ਪਸ਼ੂਧਨ', gu: 'પશુધન', or: 'ପଶୁସମ୍ପଦ', as: 'পশুধন', ur: 'مویشی', icon: '🐂' },
  POULTRY: { en: 'Broiler Chicken', te: 'కోళ్ల పెంపకం / బ్రాయిలర్', hi: 'मुर्गी पालन (ब्रायलर)', ta: 'பிராய்லர் கோழி', kn: 'ಬ್ರಾಯ್ಲರ್ ಕೋಳಿ', ml: 'ബ്രോയിലർ കോഴി', mr: 'ब्रॉयलर कोंबडी', bn: 'ব্রয়লার মুরগি', pa: 'ਬਰੌਇਲਰ ਮੁਰਗੀ', gu: 'બ્રોઇલર મરઘી', or: 'କୁକୁଡ଼ା ପାଳନ', as: 'ব্ৰইলাৰ কুকুৰা', ur: 'برائلر مرغی', icon: '🐔' },
  EGGS: { en: 'Table Eggs', te: 'కోడి గుడ్లు', hi: 'अंडे', ta: 'முட்டை', kn: 'ಮೊಟ್ಟೆ', ml: 'മുട്ട', mr: 'अंडी', bn: 'ডিম', pa: 'ਆਂਡੇ', gu: 'ઈંડા', or: 'ଅଣ୍ଡା', as: 'কণী', ur: 'انڈے', icon: '🥚' },
  EGG: { en: 'Table Eggs', te: 'కోడి గుడ్లు', hi: 'अंडे', ta: 'முட்டை', kn: 'ಮೊಟ್ಟೆ', ml: 'മുട്ട', mr: 'अंडी', bn: 'ডিম', pa: 'ਆਂਡੇ', gu: 'ઈંડા', or: 'ଅଣ୍ଡା', as: 'কণী', ur: 'انڈے', icon: '🥚' }
};

/**
 * Clean non-English parenthetical parts from commodity name if in English-only mode
 */
function cleanEnglishText(str) {
  if (!str) return '';
  return str.replace(/\s*\([^)]*[\u0900-\u0D7F][^)]*\)/g, '').trim();
}

export function getDualText(key, regLang = 'none') {
  const item = DUAL_DICTIONARY[key];
  if (!item) return key;
  const en = item.en || key;
  if (regLang === 'none' || !regLang) {
    return en;
  }
  const reg = item[regLang] || '';
  if (!reg || reg === en) return en;
  return `${en} / ${reg}`;
}

export function getDualCropName(symbolOrName, regLang = 'none') {
  const sym = String(symbolOrName || '').toUpperCase().trim();
  
  // Find in dictionary by symbol key or english match
  let crop = CROP_DUAL_NAMES[sym];
  if (!crop) {
    // Try matching partial key
    const matchKey = Object.keys(CROP_DUAL_NAMES).find(k => sym.includes(k) || k.includes(sym));
    if (matchKey) crop = CROP_DUAL_NAMES[matchKey];
  }

  const cleanEn = crop ? crop.en : cleanEnglishText(symbolOrName);

  if (regLang === 'none' || !regLang) {
    return {
      en: cleanEn,
      reg: '',
      full: cleanEn,
      icon: crop?.icon || '🌾'
    };
  }

  const reg = crop ? (crop[regLang] || '') : '';
  return {
    en: cleanEn,
    reg,
    full: reg ? `${cleanEn} / ${reg}` : cleanEn,
    icon: crop?.icon || '🌾'
  };
}

/**
 * Sequential Voice Announcer
 */
export function playDualVoice(enSpeech, regSpeech, regLang = 'none', onDone = null) {
  if (!window.speechSynthesis) {
    if (onDone) onDone();
    return;
  }

  window.speechSynthesis.cancel();

  const langCodeMap = {
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    pa: 'pa-IN',
    gu: 'gu-IN',
    or: 'or-IN',
    as: 'as-IN',
    ur: 'ur-IN'
  };

  const englishUtterance = new SpeechSynthesisUtterance(enSpeech);
  englishUtterance.lang = 'en-IN';
  englishUtterance.rate = 0.95;

  englishUtterance.onend = () => {
    if (onDone) onDone();
  };
  englishUtterance.onerror = () => {
    if (onDone) onDone();
  };

  // Case 1: English Only / None selected
  if (regLang === 'none' || !regSpeech || regLang === 'en') {
    window.speechSynthesis.speak(englishUtterance);
    return;
  }

  // Case 2: Regional language selected -> SPEAK REGIONAL LANGUAGE FIRST!
  const regionalUtterance = new SpeechSynthesisUtterance(regSpeech);
  regionalUtterance.lang = langCodeMap[regLang] || 'te-IN';
  regionalUtterance.rate = 0.9;

  regionalUtterance.onend = () => {
    window.speechSynthesis.speak(englishUtterance);
  };

  regionalUtterance.onerror = () => {
    window.speechSynthesis.speak(englishUtterance);
  };

  window.speechSynthesis.speak(regionalUtterance);
}
