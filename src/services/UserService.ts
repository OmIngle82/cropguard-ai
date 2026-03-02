import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
    // Core Identity
    id: string;

    // Personal Information
    firstName: string;
    middleName?: string;
    surname: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    maritalStatus?: 'Married' | 'Unmarried';

    // Contact Information
    phone: string;
    email?: string;
    aadharNumber?: string;

    // Address
    correspondenceAddress?: string;
    permanentAddress?: string;

    // Education & Professional
    qualification?: string;
    specialization?: string;
    instituteName?: string;
    universityName?: string;

    // Business/Company (Optional)
    hasCompany?: boolean;
    companyName?: string;
    companyCIN?: string;
    companyAddress?: string;
    companyType?: 'Private Company' | 'Registered Partnership Firm' | 'Limited Liability Partnership (LLP)' | 'Other';

    // Farm Details
    farmSize: string;
    crops?: string[];

    // App Settings
    language: 'en' | 'mr';

    // Hackathon Project Details
    projectTheme?: 'Farm Mechanization' | 'Post Harvest' | 'Waste to Wealth' | 'AI & IoT' | 'Other';
    projectConcept?: string; // Max 200 words
    productName?: string;
    innovationDescription?: string;
    hasPatent?: boolean;
    patentNumber?: string;
    primaryCustomer?: string;
    marketOpportunity?: string;
    revenueModel?: string; // Max 100 words

    // Metadata
    profileComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Fetch user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) {
        console.warn('Firestore not configured');
        return null;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!db) {
        console.warn('Firestore not configured');
        return;
    }

    try {
        const profileData: UserProfile = {
            id: uid,
            firstName: data.firstName || '',
            surname: data.surname || '',
            phone: data.phone || '',
            language: data.language || 'en',
            farmSize: data.farmSize || '5',
            profileComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data
        };

        await setDoc(doc(db, 'users', uid), profileData);
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

/**
 * Update existing user profile in Firestore
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    if (!db) {
        console.warn('Firestore not configured');
        return;
    }

    try {
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await updateDoc(doc(db, 'users', uid), updateData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Check if profile has all required fields completed
 */
export function checkProfileComplete(profile: Partial<UserProfile>): boolean {
    const requiredFields: (keyof UserProfile)[] = [
        'firstName',
        'surname',
        'phone',
        'dob',
        'gender',
        'correspondenceAddress',
        'farmSize',
        'projectTheme',
        'projectConcept',
        'productName',
        'innovationDescription',
        'primaryCustomer',
        'marketOpportunity',
        'revenueModel'
    ];

    return requiredFields.every(field => {
        const value = profile[field];
        return value !== undefined && value !== null && value !== '';
    });
}

/**
 * Calculate profile completion percentage
 */
export function getProfileCompletionPercentage(profile: Partial<UserProfile>): number {
    const allFields: (keyof UserProfile)[] = [
        'firstName',
        'middleName',
        'surname',
        'dob',
        'gender',
        'maritalStatus',
        'phone',
        'email',
        'aadharNumber',
        'correspondenceAddress',
        'permanentAddress',
        'qualification',
        'specialization',
        'instituteName',
        'universityName',
        'farmSize',
        'crops',
        'projectTheme',
        'projectConcept',
        'productName',
        'innovationDescription',
        'hasPatent', // Optional but counted
        'primaryCustomer',
        'marketOpportunity',
        'revenueModel'
    ];

    const filledFields = allFields.filter(field => {
        const value = profile[field];
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== '';
    });

    return Math.round((filledFields.length / allFields.length) * 100);
}
