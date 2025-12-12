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

// Load Coolvetica font and encode as base64 (cached after first load)
let COOLVETICA_BASE64: string | null = null;
let fontLoadPromise: Promise<string> | null = null;

const loadCoolveticaFont = async (): Promise<string> => {
  if (COOLVETICA_BASE64) return COOLVETICA_BASE64;
  if (fontLoadPromise) return fontLoadPromise;
  
  fontLoadPromise = (async () => {
    try {
      const response = await fetch('/coolvetica.otf');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // Convert to base64
      let binary = '';
      uint8Array.forEach(byte => {
        binary += String.fromCharCode(byte);
      });
      COOLVETICA_BASE64 = btoa(binary);
      return COOLVETICA_BASE64;
    } catch (error) {
      console.error('Failed to load Coolvetica font:', error);
      return '';
    }
  })();
  
  return fontLoadPromise;
};

// Initialize the client
const genAI = new GoogleGenerativeAI(getApiKey());

// Get system instruction with embedded font
const getSystemInstruction = async (): Promise<string> => {
  const fontBase64 = await loadCoolveticaFont();
  return `
You are an expert creative technologist and game developer.
Your goal is to generate complete, single-file, playable mini-games based on user prompts.

CRITICAL REQUIREMENTS FOR WORKING CODE:
1. Output MUST be a single, valid HTML string containing all necessary CSS (in <style>) and JavaScript (in <script>).
2. The HTML MUST be complete and self-contained - it must work when inserted into a page.
3. DO NOT wrap the output in markdown code blocks. Return ONLY the raw HTML string.
4. All JavaScript MUST be inside <script> tags, all CSS MUST be inside <style> tags.
5. Use proper HTML structure: <!DOCTYPE html>, <html>, <head>, <body> tags are REQUIRED.
6. Initialize all variables before use. Check for undefined/null values.
7. Use requestAnimationFrame for game loops, NOT setInterval or setTimeout for animation.
8. Always clear the canvas before drawing each frame.
9. Handle edge cases: prevent objects from going off-screen, check bounds, validate input.
10. Use addEventListener for event handlers, ensure DOM is loaded before accessing elements.
11. Test your logic mentally: ensure game state updates correctly, collisions work, scoring increments properly.
12. Support pause/resume: Add window.addEventListener('message', (e) => { if (e.data.type === 'pause') { /* stop game loop */ } if (e.data.type === 'resume') { /* restart game loop */ } }) to allow pausing the game.

TECHNICAL REQUIREMENTS:
- Prefer using the HTML5 Canvas API for graphics.
- Ensure the game handles window resizing gracefully (use window resize event).
- Do NOT use external resources (images, sounds, libraries) unless they are available via public CDNs.
- Use modern JavaScript (ES6+): const/let, arrow functions, proper scoping.
- Avoid global variables when possible, use proper function scope.
- Ensure all functions are defined before being called.
- Use proper event handling: preventDefault() when needed, stopPropagation() if necessary.
- For canvas games: Always get 2D context, set canvas dimensions properly, use clearRect() each frame.

FULLSCREEN REQUIREMENTS (CRITICAL):
- The game MUST fill the entire viewport - NO margins, NO padding, NO centering containers.
- Use CSS: html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
- Canvas MUST be fullscreen: width="100%" height="100%" or use JavaScript to set canvas.width = window.innerWidth and canvas.height = window.innerHeight.
- NO containers with max-width, NO centering with margin: auto, NO padding on body/html.
- The game should use 100vw and 100vh for full viewport dimensions.
- All game elements should be positioned relative to the full viewport, not a centered container.

VISUAL STYLE: "SWISS INTERNATIONAL STYLE" / BRUTALIST
Unless explicitly asked otherwise, strictly adhere to this aesthetic:
- Color Palette: STRICTLY Black (#050505) and White (#eeeeee). No grays, no colors.
- Forms: Rectangular, sharp edges. NO border-radius.
- Typography: MUST use Coolvetica font ONLY. NO other fonts allowed.
  REQUIRED: Include this EXACT @font-face declaration in the <style> tag in <head>:
  @font-face {
    font-family: 'Coolvetica';
    src: url('data:font/opentype;base64,${COOLVETICA_BASE64}') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
  Then use: font-family: 'Coolvetica', sans-serif; for ALL text elements.
  All text should be lowercase for UI elements.
  The font MUST be Coolvetica - no substitutes, no fallbacks to other fonts.
- Layout: Grid-based, high contrast.
- UI Elements: 
    - Buttons: White borders, black background, white text. Hover: Invert.
    - Text: Left aligned or strictly centered.
- Example: The paddle in Pong should be a solid white rectangle. The background should be solid black. Text should be white Coolvetica font, lowercase.

CODE QUALITY REQUIREMENTS:
- Before outputting, mentally trace through the code execution:
  * Does the game loop start correctly?
  * Are all variables initialized?
  * Do event listeners attach properly?
  * Does the game state update correctly?
  * Are collisions detected accurately?
  * Does the game reset/restart work?
- Use clear, descriptive variable names.
- Add comments for complex logic.
- Ensure no syntax errors: matching brackets, proper quotes, semicolons where needed.
- Validate that all functions return expected values.
- Check that arrays/objects are accessed safely (no out-of-bounds errors).

MODIFICATION RULES:
- If the user provides PREVIOUS CODE, you must modify that code according to their new request.
- Maintain the core functionality unless asked to change it.
- Preserve working game mechanics when making modifications.
- Ensure controls are responsive and explained on-screen if necessary.

OUTPUT FORMAT:
- Start with <!DOCTYPE html>
- Include complete <html>, <head>, and <body> structure
- Put all CSS in <style> tag in <head>
- Put all JavaScript in <script> tag before closing </body>
- Ensure the code is immediately executable - no missing pieces, no placeholders
`.replace('${COOLVETICA_BASE64}', fontBase64);
};

