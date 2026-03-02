import { useState, useCallback } from 'react';

export const useVoice = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);




    const speak = useCallback((text: string, lang: string = 'mr-IN') => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel(); // Stop previous

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return {
        speak,
        stopSpeaking,
        isSpeaking,
    };
};
