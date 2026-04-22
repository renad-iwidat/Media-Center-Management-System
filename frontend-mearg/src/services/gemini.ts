import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function applyPolicyAI(text: string, policyInstructions: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are a professional news editor. 
        Apply the following editorial policy to the text below.
        
        Policy Instructions: ${policyInstructions}
        
        Text to process:
        ${text}
        
        Return ONLY the modified text without any preamble or explanations.
      `,
    });
    
    return response.text || text;
  } catch (error) {
    console.error("Gemini Policy Error:", error);
    return text;
  }
}

export async function analyzeContentAI(text: string): Promise<{
    summary: string;
    suggested_category: string;
    is_safe: boolean;
}> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this news content and return a JSON object: 
      { "summary": "short summary", "suggested_category": "category name", "is_safe": true/false }
      
      Text: ${text}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { summary: "Analysis failed", suggested_category: "General", is_safe: true };
  }
}
