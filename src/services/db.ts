import Dexie, { type Table } from 'dexie';
import { db as firestore } from '../lib/firebase';
import { collection, addDoc, query, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';

export interface Product {
    id?: number;
    name: string;
    brand: string;
    image: string; // URL
    price: number; // Approx price in INR
    dosagePerAcre: number; // ml or gm per acre
    packSize: number; // ml or gm (e.g., 250)
    unit: 'ml' | 'g';
    description?: string;
}

export interface Disease {
    id?: number;
    name: string;
    localName: string; // Marathi name
    symptoms: string;
    remedyId: number;
}

export interface Remedy {
    id?: number;
    productId: number; // Link to Product
    action: string; // e.g., "Spray"
    organicOption?: string;
    note?: string; // Special instructions
}

export interface DiagnosisLog {
    id?: number;
    userId: string; // User Isolation
    date: Date;
    crop: string; // 'Cotton' | 'Soybean' | 'Other'
    diseaseName: string;
    confidence: number;
    severity: 'Low' | 'Medium' | 'High';
    symptoms?: string[];
    imageUrl?: string; // Data URL or Blob URL
    selectedTreatment?: string;
    syncStatus?: 'pending' | 'synced'; // For future cloud sync
    correction?: {
        actualDisease: string;
        flaggedAt: Date;
    };
    location?: {
        lat: number;
        lng: number;
    };
}

export class CropDoctorDB extends Dexie {
    diseases!: Table<Disease>;
    remedies!: Table<Remedy>;
    products!: Table<Product>;
    logs!: Table<DiagnosisLog>;

    constructor() {
        super('CropDoctorDB');
        this.version(4).stores({
            diseases: '++id, name, localName',
            remedies: '++id, productId',
            products: '++id, name, brand',
            logs: '++id, userId, date, crop, diseaseName, severity' // Added userId index
        });

        this.version(3).stores({
            diseases: '++id, name, localName',
            remedies: '++id, productId',
            products: '++id, name, brand',
            logs: '++id, date, crop, diseaseName, severity'
        });
    }
}

export const db = new CropDoctorDB();

// --- Helpers ---

export const saveDiagnosis = async (log: DiagnosisLog) => {
    try {
        // 1. Save locally
        const id = await db.logs.add({ ...log, syncStatus: 'pending' });
        console.log("✅ Diagnosis saved locally:", id);

        // 2. Sync to Cloud if online and user present
        if (firestore && log.userId) {
            try {
                const logsRef = collection(firestore, 'users', log.userId, 'diagnosisLogs');

                // Firestore rejects `undefined` values — strip them out before writing
                const safeLog = Object.fromEntries(
                    Object.entries({
                        ...log,
                        date: log.date instanceof Date ? log.date.toISOString() : log.date,
                        serverTimestamp: serverTimestamp(),
                        localId: id,
                    }).filter(([, v]) => v !== undefined)
                );

                await addDoc(logsRef, safeLog);
                await db.logs.update(id, { syncStatus: 'synced' });
                console.log("☁️ Diagnosis synced to cloud");
            } catch (cloudErr) {
                console.warn("Cloud sync failed (offline?), will retry later:", cloudErr);
            }
        }
    } catch (e) {
        console.error("Failed to save diagnosis", e);
    }
};

export const saveCorrection = async (id: number, actualDisease: string) => {
    try {
        await db.logs.update(id, {
            correction: {
                actualDisease,
                flaggedAt: new Date()
            }
        });
        console.log("✅ Diagnosis corrected in History", id, actualDisease);
    } catch (e) {
        console.error("Failed to save correction", e);
    }
};

export const getHistory = async (userId: string) => {
    // 1. Get local first (immediate)
    const localLogs = await db.logs.where('userId').equals(userId).reverse().sortBy('date');

    // 2. Try to fetch cloud and merge if online
    if (firestore) {
        try {
            const logsRef = collection(firestore, 'users', userId, 'diagnosisLogs');
            const q = query(logsRef, orderBy('serverTimestamp', 'desc'));
            const snapshot = await getDocs(q);

            const cloudLogs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: undefined, // Don't use firestore ID as dexie ID
                    date: (data as any).date?.toDate ? (data as any).date.toDate() : new Date((data as any).date)
                };
            }) as DiagnosisLog[];

            // Basic merge: If cloud has logs not in local, add them
            for (const log of cloudLogs) {
                const exists = await db.logs.where('date').equals(log.date).first();
                if (!exists) {
                    await db.logs.add({ ...log, syncStatus: 'synced' });
                }
            }

            // Refresh local list
            return await db.logs.where('userId').equals(userId).reverse().sortBy('date');
        } catch (e) {
            console.warn("Cloud fetch failed, showing local-only history");
        }
    }

    return localLogs;
};

