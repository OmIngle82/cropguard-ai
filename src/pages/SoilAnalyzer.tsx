import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, ImageIcon, RefreshCw, Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FlaskConical, Leaf, Droplets, ChevronRight, History as HistoryIcon } from 'lucide-react';
import clsx from 'clsx';
import { analyzeSoilCard, saveSoilReport, getSoilHistory, type SoilReport, type NutrientStatus } from '../services/SoilService';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ── Config ─────────────────────────────────────────────────────────────────────

interface NutrientConfig {
    key: keyof Pick<SoilReport, 'ph' | 'ec' | 'organicCarbon' | 'nitrogen' | 'phosphorus' | 'potassium' | 'sulphur' | 'zinc' | 'boron' | 'iron' | 'manganese' | 'copper'>;
    label: string;
    shortLabel: string;
    symbol: string;
    description: string;
    optimalRange: string;
}

const NUTRIENTS: NutrientConfig[] = [
    { key: 'ph', label: 'pH', shortLabel: 'pH', symbol: '⚗️', description: 'Acidity / Alkalinity', optimalRange: '6.0 – 7.5' },
    { key: 'ec', label: 'Electrical Conductivity', shortLabel: 'EC', symbol: '⚡', description: 'Salinity', optimalRange: '< 0.8 dS/m' },
    { key: 'organicCarbon', label: 'Organic Carbon', shortLabel: 'OC', symbol: '🌿', description: 'Soil organic matter', optimalRange: '> 0.75%' },
    { key: 'nitrogen', label: 'Nitrogen', shortLabel: 'N', symbol: '💧', description: 'Available Nitrogen', optimalRange: '> 280 kg/ha' },
    { key: 'phosphorus', label: 'Phosphorus', shortLabel: 'P', symbol: '🔵', description: 'Available Phosphorus', optimalRange: '> 12 kg/ha' },
    { key: 'potassium', label: 'Potassium', shortLabel: 'K', symbol: '🟡', description: 'Available Potassium', optimalRange: '> 280 kg/ha' },
    { key: 'sulphur', label: 'Sulphur', shortLabel: 'S', symbol: '🟠', description: 'Secondary Nutrient', optimalRange: '> 10 ppm' },
    { key: 'zinc', label: 'Zinc', shortLabel: 'Zn', symbol: '🔩', description: 'Micro-nutrient', optimalRange: '> 0.6 ppm' },
    { key: 'boron', label: 'Boron', shortLabel: 'B', symbol: '🔷', description: 'Micro-nutrient', optimalRange: '> 0.5 ppm' },
    { key: 'iron', label: 'Iron', shortLabel: 'Fe', symbol: '🔴', description: 'Micro-nutrient', optimalRange: '> 4.5 ppm' },
    { key: 'manganese', label: 'Manganese', shortLabel: 'Mn', symbol: '🟣', description: 'Micro-nutrient', optimalRange: '> 2.0 ppm' },
    { key: 'copper', label: 'Copper', shortLabel: 'Cu', symbol: '🟤', description: 'Micro-nutrient', optimalRange: '> 0.2 ppm' },
];

const STATUS: Record<NutrientStatus, { label: string; badge: string; bar: string; icon: string }> = {
    deficient: { label: 'Low', badge: 'bg-red-100 text-red-700 border-red-200', bar: 'bg-red-500', icon: '⚠' },
    sufficient: { label: 'Good', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', icon: '✓' },
    excess: { label: 'High', badge: 'bg-amber-100 text-amber-700 border-amber-200', bar: 'bg-amber-400', icon: '↑' },
    unknown: { label: 'N/A', badge: 'bg-gray-100 text-gray-400 border-gray-200', bar: 'bg-gray-200', icon: '?' },
};

// ── Loading screen ─────────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Reading card text…', icon: '📖' },
    { label: 'Detecting nutrients…', icon: '🔬' },
    { label: 'Classifying soil health…', icon: '🧪' },
    { label: 'Building recommendations…', icon: '🌱' },
];

