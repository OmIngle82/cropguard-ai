import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';

export interface ConsultationRequest {
    id?: string;
    userId: string;
    diagnosisLogId?: number;
    cropType: string;
    disease: string;
    imageUrl: string;
    symptoms: string[];
    farmerNotes?: string;
    location: string;
    geoLocation?: {
        lat: number;
        lng: number;
    };
    status: 'pending' | 'assigned' | 'resolved';
    expertId?: string;
    expertName?: string;
    expertResponse?: string;
    createdAt: Date;
    resolvedAt?: Date;
}

const COLLECTION_NAME = 'consultations';

/**
 * Create a new expert consultation request
 */
export async function createConsultationRequest(
    data: Omit<ConsultationRequest, 'id' | 'createdAt' | 'status'>
): Promise<ConsultationRequest> {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    try {
        const consultationData = {
            ...data,
            status: 'pending' as const,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), consultationData);

        const newConsultation: ConsultationRequest = {
            ...consultationData,
            id: docRef.id,
            createdAt: new Date(),
        };

        console.log('Consultation request created:', newConsultation.id);
        return newConsultation;
    } catch (error) {
        console.error('Error creating consultation request:', error);
        throw new Error('Failed to create consultation request');
    }
}

/**
 * Get all consultation requests for a user
 */
export async function getUserConsultations(userId: string): Promise<ConsultationRequest[]> {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const consultations: ConsultationRequest[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            consultations.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                resolvedAt: data.resolvedAt?.toDate(),
            } as ConsultationRequest);
        });

        return consultations;
    } catch (error) {
        console.error('Error fetching consultations:', error);
        throw new Error('Failed to fetch consultations');
    }
}

/**
 * Update consultation status
 */
export async function updateConsultationStatus(
    consultationId: string,
    status: ConsultationRequest['status'],
    expertResponse?: string
): Promise<void> {
    if (!db) {
        throw new Error('Firebase not configured');
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, consultationId);
        const updateData: any = { status };

        if (status === 'resolved') {
            updateData.resolvedAt = Timestamp.now();
        }

        if (expertResponse) {
            updateData.expertResponse = expertResponse;
        }

        await updateDoc(docRef, updateData);
        console.log('Consultation status updated:', consultationId);
    } catch (error) {
        console.error('Error updating consultation:', error);
        throw new Error('Failed to update consultation');
    }
}

/**
 * Get pending consultations count for a user
 */
export async function getPendingConsultationsCount(userId: string): Promise<number> {
    if (!db) {
        return 0;
    }

    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting pending count:', error);
        return 0;
    }
}
