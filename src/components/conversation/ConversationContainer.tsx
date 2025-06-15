
import React from 'react';
import ConversationDisplay from './ConversationDisplay';
import TopicSelector from './TopicSelector';
import GrammarRingGraph from './GrammarRingGraph';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Trash2 } from 'lucide-react';

interface ConversationContainerProps {
  activeTopic: string;
  conversationHistory: { speaker: 'ai' | 'user'; text: string }[];
  currentQuestion: string;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  onTopicChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSpeakMessage?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  hasApiError?: boolean;
  onClearConversation?: () => void;
  onTextSubmit?: (text: string) => void;
  lastUserSentence?: string;
  correctedSentence?: string;
}

const ConversationContainer = ({
  activeTopic,
  conversationHistory,
  currentQuestion,
  isListening,
  isProcessing,
  transcript,
  fluencyScore,
  vocabularyScore,
  grammarScore,
  onTopicChange,
  onStartRecording,
  onStopRecording,
  onSpeakMessage,
  isSpeaking,
  onStopSpeaking,
  hasApiError,
  onClearConversation,
  onTextSubmit,
  lastUserSentence,
  correctedSentence
}: ConversationContainerProps) => {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Conversation AI</h1>
          <div className="flex items-center gap-2">
            <TopicSelector 
              activeTopic={activeTopic}
              onTopicChange={onTopicChange}
              disabled={isProcessing || isListening}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearConversation}
              disabled={isProcessing || isListening || conversationHistory.length === 0}
              className="flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </Button>
          </div>
        </div>

        {hasApiError && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <p className="text-amber-700">
              There seems to be an issue with the Gemini API. Please check your API key in{" "}
              <Link to="/settings" className="text-primary underline font-medium">
                Settings
              </Link>
              .
            </p>
          </div>
        )}

        <ConversationDisplay 
          conversationHistory={conversationHistory}
          currentQuestion={currentQuestion}
          isProcessing={isProcessing}
          isListening={isListening}
          transcript={transcript}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onSpeakMessage={onSpeakMessage}
          isSpeaking={isSpeaking}
          onStopSpeaking={onStopSpeaking}
          hasApiError={hasApiError}
          onTextSubmit={onTextSubmit}
          lastUserSentence={lastUserSentence}
          correctedSentence={correctedSentence}
        />

        <div className="mt-4">
          {(lastUserSentence && correctedSentence) && (
            <GrammarRingGraph 
              fluencyScore={fluencyScore}
              vocabularyScore={vocabularyScore}
              grammarScore={grammarScore}
              userSentence={lastUserSentence}
              correctedSentence={correctedSentence}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationContainer;
