// Indian PIN Code and Postal Circle Recognition Utility

export const PINCODE_PREFIX_MAP = {
  '11': 'DELHI',
  '12': 'HARYANA',
  '13': 'HARYANA',
  '14': 'PUNJAB',
  '15': 'PUNJAB',
  '16': 'CHANDIGARH',
  '17': 'HIMACHAL PRADESH',
  '18': 'JAMMU & KASHMIR',
  '19': 'JAMMU & KASHMIR',
  '20': 'UTTAR PRADESH',
  '21': 'UTTAR PRADESH',
  '22': 'UTTAR PRADESH',
  '23': 'UTTAR PRADESH',
  '24': 'UTTAR PRADESH',
  '25': 'UTTAR PRADESH',
  '26': 'UTTAR PRADESH',
  '27': 'UTTAR PRADESH',
  '28': 'UTTAR PRADESH',
  '30': 'RAJASTHAN',
  '31': 'RAJASTHAN',
  '32': 'RAJASTHAN',
  '33': 'RAJASTHAN',
  '34': 'RAJASTHAN',
  '36': 'GUJARAT',
  '37': 'GUJARAT',
  '38': 'GUJARAT',
  '39': 'GUJARAT',
  '40': 'MAHARASHTRA',
  '41': 'MAHARASHTRA',
  '42': 'MAHARASHTRA',
  '43': 'MAHARASHTRA',
  '44': 'MAHARASHTRA',
  '45': 'MADHYA PRADESH',
  '46': 'MADHYA PRADESH',
  '47': 'MADHYA PRADESH',
  '48': 'MADHYA PRADESH',
  '49': 'CHHATTISGARH',
  '50': 'TELANGANA',
  '51': 'ANDHRA PRADESH',
  '52': 'ANDHRA PRADESH',
  '53': 'ANDHRA PRADESH',
  '56': 'KARNATAKA',
  '57': 'KARNATAKA',
  '58': 'KARNATAKA',
  '59': 'KARNATAKA',
  '60': 'TAMIL NADU',
  '61': 'TAMIL NADU',
  '62': 'TAMIL NADU',
  '63': 'TAMIL NADU',
  '64': 'TAMIL NADU',
  '67': 'KERALA',
  '68': 'KERALA',
  '69': 'KERALA',
  '70': 'WEST BENGAL',
  '71': 'WEST BENGAL',
  '72': 'WEST BENGAL',
  '73': 'WEST BENGAL',
  '74': 'WEST BENGAL',
  '75': 'ODISHA',
  '76': 'ODISHA',
  '77': 'ODISHA',
  '78': 'ASSAM',
  '79': 'ASSAM',
  '80': 'BIHAR',
  '81': 'JHARKHAND',
  '82': 'JHARKHAND',
  '83': 'JHARKHAND',
  '84': 'BIHAR',
  '85': 'BIHAR'
};

const STATE_ALIAS_MAP = {
  'CHATTISGARH': 'CHHATTISGARH',
  'PONDICHERRY': 'PUDUCHERRY',
  'ORISSA': 'ODISHA',
  'DAMAN & DIU': 'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'DADRA & NAGAR HAVELI': 'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'TAMILNADU': 'TAMIL NADU'
};

export function inferStateClientSide(pincode) {
  if (!pincode) return null;
  const pinStr = String(pincode).trim();
  if (pinStr.length >= 3) {
    const p3 = pinStr.slice(0, 3);
    if (p3 === '194') return 'LADAKH';
    if (['246', '248', '249', '262', '263'].includes(p3)) return 'UTTARAKHAND';
    if (p3 === '403') return 'GOA';
    if (['605', '609'].includes(p3)) return 'PUDUCHERRY';
    if (p3 === '682') return 'LAKSHADWEEP';
    if (p3 === '737') return 'SIKKIM';
    if (p3 === '744') return 'ANDAMAN & NICOBAR ISLANDS';
    if (['790', '791', '792'].includes(p3)) return 'ARUNACHAL PRADESH';
    if (['793', '794'].includes(p3)) return 'MEGHALAYA';
    if (p3 === '795') return 'MANIPUR';
    if (p3 === '796') return 'MIZORAM';
    if (['797', '798'].includes(p3)) return 'NAGALAND';
    if (p3 === '799') return 'TRIPURA';
    if (p3 === '396') return 'DADRA & NAGAR HAVELI AND DAMAN & DIU';
  }
  const p2 = pinStr.slice(0, 2);
  return PINCODE_PREFIX_MAP[p2] || null;
}

export function validateStateAndPincodeClientSide(selectedState, pincode) {
  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
    return { valid: false, match: false, error: 'Please enter a valid 6-digit Indian PIN code.' };
  }
  if (!selectedState || selectedState.trim() === '') {
    return { valid: false, match: false, error: 'Please select a state.' };
  }

  const cleanPin = String(pincode).trim();
  const inferred = inferStateClientSide(cleanPin);
  if (!inferred) {
    // If unknown prefix, allow it with gentle advisory
    return { valid: true, match: true, state: selectedState, actualState: selectedState, district: 'Regional Zone' };
  }

  const normSelected = (STATE_ALIAS_MAP[selectedState.toUpperCase().trim()] || selectedState.toUpperCase().trim());
  const normInferred = (STATE_ALIAS_MAP[inferred.toUpperCase().trim()] || inferred.toUpperCase().trim());

  // Check direct or shared postal circle zones (e.g. UTs sharing prefixes with parent states)
  const isMatch = (
    normSelected === normInferred ||
    (normSelected === 'DADRA & NAGAR HAVELI AND DAMAN & DIU' && normInferred === 'GUJARAT') ||
    (normSelected === 'GUJARAT' && normInferred === 'DADRA & NAGAR HAVELI AND DAMAN & DIU') ||
    (normSelected === 'PUDUCHERRY' && normInferred === 'TAMIL NADU') ||
    (normSelected === 'TAMIL NADU' && normInferred === 'PUDUCHERRY') ||
    (normSelected === 'LADAKH' && normInferred === 'JAMMU & KASHMIR') ||
    (normSelected === 'JAMMU & KASHMIR' && normInferred === 'LADAKH') ||
    (normSelected === 'UTTARAKHAND' && normInferred === 'UTTAR PRADESH') ||
    (normSelected === 'UTTAR PRADESH' && normInferred === 'UTTARAKHAND') ||
    (normSelected === 'CHANDIGARH' && (normInferred === 'PUNJAB' || normInferred === 'HARYANA')) ||
    (normSelected === 'BIHAR' && normInferred === 'JHARKHAND') ||
    (normSelected === 'JHARKHAND' && normInferred === 'BIHAR')
  );

  if (!isMatch) {
    return {
      valid: true,
      match: false,
      actualState: inferred,
      error: `PIN code ${cleanPin} belongs to ${inferred}, not ${selectedState}.`
    };
  }

  return {
    valid: true,
    match: true,
    state: normSelected,
    actualState: normInferred,
    district: `${normSelected} Postal Circle`
  };
}
