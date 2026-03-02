import { Calendar, Droplets, CheckCircle, Clock, CloudRain, Wind } from 'lucide-react';
import type { TreatmentOption, TreatmentStage } from '../services/DiseaseDatabase';

interface TreatmentTimelineProps {
    stages: TreatmentStage[];
    onProductClick?: (product: TreatmentOption) => void;
    completedIndices?: number[];
    onToggleComplete?: (index: number) => void;
    lang?: 'en' | 'mr';
    weather?: any;
}

export default function TreatmentTimeline({ stages, onProductClick, completedIndices = [], onToggleComplete, lang = 'en', weather }: TreatmentTimelineProps) {
    if (!stages || stages.length === 0) return null;

    const isRaining = weather?.precipProb && weather.precipProb > 50;
    const isWinding = weather?.wind && weather.wind > 20;

    return (
        <div className="space-y-6">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <Calendar className="text-primary-600" /> Treatment Schedule
            </h4>

            {(isRaining || isWinding) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 animate-fade-in-up shadow-sm">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                        {isRaining ? <CloudRain size={20} /> : <Wind size={20} />}
                    </div>
                    <div>
                        <h5 className="font-bold text-red-900">
                            {lang === 'mr' ? 'आज फवारणी करू नका!' : 'Weather Alert: Do Not Spray Today'}
                        </h5>
                        <p className="text-sm text-red-700 font-medium mt-0.5">
                            {isRaining
                                ? (lang === 'mr' ? 'पावसाची शक्यता असल्याने औषध वाहून जाईल.' : `High chance of rain (${Math.round(weather.precipProb)}%). Chemicals may wash away.`)
                                : (lang === 'mr' ? 'वादळी वाऱ्यामुळे फवारणी करणे टाळा.' : `High winds (${Math.round(weather.wind)} km/h). Spraying is unsafe and ineffective.`)}
                        </p>
                    </div>
                </div>
            )}

            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                {stages.map((stage, index) => {
                    const isCompleted = completedIndices.includes(index);

                    return (
                        <div key={index} className="relative">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-primary-100 border-primary-500'
                                }`}>
                                {isCompleted ? <CheckCircle size={10} className="text-white" /> : (index === 0 && <div className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />)}
                            </div>

                            <div className={`rounded-2xl p-5 shadow-sm border transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:shadow-md'
                                }`}>
                                <h5 className={`font-bold mb-1 flex justify-between ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                                    <span className={isCompleted ? 'line-through decoration-green-500' : ''}>
                                        {lang === 'mr' && stage.stageNameMarathi ? stage.stageNameMarathi : stage.stageName}
                                    </span>
                                    {isCompleted ? (
                                        <span className="text-xs font-bold px-2 py-1 bg-green-200 text-green-700 rounded-full flex items-center gap-1">
                                            <CheckCircle size={12} /> {lang === 'mr' ? 'पूर्ण' : 'Done'}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-500 flex items-center gap-1">
                                            <Clock size={12} /> {index === 0 ? (lang === 'mr' ? 'आज' : 'Today') : (lang === 'mr' ? `दिवस ${index * 3 + 1}` : `Day ${index * 3 + 1}`)}
                                        </span>
                                    )}
                                </h5>
                                <p className={`text-sm mb-4 leading-relaxed ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>{lang === 'mr' && stage.descriptionMarathi ? stage.descriptionMarathi : stage.description}</p>

                                {/* Product Recommendations */}
                                {stage.products && stage.products.length > 0 && !isCompleted && (
                                    <div className="space-y-3">
                                        {stage.products.map((prod, pIdx) => (
                                            <div
                                                key={pIdx}
                                                onClick={() => onProductClick?.(prod)}
                                                className="bg-white rounded-xl p-3 flex items-start gap-3 border border-gray-200 shadow-sm cursor-pointer hover:border-primary-500 hover:shadow-md transition-all group"
                                            >
                                                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                    <Droplets size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">{prod.brand || prod.name}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                        {prod.composition || prod.type}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Mark as Done Button */}
                                <div
                                    onClick={() => onToggleComplete?.(index)}
                                    className={`mt-4 flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors select-none ${isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-primary-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                                        }`}>
                                        {isCompleted && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    {isCompleted ? 'Completed' : 'Mark as Done'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
