
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface FeedbackData {
    userId: string;
    originalImageBase64?: string; // Optional to save storage, maybe just hash/url if stored elsewhere
    aiPrediction: {
        crop: string;
        disease: string;
        confidence: number;
    };
    userCorrection?: {
        crop?: string; // V6: User corrected the crop (e.g. Altar -> Not_A_Plant)
        disease?: string;
        symptomsConfirmed: string[];
    };
    timestamp: Date;
    deviceInfo?: string;
    location?: { lat: number; lng: number };
}

const FEEDBACK_COLLECTION = 'training_feedback';

export const saveFeedback = async (data: FeedbackData) => {
    if (!db) {
        console.warn('🔥 Firebase not initialized. Feedback not saved.');
        return;
    }

    try {
        await addDoc(collection(db, FEEDBACK_COLLECTION), {
            ...data,
            timestamp: new Date() // Server timestamp would be better but local is fine for now
        });
        console.log('✅ Feedback saved for training!');
    } catch (error) {
        console.error('❌ Failed to save feedback:', error);
        // Fail silently so we don't block the user flow
    }
};
