import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const sendMessageToGemini = async (userMessage, history = [], databaseContext = null) => {
  try {
    // 1. Use the stable model alias (safer than specific date versions)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      // Optional: systematic instructions for the persona
      systemInstruction: "You are a witty and helpful travel assistant for the 'Dream Trip' app. You love saving people money." 
    });

    const chat = model.startChat({
      history: history, 
      generationConfig: {
        maxOutputTokens: 1000, // Increased slightly for better itineraries
        temperature: 0.7,      // Balance between creativity and accuracy
      },
    });

    // 2. Construct the Final Prompt
    // We wrap the user's message with the database data if it exists.
    let finalPrompt = userMessage;

    if (databaseContext && databaseContext !== "{}" && !databaseContext.includes("error")) {
      finalPrompt = `
      [SYSTEM DATA START]
      The following is a list of real options available in our database matching the user's request. 
      Use THIS data to answer. Do not hallucinate prices or locations.

      ${databaseContext}
      [SYSTEM DATA END]

      User's Question: "${userMessage}"
      `;
          }

    // 3. Send Message
    const result = await chat.sendMessage(finalPrompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Graceful Error Handling for UI
    if (error.message.includes("400")) {
      return "I'm having trouble understanding that request. Could you rephrase it?";
    }
    if (error.message.includes("429")) {
      return "I'm a bit overwhelmed right now. Please try again in a moment.";
    }
    
    throw error;
  }
};