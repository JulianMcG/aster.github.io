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
    // Updated to use models available in your AI Studio account
    const modelsToTry = [
      "gemini-2.5-flash",      // Primary: Text-out model with good quotas (5 RPM, 250K TPM, 20 RPD)
      "gemini-2.5-flash-lite", // Fallback: Text-out model (10 RPM, 250K TPM, 20 RPD)
      "gemma-3-27b",           // Fallback: Other model (30 RPM, 15K TPM, 14.4K RPD)
      "gemma-3-12b",           // Fallback: Other model (30 RPM, 15K TPM, 14.4K RPD)
      "gemma-3-4b"             // Fallback: Other model (30 RPM, 15K TPM, 14.4K RPD)
    ];
    let lastError: any = null;
    const failedModels: string[] = [];

    // Helper function to extract retry delay from error
    const extractRetryDelay = (error: any): number => {
      try {
        const errorString = JSON.stringify(error);
        const retryMatch = errorString.match(/retryDelay["\s:]+"?(\d+(?:\.\d+)?)s?/i);
        if (retryMatch) {
          return Math.ceil(parseFloat(retryMatch[1]) * 1000); // Convert to milliseconds
        }
        // Check error message for retry time
        const messageMatch = error.message?.match(/retry in ([\d.]+)s/i);
        if (messageMatch) {
          return Math.ceil(parseFloat(messageMatch[1]) * 1000);
        }
      } catch (e) {
        // Ignore parsing errors
      }
      return 5000; // Default 5 second delay
    };

    // Helper function to retry with exponential backoff
    const retryWithBackoff = async (
      fn: () => Promise<any>,
      maxRetries: number = 3,
      baseDelay: number = 1000
    ): Promise<any> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          const errorMessage = error.message || '';
          const errorString = JSON.stringify(error);
          
          // Check for rate limit (429) errors
          if (
            errorMessage.includes('429') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('rate limit') ||
            errorString.includes('429')
          ) {
            if (attempt < maxRetries - 1) {
              const delay = extractRetryDelay(error);
              const backoffDelay = delay + (baseDelay * Math.pow(2, attempt));
              console.warn(`Rate limit hit, retrying in ${Math.ceil(backoffDelay / 1000)}s... (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              continue;
            }
            // If all retries exhausted, throw quota error
            throw new Error(
              `Rate limit exceeded. Please wait before trying again. ` +
              `Check your quota at https://ai.dev/usage?tab=rate-limit. ` +
              `Original error: ${error.message}`
            );
          }
          // For non-rate-limit errors, throw immediately
          throw error;
        }
      }
    };

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

        // Use retry logic for rate limits
        const result = await retryWithBackoff(async () => {
          return await model.generateContent(finalPrompt);
        });
        
        const response = await result.response;
        let text = response.text() || '';

        // Cleanup: Remove markdown code blocks if the model accidentally included them
        text = text.replace(/^```html\s*/i, '').replace(/```$/, '');
        text = text.replace(/^```\s*/i, '').replace(/```$/, '');
        
        return text.trim();
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || '';
        const errorString = JSON.stringify(error);
        
        // Check for 404 or "not found" errors - try next model
        if (
          errorMessage.includes('404') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('is not found') ||
          errorString.includes('404') ||
          errorString.includes('not found')
        ) {
          failedModels.push(modelName);
          console.warn(`Model ${modelName} not available (404), trying next...`);
          continue;
        }
        
        // Check for quota/rate limit errors - try next model (after retries exhausted)
        if (
          errorMessage.includes('429') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('rate limit') ||
          errorString.includes('429')
        ) {
          failedModels.push(`${modelName} (quota exceeded)`);
          console.warn(`Model ${modelName} quota exceeded, trying next...`);
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }

    // If all models failed, provide a helpful error message
    const hasQuotaErrors = failedModels.some(m => m.includes('quota'));
    const has404Errors = failedModels.some(m => !m.includes('quota'));
    
    let errorMsg = '';
    if (hasQuotaErrors && has404Errors) {
      errorMsg = `All models failed. Some models had quota issues, others were not found.\n\nTried: ${failedModels.join(', ')}\n\nThis usually means:\n1. You've exceeded your API quota/rate limits\n2. Some models may not be available in your region\n3. Your API key may not have access to certain models\n\nPlease:\n- Check your quota at https://ai.dev/usage?tab=rate-limit\n- Wait a few minutes before trying again\n- Verify API key permissions at https://aistudio.google.com/apikey\n\nLast error: ${lastError?.message || 'Unknown error'}`;
    } else if (hasQuotaErrors) {
      errorMsg = `All models exceeded quota limits. Tried: ${failedModels.join(', ')}\n\nYou've hit your rate limit or daily quota. Please:\n- Wait before trying again (check the retry time in the error)\n- Monitor your usage at https://ai.dev/usage?tab=rate-limit\n- Consider upgrading your plan if you need higher limits\n\nLast error: ${lastError?.message || 'Unknown error'}`;
    } else if (has404Errors) {
      errorMsg = `All models failed (404 errors). Tried: ${failedModels.join(', ')}\n\nThis usually means:\n1. Your API key may not have access to these models\n2. The models may not be available in your region\n3. The Generative Language API may not be enabled for your project\n\nPlease check your API key permissions at https://aistudio.google.com/apikey\n\nLast error: ${lastError?.message || 'Unknown error'}`;
    } else {
      errorMsg = `All model attempts failed. Last error: ${lastError?.message || 'Unknown error'}`;
    }
    
    throw new Error(errorMsg);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate game code.");
  }
};
