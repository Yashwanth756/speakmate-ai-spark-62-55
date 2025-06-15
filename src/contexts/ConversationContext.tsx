
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConversationState, ConversationEntry } from '@/hooks/use-conversation-state';
import { useSpeechAudio } from '@/hooks/use-speech-audio';
import { generateComprehensiveAnalysis, LanguageAnalysis } from '@/lib/language-analyzer';

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
  languageAnalysis: LanguageAnalysis | null;
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
    clearConversationHistory,
    updateScoresFromAnalysis
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
  
  // Enhanced state for language analysis
  const [lastUserSentence, setLastUserSentence] = useState('');
  const [correctedSentence, setCorrectedSentence] = useState('');
  const [languageAnalysis, setLanguageAnalysis] = useState<LanguageAnalysis | null>(null);
  
  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);
  
  // Enhanced stop recording handler with fast local analysis
  const handleStopRecording = async () => {
    stopRecording();
    
    if (transcript) {
      setLastUserSentence(transcript);
      
      // Perform fast local analysis first
      const analysis = generateComprehensiveAnalysis(transcript);
      setLanguageAnalysis(analysis);
      
      // Update scores immediately from local analysis
      updateScoresFromAnalysis(analysis);
      
      // Create a simple correction (this could be enhanced with AI)
      const simpleCorrection = simulateGrammarCorrection(transcript, analysis);
      setCorrectedSentence(simpleCorrection);
      
      const response = await processUserResponse(transcript);
      
      // Speak only the next question
      if (response?.nextQuestion) {
        speakText(response.nextQuestion);
      }
      resetTranscript();
    }
  };
  
  // Enhanced grammar correction using analysis results
  const simulateGrammarCorrection = (text: string, analysis: LanguageAnalysis): string => {
    let corrected = text.trim();
    
    // Apply corrections based on detected errors
    analysis.detailedAnalysis.grammarErrors.forEach(error => {
      if (error.includes("capital letter") && corrected.length > 0) {
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      }
      if (error.includes("'I' should be capitalized")) {
        corrected = corrected.replace(/\bi\b/g, 'I');
      }
      if (error.includes("Multiple spaces")) {
        corrected = corrected.replace(/\s+/g, ' ');
      }
    });
    
    // Add period if missing at the end
    if (corrected.length > 0 && !['!', '.', '?'].includes(corrected[corrected.length - 1])) {
      corrected += '.';
    }
    
    return corrected;
  };
  
  // Handle topic change with audio
  const handleTopicChangeWithAudio = async (value: string) => {
    const topicGreeting = await handleTopicChange(value);
    if (topicGreeting) {
      speakText(topicGreeting);
    }
    return topicGreeting;
  };

  // Clear conversation and reinitialize
  const clearConversation = () => {
    stopSpeaking();
    clearConversationHistory();
    setLastUserSentence('');
    setCorrectedSentence('');
    setLanguageAnalysis(null);
    resetTranscript();
    initializeConversation();
  };
  
  // Enhanced text submission with local analysis
  const handleTextSubmit = async (text: string) => {
    setLastUserSentence(text);
    
    // Perform comprehensive analysis
    const analysis = generateComprehensiveAnalysis(text);
    setLanguageAnalysis(analysis);
    updateScoresFromAnalysis(analysis);
    
    // Simulate correction
    const simpleCorrection = simulateGrammarCorrection(text, analysis);
    setCorrectedSentence(simpleCorrection);
    
    const response = await processUserResponse(text);
    
    // Speak only the next question
    if (response?.nextQuestion) {
      speakText(response.nextQuestion);
    }
    resetTranscript();
  };

  // Patch startRecording to always reset transcript first
  const patchedStartRecording = () => {
    resetTranscript();
    handleStartRecording();
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
    languageAnalysis,
    handleTopicChange: handleTopicChangeWithAudio,
    handleStartRecording: patchedStartRecording,
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
