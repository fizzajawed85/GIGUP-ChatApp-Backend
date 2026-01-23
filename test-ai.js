require('dotenv').config(); 

const { generateAIResponse } = require("./services/ai.service");

(async () => {
  const reply = await generateAIResponse("Hello AI, how are you?", "test123", "user001");
  console.log("AI Reply:", reply);
})();
