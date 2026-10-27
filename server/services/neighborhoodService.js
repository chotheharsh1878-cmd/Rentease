/**
 * Neighborhood Intelligence Service
 * ------------------------------------------------------------
 * Keyless, real-world area intelligence for RentEase.
 *
 * Sources:
 *  - OpenStreetMap Nominatim  -> city geocoding + nearby facilities
 *  - Overpass API             -> fast bulk nearby facilities (when reachable)
 *  - Open-Meteo               -> live weather + air quality
 *
 * Everything is cached on disk so a city is only fetched once per day.
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'neighborhood_cache.json');
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const MEMORY_CACHE = new Map();

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      Object.entries(raw).forEach(([key, value]) => {
        if (value && value.savedAt && Date.now() - value.savedAt < CACHE_TTL_MS) {
          MEMORY_CACHE.set(key, value);
        }
      });
    }
  } catch (err) {
    console.warn('[Neighborhood] Cache read skipped:', err.message);
  }
}

function saveCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    const payload = {};
    MEMORY_CACHE.forEach((value, key) => {
      payload[key] = value;
    });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Neighborhood] Cache save skipped:', err.message);
  }
}

loadCache();

const CATEGORIES = {
  schools: {
    label: 'Schools',
    overpass: '[amenity=school]',
    nominatimQuery: 'school',
    color: '#2563eb'
  },
  colleges: {
    label: 'Colleges & Universities',
    overpass: '[amenity~"^(college|university)$"]',
    nominatimQuery: 'college university',
    color: '#7c3aed'
  },
  hospitals: {
    label: 'Hospitals & Clinics',
    overpass: '[amenity~"^(hospital|clinic|doctors)$"]',
    nominatimQuery: 'hospital',
    color: '#dc2626'
  },
  pharmacies: {
    label: 'Pharmacies & Chemists',
    overpass: '[amenity=pharmacy]',
    nominatimQuery: 'pharmacy chemist',
    color: '#e11d48'
  },
  markets: {
    label: 'Markets & Groceries',
    overpass: '[shop~"^(supermarket|convenience|greengrocer|butcher|bakery|mall)$"]',
    nominatimQuery: 'supermarket market',
    color: '#16a34a'
  },
  shopping: {
    label: 'Shops & Malls',
    overpass: '[shop~"^(mall|department_store|clothes|electronics|furniture)$"]',
    nominatimQuery: 'shopping mall',
    color: '#0d9488'
  },
  banks: {
    label: 'Banks & ATMs',
    overpass: '[amenity~"^(bank|atm)$"]',
    nominatimQuery: 'bank atm',
    color: '#475569'
  },
  restaurants: {
    label: 'Restaurants & Cafes',
    overpass: '[amenity~"^(restaurant|cafe|fast_food)$"]',
    nominatimQuery: 'restaurant cafe',
    color: '#ea580c'
  },
  parks: {
    label: 'Parks & Green Spaces',
    overpass: '[leisure=park]',
    nominatimQuery: 'park',
    color: '#15803d'
  },
  transport: {
    label: 'Public Transport',
    overpass: '[public_transport=station]',
    nominatimQuery: 'bus station railway station',
    color: '#0891b2'
  },
  police: {
    label: 'Police Stations',
    overpass: '[amenity=police]',
    nominatimQuery: 'police station',
    color: '#1e40af'
  }
};

const NOMINATIM_FALLBACK_CATEGORIES = [
  'schools',
  'hospitals',
  'markets',
  'shopping',
  'transport',
  'parks'
];

const CITY_LORE = {
  pune: {
    vibe: 'A relaxed student and IT city with pleasant weather, bustling cafes, and strong college culture.',
    knownFor: ['IT parks in Hinjewadi & Kharadi', 'Savitribai Phule Pune University', 'Koregaon Park food scene', 'Pleasant Sahyadri weather']
  },
  mumbai: {
    vibe: 'Fast-paced coastal metropolis with excellent local trains, street food, and 24/7 energy.',
    knownFor: ['Marine Drive & Gateway of India', 'Local train network', 'Bandra & Andheri nightlife', 'Dabbawala food culture']
  },
  bangalore: {
    vibe: 'India\u2019s tech capital with a mild climate, leafy neighborhoods, and a young cosmopolitan crowd.',
    knownFor: ['ITPL & Electronic City offices', 'Cubbon Park & Lalbagh', 'Koramangala & Indiranagar cafes', 'Startup ecosystem']
  },
  bengaluru: {
    vibe: 'India\u2019s tech capital with a mild climate, leafy neighborhoods, and a young cosmopolitan crowd.',
    knownFor: ['ITPL & Electronic City offices', 'Cubbon Park & Lalbagh', 'Koramangala & Indiranagar cafes', 'Startup ecosystem']
  },
  delhi: {
    vibe: 'Historic capital with wide roads, metro connectivity, vibrant markets, and a strong food culture.',
    knownFor: ['Delhi Metro network', 'Connaught Place & Chandni Chowk', 'Lodhi Garden', 'Top universities & hospitals']
  },
  hyderabad: {
    vibe: 'Modern IT hub blended with old-city charm, biryani culture, and growing green spaces.',
    knownFor: ['HITEC City & Gachibowli', 'Charminar & old city', 'Hussain Sagar lake', 'Affordable family living']
  },
  chennai: {
    vibe: 'Warm coastal city with strong educational institutions, beaches, and a rich classical culture.',
    knownFor: ['Marina Beach', 'IIT Madras & Anna University', 'T. Nagar shopping', 'Filter coffee culture']
  },
  kolkata: {
    vibe: 'Cultural capital with affordable living, trams, bookstores, and legendary street food.',
    knownFor: ['Howrah Bridge', 'Victoria Memorial', 'College Street', 'Durga Puja celebrations']
  },
  ahmedabad: {
    vibe: 'Clean, business-friendly city with strong food traditions and growing infrastructure.',
    knownFor: ['Sabarmati Riverfront', 'IIM Ahmedabad', 'Manek Chowk food market', 'Textile heritage']
  },
  noida: {
    vibe: 'Planned satellite city with wide roads, metro access, and family-friendly sectors.',
    knownFor: ['Metro connectivity to Delhi', 'IT & media companies', 'Sector markets', 'Amity University']
  },
  london: {
    vibe: 'Global financial and cultural hub with excellent transit, museums, and diverse neighborhoods.',
    knownFor: ['London Underground', 'Hyde Park & Regent\u2019s Park', 'British Museum', 'Camden & Shoreditch markets']
  },
  'new york': {
    vibe: 'Dense, energetic global city with 24/7 transit, world-class dining, and iconic parks.',
    knownFor: ['Subway network', 'Central Park', 'Times Square', 'Brooklyn neighborhoods']
  },
  paris: {
    vibe: 'Romantic, walkable capital known for art, cafes, and excellent public transport.',
    knownFor: ['Eiffel Tower', 'Louvre Museum', 'Seine riverside walks', 'Metro network']
  },
  dubai: {
    vibe: 'Ultra-modern desert metropolis with tax-free living, malls, and waterfront communities.',
    knownFor: ['Dubai Metro', 'Dubai Mall & Burj Khalifa', 'Marina & JLT communities', 'Beachfront living']
  },
  tokyo: {
    vibe: 'Ultra-efficient megacity with safe streets, punctual trains, and endless neighborhoods to explore.',
    knownFor: ['JR train network', 'Shibuya & Shinjuku', 'Ueno Park', 'Convenience store culture']
  },
  sydney: {
    vibe: 'Sunny harbor city with beaches, strong public transport, and a relaxed outdoor lifestyle.',
    knownFor: ['Sydney Harbour & Opera House', 'Bondi Beach', 'Ferry network', 'Royal Botanic Garden']
  },
  singapore: {
    vibe: 'Safe, green, and hyper-connected city-state with excellent MRT and hawker food.',
    knownFor: ['MRT network', 'Gardens by the Bay', 'Hawker centres', 'Orchard Road shopping']
  },
  berlin: {
    vibe: 'Affordable, creative European capital with excellent transit, parks, and a laid-back vibe.',
    knownFor: ['U-Bahn & S-Bahn', 'Museum Island', 'Tempelhofer Feld', 'Kreuzberg street food']
  },
  toronto: {
    vibe: 'Multicultural Canadian city with safe neighborhoods, streetcars, and waterfront trails.',
    knownFor: ['TTC transit', 'CN Tower', 'High Park', 'Kensington Market']
  }
};

const WMO_WEATHER = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm'
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'RentEase-RentalPlatform/1.0 (neighborhood intelligence)',
        Accept: 'application/json',
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

function tidyPlaceName(place) {
  const raw = place.name || (place.display_name || '').split(',')[0];
  if (!raw) return 'Unnamed place';
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^(school|hospital|pharmacy|supermarket|market|park|bank|atm|restaurant|cafe)\s*[-:]\s*/i, '')
    .trim();
}

