require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to init something if needed, but actually we need listModels logic if available in SDK,
        // The SDK might not expose listModels directly on the main class in all versions, checking documentation memory or just try standard fetch if SDK fails.
        // Actually, older SDKs didn't have listModels easily.
        // Let's try to just run a simple generateContent on "gemini-pro" and "gemini-1.5-flash" to see which one succeeds in a loop.

        const candidates = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

        console.log("Testing Model Availability...");

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Hello");
                console.log(`[SUCCESS] Model '${modelName}' is available.`);
            } catch (error) {
                console.log(`[FAILED] Model '${modelName}':`, error.message.split("[")[0]); // Simplify error
            }
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

listModels();
