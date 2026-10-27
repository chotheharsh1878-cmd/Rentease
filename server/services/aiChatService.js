/**
 * RentEase AI Chatbot Service
 * ------------------------------------------------------------
 * Conversational rental advisor that combines:
 *  - MySQL verified property listings
 *  - Live global city inventory (OpenStreetMap + Untera)
 *  - Neighborhood intelligence (schools, hospitals, markets, transport, parks)
 *  - Live weather + air quality
 *  - Optional Google Gemini response generation
 *
 * If Gemini is unavailable the service still produces rich, useful,
 * database-grounded answers through its built-in response engine.
 */

const PropertyModel = require('../models/propertyModel');
const FaqModel = require('../models/faqModel');
const GlobalRentalService = require('../services/globalRentalService');
const NeighborhoodService = require('../services/neighborhoodService');

const KNOWN_CITIES = [
  'new york', 'navi mumbai', 'greater noida', 'san francisco', 'abu dhabi',
  'bengaluru', 'bangalore', 'hyderabad', 'ahmedabad', 'chandigarh',
  'coimbatore', 'visakhapatnam', 'thiruvananthapuram', 'bhubaneswar',
  'gurugram', 'gurgaon', 'faridabad', 'ghaziabad', 'nashik', 'nagpur',
  'aurangabad', 'kolhapur', 'solapur', 'sangli', 'satara', 'jaipur',
  'lucknow', 'indore', 'bhopal', 'patna', 'surat', 'vadodara', 'thane',
  'mumbai', 'delhi', 'kolkata', 'chennai', 'pune', 'noida',
  'london', 'manchester', 'birmingham', 'edinburgh',
  'paris', 'marseille', 'lyon', 'nice', 'berlin', 'munich', 'frankfurt',
  'hamburg', 'rome', 'milan', 'florence', 'venice', 'madrid', 'barcelona',
  'valencia', 'seville', 'lisbon', 'porto', 'amsterdam', 'rotterdam',
  'brussels', 'vienna', 'zurich', 'geneva', 'chicago', 'houston', 'miami',
  'seattle', 'boston', 'los angeles', 'toronto', 'vancouver', 'montreal',
  'calgary', 'tokyo', 'osaka', 'kyoto', 'dubai', 'singapore', 'bangkok',
  'sydney', 'melbourne', 'brisbane', 'perth', 'auckland', 'wellington'
];

const CITY_ALIASES = {
  bengaluru: 'Bangalore',
  bangalore: 'Bangalore',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
  gurugram: 'Gurugram',
  gurgaon: 'Gurugram',
  'navi mumbai': 'Navi Mumbai',
  'greater noida': 'Greater Noida'
};

const NEIGHBORHOOD_TERMS = [
  'neighborhood', 'neighbourhood', 'area', 'surrounding', 'surroundings',
  'nearby', 'near by', 'near me', 'environment', 'weather', 'climate',
  'air quality', 'aqi', 'pollution', 'school', 'schools', 'college', 'colleges',
  'university', 'universities', 'hospital', 'hospitals', 'clinic', 'pharmacy',
  'medical', 'market', 'markets', 'grocery', 'groceries', 'supermarket',
  'shop', 'shops', 'shopping', 'mall', 'malls', 'park', 'parks', 'garden',
  'transport', 'metro', 'bus', 'train', 'railway', 'restaurant', 'restaurants',
  'cafe', 'cafes', 'food', 'bank', 'banks', 'atm', 'police', 'safe', 'safety',
  'live', 'living', 'vibe', 'good area', 'family friendly', 'student friendly',
  'city info', 'about the city', 'about this area'
];

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

