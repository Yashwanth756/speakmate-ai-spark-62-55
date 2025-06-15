import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Play, RefreshCcw, Volume2, VolumeX } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StoryDisplayProps {
  story: string;
  onProgressUpdate: (progress: number) => void;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onProgressUpdate }) => {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatus, setWordStatus] = useState<('pending' | 'correct' | 'incorrect')[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const { transcript, interimTranscript, resetTranscript, startListening, stopListening, supported } = useSpeechRecognition();
  
  // Process the story into words when it changes
  useEffect(() => {
    if (story) {
      const storyWords = story
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase().replace(/[^\w']/g, ''));
      
      setWords(storyWords);
      setWordStatus(new Array(storyWords.length).fill('pending'));
      setCurrentWordIndex(0);
      setAccumulatedTranscript('');
      onProgressUpdate(0);
    }
  }, [story, onProgressUpdate]);

  // Check words when transcript changes - maintain continuous checking
  useEffect(() => {
    if (!isListening || (!transcript && !interimTranscript) || currentWordIndex >= words.length) return;

    // Combine finalized and interim transcript for fast/live effect
    const liveTranscript = (transcript + " " + (interimTranscript || "")).toLowerCase().trim();

    // Get all spoken words from the continuous transcript
    const spokenWords = liveTranscript.split(/\s+/).filter(word => word.length > 0);
    const newWordStatus = [...wordStatus];
    let newCurrentIndex = currentWordIndex;
    
    // Check if we can find the current expected word in the recent speech
    const expectedWord = words[currentWordIndex].toLowerCase();
    
    // Look for the expected word in the last few words of the transcript
    const recentWords = spokenWords.slice(-5); // Check last 5 words
    const wordFound = recentWords.some(word => word === expectedWord || word.includes(expectedWord));
    
    if (wordFound) {
      // Word is correct
      newWordStatus[currentWordIndex] = 'correct';
      
      // Move to next word
      if (currentWordIndex < words.length - 1) {
        newCurrentIndex = currentWordIndex + 1;
        setCurrentWordIndex(newCurrentIndex);
      }
      
      // Update progress
      const progress = ((newCurrentIndex) / words.length) * 100;
      onProgressUpdate(progress);
      
      setWordStatus(newWordStatus);
    }
    
    // Keep the transcript for continuous speech (we now set it to full live text)
    setAccumulatedTranscript(liveTranscript);
  }, [transcript, interimTranscript, isListening, currentWordIndex, words, wordStatus, onProgressUpdate]);

  const handleStartReading = () => {
    if (!supported) {
      alert("Speech recognition is not supported by your browser.");
      return;
    }
    
    setIsListening(true);
    // Don't reset transcript to maintain continuity
    startListening();
  };

  const handleStopReading = () => {
    setIsListening(false);
    stopListening();
  };

  const handleResetProgress = () => {
    setCurrentWordIndex(0);
    setWordStatus(new Array(words.length).fill('pending'));
    setAccumulatedTranscript('');
    onProgressUpdate(0);
    resetTranscript();
  };

  const handleClearTranscript = () => {
    resetTranscript();
    setAccumulatedTranscript('');
  };

  const handleSpeakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeakFullStory = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(story);
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!story || words.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-muted-foreground">
          No story available yet. Click "New Story" to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Story Text Display */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
        <div className="text-xl leading-relaxed font-serif">
          {words.map((word, index) => (
            <span 
              key={index}
              className={cn(
                "px-2 py-1 mx-1 rounded-md cursor-pointer transition-all duration-300 inline-block",
                index === currentWordIndex && "bg-yellow-200 dark:bg-yellow-800 border-2 border-yellow-400 shadow-lg scale-110",
                wordStatus[index] === 'correct' && "text-green-700 dark:text-green-300 font-semibold bg-green-100 dark:bg-green-900/30",
                wordStatus[index] === 'incorrect' && "text-red-700 dark:text-red-300 font-semibold bg-red-100 dark:bg-red-900/30",
                wordStatus[index] === 'pending' && index !== currentWordIndex && "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => handleSpeakWord(word)}
              title={`Click to hear "${word}"`}
            >
              {word}
              {/[.!?;]$/.test(story.split(/\s+/)[index] || '') && ' '}
            </span>
          ))}
        </div>
      </div>

      {/* Reading Controls */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          {/* Status Display */}
          <div className="mb-6 text-center">
            <p className="text-lg mb-2">
              {isListening 
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Listening continuously... Say the highlighted word</span>
                  </span>
                )
                : "Click 'Start Reading' to begin practicing pronunciation"
              }
            </p>
            
            {(transcript || interimTranscript) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-primary">Continuous Speech:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearTranscript}
                    className="text-xs"
                  >
                    <VolumeX className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                {/* Display interim transcription live with a subtle style */}
                <p className="text-lg font-mono">
                  {transcript}
                  {interimTranscript && (
                    <span className="opacity-70 text-blue-600 animate-pulse">
                      {" "}{interimTranscript}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
          
          {/* Control Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {!isListening ? (
              <Button 
                onClick={handleStartReading} 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                <Mic className="mr-2 h-5 w-5" />
                {(accumulatedTranscript && accumulatedTranscript.trim() !== "") ? "Continue Reading" : "Start Reading Practice"}
              </Button>
            ) : (
              <Button 
                onClick={handleStopReading} 
                variant="secondary" 
                size="lg"
                className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
              >
                <Mic className="mr-2 h-5 w-5" />
                Stop Reading
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => handleSpeakWord(words[currentWordIndex])}
              size="lg"
              className="border-blue-300 hover:bg-blue-50"
            >
              <Play className="mr-2 h-5 w-5" />
              Hear Current Word
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSpeakFullStory}
              size="lg"
              className="border-purple-300 hover:bg-purple-50"
            >
              <Volume2 className="mr-2 h-5 w-5" />
              Listen to Story
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleResetProgress}
              size="lg"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RefreshCcw className="mr-2 h-5 w-5" />
              Reset Progress
            </Button>
          </div>

          {/* Reading Tips */}
          <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Reading Tips:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Click on any word to hear its pronunciation</li>
              <li>• Speak continuously - pauses won't reset your progress</li>
              <li>• The highlighted word shows your current position</li>
              <li>• Green words are correctly pronounced, red ones need practice</li>
              <li>• Auto-stops after 2 minutes of silence</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
