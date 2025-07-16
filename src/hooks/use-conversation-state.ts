import { useState } from 'react';
import { toast } from "sonner";
import { resetChatHistory, sendMessageToGemini } from '@/lib/gemini-api';
import { useNavigate } from 'react-router-dom';
import { handleDailyData } from '@/data/progressData';
export type ConversationEntry = {
  speaker: 'ai' | 'user';
  text: string;
};

export function useConversationState() {
  const [activeTopic, setActiveTopic] = useState("daily_life");
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fluencyScore, setFluencyScore] = useState(60);
  const [vocabularyScore, setVocabularyScore] = useState(70);
  const [grammarScore, setGrammarScore] = useState(65);
  const [hasApiError, setHasApiError] = useState(false);
  
  const navigate = useNavigate();
  
  // Initialize conversation with API key check
  const initializeConversation = async () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey || apiKey.trim() === '') {
      toast.warning(
        "No API key found. Please set your Gemini API key in Settings",
        {
          action: {
            label: "Go to Settings",
            onClick: () => navigate('/settings')
          },
          duration: 10000,
        }
      );
      setHasApiError(true);
      return false;
    } else {
      console.log("API key found, initializing conversation");
      setHasApiError(false);
      try {
        resetChatHistory(activeTopic);
        const initialGreeting = "Hi, I'm Iyraa, your friendly English tutor. I'm here to help you learn, practice, and fall in love with English — one conversation at a time! What would you like to talk about today?";
        // Reset conversation history to only the greeting
        setConversationHistory([{ speaker: 'ai', text: initialGreeting }]);
        setCurrentQuestion(initialGreeting);
        // Log for debugging
        console.log("[ConversationState] Initialized conversation, history:", [{ speaker: 'ai', text: initialGreeting }]);
        return true;
      } catch (error) {
        console.error("Error initializing conversation:", error);
        setHasApiError(true);
        toast.error("Error initializing conversation. Please check your API key.");
        return false;
      }
    }
  };

  // Handle topic change
  const handleTopicChange = async (value: string) => {
    setActiveTopic(value);
    setIsProcessing(true);
    setHasApiError(false);
    
    try {
      resetChatHistory(value);
      // Wipe conversation to avoid "previous chats"
      setConversationHistory([]); // <-- THIS LINE IS ADDED!
      const topicGreeting = await sendMessageToGemini(`Let's talk about ${value.replace('_', ' ')}. Ask me a question about this topic.`, value);
      
      if (topicGreeting.includes("Sorry, I encountered an error")) {
        setHasApiError(true);
        toast.error("Error connecting to the conversation AI");
      }
      
      // Only show the new topic greeting in history
      setConversationHistory([{ speaker: 'ai', text: topicGreeting }]);
      setCurrentQuestion(topicGreeting);
      toast.success(`Topic changed to ${value.replace('_', ' ')}`);
      // Debug log
      console.log("[ConversationState] Topic changed, history:", [{ speaker: 'ai', text: topicGreeting }]);
      return topicGreeting;
    } catch (error) {
      setHasApiError(true);
      toast.error("Failed to change topic. Please try again.");
      console.error("Topic change error:", error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Process user's response
  const processUserResponse = async (userResponse: string) => {
    setIsProcessing(true);
    setHasApiError(false);
    
    try {
      // Add user's response to conversation history
      setConversationHistory(prev => [
        ...prev, 
        { speaker: 'user', text: userResponse }
      ]);
      
      // Generate response from AI
      const aiResponse = await sendMessageToGemini(userResponse, activeTopic);
      
      if (aiResponse.includes("Sorry, I encountered an error")) {
        setHasApiError(true);
        toast.error("Error connecting to the conversation AI");
      }
      
      // Update scores with some randomized variation to simulate evaluation
      setFluencyScore(prev => Math.min(100, Math.max(0, prev + (Math.random() * 20 - 10))));
      setVocabularyScore(prev => Math.min(100, Math.max(0, prev + (Math.random() * 20 - 10))));
      setGrammarScore(prev => Math.min(100, Math.max(0, prev + (Math.random() * 20 - 10))));
      const currDay = {
              date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
              day: new Date().toLocaleDateString("en-US", { weekday: "short" }),
              fullDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
              speaking: 0,
              pronunciation: fluencyScore || 0,
              vocabulary: vocabularyScore || 0,
              grammar: grammarScore || 0,
              story: 0,
              reflex: 0,
              totalTime: 0,
              sessionsCompleted: 0
            };
            // console.log('starting update', dailyData())
            await handleDailyData(currDay);
      // Add AI response to conversation
      setConversationHistory(prev => [
        ...prev, 
        { speaker: 'ai', text: aiResponse }
      ]);
      
      setCurrentQuestion(aiResponse);
      
      return { nextQuestion: aiResponse };
    } catch (error) {
      console.error("Error processing response:", error);
      setHasApiError(true);
      toast.error("There was an error processing your response.");
      
      // Fallback response
      const fallbackMessage = "I'm having trouble understanding. Could you try saying that again?";
      setConversationHistory(prev => [
        ...prev, 
        { speaker: 'ai', text: fallbackMessage }
      ]);
      
      return { nextQuestion: fallbackMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear conversation history
  const clearConversationHistory = () => {
    // Clear history before resetting!
    setConversationHistory([]);
    setCurrentQuestion("");
    resetChatHistory(activeTopic);
    toast.success("Conversation cleared");
    // Debug log
    console.log("[ConversationState] Cleared conversation history.");
  };

  return {
    activeTopic,
    conversationHistory,
    currentQuestion,
    isProcessing,
    fluencyScore,
    vocabularyScore,
    grammarScore,
    hasApiError,
    initializeConversation,
    handleTopicChange,
    processUserResponse,
    clearConversationHistory
  };
}
