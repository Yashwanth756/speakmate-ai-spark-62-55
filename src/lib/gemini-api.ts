import { GoogleGenerativeAI } from "@google/generative-ai";

// Default and rotating API keys
const DEFAULT_API_KEY = "AIzaSyCc0ZYxEuoocwAZ5jKM8fWQEd0wz6sh4uI";
const API_KEYS = [
  'AIzaSyBERkzxfo0L9qg8uWPt5YScDqmmIcvIkF4',
  "AIzaSyCc0ZYxEuoocwAZ5jKM8fWQEd0wz6sh4uI",
  'AIzaSyCRk2Yipn_lreY__-KFoCI0Uvi8XAQlVyM'
  // Add more keys here if needed
];

let index = 0;

// Model configuration
const MODELS = {
  PRIMARY: "gemini-1.5-flash",
  FALLBACK: "gemini-pro",
};

// Track chat instance for continuity
let chatInstance: any = null;
let currentTopic = "";

/**
 * API key rotation utilities
 */
function getCurrentKey(): string {
  return API_KEYS[index];
}

function rotateKey(): string {
  index = (index + 1) % API_KEYS.length;
  return getCurrentKey();
}

/**
 * Get a new GoogleGenerativeAI instance with the current key
 */
function getGenAI(): GoogleGenerativeAI {
  console.log('current API key:', getCurrentKey());
  return new GoogleGenerativeAI(getCurrentKey());
}

/**
 * System prompt template
 */
function buildSystemPrompt(topic: string): string {
  return `You are Iyraa, a warm, friendly, and intelligent English tutor AI designed to help users improve their English naturally and confidently.

The current conversation topic is: ${topic}.

***CRITICAL INSTRUCTIONS***:
- Respond with EXACTLY ONE conversational reply directly answering the user's message
- NEVER provide ANY grammar assessment, feedback, or comments on their language quality
- NEVER start with phrases like "That's a good question" or "That's well expressed" or any similar commentary
- DO NOT split your response into multiple messages or thoughts
- Simply respond naturally as you would in a human conversation
- Keep responses warm, concise, and conversational

Begin the conversation by introducing yourself: "Hi, I'm Iyraa, your friendly English tutor. I'm here to help you practice conversational English in a natural, supportive way!"`;
}

/**
 * Reset chat history
 */
export const resetChatHistory = (topic: string): void => {
  chatInstance = null;
  currentTopic = topic;
  console.log(`[Gemini API] Chat reset with topic: ${topic}`);
};

/**
 * Main function to send a message to Gemini with retries
 */
export const sendMessageToGemini = async (
  userMessage: string,
  topic: string,
  retriesLeft = API_KEYS.length
): Promise<string> => {
  
  if (retriesLeft <= 0) {
    return "All API keys have been exhausted. Please check your quota or add more API keys in Settings.";
  }

  try {
    const genAI = getGenAI();
    let currentModel = MODELS.PRIMARY;
    let model = genAI.getGenerativeModel({ model: currentModel });
    if (topic !== currentTopic) {
      resetChatHistory(topic);
    }
    // if (chatInstance) {
      console.log(`[Gemini API] Initializing new chat for topic: ${topic} using model: ${currentModel}`);
      chatInstance = model.startChat({ history: [] });
      await (await chatInstance.sendMessage(
        `System instruction (please follow these guidelines): ${buildSystemPrompt(topic)}`
      )).response;
      currentTopic = topic;
    // }
    // console.log(`[Gemini API] Sending user message: "${userMessage}"`);
    const result = await chatInstance.sendMessage(userMessage);
    const responseText = result.response.text();
    console.log(`[Gemini API] Received response (truncated): "${responseText.substring(0, 50)}..."`);
    return responseText;

  } catch (error: any) {
    console.error(`[Gemini API] Error: ${error?.message}`);
    // console.error(`[Gemini API] Current key: ${getCurrentKey()}`);
    rotateKey();
    return await sendMessageToGemini(userMessage, topic, retriesLeft - 1);

    // Check for quota errors
    if (error?.message && (error.message.includes("429") || error.message.includes("400"))) {
      console.warn("[Gemini API] Quota error detected. Rotating key...");
      rotateKey();
      return await sendMessageToGemini(userMessage, topic, retriesLeft - 1);
    }

    // Try fallback model if we weren't already on it
    if (error?.message && !error.message.includes("API key")) {
      try {
        console.log("[Gemini API] Attempting fallback model...");
        const genAI = getGenAI();
        let fallbackModel = genAI.getGenerativeModel({ model: MODELS.FALLBACK });
        chatInstance = fallbackModel.startChat({ history: [] });
        await (await chatInstance.sendMessage(
          `System instruction (please follow these guidelines): ${buildSystemPrompt(topic)}`
        )).response;
        const fallbackResult = await chatInstance.sendMessage(userMessage);
        const fallbackText = fallbackResult.response.text();
        return fallbackText;
      } catch (fallbackError: any) {
        console.error(`[Gemini API] Fallback model error: ${fallbackError?.message}`, getCurrentKey());
        rotateKey();
        return await sendMessageToGemini(userMessage, topic, retriesLeft - 1);
      }
    }

    // Other errors
    console.warn("[Gemini API] Rotating key due to generic error...", getCurrentKey());

    rotateKey();
    return await sendMessageToGemini(userMessage, topic, retriesLeft - 1);
  }
};

/**
 * Get feedback on user's speaking
 */
export const getLanguageFeedback = async (userMessage: string): Promise<{
  feedback: string,
  fluencyScore: number,
  vocabularyScore: number,
  grammarScore: number
}> => {
  let retriesLeft = API_KEYS.length;
  while (retriesLeft > 0) {
    try {
      const genAI = getGenAI();
      let model = genAI.getGenerativeModel({ model: MODELS.PRIMARY });

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

      const result = await feedbackChat.sendMessage(prompt);
      const text = result.response.text().trim();
      console.log(`[Gemini API] Feedback response (truncated): "${text.substring(0, 50)}..."`);

      try {
        return JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Invalid JSON in feedback response");
      }

    } catch (error: any) {
      console.error(`[Gemini API] Error getting feedback: ${error?.message}`);
      if (error?.message && (error.message.includes("429") || error.message.includes("400"))) {
        console.warn("[Gemini API] Quota error detected. Rotating key...");
        rotateKey();
        retriesLeft--;
        continue;
      }

      // Try fallback model once
      try {
        console.log("[Gemini API] Attempting fallback model for feedback...");
        const genAI = getGenAI();
        let fallbackModel = genAI.getGenerativeModel({ model: MODELS.FALLBACK });

        const feedbackChat = fallbackModel.startChat({
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        });

        const fallbackResult = await feedbackChat.sendMessage(prompt);
        const fallbackText = fallbackResult.response.text().trim();

        try {
          return JSON.parse(fallbackText);
        } catch {
          const match = fallbackText.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error("Invalid JSON in fallback feedback response");
        }

      } catch (fallbackError: any) {
        console.error(`[Gemini API] Fallback feedback error: ${fallbackError?.message}`);
        rotateKey();
        retriesLeft--;
        continue;
      }
    }
  }

  return {
    feedback: "Could not analyze your response. Check your API key in Settings.",
    fluencyScore: 50,
    vocabularyScore: 50,
    grammarScore: 50
  };
};
