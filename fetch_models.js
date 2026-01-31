require("dotenv").config();
const fs = require('fs');

async function fetchModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            fs.writeFileSync('models_list.json', JSON.stringify({ error: "No API Key" }));
            return;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            fs.writeFileSync('models_list.json', JSON.stringify({ error: response.status, details: text }));
            return;
        }

        const data = await response.json();
        fs.writeFileSync('models_list.json', JSON.stringify(data, null, 2));
        console.log("DONE");

    } catch (e) {
        fs.writeFileSync('models_list.json', JSON.stringify({ error: e.message }));
    }
}

fetchModels();
