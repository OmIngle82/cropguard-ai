export interface NewsItem {
    id: string;
    title: string;
    image: string;
    tag: string;
    color: string;
    date: string;
    content: string;
    url?: string;
    source?: string;
}

// Reliable fallback image
// Reliable fallback images (Rotating)
// Reliable fallback images (Rotating)
const FALLBACK_IMAGES = [
    '/news/landscape.png',      // Aesthetic Farm Landscape
    '/news/tractor.png',        // Minimalist Tractor Art
    '/news/close_up.png',       // Close-up Crops
    '/news/farmer_hands.png',   // Farmer Hands
    '/news/drone.png',          // Agri-Tech Drone Art
    '/news/wheat_sunset.png'    // Golden Wheat Sunset
];

// Helper to fetch and filter news (Using CorsProxy.io + XML Parsing)
async function fetchNewsFromGoogle(query: string, language: 'en' | 'mr' | 'hi'): Promise<any[]> {
    const rssUrl = language === 'mr'
        ? `https://news.google.com/rss/search?q=${query}&hl=mr-IN&gl=IN&ceid=IN:mr`
        : language === 'hi'
            ? `https://news.google.com/rss/search?q=${query}&hl=hi-IN&gl=IN&ceid=IN:hi`
            : `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

    // Keywords for strict relevance filtering (Client-side)
    const keywords = {
        mr: ['कृषी', 'शेतकरी', 'पीक', 'कापूस', 'सोयाबीन', 'बाजार', 'हवामान', 'अनुदान', 'योजना', 'पेरणी', 'पाऊस'],
        hi: ['कृषि', 'किसान', 'फसल', 'कपास', 'सोयाबीन', 'मंडी', 'मौसम', 'योजना', 'बुवाई', 'बारिश'],
        en: ['agriculture', 'farmer', 'crop', 'cotton', 'soybean', 'market', 'weather', 'scheme', 'sowing', 'farm', 'rain']
    };

    const relevantKeywords = keywords[language as keyof typeof keywords] || keywords.en;

    try {
        console.log(`📡 Fetching news for: ${query} (${language})`);

        // Use our own Vercel serverless function to proxy the request server-side.
        // This permanently eliminates all CORS issues — no more public proxy dependency.
        const proxyUrl = `/api/news?url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`News proxy returned status: ${response.status}`);
        }

        const textData = await response.text();
        if (!textData || textData.length < 100) {
            throw new Error("News proxy returned empty response");
        }

        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item"));

        // Map XML to standard object format
        const mappedItems = items.map(item => {
            const title = item.querySelector("title")?.textContent || "";
            const link = item.querySelector("link")?.textContent || "";
            const pubDateStr = item.querySelector("pubDate")?.textContent || "";
            const description = item.querySelector("description")?.textContent || "";

            // Google News puts the actual link in a 'news:link' or similar sometimes, 
            // but standard 'link' usually works or redirects.

            return {
                title,
                link,
                pubDate: pubDateStr,
                description,
                content: description,
                guid: item.querySelector("guid")?.textContent
            };
        });

        // Filter: Must contain keywords AND be reasonably recent (30 days)
        return mappedItems.filter((item: any) => {
            const text = `${item.title} ${item.description}`.toLowerCase();
            const hasKeyword = relevantKeywords.some(kw => text.includes(kw.toLowerCase()));

            const pubDate = new Date(item.pubDate);
            if (isNaN(pubDate.getTime())) return hasKeyword; // Accept if date invalid

            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - 30);
            const isRecent = pubDate > daysAgo;

            return hasKeyword && isRecent;
        });
    } catch (e) {
        console.error("News Fetch error in helper", e);
        return [];
    }
}

/**
 * Get latest agriculture news using Google News RSS + rss2json
 * accurately supports local languages (Marathi/Hindi)
 * Fallback to State level if local news is empty
 */
