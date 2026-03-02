import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/firebase';
import { collection, addDoc, query, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NutrientStatus = 'deficient' | 'sufficient' | 'excess' | 'unknown';

export interface NutrientValue {
    value: number | null;
    unit: string;
    status: NutrientStatus;
}

export interface SoilReport {
    // Farm metadata (from the card header)
    farmerName?: string;
    district?: string;
    village?: string;
    sampleDate?: string;
    cardNumber?: string;

    // Primary nutrients
    ph: NutrientValue;
    ec: NutrientValue;           // Electrical Conductivity (dS/m)
    organicCarbon: NutrientValue;
    nitrogen: NutrientValue;     // Available N (kg/ha)
    phosphorus: NutrientValue;   // Available P (kg/ha)
    potassium: NutrientValue;    // Available K (kg/ha)

    // Secondary & Micro nutrients
    sulphur: NutrientValue;
    zinc: NutrientValue;
    boron: NutrientValue;
    iron: NutrientValue;
    manganese: NutrientValue;
    copper: NutrientValue;

    // AI outputs
    aiRecommendation: string;
    fertilizerPlan: Array<{
        stage: string;
        recommendation: string;
    }>;
    shoppingList: Array<{
        product: string;
        quantityPerAcre: number;
        unit: string;
        purpose: string;
    }>;

    // Meta
    analyzedAt: string;
    fileType: 'image' | 'pdf';
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SOIL_PROMPT = `You are an expert agronomist and precision agriculture AI.

The user has uploaded a Government of India Soil Health Card (मृदा स्वास्थ्य कार्ड) — either as a photo or a PDF. Read ALL visible text carefully and extract the soil test data.

Return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "farmerName": "string or null",
  "district": "string or null",
  "village": "string or null",
  "sampleDate": "string or null",
  "cardNumber": "string or null",
  "ph": { "value": 6.8, "unit": "", "status": "sufficient" },
  "ec": { "value": 0.4, "unit": "dS/m", "status": "sufficient" },
  "organicCarbon": { "value": 0.52, "unit": "%", "status": "deficient" },
  "nitrogen": { "value": 210, "unit": "kg/ha", "status": "deficient" },
  "phosphorus": { "value": 18, "unit": "kg/ha", "status": "sufficient" },
  "potassium": { "value": 320, "unit": "kg/ha", "status": "sufficient" },
  "sulphur": { "value": 12, "unit": "ppm", "status": "sufficient" },
  "zinc": { "value": 0.4, "unit": "ppm", "status": "deficient" },
  "boron": { "value": null, "unit": "ppm", "status": "unknown" },
  "iron": { "value": null, "unit": "ppm", "status": "unknown" },
  "manganese": { "value": null, "unit": "ppm", "status": "unknown" },
  "copper": { "value": null, "unit": "ppm", "status": "unknown" },
  "aiRecommendation": "3-4 sentence plain-language advisory...",
  "fertilizerPlan": [
    {
      "stage": "At Sowing",
      "recommendation": "Apply 50kg DAP + 20kg Urea."
    }
  ],
  "shoppingList": [
    {
      "product": "Urea",
      "quantityPerAcre": 25,
      "unit": "kg",
      "purpose": "Nitrogen supplement"
    },
    {
      "product": "DAP",
      "quantityPerAcre": 50,
      "unit": "kg",
      "purpose": "Phosphorus & Nitrogen"
    }
  ]
}

Rules:
- status must be exactly: "deficient", "sufficient", "excess", or "unknown"
- If a nutrient is not shown on the card, use null for value and "unknown" for status
- ph has no unit (empty string "")
- aiRecommendation: max 4 sentences, plain language, practical advice
- fertilizerPlan: 2-3 logical steps, each with a 'stage' and a 'recommendation'
- shoppingList: provide quantities strictly in KG per ACRE for all recommended products
- Do NOT include any text outside the JSON object`;

// ── Core analyzer ─────────────────────────────────────────────────────────────

async function runAnalysis(
    apiKey: string,
    modelName: string,
    base64Data: string,
    mimeType: string
): Promise<SoilReport> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: mimeType as any,
                data: base64Data,
            }
        },
        { text: SOIL_PROMPT }
    ]);

    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const fileType = mimeType === 'application/pdf' ? 'pdf' : 'image';

    return {
        farmerName: parsed.farmerName ?? undefined,
        district: parsed.district ?? undefined,
        village: parsed.village ?? undefined,
        sampleDate: parsed.sampleDate ?? undefined,
        cardNumber: parsed.cardNumber ?? undefined,
        ph: parsed.ph,
        ec: parsed.ec,
        organicCarbon: parsed.organicCarbon,
        nitrogen: parsed.nitrogen,
        phosphorus: parsed.phosphorus,
        potassium: parsed.potassium,
        sulphur: parsed.sulphur,
        zinc: parsed.zinc,
        boron: parsed.boron,
        iron: parsed.iron,
        manganese: parsed.manganese,
        copper: parsed.copper,
        aiRecommendation: String(parsed.aiRecommendation || ''),
        fertilizerPlan: Array.isArray(parsed.fertilizerPlan) ? parsed.fertilizerPlan : [],
        shoppingList: Array.isArray(parsed.shoppingList) ? parsed.shoppingList : [],
        analyzedAt: new Date().toISOString(),
        fileType,
    };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert a File (image or PDF) to base64, then analyze with Gemini Vision.
 * Supports: image/jpeg, image/png, image/webp, application/pdf
 */
export async function analyzeSoilCard(file: File): Promise<SoilReport> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

    // Validate file type
    const SUPPORTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!SUPPORTED.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Please upload an image (JPG, PNG, WEBP) or a PDF.`);
    }

    // Read file as base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError: unknown;

    for (const modelName of models) {
        try {
            console.log(`🌱 Analyzing soil card with ${modelName}...`);
            const report = await runAnalysis(apiKey, modelName, base64Data, file.type);
            console.log('✅ Soil card analyzed successfully');
            return report;
        } catch (err) {
            console.warn(`❌ ${modelName} failed for soil analysis:`, err);
            lastError = err;
        }
    }

    throw lastError;
}

// ── Persistence Helpers ───────────────────────────────────────────────────────

/**
 * Save a soil report to Firestore for the given user
 */
export async function saveSoilReport(userId: string, report: SoilReport) {
    if (!db) return;
    try {
        const reportsRef = collection(db, 'users', userId, 'soilReports');

        // Remove undefined fields which Firestore rejects
        const cleanReport = { ...report };
        Object.keys(cleanReport).forEach(key => {
            if (cleanReport[key as keyof SoilReport] === undefined) {
                delete cleanReport[key as keyof SoilReport];
            }
        });

        await addDoc(reportsRef, {
            ...cleanReport,
            serverTimestamp: serverTimestamp(),
            analyzedAt: new Date().toISOString()
        });
        console.log('✅ Soil report saved to cloud');
    } catch (e) {
        console.error('Error saving soil report:', e);
    }
}

/**
 * Fetch all historical soil reports for a user from Firestore
 */
export async function getSoilHistory(userId: string): Promise<SoilReport[]> {
    if (!db) return [];
    try {
        const reportsRef = collection(db, 'users', userId, 'soilReports');
        const q = query(reportsRef, orderBy('serverTimestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                // Ensure date strings are handled if necessary
            } as SoilReport & { id: string };
        });
    } catch (e) {
        console.error('Error fetching soil history:', e);
        return [];
    }
}
