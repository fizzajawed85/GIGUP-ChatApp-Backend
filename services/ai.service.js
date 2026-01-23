// services/ai.service.js
const axios = require('axios');

const generateAIResponse = async (message, chatId, userId) => {
  try {
    const API_KEY = process.env.OPENAI_API_KEY;

    // OpenAI GPT-3.5 / GPT-4 completion call
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", 
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        }
      }
    );

    // GPT response
    const aiMessage = response.data.choices[0].message.content;
    return aiMessage;

  } catch (error) {
    console.error("AI Service Error:", error.message);
    return "AI is temporarily unavailable. Please try again later.";
  }
};

module.exports = { generateAIResponse };