class AiChatService {
  static extractCriteria(query) {
    const text = String(query || '').toLowerCase();
    const criteria = {};

    // Language detection supports English, Hinglish, and Marathi (Roman or Devanagari).
    const devanagari = /[\u0900-\u097F]/;
    const marathiKeywords = [
      'madhe', 'madhye', 'aat', 'dakhva', 'pahije', 'aahe', 'kiti', 'bhada',
      'kholi', 'ghar', 'jayega', 'milel', 'sanga', 'mala', 'tumhi'
    ];
    const hindiKeywords = [
      'me', 'mein', 'ke andar', 'chahiye', 'dikhao', 'kya', 'hai', 'kitna',
      'paise', 'batao', 'ghar', 'kamra', 'kiraya', 'bhai', 'bata', 'chaiye'
    ];

    if (marathiKeywords.some((word) => text.includes(word))) {
      criteria.language = 'mr';
    } else if (hindiKeywords.some((word) => text.includes(word)) || devanagari.test(text)) {
      criteria.language = 'hi';
    } else {
      criteria.language = 'en';
    }

    // City detection: known cities first, then natural language patterns.
    const sortedCities = [...KNOWN_CITIES].sort((a, b) => b.length - a.length);
    for (const city of sortedCities) {
      const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
      if (pattern.test(text)) {
        criteria.city = CITY_ALIASES[city] || titleCase(city);
        break;
      }
    }

    if (!criteria.city) {
      const patterns = [
        /\b(?:in|near|around|at|from|for)\s+([a-z][a-z\s.'-]{1,28}?)(?=\s+(?:under|below|less|max|budget|for|with|student|family|flat|room|house|pg|hostel|apartment|bhk|near|me|mein|madhe)\b|[,.!?]|$)/i,
        /\b([a-z][a-z\s.'-]{1,28}?)\s+(?:me|mein|madhe|madhye)\b/i
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim();
          if (!['the', 'a', 'my', 'this', 'that', 'any', 'some', 'best'].includes(candidate)) {
            criteria.city = titleCase(candidate);
            break;
          }
        }
      }
    }

    // Budget detection: "under 15000", "below 15k", "5000 ke andar", "5k budget".
    const normalized = text
      .replace(/[₹,]/g, ' ')
      .replace(/\bthousand\b/g, 'k')
      .replace(/\s+/g, ' ')
      .trim();

    const rentPatterns = [
      /(?:under|below|less than|max|maximum|budget of|budget|upto|up to|ke andar|chya aat|se kam)\s*(?:rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k)?/i,
      /([0-9]+(?:\.[0-9]+)?)\s*(k)?\s*(?:ke andar|chya aat|se kam|budget|max|under|below|mein|me)\b/i
    ];

    for (const pattern of rentPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        let amount = parseFloat(match[1]);
        if (match[2] === 'k' || match[2] === 'K') amount *= 1000;
        if (Number.isFinite(amount) && amount >= 500 && amount <= 5000000) {
          criteria.maxRent = Math.round(amount);
          break;
        }
      }
    }

    // Tenant category
    if (/\b(student|students|college|university|intern|interns|bachelor|bachelors)\b/.test(text)) {
      criteria.tenantCategory = 'student';
    } else if (/\b(family|families|married|couple|kids|children)\b/.test(text)) {
      criteria.tenantCategory = 'family';
    }

    // Bedrooms
    const bhkMatch = normalized.match(/([1-5])\s*(?:bhk|bedroom|bedrooms|bed|rk)\b/i);
    if (bhkMatch) criteria.bedrooms = parseInt(bhkMatch[1], 10);

    // Property type
    if (/\bpg\b|paying guest/.test(text)) {
      criteria.propertyType = 'PG';
    } else if (/\bhostel\b/.test(text)) {
      criteria.propertyType = 'hostel';
    } else if (/\broom\b|\b1rk\b/.test(text)) {
      criteria.propertyType = 'room';
    } else if (/\bflat\b|\bapartment\b|\b2bhk\b|\b3bhk\b/.test(text)) {
      criteria.propertyType = 'flat';
    } else if (/\bhouse\b|\bvilla\b|\bbungalow\b|\bhome\b/.test(text)) {
      criteria.propertyType = 'house';
    } else if (/\bshared\b/.test(text)) {
      criteria.propertyType = 'shared accommodation';
    }

    const isNeighborhoodQuery = NEIGHBORHOOD_TERMS.some((term) => text.includes(term));

    const isPropertyQuery =
      Boolean(criteria.city || criteria.maxRent || criteria.tenantCategory || criteria.bedrooms || criteria.propertyType) ||
      /\b(rent|rental|deposit|available|accommodation|property|properties|dikhao|dakhva|batao|show|find|list)\b/.test(text);

    const isGreeting = /^(hi|hello|hey|namaste|hola|good morning|good evening|yo)\b/i.test(text.trim());

    return {
      criteria,
      language: criteria.language,
      isPropertyQuery,
      isNeighborhoodQuery,
      isGreeting
    };
  }

  static extractCityFromHistory(history = []) {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const text = String(history[i]?.message || '').toLowerCase();
      for (const city of KNOWN_CITIES) {
        const pattern = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(text)) return CITY_ALIASES[city] || titleCase(city);
      }
    }
    return null;
  }

