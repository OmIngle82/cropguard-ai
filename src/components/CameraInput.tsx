import React, { useRef, useState } from 'react';
import { Camera, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeImageQuality } from '../services/DiagnosisService';

interface CameraInputProps {
    onImageSelect: (file: File) => void;
    isScanning?: boolean;
    scanningMessage?: string;
}

export default function CameraInput({ onImageSelect, isScanning = false, scanningMessage = 'Analyzing...' }: CameraInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [qualityIssues, setQualityIssues] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    // ... (handleFileChange same) ...
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            setQualityIssues([]);
            setIsChecking(true);

            // Run Quality Check
            const img = new Image();
            img.src = url;
            img.onload = () => {
                const result = analyzeImageQuality(img);
                if (!result.pass) {
                    setQualityIssues(result.issues);
                }
                setIsChecking(false);
            };

            onImageSelect(file);
        }
    };

    const clearImage = () => {
        setPreview(null);
        setQualityIssues([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {preview ? (
                <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white group transition-all duration-300">
                    <img src={preview} alt="Plant Preview" className={`w-full h-80 object-cover ${qualityIssues.length > 0 ? 'grayscale-[0.5] blur-[1px]' : ''}`} />

                    {/* AR SCANNING OVERLAY */}
                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none z-20">
                            {/* Scanning Grid */}
                            <div className="absolute inset-0 bg-[url('https://grain-ui.vercel.app/grid.svg')] opacity-20 bg-repeat bg-[length:50px_50px]"></div>

                            {/* Moving Laser */}
                            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-scan"></div>

                            {/* Corner HUD Elements */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary-400/80 rounded-tl-xl"></div>
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary-400/80 rounded-tr-xl"></div>
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary-400/80 rounded-bl-xl"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary-400/80 rounded-br-xl"></div>

                            {/* Status Text inside HUD */}
                            <div className="absolute bottom-8 left-0 right-0 text-center">
                                <span className="bg-black/60 text-primary-300 px-4 py-1 rounded-full text-xs font-mono tracking-widest uppercase backdrop-blur-md border border-primary-500/30 transition-all duration-300">
                                    {scanningMessage}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Quality Feedback Overlay */}
                    {isChecking ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                            <span className="text-white font-bold animate-pulse">Checking Quality...</span>
                        </div>
                    ) : qualityIssues.length > 0 ? (
                        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-red-900/80 to-transparent z-10">
                            <div className="flex flex-col gap-2">
                                {qualityIssues.map(issue => (
                                    <div key={issue} className="bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit shadow-md animate-bounce">
                                        <AlertTriangle size={12} />
                                        <span>Image is {issue}</span>
                                    </div>
                                ))}
                                <p className="text-white text-xs font-medium mt-1 drop-shadow-md">
                                    Better quality = Better diagnosis. <br /> Please retry if possible.
                                </p>
                            </div>
                        </div>
                    ) : (
                        !isScanning && (
                            <div className="absolute top-4 left-4 z-10">
                                <div className="bg-green-500/90 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                                    <CheckCircle size={12} />
                                    <span>Perfect Quality</span>
                                </div>
                            </div>
                        )
                    )}

                    {!isScanning && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 pointer-events-none z-10">
                            <span className="text-white font-bold tracking-wider uppercase text-sm">Ready to Analyze</span>
                        </div>
                    )}

                    {!isScanning && (
                        <button
                            onClick={clearImage}
                            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 p-2 rounded-full text-white shadow-lg hover:bg-red-500 hover:border-red-500 transition-all duration-300 z-30"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="relative overflow-hidden flex flex-col items-center justify-center h-[28rem] w-full rounded-[2.5rem] cursor-pointer group transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-primary-900/10 hover:shadow-primary-900/20"
                    >
                        {/* 1. Animated Tech Background with Glassmorphism */}
                        <div className="absolute inset-0 bg-white" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-primary-50/50 opacity-100" />
                        <div className="absolute inset-0 bg-[url('https://grain-ui.vercel.app/grid.svg')] opacity-[0.03] bg-repeat bg-[length:30px_30px]" />

                        {/* 2. Living Gradient Blobs (AI Brain) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/40 rounded-full blur-[60px] animate-pulse-slow" />
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] animate-pulse opacity-70" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-400/20 rounded-full blur-[40px] animate-ping" />
                        </div>

                        {/* 3. Center Action Portal */}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            {/* The "Lens" Container */}
                            <div className="relative mb-8 group-hover:-translate-y-2 transition-transform duration-500 ease-out">
                                {/* Ripple Effects */}
                                <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-10 duration-[3s]" />
                                <div className="absolute -inset-4 bg-primary-500/5 rounded-full animate-pulse delay-75" />
                                <div className="absolute -inset-8 bg-primary-500/5 rounded-full animate-pulse delay-150" />

                                {/* Main Shutter Button (Premium Lens) */}
                                <div className="w-28 h-28 bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-3xl rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,1),inset_-2px_-2px_10px_rgba(37,99,235,0.05)] flex items-center justify-center border border-white/60 relative overflow-hidden group-hover:shadow-[0_20px_50px_rgba(37,99,235,0.25)] transition-all duration-500 transform group-hover:scale-105 z-10">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rotate-45 transform translate-x-full group-hover:-translate-x-full" />
                                    {/* Inner Lens Shadow Drop */}
                                    <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.08)] bg-white/40 pointer-events-none" />
                                    <Camera size={44} className="text-primary-600 drop-shadow-md relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={2} />
                                </div>

                                {/* Floating "Scan" Badge */}
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                                    AI Lens
                                </div>
                            </div>

                            {/* Text Content */}
                            <h3 className="text-3xl font-black text-gray-800 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-indigo-600 transition-all duration-300">
                                Tap to Diagnose
                            </h3>
                            <p className="text-gray-500 font-medium mt-3 bg-white/60 backdrop-blur-md px-5 py-1.5 rounded-full text-sm border border-gray-100 group-hover:border-primary-100 transition-colors">
                                Identify diseases & pests instantly
                            </p>
                        </div>

                        {/* 4. AR Corners (Static Viewfinder Intent) */}
                        <div className="absolute inset-8 pointer-events-none opacity-20 group-hover:opacity-100 transition-all duration-500 group-hover:inset-6">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-400 rounded-br-lg" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
