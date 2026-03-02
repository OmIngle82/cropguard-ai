import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { PLANT_KEYWORDS, BLOCK_KEYWORDS, CONFLICT_CROPS } from '../config/diagnosisConfig';
import { analyzeImageWithGemini, hasApiKey, type GeminiDiagnosis } from './GeminiService';

// Types for the Smart Diagnosis Flow
export interface ScanResult {
    crop: 'Cotton' | 'Soybean' | 'Other' | 'Not_A_Plant' | string; // Relaxed for Gemini
    cropConfidence: number;
    disease?: string;
    diseaseConfidence?: number;
    severity?: 'Low' | 'Medium' | 'High';
    candidates?: { disease: string; confidence: number }[];
    weatherContext?: any;
    colorHealth?: boolean;
    geminiResult?: GeminiDiagnosis; // Store full Gemini response
    source?: 'Gemini' | 'TFJS';
    verificationQuestions?: VerificationQuestion[];
}

export interface VerificationQuestion {
    id: string;
    text: string;
    symptom: string;
    pointsTo: string; // The disease this symptom confirms
    language: 'en' | 'mr';
}

let customModel: tf.GraphModel | tf.LayersModel | null = null;
let gatekeeperModel: mobilenet.MobileNet | null = null;

const MODEL_URL = '/models/tfjs_model/model.json';

// Keywords imported from ../config/diagnosisConfig

export const loadModel = async () => {
    if (customModel && gatekeeperModel) {
        return true; // Already loaded
    }

    try {
        console.log('🧠 Loading AI Models (Expert + Gatekeeper)...');

        // Load Custom Model (Critical)
        try {
            customModel = await tf.loadLayersModel(MODEL_URL);
        } catch (e) {
            console.warn('⚠️ Failed to load Custom Model as Layers, trying Graph...', e);
            customModel = await tf.loadGraphModel(MODEL_URL);
        }

        // Load Gatekeeper (Optional - Network Dependent)
        try {
            gatekeeperModel = await mobilenet.load({ version: 2, alpha: 0.5 });
        } catch (e) {
            console.log('ℹ️ Offline Gatekeeper (MobileNet) safely skipped (network unreachable). Relying on Gemini.');
            // Gatekeeper will be null, runGatekeeper() logic handles this by passing { pass: true }
        }

        if (!customModel && !gatekeeperModel) {
            throw new Error("Both AI models failed to load.");
        }

        console.log('✅ AI Models Loaded!');

        // Warmup
        tf.tidy(() => {
            customModel?.predict(tf.zeros([1, 224, 224, 3]));
        });

        return true;

    } catch (error) {
        console.error('❌ Failed to load models:', error);
        return false;
    }
};

interface GatekeeperResult {
    pass: boolean;
    reason?: string;
    detectedClass?: string;
    strictMode?: boolean;
    allPredictions?: { className: string, probability: number }[]; // V6: Expose raw predictions
}