function AnalyzingScreen() {
    const [step, setStep] = useState(0);
    useState(() => {
        const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 2000);
        return () => clearInterval(t);
    });

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
            <div className="relative w-32 h-32 mb-10">
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-spin" style={{ borderTopColor: '#16a34a', animationDuration: '2s' }} />
                <div className="absolute inset-3 rounded-full border-2 border-emerald-100 animate-spin" style={{ borderTopColor: '#059669', animationDuration: '1.4s', animationDirection: 'reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-400/40">
                        <FlaskConical size={34} className="text-white" />
                    </div>
                </div>
            </div>
            <h2 className="font-display font-black text-gray-900 text-2xl mb-1 text-center">Analyzing Your Soil Card</h2>
            <p className="text-gray-400 text-[13px] font-medium mb-10 text-center">Gemini AI Vision is reading the card…</p>
            <div className="w-full max-w-sm space-y-3">
                {STEPS.map((s, i) => (
                    <div key={i} className={clsx(
                        "flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border transition-all duration-500",
                        i < step ? "bg-green-50 border-green-100 opacity-60" :
                            i === step ? "bg-white border-green-200 shadow-lg shadow-green-50" :
                                "bg-gray-50 border-transparent opacity-30"
                    )}>
                        <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0",
                            i < step ? "bg-green-500 text-white" :
                                i === step ? "bg-green-100 text-green-700 animate-pulse" :
                                    "bg-gray-100 text-gray-400"
                        )}>
                            {i < step ? <CheckCircle2 size={16} /> : s.icon}
                        </div>
                        <span className={clsx("text-sm font-semibold", i <= step ? "text-gray-800" : "text-gray-400")}>{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Nutrient card ──────────────────────────────────────────────────────────────

function NutrientCard({ cfg, report }: { cfg: NutrientConfig; report: SoilReport }) {
    const n = report[cfg.key];
    const status = n?.status ?? 'unknown';
    const s = STATUS[status];
    const fill = status === 'deficient' ? 28 : status === 'sufficient' ? 72 : status === 'excess' ? 92 : 0;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg leading-none flex-shrink-0">
                        {cfg.symbol}
                    </div>
                    <div>
                        <p className="font-black text-gray-900 text-[13px] leading-none">{cfg.shortLabel}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{cfg.description}</p>
                    </div>
                </div>
                <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0", s.badge)}>
                    {s.icon} {s.label}
                </span>
            </div>
            <div className="flex items-baseline gap-1.5">
                {n?.value != null ? (
                    <>
                        <span className="font-black text-gray-900 text-2xl leading-none">{n.value}</span>
                        {n.unit && <span className="text-gray-400 text-[12px] font-semibold">{n.unit}</span>}
                    </>
                ) : (
                    <span className="text-gray-300 text-sm font-medium italic">Not detected</span>
                )}
            </div>
            <div className="space-y-1.5">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full transition-all duration-700", s.bar)} style={{ width: `${fill}%` }} />
                </div>
                <p className="text-[9px] text-gray-400 font-semibold tracking-wide">Optimal: {cfg.optimalRange}</p>
            </div>
        </div>
    );
}

// ── Shopping List ─────────────────────────────────────────────────────────────

function ShoppingList({ list, acreage }: { list: SoilReport['shoppingList']; acreage: number }) {
    if (!list || list.length === 0) return null;

    return (
        <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <HistoryIcon size={20} className="text-amber-600" />
                </div>
                <div>
                    <h3 className="font-display font-black text-gray-800 text-lg">Recommended Shopping List</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Quantities for {acreage} {acreage === 1 ? 'Acre' : 'Acres'}</p>
                </div>
            </div>

            <div className="space-y-4">
                {list.map((item, i) => {
                    const totalKg = item.quantityPerAcre * acreage;
                    const bags = Math.ceil(totalKg / 50); // Standard 50kg bags

                    return (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xl shadow-sm">
                                    📦
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 text-[14px] leading-none mb-1">{item.product}</p>
                                    <p className="text-[10px] text-gray-500 font-medium leading-none">{item.purpose}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-green-700 text-sm leading-none mb-1">{totalKg} {item.unit}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{bags} {bags === 1 ? 'Bag' : 'Bags'} (50kg)</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-start gap-3">
                <AlertCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    Always consult your local agronomist before purchase. Dosages are AI-calculated based on typical soil card readings.
                </p>
            </div>
        </section>
    );
}

// ── Formal Report Template (Hidden, for PDF generation) ──────────────────────

function FormalReportTemplate({ report, acreage, printRef }: { report: SoilReport; acreage: number; printRef: React.RefObject<HTMLDivElement | null> }) {
    const primaryNutrients = NUTRIENTS.slice(0, 6);
    const microNutrients = NUTRIENTS.slice(6);

    return (
        <div
            ref={printRef}
            className="p-12 bg-white text-gray-900 font-sans"
            style={{ width: '800px', position: 'absolute', left: '-9999px', top: '0' }}
        >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-green-700 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-green-800 uppercase tracking-tight">CropGuard AI</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Soil Health Diagnostic Report</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Report ID</p>
                    <p className="text-sm font-bold">#SR-{report.cardNumber || Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Generated On</p>
                    <p className="text-sm font-bold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Farmer Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Farmer Details</h3>
                    <p className="text-lg font-black text-gray-800">{report.farmerName || 'Registered Farmer'}</p>
                    <p className="text-sm text-gray-600 mt-1">{report.district}, {report.village}</p>
                    <p className="text-sm text-gray-600">Land Size: <span className="font-bold text-gray-800">{acreage} Acres</span></p>
                </div>
                <div className="text-right">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Sample Information</h3>
                    <p className="text-sm text-gray-600">Sample Date: <span className="font-bold text-gray-800">{report.sampleDate || 'N/A'}</span></p>
                    <p className="text-sm text-gray-600">Card Number: <span className="font-bold text-gray-800">{report.cardNumber || 'N/A'}</span></p>
                    <p className="text-sm text-gray-600">Analyzed by: <span className="font-bold text-green-700">Gemini AI Vision</span></p>
                </div>
            </div>

            {/* Nutrient Tables */}
            <div className="space-y-10">
                <section>
                    <h3 className="text-sm font-black text-gray-800 uppercase mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-green-600 rounded-full"></span>
                        Primary & Macro Nutrients
                    </h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 text-[10px] font-black text-gray-400 uppercase">Nutrient</th>
                                <th className="py-3 text-[10px] font-black text-gray-400 uppercase">Description</th>
                                <th className="py-3 text-[10px] font-black text-gray-400 uppercase text-center">Value</th>
                                <th className="py-3 text-[10px] font-black text-gray-400 uppercase text-center">Status</th>
                                <th className="py-3 text-[10px] font-black text-gray-400 uppercase text-right">Optimal Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {primaryNutrients.map(cfg => {
                                const n = report[cfg.key];
                                const status = n?.status ?? 'unknown';
                                return (
                                    <tr key={cfg.key} className="border-b border-gray-50">
                                        <td className="py-4">
                                            <p className="text-sm font-black text-gray-800">{cfg.symbol} {cfg.label}</p>
                                        </td>
                                        <td className="py-4 text-xs text-gray-500 font-medium">{cfg.description}</td>
                                        <td className="py-4 text-center">
                                            <span className="text-base font-black text-gray-800">{n?.value ?? '-'}</span>
                                            <span className="text-[10px] text-gray-400 font-bold ml-1">{n?.unit}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={clsx(
                                                "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter",
                                                status === 'deficient' ? "bg-red-50 text-red-700" :
                                                    status === 'sufficient' ? "bg-emerald-50 text-emerald-700" :
                                                        status === 'excess' ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-400"
                                            )}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right text-[11px] font-bold text-gray-400">{cfg.optimalRange}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>

                <div className="grid grid-cols-2 gap-10">
                    <section>
                        <h3 className="text-sm font-black text-gray-800 uppercase mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            Micro Nutrients
                        </h3>
                        <div className="space-y-3">
                            {microNutrients.map(cfg => {
                                const n = report[cfg.key];
                                if (!n || n.status === 'unknown') return null;
                                return (
                                    <div key={cfg.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-xs font-black text-gray-800">{cfg.label}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">Optimal: {cfg.optimalRange}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-800">{n.value} <span className="text-[10px] text-gray-400">{n.unit}</span></p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-gray-800 uppercase mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-amber-600 rounded-full"></span>
                            AI Diagnostic Advisory
                        </h3>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-xs text-amber-900 leading-relaxed font-medium italic">
                                "{report.aiRecommendation}"
                            </p>
                        </div>
                    </section>
                </div>

                {/* Shopping List Section */}
                <section className="bg-green-800 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Leaf size={120} />
                    </div>
                    <div className="relative">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-1">Recommended Fertilizer Plan</h3>
                        <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-6">Quantities calculated for {acreage} Acres</p>

                        <div className="grid grid-cols-2 gap-4">
                            {report.shoppingList?.map((item, i) => {
                                const totalKg = item.quantityPerAcre * acreage;
                                const bags = Math.ceil(totalKg / 50);
                                return (
                                    <div key={i} className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                        <div>
                                            <p className="text-sm font-black">{item.product}</p>
                                            <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{item.purpose}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black">{totalKg} {item.unit}</p>
                                            <p className="text-[10px] text-white/60 font-black uppercase">{bags} {bags === 1 ? 'Bag' : 'Bags'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Verification Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-lg mx-auto uppercase tracking-tighter">
                    This report is digitally generated by CropGuard AI. Recommendations are based on typical soil card interpretations.
                    Always verify with local agricultural experts (KVK) before chemical application.
                </p>
                <div className="flex justify-center gap-4 mt-6">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">🏢</div>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">📄</div>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">✅</div>
                </div>
            </div>
        </div>
    );
}

// ── Results view ───────────────────────────────────────────────────────────────

function ResultsView({ report, onRescan }: { report: SoilReport; onRescan: () => void }) {
    const { user: profile } = useStore();
    const [acreage, setAcreage] = useState<number>(Number(profile?.farmSize) || 1);
    const [showMicro, setShowMicro] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const generatePDF = async () => {
        if (!printRef.current) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Soil_Report_${report.farmerName || 'Farmer'}_${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const primary = NUTRIENTS.slice(0, 6);
    const micro = NUTRIENTS.slice(6);
    const visibleMicro = showMicro ? micro : micro.filter(n => report[n.key]?.status !== 'unknown');

    const defCount = NUTRIENTS.filter(n => report[n.key]?.status === 'deficient').length;
    const sufCount = NUTRIENTS.filter(n => report[n.key]?.status === 'sufficient').length;
    const excCount = NUTRIENTS.filter(n => report[n.key]?.status === 'excess').length;

    return (
        <div className="pb-32 md:pb-12 space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onRescan}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <RefreshCw size={14} /> Rescan Card
                </button>
                <button
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0a1a0e] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isGeneratingPDF ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF Report'}
                </button>
            </div>

            {/* Hidden Formal Report for PDF Export */}
            <FormalReportTemplate report={report} acreage={acreage} printRef={printRef} />

            <div ref={reportRef} className="relative p-1 lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start space-y-5 lg:space-y-0 rounded-[2.5rem] bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-[2px] border-white shadow-[0_20px_50px_rgba(16,185,129,0.15)] overflow-hidden">
                {/* 3D Lighting Accents */}
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-200/50 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-200/40 rounded-full blur-[30px] pointer-events-none" />

                {/* ── LEFT column ───────────────────────────────────────────── */}
                <div className="relative z-10 lg:col-span-2 space-y-5">
                    {/* Hero card */}
                    <div className="relative rounded-[2rem] overflow-hidden bg-[#0a1a0e]">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.18),transparent_55%)] pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.10),transparent_50%)] pointer-events-none" />
                        <div className="relative p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                                </span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.18em]">Analysis Complete</span>
                            </div>
                            <h2 className="text-white font-black text-[26px] leading-none mb-1">Soil Health Report</h2>
                            {report.farmerName && (
                                <p className="text-white/80 text-[14px] font-semibold mt-2">👤 {report.farmerName}</p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                                {report.district && <span className="text-white/65 text-[12px] font-medium">📍 {report.district}</span>}
                                {report.village && <span className="text-white/65 text-[12px] font-medium">🏘 {report.village}</span>}
                                {report.sampleDate && <span className="text-white/65 text-[12px] font-medium">📅 {report.sampleDate}</span>}
                                {report.cardNumber && <span className="text-white/65 text-[12px] font-medium">🪪 #{report.cardNumber}</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2.5 mt-5 pt-5 border-t border-white/10">
                                {[
                                    { label: 'Deficient', value: defCount, color: 'text-red-400', sub: 'Need attention' },
                                    { label: 'Sufficient', value: sufCount, color: 'text-emerald-400', sub: 'Healthy' },
                                    { label: 'Excess', value: excCount, color: 'text-amber-400', sub: 'Too high' },
                                ].map(s => (
                                    <div key={s.label} className="bg-white/8 rounded-2xl px-2 py-3 border border-white/8 text-center">
                                        <p className={clsx("font-black text-2xl leading-none", s.color)}>{s.value}</p>
                                        <p className="text-white/75 text-[10px] font-bold mt-1 leading-tight">{s.label}</p>
                                        <p className="text-white/50 text-[9px] font-medium mt-0.5 leading-tight">{s.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Advisory */}
                    {report.aiRecommendation && (
                        <div className="flex items-start gap-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-100 rounded-2xl p-5 shadow-sm">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-300/30">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.15em] mb-1.5">AI Soil Advisory</p>
                                <p className="text-[14px] text-amber-900 leading-relaxed font-medium">{report.aiRecommendation}</p>
                            </div>
                        </div>
                    )}

                    {/* Fertilizer Application Plan */}
                    {report.fertilizerPlan.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Leaf size={14} className="text-emerald-600" />
                                </div>
                                <h3 className="font-display font-black text-gray-800 text-[17px]">Fertilizer Application Plan</h3>
                            </div>
                            <div className="space-y-3">
                                {report.fertilizerPlan.map((step, i) => (
                                    <div key={i} className="group bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-200">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-green-300/30 group-hover:scale-105 transition-transform">
                                            <span className="text-white font-black text-sm">{i + 1}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 text-[14px] leading-none mb-1">{step.stage}</p>
                                            <p className="text-[12px] text-gray-500 font-medium leading-snug">{step.recommendation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Acreage Selector & Shopping List */}
                    {report.shoppingList && report.shoppingList.length > 0 && (
                        <div className="space-y-5">
                            <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display font-black text-gray-800 text-sm uppercase tracking-wider">Total Farm Size</h3>
                                    <span className="text-emerald-600 font-black text-lg">{acreage} Acres</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="50"
                                    step="0.5"
                                    value={acreage}
                                    onChange={(e) => setAcreage(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                    <span>0.5 AC</span>
                                    <span>25 AC</span>
                                    <span>50 AC</span>
                                </div>
                            </section>
                            <ShoppingList list={report.shoppingList} acreage={acreage} />
                        </div>
                    )}
                </div>

                {/* ── RIGHT column ──────────────────────────────────────────── */}
                <div className="relative z-10 lg:col-span-3 space-y-5">
                    {/* Primary Nutrients */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center">
                                <Droplets size={14} className="text-green-600" />
                            </div>
                            <h3 className="font-display font-black text-gray-800 text-[17px]">Primary & Macro Nutrients</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {primary.map(cfg => <NutrientCard key={cfg.key} cfg={cfg} report={report} />)}
                        </div>
                    </section>

                    {/* Micro Nutrients */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-sm">🔬</div>
                            <h3 className="font-display font-black text-gray-800 text-[17px]">Micro Nutrients</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {visibleMicro.map(cfg => <NutrientCard key={cfg.key} cfg={cfg} report={report} />)}
                        </div>
                        {micro.some(n => report[n.key]?.status === 'unknown') && (
                            <button
                                onClick={() => setShowMicro(e => !e)}
                                className="w-full mt-3 flex items-center justify-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-gray-700 py-2 transition-colors"
                            >
                                {showMicro ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showMicro ? 'Hide untested nutrients' : 'Show untested nutrients'}
                            </button>
                        )}
                    </section>
                </div>

                {/* ── Full-width footer ──────────────────────────────────────── */}
                <div className="relative z-10 lg:col-span-5 space-y-3">
                    <button
                        onClick={onRescan}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-[13px] hover:border-green-300 hover:text-green-700 hover:bg-green-50/30 transition-all"
                    >
                        <RefreshCw size={15} /> Scan Another Card
                    </button>
                    <p className="text-[10px] text-gray-300 text-center font-medium pb-2">
                        CropGuard AI v1.0.0 · AI-Powered by Gemini AI Vision · Verify results with your local KVK before applying
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── History View ──────────────────────────────────────────────────────────────

function HistoryView({
    onSelect,
    onNewScan,
    userId
}: {
    onSelect: (r: SoilReport) => void;
    onNewScan: () => void;
    userId: string;
}) {
    const [history, setHistory] = useState<SoilReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSoilHistory(userId).then(data => {
            setHistory(data);
            setLoading(false);
        });
    }, [userId]);

    return (
        <div className="space-y-6 pb-32 md:pb-12">
            <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-gray-800 text-xl">Past Soil Reports</h3>
                <button
                    onClick={onNewScan}
                    className="text-primary-600 font-bold text-sm bg-primary-50 px-4 py-2 rounded-xl hover:bg-primary-100 transition-colors"
                >
                    + New Scan
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold text-sm">Loading history…</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-[2px] border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-200/50 rounded-full blur-[40px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-200/40 rounded-full blur-[30px] pointer-events-none" />
                    <div className="relative z-10">
                        <FlaskConical size={48} className="mx-auto text-emerald-300 mb-4" />
                        <h3 className="text-gray-900 font-black text-lg">No reports yet</h3>
                        <p className="text-gray-400 text-sm mt-1 mb-8">Upload your first soil card to see personal analytics.</p>
                        <button
                            onClick={onNewScan}
                            className="bg-primary-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-primary-200"
                        >
                            Start First Scan
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((h: any) => (
                        <div
                            key={h.id}
                            onClick={() => onSelect(h)}
                            className="bg-gradient-to-br from-white via-emerald-50/30 to-white border-[2px] border-white rounded-3xl p-5 hover:shadow-[0_15px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl" />
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-black text-gray-900 text-base group-hover:text-emerald-600 transition-colors">#{h.cardNumber || 'Unnamed Card'}</p>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                        {new Date(h.analyzedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">pH: {h.ph?.value || 'N/A'}</span>
                                <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">N: {h.nitrogen?.value || 'N/A'}</span>
                                <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">P: {h.phosphorus?.value || 'N/A'}</span>
                                <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">K: {h.potassium?.value || 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Upload view ────────────────────────────────────────────────────────────────

function UploadView({ onFile, dragOver, setDragOver, fileInputRef, handleFileChange }: {
    onFile: (f: File) => void;
    dragOver: boolean;
    setDragOver: (v: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div className="space-y-5 pb-32 md:pb-12">
            <div
                className={clsx(
                    "relative rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 border-[2px] border-white/10 shadow-[0_20px_50px_rgba(16,185,129,0.15)] group animate-slide-in-right",
                    dragOver ? "scale-[1.02]" : "hover:scale-[1.01]"
                )}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900" />
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/30 transition-colors duration-500" />
                <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />
                {dragOver && <div className="absolute inset-0 border-2 border-green-400/60 rounded-[2.5rem] animate-pulse" />}
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-14 px-8 gap-5">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/40">
                            <FlaskConical size={40} className="text-white" />
                        </div>
                        <div className="absolute inset-0 rounded-3xl border-2 border-green-400/30 animate-ping" style={{ animationDuration: '2.5s' }} />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <Upload size={14} className="text-gray-600" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-white font-black text-[22px] leading-tight mb-1.5">Upload Soil Health Card</h2>
                        <p className="text-white/55 text-[13px] font-medium">मृदा स्वास्थ्य कार्ड · Drag & drop or tap to browse</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3.5 py-2 rounded-xl">
                            <ImageIcon size={13} className="text-white/70" />
                            <span className="text-[11px] font-bold text-white/70">JPG · PNG · WEBP</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-400/25 px-3.5 py-2 rounded-xl">
                            <FileText size={13} className="text-red-300" />
                            <span className="text-[11px] font-bold text-red-300">PDF</span>
                        </div>
                    </div>
                    {dragOver && <div className="text-emerald-400 font-black text-sm animate-pulse">✓ Drop to analyze</div>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileChange} />
            </div>

            <details className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none">
                    <span className="flex items-center gap-2.5 font-bold text-gray-800 text-[14px]">
                        <span className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-sm">❓</span>
                        What is a Soil Health Card?
                    </span>
                    <ChevronDown size={15} className="text-gray-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 space-y-2 text-[13px] text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                    <p>The <strong className="text-gray-700">Soil Health Card</strong> (मृदा स्वास्थ्य कार्ड) is issued by the Government of India to every farmer — it lists 12 key soil parameters for your land.</p>
                    <p>Upload a photo or scan of your card. <span className="text-green-700 font-semibold">Gemini AI reads it automatically</span> — no manual typing needed.</p>
                </div>
            </details>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: '🔬', title: 'Reads 12 Nutrients', desc: 'NPK, pH, OC, Zinc & more', bg: 'bg-gradient-to-br from-green-50 to-emerald-50/50', border: 'border-green-100/60' },
                    { icon: '📄', title: 'PDF + Photo', desc: 'Any format from your phone', bg: 'bg-gradient-to-br from-red-50 to-rose-50/50', border: 'border-red-100/60' },
                    { icon: '🌾', title: 'Crop-wise Plan', desc: 'Per-crop fertilizer prescription', bg: 'bg-gradient-to-br from-amber-50 to-yellow-50/50', border: 'border-amber-100/60' },
                    { icon: '🤖', title: 'Gemini AI Vision', desc: 'Works on handwritten cards', bg: 'bg-gradient-to-br from-blue-50 to-sky-50/50', border: 'border-blue-100/60' },
                ].map(f => (
                    <div key={f.title} className={clsx("rounded-3xl p-4 border-[2px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 backdrop-blur-md cursor-default", f.bg)}>
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm mb-3 border border-white/50">{f.icon}</div>
                        <p className="font-black text-gray-800 text-[13px] leading-tight">{f.title}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 leading-snug">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type PageState = 'upload' | 'analyzing' | 'results' | 'history' | 'error';

export default function SoilAnalyzer() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [pageState, setPageState] = useState<PageState>('upload');
    const [report, setReport] = useState<SoilReport | null>(null);
    const { user: profile, setChatContext } = useStore();

    useEffect(() => {
        if (report) {
            setChatContext({ soilReport: report });
        }
    }, [report, setChatContext]);

    const processFile = useCallback(async (file: File) => {
        setPageState('analyzing');
        setErrorMsg('');
        try {
            const result = await analyzeSoilCard(file);
            setReport(result);
            if (profile?.id) {
                await saveSoilReport(profile.id, result);
            }
            setPageState('results');
        } catch (err: any) {
            setErrorMsg(err?.message || 'Analysis failed. Please try again with a clearer image or PDF.');
            setPageState('error');
        }
    }, [profile?.id, setChatContext]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const handleRescan = () => { setReport(null); setPageState('upload'); };

    return (
        <div className="min-h-screen bg-surface">
            <PageHeader
                icon={<FlaskConical size={20} />}
                title="Soil Health Analyzer"
                subtitle="Powered by Gemini AI Vision"
                showBack
                rightSlot={(pageState === 'upload' || pageState === 'results' || pageState === 'history') && (
                    <button
                        onClick={() => setPageState(pageState === 'history' ? 'upload' : 'history')}
                        className="bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl text-primary-700 text-xs font-black transition-all flex items-center gap-2"
                    >
                        {pageState === 'history' ? <Upload size={14} /> : <HistoryIcon size={14} />}
                        {pageState === 'history' ? 'SCAN' : 'HISTORY'}
                    </button>
                )}
            />

            <div className="p-6 md:p-10 max-w-6xl mx-auto">
                {pageState === 'upload' && (
                    <UploadView
                        onFile={processFile}
                        dragOver={dragOver}
                        setDragOver={setDragOver}
                        fileInputRef={fileInputRef}
                        handleFileChange={handleFileChange}
                    />
                )}

                {pageState === 'analyzing' && <AnalyzingScreen />}

                {pageState === 'results' && report && (
                    <ResultsView report={report} onRescan={handleRescan} />
                )}

                {pageState === 'history' && profile?.id && (
                    <HistoryView
                        userId={profile.id}
                        onSelect={(r) => { setReport(r); setPageState('results'); }}
                        onNewScan={handleRescan}
                    />
                )}

                {pageState === 'error' && (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                        <div className="w-24 h-24 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-lg shadow-red-100">
                            <AlertCircle size={40} className="text-red-400" />
                        </div>
                        <h2 className="font-display font-black text-gray-900 text-2xl mb-2">Analysis Failed</h2>
                        <p className="text-gray-400 text-sm font-medium mb-8 max-w-xs leading-relaxed">{errorMsg}</p>
                        <button
                            onClick={handleRescan}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-green-400/25 hover:shadow-green-400/40 active:scale-95 transition-all"
                        >
                            <RefreshCw size={16} /> Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
