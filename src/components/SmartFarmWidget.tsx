import { useState, useEffect } from 'react';
import { Wifi, Activity, Droplets, Power, Settings2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useT } from '../i18n/useT';

const NPK_DATA = [
    { key: 'N', label: 'iot.nitrogen', value: 45, unit: 'mg', color: 'emerald', bar: 0.72 },
    { key: 'P', label: 'iot.phosphorus', value: 22, unit: 'mg', color: 'blue', bar: 0.44 },
    { key: 'K', label: 'iot.potassium', value: 18, unit: 'mg', color: 'violet', bar: 0.36 },
];

export default function SmartFarmWidget() {
    const { t } = useT();
    const [isPumpOn, setIsPumpOn] = useState(false);
    const [isAuto, setIsAuto] = useState(true);
    const [moisture, setMoisture] = useState(42);
    const [lastUpdated, setLastUpdated] = useState(0); // seconds ago

    // Simulate live data fluctuations
    useEffect(() => {
        const interval = setInterval(() => {
            setMoisture(prev => {
                const change = (Math.random() - 0.5) * 2;
                const next = Math.min(100, Math.max(0, prev + change));
                return Number(next.toFixed(1));
            });
            setLastUpdated(0); // just synced
        }, 3000);

        // Tick up "seconds ago"
        const tick = setInterval(() => setLastUpdated(s => s + 1), 1000);

        return () => { clearInterval(interval); clearInterval(tick); };
    }, []);

    const togglePump = () => {
        if (isAuto) return;
        setIsPumpOn(p => !p);
    };

    const moistureColor = moisture < 30 ? 'orange' : moisture > 70 ? 'blue' : 'emerald';
    const moistureLabel = moisture < 30 ? 'Low' : moisture > 70 ? 'High' : 'Optimal';

    return (
        <section className="relative overflow-hidden rounded-[2.5rem] h-full border border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0d1f2d 50%, #091418 100%)' }}>

            {/* Ambient glow orbs */}
            <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-56 h-56 bg-indigo-500/12 rounded-full blur-[70px] pointer-events-none" />
            <div className="absolute top-[40%] right-[-5%] w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{t('iot.connected')}</span>
                    </div>
                    <h3 className="text-white font-black text-xl tracking-tight">{t('iot.title')}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-0.5">{t('iot.subtitle')}</p>
                </div>
                <div className="w-10 h-10 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner relative">
                    <Wifi size={18} />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-800" />
                </div>
            </div>

            <div className="relative z-10 px-5 py-5 space-y-4">

                {/* ── Moisture Gauge ──────────────────────────────────── */}
                <motion.div
                    className="rounded-3xl p-5 relative overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <div className="flex items-center gap-5">
                        {/* Circular Gauge */}
                        <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                <motion.circle
                                    cx="18" cy="18" r="15.5" fill="none"
                                    stroke={moistureColor === 'emerald' ? '#10b981' : moistureColor === 'orange' ? '#f97316' : '#3b82f6'}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(moisture / 100) * 97.38} 97.38`}
                                    initial={{ strokeDasharray: '0 97.38' }}
                                    animate={{ strokeDasharray: `${(moisture / 100) * 97.38} 97.38` }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    style={{ filter: `drop-shadow(0 0 6px ${moistureColor === 'emerald' ? 'rgba(16,185,129,0.6)' : moistureColor === 'orange' ? 'rgba(249,115,22,0.6)' : 'rgba(59,130,246,0.6)'})` }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    key={Math.round(moisture)}
                                    initial={{ scale: 1.3, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-xl font-black text-white leading-none"
                                >
                                    {Math.round(moisture)}
                                </motion.span>
                                <span className="text-[9px] font-bold text-slate-400">%</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
                                <Droplets size={14} className="text-blue-400 shrink-0" />
                                <span className="text-sm truncate">{t('iot.moisture')}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                    <Activity size={11} className="shrink-0" />
                                    {lastUpdated < 5 ? 'Synced just now' : `${lastUpdated}s ago`}
                                </p>
                                <motion.span
                                    key={moistureLabel}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={clsx(
                                        "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0",
                                        moistureColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                                            moistureColor === 'orange' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                                                'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                    )}
                                >
                                    {moistureLabel}
                                </motion.span>
                            </div>
                            {/* Mini trend bar */}
                            <div className="mt-3 w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                                <motion.div
                                    className={clsx("h-full rounded-full", moistureColor === 'emerald' ? 'bg-emerald-500' : moistureColor === 'orange' ? 'bg-orange-500' : 'bg-blue-500')}
                                    animate={{ width: `${moisture}%` }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    style={{ boxShadow: `0 0 8px 1px ${moistureColor === 'emerald' ? 'rgba(16,185,129,0.4)' : moistureColor === 'orange' ? 'rgba(249,115,22,0.4)' : 'rgba(59,130,246,0.4)'}` }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── NPK Sensor Grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-2.5">
                    {NPK_DATA.map(({ key, label, value, unit, color, bar }, i) => (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            className="bg-slate-800/40 rounded-2xl p-3.5 border border-white/5 text-center space-y-1.5 relative overflow-hidden"
                        >
                            <div className={clsx(
                                "text-[9px] font-black uppercase tracking-wider",
                                color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : 'text-violet-400'
                            )}>
                                {t(label as any)}
                            </div>
                            <motion.div
                                className="text-xl font-black text-white"
                                animate={{ opacity: [1, 0.6, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
                            >
                                {value}<span className="text-[9px] text-slate-500 ml-0.5 font-bold">{unit}</span>
                            </motion.div>
                            {/* Mini bar */}
                            <div className="w-full h-1 bg-slate-700/60 rounded-full overflow-hidden">
                                <motion.div
                                    className={clsx("h-full rounded-full", color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-violet-500')}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${bar * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.15 + 0.5 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Irrigation Control ─────────────────────────────────── */}
                <div className="rounded-3xl p-4 border border-indigo-500/20 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(30,27,75,0.7) 0%, rgba(15,23,42,0.7) 100%)' }}>
                    <AnimatePresence>
                        {isPumpOn && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 rounded-3xl pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(59,130,246,0.15) 0%, transparent 70%)' }}
                            />
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={isPumpOn ? { boxShadow: ['0 0 0 0 rgba(59,130,246,0.4)', '0 0 0 10px rgba(59,130,246,0)', '0 0 0 0 rgba(59,130,246,0)'] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                    isPumpOn ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 text-slate-400"
                                )}
                            >
                                <Power size={18} />
                            </motion.div>
                            <div>
                                <h4 className="text-sm font-black text-white">{t('iot.pumpStatus')}</h4>
                                <motion.p
                                    key={String(isPumpOn)}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx("text-[10px] font-bold uppercase tracking-wider mt-0.5", isPumpOn ? "text-blue-400" : "text-slate-500")}
                                >
                                    {isPumpOn ? t('iot.pumpOn') : 'STANDBY'}
                                </motion.p>
                            </div>
                        </div>

                        {/* Spring Toggle */}
                        <button
                            onClick={togglePump}
                            disabled={isAuto}
                            className={clsx(
                                "w-14 h-8 rounded-full border-2 transition-all duration-300 flex items-center px-1 relative",
                                isPumpOn ? "border-blue-500 bg-blue-500/20" : "border-slate-600 bg-slate-800",
                                isAuto && "opacity-40 cursor-not-allowed"
                            )}
                        >
                            <motion.div
                                className={clsx("w-5 h-5 rounded-full", isPumpOn ? "bg-blue-500" : "bg-slate-500")}
                                animate={{ x: isPumpOn ? 24 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                            />
                        </button>
                    </div>

                    {/* Mode pills with animated slider */}
                    <div className="relative flex items-center bg-slate-900/60 rounded-2xl p-1 gap-1 z-10">
                        {/* Sliding indicator */}
                        <motion.div
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl"
                            animate={{ x: isAuto ? 4 : 'calc(100% + 4px)' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ background: isAuto ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.3)', border: isAuto ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(148,163,184,0.2)' }}
                        />
                        <button
                            onClick={() => setIsAuto(true)}
                            className={clsx(
                                "relative flex-1 text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 z-10",
                                isAuto ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <ShieldCheck size={12} /> Auto
                        </button>
                        <button
                            onClick={() => { setIsAuto(false); setIsPumpOn(false); }}
                            className={clsx(
                                "relative flex-1 text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 z-10",
                                !isAuto ? "text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Settings2 size={12} /> Manual
                        </button>
                    </div>

                    {/* Fixed-height status row so layout never shifts when toggling */}
                    <div className="h-6 mt-2.5 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {isAuto && (
                                <motion.p
                                    key="auto-label"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[10px] font-bold text-center text-slate-500 flex items-center justify-center gap-1.5"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Auto-schedule Active
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
