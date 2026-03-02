import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkSchemeEligibility } from './SchemeService';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

// Initialize Gemini
export const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const saveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const hasApiKey = () => !!getApiKey();

export interface GeminiTreatmentProduct {
    name: string;
    brand?: string;
    composition?: string;
    dosage: string;
    dosagePerAcre: number;
    unit: 'ml' | 'g' | 'kg';
    type: 'Organic' | 'Chemical' | 'Cultural' | 'Tonic';
}

export interface GeminiTreatmentStage {
    stageName: string;
    description: string;
    products: GeminiTreatmentProduct[];
}

export interface GeminiDiagnosis {
    crop: string;
    disease: string;
    confidence: number;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    detailedDescription: string;
    cause: string;
    symptoms: string[];
    preventiveMeasures: string[];
    treatmentPlan: GeminiTreatmentStage[];
}

export async function analyzeImageWithGemini(base64Image: string): Promise<GeminiDiagnosis> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key Missing");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // To avoid sequential waiting (which is very slow on 429 Too Many Requests),
    const storedBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
    You are an expert AI Agronomist for Indian Agriculture (Vidarbha Region). 
    Analyze this crop image and provide a diagnosis.

    STRICT OUTPUT FORMAT (JSON ONLY):
    {
        "crop": "Crop Name (e.g. Cotton, Soybean, Tomato, Chilli). If not a plant, return 'Not_A_Plant'",
        "disease": "Disease Name or 'Healthy'. Use standard agricultural names.",
        "confidence": 0.0 to 1.0,
        "severity": "Low", "Medium", or "High",
        "description": "Short summary (1 sentence)",
        "detailedDescription": "Detailed explanation of visual symptoms and potential yield impact (2-3 sentences)",
        "cause": "Biological cause (Fungus/Bacteria/Pest name) or Environmental factor",
        "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
        "preventiveMeasures": ["Measure 1", "Measure 2"],
        "treatmentPlan": [
            {
                "stageName": "Immediate Action",
                "description": "What to do immediately.",
                "products": [
                    {
                        "name": "Chemical Name (e.g. Imidacloprid)",
                        "brand": "Popular Indian Brand (e.g. Confidor)",
                        "composition": "Active Ingredient",
                        "dosage": "Dosage per 15L Pump",
                        "dosagePerAcre": 100,
                        "unit": "ml",
                        "type": "Chemical"
                    }
                ]
            }
        ]
    }

    RULES:
    1. If the image is NOT a plant, set "crop": "Not_A_Plant" and empty other fields.
    2. Suggest REAL Indian brands (e.g., Syngenta, Bayer, Tata Rallis) common in Maharashtra.
    3. Dosages must be practical (e.g., '10ml per 15L pump').
    4. dosagePerAcre must be a number representing the total amount required for 1 acre.
    5. unit must be precisely 'ml', 'g', or 'kg'.
    6. Return ONLY JSON. No markers.
    `;

    const imagePart = {
        inlineData: {
            data: storedBase64,
            mimeType: "image/jpeg"
        }
    };

    const modelsToTry = [
        "gemini-2.0-flash",                     // Primary
        "gemini-2.5-flash",                     // Stable Fallback
        "gemini-2.0-flash-lite-preview-02-05",  // New Lite Fallback (Fast)
        "gemini-2.5-pro",                      // Advanced Fallback
    ];

    let lastError;
    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Assessing with model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Set timeout for fetch if possible, though SDK doesn't directly support easily.
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonString);
            console.log(`✅ Success with ${modelName}!`);
            return data;
        } catch (error: any) {
            console.warn(`❌ Model ${modelName} failed:`, error.message?.split('[')[0]);
            lastError = error;
            // Immediate retry to the next model
        }
    }

    throw lastError || new Error("All Gemini models failed to respond.");
}

// Global chat history to maintain continuity across the app lifecycle seamlessly
const globalKisanChatHistory: { role: string; parts: { text: string }[] }[] = [];

export async function createKisanChatSession(context?: {
    scanResult?: any;
    diseaseDetails?: any;
    userProfile?: any;
    weather?: any;
    marketData?: any[];
    soilReport?: any;
}) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key Missing");

    const genAI = new GoogleGenerativeAI(apiKey);

    let systemInstruction = `You are "Kisan Mitra" (Farmer's Friend), a highly expert AI Agronomist assisting an Indian farmer specially from Maharashtra.
You must be extremely polite, practical, and provide accurate agricultural advice. Respond in the language the user asks you in. 

CRITICAL DIRECTIVE:
1. Provide deep, comprehensive, and COMPLETE technical information for ALL farming queries. 
2. PRIORITIZE ACTIONABLE DATA: Give specific quantities, exact timings (e.g., "Early morning 6-9 AM"), and step-by-step instructions immediately. 
3. MINIMIZE GENERIC PRE-AMBLES: Do not spend tokens on explaining why a topic is important unless it's critical for safety. Get straight to the answer.
4. If the user asks about crop health, market prices, or soil, USE THE CONTEXT PROVIDED BELOW. Never say "I don't have access to your data" if it is listed in the context.
5. Use markdown for better readability (bolding, lists, tables).
`;
    systemInstruction += `
Guidelines:
- If they ask about treatments, give specific chemical names, dosages, and brands common in India.
- If they ask about local markets, give general advice if real-time data is missing.
- Act as a supportive, knowledgeable guide.
`;

    if (context?.diseaseDetails) {
        systemInstruction += `\n\nContext Checklist: \nThe farmer just scanned their crop.
        Crop: ${context.diseaseDetails.crop || context.scanResult?.crop || 'Unknown'}
    Diagnosis: ${context.diseaseDetails.name}
    Severity: ${context.diseaseDetails.severity || 'Unknown'}
    Description: ${context.diseaseDetails.description || ''}
If they ask about treatment, refer to the treatments recommended on their screen.`;
    }

    if (context?.userProfile) {
        const profile = context.userProfile;
        const schemes = checkSchemeEligibility(profile);
        const eligible = schemes.filter(s => s.isEligible).map(s => `- ${s.title} `).join('\n');
        const probable = schemes.filter(s => !s.isEligible && s.matchScore >= 60).map(s => `- ${s.title} (${s.matchScore.toFixed(0)}% match)`).join('\n');

        systemInstruction += `\n\nFarmer Profile Context: \n - Location: ${profile.correspondenceAddress || 'Maharashtra, India'} \n - Farm Size: ${profile.farmSize} Acres\n - Crops: ${profile.crops?.join(', ') || 'General'} \n - Social Category: ${profile.category || 'General'} \n - BPL: ${profile.isBPL ? 'Yes' : 'No'} `;

        if (eligible) {
            systemInstruction += `\n\nEligible Government Schemes: \n${eligible} \n\nRecommend these schemes to the farmer when they ask about financial help or subsidies.`;
        }
        if (probable) {
            systemInstruction += `\n\nPotential Schemes(Near Match): \n${probable} \n\nMention these if they ask about more opportunities, and tell them what they might need to update in their profile to qualify.`;
        }
    }

    if (context?.weather) {
        systemInstruction += `\n\nCurrent Local Weather: \nTemperature: ${context.weather.temp}°C\nCondition: ${context.weather.condition} \nWind: ${context.weather.wind} km / h\nRain Probability: ${context.weather.precipProb}% `;
    }

    if (context?.soilReport) {
        const report = context.soilReport;
        const nutrients = [
            `pH: ${report.ph?.value || 'N/A'} (${report.ph?.status || ''})`,
            `Nitrogen: ${report.nitrogen?.value || 'N/A'} kg / ha(${report.nitrogen?.status || ''})`,
            `Phosphorus: ${report.phosphorus?.value || 'N/A'} kg / ha(${report.phosphorus?.status || ''})`,
            `Potassium: ${report.potassium?.value || 'N/A'} kg / ha(${report.potassium?.status || ''})`,
            `Organic Carbon: ${report.organicCarbon?.value || 'N/A'}% (${report.organicCarbon?.status || ''})`
        ].join(', ');

        const plan = report.fertilizerPlan?.map((step: any) => `- ${step.stage}: ${step.recommendation} `).join('\n') || 'None';

        systemInstruction += `\n\nSoil Report Data: \n - Main Nutrients: ${nutrients} \n - AI Advisory: ${report.aiRecommendation} \n - Current Fertilizer Plan: \n${plan} \n\nWhen the farmer asks about soil health or what to do with their land, USE THIS REPORT DATA.Mention their specific deficiencies(like low Nitrogen) and refer to this plan.`;
    }

    if (context?.marketData && context.marketData.length > 0) {
        const ratesTable = context.marketData.map((r: any) =>
            `- ${r.commodity} (${r.mandi}): ₹${r.price}/qtl | ${r.weeklyChange >= 0 ? '+' : ''}${r.weeklyChange}% this week | Trend: ${r.trend} | Signal: ${r.sellSignal} | Insight: ${r.insight}`
        ).join('\n');
        systemInstruction += `\n\nToday's Live Mandi Market Rates (AI-estimated for Vidarbha, Maharashtra):\n${ratesTable}\n\nWhen the farmer asks about selling, prices, or market conditions, USE THESE EXACT FIGURES. Quote the price, trend, and sell signal clearly. Do not say you don't have data — you have it above.`;
    }

    const attemptSendMessageStream = async (modelName: string, message: string, onUpdate: (chunk: string) => void) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const temporarySession = model.startChat({
            systemInstruction: {
                role: "system",
                parts: [{ text: systemInstruction }]
            },
            history: JSON.parse(JSON.stringify(globalKisanChatHistory)), // Deep clone to prevent SDK mutation on error
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 4096,
            }
        });

        const result = await temporarySession.sendMessageStream(message);

        let fullResponse = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            onUpdate(fullResponse);
        }

        // If successful, commit to local history
        globalKisanChatHistory.push({ role: "user", parts: [{ text: message }] });
        globalKisanChatHistory.push({ role: "model", parts: [{ text: fullResponse }] });

        return fullResponse;
    };

    return {
        sendMessageStream: async (message: string, onUpdate: (chunk: string) => void) => {
            const models = [
                "gemini-2.0-flash",
                "gemini-2.5-flash",
                "gemini-2.0-flash-lite-preview-02-05",
                "gemini-2.5-pro"
            ];
            let lastError;

            for (const modelName of models) {
                try {
                    console.log(`🤖 KisanChat parsing with: ${modelName}...`);
                    const result = await attemptSendMessageStream(modelName, message, onUpdate);
                    console.log(`✅ KisanChat Success with ${modelName}!`);
                    return result;
                } catch (error: any) {
                    console.warn(`❌ KisanChat Model ${modelName} failed:`, error.message?.split('[')[0]);
                    lastError = error;
                }
            }

            throw lastError || new Error("All Gemini models failed for KisanChat.");
        }
    };
}
