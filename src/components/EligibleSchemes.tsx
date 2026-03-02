import { useStore } from '../store/useStore';
import { checkSchemeEligibility } from '../services/SchemeService';
import { ArrowRight, Landmark, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export default function EligibleSchemes() {
    const { user: profile } = useStore();
    const navigate = useNavigate();

    const schemesWithEligibility = useMemo(() => {
        if (!profile) return [];
        return checkSchemeEligibility(profile);
    }, [profile]);

    const matchingCount = schemesWithEligibility.filter(s => s.isEligible).length;

    if (!profile) return null;

    return (
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#ffedd5] via-[#fff7ed] to-[#fed7aa]/20 border-[2px] border-white shadow-[0_20px_50px_rgba(249,115,22,0.15)] animate-slide-in-right group" style={{ animationDelay: '0.2s' }}>
            {/* 3D Lighting Accents */}
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/60 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-orange-200/40 rounded-full blur-[30px] pointer-events-none" />

            {/* Header */}
            <div className="relative px-7 pt-7 pb-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <h3 className="text-slate-800 font-black text-xl tracking-tight drop-shadow-sm">Am I Eligible?</h3>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.15em] mt-1">Schemes for you</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-3xl font-black text-slate-800 leading-none drop-shadow-sm">{matchingCount}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Matches</span>
                </div>
            </div>

            {/* Scheme List */}
            <div className="relative z-10 px-7 pb-6 space-y-3">
                {schemesWithEligibility.slice(0, 2).map((scheme) => (
                    <div
                        key={scheme.id}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white/60 backdrop-blur-md shadow-sm hover:scale-[1.02] hover:bg-white/80 hover:shadow-md ${scheme.isEligible
                            ? 'border-orange-100/50 hover:border-orange-300'
                            : 'border-white/50 hover:border-gray-200'
                            }`}
                        onClick={() => navigate('/schemes')}
                    >
                        <div className="flex justify-between items-start gap-3">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight flex-1">
                                {scheme.title}
                            </h4>
                            {scheme.isEligible ? (
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={14} className="text-orange-500" />
                                </div>
                            ) : (
                                <ChevronRight size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white/80 px-2 py-1 rounded-lg border border-white text-slate-500 uppercase tracking-wider shadow-sm">
                                {scheme.category}
                            </span>
                            <span className="text-[11px] font-black text-orange-600 tracking-tight">
                                {scheme.matchScore.toFixed(0)}% Match
                            </span>
                        </div>
                    </div>
                ))}

                {/* Explore Button */}
                <button
                    onClick={() => navigate('/schemes')}
                    className="w-full flex items-center justify-between p-4 mt-4 rounded-3xl bg-gradient-to-r from-orange-400 to-amber-500 shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_25px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 transition-all duration-300 group ring-2 ring-white/20"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-left">
                            <p className="text-sm font-black text-white tracking-tight uppercase">Explore Dashboard</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors shadow-sm">
                        <ArrowRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </button>
            </div>
        </section>
    );
}
