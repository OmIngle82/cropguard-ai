// Weather data structure
export interface WeatherData {
    temp: number;           // Temperature in Celsius
    humidity: number;       // Humidity percentage
    windSpeed: number;      // Wind speed in km/h
    precipProb: number;     // Precipitation probability (0-100)
    description: string;    // Weather description
    icon: string;          // Weather icon code
    id: number;            // Weather condition id
    feelsLike: number;     // Feels like temperature
    pressure: number;      // Atmospheric pressure
    visibility: number;    // Visibility in km
    lastUpdated: Date;     // Last update timestamp
    soilMoisture: number;  // Estimated soil moisture (0-100)
}

// Cache interface
interface WeatherCache {
    data: WeatherData;
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// In-memory cache
let weatherCache: WeatherCache | null = null;
// In-flight guard: prevents parallel fetches from bypassing cache
let weatherFetchInFlight: Promise<WeatherData> | null = null;

// Helper: Estimate Soil Moisture based on weather data
function estimateSoilMoisture(data: any): number {
    // Heuristic:
    // 1. High Humidity (+30%)
    // 2. Recent Rain (Clouds/Precip) (+40%)
    // 3. High Temp (-20%)

    let score = 40; // Base moisture

    // Humidity impact
    score += (data.main.humidity * 0.4);

    // Cloud/Rain impact (Proxy for recent precip)
    if (data.clouds?.all > 50) score += 20;
    if (data.weather[0]?.main === 'Rain') score += 30;
    if (data.weather[0]?.main === 'Drizzle') score += 15;

    // Temperature evaporation impact
    if (data.main.temp > 30) score -= 15;
    if (data.main.temp > 35) score -= 20;

    return Math.min(Math.max(Math.round(score), 10), 95); // Clamp 10-95
}

/**
 * Fetch weather data from OpenWeatherMap API
 */
export async function fetchWeatherByCoordinates(lat: number, lng: number): Promise<WeatherData> {
    // Check cache first
    if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
        console.log('🌤️ Using cached weather data');
        return weatherCache.data;
    }

    // If a fetch is already running, return the same promise (prevents parallel duplicate fetches)
    if (weatherFetchInFlight) {
        console.log('🌤️ Reusing in-flight weather fetch');
        return weatherFetchInFlight;
    }

    // If no API key, return error (we want Real Data only)
    if (!API_KEY) {
        console.warn('⚠️ No OpenWeatherMap API key found');
        throw new Error('No API Key');
    }

    weatherFetchInFlight = (async () => {
        try {
            const url = `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();

            const weatherData: WeatherData = {
                temp: Math.round(data.main.temp),
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
                precipProb: data.clouds?.all || 0, // Use cloud coverage as proxy
                description: data.weather[0]?.description || 'Clear',
                icon: data.weather[0]?.icon || '01d',
                id: data.weather[0]?.id || 800,
                feelsLike: Math.round(data.main.feels_like),
                pressure: data.main.pressure,
                visibility: Math.round(data.visibility / 1000), // Convert m to km
                lastUpdated: new Date(),
                soilMoisture: estimateSoilMoisture(data)
            };

            // Update cache
            weatherCache = {
                data: weatherData,
                timestamp: Date.now(),
            };

            console.log('🌤️ Fetched fresh weather data:', weatherData);
            return weatherData;
        } catch (error) {
            console.error('Failed to fetch weather:', error);
            throw error;
        } finally {
            weatherFetchInFlight = null;
        }
    })();

    return weatherFetchInFlight;
}

/**
 * Fetch 5-day weather forecast
 */
export async function fetchWeatherForecast(lat: number, lng: number): Promise<WeatherData[]> {
    if (!API_KEY) {
        return [];
    }

    try {
        const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&cnt=40`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Forecast API error: ${response.status}`);
        }

        const data = await response.json();

        // Get one forecast per day (at noon)
        const dailyForecasts = data.list
            .filter((_: any, index: number) => index % 8 === 0) // Every 8th item (24h / 3h intervals)
            .slice(0, 5)
            .map((item: any) => ({
                temp: Math.round(item.main.temp),
                humidity: item.main.humidity,
                windSpeed: Math.round(item.wind.speed * 3.6),
                precipProb: item.pop * 100, // Probability of precipitation
                description: item.weather[0]?.description || 'Clear',
                icon: item.weather[0]?.icon || '01d',
                id: item.weather[0]?.id || 800,
                feelsLike: Math.round(item.main.feels_like),
                pressure: item.main.pressure,
                visibility: 10,
                lastUpdated: new Date(item.dt * 1000),
                soilMoisture: estimateSoilMoisture(item) // Estimate for forecast too
            }));

        return dailyForecasts;
    } catch (error) {
        console.error('Failed to fetch forecast:', error);
        return [];
    }
}

/**
 * Clear weather cache (useful for testing)
 */
export function clearWeatherCache() {
    weatherCache = null;
}