export const generateGameCode = async (prompt: string, previousCode?: string): Promise<string> => {
  try {
    let finalPrompt = prompt;
    
    if (previousCode) {
      finalPrompt = `
      I have an existing game code. I want to modify it.
      
      REQUEST: ${prompt}

      EXISTING CODE:
      ${previousCode}
      
      IMPORTANT: Modify the existing code while maintaining all working functionality. Ensure the modified code is complete, valid HTML that will execute without errors.
      `;
    } else {
      // Add explicit instructions for new game generation
      finalPrompt = `
      ${prompt}
      
      CRITICAL: Generate a complete, working HTML game. The output must:
      - Be valid, executable HTML with proper structure
      - Include all necessary CSS and JavaScript
      - Work immediately when inserted into a page
      - Have no syntax errors, undefined variables, or missing functions
      - Use proper game loop with requestAnimationFrame
      - Handle all edge cases and input validation
      - Be fully playable and functional
      - Fill the ENTIRE viewport (100vw x 100vh) with NO margins, padding, or centering containers
      - Canvas/game area must be fullscreen, not in a centered frame
      
      Return ONLY the raw HTML code, no markdown, no explanations, no code blocks.
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
        const systemInstruction = await getSystemInstruction();
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            temperature: 0.3,  // Lower temperature for more consistent, accurate code
            maxOutputTokens: 16384,  // Increased for more complete code
            topP: 0.95,
            topK: 40,
          },
        });

        // Use retry logic for rate limits
        const result = await retryWithBackoff(async () => {
          return await model.generateContent(finalPrompt);
        });
        
        const response = await result.response;
        let text = response.text() || '';

        // Cleanup: Remove markdown code blocks and any explanatory text
        // Remove markdown code fences (various formats)
        text = text.replace(/^```html\s*/i, '');
        text = text.replace(/^```\s*/i, '');
        text = text.replace(/```\s*$/g, '');
        text = text.replace(/```\s*$/gm, '');
        
        // Remove any explanatory text before HTML (common pattern: "Here's the code:" etc.)
        const htmlStartMatch = text.match(/<(!DOCTYPE|html|head|body|script|style|canvas|div)/i);
        if (htmlStartMatch && htmlStartMatch.index && htmlStartMatch.index > 0) {
          text = text.substring(htmlStartMatch.index);
        }
        
        // Remove any trailing explanatory text after closing tags
        const lastTagMatch = text.match(/<\/html>\s*$/i);
        if (lastTagMatch) {
          text = text.substring(0, lastTagMatch.index + lastTagMatch[0].length);
        }
        
        // Remove any leading/trailing whitespace and newlines
        text = text.trim();
        
        return text;
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
