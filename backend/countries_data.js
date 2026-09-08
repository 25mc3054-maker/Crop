// International Countries Phone Specification & Directory

const COUNTRIES_LIST = [
  { name: 'United States', aliases: ['USA', 'US', 'America'], code: 'US', dial: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10, example: '2025550143' },
  { name: 'United Kingdom', aliases: ['UK', 'GB', 'Great Britain', 'England'], code: 'GB', dial: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 11, example: '7911123456' },
  { name: 'Canada', aliases: ['CA'], code: 'CA', dial: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10, example: '4165550198' },
  { name: 'Australia', aliases: ['AU'], code: 'AU', dial: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 10, example: '412345678' },
  { name: 'Singapore', aliases: ['SG'], code: 'SG', dial: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8, example: '81234567' },
  { name: 'United Arab Emirates', aliases: ['UAE', 'Dubai', 'Abu Dhabi', 'AE'], code: 'AE', dial: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9, example: '501234567' },
  { name: 'Saudi Arabia', aliases: ['KSA', 'SA'], code: 'SA', dial: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9, example: '512345678' },
  { name: 'Kenya', aliases: ['KE'], code: 'KE', dial: '+254', flag: '🇰🇪', minDigits: 9, maxDigits: 10, example: '712345678' },
  { name: 'Nigeria', aliases: ['NG'], code: 'NG', dial: '+234', flag: '🇳🇬', minDigits: 10, maxDigits: 10, example: '8021234567' },
  { name: 'South Africa', aliases: ['ZA'], code: 'ZA', dial: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 10, example: '711234567' },
  { name: 'Denmark', aliases: ['DK'], code: 'DK', dial: '+45', flag: '🇩🇰', minDigits: 8, maxDigits: 8, example: '20123456' },
  { name: 'Norway', aliases: ['NO'], code: 'NO', dial: '+47', flag: '🇳🇴', minDigits: 8, maxDigits: 8, example: '41234567' },
  { name: 'Sweden', aliases: ['SE'], code: 'SE', dial: '+46', flag: '🇸🇪', minDigits: 9, maxDigits: 10, example: '701234567' },
  { name: 'Germany', aliases: ['DE', 'Deutschland'], code: 'DE', dial: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11, example: '15112345678' },
  { name: 'France', aliases: ['FR'], code: 'FR', dial: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 10, example: '612345678' },
  { name: 'Italy', aliases: ['IT'], code: 'IT', dial: '+39', flag: '🇮🇹', minDigits: 9, maxDigits: 10, example: '3123456789' },
  { name: 'Spain', aliases: ['ES'], code: 'ES', dial: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9, example: '612345678' },
  { name: 'Netherlands', aliases: ['NL', 'Holland'], code: 'NL', dial: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9, example: '612345678' },
  { name: 'Switzerland', aliases: ['CH'], code: 'CH', dial: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9, example: '781234567' },
  { name: 'New Zealand', aliases: ['NZ'], code: 'NZ', dial: '+64', flag: '🇳🇿', minDigits: 8, maxDigits: 10, example: '211234567' },
  { name: 'Japan', aliases: ['JP'], code: 'JP', dial: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 11, example: '9012345678' },
  { name: 'China', aliases: ['CN'], code: 'CN', dial: '+86', flag: '🇨🇳', minDigits: 11, maxDigits: 11, example: '13812345678' },
  { name: 'South Korea', aliases: ['KR', 'Korea'], code: 'KR', dial: '+82', flag: '🇰🇷', minDigits: 9, maxDigits: 11, example: '1012345678' },
  { name: 'Malaysia', aliases: ['MY'], code: 'MY', dial: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10, example: '123456789' },
  { name: 'Indonesia', aliases: ['ID'], code: 'ID', dial: '+62', flag: '🇮🇩', minDigits: 9, maxDigits: 12, example: '81234567890' },
  { name: 'Philippines', aliases: ['PH'], code: 'PH', dial: '+63', flag: '🇵🇭', minDigits: 10, maxDigits: 10, example: '9171234567' },
  { name: 'Thailand', aliases: ['TH'], code: 'TH', dial: '+66', flag: '🇹🇭', minDigits: 9, maxDigits: 10, example: '812345678' },
  { name: 'Vietnam', aliases: ['VN'], code: 'VN', dial: '+84', flag: '🇻🇳', minDigits: 9, maxDigits: 10, example: '912345678' },
  { name: 'Bangladesh', aliases: ['BD'], code: 'BD', dial: '+880', flag: '🇧🇩', minDigits: 10, maxDigits: 10, example: '1712345678' },
  { name: 'Pakistan', aliases: ['PK'], code: 'PK', dial: '+92', flag: '🇵🇰', minDigits: 10, maxDigits: 10, example: '3001234567' },
  { name: 'Sri Lanka', aliases: ['LK'], code: 'LK', dial: '+94', flag: '🇱🇰', minDigits: 9, maxDigits: 10, example: '712345678' },
  { name: 'Nepal', aliases: ['NP'], code: 'NP', dial: '+977', flag: '🇳🇵', minDigits: 10, maxDigits: 10, example: '9812345678' },
  { name: 'Brazil', aliases: ['BR'], code: 'BR', dial: '+55', flag: '🇧🇷', minDigits: 10, maxDigits: 11, example: '11987654321' },
  { name: 'Mexico', aliases: ['MX'], code: 'MX', dial: '+52', flag: '🇲🇽', minDigits: 10, maxDigits: 10, example: '5512345678' },
  { name: 'Argentina', aliases: ['AR'], code: 'AR', dial: '+54', flag: '🇦🇷', minDigits: 10, maxDigits: 10, example: '91123456789' },
  { name: 'Colombia', aliases: ['CO'], code: 'CO', dial: '+57', flag: '🇨🇴', minDigits: 10, maxDigits: 10, example: '3001234567' },
  { name: 'Egypt', aliases: ['EG'], code: 'EG', dial: '+20', flag: '🇪🇬', minDigits: 10, maxDigits: 10, example: '1001234567' },
  { name: 'Turkey', aliases: ['TR', 'Turkiye'], code: 'TR', dial: '+90', flag: '🇹🇷', minDigits: 10, maxDigits: 10, example: '5321234567' },
  { name: 'Russia', aliases: ['RU'], code: 'RU', dial: '+7', flag: '🇷🇺', minDigits: 10, maxDigits: 10, example: '9123456789' },
  { name: 'Israel', aliases: ['IL'], code: 'IL', dial: '+972', flag: '🇮🇱', minDigits: 9, maxDigits: 9, example: '501234567' },
  { name: 'Qatar', aliases: ['QA'], code: 'QA', dial: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8, example: '33123456' },
  { name: 'Kuwait', aliases: ['KW'], code: 'KW', dial: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8, example: '91234567' },
  { name: 'Oman', aliases: ['OM'], code: 'OM', dial: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8, example: '91234567' },
  { name: 'Bahrain', aliases: ['BH'], code: 'BH', dial: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8, example: '39123456' },
  { name: 'Ghana', aliases: ['GH'], code: 'GH', dial: '+233', flag: '🇬🇭', minDigits: 9, maxDigits: 9, example: '241234567' },
  { name: 'Tanzania', aliases: ['TZ'], code: 'TZ', dial: '+255', flag: '🇹🇿', minDigits: 9, maxDigits: 9, example: '712345678' },
  { name: 'Uganda', aliases: ['UG'], code: 'UG', dial: '+256', flag: '🇺🇬', minDigits: 9, maxDigits: 9, example: '712345678' },
  { name: 'Ethiopia', aliases: ['ET'], code: 'ET', dial: '+251', flag: '🇪🇹', minDigits: 9, maxDigits: 9, example: '911234567' },
  { name: 'Ireland', aliases: ['IE'], code: 'IE', dial: '+353', flag: '🇮🇪', minDigits: 9, maxDigits: 9, example: '851234567' },
  { name: 'Belgium', aliases: ['BE'], code: 'BE', dial: '+32', flag: '🇧🇪', minDigits: 9, maxDigits: 9, example: '470123456' },
  { name: 'Portugal', aliases: ['PT'], code: 'PT', dial: '+351', flag: '🇵🇹', minDigits: 9, maxDigits: 9, example: '912345678' },
  { name: 'Poland', aliases: ['PL'], code: 'PL', dial: '+48', flag: '🇵🇱', minDigits: 9, maxDigits: 9, example: '501234567' },
  { name: 'Greece', aliases: ['GR'], code: 'GR', dial: '+30', flag: '🇬🇷', minDigits: 10, maxDigits: 10, example: '6912345678' }
];

