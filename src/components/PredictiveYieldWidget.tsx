import { useState, useEffect } from 'react';
import { Target, TrendingUp, Sparkles, Sprout, CloudRain, SunMedium, Cloud, AlertCircle } from 'lucide-react';
import { useT } from '../i18n/useT';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { predictCropYield, type YieldPrediction } from '../services/GeminiService';
import { useNavigate } from 'react-router-dom';

export default function PredictiveYieldWidget() {
    const { t } = useT();
    const { user, location: { weather, locationName } } = useStore();
    const navigate = useNavigate();

    const [prediction, setPrediction] = useState<YieldPrediction | null>(null);
    const [loading, setLoading] = useState(false);
    const [quotaExhausted, setQuotaExhausted] = useState(false);

    const temp = weather?.temp ?? 0;
    const humidity = weather?.humidity ?? 0;
    const condition = weather?.condition ?? '';
    const isOptimalTemp = temp >= 20 && temp <= 32;

    const farmSize = user?.farmSize;
    const primaryCrop = user?.crops?.[0];

    useEffect(() => {
        const fetchPrediction = async () => {
            if (!farmSize || !primaryCrop || !locationName) return;

            setLoading(true);
            try {
                const result = await predictCropYield(primaryCrop, farmSize, locationName, weather);
                setPrediction(result);
            } catch (err: any) {
                if (err?.message === 'QUOTA_EXHAUSTED') {
                    setQuotaExhausted(true);
                } else {
                    console.error("Widget: Failed to fetch yield prediction", err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPrediction();
        // Use stable primitive values instead of weather object ref to prevent re-firing on every tick
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [farmSize, primaryCrop, locationName, temp, humidity, condition]);

    // Fallback UI if daily quota exhausted
    if (quotaExhausted) {
        return (
            <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-50/80 via-white/80 to-pink-50/80 border-[2px] border-white shadow-sm p-7">
                <div className="flex flex-col items-center justify-center text-center py-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-sm mb-3 border border-indigo-100">
                        <Target className="text-indigo-400" size={26} />
                    </div>
                    <h3 className="text-slate-800 font-black text-lg mb-1">AI Quota Reached</h3>
                    <p className="text-xs font-bold text-slate-500 mb-1 max-w-[220px]">Daily AI predictions limit reached. Resets at midnight.</p>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Upgrade API Plan for unlimited access</p>
                </div>
            </section>
        );
    }

    // Fallback UI if Farm Details are missing
    if (!farmSize || !primaryCrop) {
        return (
            <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-50 border-[2px] border-white shadow-sm p-7">
                <div className="flex flex-col items-center justify-center text-center py-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                        <AlertCircle className="text-indigo-400" />
                    </div>
                    <h3 className="text-slate-800 font-black text-lg mb-1">Update Farm Details</h3>
                    <p className="text-xs font-bold text-slate-500 mb-4 max-w-[200px]">Add your crop type and farm size in settings to unlock AI Yield Predictions.</p>
                    <button onClick={() => navigate('/settings')} className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                        Go to Settings
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-50/80 via-white/80 to-pink-50/80 border-[2px] border-white shadow-[0_20px_50px_rgba(99,102,241,0.08)] backdrop-blur-3xl animate-slide-in-left group">
            {/* 3D Lighting Accents */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-fuchsia-400/10 rounded-full blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-indigo-400/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-400/20 transition-colors duration-700" />

            <div className="relative px-7 pt-7 pb-5 z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles size={12} className="text-fuchsia-500 animate-pulse" />
                            <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-[0.2em]">{prediction ? `${prediction.accuracy}% ${t('yield.accuracy').replace(/[\d%]+/, '').trim()}` : t('yield.accuracy')}</span>
                        </div>
                        <h3 className="text-slate-800 font-black text-xl tracking-tight leading-none drop-shadow-sm">{t('yield.title')}</h3>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{t('yield.subtitle')}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md border border-white/80 p-3 rounded-[1.25rem] shadow-sm text-fuchsia-500">
                        <Target size={22} />
                    </div>
                </div>

                {/* Primary Stats Panel */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-inner mb-5 relative overflow-hidden group/panel">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/panel:translate-x-full transition-transform duration-1000" />
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        {/* Yield */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5"><Sprout size={12} className="text-emerald-500" />{t('yield.estYield')}</p>
                            <div className="flex items-end gap-1">
                                {loading ? (
                                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-md" />
                                ) : (
                                    <>
                                        <span className="text-3xl font-black text-slate-800 leading-none">{prediction?.estYield?.toFixed(1) || '--'}</span>
                                        <span className="text-sm font-bold text-slate-500 mb-0.5">Qtl</span>
                                    </>
                                )}
                            </div>
                            {!loading && prediction && (
                                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                                    <TrendingUp size={10} /> +{((prediction.estYield - prediction.originalYield) / prediction.originalYield * 100).toFixed(0)}% vs avg
                                </p>
                            )}
                        </div>
                        {/* Revenue */}
                        <div className="pl-4 border-l border-slate-200/60 flex flex-col justify-center">
                            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5"><TrendingUp size={12} className="text-indigo-500" />{t('yield.estRevenue')}</p>
                            <div className="flex items-end gap-0.5">
                                {loading ? (
                                    <div className="h-8 w-20 bg-slate-200 animate-pulse rounded-md" />
                                ) : (
                                    <>
                                        <span className="text-lg font-black text-slate-800 mb-0.5">₹</span>
                                        <span className="text-2xl font-black text-slate-800 leading-none">
                                            {prediction?.estRevenue ? Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(prediction.estRevenue) : '--'}
                                        </span>
                                    </>
                                )}
                            </div>
                            {!loading && prediction?.primaryFactor && (
                                <p className="text-[10px] font-bold text-indigo-500 mt-1 truncate max-w-[120px]">{prediction.primaryFactor}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Influencing Factors Footer */}
                <div className="mt-auto pt-2 border-t border-slate-200/50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">{t('yield.basedOn')}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shadow-sm", isOptimalTemp ? "bg-amber-100 text-amber-600" : "bg-sky-100 text-sky-600")}>
                                {isOptimalTemp ? <SunMedium size={12} /> : temp < 20 ? <CloudRain size={12} /> : <Cloud size={12} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{t('yield.weather')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                <Sprout size={12} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{t('yield.soil')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                                <TrendingUp size={12} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{t('yield.market')}</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
