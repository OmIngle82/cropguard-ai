import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Info, Star, ShieldCheck, Flame } from 'lucide-react';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { listenToGamification, type GamificationStats } from '../services/GamificationService';

export default function FarmScoreWidget() {
    const { t } = useT();
    const { user } = useStore();

    const [stats, setStats] = useState<GamificationStats>({
        score: 0,
        streak: 0,
        lastActive: null,
        badges: []
    });

    useEffect(() => {
        if (!user?.id || user.id === 'guest') return;

        // Listen to live updates from Firestore
        const unsubscribe = listenToGamification(user.id, (liveStats) => {
            setStats(liveStats);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const progress = Math.min((stats.score / 1000) * 100, 100);

    const isMr = user?.language === 'mr';

    // Determine level based on score dynamically
    let levelTitle = isMr ? 'मास्टर शेतकरी' : 'Master Farmer';
    let levelSubtitle = isMr ? 'सर्वोच्च रँक प्राप्त! 🌟' : 'Max rank achieved! 🌟';

    if (stats.score < 200) {
        levelTitle = isMr ? 'नवशिका शेतकरी' : 'Novice Farmer';
        const needed = 200 - stats.score;
        levelSubtitle = isMr ? `पुढील रँकसाठी ${needed} पॉइंट्स हवेत!` : `${needed} points to next rank!`;
    } else if (stats.score < 1000) {
        levelTitle = isMr ? 'प्रगत शेतकरी' : 'Advanced Farmer';
        const needed = 1000 - stats.score;
        levelSubtitle = isMr ? `पुढील रँकसाठी ${needed} पॉइंट्स हवेत!` : `${needed} points to next rank!`;
    }

    return (
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 border border-amber-400/30 shadow-[0_20px_50px_rgba(245,158,11,0.2)] text-white">
            {/* 3D Lighting Accents */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-yellow-300/30 rounded-full blur-[50px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-rose-400/40 rounded-full blur-[40px] pointer-events-none" />

            {/* Glowing inner shadow */}
            <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(255,255,255,0.1)] pointer-events-none" />

            <div className="relative z-10 p-7 flex flex-col items-center justify-center text-center">

                {/* Header */}
                <div className="w-full flex justify-between items-start mb-2">
                    <div className="flex bg-white/20 backdrop-blur-md rounded-full px-3 py-1 items-center gap-1.5 border border-white/20 shadow-sm">
                        <Flame size={14} className="text-yellow-300" />
                        <span className="text-xs font-black tracking-wider uppercase drop-shadow-sm text-yellow-50">{t('gamify.streak')} {stats.streak} {t('gamify.days')}</span>
                    </div>
                    <button className="text-white/60 hover:text-white transition-colors">
                        <Info size={20} />
                    </button>
                </div>

                {/* Score Circle */}
                <div className="relative w-36 h-36 mb-4 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-white/20"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <motion.path
                            className="text-yellow-300"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${progress}, 100` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ filter: "drop-shadow(0 0 4px rgba(253,224,71,0.5))" }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-md">
                        <Trophy size={20} className="mb-0.5 text-yellow-300" />
                        <span className="text-3xl font-black leading-none tracking-tighter">{stats.score}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-1">{t('gamify.score')}</span>
                    </div>
                </div>

                <h3 className="text-2xl font-black tracking-tight drop-shadow-md mb-1">{levelTitle}</h3>
                <p className="text-sm font-semibold text-white/80 max-w-[200px] mb-6 leading-snug drop-shadow-sm">
                    {levelSubtitle}
                </p>

                {/* Badges/Achievements Row */}
                <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                    <div className={`bg-black/10 backdrop-blur-sm border ${stats.badges.includes('Soil Saver') ? 'border-emerald-400/50' : 'border-white/20 opacity-50'} rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner hover:bg-black/20 transition-colors cursor-pointer group`}>
                        <div className={`w-8 h-8 rounded-full ${stats.badges.includes('Soil Saver') ? 'bg-emerald-400 text-white shadow-lg shadow-emerald-500/50' : 'bg-slate-700 text-slate-400'} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                            <ShieldCheck size={16} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-black ${stats.badges.includes('Soil Saver') ? 'text-emerald-100' : 'text-slate-400'}`}>{t('gamify.badge1')}</span>
                    </div>

                    <div className={`bg-black/10 backdrop-blur-sm border ${stats.badges.includes('Tech Guru') ? 'border-blue-400/50' : 'border-white/20 opacity-50'} rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner hover:bg-black/20 transition-colors cursor-pointer group`}>
                        <div className={`w-8 h-8 rounded-full ${stats.badges.includes('Tech Guru') ? 'bg-blue-400 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-700 text-slate-400'} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                            <Star size={16} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-black ${stats.badges.includes('Tech Guru') ? 'text-blue-100' : 'text-slate-400'}`}>{t('gamify.badge2')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
