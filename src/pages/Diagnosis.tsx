import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, AlertTriangle, Leaf,
    Calendar, Info, ScanLine, CheckSquare, CheckCircle, Sparkles,
    Sprout, ArrowRight, XCircle, Volume2, Share2, Printer, UserCheck, MapPin, ShieldCheck
} from 'lucide-react';

import CameraInput from '../components/CameraInput';
import { classifyImage, type ScanResult } from '../services/DiagnosisService';
import { DISEASE_DB, type DiseaseInfo, type TreatmentOption } from '../services/DiseaseDatabase';
import { useVoice } from '../hooks/useVoice';
import { saveDiagnosis, saveCorrection, getHistory } from '../services/db';
import { useStore } from '../store/useStore';
import { createConsultationRequest } from '../services/ExpertConsultationService';
import { generateDiagnosisReport } from '../utils/reportGenerator';
import clsx from 'clsx';
import PageHeader from '../components/PageHeader';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { type GeminiDiagnosis, hasApiKey } from '../services/GeminiService';
import TreatmentTimeline from '../components/TreatmentTimeline';
import { type VerificationQuestion, generateConfirmationQuestions } from '../services/DiagnosisService';
import { saveFeedback } from '../services/FeedbackService';

export default function Diagnosis() {
    // State Machine: 'input' -> 'analyzing' -> 'confirm_crop' -> 'visual_verification' -> 'symptom_check' -> 'result'
    const [step, setStep] = useState<'input' | 'analyzing' | 'confirm_crop' | 'visual_verification' | 'symptom_check' | 'result'>('input');
    const [lang, setLang] = useState<'en' | 'mr'>('en');

    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    // Disease Data (From Static DB)
    const [diseaseDetails, setDiseaseDetails] = useState<DiseaseInfo | null>(null);
    const [selectedTx, setSelectedTx] = useState<TreatmentOption | null>(null);

    // Manual Override State
    const [showDiseaseSelector, setShowDiseaseSelector] = useState(false);
    const [manualCrop, setManualCrop] = useState<string | null>(null);
    const [showDetailedReport, setShowDetailedReport] = useState(false);

    // Expert Consultation State
    const [showExpertModal, setShowExpertModal] = useState(false);
    const [expertNotes, setExpertNotes] = useState('');
    const [farmSize, setFarmSize] = useState(1); // Default 1 Acre
    const [completedStages, setCompletedStages] = useState<number[]>([]); // Track completed treatment steps

    // Symptom Verification State
    const [checkedSymptoms, setCheckedSymptoms] = useState<Record<string, boolean>>({});
    const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [verificationQuestions, setVerificationQuestions] = useState<VerificationQuestion[]>([]);


    const [isSaved, setIsSaved] = useState(false);
    const [scanningMessage, setScanningMessage] = useState('Initializing...');

    const { speak, stopSpeaking, isSpeaking } = useVoice();
    const { user, location: appLocation, setChatContext } = useStore();
    const { isOnline } = useNetworkStatus();

    // Auto-sync active diagnosis to the Global AI Companion Context
    useEffect(() => {
        if (scanResult) {
            setChatContext({ scanResult, diseaseDetails });
        }
    }, [scanResult, diseaseDetails, setChatContext]);

    const handleImageSelect = (file: File) => {
        setImage(file);
        setStep('input');
        stopSpeaking();

        // Convert to Base64 for DB storage
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const startDiagnosis = async () => {
        if (!image) return;
        setStep('analyzing');
        setScanResult(null); // Reset prev result
        setCheckedSymptoms({});
        setIsSaved(false); // Reset save flag
        setDiseaseDetails(null); // Clear previous details to prevent stale data
        setCompletedStages([]); // Reset completed treatments


        // ⏳ UX DELAY: Allow the "Scanning" animation to play for at least 2 seconds
        // This builds user trust that "deep analysis" is happening and ensures the animation frame renders.
        setScanningMessage('Scanning Leaf...');
        await new Promise(resolve => setTimeout(resolve, 800));

        setScanningMessage('Analyzing Texture...');
        await new Promise(resolve => setTimeout(resolve, 800));

        setScanningMessage(isOnline ? 'Consulting Cloud Brain...' : 'Running Local Neural Net...');
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const imgElement = document.createElement('img');
            imgElement.src = URL.createObjectURL(image);
            await new Promise((resolve) => (imgElement.onload = resolve));

            // Get Weather Context from Store
            const { location } = useStore.getState();
            const { weather } = location;

            // Determine Season
            const month = new Date().getMonth(); // 0-11
            let season = 'Winter';
            if (month >= 2 && month <= 5) season = 'Summer';
            else if (month >= 6 && month <= 9) season = 'Monsoon';

            // API Key Check for Online Mode
            // API Key Check for Online Mode
            // (Key is now strictly from .env or pre-configured in GeminiService)
            if (isOnline && !hasApiKey()) {
                console.warn('⚠️ No Gemini API Key found in .env. Online mode might fail.');
                // Removed user prompt as per V8 requirements.
            }

            const result = await classifyImage(imgElement, {
                weather: weather,
                season: season,
                isOnline: isOnline
            });
            setScanResult(result);

            // If it's not a plant, go straight to result (error state)
            if (result.crop === 'Not_A_Plant' || result.crop === 'Other') {
                setStep('result');
            } else {
                // 🚀 V3 SMART FLOW: Auto-Confirm High Confidence
                if (result.cropConfidence > 0.90) {
                    // Skip 'confirm_crop' screen

                    // Immediately check if we need Visual Verification or Symptom Check
                    // We need to load details first to check for lookalikes
                    if (result.disease) {
                        const details = loadDiseaseDetails(result.disease, result.geminiResult);

                        // Check Visual Verification requirements
                        const isGemini = result.source === 'Gemini';
                        const needsVisualVerification = !isGemini && ((result.diseaseConfidence && result.diseaseConfidence < 0.85) || (details && details.lookalikes && details.lookalikes.length > 0));

                        if (needsVisualVerification) {
                            setStep('visual_verification');
                        } else {
                            // Check Symptom Verification requirements (Skip if High Confidence)
                            // Plan says skip if > 80%. Let's be safe with 85%.
                            const needsSymptomCheck = (result.diseaseConfidence && result.diseaseConfidence < 0.85);

                            if (needsSymptomCheck) {
                                setStep('symptom_check');
                            } else {
                                // ⚡ ULTRA FAST PATH: Go straight to Result
                                setStep('result');
                            }
                        }
                    } else {
                        // Should not happen if crop detected but no disease?
                        // If healthy, disease is 'Healthy'.
                        setStep('confirm_crop'); // Fallback
                    }
                } else {
                    setStep('confirm_crop');
                }
            }

        } catch (error) {
            console.error('Diagnosis failed', error);
            alert('Failed to analyze image. Please try again.');
            setStep('input');
        }
    };

    const loadDiseaseDetails = (diseaseKey: string, geminiData?: GeminiDiagnosis) => {
        // Normalize key (remove suffix if any)
        const cleanKey = diseaseKey.replace(' (Uncertain)', '');

        let foundDetails: DiseaseInfo | undefined;

        // Try strict match first
        if (DISEASE_DB[cleanKey]) {
            foundDetails = DISEASE_DB[cleanKey];
        } else {
            // Fuzzy search by name
            foundDetails = Object.values(DISEASE_DB).find(d => d.name === cleanKey);
        }

        if (foundDetails) {
            setDiseaseDetails({ ...foundDetails, isGemini: !!geminiData }); // Preserve flag if it came from Gemini but matched DB
            return foundDetails; // Return for immediate use
        } else if (geminiData) {
            console.log("Generating dynamic details from Gemini Data:", geminiData);
            // 🧠 Dynamic Details from Gemini
            const dynamicDetails: DiseaseInfo = {
                name: geminiData.disease,
                localName: geminiData.disease, // Fallback, AI might not give Marathi name
                description: geminiData.description || "Detailed analysis by AI.",
                detailedDescription: geminiData.detailedDescription || "No detailed description provided.",
                detailedDescriptionMarathi: geminiData.detailedDescription || "विस्तृत माहिती उपलब्ध नाही.",
                cause: geminiData.cause || "Unknown",
                causeMarathi: geminiData.cause || "माहित नाही",
                symptoms: geminiData.symptoms || [],
                symptomsMarathi: geminiData.symptoms || [],
                preventiveMeasures: geminiData.preventiveMeasures || [],
                preventiveMeasuresMarathi: geminiData.preventiveMeasures || [],
                // Ensure treatment units match the DB requirements
                treatmentPlan: (geminiData.treatmentPlan || []).map(stage => ({
                    stageName: stage.stageName,
                    description: stage.description,
                    products: stage.products.map(p => ({
                        name: p.name,
                        brand: p.brand || p.name,
                        composition: p.composition,
                        dosage: p.dosage,
                        dosagePerAcre: p.dosagePerAcre || 100, // Safe Fallback
                        unit: p.unit || 'ml',
                        type: p.type || 'Chemical',
                        image: '/images/pesticide.png' // Default image for AI generated products
                    }))
                })),
                severity: geminiData.severity || 'Medium',
                isGemini: true,
                images: [] // Don't have local DB images for dynamic
            };
            setDiseaseDetails(dynamicDetails);
            return dynamicDetails;
        } else {
            // Fallback
            const fallback: DiseaseInfo = {
                name: cleanKey,
                localName: cleanKey,
                description: 'No specific details available.',
                cause: 'Unknown',
                symptoms: [],
                preventiveMeasures: [],
                treatmentPlan: [],
                severity: 'Medium'
            };
            setDiseaseDetails(fallback);
            return fallback;
        }
    }



    const startSymptomCheck = () => {
        if (!scanResult?.disease) return;

        // Ensure details are loaded (critical if coming from confirm_crop flow)
        loadDiseaseDetails(scanResult.disease, scanResult.geminiResult);

        setCheckedSymptoms({});
        setVerificationQuestions([]);

        const confidence = scanResult.diseaseConfidence || 0;

        // V5 FLOW: VISUAL FIRST 👁️
        // If confidence is < 90% (unless explicitly manual override), force visual verification first.
        // This ensures the user SEES the options before we ask questions.
        const isGemini = scanResult.source === 'Gemini';

        // Skip if already very high confidence OR Gemini
        if (confidence >= 0.90 || isGemini) {
            // AUTO-CONFIRM (Or ask 1 simple question?)
            // For now, let's just go to results to be fast.
            // OR: We can ask confirmation for the top choice?
            // Let's ask confirmation if < 95% just to be safe?
            if (confidence < 0.95) {
                const q = generateConfirmationQuestions(scanResult.disease, lang);
                setVerificationQuestions(q);
                setStep('symptom_check');
            } else {
                setStep('result');
            }
        } else {
            // Force Visual Triage
            setStep('visual_verification');
        }
    };

    const confirmVerification = (confirmedDiseaseKey: string) => {
        const cleanKey = confirmedDiseaseKey.replace(' (Uncertain)', '');
        const info = DISEASE_DB[cleanKey];

        if (info) {
            // V5 LOGIC: The user has selected a SPECIFIC disease visually.
            // We must now VALIDATE this choice with specific questions for THIS disease.
            // We do NOT ask "Is it healthy?" if they picked "Blight".

            // 1. Update the Main Result to be the User's Choice
            setScanResult(prev => prev ? ({
                ...prev,
                disease: cleanKey,
                diseaseConfidence: 0.90, // User verified visually
                candidates: [
                    { disease: cleanKey, confidence: 1.0 }, // Winner (User)
                    ...(prev.candidates?.filter(c => c.disease !== cleanKey) || []) // Others
                ]
            }) : null);
            setDiseaseDetails(info);

            // 2. Generate Validation Questions for THIS disease
            const q = generateConfirmationQuestions(cleanKey, lang);
            setVerificationQuestions(q);
        }
        setStep('symptom_check');
    };

    const finishSymptomCheck = () => {
        // 🧠 RE-RANKING LOGIC (V5: SIMPLIFIED)
        // If we are confirming a SINGLE candidate (V5 Validation flow), we just check if the user said "Yes".
        // If we are comparing two (Legacy/Auto flow), we use the score.

        let finalDisease = scanResult?.disease || '';
        let finalConfidence = scanResult?.diseaseConfidence || 0;
        let reRankedCandidates = scanResult?.candidates ? [...scanResult.candidates] : [];

        // Check if we are in "Confirmation Mode" (Single Target) OR "Differentiation Mode" (Comparison)
        const isConfirmation = verificationQuestions.some(q => q.id.startsWith('confirm_'));

        if (verificationQuestions.length > 0) {
            if (isConfirmation) {
                // 🕵️‍♂️ CONFIRMATION LOGIC
                // We asked "Do you see X, Y, Z?" for the chosen disease.
                let confirmedCount = 0;
                let deniedCount = 0;

                verificationQuestions.forEach(q => {
                    if (checkedSymptoms[q.symptom] === true) confirmedCount++;
                    if (checkedSymptoms[q.symptom] === false) deniedCount++;
                });

                if (deniedCount > confirmedCount) {
                    // Uh oh, user denied the symptoms of their own choice?
                    // Maybe downgrade confidence?
                    console.warn("User selected a disease but denied its symptoms.");
                    finalConfidence = Math.max(0.60, finalConfidence - 0.2); // Penalize
                    finalDisease += ' (Unverified)';
                } else {
                    // User confirmed! Boost to 99%
                    finalConfidence = 0.99;
                }

            } else if (reRankedCandidates.length >= 2) {
                // ⚖️ DIFFERENTIATION LOGIC (Legacy / Auto)
                // Existing logic to swap candidates
                const candidateA = reRankedCandidates[0];
                const candidateB = reRankedCandidates[1];

                let scoreA = 0;
                let scoreB = 0;

                verificationQuestions.forEach(q => {
                    const answer = checkedSymptoms[q.symptom];
                    if (answer === true) {
                        if (q.pointsTo === candidateA.disease) scoreA++;
                        else if (q.pointsTo === candidateB.disease) scoreB++;
                    } else if (answer === false) {
                        if (q.pointsTo === candidateA.disease) scoreA--;
                        else if (q.pointsTo === candidateB.disease) scoreB--;
                    }
                });

                if (scoreB > scoreA) {
                    finalDisease = candidateB.disease;
                    finalConfidence = 0.85;
                    reRankedCandidates = [candidateB, candidateA, ...reRankedCandidates.slice(2)];
                    const info = DISEASE_DB[finalDisease];
                    if (info) setDiseaseDetails(info);
                } else if (scoreA > scoreB) {
                    finalConfidence = Math.min(0.99, (finalConfidence || 0) + 0.1);
                }
            }
        }

        // Update the ScanResult with the FINAL decision
        const finalResult: ScanResult = {
            ...scanResult!,
            disease: finalDisease,
            diseaseConfidence: finalConfidence,
            candidates: reRankedCandidates
        };

        setScanResult(finalResult);
        setStep('result');

        // SAVE FEEDBACK (Training Data)
        if (scanResult) {
            saveFeedback({
                userId: user?.id || 'guest',
                aiPrediction: {
                    crop: scanResult.crop,
                    disease: scanResult.disease || 'Unknown',
                    confidence: scanResult.diseaseConfidence || 0
                },
                userCorrection: {
                    disease: finalDisease,
                    symptomsConfirmed: Object.keys(checkedSymptoms).filter(k => checkedSymptoms[k])
                },
                timestamp: new Date(),
                location: location
            });
        }
    };

    const manualSelectDisease = (key: string) => {
        setShowDiseaseSelector(false);
        setManualCrop(null);
        // Mock a scan result for the manual selection
        const info = DISEASE_DB[key];
        setScanResult({
            crop: key.startsWith('Cotton') ? 'Cotton' : 'Soybean',
            cropConfidence: 1.0,
            disease: key, // Store Key
            diseaseConfidence: 1.0,
            severity: info.severity,
            candidates: [{ disease: key, confidence: 1.0 }] // Single candidate for manual
        });
        setDiseaseDetails(info);
        setCheckedSymptoms({});
        setVerificationQuestions([]); // Manual = No confusion = No comparison questions
        setStep('symptom_check'); // Go to symptoms instead of result directly
    };

    const toggleSymptom = (symptom: string) => {
        setCheckedSymptoms(prev => ({
            ...prev,
            [symptom]: !prev[symptom]
        }));
    };

    // Get Location on Mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (err) => console.log('Location access denied', err)
            );
        }
    }, []);

    // Re-calculate Best Candidate based on Checklist
    // V5 UPDATE: DISABLED legacy auto-switching.
    // We now rely on explicit "Finish" action in finishSymptomCheck to commit changes.
    /*
    useEffect(() => {
        if (step !== 'symptom_check' || !scanResult?.candidates) return;
    
        let bestCandidate = scanResult.candidates[0];
        let maxScore = -1;
    
        scanResult.candidates.forEach(c => {
            const d = DISEASE_DB[c.disease];
            if (!d) return;
    
            // Get symptoms for this disease
            const symptoms = lang === 'mr' && d.symptomsMarathi ? d.symptomsMarathi : d.symptoms;
            const totalSymptoms = symptoms.length;
    
            if (totalSymptoms === 0) return;
    
            // Count matches
            let matches = 0;
            symptoms.forEach(s => {
                if (checkedSymptoms[s]) matches++;
            });
    
            // Scoring Formula: Base Confidence + (Match % * Weight)
            const matchScore = (matches / totalSymptoms);
            const finalScore = c.confidence + matchScore; // Simple addition gives significant weight to user input
    
            if (finalScore > maxScore) {
                maxScore = finalScore;
                bestCandidate = c;
            }
        });
    
        // Update the displayed disease details to the new winner
        if (bestCandidate && bestCandidate.disease !== diseaseDetails?.name) {
            const info = DISEASE_DB[bestCandidate.disease];
            if (info) setDiseaseDetails(info);
        }
    
    }, [checkedSymptoms, scanResult, step, lang]);
    */

    const playResultAudio = () => {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            if (!scanResult || scanResult.crop === 'Not_A_Plant') {
                speak("He zaad naahi. Krupaya zaadaca photo kadha.", 'mr-IN');
                return;
            }

            // Construct Marathi String
            const cropName = scanResult.crop === 'Cotton' ? 'Kapus' : scanResult.crop === 'Soybean' ? 'Soybean' : scanResult.crop;
            const diseaseName = diseaseDetails?.localName || scanResult.disease;

            let text = `He ${cropName} aahe.Tyala ${diseaseName} zaala aahe.`;

            if (diseaseDetails?.treatmentPlan.length && diseaseDetails.treatmentPlan.length > 0) {
                const t = diseaseDetails.treatmentPlan[0].products[0]; // First product of first stage
                text += ` Hya sathi ${t.brand || t.name} vapra.`;
            }

            speak(text, 'mr-IN');
        }
    };

    const toggleLang = () => setLang(prev => prev === 'en' ? 'mr' : 'en');

    // Auto-Save Effect
    useEffect(() => {
        if (step === 'result' && scanResult && !isSaved) {
            const save = async () => {
                await saveDiagnosis({
                    userId: user?.id || 'guest',
                    date: new Date(),
                    crop: scanResult.crop,
                    diseaseName: diseaseDetails?.name || scanResult.disease || 'Unknown',
                    confidence: scanResult.diseaseConfidence || 0,
                    severity: (diseaseDetails?.severity as any) || 'Medium',
                    symptoms: Object.keys(checkedSymptoms).filter(k => checkedSymptoms[k]),
                    imageUrl: previewUrl || undefined,
                    selectedTreatment: selectedTx?.name,
                    location: location
                });
                setIsSaved(true);
            };
            save();
        }
    }, [step, scanResult, isSaved, diseaseDetails, checkedSymptoms, previewUrl, selectedTx]);

    // Handle Share Report
    const handleShare = async () => {
        if (!scanResult || !diseaseDetails) return;

        const cropName = scanResult.crop;
        const diseaseName = lang === 'mr' ? diseaseDetails.localName : diseaseDetails.name;
        const severity = diseaseDetails.severity;

        let text = `🌾 *CropGuard AI Report* 🌾\n\n`;
        text += `*Crop:* ${cropName}\n`;
        text += `*Diagnosis:* ${diseaseName} (${severity})\n`;

        if (diseaseDetails.treatmentPlan?.[0]?.products?.[0]) {
            const rec = diseaseDetails.treatmentPlan[0].products[0];
            text += `*Recommended:* ${rec.brand || rec.name} (${rec.dosage})\n`;
        }

        text += `\nDiagnosed via CropGuard AI App 📱`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CropGuard AI Diagnosis',
                    text: text,
                });
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            // Fallback to WhatsApp Web
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    // Handle Ask Expert
    const handleAskExpert = async () => {
        if (!user?.id || !scanResult || !diseaseDetails) return;

        try {
            const { location: userLocation } = useStore.getState();

            await createConsultationRequest({
                userId: user.id,
                cropType: scanResult.crop,
                disease: diseaseDetails.name,
                imageUrl: previewUrl || '',
                symptoms: Object.keys(checkedSymptoms).filter(s => checkedSymptoms[s]),
                farmerNotes: expertNotes,
                location: userLocation.locationName || 'Unknown',
                geoLocation: location,
            });

            setShowExpertModal(false);
            setExpertNotes('');

            // Show success message
            alert('✅ Consultation request sent! Check the Consultations page for updates.');
        } catch (error) {
            console.error('Failed to create consultation:', error);
            alert('Failed to send consultation request. Please try again.');
        }
    };

    // Handle Incorrect Diagnosis Reporting
    const handleCorrection = async (actualDisease: string) => {
        // 1. Get the current log ID (We need to query the latest log we just saved)
        // Since Dexie operations are async, we might not have the ID immediately if we just saved it.
        // A better approach for the future: saveDiagnosis should return the ID.
        // For now, let's query the latest log.

        try {
            const history = await getHistory(user?.id || 'guest'); // This is sorted by date desc
            if (history.length > 0) {
                const latestLog = history[0];
                // basic verification to ensure we are updating the correct log (created within last minute)
                if (new Date().getTime() - latestLog.date.getTime() < 60000) {
                    if (latestLog.id) {
                        await saveCorrection(latestLog.id, actualDisease);
                        alert(lang === 'mr' ? 'धन्यवाद! तुमची प्रतिक्रिया नोंदवली गेली आहे.' : 'Thank you! Your feedback has been recorded.');
                        setShowDiseaseSelector(false);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to handle correction", e);
        }
    };

    // Get list of diseases for Manual Override
    const availableDiseases = Object.keys(DISEASE_DB).filter(k => {
        const cropToFilter = manualCrop || scanResult?.crop;
        return cropToFilter && cropToFilter !== 'Other' && cropToFilter !== 'Not_A_Plant'
            ? k.startsWith(cropToFilter)
            : true
    });



    return (
        <div className="min-h-screen bg-surface pb-32 md:pb-10 font-sans">
            <PageHeader
                icon={<ScanLine size={20} />}
                title={lang === 'en' ? "Crop Diagnosis" : "पीक निदान"}
                subtitle={lang === 'en' ? "Scan your crop for pests or diseases" : "कीड किंवा रोगांसाठी तुमचे पीक स्कॅन करा"}
                showBack={step !== 'input'}
                rightSlot={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleLang}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-[11px] font-black px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider"
                        >
                            {lang === 'en' ? 'मराठी' : 'English'}
                        </button>
                    </div>
                }
            />

            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                <div className={`grid grid-cols-1 gap-12 transition-all ${step === 'result' && scanResult?.crop !== 'Not_A_Plant' && scanResult?.crop !== 'Other' ? 'lg:grid-cols-2' : 'max-w-xl mx-auto'}`}>

                    {/* Left Column: Input / Verification */}
                    <div className="space-y-6">
                        {/* Camera Input UI */}
                        <div className={clsx("relative rounded-[2.5rem] p-6 shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-white/60 bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-2xl overflow-hidden group transition-all duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.18)]",
                            (step === 'confirm_crop' || step === 'symptom_check') ? 'ring-4 ring-primary-500/20 shadow-[0_30px_60px_rgba(34,197,94,0.15)]' : ''
                        )}>
                            {/* Inner 3D Highlight */}
                            <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.02)] pointer-events-none" />
                            {/* Accent Top Strip */}


                            <div className="relative z-10 w-full h-full">
                                <CameraInput onImageSelect={handleImageSelect} isScanning={step === 'analyzing'} scanningMessage={scanningMessage} />
                            </div>
                        </div>

                        {/* Step 0: Start Button */}
                        {step === 'input' && image && (
                            <button onClick={startDiagnosis} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3">
                                <ScanLine size={24} /> START DIAGNOSIS
                            </button>
                        )}



                        {/* Step 2: Confirm Crop Type */}
                        {step === 'confirm_crop' && scanResult && (
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 animate-fade-in-up">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sprout className="text-primary-600" /> Plant Identified
                                </h3>

                                <div className="bg-primary-50 p-4 rounded-2xl flex items-center justify-between mb-6 border border-primary-100">
                                    <div>
                                        <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">AI Detected</p>
                                        <p className="text-2xl font-black text-gray-900">{scanResult.crop}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold border border-primary-100">
                                        {(scanResult.cropConfidence * 100).toFixed(0)}%
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={startSymptomCheck} className="bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 flex items-center justify-center gap-2">
                                        <CheckCircle size={20} /> Yes, Correct
                                    </button>
                                    <button onClick={() => setShowDiseaseSelector(true)} className="bg-white text-gray-600 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50">
                                        No, Change
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2.5: Visual Verification (New) */}
                        {step === 'visual_verification' && diseaseDetails && (
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 animate-fade-in-up">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ScanLine className="text-primary-600" /> {lang === 'mr' ? 'दृश्य पडताळणी' : 'Visual Verification'}
                                </h3>

                                <p className="text-sm text-gray-600 mb-6 font-medium">
                                    {lang === 'mr'
                                        ? "तुमच्या पिकाचा फोटो खालीलपैकी कशाशी जास्त जुळतो?"
                                        : "Which of these looks more like your crop? The AI wants to be sure."}
                                </p>

                                <div className="space-y-6">
                                    <div
                                        onClick={() => scanResult?.disease && confirmVerification(scanResult.disease)}
                                        className="relative group cursor-pointer border-2 border-primary-100 hover:border-primary-500 rounded-2xl overflow-hidden transition-all hover:shadow-xl"
                                    >
                                        <div className="absolute top-0 left-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-br-xl z-10">
                                            Option A (Likely)
                                        </div>
                                        <div className="h-40 w-full bg-gray-100 relative">
                                            {diseaseDetails.images && diseaseDetails.images[0] ? (
                                                <img
                                                    src={diseaseDetails.images[0]}
                                                    alt="Prediction"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const p = e.currentTarget.parentElement;
                                                        if (p) {
                                                            p.classList.add('bg-red-50', 'flex', 'items-center', 'justify-center');
                                                            p.innerHTML = `<span class="text-xs text-red-500 font-bold p-2 text-center">Image Load Failed: ${diseaseDetails.images?.[0]}</span>`;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-primary-50">
                                            <p className="font-bold text-gray-900">{lang === 'mr' ? diseaseDetails.localName : diseaseDetails.name}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{lang === 'mr' ? diseaseDetails.detailedDescriptionMarathi : diseaseDetails.detailedDescription}</p>
                                        </div>
                                    </div>

                                    {/* Option B: Lookalike (if exists) */}
                                    {diseaseDetails.lookalikes && diseaseDetails.lookalikes.map((lookalikeKey) => {
                                        const lookalike = DISEASE_DB[lookalikeKey];
                                        if (!lookalike) return null;
                                        return (
                                            <div
                                                key={lookalikeKey}
                                                onClick={() => confirmVerification(lookalike.name)} // Use name as key might need mapping, but DB keys usually match names or are mapped
                                            // Actually confirmVerification expects KEY. But our helper uses name lookup too.
                                            // Let's pass the KEY `lookalikeKey` which is safer.
                                            // Wait, confirmVerification implementation: `const info = DISEASE_DB[confirmedDiseaseKey];`
                                            // So I must pass the KEY.
                                            // But for Option A I passed `diseaseDetails.name`. 
                                            // diseaseDetails.name is "Healthy Cotton", key is "Cotton_Healthy".
                                            // I need to find the KEY for Option A.
                                            // `scanResult.disease` holds the key? 
                                            // `scanResult.disease` holds the NAME in previous code?
                                            // Let's check `classifyImage`: it returns `disease` as the label from model, which maps to...
                                            // Actually `DiagnosisService` returns `disease: string` which is often the Class Label.
                                            // In `loadDiseaseDetails`, I use `DISEASE_DB[cleanKey]`.
                                            // So `scanResult.disease` IS the key.
                                            />
                                        );
                                    })}

                                    {/* Correct Implementation for Option B Loop */}
                                    {diseaseDetails.lookalikes && diseaseDetails.lookalikes.slice(0, 1).map((lookalikeKey) => {
                                        const lookalike = DISEASE_DB[lookalikeKey];
                                        if (!lookalike) return null;
                                        return (
                                            <div
                                                key={lookalikeKey}
                                                onClick={() => confirmVerification(lookalikeKey)}
                                                className="relative group cursor-pointer border-2 border-gray-200 hover:border-primary-500 rounded-2xl overflow-hidden transition-all hover:shadow-xl"
                                            >
                                                <div className="absolute top-0 left-0 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-br-xl z-10">
                                                    Option B
                                                </div>
                                                <div className="h-40 w-full bg-gray-100 relative">
                                                    {lookalike.images && lookalike.images[0] ? (
                                                        <img
                                                            src={lookalike.images[0]}
                                                            alt="Lookalike"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const p = e.currentTarget.parentElement;
                                                                if (p) {
                                                                    p.classList.add('bg-red-50', 'flex', 'items-center', 'justify-center');
                                                                    p.innerHTML = '<span class="text-xs text-red-500 font-bold">Image Failed</span>';
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                                    )}
                                                </div>
                                                <div className="p-4 bg-gray-50">
                                                    <p className="font-bold text-gray-900">{lang === 'mr' ? lookalike.localName : lookalike.name}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{lang === 'mr' ? lookalike.detailedDescriptionMarathi : lookalike.detailedDescription}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Option C: None (Manual) */}
                                    <button
                                        onClick={() => setShowDiseaseSelector(true)}
                                        className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700"
                                    >
                                        None of these match
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Symptom Verification (Context-Aware) */}
                        {step === 'symptom_check' && scanResult?.candidates && (
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 animate-fade-in-up">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <CheckSquare className="text-primary-600" /> {lang === 'mr' ? 'लक्षणे तपासा' : 'Verify Symptoms'}
                                </h3>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-6">
                                    <p className="text-blue-800 text-xs font-medium">
                                        {lang === 'mr'
                                            ? "तुम्ही निवडलेल्या लक्षणांनुसार आम्ही अचूक निदान करू."
                                            : "We will refine the diagnosis based on the symptoms you verify below."}
                                    </p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {verificationQuestions.length > 0 ? (
                                        // 🧠 DYNAMIC QUESTIONS UI
                                        <div className="space-y-4 animate-fade-in-up">
                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2">
                                                <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                                <p className="text-amber-800 text-xs font-medium">
                                                    {lang === 'mr'
                                                        ? "दोन रोगांमधील फरक ओळखण्यासाठी खालील प्रश्नांची उत्तरे द्या."
                                                        : "Help the AI decide between similar diseases by answering these specific questions."}
                                                </p>
                                            </div>

                                            {verificationQuestions.map((q) => (
                                                <div key={q.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3 transition-colors hover:border-primary-300">
                                                    <p className="font-bold text-gray-900 text-sm">{q.text}</p>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setCheckedSymptoms(prev => ({ ...prev, [q.symptom]: true }))}
                                                            className={clsx("flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                                                                checkedSymptoms[q.symptom]
                                                                    ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                                                                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            {checkedSymptoms[q.symptom] && <CheckCircle size={14} />}
                                                            {lang === 'mr' ? 'होय (दिसते)' : 'Yes, I see it'}
                                                        </button>
                                                        <button
                                                            onClick={() => setCheckedSymptoms(prev => ({ ...prev, [q.symptom]: false }))}
                                                            className={clsx("flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                                                                checkedSymptoms[q.symptom] === false
                                                                    ? "bg-gray-200 text-gray-800"
                                                                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            {lang === 'mr' ? 'नाही' : 'No'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // 📋 STANDARD CHECKLIST FALLBACK
                                        (() => {
                                            // 1. Gather all unique symptoms from Top 3 candidates
                                            const allSymptoms = new Set<string>();
                                            if (scanResult.candidates && scanResult.candidates.length > 0) {
                                                scanResult.candidates.forEach((c: any) => {
                                                    const d = DISEASE_DB[c.disease];
                                                    if (d) {
                                                        const symptoms = lang === 'mr' && d.symptomsMarathi ? d.symptomsMarathi : d.symptoms;
                                                        if (symptoms) symptoms.forEach(s => allSymptoms.add(s));
                                                    }
                                                });
                                            } else if (diseaseDetails) {
                                                // 2. Fallback to main disease symptoms if no candidates (e.g. Gemini)
                                                const symptoms = lang === 'mr' && diseaseDetails.symptomsMarathi ? diseaseDetails.symptomsMarathi : diseaseDetails.symptoms;
                                                if (symptoms) symptoms.forEach(s => allSymptoms.add(s));
                                            }

                                            return Array.from(allSymptoms).map((symptom, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => toggleSymptom(symptom)}
                                                    className={clsx("flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer transition-all hover:bg-gray-50",
                                                        checkedSymptoms[symptom] ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-500/20' : ''
                                                    )}
                                                >
                                                    <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                                        checkedSymptoms[symptom] ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300'
                                                    )}>
                                                        {checkedSymptoms[symptom] && <CheckCircle size={14} />}
                                                    </div>
                                                    <span className="font-bold text-gray-700 text-sm">{symptom}</span>
                                                </div>
                                            ));
                                        })()
                                    )}
                                </div>

                                {/* Dynamic Prediction Preview */}
                                {diseaseDetails && (
                                    <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl animate-fade-in-up">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 min-w-fit ${scanResult.severity === 'High' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                scanResult.severity === 'Medium' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                    'bg-green-100 text-green-700 border border-green-200'
                                                }`}>
                                                <AlertTriangle size={14} />
                                                {scanResult.severity} Severity
                                            </div>
                                            {scanResult.source === 'Gemini' && (
                                                <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 flex items-center gap-1 border border-purple-200 min-w-fit">
                                                    <Sparkles size={14} className="text-purple-500" /> AI Assessed
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center shrink-0">
                                                <Leaf className="text-primary-500" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                                                    {lang === 'mr' ? 'सद्य निदान' : 'Current Prediction'}
                                                </p>
                                                <h4 className="font-black text-gray-900 text-xl leading-tight">
                                                    {lang === 'mr' ? diseaseDetails.localName : diseaseDetails.name}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button onClick={finishSymptomCheck} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 flex items-center justify-center gap-2 text-lg">
                                    {lang === 'mr' ? 'अहवाल पहा' : 'View Final Report'} <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Error State: Not a Plant */}
                        {step === 'result' && (scanResult?.crop === 'Not_A_Plant' || scanResult?.crop === 'Other') && (
                            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center space-y-4 animate-fade-in-up">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                                    <XCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-red-900">Not a Clear Plant Photo</h3>
                                    <p className="text-red-700 text-sm mt-1">Our AI could not detect a crop leaf. Please verify the following:</p>
                                </div>
                                <button onClick={() => setStep('input')} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-700">
                                    Try Again
                                </button>
                                <button onClick={() => setShowDiseaseSelector(true)} className="text-sm font-bold text-gray-500 underline">
                                    Manual Diagnosis (Advanced)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Results & Prescription */}
                    {step === 'result' && scanResult?.disease && diseaseDetails && (
                        <div className="space-y-6 animate-scale-up">
                            {/* Diagnosis Result Card (V3 Medical Report) */}
                            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 relative">
                                {/* Header with Severity Gradient */}
                                <div className={clsx("relative px-8 pt-12 pb-24",
                                    diseaseDetails.severity === 'Low' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                                        diseaseDetails.severity === 'Medium' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                            'bg-gradient-to-br from-rose-500 to-rose-700'
                                )}>
                                    <div className="absolute top-0 right-0 p-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                        <Leaf size={300} />
                                    </div>

                                    {/* Navigation / Actions Header */}
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="flex flex-col gap-2 items-start">
                                            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold border border-white/20 text-white flex items-center gap-2 shadow-sm">
                                                <Calendar size={14} /> {new Date().toLocaleDateString()}
                                            </span>
                                            {diseaseDetails.isGemini && (
                                                <span className="bg-purple-900/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-purple-400/50 text-white flex items-center gap-1.5 shadow-md">
                                                    ✨ Powered by Gemini AI
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Audio Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playResultAudio();
                                                }}
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors border border-white/20 shadow-sm"
                                            >
                                                {isSpeaking ? <X size={20} /> : <Volume2 size={20} />}
                                            </button>

                                            {/* Share Button (moved up) */}
                                            <button
                                                onClick={handleShare}
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors border border-white/20 shadow-sm"
                                            >
                                                <Share2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Disease Name & Confidence */}
                                    <div className="relative z-10 text-white">
                                        <h2 className="text-5xl font-black leading-tight mb-2 tracking-tight">
                                            {lang === 'mr' ? diseaseDetails.localName : diseaseDetails.name}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <p className="text-white/90 font-medium text-xl opacity-90">
                                                {lang === 'mr' ? diseaseDetails.name : diseaseDetails.localName}
                                            </p>
                                            <div className="h-1.5 w-1.5 rounded-full bg-white/60"></div>
                                            <p className="text-white/90 font-bold tracking-wide uppercase text-sm">
                                                {scanResult.diseaseConfidence ? Math.round(scanResult.diseaseConfidence * 100) : 95}% Match
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Stats Card */}
                                <div className="relative px-8 -mt-16 z-20 pb-8">
                                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 flex items-center justify-between">
                                        {/* Severity Gauge */}
                                        <div className="flex-1 border-r border-gray-100 pr-6">
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Severity Level</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={clsx("h-full rounded-full transition-all duration-1000",
                                                            diseaseDetails.severity === 'Low' ? 'w-1/3 bg-emerald-500' :
                                                                diseaseDetails.severity === 'Medium' ? 'w-2/3 bg-amber-500' :
                                                                    'w-full bg-rose-500'
                                                        )}
                                                    ></div>
                                                </div>
                                                <span className={clsx("font-black text-lg",
                                                    diseaseDetails.severity === 'Low' ? 'text-emerald-500' :
                                                        diseaseDetails.severity === 'Medium' ? 'text-amber-500' :
                                                            'text-rose-500'
                                                )}>{diseaseDetails.severity}</span>
                                            </div>
                                        </div>

                                        {/* Health Score */}
                                        <div className="pl-6 flex flex-col items-center">
                                            <div className="relative">
                                                <svg className="w-16 h-16 transform -rotate-90">
                                                    <circle className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32" />
                                                    <circle
                                                        className={clsx("transition-all duration-1000 ease-out",
                                                            diseaseDetails.severity === 'Low' ? 'text-emerald-500' :
                                                                diseaseDetails.severity === 'Medium' ? 'text-amber-500' :
                                                                    'text-rose-500'
                                                        )}
                                                        strokeWidth="6"
                                                        strokeDasharray={175}
                                                        strokeDashoffset={
                                                            diseaseDetails.severity === 'Low' ? 175 - (175 * 0.8) :
                                                                diseaseDetails.severity === 'Medium' ? 175 - (175 * 0.5) :
                                                                    175 - (175 * 0.2)
                                                        }
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="28"
                                                        cx="32"
                                                        cy="32"
                                                    />
                                                </svg>
                                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                                    <span className="font-black text-gray-800">
                                                        {diseaseDetails.severity === 'Low' ? '80' : diseaseDetails.severity === 'Medium' ? '50' : '20'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">Health Score</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex flex-wrap justify-center gap-3 mt-10 pb-2">
                                        {/* Ask Expert */}
                                        <button
                                            onClick={() => setShowExpertModal(true)}
                                            className="flex-shrink-0 bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border border-blue-100 hover:bg-blue-100 transition-colors"
                                        >
                                            <UserCheck size={18} /> {lang === 'mr' ? 'तज्ञ सल्ला' : 'Ask Agronomist'}
                                        </button>

                                        {/* PDF Report */}
                                        <button
                                            onClick={() => generateDiagnosisReport(scanResult, diseaseDetails, user, lang, previewUrl)}
                                            className="flex-shrink-0 bg-white text-gray-700 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            <Printer size={18} /> PDF
                                        </button>

                                        {/* View Details */}
                                        <button
                                            onClick={() => setShowDetailedReport(true)}
                                            className="flex-shrink-0 bg-white text-primary-600 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border border-primary-200 hover:bg-primary-50 transition-colors shadow-sm"
                                        >
                                            <Info size={18} /> {lang === 'mr' ? 'तपशील' : 'Details'}
                                        </button>

                                        {/* Manual Correction */}
                                        <button
                                            onClick={() => setShowDiseaseSelector(true)}
                                            className="flex-shrink-0 bg-white text-gray-500 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border border-dashed border-gray-300 hover:text-gray-900 transition-colors"
                                        >
                                            Wrong?
                                        </button>
                                    </div>

                                    {/* Treatment Timeline */}
                                    <div className="mt-8">
                                        <TreatmentTimeline
                                            stages={diseaseDetails.treatmentPlan}
                                            onProductClick={setSelectedTx}
                                            completedIndices={completedStages}
                                            onToggleComplete={(idx) => {
                                                setCompletedStages(prev =>
                                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                                );
                                            }}
                                            lang={lang}
                                            weather={appLocation.weather}
                                        />
                                    </div>

                                    {/* Fallback Cause Text if no timeline */}
                                    {(!diseaseDetails.treatmentPlan || diseaseDetails.treatmentPlan.length === 0) && (
                                        <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                            <h4 className="font-bold text-gray-900 mb-2">Diagnosis Details</h4>
                                            <p className="text-gray-600 leading-relaxed">{lang === 'mr' ? diseaseDetails.detailedDescriptionMarathi : diseaseDetails.detailedDescription}</p>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* PRODUCT MODAL */}
            {
                selectedTx && createPortal(
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[100px] md:p-6 md:pb-6 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden max-h-[calc(100vh-120px)] md:max-h-[90vh] animate-scale-up">
                            <button onClick={() => setSelectedTx(null)} className="absolute top-4 right-4 p-2 bg-black/10 rounded-full hover:bg-black/20 z-10 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="h-48 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6 border-b border-gray-100">
                                {selectedTx.image ? (
                                    <img src={selectedTx.image} alt={selectedTx.name} className="h-full object-contain mix-blend-multiply drop-shadow-lg" />
                                ) : (
                                    <div className="text-gray-400 font-bold">No Image</div>
                                )}
                            </div>

                            <div className="p-8">
                                <div className="mb-6">
                                    <span className={clsx("px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider",
                                        selectedTx.type === 'Organic' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    )}>{selectedTx.type}</span>
                                    <h2 className="text-3xl font-black text-gray-900 mt-2">{selectedTx.brand || selectedTx.name}</h2>
                                    <p className="text-sm font-bold text-gray-500">{selectedTx.composition}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                                        <p className="text-xs font-bold text-primary-500 uppercase mb-1">Dosage Application</p>
                                        <p className="font-bold text-gray-900">{selectedTx.dosage}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-3">
                                        <div className="flex justify-between items-center border-b border-green-200 pb-2">
                                            <div>
                                                <p className="text-xs font-bold text-green-600 uppercase mb-1">Farm Size</p>
                                                <p className="font-black text-gray-900">{farmSize} Acre{farmSize !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-green-600 uppercase mb-1">Total Req.</p>
                                                <p className="font-black text-xl text-green-700">
                                                    {(farmSize * (selectedTx.dosagePerAcre || 0)).toFixed(0)} {selectedTx.unit}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Slider */}
                                        <div className="pt-1">
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="10"
                                                step="0.5"
                                                value={farmSize}
                                                onChange={(e) => setFarmSize(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                            />
                                            <div className="flex justify-between text-[10px] text-green-600 font-bold mt-1 px-1">
                                                <span>0.5 Acre</span>
                                                <span>5 Acres</span>
                                                <span>10 Acres</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <button onClick={() => window.open('https://www.google.com/maps/search/agri+input+shop+near+me', '_blank')} className="btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                                        <MapPin size={20} /> {lang === 'mr' ? 'जवळचे दुकान' : 'Find Dealer'}
                                    </button>
                                    <button onClick={() => window.print()} className="bg-blue-50 text-blue-700 border border-blue-100 py-4 rounded-xl font-bold hover:bg-blue-100 flex items-center justify-center gap-2">
                                        <Printer size={20} /> {lang === 'mr' ? 'प्रिंट' : 'Print Card'}
                                    </button>
                                    <button onClick={() => setSelectedTx(null)} className="col-span-2 bg-gray-100 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-200">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* MANUAL SELECTOR MODAL (Adaptive: Crop or Disease) */}
            {
                showDiseaseSelector && createPortal(
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[100px] md:p-6 md:pb-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative flex flex-col overflow-hidden max-h-[calc(100vh-120px)] md:max-h-[85vh] animate-scale-up">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">
                                        {step === 'confirm_crop' && !manualCrop ? (lang === 'mr' ? 'पीक निवडा' : 'Select Correct Crop') :
                                            (step === 'result' ? 'Report Incorrect Diagnosis' : 'Select Disease')}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {step === 'confirm_crop' && !manualCrop ? 'Identify the plant correctly' :
                                            (step === 'result' ? 'Help us improve by selecting the correct disease' : 'Correct the AI diagnosis manually')}
                                    </p>
                                </div>
                                <button onClick={() => { setShowDiseaseSelector(false); setManualCrop(null); }} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto space-y-2">
                                {/* V6: CROP SELECTION MODE */}
                                {step === 'confirm_crop' && !manualCrop ? (
                                    <>
                                        {/* Cotton */}
                                        <button
                                            onClick={() => {
                                                if (scanResult) {
                                                    // Save Feedback: User corrected Crop to Cotton
                                                    saveFeedback({
                                                        userId: user?.id || 'guest',
                                                        aiPrediction: { crop: scanResult.crop, disease: scanResult.disease || 'Unknown', confidence: scanResult.cropConfidence },
                                                        userCorrection: { crop: 'Cotton', symptomsConfirmed: [] },
                                                        timestamp: new Date(),
                                                        location: location
                                                    });

                                                    // Update Result to Cotton
                                                    setScanResult(prev => prev ? { ...prev, crop: 'Cotton', cropConfidence: 1.0 } : null);
                                                    setManualCrop('Cotton');
                                                }
                                            }}
                                            className="w-full text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 font-bold text-lg flex items-center gap-3"
                                        >
                                            <span className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">☁️</span>
                                            <div>
                                                <p>{lang === 'mr' ? 'कापूस' : 'Cotton'}</p>
                                                <p className="text-xs text-gray-500 font-normal">Switch to Cotton diagnosis</p>
                                            </div>
                                        </button>

                                        {/* Soybean */}
                                        <button
                                            onClick={() => {
                                                if (scanResult) {
                                                    // Save Feedback: User corrected Crop to Soybean
                                                    saveFeedback({
                                                        userId: user?.id || 'guest',
                                                        aiPrediction: { crop: scanResult.crop, disease: scanResult.disease || 'Unknown', confidence: scanResult.cropConfidence },
                                                        userCorrection: { crop: 'Soybean', symptomsConfirmed: [] },
                                                        timestamp: new Date(),
                                                        location: location
                                                    });

                                                    setScanResult(prev => prev ? { ...prev, crop: 'Soybean', cropConfidence: 1.0 } : null);
                                                    setManualCrop('Soybean');
                                                }
                                            }}
                                            className="w-full text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 font-bold text-lg flex items-center gap-3"
                                        >
                                            <span className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">🌱</span>
                                            <div>
                                                <p>{lang === 'mr' ? 'सोयाबीन' : 'Soybean'}</p>
                                                <p className="text-xs text-gray-500 font-normal">Switch to Soybean diagnosis</p>
                                            </div>
                                        </button>

                                        {/* Non-Plant */}
                                        <button
                                            onClick={() => {
                                                if (scanResult) {
                                                    // Save Feedback: User rejected as Not a Plant
                                                    saveFeedback({
                                                        userId: user?.id || 'guest',
                                                        aiPrediction: { crop: scanResult.crop, disease: scanResult.disease || 'Unknown', confidence: scanResult.cropConfidence },
                                                        userCorrection: { crop: 'Not_A_Plant', disease: 'Not_A_Plant', symptomsConfirmed: [] },
                                                        timestamp: new Date(),
                                                        location: location
                                                    });

                                                    setScanResult(prev => prev ? { ...prev, crop: 'Not_A_Plant', cropConfidence: 1.0 } : null);
                                                    setStep('result'); // Go to error screen
                                                    setShowDiseaseSelector(false);
                                                }
                                            }}
                                            className="w-full text-left p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 font-bold text-lg text-red-700 flex items-center gap-3"
                                        >
                                            <span className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center text-xl">🚫</span>
                                            <div>
                                                <p>{lang === 'mr' ? 'पीक नाही (Not a Plant)' : 'Not a Plant'}</p>
                                                <p className="text-xs text-red-500 font-normal">Reject this image</p>
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    /* EXISTING DISEA SE SELECTOR LOGIC */
                                    availableDiseases.map(key => {
                                        const d = DISEASE_DB[key];
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    if (step === 'result') {
                                                        handleCorrection(key);
                                                    } else {
                                                        manualSelectDisease(key);
                                                    }
                                                }}
                                                className="w-full text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex justify-between items-center group"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-primary-700">{d.localName}</h4>
                                                    <p className="text-xs text-gray-500">{d.name}</p>
                                                </div>
                                                <span className={clsx("text-xs font-bold px-2 py-1 rounded",
                                                    d.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                )}>
                                                    {d.severity}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* DETAILED REPORT MODAL */}
            {
                showDetailedReport && diseaseDetails && createPortal(
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[100px] md:p-6 md:pb-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative flex flex-col overflow-hidden max-h-[calc(100vh-120px)] md:max-h-[90vh] animate-scale-up">
                            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    <Info className="text-primary-600" /> {lang === 'mr' ? 'सविस्तर अहवाल' : 'Detailed Report'}
                                </h3>
                                <button onClick={() => setShowDetailedReport(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-8 flex-1 overflow-y-auto min-h-0">
                                {/* Images Carousel */}
                                {diseaseDetails.images && diseaseDetails.images.length > 0 && (
                                    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                                        <img
                                            src={diseaseDetails.images[0]}
                                            alt={diseaseDetails.name}
                                            className="w-full h-64 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Unavailable';
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                        <div className="p-2 bg-gray-50 text-xs text-center text-gray-500 font-bold">
                                            {lang === 'mr' ? 'रोगाचे प्रातिनिधिक चित्र' : 'Representative Image of Disease'}
                                        </div>
                                    </div>
                                )}

                                {/* Detailed Description */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Leaf className="text-green-600" size={18} />
                                        {lang === 'mr' ? 'रोगाची माहिती' : 'About the Disease'}
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed text-lg">
                                        {lang === 'mr' && diseaseDetails.detailedDescriptionMarathi
                                            ? diseaseDetails.detailedDescriptionMarathi
                                            : diseaseDetails.detailedDescription || diseaseDetails.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Symptoms List */}
                                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                        <h4 className="text-blue-900 font-bold mb-3 flex items-center gap-2">
                                            <ScanLine size={18} /> {lang === 'mr' ? 'लक्षणे' : 'Symptoms'}
                                        </h4>
                                        <ul className="space-y-2">
                                            {(lang === 'mr' && diseaseDetails.symptomsMarathi ? diseaseDetails.symptomsMarathi : diseaseDetails.symptoms).map((s, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-blue-800 font-medium">
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0"></span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Preventive Measures */}
                                    <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
                                        <h4 className="text-green-900 font-bold mb-3 flex items-center gap-2">
                                            <ShieldCheck size={18} /> {lang === 'mr' ? 'प्रतिबंधात्मक उपाय' : 'Prevention'}
                                        </h4>
                                        <ul className="space-y-2">
                                            {(lang === 'mr' && diseaseDetails.preventiveMeasuresMarathi ? diseaseDetails.preventiveMeasuresMarathi : diseaseDetails.preventiveMeasures).map((pm, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-green-800 font-medium">
                                                    <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                                                    {pm}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Causes */}
                                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                                    <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                                        <AlertTriangle size={18} /> {lang === 'mr' ? 'प्रमुख कारणे' : 'Main Causes'}
                                    </h4>
                                    <p className="text-amber-800 font-medium">
                                        {lang === 'mr' && diseaseDetails.causeMarathi ? diseaseDetails.causeMarathi : diseaseDetails.cause}
                                    </p>
                                </div>

                                <button onClick={() => setShowDetailedReport(false)} className="w-full bg-gray-100 py-4 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                                    {lang === 'mr' ? 'बंद करा' : 'Close Report'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Expert Consultation Modal */}
            {
                showExpertModal && createPortal(
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-[100px] md:p-6 md:pb-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative flex flex-col overflow-hidden max-h-[calc(100vh-120px)] md:max-h-[90vh] animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                            <UserCheck className="text-blue-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Request Expert Consultation</h3>
                                            <p className="text-sm text-gray-500">Get professional agricultural advice</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowExpertModal(false);
                                            setExpertNotes('');
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
                                {/* Diagnosis Summary */}
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Diagnosis Summary</p>
                                    <div className="space-y-1">
                                        <p className="text-sm"><span className="font-bold">Crop:</span> {scanResult?.crop}</p>
                                        <p className="text-sm"><span className="font-bold">Disease:</span> {diseaseDetails?.name}</p>
                                        {scanResult && scanResult.diseaseConfidence && (
                                            <p className="text-sm"><span className="font-bold">Confidence:</span> {(scanResult.diseaseConfidence * 100).toFixed(0)}%</p>
                                        )}
                                    </div>
                                </div>

                                {/* Farmer Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        value={expertNotes}
                                        onChange={(e) => setExpertNotes(e.target.value)}
                                        placeholder="Describe any additional symptoms, concerns, or questions for the expert..."
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        rows={4}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This helps experts provide more accurate recommendations
                                    </p>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-900">
                                        Your consultation request will be reviewed by certified agronomists.
                                        You'll be notified when an expert responds.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowExpertModal(false);
                                        setExpertNotes('');
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAskExpert}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserCheck size={18} />
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

        </div >
    );
}
