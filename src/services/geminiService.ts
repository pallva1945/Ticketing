import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// A fallback engine to generate insights when the API key is missing
const generateMockResponse = (userMessage: string, contextData: string): string => {
  try {
    const data = JSON.parse(contextData);
    const { totals, context_filter } = data;
    
    const occupancy = totals.occupancyRate || 0;
    const revenue = totals.totalRevenue || 0;
    const isSingleGame = context_filter.opponents.length === 1 && context_filter.opponents[0] !== 'All';
    const lowerQuery = userMessage.toLowerCase();

    let advice = "";
    let prefix = "";

    // 1. Determine Core Strategic Advice based on Data Stats
    if (occupancy < 60) {
      advice = "Fill Rate is critical (below 60%). We are bleeding atmosphere and concessions revenue. \n\nIMMEDIATE ACTION: Initiate 'Flash 48h' promo for Curva and Galleria. Activate the University network. We cannot play in an empty arena.";
    } else if (occupancy < 85) {
      advice = "Occupancy is acceptable but not elite. \n\nSTRATEGY: Focus on upselling existing ticket holders to courtside/parterre upgrades. Use the 'scarcity' angle in marketing.";
    } else {
      advice = "Demand is high. Stop discounting. \n\nSTRATEGY: Increase prices for single tickets immediately. Push Multi-game packs. Yield management is the priority now.";
    }

    // 2. Adjust based on User Query Intent (Simple Keyword Matching)
    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('eur')) {
        prefix = "Regarding pricing strategy: ";
        if (revenue < 50000) {
            advice = "Revenue is underperforming. Our average ticket price is too low for the value provided. We need to restructure the tiering system.";
        } else {
            advice = "Revenue flow is healthy. Maintain premium pricing for courtside but consider dynamic pricing for upper tiers.";
        }
    } else if (lowerQuery.includes('market') || lowerQuery.includes('promo') || lowerQuery.includes('ad')) {
        prefix = "On marketing: ";
        advice = "Stop general awareness ads. Shift budget to re-targeting abandoned carts on the ticket portal. Focus on 'Fear Of Missing Out' (FOMO).";
    }

    const gameNote = isSingleGame 
      ? `For this specific matchup against ${context_filter.opponents[0]}, the revenue is €${(revenue/1000).toFixed(1)}k.` 
      : `Across the selected ${data.games_in_view} games, we are generating €${(revenue/1000).toFixed(1)}k total.`;

    return `[OFFLINE MODE]\n\n${prefix}${advice}\n\nData Insight: ${gameNote}\n\n(System Note: I am currently running on local heuristic protocols because the API Key is missing. Configure the API_KEY for full generative capabilities.)`;
  } catch (e) {
    return "I cannot analyze the data structure in offline mode. Please check your filters.";
  }
};

export const sendMessageToGemini = async (
  userMessage: string, 
  contextData: string
): Promise<string> => {
  try {
    // Access the API key dynamically
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Using Offline Fallback.");
      return generateMockResponse(userMessage, contextData);
    }

    // Initialize client for each request
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview'; 
    
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // If the key is invalid or quota exceeded, fall back to mock engine
    if (error.message?.includes('API key') || error.status === 403 || error.status === 400) {
        return generateMockResponse(userMessage, contextData);
    }

    return "SYSTEM FAILURE: I am unable to connect to the strategy mainframe. Check your network connection.";
  }
};