const runGatekeeper = async (imageElement: HTMLImageElement): Promise<GatekeeperResult> => {
    if (!gatekeeperModel) {
        console.warn('⚠️ Gatekeeper Offline. Enabling STRICT MODE.');
        return { pass: true, strictMode: true };
    }

    const predictions = await gatekeeperModel.classify(imageElement, 3);
    console.group('🛡️ Gatekeeper check');

    const top = predictions[0];
    const topName = top?.className.toLowerCase() || '';
    const topProb = top?.probability || 0;

    console.log(`Top Guess: "${topName}" (${(topProb * 100).toFixed(1)}%)`);

    // 1. ABSOLUTE FILTER: Blacklist (Strict)
    // Matches tech, indoor, or known non-plant objects
    if (topProb > 0.15 && BLOCK_KEYWORDS.some(k => topName.includes(k))) {
        console.warn(`⛔ Blocked by Blacklist: ${topName}`);
        console.groupEnd();
        return { pass: false, reason: 'Not a Plant', detectedClass: topName };
    }

    // 2. CONFLICT CHECK: Known Foreign Crops
    if (topProb > 0.20 && CONFLICT_CROPS.some(k => topName.includes(k))) {
        console.warn(`⚠️ Detected Foreign Crop: ${topName}`);
        console.groupEnd();
        return { pass: true, reason: 'Conflict', detectedClass: topName }; // Pass, but detection logic handles it
    }

    // 3. ABSOLUTE PASS: Whitelist (Broad)
    // Matches plants, fruits, or leaf-like textures
    for (const p of predictions) {
        const name = p.className.toLowerCase();
        if (PLANT_KEYWORDS.some(k => name.includes(k))) {
            console.log(`✅ Allowed by Whitelist: ${name}`);
            console.groupEnd();
            return { pass: true, detectedClass: name };
        }
    }

    // 4. AMBIGUITY ZONE (Neutral)
    // If it's NOT in the whitelist, it might be a non-plant object.

    // SAFETY CHECK: Check if ANY of the top 3 are plants?
    // If even the 2nd or 3rd guess is a plant, we might give it a chance.
    const hasPlantInTop3 = predictions.some(p =>
        PLANT_KEYWORDS.some(k => p.className.toLowerCase().includes(k))
    );

    if (hasPlantInTop3) {
        console.log(`✅ Top guess was '${topName}', but found plant in top 3. Passing.`);
        console.groupEnd();
        return { pass: true, detectedClass: predictions.find(p => PLANT_KEYWORDS.some(k => p.className.toLowerCase().includes(k)))?.className };
    }

    // If NO plant keywords found in top 3 predictions:
    // We only pass if the non-plant confidence is VERY low (it has no idea what it is)
    // Lowered threshold from 0.60 to 0.40 to filter out confident non-plants (e.g., "Keyboard" @ 55%)
    if (topProb < 0.40) {
        console.log(`⚠️ Low confidence non-plant (${topName} @ ${(topProb * 100).toFixed(0)}%). Passing to Expert as fallback.`);
        console.groupEnd();
        // V6: Pass, but return the detections so Expert can double-check!
        return { pass: true, allPredictions: predictions, detectedClass: topName };
    }

    console.warn(`⛔ Blocked: Confident non-plant (${topName} @ ${(topProb * 100).toFixed(0)}%)`);
    console.groupEnd();
    return { pass: false, reason: 'Not a Plant', detectedClass: topName };
};

import { DISEASE_DB } from './DiseaseDatabase';

// 1. DEFINE THE CLASS ORDER (Must match alphabetic folders from training)
const MODEL_CLASSES = [
    'Cotton_Disease_Red_Leaf_Curl',
    'Cotton_Healthy',
    'Soybean_Brown_Spot',
    'Soybean_Frog_Eye_Spot',
    'Soybean_Healthy',
    'Soybean_Mosaic_Virus'
];

// --- 1. IMAGE QUALITY CHECK (Blur & Brightness) ---
interface ImageQualityResult {
    pass: boolean;
    issues: string[];
    details: { brightness: number; variance: number };
}

export const analyzeImageQuality = (img: HTMLImageElement): ImageQualityResult => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { pass: true, issues: [], details: { brightness: 128, variance: 100 } }; // Fail safe

    // Resize for performance (don't need full res for heuristic)
    canvas.width = 224;
    canvas.height = 224;
    ctx.drawImage(img, 0, 0, 224, 224);

    const imageData = ctx.getImageData(0, 0, 224, 224);
    const data = imageData.data;
    let totalBrightness = 0;

    // 1. Calculate Brightness (Luma)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // HSP Color Model for perceived brightness
        const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
        totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / (data.length / 4);

    // 2. Simple Blur Detection (Edge Frequency)
    // A true Laplacian variance is expensive in JS. We'll use a simplified check:
    // Count pixels that are significantly different from their neighbors.
    let edgeScore = 0;
    const threshold = 20;
    for (let i = 0; i < data.length; i += 8) { // Sample every 2nd pixel
        if (i + 4 < data.length) {
            const diff = Math.abs(data[i] - data[i + 4]); // neighbor diff
            if (diff > threshold) edgeScore++;
        }
    }
    const focusScore = (edgeScore / (data.length / 8)) * 100;

    const issues: string[] = [];
    if (avgBrightness < 40) issues.push('Too Dark');
    if (avgBrightness > 220) issues.push('Too Bright');
    if (focusScore < 5) issues.push('Blurry'); // Heuristic threshold

    return {
        pass: issues.length === 0,
        issues,
        details: { brightness: avgBrightness, variance: focusScore }
    };
};