  static async findProperties(criteria, limit = 4) {
    let results = [];

    try {
      results = await PropertyModel.findForChatbot({
        city: criteria.city,
        maxRent: criteria.maxRent,
        tenantCategory: criteria.tenantCategory,
        propertyType: criteria.propertyType,
        bedrooms: criteria.bedrooms,
        limit
      });
    } catch (dbErr) {
      console.warn('[AI Chat] Database property lookup skipped:', dbErr.message);
    }

    // Live global city inventory keeps the assistant useful for any city
    // and fills gaps when the database has no seeded listings.
    if (criteria.city) {
      try {
        const liveResults = await GlobalRentalService.searchWorldwide({
          city: criteria.city,
          maxRent: criteria.maxRent,
          tenantCategory: criteria.tenantCategory,
          propertyType: criteria.propertyType
        });

        const existingIds = new Set(results.map((property) => String(property.id)));
        const extras = (liveResults || [])
          .filter((property) => !existingIds.has(String(property.id)))
          .slice(0, limit);

        results = [...results, ...extras];
      } catch (globalErr) {
        console.warn('[AI Chat] Global inventory lookup skipped:', globalErr.message);
      }
    }

    return results.slice(0, 5);
  }

  static buildSuggestions({ city, properties, neighborhood, criteria }) {
    const suggestions = [];
    const place = city || neighborhood?.city;

    if (place) {
      suggestions.push(`Show homes under ₹15,000 in ${place}`);
      suggestions.push(`Is ${place} safe and family friendly?`);
      suggestions.push(`Schools and hospitals near ${place}`);
      suggestions.push(`Best areas in ${place} for students`);
    } else {
      suggestions.push('Find student rooms under ₹10,000');
      suggestions.push('Show 2 BHK family flats in Pune');
      suggestions.push('Compare PG vs flat for students');
      suggestions.push('What should I check before renting?');
    }

    if (neighborhood?.nearest?.transport) {
      suggestions.push(`How is public transport in ${place}?`);
    }

    if (properties.length > 0) {
      suggestions.push(`Tell me more about ${properties[0].locality || properties[0].city}`);
    }

    if (criteria?.maxRent && place) {
      suggestions.push(`What can I get above ₹${formatMoney(criteria.maxRent)} in ${place}?`);
    }

    return [...new Set(suggestions)].slice(0, 4);
  }

