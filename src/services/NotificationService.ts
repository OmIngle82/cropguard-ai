import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db as firestore } from '../lib/firebase';
import { collection, query, getDocs, orderBy, serverTimestamp, setDoc, doc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';

export interface Notification {
    id: string;
    type: 'alert' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actionUrl?: string;
}

interface NotificationState {
    notifications: Notification[];
    dismissedIds: string[];
    userId: string | null;
    setUserId: (id: string | null) => void;
    addNotification: (notification: Omit<Notification, 'timestamp' | 'read'> & { id?: string }) => Promise<void>;
    dismissNotification: (id: string) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => void;
    getUnreadCount: () => number;
    loadCloudNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            dismissedIds: [],
            userId: null,
            setUserId: (id) => set({ userId: id }),

            addNotification: async (n) => {
                const id = n.id || Math.random().toString(36).substring(7);
                const timestamp = Date.now();

                // 🛑 Deduplication: Don't add if ID already exists or was dismissed
                const isDismissed = get().dismissedIds.includes(id);
                if (get().notifications.some(notif => notif.id === id) || isDismissed) {
                    return;
                }

                const newNotif: Notification = { ...n, id, timestamp, read: false };

                // 1. Update local state immediately
                set((state) => ({
                    notifications: [newNotif, ...state.notifications]
                }));

                // 2. Sync to Cloud
                const uid = get().userId;
                if (firestore && uid) {
                    try {
                        const logsRef = collection(firestore as Firestore, 'users', uid, 'notifications');
                        // Use setDoc with the specific ID to ensure cloud-level deduplication too
                        await setDoc(doc(logsRef, id), {
                            ...newNotif,
                            serverTimestamp: serverTimestamp()
                        });
                    } catch (e) {
                        console.warn('Notification cloud sync failed', e);
                    }
                }
            },

            dismissNotification: (id) => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                    dismissedIds: [...state.dismissedIds, id],
                }));
            },

            markAsRead: async (id) => {
                // 1. Update local
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                }));

                // 2. Update Cloud
                const uid = get().userId;
                if (firestore && uid) {
                    try {
                        await updateDoc(doc(firestore as Firestore, 'users', uid, 'notifications', id), { read: true });
                    } catch (e) {
                        console.warn('Failed to mark read on cloud', e);
                    }
                }
            },

            markAllAsRead: async () => {
                const unreadIds = get().notifications.filter(n => !n.read).map(n => n.id);

                // 1. Update local
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true }))
                }));

                // 2. Update Cloud (Batch)
                const uid = get().userId;
                if (firestore && uid && unreadIds.length > 0) {
                    try {
                        const batch = writeBatch(firestore as Firestore);
                        unreadIds.forEach(id => {
                            batch.update(doc(firestore as Firestore, 'users', uid, 'notifications', id), { read: true });
                        });
                        await batch.commit();
                    } catch (e) {
                        console.warn('Batch mark read failed', e);
                    }
                }
            },

            clearAll: () => {
                const currentIds = get().notifications.map(n => n.id);
                set((state) => ({
                    notifications: [],
                    dismissedIds: [...state.dismissedIds, ...currentIds]
                }));
            },
            getUnreadCount: () => get().notifications.filter(n => !n.read).length,

            loadCloudNotifications: async () => {
                const uid = get().userId;
                if (!firestore || !uid) return;

                try {
                    const logsRef = collection(firestore as Firestore, 'users', uid, 'notifications');
                    const q = query(logsRef, orderBy('timestamp', 'desc'));
                    const snapshot = await getDocs(q);

                    const cloudNotifs = snapshot.docs.map(doc => ({
                        ...(doc.data() as any),
                        id: doc.id
                    })) as Notification[];

                    // 🛑 Deduplication: Only keep the first occurrence of each ID
                    const uniqueNotifs: Notification[] = [];
                    const seenIds = new Set<string>();

                    cloudNotifs.forEach(n => {
                        if (!seenIds.has(n.id)) {
                            uniqueNotifs.push(n);
                            seenIds.add(n.id);
                        }
                    });

                    set({ notifications: uniqueNotifs });
                } catch (e) {
                    console.error('Failed to load cloud notifications', e);
                }
            },
        }),
        {
            name: 'crop-doctor-notifications',
            partialize: (state) => ({
                notifications: state.notifications,
                dismissedIds: state.dismissedIds
            }), // Persist both notifications and dismissed list
        }
    )
);
