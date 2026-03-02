import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getUserConsultations, type ConsultationRequest } from '../services/ExpertConsultationService';
import {
    MessageSquare, Clock, CheckCircle2, UserCheck, MapPin, Calendar, AlertCircle, Sprout, BadgeCheck, ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader, { HeaderAction } from '../components/PageHeader';

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-100 rounded-l-2xl" />
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 animate-pulse ml-1" />
            <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
            </div>
            <div className="h-7 w-24 bg-gray-100 rounded-xl animate-pulse self-start flex-shrink-0" />
        </div>
    );
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ConsultationRequest['status'], {
    icon: React.ReactNode; label: string; badge: string; dot: string; strip: string;
}> = {
    pending: {
        icon: <Clock size={14} />,
        label: 'Pending Review',
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        strip: 'bg-orange-400',
    },
    assigned: {
        icon: <UserCheck size={14} />,
        label: 'Under Review',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        strip: 'bg-blue-400',
    },
    resolved: {
        icon: <CheckCircle2 size={14} />,
        label: 'Resolved',
        badge: 'bg-green-50 text-green-700 border-green-200',
        dot: 'bg-green-500',
        strip: 'bg-green-500',
    },
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ExpertConsultation() {
    const { user } = useStore();
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'resolved'>('all');

    useEffect(() => {
        if (!user?.id) return;
        getUserConsultations(user.id)
            .then(data => setConsultations(data))
            .catch(e => console.error('Failed to load consultations:', e))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const filtered = consultations.filter(c => filter === 'all' || c.status === filter);

    return (
        <div className="min-h-screen bg-surface pb-28 md:pb-10">

            <PageHeader
                icon={<MessageSquare size={20} />}
                title="My Consultations"
                subtitle="Track your expert requests"
                rightSlot={
                    <HeaderAction
                        icon={<ArrowRight size={13} />}
                        label="Book Expert"
                        onClick={() => navigate('/experts')}
                    />
                }
            />

            <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">

                {/* Info card */}
                <div className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-[2rem] p-6 text-white overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.15)] group animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/30 transition-colors duration-500" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />
                    <div className="absolute inset-0 border-[2px] border-white/10 rounded-[2rem] pointer-events-none" />
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BadgeCheck size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-[16px] mb-1.5 leading-tight">Professional Agricultural Support</h3>
                            <p className="text-white/75 text-[13px] font-medium leading-relaxed max-w-lg">
                                Connect with certified agronomists. Track all your consultation requests here.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-[2px] border-white flex gap-1 overflow-x-auto">
                    {(['all', 'pending', 'assigned', 'resolved'] as const).map(status => {
                        const count = status === 'all' ? consultations.length : consultations.filter(c => c.status === status).length;
                        return (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={clsx(
                                    'flex-shrink-0 px-4 py-2 rounded-xl font-bold text-[13px] transition-all flex items-center gap-2',
                                    filter === status ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-white hover:text-gray-800'
                                )}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                {count > 0 && (
                                    <span className={clsx('px-1.5 py-0.5 rounded-full text-[11px] font-black',
                                        filter === status ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Loading skeletons */}
                {loading && (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-[2px] border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-200/50 rounded-full blur-[40px] pointer-events-none" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-200/40 rounded-full blur-[30px] pointer-events-none" />

                        <div className="relative z-10 w-20 h-20 bg-white shadow-lg shadow-emerald-100 border border-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5 drop-shadow-sm">
                            <Sprout size={36} className="text-emerald-400" />
                        </div>
                        <h3 className="relative z-10 font-black text-gray-900 text-xl drop-shadow-sm">
                            {filter === 'all' ? 'No Consultations Yet' : `No ${filter} consultations`}
                        </h3>
                        <p className="relative z-10 text-gray-500 text-sm font-medium mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
                            {filter === 'all'
                                ? 'Book a session with a certified agronomist to get professional crop advice.'
                                : `You have no ${filter} consultation requests right now.`}
                        </p>
                        <button
                            onClick={() => navigate('/experts')}
                            className="relative z-10 flex items-center justify-center gap-2 mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5"
                        >
                            Book an Expert <ArrowRight size={15} />
                        </button>
                    </div>
                )}

                {/* Consultation cards */}
                {!loading && (
                    <div className="space-y-4">
                        {filtered.map(consultation => {
                            const cfg = STATUS_CONFIG[consultation.status];
                            return (
                                <div
                                    key={consultation.id}
                                    className="bg-gradient-to-br from-white via-emerald-50/20 to-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 border-[2px] border-white transition-all duration-300 overflow-hidden relative"
                                >
                                    <div className="p-5">
                                        {/* Header row */}
                                        <div className="flex items-start gap-4 mb-4">
                                            {/* Thumbnail */}
                                            <div className="w-[68px] h-[68px] bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-200">
                                                {consultation.imageUrl ? (
                                                    <img src={consultation.imageUrl} alt={consultation.cropType} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Sprout size={22} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-gray-900 text-[15px] leading-tight mb-0.5">{consultation.disease}</h3>
                                                <p className="text-[12px] text-gray-500 font-semibold mb-2">{consultation.cropType}</p>
                                                <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {consultation.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    </span>
                                                    {consultation.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={11} />{consultation.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status badge */}
                                            <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black flex-shrink-0', cfg.badge)}>
                                                <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                                                {cfg.icon}
                                                <span className="hidden sm:inline">{cfg.label}</span>
                                            </div>
                                        </div>

                                        {/* Symptoms */}
                                        {consultation.symptoms?.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1.5">Symptoms</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {consultation.symptoms.map((s, i) => (
                                                        <span key={i} className="px-2.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded-full text-[11px] font-medium">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {consultation.farmerNotes && (
                                            <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide mb-1">Your Notes</p>
                                                <p className="text-[13px] text-blue-900 font-medium leading-snug">{consultation.farmerNotes}</p>
                                            </div>
                                        )}

                                        {/* Expert response */}
                                        {consultation.expertResponse && (
                                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <UserCheck size={16} className="text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-green-700 uppercase tracking-wide mb-1">
                                                            Expert Response{consultation.expertName && ` · ${consultation.expertName}`}
                                                        </p>
                                                        <p className="text-[13px] text-green-900 leading-relaxed font-medium">{consultation.expertResponse}</p>
                                                        {consultation.resolvedAt && (
                                                            <p className="text-[11px] text-green-500 mt-1.5 font-medium">
                                                                Resolved {consultation.resolvedAt.toLocaleDateString('en-IN')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pending notice */}
                                        {consultation.status === 'pending' && (
                                            <div className="flex items-center gap-2 text-[12px] text-orange-700 bg-orange-50 border border-orange-100 rounded-xl p-3 mt-1">
                                                <AlertCircle size={14} className="flex-shrink-0" />
                                                Waiting for expert assignment. You'll be notified when an expert reviews your case.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
