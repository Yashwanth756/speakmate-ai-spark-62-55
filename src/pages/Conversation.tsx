
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import ConversationContainer from '@/components/conversation/ConversationContainer';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { useConversation } from '@/contexts/ConversationContext';

// Intermediate component to access the context
const ConversationContent = () => {
  const {
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
    handleTopicChange,
    handleStartRecording,
    handleStopRecording,
    speakText,
    stopSpeaking,
    clearConversation
  } = useConversation();

  return (
    <ConversationContainer
      activeTopic={activeTopic}
      conversationHistory={conversationHistory}
      currentQuestion={currentQuestion}
      isListening={isListening}
      isProcessing={isProcessing}
      transcript={transcript}
      fluencyScore={fluencyScore}
      vocabularyScore={vocabularyScore}
      grammarScore={grammarScore}
      onTopicChange={handleTopicChange}
      onStartRecording={handleStartRecording}
      onStopRecording={handleStopRecording}
      onSpeakMessage={speakText}
      isSpeaking={isSpeaking}
      onStopSpeaking={stopSpeaking}
      hasApiError={hasApiError}
      onClearConversation={clearConversation}
    />
  );
};

const ConversationAI = () => {
  return (
    <ConversationProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background w-full">
          <AppSidebar />
          <ConversationContent />
        </div>
      </SidebarProvider>
    </ConversationProvider>
  );
};

export default ConversationAI;
