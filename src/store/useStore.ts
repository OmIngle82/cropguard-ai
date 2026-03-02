import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchWeatherByCoordinates, fetchWeatherForecast } from '../services/WeatherService';
import { getMarketRates, type MarketRate } from '../services/MarketService';

// --- Types ---

export interface UserProfile {
    // Core Identity
    id: string;

    // Personal Information
    firstName: string;
    middleName?: string;
    surname: string;
    dob?: string; // ISO date string
    gender?: 'Male' | 'Female' | 'Other';
    maritalStatus?: 'Married' | 'Unmarried';

    // Contact Information
    phone: string;
    email?: string;
    aadharNumber?: string;

    // Address
    correspondenceAddress?: string;
    permanentAddress?: string;

    // Education & Professional
    qualification?: string;
    specialization?: string;
    instituteName?: string;
    universityName?: string;

    // Business/Company (Optional)
    hasCompany?: boolean;
    companyName?: string;
    companyCIN?: string;
    companyAddress?: string;
    companyType?: 'Private Company' | 'Registered Partnership Firm' | 'Limited Liability Partnership (LLP)' | 'Other';

    // Farm Details
    farmSize: string;
    crops?: string[]; // e.g., ['Cotton', 'Soybean']

    // App Settings
    language: 'en' | 'mr' | 'hi';
    category?: 'General' | 'OBC' | 'SC' | 'ST';
    isBPL?: boolean;

    // Hackathon Project Details
    projectTheme?: 'Farm Mechanization' | 'Post Harvest' | 'Waste to Wealth' | 'AI & IoT' | 'Other';
    projectConcept?: string; // Max 200 words
    productName?: string;
    innovationDescription?: string;
    hasPatent?: boolean;
    patentNumber?: string;
    primaryCustomer?: string;
    marketOpportunity?: string;
    revenueModel?: string; // Max 100 words

    // Metadata
    profileComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface StoreWeatherData {
    temp: number;
    condition: string;
    wind: number;
    humidity: number;
    code: number;
    soilMoisture?: number;
    uvIndex?: number;
    precipProb?: number;
}

interface LocationState {
    locationName: string;
    loadingLocation: boolean;
    weather: StoreWeatherData | null;
    forecast: StoreWeatherData[]; // 5-day forecast
    coordinates: { lat: number; lng: number } | null;
}

export interface ChatContext {
    isOpen: boolean;
    scanResult?: any;
    diseaseDetails?: any;
    soilReport?: any;
}

interface AppState {
    // User Slice
    user: UserProfile | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
    login: (userData: UserProfile) => void;
    signup: (userData: Omit<UserProfile, 'id'>) => void;
    loginAsGuest: () => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    logout: () => Promise<void>;

    // Location Slice
    location: LocationState;
    setLocation: (data: Partial<LocationState>) => void;

    // Actions
    setLoading: (loading: boolean) => void;
    refreshLocation: () => Promise<void>;

    // Global Chat
    chatContext: ChatContext;
    // AI Modal State
    setChatContext: (context: Partial<ChatContext>) => void;

    // UI Toggle State
    uiState: {
        isNotifOpen: boolean;
    };
    setUiState: (state: Partial<{ isNotifOpen: boolean }>) => void;

    // Market Data
    marketData: MarketRate[];
    marketDataLoading: boolean;
    marketDataLastFetched: string | null;
    refreshMarketData: (force?: boolean) => Promise<void>;
}

// --- Initial State ---

const defaultUser: UserProfile = {
    id: '',
    firstName: 'Kisan',
    surname: '',
    phone: '',
    language: 'en',
    farmSize: '5',
    profileComplete: false,
    projectTheme: 'AI & IoT',
    hasPatent: false,
    category: 'General',
    isBPL: false
};

const defaultLocation: LocationState = {
    locationName: 'Locating...',
    loadingLocation: false,
    weather: null,
    forecast: [],
    coordinates: null
};

const defaultChatContext: ChatContext = {
    isOpen: false,
};

// --- Store Implementation ---

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // User Data
            user: null, // Start with no user
            isAuthenticated: false,
            isGuest: false,

            isLoading: false,

            setLoading: (loading) => set({ isLoading: loading }),

            login: (userData) => {
                set({
                    user: { ...defaultUser, ...userData }, // Merge for safety
                    isAuthenticated: true,
                    isGuest: false
                });
            },

            signup: (userData) => {
                set({
                    user: { ...defaultUser, ...userData, id: Date.now().toString() },
                    isAuthenticated: true,
                    isGuest: false
                });
            },

