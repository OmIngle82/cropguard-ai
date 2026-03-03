import { useState, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { getHistory, deleteLog, type DiagnosisLog } from '../services/db';
import { Trash2, Sprout, History as HistoryIcon, CheckCircle2, Camera, FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import PageHeader from '../components/PageHeader';

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 2800);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <div className="fixed bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-[13px] font-semibold animate-fade-in pointer-events-none">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            {message}
        </div>
    );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white flex gap-4 items-center relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-100 rounded-l-3xl" />
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0 animate-pulse ml-1" />
            <div className="flex-1 space-y-2.5 ml-1">
                <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-5 bg-gray-100 rounded-full w-14 animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded-full w-12 animate-pulse" />
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm Panel ───────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    const { t } = useT();
    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white backdrop-blur-2xl border-[2px] border-white rounded-[2rem] w-full max-w-sm p-7 shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                {/* 3D Lighting Accents */}
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-200/50 rounded-full blur-[40px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center gap-4 mb-7">
                    <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-xl leading-tight">{t('hist.deleteConfirm')}</h3>
                        <p className="text-gray-500 text-[14px] font-medium mt-1.5 leading-relaxed">{t('hist.deleteWarn')}</p>
                    </div>
                </div>
                <div className="relative z-10 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-200"
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function History() {
    const [logs, setLogs] = useState<DiagnosisLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDelete, setPendingDelete] = useState<number | null>(null);
    const [toast, setToast] = useState('');
    const navigate = useNavigate();
    const { user } = useStore();

    const loadHistory = async () => {
        try {
            if (!user?.id) return;
            const data = await getHistory(user.id);
            setLogs(data);
        } catch (e) {
            console.error('Failed to load history', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadHistory(); }, []);

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        await deleteLog(pendingDelete);
        setPendingDelete(null);
        setToast('Diagnosis record deleted');
        loadHistory();
    };

    const severityBadge = (s: string) =>
        s === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
            s === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                'bg-green-50 text-green-700 border-green-100';

    const { t } = useT();

    return (
        <div className="min-h-screen bg-surface pb-28 md:pb-10">

            <PageHeader
                icon={<HistoryIcon size={20} />}
                title={t('hist.title')}
                subtitle={t('ph.history')}
                rightSlot={logs.length > 0 && (
                    <div className="bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-xl">
                        <span className="text-primary-700 font-black text-[13px]">{logs.length}</span>
                        <span className="text-primary-500 text-[11px] font-medium ml-1">{t('hist.records')}</span>
                    </div>
                )}
            />

            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
                <AnimatePresence mode="wait">
                    {/* Loading skeletons */}
                    {loading ? (
                        <motion.div
                            key="skeleton-container"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={{
                                animate: { transition: { staggerChildren: 0.06 } }
                            }}
                            className="space-y-3"
                        >
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    variants={{
                                        initial: { opacity: 0, y: 10 },
                                        animate: { opacity: 1, y: 0 },
                                        exit: { opacity: 0, scale: 0.98 }
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <SkeletonCard />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : logs.length === 0 ? (
                        /* Empty state */
                        <motion.div
                            key="empty-state"
                            initial={{ opacity: 0, scale: 0.98, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="text-center py-20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-[2px] border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-200/50 rounded-full blur-[40px] pointer-events-none" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-200/40 rounded-full blur-[30px] pointer-events-none" />

                            <div className="relative z-10 w-20 h-20 bg-white shadow-lg shadow-emerald-100 border border-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5 drop-shadow-sm">
                                <Sprout size={36} className="text-emerald-400" />
                            </div>
                            <h3 className="relative z-10 text-xl font-black text-gray-900 drop-shadow-sm">No History Yet</h3>
                            <p className="relative z-10 text-gray-500 text-sm font-medium mt-2 mb-8 leading-relaxed">Your past diagnoses will appear here.</p>
                            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
                                <button
                                    onClick={() => navigate('/diagnosis')}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5"
                                >
                                    <Camera size={16} /> Start Diagnosis
                                </button>
                                <button
                                    onClick={() => navigate('/soil')}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm border border-white text-gray-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-white shadow-sm transition-all"
                                >
                                    <FlaskConical size={16} /> Analyze Soil Card
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Log cards */
                        <motion.div
                            key="logs-container"
                            initial="initial"
                            animate="animate"
                            variants={{
                                animate: { transition: { staggerChildren: 0.05 } }
                            }}
                            className="space-y-3"
                        >
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    layout
                                    variants={{
                                        initial: { opacity: 0, y: 12, scale: 0.99 },
                                        animate: { opacity: 1, y: 0, scale: 1 },
                                    }}
                                    transition={{
                                        type: "spring",
                                        damping: 20,
                                        stiffness: 150,
                                        mass: 0.8
                                    }}
                                    className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white flex gap-4 items-center group hover:shadow-[0_15px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden transform-gpu will-change-transform"
                                >
                                    {/* Image thumbnail */}
                                    <div className="w-[72px] h-[72px] bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden border border-gray-200 ml-1 shadow-inner relative z-10">
                                        {log.imageUrl ? (
                                            <img src={log.imageUrl} alt={log.crop} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Sprout size={22} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 py-0.5 relative z-10">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-black text-gray-900 text-[15px] leading-tight truncate pr-1">{log.diseaseName}</h3>
                                            <span className="text-[10px] text-gray-400 font-bold bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-white flex-shrink-0 shadow-sm">
                                                {log.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-gray-500 font-bold mb-2">{log.crop}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={clsx("text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide border", severityBadge(log.severity))}>
                                                {log.severity}
                                            </span>
                                            {log.confidence > 0 && (
                                                <span className="text-[10.5px] text-gray-400 font-black tracking-wide">
                                                    {(log.confidence * 100).toFixed(0)}% <span className="text-[9px] uppercase tracking-wider text-gray-300">Conf</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e: MouseEvent) => { e.stopPropagation(); if (log.id) setPendingDelete(log.id); }}
                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-white bg-gray-50/50 border border-transparent hover:border-red-100 rounded-xl transition-all z-20 flex-shrink-0 shadow-sm hover:shadow-md group-hover:bg-white group-hover:border-gray-100"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Delete confirm modal */}
            {pendingDelete !== null && (
                <DeleteConfirm
                    onConfirm={confirmDelete}
                    onCancel={() => setPendingDelete(null)}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast} onDone={() => setToast('')} />}
        </div>
    );
}
