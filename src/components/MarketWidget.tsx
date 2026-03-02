import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Sparkles, ChevronRight, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import type { MarketRate } from '../services/MarketService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_META = {
    sell_now: { label: 'Sell Now', chip: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    hold: { label: 'Hold', chip: 'bg-gray-400/20   text-gray-300   border-gray-400/10', dot: 'bg-gray-400' },
    wait: { label: 'Wait', chip: 'bg-orange-500/20  text-orange-400  border-orange-500/20', dot: 'bg-orange-500' },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PriceSkeleton() {
    return (
        <>
            {/* Featured skeleton */}
            <div className="bg-white/5 rounded-2xl p-5 animate-pulse mb-3 h-32" />
            {/* Grid skeleton */}
            <div className="grid grid-cols-3 gap-2.5">
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3.5 animate-pulse h-24" />
                ))}
            </div>
        </>
    );
}

// ── Trend Chart ──────────────────────────────────────────────────────────────

function TrendChart({ data, trend }: { data: { date: string; price: number }[]; trend: 'up' | 'down' | 'stable' }) {
    const isUp = trend === 'up';
    const isDown = trend === 'down';
    const color = isUp ? '#10b981' : isDown ? '#f43f5e' : '#94a3b8';

    // Format date from YYYY-MM-DD to "D MMM"
    const formattedData = data.map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }));

    return (
        <div className="w-full mt-4" style={{ height: 128 }}>
            <ResponsiveContainer width="100%" height={128} minWidth={0}>
                <AreaChart data={formattedData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="displayDate"
                        hide
                    />
                    <YAxis
                        hide
                        domain={['dataMin - 100', 'dataMax + 100']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ display: 'none' }}
                        cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ── Featured Card (top crop) ──────────────────────────────────────────────────

function FeaturedCard({ rate, isSelected, onToggle }: { rate: MarketRate; isSelected: boolean; onToggle: () => void }) {
    const signal = SIGNAL_META[rate.sellSignal];
    const isUp = rate.trend === 'up';
    const isDown = rate.trend === 'down';

    return (
        <div
            onClick={onToggle}
            className={clsx(
                "relative rounded-3xl p-5 overflow-hidden border transition-all duration-500 cursor-pointer group",
                isSelected
                    ? "bg-emerald-500/20 border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)]"
                    : "bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10"
            )}
        >
            {/* Glow blob */}
            <div className={clsx(
                "absolute -top-8 -right-8 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-500",
                isSelected ? "bg-emerald-500/30 opacity-100" : "bg-emerald-500/20 opacity-0 group-hover:opacity-40"
            )} />

            <div className="relative flex items-start justify-between gap-4">
                {/* Left side */}
                <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{rate.emoji}</span>
                        <div>
                            <p className="text-white font-black text-lg leading-none">{rate.commodity}</p>
                            <p className="text-white/40 text-[10px] font-medium mt-0.5 truncate">{rate.mandi}</p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-white font-black text-3xl tracking-tight leading-none">
                            ₹{rate.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-white/40 text-[12px] font-medium">/qtl</span>
                    </div>

                    <div className={clsx(
                        "flex items-center gap-1 text-[12px] font-bold",
                        isSelected ? (isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-gray-400") : "text-white/60"
                    )}>
                        {isUp ? <ArrowUpRight size={14} /> :
                            isDown ? <ArrowDownRight size={14} /> :
                                <Minus size={14} />}
                        {rate.weeklyChange >= 0 ? '+' : ''}{rate.weeklyChange.toFixed(1)}% this week
                    </div>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={clsx(
                        "text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                        signal.chip
                    )}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", signal.dot)} />
                        {signal.label}
                    </span>
                    <button className={clsx(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors",
                        isSelected ? "bg-emerald-500 text-white" : "bg-white/5 text-white/40 group-hover:text-white/60"
                    )}>
                        {isSelected ? 'Closing Detail' : 'View 30D Trend'}
                    </button>
                </div>
            </div>

            {/* Price Trend Chart - Animated Expansion */}
            <div className={clsx(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isSelected ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"
            )}>
                {rate.history && rate.history.length > 0 && (
                    <TrendChart data={rate.history} trend={rate.trend} />
                )}
            </div>
        </div>
    );
}

// ── Compact Price Card ────────────────────────────────────────────────────────

function CompactCard({ rate, isSelected, onSelect }: { rate: MarketRate; isSelected: boolean; onSelect: () => void }) {
    const signal = SIGNAL_META[rate.sellSignal];
    const isUp = rate.trend === 'up';
    const isDown = rate.trend === 'down';

    return (
        <div
            onClick={onSelect}
            className={clsx(
                "border rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200 cursor-pointer group",
                isSelected
                    ? "bg-emerald-500/20 border-emerald-500/40"
                    : "bg-white/5 hover:bg-white/8 border-white/8 hover:border-white/15"
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-lg leading-none">{rate.emoji}</span>
                <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform duration-300", signal.dot, isSelected && "scale-150 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
            </div>
            <div>
                <p className="text-white font-black text-[13px] leading-none">
                    ₹{rate.price.toLocaleString('en-IN')}
                </p>
                <p className="text-white/40 text-[9px] font-medium mt-0.5 leading-tight truncate">{rate.commodity}</p>
            </div>
            <div className={clsx(
                "flex items-center gap-0.5 text-[10px] font-bold",
                isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-gray-400"
            )}>
                {isUp ? <TrendingUp size={10} /> :
                    isDown ? <TrendingDown size={10} /> :
                        <Minus size={10} />}
                {rate.weeklyChange >= 0 ? '+' : ''}{rate.weeklyChange.toFixed(1)}%
            </div>
        </div>
    );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export default function MarketWidget() {
    const { marketData, marketDataLoading, marketDataLastFetched, refreshMarketData } = useStore();
    const [expanded, setExpanded] = useState(false);
    const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

    const lastUpdated = marketDataLastFetched
        ? new Date(marketDataLastFetched).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : null;

    const featuredRate = marketData.find(r => r.sellSignal === 'sell_now') ?? marketData[0];
    const secondary = marketData.filter(r => r.id !== featuredRate?.id);
    const shown = expanded ? secondary : secondary.slice(0, 5);

    const toggleCrop = (id: string) => {
        setSelectedCropId(prev => prev === id ? null : id);
    };

    const selectedCrop = marketData.find(r => r.id === selectedCropId);

    const risingCount = marketData.filter(r => r.trend === 'up').length;
    const sellNowCount = marketData.filter(r => r.sellSignal === 'sell_now').length;

    return (
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border-[2px] border-white/10 shadow-[0_20px_50px_rgba(16,185,129,0.15)] animate-slide-in-right group" style={{ animationDelay: '0.2s' }}>

            {/* 3D Lighting Accents */}
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />

            {/* ── Top bar ──────────────────────────────────────────────── */}
            <div className="relative px-7 pt-7 pb-4 flex items-start justify-between z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-xl tracking-tight drop-shadow-sm">Market Today</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em]">
                                Live Mandi · Vidarbha APMC
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <button
                        onClick={() => refreshMarketData(true)}
                        disabled={marketDataLoading}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-emerald-100 hover:text-white transition-all active:scale-90 disabled:opacity-30 shadow-sm"
                    >
                        <RefreshCw size={16} className={clsx(marketDataLoading && 'animate-spin')} />
                    </button>
                    <p className="text-white/40 text-[9px] font-medium text-right mt-1">
                        {lastUpdated ? `Updated ${lastUpdated}` : 'Fetching...'}
                    </p>
                </div>
            </div>

            {/* ── Stats strip ──────────────────────────────────────────── */}
            {marketData.length > 0 && (
                <div className="relative z-10 px-7 pb-4 grid grid-cols-4 gap-3">
                    {[
                        { label: 'Tracked', value: marketData.length, color: 'text-white' },
                        { label: 'Rising 📈', value: risingCount, color: 'text-emerald-400' },
                        { label: 'Sell Now', value: sellNowCount, color: 'text-green-300' },
                        { label: 'Holding', value: marketData.length - sellNowCount, color: 'text-amber-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 backdrop-blur-md rounded-2xl px-2.5 py-3 text-center border border-white/10 shadow-sm">
                            <p className={clsx("font-black text-xl leading-none drop-shadow-sm", s.color)}>{s.value}</p>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Cards area ───────────────────────────────────────────── */}
            <div className="relative z-10 px-7 pb-5 space-y-3">
                {marketDataLoading ? (
                    <PriceSkeleton />
                ) : marketData.length > 0 ? (
                    <>
                        {featuredRate && (
                            <FeaturedCard
                                rate={featuredRate}
                                isSelected={selectedCropId === featuredRate.id}
                                onToggle={() => toggleCrop(featuredRate.id)}
                            />
                        )}

                        {/* Focused Trend Section for secondary crops */}
                        <div className={clsx(
                            "overflow-hidden transition-all duration-500 ease-in-out",
                            selectedCropId && selectedCropId !== featuredRate?.id ? "max-h-[400px] opacity-100 mb-4 mt-2" : "max-h-0 opacity-0"
                        )}>
                            {selectedCrop && selectedCrop.id !== featuredRate?.id && (
                                <div className="bg-emerald-900/40 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-emerald-900/20">
                                    <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                                    <div className="relative z-10 mb-4">
                                        {/* Top row: emoji + name + badge */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-4xl drop-shadow-lg flex-shrink-0">{selectedCrop.emoji}</span>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-white font-black text-xl leading-none tracking-tight">{selectedCrop.commodity}</h4>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 shadow-sm flex-shrink-0">Insight</span>
                                                </div>
                                                <p className="text-emerald-100/60 text-[11px] font-bold mt-1">{selectedCrop.mandi}</p>
                                            </div>
                                        </div>
                                        {/* Price row — always full width, never clipped */}
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-white font-black text-3xl leading-none tracking-tight drop-shadow-sm">₹{selectedCrop.price.toLocaleString('en-IN')}</p>
                                            <p className="text-emerald-100/50 text-[11px] font-bold uppercase tracking-wider">/ quintal</p>
                                        </div>
                                    </div>
                                    {selectedCrop.history && selectedCrop.history.length > 0 && (
                                        <div className="relative z-10">
                                            <TrendChart data={selectedCrop.history} trend={selectedCrop.trend} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setSelectedCropId(null)}
                                        className="relative z-10 mt-6 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl border border-white/20 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                                    >
                                        Close Detail
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-4">
                            {shown.map(rate => (
                                <CompactCard
                                    key={rate.id}
                                    rate={rate}
                                    isSelected={selectedCropId === rate.id}
                                    onSelect={() => toggleCrop(rate.id)}
                                />
                            ))}
                        </div>

                        {secondary.length > 5 && (
                            <button
                                onClick={() => setExpanded(e => !e)}
                                className="w-full flex items-center justify-center gap-2 text-[12px] font-bold text-white/50 hover:text-emerald-400 py-3 mt-2 transition-colors group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl"
                            >
                                <BarChart2 size={14} className="group-hover:scale-110 transition-transform" />
                                {expanded ? 'Collapse market view' : `Explore ${secondary.length - 5} more crops`}
                                <ChevronRight size={14} className={clsx("transition-transform group-hover:translate-x-0.5", expanded && "rotate-90")} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-3xl bg-white/5 border border-dashed border-white/20 backdrop-blur-sm">
                        <AlertCircle size={32} className="text-white/40 mb-3" />
                        <p className="text-base font-bold text-white/70">Market rates unavailable</p>
                        <p className="text-xs text-white/40 mt-1 mb-5">Please check your connection and try again.</p>
                        <button
                            onClick={() => refreshMarketData(true)}
                            className="text-xs font-black uppercase tracking-widest text-emerald-950 bg-emerald-400 border border-emerald-300 px-6 py-3 rounded-2xl hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}
            </div>

            {/* ── AI Insight strip ─────────────────────────────────────── */}
            {featuredRate && !marketDataLoading && (
                <div className="relative z-10 mx-7 mb-6 overflow-hidden flex items-start gap-4 bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 rounded-[1.5rem] p-5 shadow-lg shadow-orange-900/20 backdrop-blur-md group hover:border-orange-500/50 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/20 transition-colors duration-500" />

                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
                        <Sparkles size={22} className="text-white" />
                    </div>
                    <div className="relative z-10 min-w-0 flex-1 pt-0.5">
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1.5">
                            AI Advisory · {featuredRate.commodity}
                        </p>
                        <p className="text-sm text-white/90 leading-relaxed font-semibold">
                            {featuredRate.insight}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="relative z-10 px-7 pb-5">
                <p className="text-[10px] text-emerald-100/30 text-center font-bold tracking-wide">
                    Powered by Gemini AI · Verify at local mandi before selling
                </p>
            </div>
        </section>
    );
}
