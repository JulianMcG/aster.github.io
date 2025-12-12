import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variable
// Supports both VITE_API_KEY (Vite standard) and API_KEY (for Vercel compatibility)
const getApiKey = (): string => {
  // Try Vite's import.meta.env (injected by Vite config)
  const apiKey = import.meta.env.VITE_API_KEY || 
                 (import.meta.env as any).API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY is not defined. Please set VITE_API_KEY or API_KEY in your environment variables.");
  }
  return apiKey;
};

// Initialize the client
const genAI = new GoogleGenerativeAI(getApiKey());

const SYSTEM_INSTRUCTION = `
You are an expert creative technologist and game developer.
Your goal is to generate complete, single-file, playable mini-games based on user prompts.

Rules:
1. Output MUST be a single, valid HTML string containing all necessary CSS (in <style>) and JavaScript (in <script>).
2. Do NOT use external resources (images, sounds, libraries) unless they are available via public CDNs.
3. Prefer using the HTML5 Canvas API for graphics.
4. Ensure the game handles window resizing gracefully.
5. DO NOT wrap the output in markdown code blocks. Return ONLY the raw HTML string.

VISUAL STYLE: "SWISS INTERNATIONAL STYLE" / BRUTALIST
Unless explicitly asked otherwise, strictly adhere to this aesthetic:
- Color Palette: STRICTLY Black (#050505) and White (#eeeeee). No grays, no colors.
- Forms: Rectangular, sharp edges. NO border-radius.
- Typography: Sans-serif (Arial, Helvetica). Lowercase text for UI elements.
- Layout: Grid-based, high contrast.
- UI Elements: 
    - Buttons: White borders, black background, white text. Hover: Invert.
    - Text: Left aligned or strictly centered.
- Example: The paddle in Pong should be a solid white rectangle. The background should be solid black. Text should be white sans-serif.

Logic Rules:
- If the user provides PREVIOUS CODE, you must modify that code according to their new request. Maintain the core functionality unless asked to change it.
- Ensure controls are responsive and explained on-screen if necessary.
`;

export const generateGameCode = async (prompt: string, previousCode?: string): Promise<string> => {
  try {
    let finalPrompt = prompt;
    
    if (previousCode) {
      finalPrompt = `
      I have an existing game code. I want to modify it.
      
      REQUEST: ${prompt}

      EXISTING CODE:
      ${previousCode}
      `;
    }

    // Try different models in order of preference
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro-latest"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        let text = response.text() || '';

        // Cleanup: Remove markdown code blocks if the model accidentally included them
        text = text.replace(/^```html\s*/i, '').replace(/```$/, '');
        text = text.replace(/^```\s*/i, '').replace(/```$/, '');
        
        return text.trim();
      } catch (error: any) {
        lastError = error;
        // If it's a 404 (model not found), try next model
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.warn(`Model ${modelName} not available, trying next...`);
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error("All model attempts failed");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate game code.");
  }
};
