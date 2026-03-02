import { Crown, ShieldCheck, Sprout, Star, Check, Zap, Rocket, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import clsx from 'clsx';

export default function Premium() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            } as any
        }
    };

    const features = [
        {
            icon: Sprout,
            title: "Advanced Diagnosis",
            desc: "Unlimited scans with higher accuracy models and specialized crop reports.",
            color: "emerald",
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-100"
        },
        {
            icon: ShieldCheck,
            title: "Crop Insurance Support",
            desc: "Get verified digital reports accepted by most insurance providers for claims.",
            color: "sky",
            bg: "bg-sky-50",
            iconColor: "text-sky-600",
            borderColor: "border-sky-100"
        },
        {
            icon: Star,
            title: "Priority Support",
            desc: "Direct line to senior agronomists with 24/7 priority chat response times.",
            color: "indigo",
            bg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-100"
        },
        {
            icon: Crown,
            title: "Market Insights",
            desc: "Deep analysis of market trends and AI-driven future price predictions.",
            color: "amber",
            bg: "bg-amber-50",
            iconColor: "text-amber-600",
            borderColor: "border-amber-100"
        }
    ];

    return (
        <div className="min-h-screen bg-surface pb-24 md:pb-12 font-sans overflow-x-hidden">
            <PageHeader
                title="Crop Doctor"
                badge="Pro"
                showBack={false}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-4 md:px-10 max-w-5xl mx-auto mt-6"
            >
                {/* ── Hero "Pro" Showcase ─────────────────────────────────── */}
                <motion.div
                    variants={itemVariants}
                    className="relative rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/40"
                >
                    {/* Metallic Dark Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#064e3b] to-[#0f172a]" />

                    {/* Animated Ambient Orbs */}
                    <motion.div
                        animate={{
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"
                    />
                    <motion.div
                        animate={{
                            x: [0, -40, 0],
                            y: [0, 60, 0],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-20%] left-[-10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"
                    />

                    <div className="relative z-10 p-8 md:p-14 text-center">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-[11px] font-black text-white px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 mb-6"
                        >
                            <Zap size={12} className="fill-white" />
                            Premium Excellence
                        </motion.span>

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                            Crop Doctor <span className="relative">
                                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">Pro</span>
                                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-amber-400/30 blur-sm rounded-full" />
                            </span>
                        </h2>

                        <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                            Take your farming to the next level with industry-leading AI tools, expert consultations, and real-time precision insights.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                            {/* Benefits List */}
                            <div className="space-y-4 text-left">
                                {[
                                    "Unlimited Image Diagnosis",
                                    "Video Calls with Experts",
                                    "Advanced Soil Reports",
                                    "Priority Multi-lang Support"
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3 text-white/90 font-bold">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <Check size={14} className="text-emerald-400" />
                                        </div>
                                        {benefit}
                                    </div>
                                ))}
                            </div>

                            {/* Glass Pricing Card */}
                            <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                <p className="text-amber-400 text-xs font-black uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Annual Plan</p>
                                <div className="flex items-end justify-center gap-1 mb-2">
                                    <span className="text-6xl font-black text-white drop-shadow-md">₹999</span>
                                    <span className="text-slate-400 font-bold mb-3">/year</span>
                                </div>
                                <div className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-8">
                                    Saving 50% vs Monthly
                                </div>
                                <button className="w-full bg-white text-slate-900 hover:bg-emerald-50 p-5 rounded-2xl font-black text-[17px] transition-all hover:scale-[1.03] active:scale-95 shadow-[0_15px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 group">
                                    Upgrade to Pro
                                    <Rocket size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Features Grid ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className={clsx(
                                "p-8 rounded-[2.5rem] bg-white border shadow-[0_15px_35px_rgba(0,0,0,0.03)] flex gap-6 items-start transition-shadow hover:shadow-[0_25px_50px_rgba(0,0,0,0.06)]",
                                f.borderColor
                            )}
                        >
                            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", f.bg)}>
                                <f.icon className={f.iconColor} size={28} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-900 mb-2 tracking-tight">{f.title}</h3>
                                <p className="text-slate-500 font-medium text-[15px] leading-relaxed">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Trust Section ────────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="mt-16 text-center space-y-8">
                    <div className="inline-flex flex-col items-center">
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] mb-5">Trusted by 10,000+ Farmers</p>
                        <div className="flex justify-center -space-x-3">
                            {[1, 2, 3, 4, 11, 12].map(i => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5, zIndex: 10 }}
                                    className="w-12 h-12 rounded-2xl border-[3px] border-white shadow-md overflow-hidden bg-white"
                                >
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=farmer${i}`} className="w-full h-full" alt="Farmer" />
                                </motion.div>
                            ))}
                            <div className="w-12 h-12 rounded-2xl border-[3px] border-white bg-slate-100 flex items-center justify-center shadow-md">
                                <span className="text-[14px] font-black text-slate-600">+10k</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 border border-slate-100 p-6 rounded-[2rem] max-w-2xl mx-auto flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-slate-700 font-bold text-sm">7-Day Money Back Guarantee</p>
                            <p className="text-slate-400 text-xs font-medium">Cancel anytime within your billing period. No hidden fees or contracts.</p>
                        </div>
                        <ChevronRight className="ml-auto text-slate-300" size={20} />
                    </div>
                </motion.div>

                {/* Shimmer Animation CSS */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    .animate-shimmer {
                        animation: shimmer 5s infinite linear;
                    }
                ` }} />
            </motion.div>
        </div>
    );
}