// --- 2. COLOR HEALTH ANALYSIS (Pixel-level sanity check) ---
interface ColorHealthResult {
    isHealthyColor: boolean;
    yellowRatio: number;
    brownRatio: number;
    greenRatio: number;
}

const analyzeColorHealth = (img: HTMLImageElement): ColorHealthResult => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { isHealthyColor: true, yellowRatio: 0, brownRatio: 0, greenRatio: 1 };

    // Focus on center crop (where the leaf usually is)
    canvas.width = 224;
    canvas.height = 224;
    ctx.drawImage(img, 0, 0, 224, 224);
    const frame = ctx.getImageData(56, 56, 112, 112); // Center 50%
    const data = frame.data;

    let greenPixels = 0;
    let yellowPixels = 0;
    let brownPixels = 0;
    let totalMeasured = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // HSV Conversion would be better, but RGB heuristics work for speed

        // Green: G is dominant
        const isGreen = g > r && g > b && g > 60;

        // Yellow: R and G are high and similar, B is low
        const isYellow = r > 100 && g > 100 && b < 100 && Math.abs(r - g) < 40;

        // Brown: R is dominant but low intensity, G is medium
        const isBrown = r > g && r > b && r < 180 && g < 140;

        if (isGreen) greenPixels++;
        else if (isYellow) yellowPixels++;
        else if (isBrown) brownPixels++;

        if (r + g + b > 50) totalMeasured++; // Ignore black background
    }

    const safeTotal = totalMeasured || 1;
    return {
        isHealthyColor: (yellowPixels + brownPixels) / safeTotal < 0.15, // If > 15% is bad color, not healthy
        greenRatio: greenPixels / safeTotal,
        yellowRatio: yellowPixels / safeTotal,
        brownRatio: brownPixels / safeTotal
    };
};