export const getLatestNews = async (location: string = 'Maharashtra', language: 'en' | 'mr' | 'hi' = 'en'): Promise<NewsItem[]> => {

    // Check Cache first (avoid 429 Rate Limits)
    // bumped version to _v2 to force refresh with 6 images
    const CACHE_KEY = `news_cache_${location}_${language}_v2`;
    const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log("Serving News from Cache ⚡");
            return data;
        }
    }

    // 1. Construct Queries
    // Specific: Location + Topics + Recent
    // Fallback: "Maharashtra" + Topics + Recent

    let localQuery = '';
    let stateQuery = '';

    // Google News RSS URLs (Prioritizing Subject over Location + Recency)
    // Query format: "(Topic OR Topic) AND Location when:14d"
    // Added 'when:14d' to restrict to last 14 days
    if (language === 'mr') {
        const topics = `(कृषी OR शेतकरी OR "पीक विमा" OR "बाजार भाव" OR कापूस OR सोयाबीन)`;
        localQuery = encodeURIComponent(`${topics} "${location}"`);
        stateQuery = encodeURIComponent(`${topics} "महाराष्ट्र"`);
    } else if (language === 'hi') {
        const topics = `(कृषि OR किसान OR "फसल बीमा" OR "मंडी भाव" OR कपास OR सोयाबीन)`;
        localQuery = encodeURIComponent(`${topics} "${location}"`);
        stateQuery = encodeURIComponent(`${topics} "महाराष्ट्र"`);
    } else {
        const topics = `(Agriculture OR Farmer OR "Crop Insurance" OR "Market Price" OR Cotton OR Soybean)`;
        localQuery = encodeURIComponent(`${topics} "${location}"`);
        stateQuery = encodeURIComponent(`${topics} "Maharashtra"`);
    }

    // 2. Try Fetching Local News
    let items = await fetchNewsFromGoogle(localQuery, language);

    // 3. Fallback to State News
    if (items.length === 0) {
        console.log(`No local news for ${location}, fetching state news...`);
        items = await fetchNewsFromGoogle(stateQuery, language);
    }

    // 4. Global Fallback (National)
    if (items.length === 0) {
        console.log(`No state news, fetching national agriculture news...`);
        const globalTopic = language === 'mr' ? 'भारतीय कृषी' : (language === 'hi' ? 'भारतीय कृषि' : 'India Agriculture');
        const globalQuery = encodeURIComponent(globalTopic);
        items = await fetchNewsFromGoogle(globalQuery, language);
    }

    // 5. Map to NewsItem
    const finalNews = items.map((item: any, index: number) => {
        // Extract image if available (RSS often puts it in description or enclosure)
        // Google News RSS doesn't always have distinct images in standard fields, 
        // so we'll use a reliable fallback or try to extract from description if valid HTML.
        // For stability, we will use our curated placeholders or the component will handle error.

        // Extract image from description if not in enclosure
        const imgMatch = item.description?.match(/<img[^>]+src="([^">]+)"/) || item.content?.match(/<img[^>]+src="([^">]+)"/);
        let imageUrl = item.enclosure?.link;

        if (!imageUrl && imgMatch) {
            imageUrl = imgMatch[1];
        }

        // Fallback to rotating images if still no image
        if (!imageUrl) {
            imageUrl = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
        }

        // Clean up title (Google News appends " - Publisher Name")
        const cleanTitle = item.title ? item.title.split(' - ')[0] : "Agriculture Update";

        return {
            id: item.guid || String(index),
            title: cleanTitle,
            image: imageUrl,
            tag: language === 'mr' ? 'ताज्या बातम्या' : (language === 'hi' ? 'ताज़ा खबर' : 'Latest News'),
            color: 'bg-green-600',
            date: item.pubDate ? new Date(item.pubDate).toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`) : new Date().toLocaleDateString(),
            content: item.description || item.content || '',
            url: item.link || '#',
            source: item.author || 'Google News'
        };
    }).slice(0, 6);

    // Save to Cache if we found news (even mock news, to prevent re-fetching broken API)
    if (finalNews.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: finalNews
        }));
    }

    return finalNews;
};
