import { useState, useEffect, useRef } from 'react';
import { User, Send, X, Sparkles, Leaf, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import clsx from 'clsx';
import { useLocation } from 'react-router-dom';
import { createKisanChatSession } from '../services/GeminiService';

declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface KisanChatProps {
    onClose: () => void;
    context?: {
        scanResult?: any;
        diseaseDetails?: any;
        userProfile?: any;
        weather?: any;
        marketData?: any[];
        soilReport?: any;
    };
    lang?: 'en' | 'mr' | 'hi';
}

const QUICK_PROMPTS = [
    "What's the best time to spray fungicide? 🕐",
    "Market price for soybean today? 📈",
    "How to improve soil health? 🌱",
    "Weather safe to spray today? 💧",
];

export default function KisanChat({ onClose, context, lang = 'en' }: KisanChatProps) {
    const location = useLocation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatSession, setChatSession] = useState<any>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setInput(prev => {
                        const newText = prev + (prev.length > 0 ? ' ' : '') + finalTranscript;
                        return newText;
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [lang]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setInput(''); // optionally clear previous input
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const getWelcomeMessage = () => {
        const isDiagnosis = location.pathname.includes('/diagnosis');
        const isHistory = location.pathname.includes('/history');
        const isExperts = location.pathname.includes('/experts');

        if (lang === 'mr') {
            if (isDiagnosis) return 'नमस्कार! मी किसान मित्र 🌾. तुम्हाला या रोगाबद्दल किंवा औषधांबद्दल काही प्रश्न आहेत का?';
            if (isHistory) return 'नमस्कार! मी किसान मित्र 🌾. तुमच्या मागील पिकांच्या तपासणीबद्दल काही प्रश्न आहेत का?';
            if (isExperts) return 'नमस्कार! मी किसान मित्र 🌾. तुम्हाला तज्ञांशी संपर्क साधायचा आहे का?';
            return 'नमस्कार! मी किसान मित्र 🌾. आजच्या हवामानाबद्दल, बाजारातील भावाबद्दल किंवा शेतीबद्दल मला काहीही विचारा.';
        } else if (lang === 'hi') {
            if (isDiagnosis) return 'नमस्ते! मैं किसान मित्र हूँ 🌾। क्या आपको बीमारी या उपचार के बारे में प्रश्न हैं?';
            if (isHistory) return 'नमस्ते! मैं किसान मित्र हूँ 🌾। क्या आप अपने पिछले फसल निदान के बारे में जानना चाहते हैं?';
            if (isExperts) return 'नमस्ते! मैं किसान मित्र हूँ 🌾। क्या आप विशेषज्ञों से संपर्क करना चाहते हैं?';
            return 'नमस्ते! मैं किसान मित्र हूँ 🌾। आज के मौसम, बाजार के भाव या खेती के बारे में मुझसे कुछ भी पूछें।';
        } else {
            if (isDiagnosis) return 'Hello! I am Kisan Mitra 🌾. Do you have any questions about this diagnosis or treatment?';
            if (isHistory) return 'Hello! I am Kisan Mitra 🌾. Need help reviewing your past crop diagnoses?';
            if (isExperts) return 'Hello! I am Kisan Mitra 🌾. Want to know how to contact an expert or ask me a farming question?';
            return 'Hello! I am Kisan Mitra 🌾. Need help with today\'s weather, market prices, or farming advice?';
        }
    };

    // 1. Initialize Welcome Message ONLY on first open
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { id: 'welcome', role: 'model', text: getWelcomeMessage() }
            ]);
            // Focus input after a brief delay
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, []);

    // 2. Initialize Chat Session and update it if context changes
    const contextString = JSON.stringify(context);
    useEffect(() => {
        createKisanChatSession(JSON.parse(contextString)).then(session => {
            setChatSession(session);
        }).catch(console.error);
    }, [contextString]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);



    const handleSend = async (text?: string) => {
        const userText = (text || input).trim();
        if (!userText || !chatSession || isStreaming) return;

        const newMessage: Message = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsTyping(true);

        const responseId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: responseId, role: 'model', text: '' }]);

        try {
            if (chatSession.sendMessageStream) {
                setIsTyping(false);
                setIsStreaming(true);
                await chatSession.sendMessageStream(userText, (chunkText: string) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === responseId ? { ...msg, text: chunkText } : msg
                    ));
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                });
                setIsStreaming(false);
            } else {
                const result = await chatSession.sendMessage(userText);
                setIsTyping(false);
                setMessages(prev => prev.map(msg =>
                    msg.id === responseId ? { ...msg, text: result.response.text() } : msg
                ));
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setIsTyping(false);
            setIsStreaming(false);
            setMessages(prev => prev.map(msg =>
                msg.id === responseId ? {
                    ...msg, text: lang === 'mr'
                        ? "माफ करा, मला समजले नाही. कृपया पुन्हा प्रयत्न करा."
                        : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
                }
                    : msg
            ));
        }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Track keyboard height via visualViewport API (avoids entire UI being pushed)
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const handler = () => {
            const kbHeight = window.innerHeight - vv.height - vv.offsetTop;
            setKeyboardHeight(Math.max(0, kbHeight));
        };

        vv.addEventListener('resize', handler);
        vv.addEventListener('scroll', handler);
        return () => {
            vv.removeEventListener('resize', handler);
            vv.removeEventListener('scroll', handler);
        };
    }, []);

    const showQuickPrompts = messages.length <= 1;

    const chatVariants: any = {
        initial: isMobile ? { y: '100%', opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95, y: 20 },
        animate: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: isMobile ? 280 : 360,
                damping: isMobile ? 26 : 28,
                mass: 0.7
            }
        },
        exit: isMobile
            ? { y: '100%', opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }
            : { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.18 } }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* Chat Window */}
            <motion.div
                variants={chatVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={clsx(
                    "relative w-full md:w-[500px] lg:w-[520px] flex flex-col pointer-events-auto border border-white/20 bg-white shadow-2xl",
                    "will-change-transform transform-gpu",
                    // Mobile: full screen, Desktop: centered tall modal
                    "h-full md:h-[680px] md:max-h-[85vh]",
                    "md:rounded-[2.5rem] overflow-hidden",
                    "shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                )}
            >

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-6 pt-10 pb-6 md:pt-7 flex-shrink-0">
                    {/* Decorative background glows - using solid hex colors */}
                    <div className="absolute top-[-20%] left-[-10%] w-48 h-48 rounded-full bg-[#064e3b] blur-[50px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 rounded-full bg-[#0d9488] blur-[40px] pointer-events-none" />

                    {/* Close button — always visible, consistent on all screen sizes */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 z-20 border border-white/20 shadow-sm"
                    >
                        <X size={18} />
                    </button>

                    <div className="relative flex items-center gap-5 z-10">
                        {/* AI Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-[2px] shadow-lg shadow-emerald-500/30">
                                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <Leaf size={28} className="text-emerald-400" />
                                </div>
                            </div>
                            {/* Online status dot */}
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-emerald-500">
                                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                            </span>
                        </div>
                        <div>
                            <h3 className="font-black text-white text-[22px] leading-tight tracking-tight drop-shadow-sm">Kisan Mitra AI</h3>
                            <p className="text-emerald-300 text-[14px] font-bold flex items-center gap-1.5 mt-0.5 drop-shadow-sm">
                                <Sparkles size={14} className="text-teal-300 animate-pulse" />
                                Your Farming Companion
                            </p>
                        </div>
                    </div>

                    {/* Weather badge if available */}
                    {context?.weather && (
                        <div className="relative mt-5 bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-inner">
                            <div>
                                <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">Live Weather Context</p>
                                <p className="text-white font-black text-[15px] leading-tight mt-0.5">
                                    {context.weather.temp}°C · {context.weather.condition}
                                    <span className="text-emerald-300 ml-2 font-bold text-[13px]">💨 {context.weather.wind} km/h · 🌧 {context.weather.precipProb}%</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Messages Area ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f8fafc] overscroll-contain">
                    <div className="px-4 py-6 space-y-6">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={clsx(
                                    "flex items-end gap-2.5 animate-fade-in-up",
                                    msg.role === 'user' ? "flex-row-reverse" : ""
                                )}
                            >
                                {/* Avatar */}
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-emerald-400 to-teal-500 p-[1.5px] shadow-sm mb-0.5 shrink-0">
                                        <div className="w-full h-full rounded-[8px] bg-slate-900 flex items-center justify-center">
                                            <Leaf size={14} className="text-emerald-400" />
                                        </div>
                                    </div>
                                )}

                                {/* Bubble */}
                                <div className={clsx(
                                    "max-w-[85%] rounded-[1.5rem] px-5 py-4 shadow-md",
                                    msg.role === 'user'
                                        ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-200/50 rounded-br-[4px] border border-emerald-500/50"
                                        : "bg-gradient-to-br from-white to-emerald-50 border border-white shadow-emerald-900/5 rounded-bl-[4px] text-gray-800"
                                )}>
                                    {/* Streaming cursor */}
                                    {msg.role === 'model' && msg.text === '' && !isTyping && (
                                        <div className="flex space-x-1 py-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
                                        </div>
                                    )}

                                    {msg.role === 'user' ? (
                                        <p className="text-[15px] leading-relaxed">{msg.text}</p>
                                    ) : msg.text ? (
                                        <div className="markdown-chat">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-[14.5px] text-gray-700" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-none mb-3 space-y-1.5" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 marker:font-bold marker:text-green-600" {...props} />,
                                                    li: ({ node, children, ...props }) => (
                                                        <li className="text-[14.5px] text-gray-700 flex items-start gap-2 leading-snug" {...props}>
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                            <div className="flex-1">{children}</div>
                                                        </li>
                                                    ),
                                                    h3: ({ node, ...props }) => <h3 className="text-xs font-black text-green-800 mt-4 mb-2 uppercase tracking-widest" {...props} />,
                                                    h4: ({ node, ...props }) => <h4 className="text-[14px] font-bold text-gray-900 mt-3 mb-1.5" {...props} />,
                                                    table: ({ node, ...props }) => <div className="overflow-x-auto mb-3 w-full rounded-xl border border-gray-200 bg-white"><table className="text-sm text-left w-full border-collapse" {...props} /></div>,
                                                    th: ({ node, ...props }) => <th className="border-b border-gray-200 bg-gray-50 p-2.5 font-bold text-gray-900 whitespace-nowrap text-xs uppercase tracking-wider" {...props} />,
                                                    td: ({ node, ...props }) => <td className="border-b border-gray-100 p-2.5 text-[13px]" {...props} />,
                                                    a: ({ node, ...props }) => <a className="text-green-700 font-semibold hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                    code: ({ node, className, children, ...props }) => {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !match ? (
                                                            <code className="bg-green-50 text-green-800 px-1.5 py-0.5 rounded text-[12px] font-mono border border-green-100" {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className={className} {...props}>{children}</code>
                                                        );
                                                    }
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : null}
                                </div>

                                {/* User Avatar */}
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-[10px] bg-gray-100 flex items-center justify-center shrink-0 border-[2px] border-white shadow-sm mb-0.5">
                                        <User size={14} className="text-gray-500" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Thinking indicator */}
                        {isTyping && (
                            <div className="flex items-end gap-2.5 animate-fade-in-up">
                                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-emerald-400 to-teal-500 p-[1.5px] shadow-sm mb-0.5 shrink-0">
                                    <div className="w-full h-full rounded-[8px] bg-slate-900 flex items-center justify-center">
                                        <Leaf size={14} className="text-emerald-400" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-white to-emerald-50 border border-white shadow-emerald-900/5 rounded-[1.5rem] rounded-bl-[4px] px-5 py-4">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts (only shown before first message) */}
                    {showQuickPrompts && (
                        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                            {QUICK_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(prompt.replace(/ [^\s]+$/, ''))}
                                    className="text-left bg-white border border-white hover:border-emerald-200 text-gray-700 text-[12px] leading-snug p-3 rounded-[14px] transition-all duration-300 font-bold hover:text-emerald-800 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Input Area ───────────────────────────────────────────── */}
                <div
                    className="bg-white border-t border-emerald-100 shadow-[0_-15px_40px_rgba(16,185,129,0.05)] px-4 py-4 flex-shrink-0 z-20 transform-gpu will-change-[padding-bottom]"
                    style={{
                        paddingBottom: keyboardHeight > 0
                            ? `calc(${keyboardHeight}px + 1rem)`
                            : 'calc(1.25rem + env(safe-area-inset-bottom))'
                    }}
                >
                    <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-50 transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={
                                isListening
                                    ? (lang === 'mr' ? "ऐकत आहे..." : lang === 'hi' ? "सुन रहा हूँ..." : "Listening...")
                                    : (lang === 'mr' ? "विचारण्यासाठी येथे टाइप करा..." :
                                        lang === 'hi' ? "यहाँ टाइप करें..." :
                                            "Ask about crop health, weather, prices...")
                            }
                            className={clsx(
                                "flex-1 bg-transparent text-[15px] py-2.5 px-3 outline-none font-medium placeholder:text-gray-400 min-w-0 transition-colors",
                                isListening ? "text-emerald-600" : "text-gray-800"
                            )}
                        />
                        {/* Mic Button */}
                        <button
                            onClick={toggleListening}
                            className={clsx(
                                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                                isListening
                                    ? "bg-red-50 text-red-500 shadow-inner border border-red-100 animate-pulse"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                            )}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isStreaming}
                            className={clsx(
                                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                                input.trim() && !isStreaming
                                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_8px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_20px_rgba(16,185,129,0.4)] active:scale-90 hover:-translate-y-0.5"
                                    : "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100"
                            )}
                        >
                            <Send size={18} className={clsx("transition-transform", input.trim() ? "ml-0.5" : "")} />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-3 font-bold tracking-wide uppercase">
                        Powered by Gemini AI · Kisan Mitra
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
