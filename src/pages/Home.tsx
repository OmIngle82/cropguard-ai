import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CloudSun, Droplets, ArrowRight, AlertCircle, Sprout, X, Crown, MapPin, RefreshCw, Bell, Sparkles, Flame } from 'lucide-react';
import { getHistory } from '../services/db';
import { getLatestNews, type NewsItem } from '../services/NewsService';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useNotificationStore } from '../services/NotificationService';
import { runNotificationEngine } from '../services/NotificationEngine';
import MarketWidget from '../components/MarketWidget';
import { useT } from '../i18n/useT';
import EligibleSchemes from '../components/EligibleSchemes';
import PredictiveYieldWidget from '../components/PredictiveYieldWidget';
import FarmScoreWidget from '../components/FarmScoreWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDailyStreak } from '../services/GamificationService';

interface CropStat {
    name: 'Cotton' | 'Soybean';
    status: string; // 'Healthy' or Disease Name
    health: number; // 0-100
    lastChecked: string;
    severity: 'Low' | 'Medium' | 'High' | 'None';
}

export default function Home() {
    const { location: { locationName, loadingLocation, weather, forecast }, user: profile, setUiState } = useStore();
    const { getUnreadCount } = useNotificationStore();
    const navigate = useNavigate();

    // Safety check for profile
    const displayName = profile ? `${profile.firstName} ${profile.surname}`.trim() : 'Guest';

    // State
    const [stats, setStats] = useState<CropStat[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    // Calculate Theme details dynamically
    const getThemeDetails = () => {
        // Defaults if no weather
        if (!weather) return {
            gradient: "from-[#7dd3fc] via-[#bae6fd] to-[#e0f2fe]", // Sky blue
            primaryText: "text-gray-900",
            secondaryText: "text-gray-600",
            statText: "text-gray-900",
            statLabel: "text-gray-600",
            showSun: true, showMoon: false, showClouds: true, showRain: false, cloudOpacity: "opacity-90"
        };

        const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 18;
        const code = weather.code || 800; // Assume clear if missing
        const isRainy = code < 700;
        const isCloudy = code >= 801 && code <= 804;

        if (isDaytime) {
            if (isRainy) {
                return {
                    gradient: "from-gray-600 via-gray-400 to-gray-300",
                    primaryText: "text-gray-900", secondaryText: "text-gray-700", statText: "text-gray-900", statLabel: "text-gray-700",
                    showSun: false, showMoon: false, showClouds: true, showRain: true, cloudOpacity: "opacity-60 grayscale"
                };
            } else if (isCloudy) {
                return {
                    gradient: "from-blue-200 via-gray-200 to-gray-100",
                    primaryText: "text-gray-900", secondaryText: "text-gray-600", statText: "text-gray-900", statLabel: "text-gray-600",
                    showSun: false, showMoon: false, showClouds: true, showRain: false, cloudOpacity: "opacity-80"
                };
            }
            // Clear Day (Default)
            return {
                gradient: "from-[#7dd3fc] via-[#bae6fd] to-[#e0f2fe]",
                primaryText: "text-gray-900", secondaryText: "text-gray-600", statText: "text-gray-900", statLabel: "text-gray-600",
                showSun: true, showMoon: false, showClouds: true, showRain: false, cloudOpacity: "opacity-90"
            };
        } else { // Nighttime
            if (isRainy) {
                return {
                    gradient: "from-slate-900 via-slate-800 to-slate-700",
                    primaryText: "text-white", secondaryText: "text-gray-300", statText: "text-gray-900", statLabel: "text-gray-600",
                    showSun: false, showMoon: false, showClouds: true, showRain: true, cloudOpacity: "opacity-30 brightness-50"
                };
            } else if (isCloudy) {
                return {
                    gradient: "from-slate-800 via-gray-700 to-gray-600",
                    primaryText: "text-white", secondaryText: "text-gray-300", statText: "text-gray-900", statLabel: "text-gray-600",
                    showSun: false, showMoon: true, showClouds: true, showRain: false, cloudOpacity: "opacity-40 brightness-75"
                };
            }
            // Clear Night
            return {
                gradient: "from-indigo-900 via-blue-900 to-slate-800",
                primaryText: "text-white", secondaryText: "text-blue-200", statText: "text-gray-900", statLabel: "text-gray-600",
                showSun: false, showMoon: true, showClouds: false, showRain: false, cloudOpacity: "opacity-0"
            };
        }
    };

    const currentTheme = getThemeDetails();

    // Refactored Load Functions
    const loadNews = useCallback(async () => {
        if (!locationName || locationName === 'Locating...') return;
        setLoadingNews(true);
        try {
            const cleanLoc = locationName.split(',')[0].replace('District', '').trim();
            const lang = (profile?.language as 'en' | 'mr' | 'hi') || 'mr';
            const data = await getLatestNews(cleanLoc, lang);
            setNews(data);
        } catch (e) {
            console.error("Home: News load failed", e);
        } finally {
            setLoadingNews(false);
        }
    }, [locationName, profile?.language]);

    useEffect(() => {
        // Load Crop Stats
        const loadStats = async () => {
            if (!profile?.id) return;
            const logs = await getHistory(profile.id);

            const processCrop = (cropName: 'Cotton' | 'Soybean'): CropStat | null => {
                const cropLogs = logs.filter(l => l.crop === cropName);
                if (cropLogs.length === 0) return null;

                const latest = cropLogs[0];
                let health = 95;
                if (latest.severity === 'High') health = 35;
                if (latest.severity === 'Medium') health = 65;
                if (latest.severity === 'Low' && latest.diseaseName !== 'Healthy') health = 85;

                const diffTime = Math.abs(new Date().getTime() - latest.date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let lastChecked = 'Today';
                if (diffDays === 1) lastChecked = 'Yesterday';
                else if (diffDays > 1) lastChecked = `${diffDays} days ago`;

                return {
                    name: cropName,
                    status: latest.diseaseName,
                    health,
                    lastChecked,
                    severity: latest.severity
                };
            };

            const cottonStat = processCrop('Cotton');
            const soybeanStat = processCrop('Soybean');

            setStats([cottonStat, soybeanStat].filter(Boolean) as CropStat[]);
            setLoadingStats(false);
        };

        if (profile?.id) {
            loadStats();
            if (profile.id !== 'guest') {
                updateDailyStreak(profile.id).catch(console.error);
            }
        }
        if (locationName) loadNews();

    }, [profile?.id, locationName, loadNews]);

    // Smart Notification Engine: Evaluate rules when data is ready
    useEffect(() => {
        if (profile && weather && (forecast?.length || 0) > 0) {
            runNotificationEngine(profile, weather, forecast);
        }
    }, [profile, weather, forecast]);

    const { t } = useT();

    const homeContainer = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
    };
    const homeItem = {
        hidden: { opacity: 0, y: 18, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: 'easeOut' } } as any,
    };

    return (
        <motion.div
            variants={homeContainer}
            initial="hidden"
            animate="visible"
            className="px-3 pt-3 md:px-10 md:pt-6 space-y-5 pb-32 md:pb-10 max-w-7xl mx-auto"
        >
            {/* ── Home Sticky Header ── */}
            <header className="sticky md:static top-2 md:top-0 md:mt-8 z-40 -mx-3 md:mx-0 mb-5 transition-all duration-300 group">
                <div className="relative md:max-w-[98%] mx-auto hover:-translate-y-0.5 transition-transform duration-300">
                    {/* 3D Glassmorphic Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/70 backdrop-blur-2xl rounded-[1.5rem] border-[2px] border-white shadow-[0_15px_35px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300" />

                    {/* 3D Lighting Accents */}
                    <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-[30px]" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-400/20 rounded-full blur-[30px]" />
                    </div>

                    <div className="relative px-5 py-4 flex justify-between items-center z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{t('home.welcomeBack')}</span>
                            </div>
                            <h1 className="text-[19px] font-black text-slate-800 tracking-tight leading-none drop-shadow-sm">{t('home.greeting')}, {displayName}{t('home.greetingSuffix')} 👋</h1>
                            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                                {loadingLocation ? (
                                    <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin text-emerald-500" /> {t('home.locating')}</span>
                                ) : (
                                    <><MapPin size={10} className="text-emerald-500" /> {locationName.split(',')[0]} &bull; {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setUiState({ isNotifOpen: true })} className="md:hidden relative p-2.5 bg-white/50 hover:bg-white/80 rounded-xl transition-colors border border-white shadow-sm text-slate-500 active:scale-95">
                                <Bell size={18} />
                                {getUnreadCount() > 0 && <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
                            </button>
                            <button onClick={() => navigate('/settings')} className="active:scale-95 transition-transform group/profile">
                                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-emerald-400 to-teal-500 p-[2px] shadow-lg shadow-emerald-500/30 group-hover/profile:shadow-emerald-500/40 transition-shadow">
                                    <div className="w-full h-full rounded-[12px] bg-white overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="Profile" className="w-full h-full group-hover/profile:scale-110 transition-transform duration-500" />
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Premium Banner */}
            <motion.div
                variants={homeItem}
                onClick={() => navigate('/premium')} className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 flex items-center justify-between cursor-pointer group mb-0">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-yellow-900/20 to-transparent" />
                <div className="flex items-center gap-3 relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/40 group-hover:scale-110 transition-transform duration-300">
                        <Crown size={18} className="text-gray-900" fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-sm tracking-tight">{t('home.upgradeBanner')}</h3>
                        <p className="text-gray-400 text-[11px] font-medium">{t('home.upgradeSub')}</p>
                    </div>
                </div>
                <div className="relative bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                    <ArrowRight className="text-white" size={15} />
                </div>
            </motion.div>

            <motion.div variants={homeItem} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Weather + Stories) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* HACKATHON FEATURE: Predictive Alert */}
                    <PredictiveAlert weather={weather} forecast={forecast} />

                    {/* ── Weather / Smart Advisory Widget (Dynamic Theme) ── */}
                    <motion.section
                        variants={homeItem}
                        className="relative overflow-hidden rounded-[2.5rem] border-[2px] border-white/40 shadow-[0_25px_50px_rgba(0,0,0,0.12)] group transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.18)] hover:-translate-y-1">
                        {/* Dynamic Background */}
                        <div className={`absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b ${currentTheme.gradient}`}>
                            {/* Sun (Daytime clear/cloudy) */}
                            {currentTheme.showSun && (
                                <div className="absolute top-[-5%] left-[10%] w-32 h-32 bg-yellow-300 rounded-full blur-[2px] opacity-90 animate-pulse-slow">
                                    <div className="absolute inset-[-40%] rounded-full bg-yellow-200/40 blur-[20px]" />
                                </div>
                            )}

                            {/* Moon & Stars (Night) */}
                            {currentTheme.showMoon && (
                                <>
                                    <div className="absolute top-[10%] left-[15%] w-16 h-16 bg-blue-100 rounded-full blur-[1px] opacity-80" />
                                    <div className="absolute top-[8%] left-[18%] w-16 h-16 bg-slate-900 rounded-full blur-[1px] opacity-90" /> {/* Crescent cutout */}
                                    <div className="absolute top-[20%] right-[20%] w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" />
                                    <div className="absolute top-[40%] right-[40%] w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1s' }} />
                                    <div className="absolute top-[30%] left-[40%] w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </>
                            )}

                            {/* Clouds (Back layer) */}
                            {currentTheme.showClouds && (
                                <svg className={`absolute bottom-[5%] right-[-10%] w-[60%] h-auto ${currentTheme.cloudOpacity}`} viewBox="0 0 200 100">
                                    <path fill="#ffffff" d="M30 60a20 20 0 0110-38 30 30 0 0150 0 20 20 0 0110 38H30z" />
                                    <path fill="#ffffff" d="M120 70a15 15 0 0110-28 20 20 0 0130 0 15 15 0 0110 28h-50z" />
                                </svg>
                            )}

                            {/* Clouds (Front layer) */}
                            {currentTheme.showClouds && (
                                <svg className={`absolute bottom-[-30%] left-[-10%] w-[120%] h-auto ${currentTheme.cloudOpacity}`} viewBox="0 0 400 150">
                                    <circle cx="50" cy="120" r="40" fill="#ffffff" />
                                    <circle cx="120" cy="100" r="50" fill="#ffffff" />
                                    <circle cx="200" cy="90" r="60" fill="#ffffff" />
                                    <circle cx="280" cy="110" r="45" fill="#ffffff" />
                                    <circle cx="350" cy="130" r="35" fill="#ffffff" />
                                    <rect x="0" y="120" width="400" height="50" fill="#ffffff" />
                                </svg>
                            )}

                            {/* Lightning accent */}
                            {currentTheme.showRain && (
                                <svg className="absolute top-[40%] right-[30%] w-8 h-8 text-yellow-500 opacity-80 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            )}

                            {/* Raindrops */}
                            {currentTheme.showRain && (
                                <div className="absolute inset-0 opacity-40">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="absolute w-0.5 h-3 bg-blue-300 rounded-full animate-bounce-slow" style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 2}s`
                                        }} />
                                    ))}
                                </div>
                            )}
                        </div>


                        <div className="relative z-10 p-5 md:p-8">
                            {/* Live Advisory Badge */}
                            <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md border border-white/50 px-3 py-1 rounded-full mb-3 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${currentTheme.primaryText}`}>{t('home.liveAdvisory')}</span>
                            </div>

                            {/* Advisory + Temperature in a stable row on mobile */}
                            <div className="flex items-start justify-between gap-3">
                                {/* Advisory text — FIXED height so card never resizes as text rotates */}
                                <div className={`flex-1 h-[125px] overflow-hidden ${currentTheme.primaryText}`}>
                                    <SmartAdviceCarousel weather={weather} forecast={forecast} />
                                </div>

                                {/* Temperature display — always visible, right side */}
                                <div className="flex-shrink-0 text-right">
                                    <div className={`flex items-start justify-end ${currentTheme.primaryText}`}>
                                        <span className="text-[56px] md:text-[72px] font-black tracking-tighter leading-none tabular-nums drop-shadow-sm">{weather ? weather.temp : '--'}</span>
                                        <span className="text-xl md:text-3xl font-black mt-1.5 md:mt-3 opacity-80">°C</span>
                                    </div>
                                    <span className={`text-sm font-bold ${currentTheme.secondaryText} capitalize block`}>{weather?.condition || t('home.weatherUnavailable')}</span>
                                    {weather && (
                                        <span className={`inline-flex items-center gap-1 mt-1 bg-white/50 border border-white/60 rounded-full px-2 py-0.5 text-[10px] font-bold ${currentTheme.primaryText} shadow-sm`}>
                                            <Droplets size={9} /> {t('home.feelsLike')} {weather.humidity}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-2 pt-4 mt-4 relative z-20">
                                <WeatherStat label={t('home.wind')} value={weather ? `${weather.wind} km/h` : '--'} textClass={currentTheme.statText} labelClass={currentTheme.statLabel} />
                                <WeatherStat label={t('home.humidity')} value={weather ? `${weather.humidity}%` : '--'} textClass={currentTheme.statText} labelClass={currentTheme.statLabel} />
                                <WeatherStat label={t('home.soilMoisture')} value={weather?.soilMoisture ? `${weather.soilMoisture}%` : '--'} textClass={currentTheme.statText} labelClass={currentTheme.statLabel} />
                                <WeatherStat
                                    label={t('home.rain')}
                                    value={`${Math.max(weather?.precipProb || 0, ...(forecast?.slice(0, 2).map(d => d.precipProb || 0) || [0]))}%`}
                                    textClass={currentTheme.statText} labelClass={currentTheme.statLabel}
                                />
                            </div>

                        </div>
                    </motion.section>

                    {/* Recent Stories / Updates */}
                    <section>
                        <div className="flex justify-between items-center mb-6 pl-2 pr-1">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
                                    <Sparkles size={20} className="drop-shadow-sm" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl tracking-tight leading-none drop-shadow-sm">{t('home.latestUpdates')}</h3>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Curated for you</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadNews()}
                                    disabled={loadingNews}
                                    className="p-2.5 bg-white backdrop-blur-md hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl transition-all text-slate-500 hover:text-indigo-600 disabled:opacity-50 active:scale-95"
                                >
                                    <RefreshCw size={16} className={loadingNews ? 'animate-spin text-indigo-500' : ''} />
                                </button>
                                <button className="bg-white/80 backdrop-blur-md rounded-xl border border-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.15)] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 group">
                                    {t('common.viewAll')} <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 p-2 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                            {loadingNews ? (
                                // Loading Skeletons
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white/60 backdrop-blur-md rounded-3xl h-64 animate-pulse shadow-sm border border-white/50">
                                        <div className="h-32 bg-slate-200/50 rounded-t-3xl" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-4 bg-slate-200/50 rounded w-1/3" />
                                            <div className="h-6 bg-slate-200/50 rounded w-full" />
                                            <div className="h-6 bg-slate-200/50 rounded w-2/3" />
                                        </div>
                                    </div>
                                ))
                            ) : news.length > 0 ? (
                                news.map((item) => (
                                    <StoryCard
                                        key={item.id}
                                        title={item.title}
                                        image={item.image}
                                        tag={item.tag}
                                        color={item.color}
                                        onClick={() => setSelectedNews(item)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <AlertCircle className="text-slate-400" size={32} />
                                    </div>
                                    <p className="text-slate-700 font-black text-lg">No recent updates found</p>
                                    <p className="text-sm font-medium text-slate-400 mt-1">Please check your internet connection and try again.</p>
                                    <button
                                        onClick={() => loadNews()}
                                        className="mt-6 font-bold text-indigo-500 bg-white border border-indigo-100 px-6 py-2.5 rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Core Tools Section (Under News Feed) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 animate-slide-in-up" style={{ animationDelay: '0.25s' }}>
                        <FarmScoreWidget />
                        <PredictiveYieldWidget />
                    </div>
                </div>

                {/* Right Column (Insights + Market Widget) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* ── Farm Insights Widget (3D Glassmorphic Redesign) ── */}
                    <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#fecdd3]/20 border-[2px] border-white shadow-[0_20px_50px_rgba(14,165,233,0.15)] animate-slide-in-left" style={{ animationDelay: '0.15s' }}>
                        {/* 3D Lighting Accents */}
                        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/60 rounded-full blur-[40px] pointer-events-none" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-sky-200/40 rounded-full blur-[30px] pointer-events-none" />

                        {/* Header */}
                        <div className="relative px-7 pt-7 pb-4 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-slate-800 font-black text-xl tracking-tight drop-shadow-sm">{t('home.farmInsights')}</h3>
                                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-[0.15em] mt-1">{t('home.yourCrops')}</p>
                            </div>
                            <button
                                onClick={() => navigate('/history')}
                                className="bg-white/60 hover:bg-white backdrop-blur-md border border-white/80 p-3 rounded-2xl shadow-sm transition-all active:scale-95 group text-sky-600"
                            >
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Crop List */}
                        <div className="relative z-10 px-7 pb-4 space-y-4">
                            {loadingStats ? (
                                <>
                                    <div className="skeleton h-24 rounded-3xl bg-white/40" />
                                    <div className="skeleton h-24 rounded-3xl bg-white/40" />
                                </>
                            ) : stats.length > 0 ? (
                                stats.map((stat) => (
                                    <CropInsightCard
                                        key={stat.name}
                                        name={stat.name}
                                        status={stat.status}
                                        health={stat.health}
                                        lastChecked={stat.lastChecked}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-inner">
                                    <div className="w-14 h-14 bg-sky-100/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Sprout className="text-sky-400" size={28} />
                                    </div>
                                    <p className="text-slate-700 text-sm font-bold">{t('home.nocrops')}</p>
                                    <p className="text-slate-500 text-xs mt-1">{t('home.nocropsHint')}</p>
                                </div>
                            )}

                            {/* Scan CTA (3D Button) */}
                            <button
                                onClick={() => navigate('/diagnosis')}
                                className="w-full flex items-center justify-between p-4 mt-2 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_25px_rgba(14,165,233,0.1)] hover:bg-white hover:-translate-y-0.5 transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-400/30 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-white font-black text-2xl leading-none">+</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-slate-800 tracking-tight">{t('home.scanNewCrop')}</p>
                                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{t('home.scanSubtitle')}</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                                    <ArrowRight size={14} className="text-slate-400 group-hover:text-sky-500" />
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Am I Eligible Widget */}
                    <div className="mt-6">
                        <EligibleSchemes />
                    </div>

                    {/* Mandi Market Rates Widget */}
                    <div className="mt-6">
                        <MarketWidget />
                    </div>
                </div>
            </motion.div>

            {/* News Detail Modal - Rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {selectedNews && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[100px] md:p-6 md:pb-6 overflow-hidden">
                            {/* Animated Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-transform"
                                onClick={() => setSelectedNews(null)}
                            />

                            {/* Animated Modal Container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 220,
                                    mass: 0.8
                                }}
                                className="bg-white rounded-[2.5rem] max-w-lg w-full max-h-[calc(100vh-140px)] md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-20 border border-white/20 transform-gpu will-change-transform"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute top-5 right-5 bg-white/80 backdrop-blur-md p-2.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-white transition-all z-30 shadow-sm active:scale-90"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
                                    <div className="relative h-56 md:h-72 overflow-hidden shadow-md shrink-0">
                                        <img
                                            src={selectedNews.image}
                                            alt={selectedNews.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-8 w-full">
                                            <span className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black text-white mb-4 shadow-lg ring-1 ring-white/20 ${selectedNews.color}`}>
                                                {selectedNews.tag}
                                            </span>
                                            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                                                {selectedNews.title}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="p-8 md:p-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${selectedNews.color}`}>
                                                <Sparkles size={16} />
                                            </div>
                                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                Updated • {selectedNews.date}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div
                                            className="prose prose-slate prose-sm text-slate-600 font-medium leading-relaxed mb-8 selection:bg-emerald-100 selection:text-emerald-900"
                                            dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                                        />

                                        {/* Actions */}
                                        <div className="flex flex-col gap-3 pt-6">
                                            {selectedNews.url && (
                                                <a
                                                    href={selectedNews.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full text-center bg-slate-900 hover:bg-black text-white font-black py-4 rounded-[1.25rem] shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 group/link"
                                                >
                                                    Read Full Story
                                                    <ArrowRight size={18} className="transition-transform group-hover/link:translate-x-1" />
                                                </a>
                                            )}

                                            <button
                                                onClick={() => setSelectedNews(null)}
                                                className="w-full py-4 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                            >
                                                Dismiss Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )
            }
        </motion.div>
    );
}

function WeatherStat({ label, value, textClass = "text-gray-900", labelClass = "text-gray-600" }: { label: string, value: string, textClass?: string, labelClass?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-3 text-center bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm transition-transform hover:scale-105">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${labelClass}`}>{label}</p>
            <p className={`text-lg font-black ${textClass}`}>{value}</p>
        </div>
    );
}

function PredictiveAlert({ weather, forecast }: { weather: any, forecast: any[] }) {
    const { t } = useT();
    if (!weather) return null;

    let alert = null;

    const rainForecast = forecast?.slice(0, 2).find(day => day.precipProb > 50);

    if (rainForecast) {
        alert = {
            title: t('alert.rainIn.title'),
            message: t('alert.rainIn.msg').replace('{prob}', rainForecast.precipProb.toString()),
            gradient: 'from-blue-600 to-indigo-700',
            accent: 'bg-blue-400/20',
            icon: <CloudSun className="text-white" size={20} />
        };
    }
    else if (weather.humidity > 80 && weather.temp > 24) {
        alert = {
            title: t('alert.fungal.title'),
            message: t('alert.fungal.msg'),
            gradient: 'from-red-600 to-rose-700',
            accent: 'bg-red-400/20',
            icon: <AlertCircle className="text-white" size={20} />
        };
    } else if (weather.code !== undefined && weather.code < 700) {
        alert = {
            title: t('alert.rain.title'),
            message: t('alert.rain.msg'),
            gradient: 'from-blue-500 to-cyan-600',
            accent: 'bg-blue-400/20',
            icon: <CloudSun className="text-white" size={20} />
        };
    } else if (weather.temp > 35) {
        alert = {
            title: t('alert.heat.title'),
            message: t('alert.heat.msg'),
            gradient: 'from-orange-500 to-amber-600',
            accent: 'bg-orange-400/20',
            icon: <Flame className="text-white" size={20} />
        };
    }

    if (!alert) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] p-5 mb-8 border-[2px] border-white/40 shadow-[0_15px_35px_rgba(0,0,0,0.1)] group transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transform-gpu will-change-transform"
        >
            {/* 3D Glassmorphic Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${alert.gradient} opacity-90 backdrop-blur-2xl`} />

            {/* 3D Lighting Accents */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                <div className={`absolute -top-10 -right-10 w-40 h-40 ${alert.accent} rounded-full blur-[30px]`} />
                <div className={`absolute -bottom-10 -left-10 w-40 h-40 ${alert.accent} rounded-full blur-[30px]`} />
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
            </div>

            <div className="relative z-10 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shrink-0 border border-white/30 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-300">
                    {alert.icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-black text-white text-lg tracking-tight drop-shadow-sm leading-none">{alert.title}</h4>
                        <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-[0.15em] shadow-sm shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            AI Forecast
                        </div>
                    </div>
                    <p className="text-white/80 text-sm font-bold leading-relaxed">{alert.message}</p>
                </div>
            </div>
        </motion.div>
    );
}

function StoryCard({ title, image, tag, color, onClick }: { title: string; image: string; tag: string; color: string; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white/80 backdrop-blur-2xl rounded-[1.5rem] p-3 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.12)] border border-white/60 flex flex-col gap-3 hover:-translate-y-1 transition-all duration-300 h-full cursor-pointer overflow-hidden transform-gpu will-change-transform"
        >
            {/* Inner Glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500 ${color.replace('bg-', 'bg-')}`} />

            <div className="relative h-44 overflow-hidden rounded-[1.2rem] shadow-sm">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
                />

                {/* Image Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Premium 3D Tag Pill */}
                <div className={`absolute top-3 left-3 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-white/60 group-hover:scale-105 transition-transform overflow-hidden ${color} bg-opacity-90 backdrop-blur-xl`}>
                    <div className="absolute inset-0 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] pointer-events-none" />
                    <span className="relative z-10 px-3 py-1.5 text-[9px] font-black text-white tracking-[0.2em] uppercase block drop-shadow-md leading-none">
                        {tag}
                    </span>
                </div>
            </div>

            <div className="px-1.5 pb-2 flex-1 flex flex-col justify-between">
                <h4 className="font-bold text-slate-800 text-[14px] leading-snug group-hover:text-indigo-600 transition-colors drop-shadow-sm line-clamp-3">
                    {title}
                </h4>

                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="uppercase tracking-widest">Read Article</span>
                    <ArrowRight size={14} className="text-indigo-500" />
                </div>
            </div>
        </div>
    );
}

function CropInsightCard({ name, status, health, lastChecked }: { name: string, status: string, health: number, lastChecked: string }) {
    const isGood = health >= 80;
    const isWarning = health >= 50 && health < 80;

    const bgColor = isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500';
    const textColor = isGood ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-red-700';

    return (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white shadow-sm transition-all hover:scale-[1.02] hover:bg-white/80 hover:shadow-md cursor-pointer group transform-gpu will-change-transform">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:shadow transition-shadow">
                    <Sprout className={textColor} size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">{name}</h4>
                    <p className={`text-xs font-semibold mt-0.5 ${textColor}`}>{status}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-medium mb-1">{lastChecked}</p>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${bgColor} transition-all duration-1000 ease-smooth`}
                                style={{ width: `${health}%` }}
                            />
                        </div>
                        <span className={`text-[11px] font-black ${textColor} tabular-nums`}>{health}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


function SmartAdviceCarousel({ weather, forecast }: { weather: any, forecast: any[] }) {
    const [index, setIndex] = useState(0);

    const adviceList: { title: string, desc: string }[] = [];

    if (weather) {
        const rainForecast = forecast?.slice(0, 2).find(day => day.precipProb > 50);
        const isRainyNow = (weather.precipProb || 0) > 30 || (weather.code !== undefined && weather.code < 700);
        const isWindy = weather.wind > 15;

        let sprayTitle = "Perfect for Spraying";
        let sprayDesc = "Wind is calm & low rain risk.";

        if (rainForecast || isRainyNow) {
            sprayTitle = "Avoid Spraying";
            sprayDesc = rainForecast
                ? `Rain expected in 24h (${rainForecast.precipProb}% chance).`
                : "Current conditions indicate rain.";
        } else if (isWindy) {
            sprayTitle = "Avoid Spraying";
            sprayDesc = `High Wind (${weather.wind}km/h) enables drift.`;
        }

        adviceList.push({ title: sprayTitle, desc: sprayDesc });

        const needsWater = (weather.soilMoisture || 50) < 30;
        adviceList.push({
            title: needsWater ? "Irrigation Needed" : "Soil Moisture Good",
            desc: needsWater ? `Soil moisture is low (${weather.soilMoisture}%).` : `Soil moisture is adequate (${weather.soilMoisture}%).`
        });

        const danger = weather.humidity > 80 && weather.temp > 25;
        adviceList.push({
            title: danger ? "High Disease Risk" : "Low Disease Risk",
            desc: danger ? "Humid & Warm. Check for fungal growth." : "Weather conditions limit fungal growth."
        });
    } else {
        adviceList.push({ title: "Weather Unavailable", desc: "Please check location services or API configuration." });
    }

    useEffect(() => {
        // Reset to first slide only when weather availability changes
        setIndex(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!weather]);

    useEffect(() => {
        if (adviceList.length === 0) return;
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % adviceList.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [adviceList.length]);

    const item = adviceList[index] || adviceList[0];

    return (
        <div className="relative h-full overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute inset-0 will-change-transform"
                >
                    <h2 className="text-2xl md:text-3xl font-black opacity-95 leading-tight">
                        {item.title}
                    </h2>
                    <p className="text-white/80 font-medium text-base md:text-lg mt-1 leading-snug">
                        {item.desc}
                    </p>
                    <div className="flex gap-1 mt-3">
                        {adviceList.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-[width,opacity] duration-300 ease-out ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
