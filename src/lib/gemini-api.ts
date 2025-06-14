import { GoogleGenerativeAI } from "@google/generative-ai";

// Default API key (will be overridden by user-provided key if available)
const DEFAULT_API_KEY = "AIzaSyBcZENeo3gkU6YVQYKCYf8EhOltT87q4es";

// Initialize with a function to get the API key (from localStorage if available)
const getApiKey = (): string => {
  // Always get the freshest key from localStorage (no caching)
  const userProvidedKey = localStorage.getItem("gemini-api-key");
  
  // Check if the key exists and is not empty
  if (userProvidedKey && userProvidedKey.trim().length > 0) {
    return userProvidedKey.trim();
  }
  
  // Return null if no key is found
  return "";
};

// Create a function to get a fresh instance of the API with the current key
const getGenAIInstance = (): GoogleGenerativeAI | null => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// Store chat instance for conversation continuity
let chatInstance;

// Model configuration with updated models that have better compatibility
const MODELS = {
  PRIMARY: "gemini-1.5-flash", // Updated as recommended for better compatibility
  FALLBACK: "gemini-pro",      // Legacy model as fallback
};

// Reset the chat history for a new conversation
export const resetChatHistory = (topic: string): void => {
  chatInstance = null;
  
  // The system prompt will be sent as the first message after initializing the chat
  console.log(`Chat reset with topic: ${topic}`);
};

