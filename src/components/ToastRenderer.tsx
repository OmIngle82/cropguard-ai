import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useToastStore, type ToastType } from '../services/ToastService';
import { createPortal } from 'react-dom';

const CONFIG: Record<ToastType, {
    icon: React.ElementType;
    bg: string;
    border: string;
    iconBg: string;
    title: string;
}> = {
    success: {
        icon: CheckCircle2,
        bg: 'bg-white',
        border: 'border-emerald-100',
        iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
        title: 'text-slate-800',
    },
    error: {
        icon: XCircle,
        bg: 'bg-white',
        border: 'border-red-100',
        iconBg: 'bg-gradient-to-br from-red-400 to-red-600',
        title: 'text-slate-800',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-white',
        border: 'border-amber-100',
        iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        title: 'text-slate-800',
    },
    info: {
        icon: Info,
        bg: 'bg-white',
        border: 'border-sky-100',
        iconBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
        title: 'text-slate-800',
    },
};

export default function ToastRenderer() {
    const { toasts, dismiss } = useToastStore();

    return createPortal(
        <div
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
            aria-live="polite"
        >
            <AnimatePresence mode="sync" initial={false}>
                {toasts.map((t) => {
                    const c = CONFIG[t.type];
                    const Icon = c.icon;
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.92, x: 30 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.88, x: 40, transition: { duration: 0.2 } }}
                            transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.8 }}
                            className={`
                                pointer-events-auto flex items-start gap-4
                                ${c.bg} ${c.border} border
                                rounded-[1.75rem] shadow-[0_20px_40px_rgba(0,0,0,0.12)]
                                p-4 max-w-[340px] w-[340px] backdrop-blur-md
                                will-change-transform transform-gpu
                            `}
                        >
                            {/* Icon */}
                            <div className={`w-11 h-11 rounded-[1.25rem] ${c.iconBg} flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.35)]`}>
                                <Icon size={20} className="drop-shadow-sm" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className={`font-black text-[15px] leading-tight ${c.title}`}>{t.title}</p>
                                {t.message && (
                                    <p className="text-[13px] font-medium text-slate-500 mt-1 leading-snug">{t.message}</p>
                                )}
                            </div>

                            {/* Dismiss */}
                            <button
                                onClick={() => dismiss(t.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0 active:scale-90 mt-0.5"
                            >
                                <X size={15} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>,
        document.body
    );
}
