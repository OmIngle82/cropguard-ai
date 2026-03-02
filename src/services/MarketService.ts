import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarketRate {
    id: string;
    commodity: string;
    emoji: string;
    mandi: string;
    price: number;             // ₹ per quintal
    weeklyChange: number;      // % change from last week (-5.2, +3.1, etc.)
    trend: 'up' | 'down' | 'stable';
    sellSignal: 'sell_now' | 'hold' | 'wait';
    insight: string;           // 1-line AI market advisory
    history: { date: string; price: number }[]; // 30-day price history
}

export interface MarketResponse {
    rates: MarketRate[];
    isLive: boolean;
    generatedAt: string;       // ISO timestamp
}

// ── Cache ────────────────────────────────────────────────────────────────────

const getCacheKey = () => `kisan_market_v2_${new Date().toISOString().split('T')[0]}`;

function getCache(): MarketResponse | null {
    try {
        const raw = localStorage.getItem(getCacheKey());
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }
    return null;
}

function setCache(data: MarketResponse) {
    try {
        localStorage.setItem(getCacheKey(), JSON.stringify(data));
    } catch {
        /* ignore */
    }
}

// ── Gemini Fetcher ────────────────────────────────────────────────────────────

const PRIMARY_CROPS = [
    { name: 'Cotton', emoji: '🌾', mandi: 'Akola APMC' },
    { name: 'Soybean', emoji: '🫘', mandi: 'Amravati APMC' },
    { name: 'Tur Dal', emoji: '🌿', mandi: 'Yavatmal APMC' },
    { name: 'Wheat', emoji: '🌾', mandi: 'Nagpur APMC' },
    { name: 'Orange', emoji: '🍊', mandi: 'Nagpur APMC' },
    { name: 'Gram (Chana)', emoji: '🫛', mandi: 'Wardha APMC' },
];

async function fetchWithModel(apiKey: string, modelName: string, locationName?: string): Promise<MarketRate[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const regionClue = locationName
        ? `The farmer is located near: ${locationName} (likely Vidarbha region, Maharashtra).`
        : `Assume Vidarbha region, Maharashtra, India.`;

    const cropList = PRIMARY_CROPS.map(c => `"${c.name}" (at ${c.mandi})`).join(', ');

    const prompt = `You are an expert agricultural market analyst for Maharashtra, India.
Today is ${today}. ${regionClue}

Generate realistic APMC mandi market rates and 30-day historical trends for the following crops: ${cropList}.
Base data on seasonal patterns (e.g., harvesting seasons in Feb/March), commodity cycles, and typical Maharashtra market behavior.

Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation.

Required JSON format:
[
  {
    "commodity": "Cotton",
    "emoji": "🌾",
    "mandi": "Akola APMC",
    "price": 7200,
    "weeklyChange": -2.3,
    "trend": "down",
    "sellSignal": "hold",
    "insight": "Cotton arrivals surged this week, keeping prices under pressure. Hold for 7-10 days.",
    "history": [
      {"date": "2024-01-20", "price": 7450},
      {"date": "2024-01-27", "price": 7380},
      {"date": "2024-02-03", "price": 7300},
      {"date": "2024-02-10", "price": 7250},
      {"date": "2024-02-17", "price": 7200}
    ]
  }
]

Rules:
- price: realistic ₹/quintal for current season.
- history: provide EXACTLY 5-7 data points covering the last 30 days. Ensure the points create a logical trend ending at the current price. Use ISO date strings (YYYY-MM-DD).
- weeklyChange: percentage float like -2.3 or +4.1.
- insight: actionable 1-line advice for the farmer, max 15 words.
- Return exactly ${PRIMARY_CROPS.length} objects in the array.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any potential markdown wrapper and sanitize invalid JSON patterns
    const clean = text
        .replace(/```json|```/g, '')  // strip markdown code fences
        .replace(/:\s*\+([0-9])/g, ': $1')  // fix "+1.2" → "1.2" (invalid JSON)
        .trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Invalid response shape from Gemini');
    }

    // Map to typed MarketRate with IDs
    return parsed.map((item: any, i: number) => ({
        id: `mkt-${i}`,
        commodity: item.commodity ?? PRIMARY_CROPS[i]?.name ?? 'Unknown',
        emoji: item.emoji ?? PRIMARY_CROPS[i]?.emoji ?? '🌾',
        mandi: item.mandi ?? PRIMARY_CROPS[i]?.mandi ?? 'APMC',
        price: Number(item.price) || 0,
        weeklyChange: Number(item.weeklyChange) || 0,
        trend: ['up', 'down', 'stable'].includes(item.trend) ? item.trend : 'stable',
        sellSignal: ['sell_now', 'hold', 'wait'].includes(item.sellSignal) ? item.sellSignal : 'hold',
        insight: String(item.insight || ''),
        history: Array.isArray(item.history) ? item.history : [],
    }));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getMarketRates(
    locationName?: string,
    forceRefresh = false
): Promise<MarketResponse> {
    // Serve from daily cache unless forced
    if (!forceRefresh) {
        const cached = getCache();
        if (cached) {
            console.log('📦 Market rates served from daily cache');
            return cached;
        }
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    if (!apiKey) {
        console.warn('VITE_GEMINI_API_KEY not set');
        return { rates: [], isLive: false, generatedAt: new Date().toISOString() };
    }

    const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
    let lastError: unknown;

    for (const modelName of models) {
        try {
            console.log(`📊 Fetching market rates via ${modelName}...`);
            const rates = await fetchWithModel(apiKey, modelName, locationName);

            const response: MarketResponse = {
                rates,
                isLive: true,
                generatedAt: new Date().toISOString(),
            };

            setCache(response);
            console.log(`✅ Market rates fetched and cached (${rates.length} crops)`);
            return response;
        } catch (err) {
            console.warn(`❌ ${modelName} failed for market rates:`, err);
            lastError = err;
        }
    }

    console.error('All models failed for market rates:', lastError);
    return { rates: [], isLive: false, generatedAt: new Date().toISOString() };
}