  static async processChat({ message, history = [] }) {
    const detected = this.extractCriteria(message);
    const { criteria, language, isPropertyQuery, isNeighborhoodQuery, isGreeting } = detected;

    // Reuse the last mentioned city in the conversation for natural follow-ups.
    if (!criteria.city) {
      const rememberedCity = this.extractCityFromHistory(history);
      if (rememberedCity) criteria.city = rememberedCity;
    }

    let matchingProperties = [];
    let relevantFaqs = [];
    let neighborhood = null;

    if (isPropertyQuery && !isGreeting) {
      matchingProperties = await this.findProperties(criteria);
    }

    if (criteria.city && (isNeighborhoodQuery || isPropertyQuery || isGreeting)) {
      try {
        neighborhood = await NeighborhoodService.getCityProfile(criteria.city);
      } catch (err) {
        console.warn('[AI Chat] Neighborhood lookup skipped:', err.message);
      }
    }

    try {
      relevantFaqs = await FaqModel.findRelevant(message);
    } catch (faqErr) {
      console.warn('[AI Chat] FAQ lookup skipped:', faqErr.message);
    }

    let reply = null;
    let source = 'database-fallback';

    const apiKey = process.env.GEMINI_API_KEY;
    const usableKey = apiKey && apiKey !== 'your_api_key_here' && apiKey !== 'your_gemini_api_key_here';

    if (usableKey) {
      try {
        const aiAnswer = await this.callGeminiApi({
          message,
          history,
          criteria,
          properties: matchingProperties,
          faqs: relevantFaqs,
          neighborhood,
          language,
          apiKey
        });

        if (aiAnswer) {
          reply = aiAnswer;
          source = 'gemini';
        }
      } catch (err) {
        console.warn('[AI Chat] Gemini unavailable, using built-in intelligence:', err.message);
      }
    }

    if (!reply) {
      reply = this.generateFallbackResponse({
        message,
        criteria,
        isPropertyQuery,
        isNeighborhoodQuery,
        isGreeting,
        properties: matchingProperties,
        faqs: relevantFaqs,
        neighborhood,
        language
      });
    }

    return {
      reply,
      properties: matchingProperties,
      faqs: relevantFaqs,
      neighborhood: neighborhood
        ? {
            city: neighborhood.city,
            country: neighborhood.country,
            center: neighborhood.center,
            environment: neighborhood.environment,
            environmentSummary: neighborhood.environmentSummary,
            counts: neighborhood.counts,
            nearest: neighborhood.nearest,
            facilities: neighborhood.facilities,
            insights: neighborhood.insights,
            cityLore: neighborhood.cityLore,
            dataSource: neighborhood.dataSource
          }
        : null,
      suggestions: this.buildSuggestions({
        city: criteria.city,
        properties: matchingProperties,
        neighborhood,
        criteria
      }),
      source,
      language
    };
  }

  static async callGeminiApi({
    message,
    history,
    properties,
    faqs,
    neighborhood,
    language = 'en',
    apiKey
  }) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const propertyContext = properties.map((property) => ({
      id: property.id,
      title: property.title,
      city: property.city,
      locality: property.locality,
      monthlyRent: `₹${formatMoney(property.monthly_rent)}/month`,
      securityDeposit: `₹${formatMoney(property.security_deposit)}`,
      propertyType: property.property_type,
      forCategory: property.tenant_category,
      bedrooms: property.bedrooms,
      furnishing: property.furnishing_status,
      amenities: property.amenities,
      ownerContact: property.owner_phone,
      source: property.source || 'RentEase verified database'
    }));

    const neighborhoodContext = neighborhood
      ? {
          city: neighborhood.city,
          environmentSummary: neighborhood.environmentSummary,
          weather: neighborhood.environment?.weather,
          airQuality: neighborhood.environment?.airQuality,
          nearbyCounts: neighborhood.counts,
          nearest: neighborhood.nearest,
          highlights: neighborhood.insights,
          knownFor: neighborhood.cityLore?.knownFor || [],
          facilities: Object.fromEntries(
            Object.entries(neighborhood.facilities || {}).map(([key, items]) => [
              key,
              (items || []).slice(0, 4).map((item) => `${item.name} (${item.distanceLabel})`)
            ])
          )
        }
      : null;

