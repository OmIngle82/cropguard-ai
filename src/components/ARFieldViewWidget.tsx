import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Scan, X, Camera, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { useT } from '../i18n/useT';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

// Simulated AR bounding boxes shown on the card preview
const DEMO_BOXES = [
    { x: '18%', y: '28%', w: '22%', h: '30%', label: 'Healthy', conf: 97, color: 'emerald' },
    { x: '55%', y: '18%', w: '18%', h: '28%', label: 'Aphids', conf: 82, color: 'yellow' },
    { x: '68%', y: '55%', w: '20%', h: '26%', label: 'Healthy', conf: 94, color: 'emerald' },
];

export default function ARFieldViewWidget() {
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [showBoxes, setShowBoxes] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraError, setHasCameraError] = useState(false);
    const scanLineControls = useAnimationControls();

    // Animate the scan line on the preview card on mount
    useEffect(() => {
        const runScan = async () => {
            await scanLineControls.start({
                y: ['0%', '100%'],
                transition: { duration: 3, ease: 'linear', repeat: Infinity, repeatDelay: 1.5 },
            });
        };
        runScan();
        // Show bounding boxes after initial "scan" delay
        const t = setTimeout(() => setShowBoxes(true), 2000);
        return () => clearTimeout(t);
    }, []);

    // Camera initialization
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isOpen) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(s => {
                    stream = s;
                    if (videoRef.current) videoRef.current.srcObject = s;
                })
                .catch(() => setHasCameraError(true));

            setIsScanning(true);
            const timer = setTimeout(() => { setIsScanning(false); setScanComplete(true); }, 4000);
            return () => {
                clearTimeout(timer);
                stream?.getTracks().forEach(t => t.stop());
            };
        } else {
            setIsScanning(false);
            setScanComplete(false);
            setHasCameraError(false);
        }
    }, [isOpen]);

    return (
        <>
            {/* â”€â”€ Widget Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section
                onClick={() => setIsOpen(true)}
                className="relative overflow-hidden w-full h-full min-h-[300px] rounded-[2.5rem] bg-slate-950 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.12),0_20px_50px_rgba(0,0,0,0.6)] cursor-pointer group flex flex-col"
                style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0d1f2d 50%, #05140e 100%)' }}
            >
                {/* Animated field image bg */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=900')] bg-cover bg-center opacity-25 group-hover:opacity-35 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

                {/* Animated emerald border glow */}
                <div className="absolute inset-0 rounded-[2.5rem] border border-emerald-500/0 group-hover:border-emerald-500/40 transition-all duration-500" />
                <div className="absolute inset-[-1px] rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />

                {/* â”€â”€ Animated HUD grid lines â”€â”€ */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    {[...Array(5)].map((_, i) => (
                        <div key={`h${i}`} className="absolute left-0 right-0 border-t border-emerald-500/30" style={{ top: `${(i + 1) * 16.66}%` }} />
                    ))}
                    {[...Array(5)].map((_, i) => (
                        <div key={`v${i}`} className="absolute top-0 bottom-0 border-l border-emerald-500/30" style={{ left: `${(i + 1) * 16.66}%` }} />
                    ))}
                </div>

                {/* â”€â”€ Animated scan line â”€â”€ */}
                <motion.div
                    animate={scanLineControls}
                    className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.9) 40%, rgba(52,211,153,1) 50%, rgba(16,185,129,0.9) 60%, transparent)', boxShadow: '0 0 20px 4px rgba(16,185,129,0.5)' }}
                />

                {/* â”€â”€ AR Bounding boxes that appear after scan â”€â”€ */}
                <AnimatePresence>
                    {showBoxes && DEMO_BOXES.map((box, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.25, duration: 0.4, ease: 'backOut' }}
                            className="absolute pointer-events-none z-20"
                            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                        >
                            <div className={clsx(
                                "w-full h-full rounded-xl border-2 relative",
                                box.color === 'emerald' ? 'border-emerald-400/70 bg-emerald-500/5' : 'border-yellow-400/70 bg-yellow-500/5'
                            )}>
                                {/* Corner markers */}
                                <div className={clsx("absolute top-[-2px] left-[-2px] w-3 h-3 border-t-2 border-l-2 rounded-tl", box.color === 'emerald' ? 'border-emerald-400' : 'border-yellow-400')} />
                                <div className={clsx("absolute top-[-2px] right-[-2px] w-3 h-3 border-t-2 border-r-2 rounded-tr", box.color === 'emerald' ? 'border-emerald-400' : 'border-yellow-400')} />
                                <div className={clsx("absolute bottom-[-2px] left-[-2px] w-3 h-3 border-b-2 border-l-2 rounded-bl", box.color === 'emerald' ? 'border-emerald-400' : 'border-yellow-400')} />
                                <div className={clsx("absolute bottom-[-2px] right-[-2px] w-3 h-3 border-b-2 border-r-2 rounded-br", box.color === 'emerald' ? 'border-emerald-400' : 'border-yellow-400')} />
                                {/* Label */}
                                <div className={clsx(
                                    "absolute top-1 left-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded backdrop-blur-md",
                                    box.color === 'emerald' ? 'bg-emerald-500/80 text-white' : 'bg-yellow-500/80 text-white'
                                )}>
                                    {box.label} {box.conf}%
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* â”€â”€ Corner HUD Markers â”€â”€ */}
                {[
                    'top-4 left-4 border-t-2 border-l-2 rounded-tl-2xl',
                    'top-4 right-4 border-t-2 border-r-2 rounded-tr-2xl',
                    'bottom-4 left-4 border-b-2 border-l-2 rounded-bl-2xl',
                    'bottom-4 right-4 border-b-2 border-r-2 rounded-br-2xl',
                ].map((cls, i) => (
                    <div key={i} className={clsx("absolute w-8 h-8 border-emerald-400/60 pointer-events-none z-10", cls)} />
                ))}

                {/* â”€â”€ Floating data chips â”€â”€ */}
                <AnimatePresence>
                    {showBoxes && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-full px-3 py-1 flex items-center gap-1.5 z-20"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Scanning</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="absolute bottom-20 right-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 z-20"
                            >
                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Health Score</div>
                                <div className="text-lg font-black text-emerald-400 leading-none">88<span className="text-xs">%</span></div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* â”€â”€ Card footer â”€â”€ */}
                <div className="relative z-20 mt-auto p-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                    <Scan size={16} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    BETA Â· AR
                                </span>
                            </div>
                            <h3 className="text-white font-black text-2xl tracking-tight leading-none">{t('ar.title')}</h3>
                            <p className="text-sm font-semibold text-slate-400 mt-1">{t('ar.subtitle')}</p>
                        </div>
                        {/* Tap to open CTA */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 shrink-0"
                        >
                            <Zap size={20} />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* \u2500\u2500 Premium Full-Screen AR Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 1.04 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-[100] bg-black overflow-hidden"
                            style={{ height: '100dvh' }}
                        >
                            {/* \u2500\u2500 Camera / Fallback Feed \u2500\u2500 */}
                            <div className="absolute inset-0">
                                {hasCameraError ? (
                                    // Premium "No Camera" screen
                                    <div className="w-full h-full flex flex-col items-center justify-center"
                                        style={{ background: 'radial-gradient(ellipse at 30% 20%, #0d2318 0%, #040d08 60%, #000 100%)' }}>
                                        {/* Animated grid */}
                                        <div className="absolute inset-0 opacity-[0.07]">
                                            {[...Array(12)].map((_, i) => <div key={`gh${i}`} className="absolute left-0 right-0 border-t border-emerald-400" style={{ top: `${i * 8.33}%` }} />)}
                                            {[...Array(8)].map((_, i) => <div key={`gv${i}`} className="absolute top-0 bottom-0 border-l border-emerald-400" style={{ left: `${i * 12.5}%` }} />)}
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6"
                                        >
                                            <Camera className="text-emerald-400" size={40} />
                                        </motion.div>
                                        <h3 className="text-white font-black text-2xl mb-2 tracking-tight">Camera Access Required</h3>
                                        <p className="text-slate-400 text-sm max-w-xs text-center mb-8 leading-relaxed">Grant camera permission to activate the live AR field scanning system.</p>
                                        <button onClick={() => setIsOpen(false)}
                                            className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all">
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                                )}
                            </div>

                            {/* \u2500\u2500 Vignette + tint overlay \u2500\u2500 */}
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
                            <div className="absolute inset-0 pointer-events-none bg-emerald-950/10 mix-blend-multiply" />

                            {/* \u2500\u2500 HUD AR Overlay \u2500\u2500 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                {/* Subtle grid */}
                                <div className="absolute inset-0 opacity-[0.06]">
                                    {[...Array(9)].map((_, i) => <div key={`oh${i}`} className="absolute left-0 right-0 border-t border-emerald-300" style={{ top: `${(i + 1) * 10}%` }} />)}
                                    {[...Array(6)].map((_, i) => <div key={`ov${i}`} className="absolute top-0 bottom-0 border-l border-emerald-300" style={{ left: `${(i + 1) * 14.28}%` }} />)}
                                </div>

                                {/* Animated scan beam */}
                                {isScanning && (
                                    <motion.div
                                        animate={{ y: ['-2%', '102%'] }}
                                        transition={{ duration: 2.2, ease: 'linear', repeat: Infinity, repeatDelay: 0.4 }}
                                        className="absolute left-0 right-0 pointer-events-none"
                                        style={{ height: '60px', background: 'linear-gradient(to bottom, transparent 0%, rgba(16,185,129,0.08) 30%, rgba(52,211,153,0.22) 50%, rgba(16,185,129,0.08) 70%, transparent 100%)' }}
                                    >
                                        <div className="w-full h-[1.5px] mt-[29px]"
                                            style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.6) 20%, rgba(52,211,153,1) 50%, rgba(16,185,129,0.6) 80%, transparent)', boxShadow: '0 0 25px 6px rgba(16,185,129,0.4)' }} />
                                    </motion.div>
                                )}

                                {/* Detection overlays after scan */}
                                <AnimatePresence>
                                    {scanComplete && !hasCameraError && (
                                        <>
                                            {/* Box 1 â€” Healthy crop */}
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                                                className="absolute" style={{ top: '22%', left: '10%', width: '26%', height: '32%' }}>
                                                <div className="w-full h-full rounded-2xl relative"
                                                    style={{ border: '1.5px solid rgba(52,211,153,0.7)', background: 'rgba(16,185,129,0.04)' }}>
                                                    <div className="absolute inset-[-1px] rounded-2xl opacity-40"
                                                        style={{ boxShadow: 'inset 0 0 15px rgba(16,185,129,0.15), 0 0 12px rgba(16,185,129,0.2)' }} />
                                                    <div className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t-[2px] border-l-[2px] border-emerald-400 rounded-tl-2xl" />
                                                    <div className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t-[2px] border-r-[2px] border-emerald-400 rounded-tr-2xl" />
                                                    <div className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b-[2px] border-l-[2px] border-emerald-400 rounded-bl-2xl" />
                                                    <div className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b-[2px] border-r-[2px] border-emerald-400 rounded-br-2xl" />
                                                    <div className="absolute -top-7 left-0 flex items-center gap-1.5">
                                                        <div className="bg-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Healthy Â· 97%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Box 2 â€” Aphid detection */}
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                                                className="absolute" style={{ top: '15%', left: '47%', width: '22%', height: '30%' }}>
                                                <div className="w-full h-full rounded-2xl relative"
                                                    style={{ border: '1.5px solid rgba(251,191,36,0.8)', background: 'rgba(234,179,8,0.04)' }}>
                                                    <div className="absolute inset-[-1px] rounded-2xl opacity-40"
                                                        style={{ boxShadow: 'inset 0 0 15px rgba(234,179,8,0.12), 0 0 12px rgba(234,179,8,0.25)' }} />
                                                    <div className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t-[2px] border-l-[2px] border-yellow-400 rounded-tl-2xl" />
                                                    <div className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t-[2px] border-r-[2px] border-yellow-400 rounded-tr-2xl" />
                                                    <div className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b-[2px] border-l-[2px] border-yellow-400 rounded-bl-2xl" />
                                                    <div className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b-[2px] border-r-[2px] border-yellow-400 rounded-br-2xl" />
                                                    <div className="absolute -top-7 left-0 flex items-center gap-1.5">
                                                        <div className="bg-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Aphids Â· 82%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Box 3 â€” Healthy */}
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                                                className="absolute" style={{ top: '52%', left: '58%', width: '22%', height: '28%' }}>
                                                <div className="w-full h-full rounded-2xl relative"
                                                    style={{ border: '1.5px solid rgba(52,211,153,0.7)', background: 'rgba(16,185,129,0.04)' }}>
                                                    <div className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t-[2px] border-l-[2px] border-emerald-400 rounded-tl-2xl" />
                                                    <div className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t-[2px] border-r-[2px] border-emerald-400 rounded-tr-2xl" />
                                                    <div className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b-[2px] border-l-[2px] border-emerald-400 rounded-bl-2xl" />
                                                    <div className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b-[2px] border-r-[2px] border-emerald-400 rounded-br-2xl" />
                                                    <div className="absolute -top-7 left-0">
                                                        <div className="bg-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Healthy Â· 94%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Corner HUD brackets */}
                                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
                                    <div key={i} className={clsx("absolute m-5 w-10 h-10 border-white/20 rounded-sm", cls)} />
                                ))}
                            </motion.div>

                            {/* \u2500\u2500 Top bar (pointer-events-auto) \u2500\u2500 */}
                            <div className="absolute top-0 left-0 right-0 pointer-events-auto z-20"
                                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)', paddingTop: 'env(safe-area-inset-top)' }}>
                                <div className="flex items-center justify-between px-5 pt-4 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/25 border border-emerald-500/50 backdrop-blur-md flex items-center justify-center">
                                            <Sparkles size={16} className="text-emerald-300" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-base tracking-tight leading-none">{t('ar.title')}</p>
                                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                {isScanning ? t('ar.scanning') : scanComplete ? 'Scan Complete' : 'Ready'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Rec indicator */}
                                        {isScanning && (
                                            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-full">
                                                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-red-500" />
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Scanning</span>
                                            </div>
                                        )}
                                        <button onClick={() => setIsOpen(false)}
                                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all active:scale-90">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* \u2500\u2500 Bottom drawer â€” premium glass panel \u2500\u2500 */}
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 32 }}
                                className="absolute bottom-0 left-0 right-0 pointer-events-auto z-20"
                                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                            >
                                <div className="mx-3 mb-3 rounded-[2rem] overflow-hidden"
                                    style={{ background: 'rgba(5,12,10,0.82)', backdropFilter: 'blur(24px) saturate(1.4)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
                                    {/* Top accent line */}
                                    <div className="h-[1.5px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5) 30%, rgba(52,211,153,0.8) 50%, rgba(52,211,153,0.5) 70%, transparent)' }} />

                                    <div className="p-5">
                                        {isScanning ? (
                                            // Scanning state
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                                    <RefreshCw className="animate-spin text-emerald-400" size={22} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-black text-base">{t('ar.scanning')}</p>
                                                    <p className="text-emerald-400 text-sm font-semibold mt-0.5">{t('ar.analyzing')}</p>
                                                    {/* Waveform bars */}
                                                    <div className="flex items-end gap-0.5 mt-3 h-6">
                                                        {[...Array(24)].map((_, i) => (
                                                            <motion.div key={i}
                                                                className="flex-1 bg-emerald-500 rounded-sm"
                                                                animate={{ height: [`${20 + Math.random() * 80}%`, `${20 + Math.random() * 80}%`, `${20 + Math.random() * 80}%`] }}
                                                                transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.04 }}
                                                                style={{ opacity: 0.4 + i / 24 * 0.6 }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Results state
                                            <div>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{t('ar.health')}</p>
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-5xl font-black text-white leading-none tracking-tighter">88</span>
                                                            <span className="text-2xl font-black text-white/60 mb-0.5">%</span>
                                                            <span className="text-base font-black text-emerald-400 mb-1.5">Good</span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-400 mt-1.5 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                                                            {t('ar.diseaseDetected')}
                                                        </p>
                                                    </div>

                                                    {/* Rescan button */}
                                                    <button
                                                        onClick={() => {
                                                            setIsScanning(true);
                                                            setScanComplete(false);
                                                            setTimeout(() => { setIsScanning(false); setScanComplete(true); }, 4000);
                                                        }}
                                                        className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0 active:scale-90 transition-transform"
                                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 30px rgba(16,185,129,0.4), inset 0 1px 1px rgba(255,255,255,0.2)' }}
                                                    >
                                                        <Scan size={26} />
                                                    </button>
                                                </div>

                                                {/* Detection summary chips */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">2 Healthy zones</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/25 px-3 py-1.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">1 Pest zone</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