export const classifyImage = async (
    imageElement: HTMLImageElement,
    context?: { weather?: any, season?: string, isOnline?: boolean }
): Promise<ScanResult> => {
    const isOnline = context?.isOnline ?? navigator.onLine;

    // --- STRATEGY 1: ONLINE CLOUD BRAIN (Gemini) 🧠☁️ ---
    if (isOnline && hasApiKey()) {
        console.log('🚀 Using Online Cloud Brain (Gemini)...');
        try {
            // Convert to Base64
            const canvas = document.createElement('canvas');
            canvas.width = 224;
            canvas.height = 224;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(imageElement, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);

            const geminiResult = await analyzeImageWithGemini(base64);

            return {
                crop: geminiResult.crop !== 'Not_A_Plant' ? geminiResult.crop : 'Not_A_Plant',
                cropConfidence: geminiResult.confidence,
                disease: geminiResult.disease === 'None' ? undefined : geminiResult.disease,
                diseaseConfidence: geminiResult.confidence,
                severity: geminiResult.severity,
                candidates: [], // Gemini gives one definitive answer mostly
                source: 'Gemini',
                geminiResult
            };
        } catch (error) {
            console.error('⚠️ Gemini Failed, falling back to Local Brain...', error);
            // Fallthrough to local logic
        }
    }

    // --- STRATEGY 2: OFFLINE LOCAL BRAIN (TensorFlow.js) 🧠📱 ---
    console.log('🚜 Using Local Edge Brain (TFJS)...');

    // ... (Load Model Logic same as before)
    // Only block if the CRITICAL custom model is missing. 
    // Gatekeeper is optional (might be null if network failed).
    if (!customModel) {
        await loadModel();
        if (!customModel) throw new Error('AI Model could not be loaded.');
    }

    console.log('🔍 Classifying image with Context Fusion...');

    // 0. QUALITY CHECK 📸
    const quality = analyzeImageQuality(imageElement);
    if (!quality.pass) {
        console.warn('⚠️ Bad Image Quality:', quality.issues);
        // We still proceed but attach a warning property or lower confidence? 
        // For now, let's just log it. In future, we can return a specific error.
    }

    // 1. GATEKEEPER CHECK 🛡️
    const gatekeeper = await runGatekeeper(imageElement);

    if (!gatekeeper.pass) {
        return { crop: 'Not_A_Plant', cropConfidence: 0.95, source: 'TFJS' };
    }

    if (gatekeeper.reason === 'Conflict') {
        return { crop: 'Other', cropConfidence: 0.85, source: 'TFJS' };
    }

    // 2. EXPERT CHECK (Custom Model) 🧠
    return tf.tidy((): any => {
        // Preprocess
        const tensor = tf.browser.fromPixels(imageElement)
            .resizeBilinear([224, 224])
            .toFloat()
            .div(tf.scalar(255.0))
            .expandDims();

        // Predict
        const prediction = customModel!.predict(tensor) as tf.Tensor;
        const probabilities = prediction.dataSync(); // Float32Array

        // 3. CONTEXT FUSION SCORING (The "Secret Sauce") 🧪
        // We modify the raw probabilities based on environmental factors

        const finalScores = [...probabilities];
        const weather = context?.weather;

        if (weather) {
            console.group('🌥️ Context Fusion Analysis');

            // FUNGAL BOOST (High Humidity)
            // Indices: 0 (Cotton Red Leaf?), 2 (Soy Brown Spot), 3 (Soy Frog Eye) -> These are fungal/bacterial mostly
            // Note: Red Leaf Curl is viral/stress, Brown Spot/Frog Eye are fungal.
            if (weather.humidity > 80) {
                console.log('💧 High Humidity detected (>80%). Boosting Fungal probabilities.');
                finalScores[2] += 0.15; // Brown Spot
                finalScores[3] += 0.15; // Frog Eye
            }

            // VIRAL/PEST BOOST (High Temp + Dry)
            if (weather.temp > 30 && weather.humidity < 50) {
                console.log('🔥 Hot & Dry. Boosting Viral/Stress probabilities.');
                finalScores[0] += 0.10; // Red Leaf Curl (often stress-related vector)
                finalScores[5] += 0.10; // Mosaic Virus
            }

            console.groupEnd();
        }

        // 4. COLOR SANITY CHECK 🎨
        const colorAnalysis = analyzeColorHealth(imageElement);
        console.log('🎨 Color Analysis:', colorAnalysis);

        // 5. DETERMINE WINNER
        let bestCrop: 'Cotton' | 'Soybean' | 'Other' = 'Other';
        let cropConfidence = 0;
        let maxProb = 0;
        let bestClassIndex = 0;

        finalScores.forEach((prob, i) => {
            const className = MODEL_CLASSES[i];

            // Normalize after boost (simple clamp, strictly speaking softmax would be better but this is fine for ranking)
            const adjustedProb = Math.min(prob, 1.0);

            // Track Global Max (Specific Disease)
            if (adjustedProb > maxProb) {
                maxProb = adjustedProb;
                bestClassIndex = i;

                // Determine Crop based on the WINNING CLASS
                if (className.startsWith('Cotton')) {
                    bestCrop = 'Cotton';
                } else if (className.startsWith('Soybean')) {
                    bestCrop = 'Soybean';
                } else {
                    bestCrop = 'Other';
                }
            }
        });

        cropConfidence = maxProb;
        const winningClass = MODEL_CLASSES[bestClassIndex];

        console.group('🧠 Expert Prediction');
        console.log(`Winning Class: ${winningClass}`);
        console.log(`Confidence: ${(cropConfidence * 100).toFixed(1)}%`);
        console.log(`Detected Crop: ${bestCrop}`);
        console.groupEnd();

        // UNKNOWN CROP FILTER
        // Lowered to 30% normally to allow Visual Verification.
        // STRICT MODE: If Gatekeeper is offline, we require 85% confidence to avoid huge false positives.
        const minConfidence = gatekeeper.strictMode ? 0.85 : 0.30;

        // 🛡️ V6.5 CONTEXT FUSION REFINED: "The Balanced Bouncer"
        // If Expert says "Healthy" (which is potential trash class),
        // AND Gatekeeper sees a non-plant object with SIGNIFICANT confidence (>20%),
        // WE REJECT IT.
        // BUT if Gatekeeper is just seeing noise (e.g. "chainlink fence" @ 8%), and Expert is surefire (>90%), we TRUST EXPERT.
        const expertSaysHealthy = winningClass.includes('Healthy');
        const suspect = gatekeeper.allPredictions && gatekeeper.allPredictions.length > 0 ? gatekeeper.allPredictions[0] : null;

        // Only suspect non-plant if top prediction is NOT a plant keyword AND has >20% confidence
        const gatekeeperSuspectsNonPlant = suspect && !PLANT_KEYWORDS.some(k => suspect.className.toLowerCase().includes(k));
        const gatekeeperConfident = suspect && suspect.probability > 0.20;

        if (expertSaysHealthy && gatekeeperSuspectsNonPlant) {
            console.warn(`🤔 Context Fusion Conflict: Expert 'Healthy' (${(cropConfidence * 100).toFixed(0)}%) vs Gatekeeper '${suspect.className}' (${(suspect.probability * 100).toFixed(0)}%).`);

            // BLOCKING RULES:
            // 1. If Gatekeeper is very confident (>20%) it's not a plant -> BLOCK.
            // 2. If Expert is NOT super confident (<90%) -> BLOCK (Safety First).
            if (gatekeeperConfident || cropConfidence < 0.90) {
                console.warn(`⛔ BLOCKED by Context Fusion.`);
                return {
                    crop: 'Not_A_Plant',
                    cropConfidence: 0.90,
                    candidates: [],
                    source: 'TFJS'
                };
            } else {
                console.log(`✅ PASSED Context Fusion: Expert confidence (${(cropConfidence * 100).toFixed(0)}%) outweighed weak Gatekeeper signal.`);
            }
        }

        if (cropConfidence < minConfidence) {
            console.warn(`⚠️ Confidence ${cropConfidence.toFixed(2)} below threshold (${minConfidence}). Rejected.`);
            return {
                crop: gatekeeper.strictMode ? 'Not_A_Plant' : 'Other',
                cropConfidence: cropConfidence,
                candidates: [],
                source: 'TFJS'
            };
        }

        // Collect all candidates for the detected crop
        const candidates = MODEL_CLASSES
            .map((name, idx) => ({ disease: name, confidence: finalScores[idx] }))
            .filter(c => c.disease.startsWith(bestCrop)) // Only candidates for the confirmed crop
            .sort((a, b) => b.confidence - a.confidence); // Sort by confidence

        // 6. FINAL DISEASE DIAGNOSIS (Winner)
        const bestCandidate = candidates[0];
        let finalDiseaseName = bestCandidate.disease;
        let finalConfidence = bestCandidate.confidence;

        // 🛡️ HEALTHY OVERRIDE (The "Anti-False-Healthy" Logic)
        // If AI says "Healthy" BUT pixels say "Sick" (Yellow/Brown > 15%)
        if (finalDiseaseName.includes('Healthy') && !colorAnalysis.isHealthyColor) {
            console.warn('⚠️ AI Predicts Healthy, but Color Analysis detects issues (Yellow/Brown > 15%).');

            // Downgrade confidence
            finalConfidence = 0.40; // Force it to be "Uncertain"
            finalDiseaseName += ' (Uncertain)';

            // Check if there is a 2nd candidate that matches the color better?
            // For now, just marking it Uncertain forces the user to check.
        }

        // 🛡️ SAFETY CHECK: "Uncertain Healthy" (Relaxed Threshold)
        // Lowered from 0.96 to 0.85
        if (finalDiseaseName.includes('Healthy') && finalConfidence < 0.85) {
            if (!finalDiseaseName.includes('Uncertain')) {
                finalDiseaseName += ' (Uncertain)';
            }
        }

        const diseaseInfo = DISEASE_DB[finalDiseaseName.replace(' (Uncertain)', '')];
        let finalSeverity = diseaseInfo ? diseaseInfo.severity : 'Medium';

        // Override severity if override triggered
        if (finalDiseaseName.includes('Uncertain') && !colorAnalysis.isHealthyColor) {
            finalSeverity = 'Low'; // Assume early stage or deficiency if AI missed it
        }

        // Return candidates
        return {
            crop: bestCrop,
            cropConfidence: cropConfidence,
            disease: finalDiseaseName, // Return Key (e.g. "Cotton_Healthy" or "Cotton_Healthy (Uncertain)")
            diseaseConfidence: finalConfidence,
            severity: finalSeverity,
            candidates: candidates.slice(0, 3),
            weatherContext: context?.weather,
            colorHealth: colorAnalysis.isHealthyColor,
            source: 'TFJS'
        };
    });
};

