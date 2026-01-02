import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ SECURITY WARNING: In production, do not store keys here. Use Firebase Remote Config.
const API_KEY = "AIzaSyAkT5iDirGlGpMoN8FHGtPG5c-Tlx87Xc0"; 

const genAI = new GoogleGenerativeAI(API_KEY);

// We do NOT fetch data here. We just send what the UI gives us.
export const sendMessageToGemini = async (userMessage, history = [], databaseContext = "") => {
  try {
    // Use the standard fast model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

    const chat = model.startChat({
      history: history, 
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // MAGIC TRICK: If database data is provided, we wrap the user's message with it.
    // The user won't see this big block of text, but Gemini will read it.
    let finalMessage = userMessage;
    
    if (databaseContext) {
      finalMessage = `
      [SYSTEM INSTRUCTION: You are a helpful travel assistant.
      Here is the live database of available trips, hotels, and food. 
      ONLY recommend items from this list if relevant:
      ${databaseContext}]

      User Question: ${userMessage}`;
    }

    const result = await chat.sendMessage(finalMessage);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};