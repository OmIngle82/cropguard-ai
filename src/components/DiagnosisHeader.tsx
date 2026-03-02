
import { Globe, Volume2, ScanLine, Wifi, WifiOff } from 'lucide-react';

interface DiagnosisHeaderProps {
    lang: 'en' | 'mr';
    toggleLang: () => void;
    isSpeaking: boolean;
    playResultAudio: () => void;
    isOnline: boolean;
}

export default function DiagnosisHeader({ lang, toggleLang, isSpeaking, playResultAudio, isOnline }: DiagnosisHeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center transition-all md:bg-white md:static">
            <div>
                <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">Diagnosis</h1>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">AI Crop Doctor</p>
                    {/* Network Status Badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                        {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </div>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={toggleLang} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-2 border border-gray-200 hover:bg-gray-200 transition-colors">
                    <Globe size={16} />
                    {lang === 'en' ? 'ENGLISH' : 'मराठी'}
                </button>
                <button
                    onClick={playResultAudio}
                    className={`p-2 rounded-xl transition-all ${isSpeaking ? 'bg-primary-100 text-primary-600 animate-pulse ring-2 ring-primary-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'} `}
                >
                    {isSpeaking ? <Volume2 size={20} /> : <ScanLine size={20} />}
                </button>
            </div>
        </header>
    );
}
