import { db } from './db';
import { db as firestore } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export class SyncService {
    private static instance: SyncService;
    private isSyncing = false;

    private constructor() { }

    public static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    public async syncPendingLogs(): Promise<number> {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return 0;
        }

        if (!firestore) {
            console.log('Firebase not configured, skipping cloud sync.');
            return 0;
        }

        if (!navigator.onLine) {
            console.log('Offline, skipping sync.');
            return 0;
        }

        this.isSyncing = true;

        try {
            const pendingLogs = await db.logs
                .filter(log => log.syncStatus === 'pending' || !log.syncStatus)
                .toArray();

            if (pendingLogs.length === 0) {
                return 0;
            }

            console.log(`Syncing ${pendingLogs.length} logs to Firebase...`);

            for (const log of pendingLogs) {
                // Upload to Firestore
                await addDoc(collection(firestore, "diagnosis_logs"), {
                    ...log,
                    syncedAt: serverTimestamp(),
                    mobileId: "user_device_id_placeholder" // Future: Get from Auth
                });

                // Mark as synced locally
                if (log.id) {
                    await db.logs.update(log.id, { syncStatus: 'synced' });
                }
            }

            console.log(`Successfully synced ${pendingLogs.length} logs.`);
            return pendingLogs.length;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error; // Let UI handle error toast
        } finally {
            this.isSyncing = false;
        }
    }

    public getIsSyncing(): boolean {
        return this.isSyncing;
    }

    public async getPendingCount(): Promise<number> {
        return await db.logs
            .filter(log => log.syncStatus === 'pending' || !log.syncStatus)
            .count();
    }

    // --- Local Backup Features (Industry Readiness) ---

    public async exportData(): Promise<Blob> {
        const logs = await db.logs.toArray();
        const data = {
            version: 1,
            timestamp: new Date().toISOString(),
            logs: logs
        };
        const json = JSON.stringify(data, null, 2);
        return new Blob([json], { type: 'application/json' });
    }

    public async importData(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    const data = JSON.parse(text);

                    if (!data.logs || !Array.isArray(data.logs)) {
                        throw new Error('Invalid backup file format');
                    }

                    // Remove IDs to avoid collisions (Dexie autoincrements)
                    const sanitizedLogs = data.logs.map((log: any) => {
                        const { id, ...rest } = log;
                        return {
                            ...rest,
                            date: new Date(log.date) // Ensure Date object
                        };
                    });

                    await db.logs.bulkAdd(sanitizedLogs);
                    resolve(sanitizedLogs.length);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

export const syncService = SyncService.getInstance();
