import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { MapPin, Activity, AlertTriangle, Sprout, Loader2 } from 'lucide-react';

interface CloudLog {
    id: string;
    crop: string;
    diseaseName: string;
    severity: string;
    date: any; // Firestore Timestamp
    location?: { lat: number, lng: number };
    imageUrl?: string;
    syncedAt?: any;
}

export default function AdminDashboard() {
    const [logs, setLogs] = useState<CloudLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        // Live Listener for Real-time Updates
        const q = query(
            collection(db, "diagnosis_logs"),
            orderBy("syncedAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CloudLog[];
            setLogs(fetchedLogs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (!db) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <AlertTriangle size={48} className="text-orange-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Access Restricted</h1>
                <p className="text-gray-500">Cloud Sync (Firebase) is not configured.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Admin Header */}
            <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity className="text-green-400" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Vidarbha Command Center</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Live Outbreak Monitoring</p>
                        </div>
                    </div>
                    <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-green-400 border border-green-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        LIVE FEED
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Stats & Map Placeholder */}
                <div className="lg:col-span-2 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Total Reports</h3>
                            <p className="text-3xl font-black text-slate-900">{logs.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-red-500 text-xs font-bold uppercase mb-1">High Severity</h3>
                            <p className="text-3xl font-black text-slate-900">
                                {logs.filter(l => l.severity === 'High').length}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-blue-500 text-xs font-bold uppercase mb-1">Active Districts</h3>
                            <p className="text-3xl font-black text-slate-900">
                                {new Set(logs.map(l => l.location ? 'GPS' : 'Unknown')).size}
                            </p>
                        </div>
                    </div>

                    {/* MOCK MAP (Since we don't have a real map library installed yet) */}
                    <div className="bg-slate-200 rounded-3xl h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Maharashtra_districts_map.svg/1200px-Maharashtra_districts_map.svg.png')] bg-cover bg-center"></div>
                        <MapPin size={48} className="text-slate-400 mb-2" />
                        <h3 className="text-slate-500 font-bold">Live Geographic Heatmap</h3>
                        <p className="text-xs text-slate-400">(Requires Google Maps API Key)</p>

                        {/* Simulation Dots */}
                        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-orange-500 rounded-full animate-ping delay-100 opacity-75"></div>
                        <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-red-500 rounded-full animate-ping delay-300 opacity-75"></div>
                    </div>
                </div>

                {/* Right: Live Feed */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-100px)] sticky top-24">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity size={18} className="text-blue-600" /> Incoming Reports
                        </h2>
                    </div>

                    <div className="overflow-y-auto p-4 space-y-4 flex-1">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
                        ) : logs.length === 0 ? (
                            <p className="text-center text-slate-400 py-10 text-sm">No data received yet.</p>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 relative group">
                                    {/* Status Indicator Line */}
                                    <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md ${log.severity === 'High' ? 'bg-red-500' :
                                        log.severity === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                                        }`}></div>

                                    <div className="pl-3 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-900 text-sm">{log.diseaseName}</h4>
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {log.date?.seconds ? new Date(log.date.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                            <Sprout size={12} /> {log.crop}
                                            {log.location && <span className="flex items-center gap-1 text-blue-500 bg-blue-50 px-1 rounded"><MapPin size={10} /> GPS</span>}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
