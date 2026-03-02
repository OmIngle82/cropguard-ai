
import type { ScanResult } from '../services/DiagnosisService';
import type { DiseaseInfo } from '../services/DiseaseDatabase';
import type { UserProfile } from '../store/useStore';

export const generateDiagnosisReport = (
    scanResult: ScanResult,
    diseaseDetails: DiseaseInfo,
    user: UserProfile | null,
    lang: 'en' | 'mr',
    previewUrl?: string | null
) => {
    const reportDate = new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : 'mr-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const cropName = scanResult.crop;
    const diseaseName = lang === 'mr' ? diseaseDetails.localName : diseaseDetails.name;
    const symptoms = lang === 'mr' && diseaseDetails.symptomsMarathi ? diseaseDetails.symptomsMarathi : diseaseDetails.symptoms;
    const treatments = diseaseDetails.treatmentPlan || [];

    // const logoUrl = '/pwa-192x192.png'; // Using direct path in HTML

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
        <meta charset="UTF-8">
        <title>CropGuard AI - Diagnosis Report</title>
        <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; position: relative; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(22, 101, 52, 0.05); font-weight: bold; z-index: -1; white-space: nowrap; pointer-events: none; }
            .header { border-bottom: 3px solid #166534; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start; }
            .logo-section { display: flex; align-items: center; gap: 15px; }
            .logo-img { height: 70px; width: 70px; object-fit: contain; }
            .brand h1 { margin: 0; color: #166534; font-size: 28px; line-height: 1.2; }
            .brand p { margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
            .partner { font-size: 10px; color: #15803d; background: #dcfce7; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 5px; font-weight: bold; }
            .meta { text-align: right; font-size: 12px; color: #555; line-height: 1.5; }
            
            .section { margin-bottom: 30px; background: #fff; }
            .section-title { font-size: 16px; font-weight: bold; color: #fff; background: #166534; padding: 8px 12px; margin-bottom: 15px; border-radius: 4px; display: inline-block; }
            
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .label { font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; }
            .value { font-size: 18px; font-weight: bold; color: #000; }
            .highlight { color: #dc2626; font-size: 20px; }
            
            .diagnosis-image { width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; border: 2px solid #166534; }
            
            .treatment-step { background: #fff; border: 1px solid #e5e7eb; padding: 0; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
            .step-header { background: #f3f4f6; color: #111; font-weight: bold; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; }
            .step-content { padding: 15px; }
            .product { display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 8px; margin-bottom: 8px; font-size: 14px; }
            .product:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            
            /* Print hide */
            @media print {
                .no-print { display: none; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <div class="watermark">CROPGUARD AI</div>
        <div class="header">
            <div class="logo-section">
                <!-- Ensure this path works or use a data URI if needed -->
                <img src="/pwa-192x192.png" class="logo-img" alt="Logo" onerror="this.style.display='none'"> 
                <div class="brand">
                    <h1>CropGuard AI</h1>
                    <p>AI-Powered Plant Protection</p>
                    <div class="partner">Knowledge Partner: Dr. PDKV Akola</div>
                </div>
            </div>
            <div class="meta">
                <p><strong>Date:</strong> ${reportDate}</p>
                <p><strong>Farmer:</strong> ${user?.firstName || 'Guest'} ${user?.surname || ''}</p>
                <p><strong>Farm ID:</strong> AGRI-${Math.floor(Math.random() * 10000)}</p>
                <p><strong>Location:</strong> ${scanResult.crop} Field</p>
            </div>
        </div>

        <div class="grid">
            <div>
                ${previewUrl ? `<img src="${previewUrl}" class="diagnosis-image" alt="Crop Image" />` : ''}
            </div>
            <div class="space-y-4">
                <div class="card">
                    <div class="label">Crop Detected</div>
                    <div class="value">${cropName}</div>
                </div>
                <div class="card">
                    <div class="label">Diagnosis Result</div>
                    <div class="value highlight">${diseaseName}</div>
                </div>
                <div class="card">
                    <div class="label">Confidence Score</div>
                    <div class="value">${(scanResult.diseaseConfidence ? scanResult.diseaseConfidence * 100 : 0).toFixed(1)}%</div>
                </div>
            </div>
        </div>

        <div class="section" style="margin-top: 20px;">
            <div class="section-title">Verified Symptoms</div>
            <div class="card" style="border-left: 4px solid #f59e0b;">
                 <ul style="margin: 0; padding-left: 20px; color: #444; font-weight: 500;">
                    ${symptoms.map(s => `<li>${s}</li>`).join('')}
                 </ul>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Recommended Treatment (PDKV Protocol)</div>
            ${treatments.length > 0 ? treatments.map((stage, idx) => `
                <div class="treatment-step">
                    <div class="step-header">Stage ${idx + 1}: ${lang === 'mr' && stage.stageNameMarathi ? stage.stageNameMarathi : stage.stageName} <span style="font-weight:normal; font-size: 12px; color: #666; margin-left:10px;">(${stage.description})</span></div>
                    <div class="step-content">
                        ${stage.products.map(p => `
                            <div class="product">
                                <span><strong>${p.brand || p.name}</strong> (${p.composition || ''})</span>
                                <span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:12px;">${p.dosage}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('') : '<p class="card">No specific chemical treatment recommended. Follow preventive measures.</p>'}
        </div>

        <div class="section">
            <div class="section-title">Preventive Measures</div>
            <ul>
                ${(lang === 'mr' && diseaseDetails.preventiveMeasuresMarathi ? diseaseDetails.preventiveMeasuresMarathi : diseaseDetails.preventiveMeasures).map(m => `<li>${m}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            <p>This report is generated by AI (CropGuard AI). For critical decisions, please consult an agricultural expert.</p>
            <p>&copy; 2026 CropGuard AI | Agri Tech Hackathon</p>
        </div>

        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            }
        </script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        alert('Please allow popups to download the report.');
    }
};
