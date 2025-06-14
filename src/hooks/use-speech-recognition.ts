
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
  const forceKeepAlive = useRef(false); // If true, keep restarting recognizer

  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const handleResult = useCallback((event: any) => {
    let finalTranscript = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const tr = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += tr;
      } else {
        interim += tr;
      }
    }
    if (finalTranscript) {
      setTranscript(prev => prev + finalTranscript);
    }
    setInterimTranscript(interim);
  }, []);

  const startListening = useCallback(() => {
    if (!supported) return;

    setLastError(null);
    setInterimTranscript('');
    setTranscript('');
    forceKeepAlive.current = true;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setLastError(null);
      setInterimTranscript('');
    };

    recognition.onresult = handleResult;

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setLastError(event.error || 'Speech recognition error');
      // Optionally, try to restart on network/no-speech as well
      if (forceKeepAlive.current && (event.error === 'no-speech' || event.error === 'network')) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      // If still supposed to be listening, restart
      if (forceKeepAlive.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setLastError('Unable to start recognition');
    }
  }, [supported, handleResult]);

  const stopListening = useCallback(() => {
    forceKeepAlive.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
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
