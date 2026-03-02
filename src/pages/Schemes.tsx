import { useStore } from '../store/useStore';
import { checkSchemeEligibility } from '../services/SchemeService';
import PageHeader from '../components/PageHeader';
import { Landmark, ExternalLink, CheckCircle2, XCircle, Search, ChevronRight, TrendingUp, Award, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useT } from '../i18n/useT';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import clsx from 'clsx';

export default function Schemes() {
    const { user: profile } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'matching' | 'near-match'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const schemesWithEligibility = useMemo(() => {
        if (!profile) return [];
        return checkSchemeEligibility(profile);
    }, [profile]);

    const categories = ['all', 'financial', 'insurance', 'inputs', 'tech'];

    const filteredSchemes = useMemo(() => {
        return schemesWithEligibility.filter(scheme => {
            const matchesSearch = scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;

            const matchesTab = activeTab === 'all' ||
                (activeTab === 'matching' && scheme.isEligible) ||
                (activeTab === 'near-match' && !scheme.isEligible && scheme.matchScore >= 60);

            return matchesSearch && matchesCategory && matchesTab;
        });
    }, [schemesWithEligibility, searchQuery, selectedCategory, activeTab]);

    if (!profile) return null;

    const { t } = useT();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30
            } as any
        }
    };

    const stats = [
        {
            label: "Total Schemes",
            value: schemesWithEligibility.length,
            icon: Landmark,
            color: "slate",
            bg: "bg-slate-50",
            textColor: "text-slate-600",
            glow: "bg-slate-500/10"
        },
        {
            label: "Full Match",
            value: schemesWithEligibility.filter(s => s.isEligible).length,
            icon: Award,
            color: "emerald",
            bg: "bg-emerald-50",
            textColor: "text-emerald-600",
            glow: "bg-emerald-500/15"
        },
        {
            label: "Potential",
            value: schemesWithEligibility.filter(s => !s.isEligible && s.matchScore >= 60).length,
            icon: TrendingUp,
            color: "orange",
            bg: "bg-orange-50",
            textColor: "text-orange-600",
            glow: "bg-orange-500/15"
        },
        {
            label: "Updated",
            value: "Today",
            icon: Clock,
            color: "sky",
            bg: "bg-sky-50",
            textColor: "text-sky-600",
            glow: "bg-sky-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-surface pb-24 md:pb-12 font-sans overflow-x-hidden">
            <PageHeader
                title={t('scheme.title')}
                subtitle={t('ph.schemes')}
                icon={<Landmark size={24} className="text-emerald-600" />}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-5xl mx-auto px-4 md:px-8 mt-6"
            >
                {/* ── 3D Hero Stats ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className={clsx(
                                "relative group p-6 rounded-[2.5rem] bg-white border border-white shadow-[0_15px_35px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300",
                                i === 1 ? "ring-2 ring-emerald-500/20 translate-y-[-4px] shadow-emerald-500/10" : ""
                            )}
                        >
                            {/* Inner 3D depth shadows */}
                            <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] pointer-events-none" />

                            {/* Accent Glow */}
                            <div className={clsx("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] pointer-events-none", s.glow)} />

                            <div className={clsx("w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:rotate-6", s.bg, s.textColor)}>
                                <s.icon size={20} className="drop-shadow-sm" />
                            </div>

                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className={clsx("text-2xl font-black tracking-tight", i === 1 ? "text-emerald-600" : "text-slate-900")}>
                                {s.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Glassmorphism Filters & Search ───────────────────────── */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/70 backdrop-blur-3xl rounded-[3rem] p-4 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.04)] border border-white/60 mb-10 relative overflow-hidden"
                >
                    {/* Decorative ambient orbs */}
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-sky-500/5 rounded-full blur-[40px] pointer-events-none" />

                    <div className="relative z-10 space-y-8">
                        {/* Search Input with 3D Inset */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-slate-900/5 rounded-3xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)] pointer-events-none" />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" size={20} />
                            <input
                                type="text"
                                placeholder="Search schemes by name or benefit..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-8 py-5 bg-transparent border-none rounded-3xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                            />
                        </div>

                        {/* Category & Tab Container */}
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            {/* Sliding Pill Tabs */}
                            <div className="flex p-1.5 bg-slate-900/5 rounded-2xl w-full md:w-auto relative group">
                                <div className="absolute inset-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] pointer-events-none rounded-2xl" />
                                {['all', 'matching', 'near-match'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={clsx(
                                            "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10",
                                            activeTab === tab
                                                ? "text-white bg-emerald-600 shadow-lg shadow-emerald-500/30"
                                                : "text-slate-400 hover:text-slate-700 hover:bg-white/50"
                                        )}
                                    >
                                        {tab.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Category Pills */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full flex-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                            selectedCategory === cat
                                                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 scale-105"
                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Schemes List ────────────────────────────────────────── */}
                <div className="grid gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredSchemes.map((scheme: any) => (
                            <motion.div
                                key={scheme.id}
                                variants={itemVariants}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <SchemeCard scheme={scheme} />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredSchemes.length === 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Search size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('scheme.noSchemes')}</h3>
                            <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-wide">{t('common.filter')}</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function SchemeCard({ scheme }: { scheme: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useT();

    return (
        <div className={clsx(
            "relative bg-white rounded-[3rem] border transition-all duration-500 overflow-hidden group",
            scheme.isEligible
                ? "border-emerald-100 shadow-[0_20px_40px_rgba(16,185,129,0.05)] hover:shadow-emerald-900/10 ring-1 ring-emerald-500/5"
                : "border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.02)] hover:shadow-slate-200"
        )}>
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 p-6 md:p-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Icon Container with 3D depth */}
                    <div className={clsx(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl",
                        scheme.isEligible
                            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]"
                            : "bg-slate-100 text-slate-400 shadow-slate-200/50"
                    )}>
                        <Landmark size={28} className="drop-shadow-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
                                {scheme.title}
                            </h3>
                            {scheme.isEligible ? (
                                <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                                    <CheckCircle2 size={12} className="fill-white/20" /> {t('scheme.eligible')}
                                </span>
                            ) : (
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full flex items-center gap-2">
                                    <XCircle size={12} /> Probable
                                </span>
                            )}
                            <div className="relative px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 group/meter overflow-hidden">
                                <div
                                    className="absolute inset-0 bg-emerald-100/50 transition-all duration-1000 origin-left"
                                    style={{ transform: `scaleX(${scheme.matchScore / 100})` }}
                                />
                                <span className="relative text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                    {scheme.matchScore.toFixed(0)}% MATCH
                                </span>
                            </div>
                        </div>

                        <p className="text-slate-500 text-[15px] font-medium leading-relaxed line-clamp-2 md:line-clamp-none mb-8">
                            {scheme.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-all border border-transparent group-hover:border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</span>
                                <span className="text-xs font-black text-slate-700">{scheme.targetAudience}</span>
                            </div>
                            <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-all border border-transparent group-hover:border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Benefit</span>
                                <span className="text-xs font-black text-emerald-600 uppercase italic tracking-tight">{scheme.category}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={clsx(
                    "mt-10 pt-10 border-t border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between",
                    isExpanded ? "block" : "hidden md:flex"
                )}>
                    <div className="flex flex-wrap gap-2.5">
                        {scheme.mismatches.map((m: string) => (
                            <span key={m} className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Check {m}
                            </span>
                        ))}
                        {scheme.isEligible && (
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                                <CheckCircle2 size={12} /> Profile Verified
                            </span>
                        )}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={() => window.open(scheme.url, '_blank')}
                            className="flex-1 md:flex-none px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-[1.25rem] text-[13px] font-black uppercase tracking-[0.1em] shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 group/btn"
                        >
                            {t('scheme.applyNow')}
                            <ExternalLink size={16} className="transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-5 bg-slate-50 md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-3 border-t border-slate-100 active:bg-slate-100 transition-colors"
            >
                {isExpanded ? 'View Less' : 'View Requirements & Apply'}
                <ChevronRight size={14} className={clsx("transition-transform duration-300", isExpanded ? "-rotate-90 text-emerald-500" : "rotate-90")} />
            </button>
        </div>
    );
}
