
import React, { useRef, useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { MessageSquare, User, Mic, MicOff, AlertOctagon, Volume, VolumeX, Send, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

type ConversationEntry = {
  speaker: 'ai' | 'user';
  text: string;
};

interface ConversationDisplayProps {
  conversationHistory: ConversationEntry[];
  currentQuestion: string;
  isProcessing: boolean;
  isListening: boolean;
  transcript: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSpeakMessage?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  hasApiError?: boolean;
  onTextSubmit?: (text: string) => void;
  lastUserSentence?: string;
  correctedSentence?: string;
}

const ConversationDisplay = ({
  conversationHistory,
  currentQuestion,
  isProcessing,
  isListening,
  transcript,
  onStartRecording,
  onStopRecording,
  onSpeakMessage,
  isSpeaking,
  onStopSpeaking,
  hasApiError,
  onTextSubmit,
  lastUserSentence,
  correctedSentence
}: ConversationDisplayProps) => {
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the conversation
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat with Iyraa</CardTitle>
        <CardDescription>Practice your English in a natural conversation with Iyraa, your friendly AI tutor</CardDescription>
      </CardHeader>
      <CardContent>
        {hasApiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertOctagon className="h-4 w-4" />
            <AlertDescription>
              There was an error connecting to the AI. Please try again or check your API key in Settings.
            </AlertDescription>
          </Alert>
        )}
        <div className="h-96 overflow-y-auto border rounded-lg p-4">
          {conversationHistory.map((entry, index) => (
            <div key={index} className={`flex mb-4 ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex max-w-[80%] ${entry.speaker === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`flex items-center justify-center h-8 w-8 rounded-full mr-2 ${
                  entry.speaker === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {entry.speaker === 'ai' ? <MessageSquare className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`p-3 pr-12 rounded-lg relative ${
                  entry.speaker === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                }`}>
                  <span className="block">{entry.text}</span>
                  {entry.speaker === 'ai' && onSpeakMessage && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 absolute top-2 right-2 rounded-full bg-accent text-accent-foreground shadow-glow-accent hover:scale-105 transition-transform hover:bg-accent/90 active:scale-100 focus:ring-2 focus:ring-accent"
                      onClick={() => entry.text && onSpeakMessage(entry.text)}
                      title="Listen to this message"
                    >
                      <Volume className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex mb-4 justify-start">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex items-center justify-center h-8 w-8 rounded-full mr-2 bg-primary text-primary-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">Thinking</div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 flex-col">
        <RecordingControls
          isListening={isListening}
          isProcessing={isProcessing}
          currentQuestion={currentQuestion}
          transcript={transcript}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          isSpeaking={isSpeaking}
          onStopSpeaking={onStopSpeaking}
          onTextSubmit={onTextSubmit}
          lastUserSentence={lastUserSentence}
          correctedSentence={correctedSentence}
        />
      </CardFooter>
    </Card>
  );
};

// Internal component for recording controls
const RecordingControls = ({
  isListening,
  isProcessing,
  currentQuestion,
  transcript,
  onStartRecording,
  onStopRecording,
  isSpeaking,
  onStopSpeaking,
  onTextSubmit,
  lastUserSentence,
  correctedSentence
}: {
  isListening: boolean;
  isProcessing: boolean;
  currentQuestion: string;
  transcript: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  onTextSubmit?: (text: string) => void;
  lastUserSentence?: string;
  correctedSentence?: string;
}) => {
  const [textInput, setTextInput] = useState('');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && onTextSubmit && !isProcessing) {
      onTextSubmit(textInput);
      setTextInput('');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between w-full mb-4">
        <div className="text-lg font-medium flex items-center gap-2">
          {isListening ? 'Listening...' : 
           currentQuestion ? currentQuestion : "Type or speak your message"}
          {isSpeaking && (
            <Button 
              onClick={onStopSpeaking} 
              variant="outline"
              size="sm"
              className="ml-2 flex items-center gap-1"
            >
              <VolumeX className="h-4 w-4" /> Stop
            </Button>
          )}
        </div>
        <Button
          onClick={isListening ? onStopRecording : onStartRecording}
          variant={isListening ? "destructive" : "default"}
          className="rounded-full h-12 w-12 p-0 flex items-center justify-center"
          disabled={isProcessing}
          title={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
      </div>
      
      {isListening && (
        <div className="w-full text-center font-medium bg-muted/30 p-2 rounded-md animate-pulse">
          {transcript ? transcript : 'Waiting for you to speak...'}
        </div>
      )}
      
      <form onSubmit={handleTextSubmit} className="w-full mt-4 flex gap-2">
        <div className="flex-1">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isProcessing || isListening}
            className="w-full"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!textInput.trim() || isProcessing || isListening}
          size="icon"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {lastUserSentence && correctedSentence && !isListening && !isProcessing && (
        <div className="mt-4 p-3 border rounded-md bg-green-50">
          <div className="flex items-center gap-2 mb-1.5 text-green-700">
            <Check className="h-4 w-4" />
            <span className="font-medium">Sentence Correction</span>
          </div>
          {lastUserSentence === correctedSentence ? (
            <p className="text-green-700">Perfect! Your sentence was grammatically correct.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-muted-foreground">Your sentence: <span className="font-medium text-foreground">{lastUserSentence}</span></p>
              <p className="text-green-700">Corrected: <span className="font-medium">{correctedSentence}</span></p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ConversationDisplay;
