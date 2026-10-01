// Comprehensive Agronomy, Mandi Market Intelligence & Crop Best Practices
// Covers: Pricing Insights, Cultivation Hacks, Mandi Do's & Don'ts, Quality Grading & Post-Harvest Storage

export const CROP_KNOWLEDGE_DB = {
  WHEAT: {
    crop: 'Wheat',
    category: 'Grains & Cereals',
    mandiSeason: 'March to May (Rabi Harvest Peak)',
    soilType: 'Well-drained fertile loamy & clay-loam soils (pH 6.0 - 7.5)',
    optimalMoistureForSale: '10% - 12% (Mandi maximum allowed: 12%)',
    priceTrendInsight: 'Prices usually touch seasonal lows during peak harvest in April and rally by 15-25% between August and December.',
    tipsAndTricks: [
      '🌾 Apply Nitrogen in 3 split doses: 50% at sowing (basal), 25% at CRI stage (crown root initiation, 21 days), and 25% at first node stage.',
      '💧 Terminal heat protection: Spray 0.5% Potassium Chloride (KCl) or 2% KNO3 at the heading stage to prevent grain shriveling.',
      '🚜 Timely Harvesting: Harvest when grains turn golden-yellow and moisture is below 14% to avoid grain shattering loss in the field.',
      '✨ Luster Retention: Avoid direct rain exposure to harvested heaps to preserve the natural golden amber shine that commands premium mandi rates.'
    ],
    dos: [
      '✅ Sun-dry wheat grain thoroughly until moisture drops below 12% before bringing to APMC mandi yards.',
      '✅ Clean and sieve the grain to eliminate chaff, straw, dust, and broken grains to secure Grade-A benchmark rates.',
      '✅ Pack only in standard 50 kg sound jute gunny bags or new HDPE woven bags.',
      '✅ Check live mandi benchmark rates and daily arrival arrivals on KrishiSocial before dispatching trucks.'
    ],
    donts: [
      '❌ Never harvest early in the morning when morning dew is present; wet grains lead to fungal discolouration.',
      '❌ Do not mix old season carryover wheat with new fresh harvest, as buyers heavily discount blended lots.',
      '❌ Avoid storing grains on damp bare floors; always use wooden pallets with plastic sheeting in aerated godowns.',
      '❌ Never sell to unaccredited middlemen without an official e-NAM weighbridge slip.'
    ],
    gradingStandards: {
      gradeA: 'Foreign matter < 0.75%, Shrivelled/Broken < 2.0%, Moisture <= 12%',
      gradeB: 'Foreign matter < 1.5%, Shrivelled/Broken < 4.0%, Moisture <= 14%',
      rejectionThreshold: 'Weevilled/damaged grains > 3%, Moisture > 14%'
    }
  },
  PADDY_BASMATI: {
    crop: 'Basmati Paddy',
    category: 'Grains & Cereals',
    mandiSeason: 'October to December (Kharif Harvest)',
    soilType: 'Heavy clay loam soils with high water retention capacity',
    optimalMoistureForSale: '13% - 14% (Mandi maximum: 14%)',
    priceTrendInsight: 'Export demand strongly drives prices. Aged milled varieties command higher rates in Q1 (Jan-Mar).',
    tipsAndTricks: [
      '🌾 Maintain 2-3 cm shallow standing water during tillering and panicle development stages.',
      '🧪 Balanced Zinc application: Apply Zinc Sulphate 21% (25 kg/ha) at transplanting to avoid Khaira disease.',
      '🚜 Gentle Threshing: Set combine harvester drum speed to 450-550 RPM to avoid broken grain tip fractures.',
      '✨ Aroma Preservation: Store harvested paddy at cool, controlled temperatures away from direct sunlight.'
    ],
    dos: [
      '✅ Maintain uniform grain length and aroma by segregating pure 1121, 1509, and 1718 lots.',
      '✅ Ensure moisture is strictly under 14% before entering the auction yard to prevent weight deductions.',
      '✅ Provide sample moisture check at the mandi lab to guarantee transparent competitive bidding.',
      '✅ Keep fumigated clean gunny bags to avoid pest attacks during warehouse storage.'
    ],
    donts: [
      '❌ Do not mix common non-basmati varieties with premium long-grain Basmati.',
      '❌ Avoid harvesting when green kernels exceed 10% in the panicle; wait until 85% grains turn straw-colored.',
      '❌ Never use excessive synthetic fungicides within 20 days of harvest to adhere to export residue limits (MRL).',
      '❌ Do not transport loose uncovered paddy during rainy days.'
    ],
    gradingStandards: {
      gradeA: 'Avg Grain Length > 7.4mm, Moisture <= 13%, Broken < 1.0%',
      gradeB: 'Avg Grain Length 6.6 - 7.4mm, Moisture <= 14%, Broken < 3.0%',
      rejectionThreshold: 'Chalky grains > 6%, Foreign matter > 2%'
    }
  },
  PADDY_COMMON: {
    crop: 'Common Paddy',
    category: 'Grains & Cereals',
    mandiSeason: 'October to January & April to May',
    soilType: 'Alluvial and clayey soils',
    optimalMoistureForSale: '14% - 15%',
    priceTrendInsight: 'Backed by Govt MSP procurement. Benchmark rates stay resilient around FCI procurement centers.',
    tipsAndTricks: [
      '🌾 Drain field water 10-12 days before anticipated harvest date to ensure uniform crop maturity.',
      '🧪 Apply Neem-coated urea in 3 split stages to boost nitrogen use efficiency by 20%.',
      '💧 Use solar bubble dryers or shaded tarpaulin drying for clean, dust-free paddy.',
      '🚜 Calibrate moisture meters before sending produce to government procurement centers.'
    ],
    dos: [
      '✅ Carry farmer registration slip and land record copy for MSP mandi procurement.',
      '✅ Winnow and clean paddy to reduce foreign material below 1% for Grade-A designation.',
      '✅ Sun-dry to bring moisture within the 17% FCI procurement ceiling.'
    ],
    donts: [
      '❌ Do not burn crop stubble in fields; mulch it with happy seeder to enrich soil organic carbon.',
      '❌ Do not allow grains to undergo high-temperature artificial drying that causes micro-cracking.',
      '❌ Avoid selling below notified MSP rate at APMC yards.'
    ],
    gradingStandards: {
      gradeA: 'Foreign matter < 1.0%, Discolored/Damaged < 3.0%, Moisture <= 17%',
      gradeB: 'Foreign matter < 2.0%, Discolored/Damaged < 5.0%, Moisture <= 17%'
    }
  },
  COTTON: {
    crop: 'Cotton (Kapas)',
    category: 'Cotton & Fibres',
    mandiSeason: 'October to February',
    soilType: 'Deep black cotton soils (Vertisols) with good drainage',
    optimalMoistureForSale: '8% - 9% (CCI procurement standard: 8%)',
    priceTrendInsight: 'CCI procurement operations and global NY Cotton futures guide weekly pricing. Clean pickings get high premiums.',
    tipsAndTricks: [
      '🌾 Pick cotton in 2-3 clean stages: 1st picking gives the highest grade and longest staple fiber.',
      '💧 Avoid early morning picking when bolls are wet from dew; wait until 10:00 AM sun drying.',
      '🚜 Separate stained/pest-damaged bolls from clean white lint in different picking bags during harvest.',
      '✨ Micronaire Management: Maintain balanced Potassium fertilization for fiber strength and thickness.'
    ],
    dos: [
      '✅ Pack in 100% cotton cloth bags or loose clean trailers; avoid synthetic plastic filaments.',
      '✅ Keep Kapas clean and free of dry leaf trash, bracts, and yellow cotton.',
      '✅ Store in a dry shed with cement flooring and proper aeration.'
    ],
    donts: [
      '❌ Never sprinkle water on cotton bolls to artificially inflate weight; moisture leads to yellow staining and heavy price penalty.',
      '❌ Avoid using poly-propylene (PP) bags because plastic fibers contaminate spinning mill yarn.',
      '❌ Do not store raw cotton alongside chemicals, fertilizers, or diesel fuels.'
    ],
    gradingStandards: {
      gradeA: 'Staple Length > 28mm, Trash < 3%, Moisture <= 8%',
      gradeB: 'Staple Length 24 - 28mm, Trash 3-5%, Moisture <= 9%'
    }
  },
  CORN: {
    crop: 'Corn / Maize',
    category: 'Grains & Cereals',
    mandiSeason: 'September to November & March to May',
    soilType: 'Deep, well-drained fertile loamy soils rich in organic matter',
    optimalMoistureForSale: '12% - 14% (Poultry and starch feed specification)',
    priceTrendInsight: 'Feed manufacturers and starch industries buy aggressively post-harvest. High-grade dried yellow corn gets steady bids.',
    tipsAndTricks: [
      '🌽 Intercropping with pulses (Urad/Moong) enhances nitrogen fixation and suppresses weeds.',
      '💧 Critical irrigation: Tasseling and silking stages are the most critical water stress periods.',
      '🚜 Sun-dry cobs or shelled kernels immediately after harvest to prevent Aflatoxin mold buildup.',
      '✨ Uniform kernel size: Run through seed cleaners to separate broken grain and dust.'
    ],
    dos: [
      '✅ Bring grain moisture down to 14% to meet feed mill buying specs.',
      '✅ Verify moisture with calibrated electronic moisture tester at the APMC gate.'
    ],
    donts: [
      '❌ Do not store damp corn in enclosed bags; high moisture rapidly triggers poisonous aflatoxin fungus.',
      '❌ Do not thresh when moisture is above 18% as kernels get crushed.'
    ],
    gradingStandards: {
      gradeA: 'Moisture <= 14%, Broken kernels < 2%, Damaged/Immature < 1.5%',
      gradeB: 'Moisture <= 15%, Broken kernels < 4%, Damaged < 3.0%'
    }
  },
  SOYBEAN: {
    crop: 'Soybean',
    category: 'Oilseeds',
    mandiSeason: 'October to December',
    soilType: 'Well-drained black clay soils (pH 6.5 - 7.5)',
    optimalMoistureForSale: '10% - 12% (Solvent extractors ideal limit: 10%)',
    priceTrendInsight: 'Crush margins and international soyoil/DOC meal parity drive prices.',
    tipsAndTricks: [
      '🌱 Inoculate seeds with Bradyrhizobium japonicum culture before sowing for 15-20% higher pod count.',
      '💧 Pod development stage: Ensure adequate soil moisture during pod filling.',
      '🚜 Harvest when 90% leaves drop and pods rattle when shaken.'
    ],
    dos: [
      '✅ Sun-dry to 10-12% moisture to avoid seed-coat splits and oil acidity.',
      '✅ Clean thoroughly to remove mud balls and weed seeds.'
    ],
    donts: [
      '❌ Do not drop bags from heights; soybean seed coat is fragile and splits easily.',
      '❌ Avoid storing in damp rooms where oil becomes rancid.'
    ],
    gradingStandards: {
      gradeA: 'Oil content > 18.5%, Moisture <= 10%, Foreign matter < 1%',
      gradeB: 'Oil content 17-18%, Moisture <= 12%, Foreign matter < 2%'
    }
  },
  CHILLI_RED: {
    crop: 'Red Chilli',
    category: 'Spices & Condiments',
    mandiSeason: 'January to April (Guntur & Byadgi peak auctions)',
    soilType: 'Well-drained sandy loam or clay loam with high organic carbon',
    optimalMoistureForSale: '10% - 11%',
    priceTrendInsight: 'Color value (ASTA units) and capsaicin heat determine huge price premiums. Cold-storage stocks fetch high prices during off-season (July-Nov).',
    tipsAndTricks: [
      '🌶️ Harvest only fully ripe red fruits; avoid green-tipped or half-ripe chillies.',
      '☀️ Solar drying or polyhouse drying prevents bleaching of bright red color.',
      '✨ Grade by length, color shine (Byadagi/Teja/334/Fatki) and stalk intactness.'
    ],
    dos: [
      '✅ Sort out white spotted (dieback infected) and yellow chillies (Tala/Fatki) into separate lots.',
      '✅ Pack in breathable clean gunny bags and store in certified cold storages (at 4°C - 6°C) for off-season profits.'
    ],
    donts: [
      '❌ Never dry chillies directly on dusty mud roads; use clean food-grade tarpaulins.',
      '❌ Do not pack moist chillies as they quickly develop black mold.'
    ],
    gradingStandards: {
      gradeA: 'Deep lustrous red, Length uniform, Broken/Discolored < 2%, Moisture <= 10%',
      gradeB: 'Moderate color, Moisture <= 12%, Fatki < 5%'
    }
  },
  TURMERIC: {
    crop: 'Turmeric',
    category: 'Spices & Condiments',
    mandiSeason: 'February to May (Erode & Nizamabad)',
    soilType: 'Well-drained sandy or clayey loam with rich humus',
    optimalMoistureForSale: '9% - 10%',
    priceTrendInsight: 'High curcumin content varieties (Salem, Rajapuri, Pragati > 4.5%) receive top buyer quotes.',
    tipsAndTricks: [
      '🌱 Boiling / Curing: Boil cleaned rhizomes in water for 45-60 min until froth comes out and finger sinks with slight pressure.',
      '☀️ Sun-dry for 10-15 days until metallic sound is heard on tapping.',
      '✨ Polish in mechanical polishing drums for smooth yellow finish.'
    ],
    dos: [
      '✅ Separate Finger (Kombu) and Bulb (Gadda) rhizomes into distinct auction lots.',
      '✅ Test for curcumin percentage in authorized spice board labs to negotiate premium bids.'
    ],
    donts: [
      '❌ Do not over-boil; it ruins the curcumin oil and causes black center core.',
      '❌ Never use chemical yellow dyes; natural polish is preferred by institutional buyers.'
    ],
    gradingStandards: {
      gradeA: 'Finger Turmeric, Curcumin > 3.5%, Foreign matter < 0.5%, Moisture <= 10%',
      gradeB: 'Bulb/Finger mix, Curcumin 2.5 - 3.5%, Moisture <= 11%'
    }
  },
  TOBACCO: {
    crop: 'Tobacco (FCV / Bidi / Natu)',
    category: 'Commercial Crops',
    mandiSeason: 'February to June',
    soilType: 'Light sandy soils to heavy black soils depending on FCV or Natu types',
    optimalMoistureForSale: '11% - 12%',
    priceTrendInsight: 'Auction board platforms (Tobacco Board of India) grade leaves strictly by color (Lemon, Orange, Dark), texture, and blemish-free curing.',
    tipsAndTricks: [
      '🍂 Harvesting: Pick leaves in primings (2-4 leaves per pass) as they reach bottom-to-top maturity.',
      '🔥 Flue-Curing control: Maintain precise yellowing (35°C - 38°C) and color fixing (43°C - 48°C) schedules.',
      '✨ Leaf grading: Grade into Bright, Medium, and Low grades before presenting at auction platforms.'
    ],
    dos: [
      '✅ Cleanly bale graded leaves with moisture not exceeding 12% to prevent mold.',
      '✅ Tag bales clearly with your Tobacco Board registered grower number and grade category.'
    ],
    donts: [
      '❌ Do not mix green unripe leaves or burnt cure leaves with high-grade lemon/orange bales.',
      '❌ Avoid excess chloride fertilizers in field as it harms leaf burning quality.'
    ],
    gradingStandards: {
      gradeA: 'Bright Lemon/Orange color, spotless texture, High elasticity, Moisture 11-12%',
      gradeB: 'Light brown/Medium orange, slight blemish, Moisture <= 13%'
    }
  },
  TOMATO: {
    crop: 'Tomato',
    category: 'Vegetables',
    mandiSeason: 'Year-round (Peak in Rabi & Late Kharif)',
    soilType: 'Well-drained sandy loam rich in organic matter (pH 6.0 - 7.0)',
    optimalMoistureForSale: 'Fresh firm harvest',
    priceTrendInsight: 'Highly volatile daily prices. Prices fluctuate significantly depending on arrivals at Azadpur, Kolar, and Madanapalle mandis.',
    tipsAndTricks: [
      '🍅 Harvesting stage: Harvest at "Breaker/Pink" stage for distant transport and "Firm Red" for local mandis.',
      '💧 Calcium spray: Spray Calcium Nitrate (0.5%) to prevent Blossom End Rot during fruit development.',
      '📦 Use plastic crates: Never pack in bamboo baskets without padding to prevent crush damage.'
    ],
    dos: [
      '✅ Sort by size (Small, Medium, Large) and ripeness stage before taking to market.',
      '✅ Transport during cool night hours to preserve firmness and reduce transit rotting.'
    ],
    donts: [
      '❌ Do not mix damaged/cracked or pest-affected fruits in crates.',
      '❌ Avoid exposing picked crates to harsh direct sunlight in the field.'
    ],
    gradingStandards: {
      gradeA: 'Firm texture, uniform red/pink color, no pest spots, diameter 55-65mm',
      gradeB: 'Slightly uneven color, diameter 45-55mm'
    }
  },
  ONION: {
    crop: 'Onion',
    category: 'Vegetables',
    mandiSeason: 'Kharif (Oct-Dec) & Rabi (Mar-May - Best storage)',
    soilType: 'Deep, loose, fertile friable sandy loam soils',
    optimalMoistureForSale: 'Cured dry outer neck',
    priceTrendInsight: 'Rabi onions with thin necks can be stored for 4-6 months to capture off-season festive price spikes in September-November.',
    tipsAndTricks: [
      '🧅 Field Curing: Stop irrigation 10-15 days before harvest to allow neck drying.',
      '💨 Windrow curing: Keep bulbs in shaded windrows for 4-5 days to develop dark red outer dry scale.',
      '✨ Defoliation: Cut neck leaving 2-3 cm stalk; cutting too close invites fungal rot.'
    ],
    dos: [
      '✅ Grade by bulb diameter (45mm - 60mm preferred for top domestic & export rates).',
      '✅ Store in naturally ventilated bottom-aerated thatched storage structures (Chawl).'
    ],
    donts: [
      '❌ Never store Kharif onions for long periods (high moisture causes fast rotting).',
      '❌ Do not pack thick-neck (bolted) onions with standard export quality bulbs.'
    ],
    gradingStandards: {
      gradeA: 'Dry tight neck, 50-65mm diameter, dry intact skins, no sprouting',
      gradeB: '40-50mm diameter, slight single split'
    }
  },
  POTATO: {
    crop: 'Potato',
    category: 'Vegetables',
    mandiSeason: 'January to March (Cold storage season: Apr-Oct)',
    soilType: 'Sandy loam to loamy soils high in organic matter',
    optimalMoistureForSale: 'Cured skin tubers',
    priceTrendInsight: 'Processing varieties (Chipsona, Lady Rosetta, Kufri Frysona) get contract price premiums over table potato varieties.',
    tipsAndTricks: [
      '🥔 Dehaulming: Cut potato foliage 10-12 days before harvesting to harden tuber skin.',
      '📦 Cold Storage: Cure at 12-15°C for 10 days before lowering to 4°C storage.',
      '✨ Grade by size: Seed size (25-45g), Medium (50-100g), Large (>100g).'
    ],
    dos: [
      '✅ Remove soil clumps gently with soft brushes before packaging in net bags.',
      '✅ Store in darkness to prevent greening (Solanine accumulation).'
    ],
    donts: [
      '❌ Do not expose tubers to sunlight after digging; green potatoes are unsellable.',
      '❌ Do not harvest immediately after irrigation to avoid soft rot.'
    ],
    gradingStandards: {
      gradeA: 'Clean skin, uniform shape, no greening or blight cuts, > 50mm size',
      gradeB: '35-50mm size, sound condition'
    }
  }
};

