import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function: /api/news
 * Acts as a server-side proxy for Google News RSS.
 * Because this runs on Vercel's server (not the browser), CORS is not an issue.
 *
 * Usage: GET /api/news?url=<encoded_google_news_rss_url>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow CORS from our own frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    // Security: only allow fetching from news.google.com
    if (!url.startsWith('https://news.google.com/')) {
        return res.status(403).json({ error: 'Only google news URLs are allowed' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CropGuardAI/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
        }

        const text = await response.text();

        // Return the raw XML with correct content type
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache for 5 min
        return res.status(200).send(text);
    } catch (err) {
        console.error('[api/news] Fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch news' });
    }
}
