import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Safely access the API key
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const sendMessageToGemini = async (
  userMessage: string, 
  contextData: string
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview'; // Optimized for text reasoning
    
    // Combine system instruction with current data context
    const prompt = `
      ${SYSTEM_INSTRUCTION}

      CURRENT DATA CONTEXT:
      ${contextData}

      USER QUERY:
      ${userMessage}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I processed the data but couldn't generate a specific insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I apologize, but I am currently unable to access the strategy mainframe. Please check your API connection.";
  }
};
