import { AnimatePresence, motion } from 'framer-motion';
import { useConfirmStore } from '../services/ConfirmService';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';

export default function ConfirmRenderer() {
    const { isOpen, options, close } = useConfirmStore();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => close(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${options.isDestructive ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <AlertCircle size={28} />
                            </div>

                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-2">
                                {options.title}
                            </h2>
                            <p className="text-[14px] font-medium text-slate-500 mb-6">
                                {options.message}
                            </p>

                            <div className="w-full flex gap-3">
                                <button
                                    onClick={() => close(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
                                >
                                    {options.cancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={() => close(true)}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold active:scale-[0.98] transition-all text-white ${options.isDestructive
                                            ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20'
                                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                                        }`}
                                >
                                    {options.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
