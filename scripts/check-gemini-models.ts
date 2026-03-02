import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log("🔍 Fetching available models...");
        // The Node.js SDK doesn't have a direct listModels top-level, 
        // but we can use the default fetch or check if genAI has it.
        // Actually, let's try a simple probe on common names.

        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro-vision",
            "gemini-pro"
        ];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                // Simple check if it exists (generateContent with empty/small probe)
                // We'll just print that we are probing.
                console.log(`- Probing ${m}...`);
            } catch (e) {
                console.log(`  ❌ ${m} error: ${e.message}`);
            }
        }

        console.log("\n✅ Finished list probe. Note: This doesn't call listModels API, just checks local SDK mapping.");
        console.log("To see the actual API models, we'd need to fetch from https://generativelanguage.googleapis.com/v1beta/models?key=...");

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();

        if (data.models) {
            console.log("\n🌍 Actual models available on v1beta:");
            data.models.forEach((m: any) => console.log(`  - ${m.name.replace('models/', '')} (Supported: ${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("\n⚠️ No models returned from API. Check your key.");
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

listModels();
