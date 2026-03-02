import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, History, Settings, Sprout, Camera, Bot, FlaskConical, Bell, ChevronRight } from 'lucide-react';
import posthog from 'posthog-js';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { useNotificationStore } from '../services/NotificationService';
import { useT } from '../i18n/useT';
import KisanChat from './KisanChat';
import NotificationCenter from './NotificationCenter';
import { AnimatePresence } from 'framer-motion';

export default function Layout() {
    const navigate = useNavigate();
    const { user: profile, refreshLocation, chatContext, setChatContext, refreshMarketData, marketData, uiState, setUiState } = useStore();
    const { getUnreadCount } = useNotificationStore();

    const safeProfile = profile || { firstName: 'Guest', surname: '', farmSize: '', language: 'en' as const };
    const displayName = profile ? `${profile.firstName} ${profile.surname}`.trim() : 'Guest';

    useEffect(() => {
        if (displayName) {
            posthog.identify(displayName, {
                name: displayName,
                farmSize: safeProfile.farmSize,
                language: safeProfile.language
            });
        }
        refreshLocation();
        refreshMarketData(false);
    }, [displayName, safeProfile.farmSize, safeProfile.language, refreshLocation, refreshMarketData]);

    const { t, lang } = useT();
    const unread = getUnreadCount();

    // Sync document lang attribute for font switching (Devanagari CSS rule)
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const navItems = [
        { icon: Home, label: t('nav.home'), path: '/' },
        { icon: Camera, label: t('nav.diagnose'), path: '/diagnosis' },
        { icon: FlaskConical, label: t('nav.soil'), path: '/soil' },
        { icon: Sprout, label: t('nav.experts'), path: '/experts' },
        { icon: History, label: t('nav.history'), path: '/history' },
        { icon: Settings, label: t('nav.settings'), path: '/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-surface font-sans selection:bg-emerald-100 selection:text-emerald-900">

            {/* ── Desktop Floating Sidebar (Light Premium 3D Redesign) ──────────── */}
            <aside className="hidden md:flex flex-col w-64 fixed top-6 left-6 bottom-6 z-50 bg-gradient-to-br from-[#e0f2fe]/90 via-[#f0f9ff]/90 to-[#fecdd3]/20 backdrop-blur-2xl border-[2px] border-white shadow-[0_20px_50px_rgba(14,165,233,0.15)] rounded-[2.5rem] overflow-hidden">
                {/* 3D Lighting Accents */}
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/60 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-sky-200/40 rounded-full blur-[30px] pointer-events-none" />

                {/* Brand */}
                <div className="relative z-10 px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
                            <Sprout size={20} className="text-white drop-shadow-sm" />
                        </div>
                        <div>
                            <h1 className="text-[17px] font-black text-slate-800 tracking-tight leading-none drop-shadow-sm">CropGuard AI</h1>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">{t('nav.aiAssistant')}</p>
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={() => setUiState({ isNotifOpen: true })}
                        className="relative p-2.5 bg-white/60 backdrop-blur-md border border-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.15)] rounded-full transition-all text-slate-500 hover:text-indigo-600 active:scale-95 group"
                    >
                        <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                        {unread > 0 && (
                            <span className="absolute 0 top-0.5 right-0.5 w-4 h-4 bg-gradient-to-tr from-orange-400 to-red-500 border-[1.5px] border-white text-[9px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-red-500/30">
                                <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-red-400" />
                                <span className="relative">{unread}</span>
                            </span>
                        )}
                    </button>
                </div>

                {/* Nav */}
                <nav className="relative z-10 flex-1 px-4 py-4 mt-2 overflow-y-auto w-full">
                    {/* The animated sliding background pill */}
                    <div
                        className="absolute left-4 right-4 h-[54px] bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none"
                        style={{
                            transform: `translateY(${navItems.findIndex(i => window.location.pathname === i.path || (i.path !== '/' && window.location.pathname.startsWith(i.path))) * (54 + 12)}px)`,
                            opacity: navItems.some(i => window.location.pathname === i.path || (i.path !== '/' && window.location.pathname.startsWith(i.path))) ? 1 : 0
                        }}
                    >
                        {/* Inner 3D detailing for the active pill */}
                        <div className="absolute inset-0 rounded-[1.5rem] shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)] bg-gradient-to-tr from-emerald-700/0 to-white/30" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        </div>
                    </div>

                    {navItems.map((item, index) => {
                        const isActive = window.location.pathname === item.path || (item.path !== '/' && window.location.pathname.startsWith(item.path));

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "relative flex items-center gap-4 px-5 h-[54px] rounded-[1.5rem] font-black text-[15px] transition-all duration-300 group z-10",
                                    index > 0 && "mt-3",
                                    isActive
                                        ? "text-white scale-[1.02]"
                                        : "text-slate-500 hover:text-emerald-700 hover:bg-white/40"
                                )}
                            >
                                <span className={clsx(
                                    "flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-300 shadow-sm",
                                    isActive ? "bg-white/20 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]" : "bg-white/60 group-hover:bg-white group-hover:shadow-lg group-hover:scale-110"
                                )}>
                                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-500"} />
                                </span>
                                <span className="tracking-tight">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Card */}
                <div className="relative z-10 px-4 py-8">
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center gap-3 p-4 rounded-[2.5rem] bg-white/60 hover:bg-white/80 backdrop-blur-md transition-all border border-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] group active:scale-95"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-sky-100 p-0.5 shadow-inner transition-transform group-hover:scale-110">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} alt="User" className="w-full h-full bg-white rounded-[14px]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-[14px] font-black text-slate-800 truncate drop-shadow-sm">{displayName}</p>
                            <p className="text-[11px] text-sky-600 font-bold truncate tracking-tight uppercase">{safeProfile.farmSize} Acres</p>
                        </div>
                        <div className="w-9 h-9 rounded-2xl bg-white/80 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={18} />
                        </div>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────────────────────────── */}
            <main className="flex-1 md:ml-[18rem] overflow-y-auto pb-24 md:pb-6 h-screen">
                <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-6 animate-page-enter">
                    <Outlet />
                </div>
            </main>

            {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
            <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-gradient-to-br from-[#e0f2fe]/95 via-[#f0f9ff]/95 to-[#fecdd3]/30 backdrop-blur-2xl border-[2px] border-white shadow-[0_20px_50px_rgba(14,165,233,0.15)] rounded-[2rem] px-1 py-2 flex justify-between items-center z-50">

                <NavItem to="/" icon={<Home size={20} />} label="Home" />
                <NavItem to="/soil" icon={<FlaskConical size={20} />} label="Soil" />

                {/* Central FAB */}
                <div className="relative -top-7 mx-1">
                    <NavLink
                        to="/diagnosis"
                        className={({ isActive }) => clsx(
                            "flex items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300 active:scale-95 group",
                            isActive
                                ? "bg-gradient-to-br from-primary-400 to-primary-600 border-white shadow-[0_0_0_3px_rgba(16,185,129,0.25),0_8px_24px_rgba(16,185,129,0.45)] scale-105"
                                : "bg-gradient-to-br from-primary-500 to-emerald-700 border-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
                        )}
                    >
                        <Camera size={26} className="text-white group-hover:scale-110 transition-transform duration-200" />
                    </NavLink>
                </div>

                <NavItem to="/experts" icon={<Sprout size={20} />} label="Experts" />
                <NavItem to="/history" icon={<History size={20} />} label="History" />
                <NavItem to="/settings" icon={<Settings size={20} />} label="More" />
            </nav>

            {/* ── AI FAB ───────────────────────────────────────────────────────── */}
            <button
                onClick={() => setChatContext({ isOpen: true })}
                className="fixed bottom-[5.5rem] right-4 md:bottom-8 md:right-8 z-[60]
                           bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                           text-white w-14 h-14 md:w-16 md:h-16 rounded-full
                           shadow-[0_8px_30px_rgba(168,85,247,0.4)] border-2 border-white/50
                           hover:shadow-[0_15px_40px_rgba(168,85,247,0.6)]
                           hover:-translate-y-1 active:scale-95 transition-all duration-300
                           flex items-center justify-center group overflow-hidden
                           animate-bounce"
                style={{ animationDuration: '3s' }}
            >
                {/* Inner Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/60 pointer-events-none animate-pulse" style={{ animationDuration: '2s' }} />
                <Bot size={28} className="relative z-10 drop-shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
            </button>

            {/* Global Chat Companion */}
            <AnimatePresence mode="wait">
                {chatContext.isOpen && (
                    <KisanChat
                        onClose={() => setChatContext({ isOpen: false })}
                        context={{
                            scanResult: chatContext.scanResult,
                            diseaseDetails: chatContext.diseaseDetails,
                            soilReport: chatContext.soilReport,
                            userProfile: profile,
                            weather: useStore.getState().location.weather,
                            marketData: marketData.length > 0 ? marketData : undefined,
                        }}
                        lang={profile?.language || 'en'}
                    />
                )}
            </AnimatePresence>

            {/* Global Notification Center */}
            <AnimatePresence mode="wait">
                {uiState.isNotifOpen && (
                    <NotificationCenter
                        onClose={() => setUiState({ isNotifOpen: false })}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all duration-200 relative",
                isActive ? "text-emerald-700" : "text-slate-500 hover:text-emerald-600"
            )}
        >
            {({ isActive }) => (
                <>
                    <span className={clsx(
                        "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                        isActive ? "bg-white/40 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]" : "bg-white/20 group-hover:bg-white"
                    )}>
                        {icon}
                    </span>
                    <span className={clsx(
                        "text-[9px] uppercase tracking-wider font-bold transition-colors",
                        isActive ? "text-emerald-700" : "text-slate-500"
                    )}>{label}</span>
                </>
            )}
        </NavLink>
    );
}
