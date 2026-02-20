import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import type { AIConfig } from '../types/chat';
import './VoiceMode.css';

interface VoiceModeProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  config: AIConfig;
  onClose: () => void;
  lastAssistantMessage?: string;
}

export function VoiceMode({ onSend, isLoading, onClose, lastAssistantMessage }: VoiceModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const lastProcessedMessageRef = useRef<string>('');
  const isProcessingRef = useRef(false);
  const hasSpokeRef = useRef(false); // Track if TTS actually started speaking
  const speakingStartTimeRef = useRef<number>(0); // Track when TTS started
  const timestampRef = useRef<{ [key: string]: number }>({}); // Track timestamps

  const logWithTime = (message: string, key?: string) => {
    const now = Date.now();
    if (key) {
      const prev = timestampRef.current[key];
      if (prev) {
        const diff = ((now - prev) / 1000).toFixed(2);
        console.log(`[${new Date().toLocaleTimeString('th-TH')}] ${message} (${diff}s)`);
      } else {
        console.log(`[${new Date().toLocaleTimeString('th-TH')}] ${message}`);
      }
      timestampRef.current[key] = now;
    } else {
      console.log(`[${new Date().toLocaleTimeString('th-TH')}] ${message}`);
    }
  };
  
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: 'th-TH'
  });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported
  } = useTextToSpeech({
    language: 'th-TH',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });

  // Handle transcript completion - send to AI
  useEffect(() => {
    if (transcript && !isListening && conversationState === 'listening' && !isProcessingRef.current) {
      logWithTime(`User finished speaking: ${transcript}`, 'userSpoke');
      isProcessingRef.current = true;
      setConversationState('processing');
      onSend(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, conversationState, onSend, resetTranscript]);

  // Handle AI response - speak it
  useEffect(() => {
    if (
      lastAssistantMessage && 
      !isLoading && 
      conversationState === 'processing' && 
      isActive &&
      lastAssistantMessage !== lastProcessedMessageRef.current
    ) {
      logWithTime(`AI finished, speaking: ${lastAssistantMessage.substring(0, 50)}`, 'aiResponded');
      lastProcessedMessageRef.current = lastAssistantMessage;
      hasSpokeRef.current = false; // Reset flag
      setConversationState('speaking');
      speak(lastAssistantMessage);
    }
  }, [lastAssistantMessage, isLoading, conversationState, speak, isActive]);

  // Track when TTS actually starts speaking
  useEffect(() => {
    if (isSpeaking && conversationState === 'speaking' && !hasSpokeRef.current) {
      logWithTime('TTS actually started speaking', 'ttsStarted');
      hasSpokeRef.current = true;
      speakingStartTimeRef.current = Date.now();
    }
  }, [isSpeaking, conversationState]);

  // Handle speaking completion - auto-listen again
  useEffect(() => {
    // Only proceed if we actually spoke (not just state change)
    if (!isSpeaking && conversationState === 'speaking' && isActive && hasSpokeRef.current) {
      const speakingDuration = Date.now() - speakingStartTimeRef.current;
      logWithTime(`TTS stopped (duration: ${(speakingDuration / 1000).toFixed(2)}s)`, 'ttsStopped');
      
      // Only proceed if TTS actually spoke for at least 500ms (prevent false stops)
      if (speakingDuration < 500) {
        logWithTime('⚠️ TTS stopped too quickly, ignoring...');
        return;
      }
      
      logWithTime('Finished speaking, starting to listen again', 'ttsFinished');
      
      const timeoutId = setTimeout(() => {
        if (isActive && conversationState === 'speaking') {
          logWithTime('Actually starting to listen now', 'listeningRestarted');
          isProcessingRef.current = false;
          hasSpokeRef.current = false;
          speakingStartTimeRef.current = 0;
          setConversationState('listening');
          startListening();
        } else {
          logWithTime('Cancelled - state changed or inactive');
        }
      }, 800);

      // Cleanup to prevent double execution
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isSpeaking, conversationState, startListening, isActive]);

  const handleToggleVoice = useCallback(() => {
    if (isActive) {
      logWithTime('Stopping voice mode');
      setIsActive(false);
      setConversationState('idle');
      stopListening();
      stopSpeaking();
      isProcessingRef.current = false;
      hasSpokeRef.current = false;
      speakingStartTimeRef.current = 0;
      lastProcessedMessageRef.current = '';
      timestampRef.current = {};
    } else {
      logWithTime('Starting voice mode');
      setIsActive(true);
      setConversationState('listening');
      isProcessingRef.current = false;
      hasSpokeRef.current = false;
      speakingStartTimeRef.current = 0;
      lastProcessedMessageRef.current = '';
      timestampRef.current = {};
      startListening();
    }
  }, [isActive, startListening, stopListening, stopSpeaking]);

  const handleStopSpeaking = useCallback(() => {
    logWithTime('User stopped speaking manually');
    stopSpeaking();
    if (isActive) {
      isProcessingRef.current = false;
      hasSpokeRef.current = false;
      speakingStartTimeRef.current = 0;
      setConversationState('listening');
      startListening();
    }
  }, [stopSpeaking, startListening, isActive]);

  const handleClose = useCallback(() => {
    logWithTime('Closing voice mode');
    setIsActive(false);
    setConversationState('idle');
    stopListening();
    stopSpeaking();
    isProcessingRef.current = false;
    hasSpokeRef.current = false;
    speakingStartTimeRef.current = 0;
    lastProcessedMessageRef.current = '';
    timestampRef.current = {};
    onClose();
  }, [stopListening, stopSpeaking, onClose]);

  const getStateText = () => {
    switch (conversationState) {
      case 'listening':
        return transcript || 'กำลังฟัง...';
      case 'processing':
        return 'กำลังประมวลผล...';
      case 'speaking':
        return 'กำลังพูด...';
      default:
        return 'พร้อมเริ่มสนทนา';
    }
  };

  const getStateIcon = () => {
    switch (conversationState) {
      case 'listening':
        return <Mic size={48} />;
      case 'processing':
        return <div className="voice-processing-spinner" />;
      case 'speaking':
        return <Volume2 size={48} />;
      default:
        return <MicOff size={48} />;
    }
  };

  return (
    <div className="voice-mode-overlay">
      <div className="voice-mode-container">
        <button className="voice-mode-close" onClick={handleClose} aria-label="ปิดโหมดเสียง">
          <X size={24} />
        </button>

        <div className="voice-mode-content">
          <div className={`voice-mode-icon ${conversationState}`}>
            {getStateIcon()}
          </div>

          <div className="voice-mode-state">
            <h2>{getStateText()}</h2>
            {conversationState === 'listening' && transcript && (
              <p className="voice-transcript">{transcript}</p>
            )}
            {conversationState === 'speaking' && lastAssistantMessage && (
              <p className="voice-response">{lastAssistantMessage}</p>
            )}
          </div>

          <div className="voice-mode-controls">
            {conversationState === 'speaking' && (
              <button
                className="voice-control-btn stop-speaking"
                onClick={handleStopSpeaking}
                aria-label="หยุดพูด"
              >
                <VolumeX size={24} />
                <span>หยุดพูด</span>
              </button>
            )}

            <button
              className={`voice-control-btn toggle-voice ${isActive ? 'active' : ''}`}
              onClick={handleToggleVoice}
              disabled={conversationState === 'processing'}
              aria-label={isActive ? 'หยุดโหมดเสียง' : 'เริ่มโหมดเสียง'}
            >
              {isActive ? <MicOff size={24} /> : <Mic size={24} />}
              <span>{isActive ? 'หยุดสนทนา' : 'เริ่มสนทนา'}</span>
            </button>
          </div>

          {speechError && (
            <p className="voice-error">{speechError}</p>
          )}

          {!ttsSupported && (
            <p className="voice-warning">เบราว์เซอร์ไม่รองรับการพูด</p>
          )}
        </div>

        <div className="voice-mode-info">
          <p>• พูดเพื่อส่งข้อความ</p>
          <p>• AI จะตอบกลับด้วยเสียง</p>
          <p>• สนทนาต่อเนื่องอัตโนมัติ</p>
        </div>
      </div>
    </div>
  );
}
