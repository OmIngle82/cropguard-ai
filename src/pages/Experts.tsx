import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, MessageCircle, Star, BadgeCheck, Video, X, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { getExperts, type Expert } from '../services/ExpertService';
import { createConsultationRequest } from '../services/ExpertConsultationService';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import PageHeader, { HeaderAction } from '../components/PageHeader';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ── Booking modal states ───────────────────────────────────────────────────────
type ModalState = 'form' | 'loading' | 'success' | 'error';

function BookingModal({
    expert,
    userId,
    userAddress,
    onClose,
}: {
    expert: Expert;
    userId: string;
    userAddress: string;
    onClose: () => void;
}) {
    const [note, setNote] = useState('');
    const [date, setDate] = useState('');
    const [state, setState] = useState<ModalState>('form');
    const [errorMsg, setErrorMsg] = useState('');

    const handleBook = async () => {
        setState('loading');
        try {
            await createConsultationRequest({
                userId,
                cropType: 'General Consultation',
                disease: 'Expert Advice',
                imageUrl: '',
                symptoms: [],
                farmerNotes: `Booking with ${expert.name}. Topic: ${note}. Date: ${date}`,
                location: userAddress || 'Unknown',
                expertId: expert.id,
                expertName: expert.name,
            });
            setState('success');
        } catch (e: any) {
            setErrorMsg(e?.message || 'Something went wrong. Please try again.');
            setState('error');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4 pb-[110px] md:p-6 md:pb-6 bg-black/50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white backdrop-blur-2xl border-[2px] border-white rounded-[2rem] w-full max-w-md shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative flex flex-col overflow-hidden max-h-[calc(100vh-130px)] md:max-h-[88vh]">
                {/* 3D Lighting Accents */}
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-200/50 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-200/40 rounded-full blur-[30px] pointer-events-none" />

                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-md border border-white hover:bg-white text-gray-500 hover:text-gray-800 rounded-full transition-colors z-20 shadow-sm">
                    <X size={18} />
                </button>

                <div className="p-7 flex-1 overflow-y-auto min-h-0 relative z-10">

                    {/* Success state */}
                    {state === 'success' && (
                        <div className="flex flex-col items-center text-center py-6 gap-4">
                            <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 text-xl mb-1">Request Sent!</h3>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                    Your consultation request with <strong className="text-gray-700">{expert.name}</strong> has been submitted. They will confirm shortly.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black transition-colors shadow-lg shadow-green-200 mt-2"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Error state */}
                    {state === 'error' && (
                        <div className="flex flex-col items-center text-center py-6 gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 text-lg mb-1">Booking Failed</h3>
                                <p className="text-gray-400 text-sm font-medium">{errorMsg}</p>
                            </div>
                            <button onClick={() => setState('form')} className="w-full py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black transition-colors">
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Form state */}
                    {(state === 'form' || state === 'loading') && (
                        <>
                            {/* Expert preview */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-green-100 shadow-md flex-shrink-0">
                                    <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-[17px] leading-none">{expert.name}</h3>
                                    <p className="text-primary-600 text-[11px] font-bold uppercase tracking-wide mt-0.5">{expert.role}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <Star size={11} className="text-yellow-500" fill="currentColor" />
                                        <span className="text-[12px] font-bold text-gray-700">{expert.rating}</span>
                                        <span className="text-[11px] text-gray-400 font-medium">· {expert.experience}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-black text-gray-700 uppercase tracking-wide mb-2">Consultation Topic *</label>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-[14px] resize-none transition-all shadow-sm"
                                        rows={3}
                                        placeholder="Describe your crop issue or what you'd like to discuss…"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-gray-700 uppercase tracking-wide mb-2">Preferred Date *</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-[14px] transition-all shadow-sm"
                                    />
                                </div>

                                {/* Cost notice */}
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex gap-3 items-start">
                                    <Star className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
                                    <div>
                                        <p className="text-[11px] font-black text-amber-800 uppercase tracking-wide mb-0.5">Premium Feature</p>
                                        <p className="text-[12px] text-amber-700 leading-snug">Video consultations are ₹199/session after the first free trial.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBook}
                                    disabled={state === 'loading' || !note.trim() || !date}
                                    className={clsx(
                                        "w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all shadow-lg",
                                        state === 'loading' || !note.trim() || !date
                                            ? "bg-gray-300 cursor-not-allowed shadow-none"
                                            : "bg-gradient-to-r from-primary-600 to-emerald-600 hover:shadow-primary-200 active:scale-[0.98]"
                                    )}
                                >
                                    {state === 'loading' ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Sending Request…
                                        </>
                                    ) : 'Confirm Booking Request'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Expert card ────────────────────────────────────────────────────────────────
function ExpertCard({
    expert,
    onBook,
    onWhatsApp,
    onCall,
}: {
    expert: Expert;
    onBook: (e: Expert) => void;
    onWhatsApp: (n: string) => void;
    onCall: (n: string) => void;
}) {
    return (
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-white border-[2px] border-white rounded-3xl p-5 hover:shadow-[0_15px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-4 relative overflow-hidden">
            {/* Top: avatar + info */}
            <div className="flex gap-4 items-start relative z-10">
                <div className="relative flex-shrink-0">
                    <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 border-green-100 shadow-md">
                        <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Availability dot */}
                    <span className={clsx(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        expert.available ? "bg-green-500" : "bg-gray-300"
                    )}>
                        {expert.available && <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="font-black text-gray-900 text-[16px] leading-tight">{expert.name}</h3>
                            <p className="text-primary-600 text-[11px] font-bold uppercase tracking-wide mt-0.5">{expert.role}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-xl text-[12px] font-black border border-yellow-100">
                                <Star size={11} fill="currentColor" /> {expert.rating}
                            </div>
                            <span className={clsx(
                                "text-[10px] font-black px-2 py-0.5 rounded-full",
                                expert.available ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-50 text-gray-400 border border-gray-100"
                            )}>
                                {expert.available ? 'Available' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-[12px] font-medium mt-1.5 leading-snug">{expert.specialization}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{expert.experience}</span>
                        <span className="bg-primary-50 border border-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{expert.language}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10">
                <button
                    onClick={() => onWhatsApp(expert.whatsappNumber)}
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-[13px] transition-colors shadow-sm shadow-green-200"
                >
                    <MessageCircle size={15} /> Chat
                </button>
                <button
                    onClick={() => onCall(expert.whatsappNumber)}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-[13px] transition-colors"
                >
                    <Phone size={15} /> Call
                </button>
                <button
                    onClick={() => onBook(expert)}
                    className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-100 text-primary-700 hover:from-primary-100 hover:to-emerald-100 py-2.5 rounded-xl font-bold text-[13px] transition-all group-hover:border-primary-200"
                >
                    <Video size={15} />Book Video Consultation
                </button>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Experts() {
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
    const { user } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        getExperts().then(data => { setExperts(data); setLoading(false); });
    }, []);

    const handleWhatsApp = (number: string) => {
        window.open(`https://wa.me/${number}?text=Hello, I need help with my crop diagnosis.`, '_blank');
    };
    const handleCall = (number: string) => { window.open(`tel:${number}`); };

    return (
        <div className="min-h-screen bg-surface pb-32 md:pb-10">

            <PageHeader
                icon={<BadgeCheck size={20} />}
                title="Expert Consultation"
                subtitle="Connect with certified agronomists"
                rightSlot={
                    <HeaderAction
                        icon={<Users size={13} />}
                        label="My Bookings"
                        onClick={() => navigate('/consultations')}
                    />
                }
            />

            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">

                {/* Hero card */}
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.1 }}
                    className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border-[2px] border-white/10 rounded-3xl p-7 text-white overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.15)] group"
                >
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/30 transition-colors duration-500" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-[22px] font-black mb-2 leading-tight">Need Professional Help?</h2>
                        <p className="text-white/75 text-[13px] font-medium mb-5 max-w-md leading-relaxed">
                            Get personalized advice from verified agronomists. Book a video call, WhatsApp chat, or phone consultation — in your language.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {[
                                { icon: <BadgeCheck size={14} />, label: 'Verified Experts' },
                                { icon: <MessageCircle size={14} />, label: 'Chat & Call' },
                                { icon: <Video size={14} />, label: 'Video Sessions' },
                            ].map(b => (
                                <div key={b.label} className="flex items-center gap-1.5 bg-white/15 border border-white/15 backdrop-blur px-3 py-1.5 rounded-xl text-[12px] font-bold">
                                    {b.icon} {b.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Expert grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 font-bold text-sm">Loading experts…</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {experts.map(expert => (
                            <ExpertCard
                                key={expert.id}
                                expert={expert}
                                onBook={setSelectedExpert}
                                onWhatsApp={handleWhatsApp}
                                onCall={handleCall}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Booking modal */}
            {selectedExpert && (
                <BookingModal
                    expert={selectedExpert}
                    userId={user?.id ?? ''}
                    userAddress={user?.correspondenceAddress ?? ''}
                    onClose={() => setSelectedExpert(null)}
                />
            )}
        </div>
    );
}