// Send message to Gemini and get response
export const sendMessageToGemini = async (userMessage: string, topic: string): Promise<string> => {
  try {
    // Get fresh instance with current API key
    const genAI = getGenAIInstance();
    if (!genAI) {
      return "Please add your Gemini API key in the Settings page to use this feature.";
    }
    
    // Try with primary model first
    let currentModel = MODELS.PRIMARY;
    let model = genAI.getGenerativeModel({ model: currentModel });
    
    // Initialize chat if it doesn't exist
    if (!chatInstance) {
      console.log(`Initializing new chat with model: ${currentModel}`);
      
      // Create an updated system prompt with STRICT instructions for single response
      const systemPrompt = `You are Iyraa, a warm, friendly, and intelligent English tutor AI designed to help users improve their English naturally and confidently.

      The current conversation topic is: ${topic}.
      
      ***CRITICAL INSTRUCTIONS***:
      - Respond with EXACTLY ONE conversational reply directly answering the user's message
      - NEVER provide ANY grammar assessment, feedback, or comments on their language quality
      - NEVER start with phrases like "That's a good question" or "That's well expressed" or any similar commentary
      - DO NOT split your response into multiple messages or thoughts
      - Simply respond naturally as you would in a human conversation
      - Keep responses warm, concise, and conversational
      
      Begin the conversation by introducing yourself: "Hi, I'm Iyraa, your friendly English tutor. I'm here to help you practice conversational English in a natural, supportive way!"`;
      
      try {
        // Start a new chat with empty history first
        chatInstance = model.startChat({ history: [] });
        
        // Send the system prompt as the first message
        const systemResult = await chatInstance.sendMessage(
          `System instruction (please follow these guidelines): ${systemPrompt}`
        );
        await systemResult.response;
        console.log("System prompt sent successfully");
      } catch (error) {
        console.error("Error initializing chat:", error);
        throw error;
      }
    }
    
    try {
      // Send the message using the chat instance
      console.log(`Sending message to ${currentModel}: "${userMessage}"`);
      const result = await chatInstance.sendMessage(userMessage);
      const response = await result.response;
      const responseText = response.text();
      console.log(`Got response: "${responseText.substring(0, 50)}..."`);
      
      return responseText;
    } catch (error: any) {
      console.error(`Error with model ${currentModel}:`, error);
      
      // If we get a 429 error (quota exceeded) or other API error, try the fallback
      if (error.message && (error.message.includes("429") || error.message.includes("400")) && currentModel === MODELS.PRIMARY) {
        console.log("Trying fallback model due to API error...");
        
        // Reset chat instance to use the fallback model
        chatInstance = null;
        currentModel = MODELS.FALLBACK;
        model = genAI.getGenerativeModel({ model: currentModel });
        
        // Recreate the chat with the fallback model using the updated system prompt
        const systemPrompt = `You are Iyraa, a warm, friendly, and intelligent English tutor AI designed to help users improve their English naturally and confidently.

        The current conversation topic is: ${topic}.
        
        ***CRITICAL INSTRUCTIONS***:
        - Respond with EXACTLY ONE conversational reply directly answering the user's message
        - NEVER provide ANY grammar assessment, feedback, or comments on their language quality
        - NEVER start with phrases like "That's a good question" or "That's well expressed" or any similar commentary
        - DO NOT split your response into multiple messages or thoughts
        - Simply respond naturally as you would in a human conversation
        - Keep responses warm, concise, and conversational
        
        Begin the conversation by introducing yourself: "Hi, I'm Iyraa, your friendly English tutor. I'm here to help you practice conversational English in a natural, supportive way!"`;
        
        chatInstance = model.startChat({ history: [] });
        
        // Send the system prompt
        await (await chatInstance.sendMessage(
          `System instruction (please follow these guidelines): ${systemPrompt}`
        )).response;
        
        // Try again with the fallback model
        const fallbackResult = await chatInstance.sendMessage(userMessage);
        const fallbackResponse = await fallbackResult.response;
        const fallbackText = fallbackResponse.text();
        
        return fallbackText;
      } else {
        // If it's not a quota error or fallback also failed, throw the error
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Error with Gemini API:", error);
    
    // Custom message for API key errors
    if (error.message && error.message.includes("API key")) {
      return `There seems to be an issue with your API key. Please check your settings and make sure you've entered a valid Google Gemini API key.`;
    }
    
    // Custom message for rate limit errors
    if (error.message && error.message.includes("429")) {
      return `You've reached the API rate limit. Please try again in a few minutes or use a different API key in the Settings page.`;
    }
    
    return `Sorry, I encountered an error. Please check the Settings page to ensure your API key is correctly set up.`;
  }
};

// Get feedback on user's speaking
export const getLanguageFeedback = async (userMessage: string): Promise<{
  feedback: string,
  fluencyScore: number,
  vocabularyScore: number,
  grammarScore: number
}> => {
  try {
    // Get fresh instance with current API key
    const genAI = getGenAIInstance();
    if (!genAI) {
      return {
        feedback: "Please add your Gemini API key in the Settings page to use this feature.",
        fluencyScore: 0,
        vocabularyScore: 0,
        grammarScore: 0
      };
    }
    
    // Try with primary model first
    let currentModel = MODELS.PRIMARY;
    let model = genAI.getGenerativeModel({ model: currentModel });
    
    try {
      console.log(`Getting language feedback using model: ${currentModel}`);
      
      // Create a new chat session for the feedback with updated persona instructions
      const feedbackChat = model.startChat({
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent evaluation
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      });
      
      const prompt = `
        You are Iyraa, a warm and supportive English tutor. 
        
        Analyze the following English sentence or paragraph:
        
        "${userMessage}"
        
        DO NOT provide grammar corrections or assessments. Focus ONLY on providing ONE simple, encouraging response without ANY language analysis.
        
        Your feedback must:
        - Be ONE simple conversational response with NO critique
        - NEVER mention any errors or language quality
        - NEVER include phrases like "That's well expressed" or "Good job with..."
        - Just respond naturally to what they said as if you're having a regular conversation
        
        Format your response as a JSON object with these keys exactly: 
        {
          "feedback": "your single conversational response (NO grammar comments)",
          "fluencyScore": number (0-100),
          "vocabularyScore": number (0-100),
          "grammarScore": number (0-100)
        }
      `;
      
      // Send the message using the chat instance
      const result = await feedbackChat.sendMessage(prompt);
      const response = await result.response;
      const text = response.text().trim();
      console.log(`Got feedback response (first 50 chars): "${text.substring(0, 50)}..."`);
      
      // Extract the JSON from the response
      // First try to parse the whole response as JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        // If that fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // If still no valid JSON, throw an error
        throw new Error("Could not parse feedback response as JSON");
      }
    } catch (error: any) {
      console.error(`Error with model ${currentModel}:`, error);
      
      // If we get a 429 error (quota exceeded) or any API error and we're using the primary model, try the fallback
      if (error.message && (error.message.includes("429") || error.message.includes("400")) && currentModel === MODELS.PRIMARY) {
        console.log("Trying fallback model for feedback due to API error...");
        
        // Use the fallback model
        currentModel = MODELS.FALLBACK;
        model = genAI.getGenerativeModel({ model: currentModel });
        
        // Create a new chat session with fallback model and the updated persona instructions
        const feedbackChat = model.startChat({
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        });
        
        const prompt = `
          You are Iyraa, a warm and supportive English tutor. 
          
          Analyze the following English sentence or paragraph:
          
          "${userMessage}"
          
          DO NOT provide grammar corrections or assessments. Focus ONLY on providing ONE simple, encouraging response without ANY language analysis.
        
          Your feedback must:
          - Be ONE simple conversational response with NO critique
          - NEVER mention any errors or language quality
          - NEVER include phrases like "That's well expressed" or "Good job with..."
          - Just respond naturally to what they said as if you're having a regular conversation
          
          Format your response as a JSON object with these keys exactly: 
          {
            "feedback": "your single conversational response (NO grammar comments)",
            "fluencyScore": number (0-100),
            "vocabularyScore": number (0-100),
            "grammarScore": number (0-100)
          }
        `;
        
        // Try again with fallback model
        const fallbackResult = await feedbackChat.sendMessage(prompt);
        const fallbackResponse = await fallbackResult.response;
        const fallbackText = fallbackResponse.text().trim();
        
        // Extract JSON from fallback response
        try {
          return JSON.parse(fallbackText);
        } catch (e) {
          const jsonMatch = fallbackText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          throw new Error("Could not parse feedback response as JSON from fallback model");
        }
      } else {
        // If it's not a quota error or fallback also failed, throw the error
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Error getting language feedback:", error);
    
    // Custom error message based on error type
    if (error.message && error.message.includes("API key")) {
      return {
        feedback: "Please check your API key in Settings.",
        fluencyScore: 50,
        vocabularyScore: 50,
        grammarScore: 50
      };
    }
    
    return {
      feedback: "Could not analyze your response. Check your API key in Settings.",
      fluencyScore: 50,
      vocabularyScore: 50,
      grammarScore: 50
    };
  }
};