function distanceLabel(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

function classifyOverpassElement(element) {
  const tags = element.tags || {};
  const amenity = (tags.amenity || '').toLowerCase();
  const shop = (tags.shop || '').toLowerCase();
  const leisure = (tags.leisure || '').toLowerCase();

  if (amenity === 'school') return 'schools';
  if (amenity === 'college' || amenity === 'university') return 'colleges';
  if (['hospital', 'clinic', 'doctors'].includes(amenity)) return 'hospitals';
  if (amenity === 'pharmacy') return 'pharmacies';
  if (amenity === 'bank' || amenity === 'atm') return 'banks';
  if (['restaurant', 'cafe', 'fast_food'].includes(amenity)) return 'restaurants';
  if (amenity === 'police') return 'police';
  if (leisure === 'park') return 'parks';
  if (tags.public_transport === 'station' || ['bus_station', 'railway_station', 'subway_station'].includes(amenity)) return 'transport';
  if (['mall', 'department_store', 'clothes', 'electronics', 'furniture'].includes(shop)) return 'shopping';
  if (['supermarket', 'convenience', 'greengrocer', 'butcher', 'bakery'].includes(shop)) return 'markets';
  return null;
}

class NeighborhoodService {
  static async geocodeCity(city) {
    const cleanCity = (city || '').trim();
    if (!cleanCity) return null;

    const cacheKey = `geocode:${cleanCity.toLowerCase()}`;
    const cached = MEMORY_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanCity)}&format=json&addressdetails=1&limit=1`;
      const data = await fetchJson(url);
      if (!Array.isArray(data) || data.length === 0) return null;

      const item = data[0];
      const result = {
        city:
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.municipality ||
          item.name ||
          cleanCity,
        country: item.address?.country || '',
        countryCode: (item.address?.country_code || '').toUpperCase(),
        state: item.address?.state || '',
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      };

      MEMORY_CACHE.set(cacheKey, { savedAt: Date.now(), data: result });
      saveCache();
      return result;
    } catch (err) {
      console.warn('[Neighborhood] Geocoding failed:', err.message);
      return null;
    }
  }

  static async fetchOverpassFacilities(latitude, longitude, radiusMeters = 3000) {
    const categoryClauses = Object.values(CATEGORIES)
      .map((category) => `nwr(around:${radiusMeters},${latitude},${longitude})${category.overpass};`)
      .join('\n  ');

    const query = `[out:json][timeout:18];
(
  ${categoryClauses}
);
out center tags 250;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    for (const endpoint of endpoints) {
      try {
        const data = await fetchJson(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`
          },
          15000
        );

        if (!data || !Array.isArray(data.elements) || data.elements.length === 0) continue;

        const grouped = {};
        Object.keys(CATEGORIES).forEach((key) => {
          grouped[key] = [];
        });

        data.elements.forEach((element) => {
          const categoryKey = classifyOverpassElement(element);
          if (!categoryKey) return;

          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          if (!lat || !lon) return;

          const name = tidyPlaceName({ name: element.tags?.name, display_name: element.tags?.['addr:full'] });
          if (!name || name === 'Unnamed place') return;

          const distanceKm = haversineKm(latitude, longitude, lat, lon);
          grouped[categoryKey].push({
            name,
            latitude: parseFloat(Number(lat).toFixed(6)),
            longitude: parseFloat(Number(lon).toFixed(6)),
            distanceKm,
            distanceLabel: distanceLabel(distanceKm),
            type: CATEGORIES[categoryKey].label
          });
        });

        const facilities = {};
        Object.entries(grouped).forEach(([key, items]) => {
          const seen = new Set();
          facilities[key] = items
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .filter((item) => {
              const uniqueKey = `${item.name.toLowerCase()}-${item.latitude}-${item.longitude}`;
              if (seen.has(uniqueKey)) return false;
              seen.add(uniqueKey);
              return true;
            })
            .slice(0, 6);
        });

        const total = Object.values(facilities).reduce((sum, list) => sum + list.length, 0);
        if (total >= 4) {
          return { facilities, source: 'OpenStreetMap Overpass API' };
        }
      } catch (err) {
        console.warn(`[Neighborhood] Overpass endpoint unavailable (${endpoint}):`, err.message);
      }
    }

    return null;
  }

  static async fetchNominatimFacilities(city, latitude, longitude) {
    const facilities = {};
    Object.keys(CATEGORIES).forEach((key) => {
      facilities[key] = [];
    });

    const bbox = [longitude - 0.11, latitude + 0.08, longitude + 0.11, latitude - 0.08];

    for (let i = 0; i < NOMINATIM_FALLBACK_CATEGORIES.length; i += 1) {
      const key = NOMINATIM_FALLBACK_CATEGORIES[i];
      const category = CATEGORIES[key];
      try {
        const url =
          'https://nominatim.openstreetmap.org/search' +
          `?q=${encodeURIComponent(`${category.nominatimQuery} ${city}`)}` +
          `&format=json&addressdetails=1&limit=8&bounded=1` +
          `&viewbox=${bbox.join(',')}`;
        const data = await fetchJson(url);
        if (Array.isArray(data)) {
          const seen = new Set();
          facilities[key] = data
            .map((place) => {
              const lat = parseFloat(place.lat);
              const lon = parseFloat(place.lon);
              const distanceKm = haversineKm(latitude, longitude, lat, lon);
              return {
                name: tidyPlaceName(place),
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lon.toFixed(6)),
                distanceKm,
                distanceLabel: distanceLabel(distanceKm),
                type: category.label
              };
            })
            .filter((place) => {
              const nameKey = place.name.toLowerCase();
              if (nameKey.length < 3 || seen.has(nameKey)) return false;
              seen.add(nameKey);
              return true;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 5);
        }
      } catch (err) {
        console.warn(`[Neighborhood] Nominatim ${key} lookup failed:`, err.message);
      }

      // Respect Nominatim's public 1 request/second guideline.
      await delay(1000);
    }

    const total = Object.values(facilities).reduce((sum, list) => sum + list.length, 0);
    return {
      facilities,
      source: total > 0 ? 'OpenStreetMap Nominatim (live geodata)' : 'Limited connectivity fallback',
      partial: total < 3
    };
  }

  static async fetchEnvironment(latitude, longitude) {
    const environment = {
      weather: null,
      airQuality: null
    };

    const weatherPromise = fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto',
      {},
      7000
    )
      .then((data) => {
        if (!data?.current) return;
        environment.weather = {
          temperatureC: data.current.temperature_2m,
          feelsLikeC: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windKph: data.current.wind_speed_10m,
          condition: WMO_WEATHER[data.current.weather_code] || 'Mixed conditions'
        };
      })
      .catch(() => {});

    const airPromise = fetchJson(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5`,
      {},
      7000
    )
      .then((data) => {
        if (!data?.current) return;
        const aqi = data.current.us_aqi;
        let level = 'Unknown';
        if (aqi <= 50) level = 'Good';
        else if (aqi <= 100) level = 'Moderate';
        else if (aqi <= 150) level = 'Unhealthy for sensitive groups';
        else if (aqi <= 200) level = 'Unhealthy';
        else if (aqi <= 300) level = 'Very unhealthy';
        else level = 'Hazardous';

        environment.airQuality = {
          usAqi: aqi,
          pm25: data.current.pm2_5,
          level
        };
      })
      .catch(() => {});

    await Promise.all([weatherPromise, airPromise]);
    return environment;
  }

  static buildInsights({ cityInfo, facilities, environment }) {
    const insights = [];
    const nearest = (key) => facilities[key]?.[0];

    const school = nearest('schools');
    if (school) insights.push(`Nearest school: ${school.name} (${school.distanceLabel})`);

    const hospital = nearest('hospitals');
    if (hospital) insights.push(`Nearest hospital: ${hospital.name} (${hospital.distanceLabel})`);

    const market = nearest('markets') || nearest('shopping');
    if (market) insights.push(`Closest grocery/shopping: ${market.name} (${market.distanceLabel})`);

    const transport = nearest('transport');
    if (transport) insights.push(`Public transport: ${transport.name} (${transport.distanceLabel})`);

    const park = nearest('parks');
    if (park) insights.push(`Green space: ${park.name} (${park.distanceLabel})`);

    if (environment.weather) {
      insights.push(
        `Current weather: ${environment.weather.temperatureC}\u00b0C, ${environment.weather.condition}` +
          (environment.weather.humidity ? `, ${environment.weather.humidity}% humidity` : '')
      );
    }

    if (environment.airQuality) {
      insights.push(`Air quality: AQI ${environment.airQuality.usAqi} (${environment.airQuality.level})`);
    }

    const lore = CITY_LORE[(cityInfo.city || '').toLowerCase()];
    if (lore) insights.push(`City vibe: ${lore.vibe}`);

    return insights;
  }

  static buildEnvironmentNarrative({ cityInfo, facilities, environment }) {
    const cityName = cityInfo.city || 'this area';
    const parts = [];

    if (environment.weather) {
      parts.push(
        `Right now ${cityName} is ${environment.weather.temperatureC}\u00b0C with ${environment.weather.condition.toLowerCase()}.`
      );
    }

    if (environment.airQuality) {
      const aqi = environment.airQuality;
      if (aqi.usAqi <= 50) {
        parts.push(`Air quality is good (AQI ${aqi.usAqi}), great for walks and outdoor activity.`);
      } else if (aqi.usAqi <= 100) {
        parts.push(`Air quality is moderate (AQI ${aqi.usAqi}); mostly fine for daily life.`);
      } else {
        parts.push(
          `Air quality is ${aqi.level.toLowerCase()} (AQI ${aqi.usAqi}); sensitive people may want to limit long outdoor exposure on poor days.`
        );
      }
    }

    const greenCount = facilities.parks?.length || 0;
    const schoolCount = facilities.schools?.length || 0;
    const hospitalCount = facilities.hospitals?.length || 0;
    const marketCount = (facilities.markets?.length || 0) + (facilities.shopping?.length || 0);
    const transportCount = facilities.transport?.length || 0;

    if (schoolCount > 0) {
      parts.push(`${schoolCount} schools are mapped within a short radius, making the area convenient for families.`);
    }
    if (hospitalCount > 0) {
      parts.push(`${hospitalCount} hospitals/clinics are close by for everyday medical needs.`);
    }
    if (marketCount > 0) {
      parts.push(`${marketCount} grocery, market, or shopping options are nearby.`);
    }
    if (transportCount > 0) {
      parts.push(`${transportCount} public transport stops are mapped nearby, so commuting is practical.`);
    }
    if (greenCount > 0) {
      parts.push(`${greenCount} parks or green spaces give the neighborhood breathing room.`);
    }

    const lore = CITY_LORE[(cityInfo.city || '').toLowerCase()];
    if (lore) parts.push(lore.vibe);

    return parts.join(' ');
  }

  static async getCityProfile(city, options = {}) {
    const cleanCity = (city || '').trim();
    if (!cleanCity) return null;

    const cacheKey = `profile:${cleanCity.toLowerCase()}`;
    const cached = MEMORY_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    const cityInfo = await this.geocodeCity(cleanCity);
    if (!cityInfo) return null;

    const { latitude, longitude } = cityInfo;
    const radius = options.radiusMeters || 3000;

    const [overpassResult, environment] = await Promise.all([
      this.fetchOverpassFacilities(latitude, longitude, radius),
      this.fetchEnvironment(latitude, longitude)
    ]);

    let facilitiesResult = overpassResult;
    if (!facilitiesResult) {
      facilitiesResult = await this.fetchNominatimFacilities(cityInfo.city, latitude, longitude);
    }

    const facilities = facilitiesResult.facilities || {};
    const counts = {};
    Object.keys(CATEGORIES).forEach((key) => {
      counts[key] = Array.isArray(facilities[key]) ? facilities[key].length : 0;
    });

    const profile = {
      city: cityInfo.city,
      country: cityInfo.country,
      state: cityInfo.state,
      displayName: cityInfo.displayName,
      center: { latitude, longitude },
      radiusMeters: radius,
      environment,
      facilities,
      counts,
      nearest: {
        school: facilities.schools?.[0] || null,
        hospital: facilities.hospitals?.[0] || null,
        market: facilities.markets?.[0] || facilities.shopping?.[0] || null,
        transport: facilities.transport?.[0] || null,
        park: facilities.parks?.[0] || null,
        pharmacy: facilities.pharmacies?.[0] || null,
        bank: facilities.banks?.[0] || null,
        restaurant: facilities.restaurants?.[0] || null
      },
      insights: this.buildInsights({ cityInfo, facilities, environment }),
      environmentSummary: this.buildEnvironmentNarrative({ cityInfo, facilities, environment }),
      cityLore: CITY_LORE[(cityInfo.city || '').toLowerCase()] || null,
      dataSource: facilitiesResult.source,
      partial: Boolean(facilitiesResult.partial),
      fetchedAt: new Date().toISOString()
    };

    MEMORY_CACHE.set(cacheKey, { savedAt: Date.now(), data: profile });
    saveCache();
    return profile;
  }

  static async getNearbyFacilities({ latitude, longitude, city }) {
    if (!latitude || !longitude) {
      return this.getCityProfile(city);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const overpassResult = await this.fetchOverpassFacilities(lat, lon, 2500);
    const result = overpassResult || (await this.fetchNominatimFacilities(city || 'this area', lat, lon));

    return {
      center: { latitude: lat, longitude: lon },
      facilities: result.facilities || {},
      source: result.source,
      fetchedAt: new Date().toISOString()
    };
  }

  static formatForPrompt(profile) {
    if (!profile) return 'No neighborhood intelligence available.';
    const facilities = profile.facilities || {};
    const lines = [];

    lines.push(`City: ${profile.city}, ${profile.country}`);
    if (profile.environmentSummary) lines.push(`Environment: ${profile.environmentSummary}`);

    Object.entries(CATEGORIES).forEach(([key, meta]) => {
      const items = (facilities[key] || []).slice(0, 3);
      if (items.length === 0) return;
      lines.push(
        `${meta.label}: ` +
          items.map((item) => `${item.name} (${item.distanceLabel})`).join('; ')
      );
    });

    if (profile.cityLore) {
      lines.push(`Known for: ${profile.cityLore.knownFor.join(', ')}`);
    }

    return lines.join('\n');
  }
}

module.exports = NeighborhoodService;