            loginAsGuest: () => set({
                user: { ...defaultUser, id: 'guest', firstName: 'Guest', surname: 'Farmer' },
                isAuthenticated: true,
                isGuest: true
            }),

            updateUser: (updates) => set((state) => ({ user: { ...state.user!, ...updates } })),

            logout: async () => {
                set({ user: null, isAuthenticated: false, isGuest: false });
                localStorage.removeItem('cropguard-ai-storage');
            },

            // Location Data
            location: defaultLocation,
            setLocation: (data) => set((state) => ({ location: { ...state.location, ...data } })),

            // Async Actions
            refreshLocation: async () => {
                const setLocation = (data: Partial<LocationState>) => set((state) => ({ location: { ...state.location, ...data } }));
                setLocation({ loadingLocation: true });

                try {
                    // 1. Get Coordinates
                    const coords = await new Promise<{ lat: number, long: number }>((resolve) => {
                        if (!navigator.geolocation) {
                            resolve({ lat: 20.70, long: 77.00 }); // Akola fallback
                            return;
                        }
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
                            (err) => {
                                console.warn("Location denied", err);
                                resolve({ lat: 20.70, long: 77.00 });
                            },
                            { enableHighAccuracy: true, timeout: 5000 }
                        );
                    });

                    const { lat, long } = coords;

                    // 2. Fetch Location Name
                    const locationRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`)
                        .then(r => r.json())
                        .catch(() => ({ city: 'Detected Location', principalSubdivisionCode: 'IN' }));
                    const locationName = `${locationRes.city || locationRes.locality || 'Akola'}, ${locationRes.principalSubdivisionCode || 'MH'}`;

                    // 3. Fetch Weather & Forecast in parallel
                    // Using parallel catch to ensure one failure doesn't block the other (optional, but good for robustness)
                    const [currentWeatherServiceData, forecastServiceData] = await Promise.all([
                        fetchWeatherByCoordinates(lat, long),
                        fetchWeatherForecast(lat, long)
                    ]);

                    // 4. Map to existing WeatherData interface
                    const mappedCurrentWeather: StoreWeatherData = {
                        temp: currentWeatherServiceData.temp,
                        condition: currentWeatherServiceData.description,
                        wind: currentWeatherServiceData.windSpeed,
                        humidity: currentWeatherServiceData.humidity,
                        code: currentWeatherServiceData.id,
                        soilMoisture: currentWeatherServiceData.soilMoisture,
                        uvIndex: 5, // Not available in free tier
                        precipProb: currentWeatherServiceData.precipProb
                    };

                    const mappedForecast: StoreWeatherData[] = forecastServiceData.map(day => ({
                        temp: day.temp,
                        condition: day.description,
                        wind: day.windSpeed,
                        humidity: day.humidity,
                        code: day.id,
                        soilMoisture: day.soilMoisture,
                        uvIndex: 5,
                        precipProb: day.precipProb
                    }));

                    setLocation({
                        locationName,
                        loadingLocation: false,
                        weather: mappedCurrentWeather,
                        forecast: mappedForecast,
                        coordinates: { lat, lng: long }
                    });

                } catch (error) {
                    console.error("Weather fetch failed", error);
                    setLocation({ loadingLocation: false });
                }
            },

            // Global Chat
            chatContext: defaultChatContext,
            setChatContext: (context) => set((state) => ({ chatContext: { ...state.chatContext, ...context } })),

            // UI state
            uiState: {
                isNotifOpen: false,
            },
            setUiState: (state) => set((s) => ({ uiState: { ...s.uiState, ...state } })),

            // Market Data
            marketData: [],
            marketDataLoading: false,
            marketDataLastFetched: null,
            refreshMarketData: async (force = false) => {
                // Guard: prevent multiple simultaneous calls
                if (useStore.getState().marketDataLoading && !force) {
                    console.log('⏳ Market fetch already in progress, skipping duplicate.');
                    return;
                }
                set({ marketDataLoading: true });
                try {
                    const locationName = useStore.getState().location.locationName;
                    const response = await getMarketRates(
                        locationName === 'Locating...' ? undefined : locationName,
                        force
                    );
                    set({
                        marketData: response.rates,
                        marketDataLoading: false,
                        marketDataLastFetched: response.generatedAt,
                    });
                } catch (error) {
                    console.error('Market data fetch failed', error);
                    set({ marketDataLoading: false });
                }
            },
        }),
        {
            name: 'cropguard-ai-storage', // name of item in localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }), // Only persist user data
        }
    )
);