    const systemPrompt = `You are "RentEase AI Assistant", a warm, lively, and knowledgeable rental advisor.

You help people find homes AND understand the neighborhood they are moving into. You can talk about:
1. Verified rental homes (rooms, PGs, flats, houses) from the provided inventory.
2. The local environment: weather, air quality, green spaces, and overall vibe.
3. Nearby essentials: schools, colleges, hospitals, pharmacies, markets, shops, malls, banks, restaurants, parks, public transport, and police stations.

CRITICAL RULES:
- Never invent property details, prices, contacts, or facility names. Use ONLY the provided context.
- If no homes match the user's filters, say so clearly and suggest a nearby budget, a different area, or browsing all homes.
- Neighborhood facility data comes from OpenStreetMap and weather from Open-Meteo. Present it as live area intelligence.
- Prices are in Indian Rupees (₹) for India; for international cities mention the local context naturally.
- Be interactive and interesting: use short paragraphs, concise bullet points, and finish with ONE friendly follow-up question.
- Do not dump every facility. Pick the most useful 3-5 nearby places.
- Respond in the SAME language style the user used:
  - English -> English
  - Hindi / Hinglish -> natural Hinglish (Roman script)
  - Marathi -> natural Marathi (Roman script is fine)
- Keep the answer under 220 words.

City/neighborhood context:
${neighborhoodContext ? JSON.stringify(neighborhoodContext, null, 2) : 'No neighborhood context available.'}

Matching homes:
${JSON.stringify(propertyContext, null, 2)}

Relevant FAQs:
${JSON.stringify(faqs.map((faq) => ({ question: faq.question, answer: faq.answer })), null, 2)}
`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      {
        role: 'model',
        parts: [
          {
            text: 'Understood. I am RentEase AI Assistant. I will stay factual, talk about both homes and neighborhoods, and end with a helpful follow-up question.'
          }
        ]
      }
    ];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-4).forEach((entry) => {
        contents.push({
          role: entry.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: entry.message }]
        });
      });
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  static describeNearby(neighborhood) {
    if (!neighborhood) return [];

    const lines = [];
    const nearest = neighborhood.nearest || {};

    const addLine = (label, place) => {
      if (place) lines.push(`- **${label}:** ${place.name} (${place.distanceLabel})`);
    };

    addLine('Nearest school', nearest.school);
    addLine('Nearest hospital', nearest.hospital);
    addLine('Closest market / grocery', nearest.market);
    addLine('Public transport', nearest.transport);
    addLine('Pharmacy', nearest.pharmacy);
    addLine('Nearest park', nearest.park);

    if (lines.length === 0) {
      const counts = neighborhood.counts || {};
      if (counts.schools) lines.push(`- **Schools nearby:** ${counts.schools} mapped`);
      if (counts.hospitals) lines.push(`- **Hospitals/clinics:** ${counts.hospitals} mapped`);
      if (counts.markets) lines.push(`- **Markets & groceries:** ${counts.markets} mapped`);
    }

    return lines;
  }

  static describeEnvironment(neighborhood) {
    if (!neighborhood) return [];
    const lines = [];
    const weather = neighborhood.environment?.weather;
    const air = neighborhood.environment?.airQuality;

    if (weather) {
      lines.push(
        `- **Weather right now:** ${weather.temperatureC}°C, ${weather.condition}` +
          (weather.humidity != null ? `, ${weather.humidity}% humidity` : '')
      );
    }
    if (air) {
      lines.push(`- **Air quality:** AQI ${air.usAqi} (${air.level})`);
    }
    if (neighborhood.counts?.parks) {
      lines.push(`- **Green spaces:** ${neighborhood.counts.parks} parks mapped within a short radius`);
    }
    if (neighborhood.cityLore?.vibe) {
      lines.push(`- **Vibe:** ${neighborhood.cityLore.vibe}`);
    }
    return lines;
  }

  static propertyBlock(properties) {
    return properties.map((property, index) => {
      const lines = [];
      lines.push(`**${index + 1}. ${property.title}**`);
      lines.push(
        `- **Rent:** ₹${formatMoney(property.monthly_rent)}/month | **Deposit:** ₹${formatMoney(property.security_deposit)}`
      );
      lines.push(`- **Where:** ${property.locality}, ${property.city}`);
      lines.push(
        `- **Type:** ${String(property.property_type || '').toUpperCase()} for ${property.tenant_category}` +
          (property.bedrooms ? ` | ${property.bedrooms} BHK` : '')
      );
      if (Array.isArray(property.amenities) && property.amenities.length > 0) {
        lines.push(`- **Highlights:** ${property.amenities.slice(0, 4).join(', ')}`);
      }
      return lines.join('\n');
    });
  }

  static generateFallbackResponse({
    message,
    criteria,
    isPropertyQuery,
    isNeighborhoodQuery,
    isGreeting,
    properties,
    faqs,
    neighborhood,
    language
  }) {
    const qLower = String(message || '').toLowerCase();
    const city = criteria.city || neighborhood?.city;
    const intro =
      language === 'hi' ? 'Bilkul! ' : language === 'mr' ? 'Nakkich! ' : '';

    // Greeting without a city yet.
    if (isGreeting && !city) {
      return `${intro}Hello! I am **RentEase AI Assistant** — your rental and neighborhood guide.

I can help you with:
- Finding rooms, PGs, flats, and family houses in any city
- Showing every available home on an interactive map
- Neighborhood essentials like schools, hospitals, markets, shops, and transport
- Live weather, air quality, and the overall vibe of an area
- Deposits, agreements, and renting tips

Which city are you moving to? Try: *"Show homes in Pune under ₹15,000"* or *"Is Bangalore good for families?"*`;
    }

    // If the user asked about an area but we still do not know the city.
    if (isNeighborhoodQuery && !city && !isPropertyQuery) {
      return `${intro}I can tell you about schools, hospitals, markets, transport, weather, and the general vibe of an area.

Which city or neighborhood should I look up? For example:
- *"Tell me about Kothrud, Pune"*
- *"Is Whitefield, Bangalore good for families?"*
- *"Schools and hospitals near Hinjewadi"*`;
    }

    const sections = [];

    if (isPropertyQuery) {
      if (properties.length > 0) {
        sections.push(
          `${intro}I found **${properties.length} good option${properties.length > 1 ? 's' : ''}**` +
            (city ? ` in **${city}**` : '') +
            ` that match what you asked for. Here are the strongest picks:`
        );
        sections.push(this.propertyBlock(properties).join('\n\n'));
      } else {
        sections.push(
          `${intro}I could not find a property matching those exact filters` +
            (city ? ` in **${city}**` : '') +
            ` right now.

Try one of these:
- Increase the budget slightly
- Remove the BHK or property-type filter
- Search a neighboring area
- Browse all homes in the city — new inventory is added regularly`
        );
      }
    }

    if (neighborhood) {
      const nearbyLines = this.describeNearby(neighborhood);

      if (isNeighborhoodQuery || !isPropertyQuery) {
        sections.push(`### ${neighborhood.city} at a glance`);
        if (neighborhood.environmentSummary) {
          sections.push(neighborhood.environmentSummary);
        }
      } else {
        sections.push(`### Living in ${neighborhood.city}`);
      }

      if (nearbyLines.length > 0) {
        sections.push(`**Nearby essentials**\n${nearbyLines.join('\n')}`);
      }

      const environmentLines = this.describeEnvironment(neighborhood);
      if (environmentLines.length > 0) {
        sections.push(`**Environment & vibe**\n${environmentLines.join('\n')}`);
      }

      if (isNeighborhoodQuery && neighborhood.cityLore?.knownFor?.length) {
        sections.push(`**Known for**\n- ${neighborhood.cityLore.knownFor.join('\n- ')}`);
      }

      if (neighborhood.dataSource) {
        sections.push(
          `_Area intelligence from ${neighborhood.dataSource} + live weather data. Distances are approximate._`
        );
      }
    }

    if (!isPropertyQuery && !neighborhood && faqs.length > 0) {
      const topFaq = faqs[0];
      sections.push(`**${topFaq.question}**\n\n${topFaq.answer}`);
    }

    if (qLower.includes('deposit')) {
      sections.push(
        `**Security deposit guide**
- Student PGs and rooms: usually 1–2 months' rent
- Family flats and houses: usually 2–4 months' rent
- Always get the refund timeline and deduction rules written into the agreement`
      );
    }

    if (sections.length === 0) {
      sections.push(
        `${intro}I am your rental and neighborhood guide. Ask me things like:
- *"Show 2 BHK family flats in Bangalore under ₹25,000"*
- *"What is the environment like in Pune?"*
- *"Schools and hospitals near Hinjewadi"*
- *"Is Mumbai safe for a student?"*`
      );
    }

    // A friendly, interactive closing question.
    if (city) {
      sections.push(
        `Would you like me to narrow this down by budget, BHK, or a specific area of **${city}**?`
      );
    } else {
      sections.push('Which city should we explore first?');
    }

    return sections.join('\n\n');
  }
}

module.exports = AiChatService;
