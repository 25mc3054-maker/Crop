// Central User Session & Multi-Tenant SaaS Profile Manager

export function getCurrentFarmerUser() {
  let tokenData = null;
  try {
    const token = localStorage.getItem('farmer_token');
    if (token && token.includes('.')) {
      const parts = token.split('.');
      if (parts.length >= 2) {
        tokenData = JSON.parse(atob(parts[1]));
      }
    }
  } catch (e) {
    // ignore decoding errors
  }

  const name = localStorage.getItem('farmer_name') || 
               localStorage.getItem('farmer_registered_name') || 
               tokenData?.name || 
               tokenData?.phone || 
               'Farmer';

  const phone = localStorage.getItem('farmer_phone') || tokenData?.phone || '';
  const village = localStorage.getItem('farmer_village') || tokenData?.village || 'Regional Village';
  const state = localStorage.getItem('farmer_state') || tokenData?.state || 'KARNATAKA';
  const pincode = localStorage.getItem('farmer_pincode') || tokenData?.pincode || '';
  const district = localStorage.getItem('farmer_district') || tokenData?.district || '';
  const country = localStorage.getItem('farmer_country') || tokenData?.country || 'India';
  const countryType = localStorage.getItem('farmer_country_type') || tokenData?.countryType || 'india';
  const land = localStorage.getItem('farmer_land') || tokenData?.landholding || tokenData?.land || '3.5';
  const crops = localStorage.getItem('farmer_crops') || tokenData?.primaryCrops || tokenData?.crops || 'Paddy, Cotton';
  const tier = localStorage.getItem('farmer_tier') || tokenData?.tier || 'pro_farmer';

  // Generate clean Initials
  const cleanName = name.replace(/[^a-zA-Z\s]/g, '').trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'K';
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  } else if (nameParts.length === 1 && nameParts[0].length >= 1) {
    initials = nameParts[0].slice(0, 2).toUpperCase();
  }

  // Location Display
  let locationDisplay = '';
  if (countryType === 'other') {
    locationDisplay = [village, state, country].filter(Boolean).join(' • ');
  } else {
    locationDisplay = [village, state].filter(Boolean).join(' • ');
  }

  // SaaS Plan info
  const saasPlan = {
    code: tier,
    title: 'Krishi Pro Member',
    badge: 'Verified Producer',
    activeModules: ['AI Agronomist Doctor', 'Live Agmarknet Mandis', 'Drone & Tractor GPS Fleet', '4% KCC Subvention', 'Satellite NDVI Stress'],
    limits: {
      dailyAiQueries: 'Unlimited',
      mandiAlerts: 'Real-time SMS & WhatsApp',
      maxListings: 'Unlimited'
    }
  };

  return {
    name,
    phone,
    village,
    state,
    pincode,
    district,
    country,
    countryType,
    land,
    crops,
    tier,
    initials,
    locationDisplay,
    saasPlan
  };
}

export function saveFarmerUserSession(user, token) {
  if (token) {
    localStorage.setItem('farmer_token', token);
  }
  if (user) {
    if (user.name) {
      localStorage.setItem('farmer_name', user.name.trim());
      localStorage.setItem('farmer_registered_name', user.name.trim());
    }
    if (user.phone) {
      localStorage.setItem('farmer_phone', String(user.phone).trim());
    }
    if (user.village !== undefined) {
      localStorage.setItem('farmer_village', String(user.village || '').trim());
    }
    if (user.state !== undefined) {
      localStorage.setItem('farmer_state', String(user.state || '').trim());
    }
    if (user.pincode !== undefined) {
      localStorage.setItem('farmer_pincode', String(user.pincode || '').trim());
    }
    if (user.district !== undefined) {
      localStorage.setItem('farmer_district', String(user.district || '').trim());
    }
    if (user.country !== undefined) {
      localStorage.setItem('farmer_country', String(user.country || 'India').trim());
    }
    if (user.countryType !== undefined) {
      localStorage.setItem('farmer_country_type', String(user.countryType || 'india').trim());
    }
    if (user.landholding || user.land) {
      localStorage.setItem('farmer_land', String(user.landholding || user.land).trim());
    }
    if (user.primaryCrops || user.crops) {
      localStorage.setItem('farmer_crops', String(user.primaryCrops || user.crops).trim());
    }
    if (user.tier) {
      localStorage.setItem('farmer_tier', String(user.tier).trim());
    }
  }

  // Dispatch live synchronization event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('krishi_user_session_changed', { detail: user }));
    window.dispatchEvent(new Event('storage'));
  }
}

export function clearFarmerUserSession() {
  const keysToRemove = [
    'farmer_token',
    'farmer_name',
    'farmer_registered_name',
    'farmer_phone',
    'farmer_village',
    'farmer_state',
    'farmer_pincode',
    'farmer_district',
    'farmer_country',
    'farmer_country_type',
    'farmer_land',
    'farmer_crops',
    'farmer_tier'
  ];
  keysToRemove.forEach(k => localStorage.removeItem(k));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('krishi_user_session_changed', { detail: null }));
    window.dispatchEvent(new Event('storage'));
  }
}