// 7. DYNAMIC QUESTION GENERATOR 🧠
// Compares two diseases and finds the unique symptoms to ask the user
export const generateDifferentiatingQuestions = (
    candidateAKey: string,
    candidateBKey: string,
    lang: 'en' | 'mr' = 'en'
): VerificationQuestion[] => {
    const diseaseA = DISEASE_DB[candidateAKey];
    const diseaseB = DISEASE_DB[candidateBKey];

    if (!diseaseA || !diseaseB) return [];

    // Get clean symptom lists
    const getSymptoms = (d: any): string[] => (lang === 'mr' && d.symptomsMarathi) ? d.symptomsMarathi : d.symptoms;

    const symptomsA = new Set(getSymptoms(diseaseA));
    const symptomsB = new Set(getSymptoms(diseaseB));

    const questions: VerificationQuestion[] = [];

    // Find symptoms unique to A
    symptomsA.forEach(s => {
        if (!symptomsB.has(s)) {
            questions.push({
                id: `q_${candidateAKey}_${questions.length}`,
                text: lang === 'mr' ? `तुम्हाला हे लक्षण दिसते का: ${s}?` : `Do you see this symptom: "${s}"?`,
                symptom: s,
                pointsTo: candidateAKey,
                language: lang
            });
        }
    });

    // Find symptoms unique to B
    symptomsB.forEach(s => {
        if (!symptomsA.has(s)) {
            questions.push({
                id: `q_${candidateBKey}_${questions.length}`,
                text: lang === 'mr' ? `तुम्हाला हे लक्षण दिसते का: ${s}?` : `Do you see this symptom: "${s}"?`,
                symptom: s,
                pointsTo: candidateBKey,
                language: lang
            });
        }
    });

    // Shuffle and pick top 3 to avoid overwhelming
    return questions.sort(() => 0.5 - Math.random()).slice(0, 3);
};

// 8. CONFIRMATION QUESTION GENERATOR (V5) 🕵️‍♂️
// Generates questions to validate a SINGLE target disease (e.g., when user manually selects it)
export const generateConfirmationQuestions = (
    targetDiseaseKey: string,
    lang: 'en' | 'mr' = 'en'
): VerificationQuestion[] => {
    const disease = DISEASE_DB[targetDiseaseKey];
    if (!disease) return [];

    // Get clean symptom lists
    const getSymptoms = (d: any): string[] => (lang === 'mr' && d.symptomsMarathi) ? d.symptomsMarathi : d.symptoms;
    const symptoms = getSymptoms(disease);

    // Pick top 3 symptoms to confirm
    return symptoms.slice(0, 3).map((s, idx) => ({
        id: `confirm_${targetDiseaseKey}_${idx}`,
        text: lang === 'mr' ? `तुम्हाला हे लक्षण दिसते का: ${s}?` : `Do you see this symptom: "${s}"?`,
        symptom: s,
        pointsTo: targetDiseaseKey,
        language: lang
    }));
};