export const deleteLog = async (id: number) => {
    await db.logs.delete(id);
};

export const seedDatabase = async () => {
    const count = await db.products.count();
    if (count === 0) {
        console.log("Seeding database with Products...");

        // Seed Products
        const confidor = await db.products.add({
            name: 'Confidor',
            brand: 'Bayer',
            image: 'https://m.media-amazon.com/images/I/51wGg-k1ZCL.jpg', // Placeholder
            price: 350,
            dosagePerAcre: 100, // 100ml per acre
            packSize: 100, // 100ml bottle
            unit: 'ml',
            description: 'Effective against sucking pests like Aphids and Jassids.'
        });

        const curacron = await db.products.add({
            name: 'Curacron',
            brand: 'Syngenta',
            image: 'https://m.media-amazon.com/images/I/61S1g+sT7QL._AC_UF1000,1000_QL80_.jpg',
            price: 600,
            dosagePerAcre: 400, // 400ml per acre
            packSize: 500, // 500ml bottle
            unit: 'ml',
            description: 'Broad spectrum insecticide for Bollworms.'
        });

        const tilt = await db.products.add({
            name: 'Tilt',
            brand: 'Syngenta',
            image: 'https://m.media-amazon.com/images/I/51+z6q-iLkL.jpg',
            price: 450,
            dosagePerAcre: 200,
            packSize: 250,
            unit: 'ml',
            description: 'Systemic fungicide for Rust and Leaf Spot.'
        });

        const m45 = await db.products.add({
            name: 'M-45',
            brand: 'Indofil',
            image: 'https://m.media-amazon.com/images/I/61Kq-0e7+IL.jpg',
            price: 300,
            dosagePerAcre: 500, // 500g
            packSize: 500,
            unit: 'g',
            description: 'Contact fungicide for fungal diseases.'
        });

        // Seed Remedies (Linking to Products)
        const remedy1 = await db.remedies.add({
            productId: curacron as number,
            action: 'Spray',
            organicOption: 'Neem Oil 5% (50ml/10L)',
            note: 'Spray during early morning or late evening.'
        });

        const remedy2 = await db.remedies.add({
            productId: m45 as number,
            action: 'Spray',
            organicOption: 'Trichoderma harzianum',
            note: 'Ensure thorough coverage of leaves.'
        });

        const remedy3 = await db.remedies.add({
            productId: tilt as number,
            action: 'Spray',
            note: 'Apply immediately after first symptom appearance.'
        });

        const remedy4 = await db.remedies.add({
            productId: confidor as number,
            action: 'Spray',
            note: 'Highly effective for sucking pests.'
        });


        // Seed Diseases
        await db.diseases.bulkAdd([
            {
                name: 'Pink Bollworm',
                localName: 'Shendri Bond Ali',
                symptoms: 'Rosette flowers, exit holes in bolls, stained lint.',
                remedyId: remedy1 as number
            },
            {
                name: 'Bacterial Blight',
                localName: 'Karpa / Takkya',
                symptoms: 'Angular water-soaked spots on leaves, black arms on stems.',
                remedyId: remedy2 as number
            },
            {
                name: 'Leaf Spot',
                localName: 'Timbakhya Karpa',
                symptoms: 'Brown circular spots with concentric rings.',
                remedyId: remedy3 as number // Tilt
            },
            {
                name: 'Rust',
                localName: 'Taambera',
                symptoms: 'Reddish-brown pustules on lower leaf surface.',
                remedyId: remedy3 as number
            },
            {
                name: 'Aphids',
                localName: 'Mava',
                symptoms: 'Curling of leaves, sticky honeydew secretion.',
                remedyId: remedy4 as number
            }
        ]);
        console.log("Database seeded successfully with Products.");
    }
};
