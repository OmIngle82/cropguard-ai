import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GamificationStats {
    score: number;
    streak: number;
    lastActive: any; // Firestore Timestamp
    badges: string[];
}

const DEFAULT_STATS: GamificationStats = {
    score: 0,
    streak: 0,
    lastActive: null,
    badges: []
};

/**
 * Initializes or fetches a user's gamification stats from Firestore
 */
export const getUserGamification = async (userId: string): Promise<GamificationStats> => {
    if (!userId || userId === 'guest') {
        const localStats = localStorage.getItem('guestGamification');
        return localStats ? JSON.parse(localStats) : DEFAULT_STATS;
    }

    try {
        const statsRef = doc(db!, 'users', userId, 'gamification', 'stats');
        const snap = await getDoc(statsRef);

        if (snap.exists()) {
            return snap.data() as GamificationStats;
        } else {
            // Initialize new stats
            await setDoc(statsRef, DEFAULT_STATS);
            return DEFAULT_STATS;
        }
    } catch (error) {
        console.error("Error fetching gamification stats:", error);
        return DEFAULT_STATS;
    }
};

/**
 * Listens to a user's stats in real-time. Unsubscribe by calling the returned function.
 */
export const listenToGamification = (userId: string, callback: (stats: GamificationStats) => void) => {
    if (!userId || userId === 'guest') {
        // For guests, we just push the current state.
        // In a real app with multiple tabs, you might want local storage events.
        const localStats = localStorage.getItem('guestGamification');
        callback(localStats ? JSON.parse(localStats) : DEFAULT_STATS);

        // Listen to storage events for cross-tab sync (optional but good practice)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'guestGamification') {
                callback(e.newValue ? JSON.parse(e.newValue) : DEFAULT_STATS);
            }
        };
        window.addEventListener('storage', handleStorage);

        // Return unsubscribe function
        return () => window.removeEventListener('storage', handleStorage);
    }

    const statsRef = doc(db!, 'users', userId, 'gamification', 'stats');

    return onSnapshot(statsRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as GamificationStats);
        } else {
            callback(DEFAULT_STATS);
        }
    }, (error) => {
        console.error("Error listening to gamification stats:", error);
    });
};

/**
 * Updates the daily streak. Keeps it alive if logged in consecutive days,
 * resets to 1 if a day was missed.
 */
export const updateDailyStreak = async (userId: string): Promise<void> => {
    try {
        const now = new Date();
        const todayStr = now.toDateString();

        if (!userId || userId === 'guest') {
            const localStatsStr = localStorage.getItem('guestGamification');
            let data: GamificationStats = localStatsStr ? JSON.parse(localStatsStr) : { ...DEFAULT_STATS };

            let newStreak = data.streak || 1;
            if (data.lastActive) {
                const lastActiveDate = new Date(data.lastActive);
                const lastActiveStr = lastActiveDate.toDateString();

                if (todayStr !== lastActiveStr) {
                    const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        newStreak += 1;
                    } else {
                        newStreak = 1;
                    }
                }
            }

            data = { ...data, streak: newStreak, lastActive: now.toISOString() };
            localStorage.setItem('guestGamification', JSON.stringify(data));
            // Dispatch a custom event to notify listeners in the same tab
            window.dispatchEvent(new StorageEvent('storage', { key: 'guestGamification', newValue: JSON.stringify(data) }));
            return;
        }

        const statsRef = doc(db!, 'users', userId, 'gamification', 'stats');
        const snap = await getDoc(statsRef);

        if (!snap.exists()) {
            await setDoc(statsRef, { ...DEFAULT_STATS, streak: 1, lastActive: serverTimestamp() });
            return;
        }

        const data = snap.data() as GamificationStats;

        let newStreak = data.streak;

        if (data.lastActive) {
            // Convert Firestore Timestamp to JS Date safely
            const lastActiveDate = data.lastActive.toDate ? data.lastActive.toDate() : new Date(data.lastActive);

            // Calculate difference in days (ignoring hours)
            const lastActiveStr = lastActiveDate.toDateString();

            if (todayStr !== lastActiveStr) {
                const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Contiguous day
                    newStreak += 1;
                } else {
                    // Missed a day
                    newStreak = 1;
                }

                await updateDoc(statsRef, {
                    streak: newStreak,
                    lastActive: serverTimestamp()
                });
            }
        } else {
            // First time
            await updateDoc(statsRef, {
                streak: 1,
                lastActive: serverTimestamp()
            });
        }

    } catch (e) {
        console.error("Error updating daily streak:", e);
    }
};

/**
 * Core function to award points.
 * Optionally unlocks badges if thresholds are met.
 */
export const awardPoints = async (userId: string, points: number, reason: string): Promise<void> => {
    try {
        if (!userId || userId === 'guest') {
            const localStatsStr = localStorage.getItem('guestGamification');
            let data: GamificationStats = localStatsStr ? JSON.parse(localStatsStr) : { ...DEFAULT_STATS };

            const newScore = data.score + points;
            let newBadges = [...(data.badges || [])];

            if (newScore >= 500 && !newBadges.includes('Tech Guru')) {
                newBadges.push('Tech Guru');
            }
            if (newScore >= 1000 && !newBadges.includes('Master Farmer')) {
                newBadges.push('Master Farmer');
            }
            if (reason === 'soil_report' && !newBadges.includes('Soil Saver')) {
                newBadges.push('Soil Saver');
            }

            data = { ...data, score: newScore, badges: newBadges };
            localStorage.setItem('guestGamification', JSON.stringify(data));
            window.dispatchEvent(new StorageEvent('storage', { key: 'guestGamification', newValue: JSON.stringify(data) }));
            console.log(`[Guest] Earned ${points} points for: ${reason}`);
            return;
        }

        const statsRef = doc(db!, 'users', userId, 'gamification', 'stats');
        const snap = await getDoc(statsRef);

        if (!snap.exists()) {
            await setDoc(statsRef, { ...DEFAULT_STATS, score: points });
        } else {
            const data = snap.data() as GamificationStats;
            const newScore = data.score + points;

            // Simple Threshold Badge Logic
            let newBadges = [...(data.badges || [])];

            if (newScore >= 500 && !newBadges.includes('Tech Guru')) {
                newBadges.push('Tech Guru');
            }
            if (newScore >= 1000 && !newBadges.includes('Master Farmer')) {
                newBadges.push('Master Farmer');
            }

            if (reason === 'soil_report' && !newBadges.includes('Soil Saver')) {
                newBadges.push('Soil Saver');
            }

            await updateDoc(statsRef, {
                score: increment(points),
                badges: newBadges
            });
            console.log(`Earned ${points} points for: ${reason}`);
        }
    } catch (e) {
        console.error("Error awarding points:", e);
    }
};
