import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConversationState, ConversationEntry } from '@/hooks/use-conversation-state';
import { useSpeechAudio } from '@/hooks/use-speech-audio';

interface ConversationContextType {
  activeTopic: string;
  conversationHistory: ConversationEntry[];
  currentQuestion: string;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  isSpeaking: boolean;
  hasApiError: boolean;
  lastUserSentence: string;
  correctedSentence: string;
  handleTopicChange: (value: string) => Promise<string | null>;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  clearConversation: () => void;
  handleTextSubmit: (text: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
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
  } = useConversationState();

  const {
    isListening,
    isSpeaking,
    transcript,
    handleStartRecording,
    handleStopRecording: stopRecording,
    speakText,
    stopSpeaking,
    resetTranscript
  } = useSpeechAudio();
  
  const [lastUserSentence, setLastUserSentence] = useState('');
  const [correctedSentence, setCorrectedSentence] = useState('');
  
  useEffect(() => {
    initializeConversation();
  }, []);
  
  const handleStopRecording = async () => {
    stopRecording();

    if (transcript) {
      setLastUserSentence(transcript);
      const simpleCorrection = simulateGrammarCorrection(transcript);
      setCorrectedSentence(simpleCorrection);

      const response = await processUserResponse(transcript);

      // Clear transcript after processing!
      resetTranscript();

      if (response?.nextQuestion) {
        speakText(response.nextQuestion);
      }
    }
  };
  
  const simulateGrammarCorrection = (text: string): string => {
    const commonErrors = [
      { error: /i am/i, correction: "I am" },
      { error: /dont/i, correction: "don't" },
      { error: /cant/i, correction: "can't" },
      { error: /im /i, correction: "I'm " },
      { error: /\bi\b/i, correction: "I" },
      { error: /\bhe dont\b/i, correction: "he doesn't" },
      { error: /\bshe dont\b/i, correction: "she doesn't" },
      { error: /\bit dont\b/i, correction: "it doesn't" },
      { error: /\bthey was\b/i, correction: "they were" },
      { error: /\bwe was\b/i, correction: "we were" },
    ];
    
    let corrected = text.trim();
    
    // First letter capitalization
    if (corrected.length > 0) {
      corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
    }
    
    // Apply corrections
    commonErrors.forEach(({ error, correction }) => {
      corrected = corrected.replace(error, correction);
    });
    
    // Add period if missing at the end
    if (corrected.length > 0 && !['!', '.', '?'].includes(corrected[corrected.length - 1])) {
      corrected += '.';
    }
    
    return corrected;
  };
  
  const handleTopicChangeWithAudio = async (value: string) => {
    const topicGreeting = await handleTopicChange(value);
    if (topicGreeting) {
      speakText(topicGreeting);
      resetTranscript();
    }
    return topicGreeting;
  };

  const clearConversation = () => {
    stopSpeaking();
    clearConversationHistory();
    setLastUserSentence('');
    setCorrectedSentence('');
    resetTranscript();
    initializeConversation();
  };
  
  const handleTextSubmit = async (text: string) => {
    setLastUserSentence(text);
    const simpleCorrection = simulateGrammarCorrection(text);
    setCorrectedSentence(simpleCorrection);

    const response = await processUserResponse(text);

    // Clear speech transcript after processing typed input as well (for consistency)
    resetTranscript();

    if (response?.nextQuestion) {
      speakText(response.nextQuestion);
    }
  };

  const value = {
    activeTopic,
    conversationHistory,
    currentQuestion,
    isListening,
    isProcessing,
    transcript,
    fluencyScore,
    vocabularyScore,
    grammarScore,
    isSpeaking,
    hasApiError,
    lastUserSentence,
    correctedSentence,
    handleTopicChange: handleTopicChangeWithAudio,
    handleStartRecording,
    handleStopRecording,
    speakText,
    stopSpeaking,
    clearConversation,
    handleTextSubmit
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
