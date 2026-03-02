import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from './useStore';

const globalAny: any = globalThis;

// Mock Geolocation
const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
};

Object.defineProperty(globalAny.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
});

// Mock Fetch
globalAny.fetch = vi.fn();

describe('useStore', () => {
    beforeEach(() => {
        useStore.setState({
            user: null,
            isAuthenticated: false,
            isGuest: false,
            location: {
                locationName: 'Akola, Maharashtra',
                loadingLocation: false,
                weather: null,
                forecast: [],
                coordinates: null,
            },
        });
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should have initial state', () => {
        const state = useStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.location.locationName).toBe('Akola, Maharashtra');
    });

    it('should login user correctly', () => {
        const user = {
            id: '1',
            firstName: 'Test',
            surname: 'User',
            phone: '1234567890',
            language: 'en' as const,
            farmSize: '10'
        };
        useStore.getState().login(user);

        const state = useStore.getState();
        expect(state.user?.id).toBe('1');
        expect(state.user?.firstName).toBe('Test');
        expect(state.isAuthenticated).toBe(true);
        expect(state.isGuest).toBe(false);
    });

    it('should login as guest', () => {
        useStore.getState().loginAsGuest();
        const state = useStore.getState();
        expect(state.isGuest).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        expect(state.user?.firstName).toBe('Guest');
        expect(state.user?.surname).toBe('Farmer');
    });

    it('should logout and clear storage', () => {
        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });

        useStore.getState().loginAsGuest();
        useStore.getState().logout();

        const state = useStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(window.location.href).toBe('/');
    });

    it('should handle refreshLocation with success', async () => {
        // Mock Geolocation Success
        mockGeolocation.getCurrentPosition.mockImplementation((success) =>
            success({ coords: { latitude: 20.0, longitude: 77.0 } })
        );

        // Mock Fetch Responses
        (globalThis.fetch as any)
            .mockResolvedValueOnce({
                json: async () => ({ city: 'Test City', principalSubdivisionCode: 'TS' }),
            }) // Reverse Geocode
            .mockResolvedValueOnce({
                json: async () => ({
                    main: { temp: 30, humidity: 50, feels_like: 32, pressure: 1010 },
                    weather: [{ description: 'Clear', icon: '01d' }],
                    wind: { speed: 10 },
                    clouds: { all: 0 },
                    visibility: 10000
                }),
            }) // Current Weather
            .mockResolvedValueOnce({
                json: async () => ({
                    list: [
                        // Mock 5-day forecast (needs at least 40 items usually, but service slices properly)
                        // We just need to ensure `map` works.
                        {
                            dt: Date.now() / 1000,
                            main: { temp: 30, humidity: 50, feels_like: 32, pressure: 1010 },
                            weather: [{ description: 'Clear', icon: '01d' }],
                            wind: { speed: 10 },
                            pop: 0,
                            visibility: 10000
                        }
                    ]
                }),
            }); // Forecast

        await useStore.getState().refreshLocation();

        const state = useStore.getState();
        expect(state.location.locationName).toBe('Test City, TS');
        expect(state.location.weather?.temp).toBe(30);
        expect(state.location.coordinates).toEqual({ lat: 20.0, lng: 77.0 });
    });

    it('should handle refreshLocation with geolocation error', async () => {
        // Mock Geolocation Error
        mockGeolocation.getCurrentPosition.mockImplementation((_, error) =>
            error({ code: 1, message: 'Denied' })
        );

        // Fetch will still happen for default location (Akola fallback lat/long 20.70, 77.00)
        (globalThis.fetch as any)
            .mockResolvedValueOnce({
                json: async () => ({ city: 'Akola', principalSubdivisionCode: 'MH' }),
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    main: { temp: 35, humidity: 40, feels_like: 37, pressure: 1010 },
                    weather: [{ description: 'Sunny', icon: '01d' }],
                    wind: { speed: 15 },
                    clouds: { all: 0 },
                    visibility: 10000
                }),
            })
            .mockResolvedValueOnce({
                json: async () => ({ list: [] }), // Empty forecast for error case
            });

        await useStore.getState().refreshLocation();

        const state = useStore.getState();
        expect(state.location.coordinates).toEqual({ lat: 20.70, lng: 77.00 });
        expect(state.location.locationName).toContain('Akola');
    });
});