function findCountry(countryInput) {
  if (!countryInput || typeof countryInput !== 'string') return null;
  const q = countryInput.trim().toLowerCase();

  // Try exact name or alias match
  for (const c of COUNTRIES_LIST) {
    if (c.name.toLowerCase() === q) return c;
    if (c.code.toLowerCase() === q) return c;
    if (c.aliases && c.aliases.some(a => a.toLowerCase() === q)) return c;
  }

  // Try partial name match
  for (const c of COUNTRIES_LIST) {
    if (c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())) return c;
  }

  return null;
}

/**
 * Validates international phone number according to country rules
 * @param {string} countryInput - Name, code, or alias of country
 * @param {string} phoneInput - Raw phone number entered by user
 */
function validateInternationalPhone(countryInput, phoneInput) {
  if (!phoneInput) {
    return { valid: false, error: 'Phone number is required.' };
  }

  const digits = phoneInput.toString().replace(/\D/g, '');
  if (!digits) {
    return { valid: false, error: 'Please enter a valid numeric phone number.' };
  }

  const country = findCountry(countryInput);

  if (country) {
    const min = country.minDigits;
    const max = country.maxDigits;

    if (min === max && digits.length !== min) {
      return {
        valid: false,
        country: country.name,
        expectedDigits: min,
        actualDigits: digits.length,
        error: `Invalid phone number for ${country.name}. Phone numbers in ${country.name} must have exactly ${min} digits (you entered ${digits.length} digits).`
      };
    }

    if (digits.length < min || digits.length > max) {
      return {
        valid: false,
        country: country.name,
        expectedDigits: `${min}-${max}`,
        actualDigits: digits.length,
        error: `Invalid phone number for ${country.name}. Phone numbers in ${country.name} must have between ${min} and ${max} digits (you entered ${digits.length} digits).`
      };
    }

    return {
      valid: true,
      country: country.name,
      dialCode: country.dial,
      digits: digits,
      digitsCount: digits.length
    };
  }

  // Fallback for general unlisted countries: standard ITU-T E.164 subscriber length (7 to 15 digits)
  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      actualDigits: digits.length,
      error: `International phone numbers must have between 7 and 15 digits (you entered ${digits.length} digits).`
    };
  }

  return {
    valid: true,
    country: countryInput,
    digits: digits,
    digitsCount: digits.length
  };
}

module.exports = {
  COUNTRIES_LIST,
  findCountry,
  validateInternationalPhone
};
