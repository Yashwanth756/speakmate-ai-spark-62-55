
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

  // Only reset transcript/interimTranscript on explicit reset or new question!
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

  const setupRecognition = useCallback(() => {
    if (!supported) return null;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Ensure Indian English everywhere

    recognition.onstart = () => {
      setIsListening(true);
      setLastError(null);
      // Don't reset transcript/interimTranscript here!
    };

    recognition.onresult = handleResult;

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setLastError(event.error || 'Speech recognition error');
      // Try to restart on network/no-speech/disconnect unless user stopped
      if (forceKeepAlive.current && (event.error === 'no-speech' || event.error === 'network' || event.error === 'audio-capture')) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (forceKeepAlive.current) {
        // Don't reset transcript!
        try {
          recognition.start();
          setIsListening(true);
        } catch {}
      }
    };

    return recognition;
  }, [supported, handleResult]);

  const startListening = useCallback(() => {
    if (!supported) return;
    setLastError(null);
    forceKeepAlive.current = true;

    // Only instantiate recognition instance ONCE per session:
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    try {
      recognitionRef.current && recognitionRef.current.start();
    } catch (e) {
      setLastError('Unable to start recognition');
    }
  }, [supported, setupRecognition]);

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
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    forceKeepAlive.current = false;
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