// Generic Dynamic Intelligent Agronomy Fallback Generator
export function getCropAgronomyDetails(cropName, category = 'Agriculture', regLang = 'none') {
  const key = String(cropName || '').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  
  // Exact match or partial match in DB
  const dbMatch = Object.keys(CROP_KNOWLEDGE_DB).find(k => key.includes(k) || k.includes(key));
  if (dbMatch) {
    return CROP_KNOWLEDGE_DB[dbMatch];
  }

  // Dynamic intelligent synthesis for any of the 700+ crops
  return {
    crop: cropName || 'Agricultural Commodity',
    category: category || 'Agriculture',
    mandiSeason: 'Peak seasonal harvest window across primary APMC mandis',
    soilType: 'Well-drained fertile soils with good organic matter and moisture retention',
    optimalMoistureForSale: '10% - 13% (Standard Mandi grade tolerance)',
    priceTrendInsight: `Benchmark rates for ${cropName} are updated daily based on arrivals in major APMC terminal markets, quality grade, and domestic processing demand.`,
    tipsAndTricks: [
      `🌱 Balanced nutrient management: Use soil test-based application of NPK and secondary micronutrients for higher grade output.`,
      `💧 Optimal irrigation scheduling during flowering and grain/fruit filling stages prevents premature dropping.`,
      `🚜 Timely harvest: Harvest when produce reaches 85-90% physiological maturity to ensure best color and weight.`,
      `✨ Post-harvest cleaning: Sieve and clean to remove foreign matter and achieve Grade-A benchmark price realization.`
    ],
    dos: [
      `✅ Thoroughly clean, dry, and grade ${cropName} by size, color, and moisture before taking to the auction yard.`,
      `✅ Pack in clean, standard 50 kg gunny bags or food-grade crates to avoid transit damage.`,
      `✅ Check live mandi rates on KrishiSocial to choose the highest-paying neighboring market.`,
      `✅ Always obtain an official electronic weighbridge receipt at the mandi yard.`
    ],
    donts: [
      `❌ Do not harvest during wet, overcast, or rain conditions to avoid moisture penalties and rot.`,
      `❌ Avoid mixing discolored, immature, or damaged crop with premium Grade-A harvest.`,
      `❌ Never sell to unverified middlemen without written weighment and price agreement.`,
      `❌ Do not store harvested produce on wet ground floors or in poorly ventilated sheds.`
    ],
    gradingStandards: {
      gradeA: 'Foreign matter < 1.0%, Moisture within standard limit, Uniform size & color, Clean sample',
      gradeB: 'Foreign matter < 2.5%, Minor discolouration, Standard market tolerance',
      rejectionThreshold: 'Pest infestation, High moisture > 15%, Rancidity / mold buildup'
    }
  };
}
