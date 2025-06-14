import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  supported: boolean;
  lastError: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  interimTranscript: string;
}

export const useSpeechRecognition = (): SpeechRecognitionHook & {
  interimTranscript: string;
} => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = useCallback(() => {
    if (!supported) return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionClass();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setLastError(null);
      setInterimTranscript('');
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      setInterimTranscript(interim);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
      setLastError(event.error || 'Speech recognition error');
    };

    recognitionRef.current.start();
  }, [supported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setLastError(null);
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    supported,
    lastError,
    startListening,
    stopListening,
    resetTranscript,
    interimTranscript,
  };
};
