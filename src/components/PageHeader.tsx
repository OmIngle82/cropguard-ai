import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { useNotificationStore } from '../services/NotificationService';

interface PageHeaderProps {
    icon?: React.ReactNode;
    title: string;
    badge?: string;
    subtitle?: string;
    rightSlot?: React.ReactNode;
    showBack?: boolean;
    showNotifications?: boolean;
    className?: string;
    /** Dark variant — for pages with dark backgrounds */
    dark?: boolean;
}

/**
 * Premium page header — two variants:
 * Default: frosted glass pill (light pages)
 * Dark: dark frosted pill with emerald accent (dark pages)
 */
export default function PageHeader({
    icon,
    title,
    badge,
    subtitle,
    rightSlot,
    showBack = false,
    showNotifications = true,
    className,
    dark = false,
}: PageHeaderProps) {
    const navigate = useNavigate();
    const { setUiState } = useStore();
    const { getUnreadCount } = useNotificationStore();
    const unread = getUnreadCount();

    return (
        <header className={clsx(
            "sticky md:static top-3 md:top-0 md:mt-8 z-40 -mx-3 md:mx-0 px-3 md:px-0 mb-8 transition-all duration-300 group",
            className
        )}>
            <div className="relative md:max-w-[98%] mx-auto hover:-translate-y-0.5 transition-transform duration-300">

                {/* Background pill */}
                <div className={clsx(
                    "absolute inset-0 backdrop-blur-2xl rounded-[1.5rem] border-[2px] transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]",
                    dark
                        ? "bg-gray-950/90 border-white/10"
                        : "bg-white/85 border-white/60"
                )} />

                {/* 3D Lighting Accents */}
                <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
                    <div className={clsx(
                        "absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[30px]",
                        dark ? "bg-emerald-500/10" : "bg-emerald-400/20"
                    )} />
                    <div className={clsx(
                        "absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-[30px]",
                        dark ? "bg-sky-500/10" : "bg-sky-400/20"
                    )} />
                </div>

                {/* Subtle gradient overlay */}
                <div className={clsx(
                    "absolute inset-0 rounded-[1.5rem] pointer-events-none",
                    dark
                        ? "bg-gradient-to-r from-emerald-500/5 to-transparent"
                        : "bg-gradient-to-br from-white/60 via-emerald-50/40 to-transparent"
                )} />

                {/* Content */}
                <div className="relative px-3 py-2.5 flex items-center gap-2.5 z-10">

                    {/* Back button */}
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className={clsx(
                                "p-2 rounded-xl transition-all active:scale-90 flex-shrink-0",
                                dark
                                    ? "hover:bg-white/8 text-white/60 hover:text-white"
                                    : "hover:bg-black/5 text-gray-700"
                            )}
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>
                    )}

                    {/* Icon */}
                    {icon && (
                        <div className={clsx(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            dark
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-gradient-to-br from-primary-50 to-emerald-100 text-primary-600 shadow-sm"
                        )}>
                            {icon}
                        </div>
                    )}

                    {/* Title block */}
                    <div className="flex-1 min-w-0">
                        <h2 className={clsx(
                            "text-[15px] font-black truncate tracking-tight leading-tight flex items-center gap-2",
                            dark ? "text-white" : "text-gray-900"
                        )}>
                            {title}
                            {badge && (
                                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
                                    {badge}
                                </span>
                            )}
                        </h2>
                        {subtitle && (
                            <p className={clsx(
                                "text-[10px] font-semibold truncate leading-tight mt-0.5 uppercase tracking-wider",
                                dark ? "text-white/35" : "text-gray-400"
                            )}>
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {showNotifications && (
                            <button
                                onClick={() => setUiState({ isNotifOpen: true })}
                                className={clsx(
                                    "md:hidden relative p-2 rounded-xl transition-all active:scale-90",
                                    dark
                                        ? "hover:bg-white/8 text-white/40 hover:text-white"
                                        : "hover:bg-black/5 text-gray-400 hover:text-gray-700"
                                )}
                            >
                                <Bell size={18} />
                                {unread > 0 && (
                                    <span className={clsx(
                                        "absolute top-1.5 right-1.5 w-2 h-2 rounded-full border",
                                        dark ? "bg-orange-400 border-gray-950" : "bg-orange-500 border-white"
                                    )} />
                                )}
                            </button>
                        )}
                        {rightSlot}
                    </div>
                </div>
            </div>
        </header>
    );
}

interface HeaderActionProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    primary?: boolean;
    dark?: boolean;
}

export function HeaderAction({ icon, label, onClick, primary = false, dark = false }: HeaderActionProps) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-2.5 md:px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm",
                primary
                    ? "bg-gradient-to-br from-primary-500 to-emerald-600 text-white shadow-primary-500/30 hover:shadow-primary-500/50"
                    : dark
                        ? "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white border border-white/10"
                        : "bg-white/80 text-gray-700 hover:bg-white border border-white/40 hover:border-gray-200"
            )}
        >
            <span className={primary ? "text-white" : dark ? "text-emerald-400" : "text-primary-600"}>{icon}</span>
            <span className="hidden md:inline">{label}</span>
        </button>
    );
}
