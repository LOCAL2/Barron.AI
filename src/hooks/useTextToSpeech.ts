import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export function useTextToSpeech(
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn {
  const {
    language = 'th-TH',
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      // Log Thai voices
      const thaiVoices = voices.filter(v => v.lang.startsWith('th'));
      console.log('Thai voices:', thaiVoices.map(v => `${v.name} (${v.lang})`));
      
      if (voices.length > 0) {
        voicesLoadedRef.current = true;
      }
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Text-to-Speech is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech first
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Small delay to ensure cancel completes
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Try to find and set a Thai voice
      const voices = window.speechSynthesis.getVoices();
      console.log('Total voices available:', voices.length);
      
      // Try to find Thai voice
      let selectedVoice = voices.find(v => v.lang === 'th-TH');
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('th'));
      }
      
      // If no Thai voice, try to transliterate or use English voice with English text
      let textToSpeak = text;
      if (!selectedVoice && voices.length > 0) {
        // No Thai voice available - use English voice
        selectedVoice = voices.find(v => v.lang.startsWith('en-US')) || voices[0];
        console.warn('⚠️ No Thai voice found, using:', selectedVoice.name);
        console.warn('⚠️ English voice cannot speak Thai text properly. Consider:');
        console.warn('   1. Install Thai language pack in Windows/Mac');
        console.warn('   2. Use Chrome with Google voices');
        console.warn('   3. Translate text to English first');
        
        // For demo: if text is Thai, add a note
        if (/[\u0E00-\u0E7F]/.test(text)) {
          console.warn('⚠️ Detected Thai text but no Thai voice available');
          // Optionally: translate or romanize here
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('✅ Using voice:', selectedVoice.name, selectedVoice.lang);
      } else {
        console.warn('⚠️ No voices available at all!');
      }

      utterance.text = textToSpeak;

      utterance.onstart = () => {
        console.log('🔊 TTS onstart event fired');
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        console.log('🔇 TTS onend event fired');
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event.error, event);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      console.log('📢 Calling speechSynthesis.speak() with text:', text.substring(0, 50));
      window.speechSynthesis.speak(utterance);
      
      // Check if it's actually speaking after a short delay
      setTimeout(() => {
        console.log('Speaking status:', window.speechSynthesis.speaking);
        console.log('Pending status:', window.speechSynthesis.pending);
      }, 200);
    }, 100);
  }, [isSupported, language, rate, pitch, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported
  };
}
