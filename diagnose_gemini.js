require("dotenv").config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API Key found in .env");
            return;
        }

        console.log("Using Key ending in: ..." + apiKey.slice(-4));
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        console.log("Fetching models...");
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
            return;
        }

        const data = await response.json();

        if (data.models) {
            console.log("--- AVAILABLE MODELS ---");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`Model: ${m.name.replace('models/', '')}`);
                }
            });
            console.log("------------------------");
        } else {
            console.log("No models found in response:", data);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

listModels();
