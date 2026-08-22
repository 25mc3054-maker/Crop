exports.handler = async (event) => {
  // Attempt to determine language from user attributes (locale) or client metadata
  // Note: clientMetadata must be passed from the frontend Auth.signUp call
  const lang = event.request.userAttributes.locale || 
               (event.request.clientMetadata && event.request.clientMetadata.language) || 
               'en';

  const smsTemplates = {
    en: "Your Krishi-Net verification code is {####}.",
    hi: "आपका कृषि-नेट सत्यापन कोड {####} है।",
    kn: "ನಿಮ್ಮ ಕೃಷಿ-ನೆಟ್ ಪರಿಶೀಲನೆ ಕೋಡ್ {####} ಆಗಿದೆ.",
    mr: "तुमचा कृषी-नेट पडताळणी कोड {####} आहे.",
    bn: "আপনার কৃষি-নেট যাচাইকরণ কোড হল {####}।",
    ta: "உங்கள் கிருஷி-நெட் சரிபார்ப்பு குறியீடு {####}.",
    te: "మీ కృషి-నెట్ ధృవీకరణ కోడ్ {####}.",
    gu: "તમારો કૃષિ-નેટ ચકાસણી કોડ {####} છે.",
    pa: "ਤੁਹਾਡਾ ਕ੍ਰਿਸ਼ੀ-ਨੈੱਟ ਤਸਦੀਕ ਕੋਡ {####} ਹੈ।",
    ml: "നിങ്ങളുടെ കൃഷി-നെറ്റ് വെരിഫിക്കേഷൻ കോഡ് {####} ആണ്.",
    or: "ଆପଣଙ୍କର କୃଷି-ନେଟ୍ ଯାଞ୍ଚ କୋଡ୍ ହେଉଛି {####} |",
    as: "আপোনাৰ কৃষি-নেট পৰীক্ষণ কোড হৈছে {####}।"
  };

  const message = smsTemplates[lang] || smsTemplates['en'];

  // Customize message for SignUp, ResendCode, and ForgotPassword
  if (["CustomMessage_SignUp", "CustomMessage_ResendCode", "CustomMessage_ForgotPassword"].includes(event.triggerSource)) {
    event.response.smsMessage = message;
    event.response.emailSubject = "Krishi-Net Verification";
    event.response.emailMessage = message;
  }

  return event;
};