import { Bell, X, Check, Trash2, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';
import { useNotificationStore, type Notification } from '../services/NotificationService';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
    onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
    const { notifications, markAsRead, markAllAsRead, clearAll, dismissNotification } = useNotificationStore();



    return (
        <div className="fixed inset-0 z-[100] flex justify-end items-start p-4 sm:p-6 md:p-8 pointer-events-none">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* Floating Premium 3D Panel */}
            <motion.div
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                className="relative w-full max-w-md bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-3xl h-auto max-h-[calc(100vh-4rem)] rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15),inset_1px_0_0_rgba(255,255,255,0.7)] border border-white/60 flex flex-col overflow-hidden pointer-events-auto will-change-transform transform-gpu"
            >
                {/* 3D Lighting Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute bottom-1/4 left-[-10%] w-48 h-48 bg-purple-100/40 rounded-full blur-[40px] pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 p-6 border-b border-white shadow-sm flex items-center justify-between bg-white/40">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
                            <Bell size={22} className="drop-shadow-sm" />
                        </div>
                        <div>
                            <h2 className="text-[22px] font-black text-slate-800 tracking-tight leading-none drop-shadow-sm">Notifications</h2>
                            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Farm Alerts & Updates</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/60 hover:bg-white backdrop-blur-md rounded-xl transition-all border border-white shadow-sm text-slate-400 hover:text-slate-700 active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Actions */}
                {notifications.length > 0 && (
                    <div className="relative z-10 px-6 py-3 border-b border-white flex justify-between bg-white/40">
                        <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                            <Check size={14} />
                            Mark all read
                        </button>
                        <button
                            onClick={clearAll}
                            className="text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                            <Trash2 size={14} />
                            Clear all
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-24 h-24 bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] flex items-center justify-center opacity-80">
                                <Bell size={40} className="text-slate-300 drop-shadow-sm" />
                            </div>
                            <div>
                                <p className="text-[20px] font-black text-slate-700 drop-shadow-sm">All caught up!</p>
                                <p className="text-[13px] font-bold text-slate-400 mt-1">No new alerts for your farm at the moment.</p>
                            </div>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onRead={() => markAsRead(n.id)}
                                onDismiss={() => dismissNotification(n.id)}
                            />
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function NotificationItem({
    notification: n,
    onRead,
    onDismiss
}: {
    notification: Notification,
    onRead: () => void,
    onDismiss: () => void
}) {
    const Icon = n.type === 'alert' ? AlertTriangle : n.type === 'success' ? CheckCircle2 : Info;
    const gradientClass = n.type === 'alert'
        ? 'from-orange-400 to-red-500 shadow-orange-500/30'
        : n.type === 'success'
            ? 'from-emerald-400 to-emerald-600 shadow-emerald-500/30'
            : 'from-sky-400 to-blue-500 shadow-blue-500/30';

    return (
        <div
            onClick={onRead}
            className={clsx(
                "p-4 rounded-[1.5rem] transition-all cursor-pointer group hover:-translate-y-1 duration-300",
                n.read
                    ? "bg-white/40 backdrop-blur-md border border-white shadow-sm opacity-60 hover:opacity-100 hover:shadow-md"
                    : "bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.12)] ring-1 ring-indigo-500/10"
            )}
        >
            <div className="flex gap-4">
                <div className={clsx("w-11 h-11 rounded-[1.25rem] bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0 transition-transform group-hover:rotate-6 shadow-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]", gradientClass)}>
                    <Icon size={20} className="drop-shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={clsx("font-black text-[15px] truncate drop-shadow-sm", n.read ? "text-slate-600" : "text-slate-800")}>
                            {n.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-0.5 shadow-sm shadow-indigo-500/40 animate-pulse" />}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss();
                                }}
                                className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <p className="text-[13px] font-bold text-slate-500 leading-relaxed mb-3">
                        {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={12} />
                        {formatDistanceToNow(n.timestamp)} ago
                    </div>
                </div>
            </div>
        </div>
    );
}
