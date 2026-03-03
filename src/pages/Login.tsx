
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { Sprout, User, CheckCircle2, ShieldAlert, Cloud, WifiOff, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../services/ToastService';

export default function Login() {
    const navigate = useNavigate();
    const { loginAsGuest, login } = useStore();
    const [loading, setLoading] = useState(false);
    const [authStep, setAuthStep] = useState<'options' | 'phone' | 'otp'>('options');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (auth && !recaptchaRef.current) {
            recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                    console.log('Recaptcha resolved');
                }
            });
        }
    }, []);

    const startTimer = () => {
        setTimer(60); // Increased to 60s for real SMS
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async () => {
        if (!auth) {
            toast.error('Auth not configured', 'Firebase authentication is not set up.');
            return;
        }
        if (phoneNumber.length < 10) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const appVerifier = recaptchaRef.current!;
            const formatPhone = `+91${phoneNumber}`;
            const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
            setConfirmationResult(result);
            setAuthStep('otp');
            startTimer();
        } catch (err: any) {
            console.error("SMS Error", err);
            setError(err.message || "Failed to send SMS. Please check your phone number.");
            // Reset recaptcha on error so user can retry
            if (recaptchaRef.current) {
                recaptchaRef.current.clear();
                recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length < 6 || !confirmationResult) return;

        setLoading(true);
        setError(null);
        try {
            const result = await confirmationResult.confirm(fullOtp);
            const firebaseUser = result.user;

            login({
                id: firebaseUser.uid,
                firstName: 'Kisan', // In real app, we'd fetch profile from Firestore
                surname: 'Farmer',
                phone: firebaseUser.phoneNumber || `+91${phoneNumber}`,
                language: 'en',
                farmSize: '5',
                profileComplete: false
            });
            navigate('/');
        } catch (err: any) {
            console.error("Verification Error", err);
            setError("Invalid code. Please try again.");
            setOtp(['', '', '', '', '', '']); // Clear OTP fields
            document.getElementById('otp-0')?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = () => {
        setLoading(true);
        setTimeout(() => {
            loginAsGuest();
            navigate('/');
        }, 1000);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Premium Mesh Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[120px] transform-gpu will-change-transform"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -40, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-green-200/30 rounded-full blur-[100px] transform-gpu will-change-transform"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-yellow-100/20 rounded-full blur-[80px] transform-gpu will-change-transform opacity-[0.1]"
                />
            </div>

            <div id="recaptcha-container"></div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-4xl w-full grid md:grid-cols-2 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-white/40 relative z-10 min-h-[500px] md:min-h-[600px]"
            >
                {/* Left Side: Brand & Visuals */}
                <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-primary-800 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden group min-h-[220px] md:min-h-full">
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                    <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="bg-white/20 w-12 h-12 md:w-20 md:h-20 rounded-3xl flex items-center justify-center backdrop-blur-xl md:mb-8 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                        >
                            <Sprout size={32} className="text-white md:hidden" />
                            <Sprout size={44} className="text-white hidden md:block" />
                        </motion.div>
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl md:text-5xl font-display font-black md:mb-3 tracking-tight"
                            >
                                CropGuard AI
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-emerald-50/80 text-sm md:text-xl font-medium"
                            >
                                Your AI Agronomist, <br className="hidden md:block" /> Available Offline.
                            </motion.p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="relative z-10 hidden md:grid gap-6 mt-12"
                    >
                        <Feature icon={<CheckCircle2 className="text-emerald-300" />} title="Smart Diagnosis" text="AI-powered plant detection" />
                        <Feature icon={<Cloud className="text-emerald-300" />} title="Cloud Sync" text="Seamless data backup" />
                        <Feature icon={<WifiOff className="text-emerald-300" />} title="Edge AI" text="Works anytime, anywhere" />
                    </motion.div>
                </div>

                {/* Right Side: Form Container */}
                <div className="p-6 md:p-12 flex flex-col justify-center bg-white/20 backdrop-blur-md relative">
                    <AnimatePresence mode="wait">
                        {authStep === 'options' && (
                            <motion.div
                                key="options"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: "anticipate" }}
                                className="space-y-6"
                            >
                                <div className="text-center md:text-left mb-8">
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-display">Welcome Farmer</h2>
                                    <p className="text-sm text-gray-500 mt-2 font-medium">Sign in to access your farm intelligence</p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-3"
                                    >
                                        <ShieldAlert size={16} className="shrink-0" />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setAuthStep('phone')}
                                        className="w-full bg-white text-emerald-900 font-black py-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-4 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-emerald-900/10"
                                    >
                                        <div className="bg-emerald-100 p-2 rounded-xl">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        Phone Number
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            if (!auth || !googleProvider) return;
                                            setLoading(true);
                                            try { await signInWithPopup(auth, googleProvider); navigate('/'); }
                                            catch (error: any) { setError(error.message); }
                                            finally { setLoading(false); }
                                        }}
                                        disabled={loading}
                                        className="w-full bg-white text-gray-800 font-black py-4 rounded-2xl border border-gray-100 flex items-center justify-center gap-4 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-gray-900/10"
                                    >
                                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Google Account
                                    </motion.button>
                                </div>

                                <div className="relative flex py-4 items-center">
                                    <div className="flex-grow border-t border-gray-100"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Or</span>
                                    <div className="flex-grow border-t border-gray-100"></div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGuest}
                                    className="w-full bg-emerald-50/50 text-emerald-700 font-black py-4 rounded-2xl border-2 border-dashed border-emerald-200/50 flex items-center justify-center gap-3 transition-all"
                                >
                                    <User size={20} />
                                    Continue as Guest
                                </motion.button>

                                <div className="p-4 bg-amber-50/80 rounded-[1.5rem] border border-amber-100/50 flex gap-4 text-[11px] text-amber-900 leading-relaxed shadow-sm">
                                    <ShieldAlert className="shrink-0 text-amber-500" size={18} />
                                    <p>
                                        <span className="font-black uppercase tracking-tight">Guest Mode:</span> History is stored locally. Sign in to keep your data safe across devices.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {authStep === 'phone' && (
                            <motion.div
                                key="phone"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center md:text-left mb-8">
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-display">Verify Phone</h2>
                                    <p className="text-sm text-gray-500 mt-2 font-medium">We'll send you a 6-digit confirmation code</p>
                                </div>

                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-600 border-r-2 border-emerald-50 pr-4">+91</span>
                                    <input
                                        autoFocus
                                        type="tel"
                                        maxLength={10}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        className="w-full pl-[5.5rem] pr-6 py-5 bg-white border-2 border-emerald-50 rounded-[1.5rem] focus:border-emerald-500 focus:bg-white focus:ring-[12px] focus:ring-emerald-500/5 transition-all text-2xl font-black tracking-[0.1em] placeholder:text-gray-300 shadow-sm"
                                        placeholder="00000 00000"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setAuthStep('options')}
                                        className="px-8 py-5 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Back
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSendOTP}
                                        disabled={loading || phoneNumber.length < 10}
                                        className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-[0_12px_24px_-8px_rgba(5,150,105,0.4)] hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-3"
                                    >
                                        {loading ? 'Sending...' : 'Send OTP'}
                                        {!loading && <ArrowRight size={24} />}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {authStep === 'otp' && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center md:text-left mb-8">
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-display">Enter Code</h2>
                                    <p className="text-sm text-gray-500 mt-2 font-medium">Verification code sent to <span className="text-emerald-600 font-black">+91 {phoneNumber}</span></p>
                                </div>

                                <div className="flex justify-between gap-2 md:gap-3">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`otp-${idx}`}
                                            type="tel"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                            className="w-12 h-16 md:w-14 md:h-20 text-center text-3xl font-black bg-white border-2 border-emerald-50 rounded-2xl focus:border-emerald-500 focus:ring-[12px] focus:ring-emerald-500/5 transition-all shadow-sm"
                                            autoFocus={idx === 0}
                                        />
                                    ))}
                                </div>

                                <div className="text-center">
                                    {timer > 0 ? (
                                        <p className="text-sm font-bold text-gray-400">Resend code in <span className="text-emerald-600 tabular-nums">{timer}s</span></p>
                                    ) : (
                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            onClick={handleSendOTP}
                                            className="text-sm font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-8 decoration-emerald-200"
                                        >
                                            Resend New Code
                                        </motion.button>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setAuthStep('phone')}
                                        className="px-8 py-5 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        Back
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleVerifyOTP}
                                        disabled={loading || otp.join('').length < 6}
                                        className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-[0_12px_24px_-8px_rgba(5,150,105,0.4)] hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all"
                                    >
                                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1 }}
                className="absolute bottom-6 text-center text-gray-500 text-[11px] font-black uppercase tracking-[0.3em]"
            >
                © 2026 CropGuard AI • Made for Vidarbha
            </motion.p>
        </div>
    );
}

function Feature({ icon, title, text }: { icon: any, title: string, text: string }) {
    return (
        <motion.div
            whileHover={{ x: 10 }}
            className="flex items-start gap-5 text-white/90 group/feat"
        >
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xl group-hover/feat:bg-white/20 transition-colors shadow-lg border border-white/10">
                {icon}
            </div>
            <div>
                <h4 className="font-black text-sm tracking-tight">{title}</h4>
                <p className="text-xs text-white/60 font-medium">{text}</p>
            </div>
        </motion.div>
    );
}
