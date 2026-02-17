import { useState, useEffect, useRef, useCallback } from 'react';

// Speech Recognition API types
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    continuous = false,
    interimResults = true,
    language = 'th-TH'
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('เบราว์เซอร์ไม่รองรับการรู้จำเสียง');
      return;
    }

    if (isListening) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = 1; // เพิ่มเพื่อประสิทธิภาพ

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // ไม่แสดง error สำหรับ no-speech เพราะเป็นเรื่องปกติ
        if (event.error === 'no-speech') {
          setIsListening(false);
          return;
        }
        
        // แสดง error message ที่เป็นมิตรกับผู้ใช้
        let errorMessage = 'เกิดข้อผิดพลาดในการรู้จำเสียง';
        
        switch (event.error) {
          case 'network':
            errorMessage = 'ไม่สามารถเชื่อมต่อเครือข่ายได้';
            break;
          case 'not-allowed':
            errorMessage = 'กรุณาอนุญาตการใช้ไมโครโฟน';
            break;
          case 'service-not-allowed':
            errorMessage = 'บริการรู้จำเสียงไม่พร้อมใช้งาน';
            break;
          case 'bad-grammar':
            errorMessage = 'การตั้งค่าภาษาไม่ถูกต้อง';
            break;
          case 'language-not-supported':
            errorMessage = 'ภาษาไทยไม่รองรับในเบราว์เซอร์นี้';
            break;
          case 'audio-capture':
            errorMessage = 'ไม่สามารถเข้าถึงไมโครโฟนได้';
            break;
          default:
            errorMessage = `เกิดข้อผิดพลาด: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('ไม่สามารถเริ่มการรู้จำเสียงได้');
      setIsListening(false);
    }
  }, [isSupported, isListening, continuous, interimResults, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
}