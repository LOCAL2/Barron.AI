import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, X, Pause, Play } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import './VoiceMode.css';

interface VoiceModeProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onClose: () => void;
  lastAssistantMessage?: string;
}

export function VoiceMode({ onSend, isLoading, onClose, lastAssistantMessage }: VoiceModeProps) {
  const [conversationState, setConversationState] = useState<'listening' | 'processing' | 'speaking'>('listening');
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const lastProcessedMessageRef = useRef<string>('');
  const isProcessingRef = useRef(false);
  const hasSpokeRef = useRef(false);
  const speakingStartTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
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
    pause: pauseSpeaking,
    resume: resumeSpeaking,
    isSupported: ttsSupported
  } = useTextToSpeech({
    language: 'th-TH',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });

  // Initialize audio visualization
  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // Start visualization
        visualize();
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio visualization
  const visualize = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const draw = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Auto-start listening when component mounts
  useEffect(() => {
    startListening();
  }, []);

  // Handle transcript completion - send to AI
  useEffect(() => {
    if (transcript && !isListening && conversationState === 'listening' && !isProcessingRef.current) {
      console.log('User finished speaking:', transcript);
      isProcessingRef.current = true;
      setUserText(transcript);
      setConversationState('processing');
      onSend(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, conversationState, onSend, resetTranscript]);

  // Update user text while speaking
  useEffect(() => {
    if (transcript && conversationState === 'listening') {
      setUserText(transcript);
    }
  }, [transcript, conversationState]);

  // Handle AI response - speak it
  useEffect(() => {
    if (
      lastAssistantMessage && 
      !isLoading && 
      conversationState === 'processing' &&
      lastAssistantMessage !== lastProcessedMessageRef.current
    ) {
      console.log('AI finished, speaking:', lastAssistantMessage.substring(0, 50));
      lastProcessedMessageRef.current = lastAssistantMessage;
      setAiText(lastAssistantMessage);
      hasSpokeRef.current = false;
      
      // หยุดฟังก่อนที่ AI จะพูด
      stopListening();
      
      setConversationState('speaking');
      speak(lastAssistantMessage);
    }
  }, [lastAssistantMessage, isLoading, conversationState, speak, stopListening]);

  // Track when TTS actually starts speaking
  useEffect(() => {
    if (isSpeaking && conversationState === 'speaking' && !hasSpokeRef.current) {
      console.log('TTS actually started speaking');
      hasSpokeRef.current = true;
      speakingStartTimeRef.current = Date.now();
    }
  }, [isSpeaking, conversationState]);

  // Handle speaking completion - auto-listen again
  useEffect(() => {
    if (!isSpeaking && conversationState === 'speaking' && hasSpokeRef.current) {
      const speakingDuration = Date.now() - speakingStartTimeRef.current;
      console.log(`TTS stopped (duration: ${(speakingDuration / 1000).toFixed(2)}s)`);
      
      if (speakingDuration < 500) {
        console.log('⚠️ TTS stopped too quickly, ignoring...');
        return;
      }
      
      console.log('Finished speaking, will start listening in 1 second');
      
      // รอให้แน่ใจว่า AI พูดจบจริงๆ แล้วค่อยเริ่มฟังใหม่
      setTimeout(() => {
        // ตรวจสอบอีกครั้งว่ายังอยู่ใน speaking state และไม่ได้พูดอยู่
        if (conversationState === 'speaking' && !isSpeaking) {
          console.log('Actually starting to listen now');
          isProcessingRef.current = false;
          hasSpokeRef.current = false;
          speakingStartTimeRef.current = 0;
          setUserText('');
          setConversationState('listening');
          startListening();
        }
      }, 1000);
    }
  }, [isSpeaking, conversationState, startListening]);

  // Handle pause/resume
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resumeSpeaking();
      setIsPaused(false);
    } else {
      pauseSpeaking();
      setIsPaused(true);
    }
  }, [isPaused, pauseSpeaking, resumeSpeaking]);

  // Handle interrupt - user wants to speak while AI is speaking
  const handleInterrupt = useCallback(() => {
    if (conversationState === 'speaking') {
      console.log('User interrupted AI');
      stopSpeaking();
      isProcessingRef.current = false;
      hasSpokeRef.current = false;
      setUserText('');
      setConversationState('listening');
      startListening();
    }
  }, [conversationState, stopSpeaking, startListening]);

  // Handle close - stop everything immediately
  const handleClose = useCallback(() => {
    console.log('Closing voice mode - stopping all audio');
    stopListening();
    stopSpeaking();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    onClose();
  }, [stopListening, stopSpeaking, onClose]);

  const getStateText = () => {
    switch (conversationState) {
      case 'listening':
        return 'กำลังฟัง...';
      case 'processing':
        return 'กำลังคิด...';
      case 'speaking':
        return 'กำลังตอบ...';
    }
  };

  const getStateColor = () => {
    switch (conversationState) {
      case 'listening':
        return '#3b82f6'; // blue
      case 'processing':
        return '#f59e0b'; // amber
      case 'speaking':
        return '#10b981'; // green
    }
  };

  return (
    <div className="voice-mode-overlay">
      <div className="voice-mode-container">
        <button className="voice-mode-close" onClick={handleClose} aria-label="ปิดโหมดเสียง">
          <X size={24} />
        </button>

        <div className="voice-mode-content">
          {/* Status indicator */}
          <div className="voice-status">
            <span className="voice-status-text">{getStateText()}</span>
          </div>

          {/* Audio waveform visualization */}
          <div className="voice-waveform">
            {[...Array(40)].map((_, i) => {
              const height = conversationState === 'listening' 
                ? Math.max(0.1, audioLevel + Math.random() * 0.3)
                : conversationState === 'speaking'
                ? Math.max(0.1, 0.5 + Math.sin(Date.now() / 100 + i) * 0.4)
                : 0.1;
              
              return (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    height: `${height * 100}%`,
                    backgroundColor: getStateColor(),
                    opacity: conversationState === 'processing' ? 0.3 : 1,
                  }}
                />
              );
            })}
          </div>

          {/* Conversation text */}
          <div className="voice-conversation">
            {userText && (
              <div className="voice-message user-message">
                <div className="message-label">คุณ:</div>
                <div className="message-text">{userText}</div>
              </div>
            )}
            
            {aiText && (
              <div className="voice-message ai-message">
                <div className="message-label">AI:</div>
                <div className="message-text">{aiText}</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="voice-controls">
            {conversationState === 'speaking' && (
              <>
                <button
                  className="voice-control-btn interrupt-btn"
                  onClick={handleInterrupt}
                  aria-label="พูดแทรก"
                >
                  <Mic size={24} />
                  <span>พูดแทรก</span>
                </button>

                <button
                  className="voice-control-btn pause-btn"
                  onClick={handleTogglePause}
                  aria-label={isPaused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}
                >
                  {isPaused ? <Play size={24} /> : <Pause size={24} />}
                  <span>{isPaused ? 'เล่นต่อ' : 'พัก'}</span>
                </button>
              </>
            )}

            {conversationState === 'listening' && (
              <button
                className="voice-control-btn listening-btn"
                disabled
                aria-label="กำลังฟัง"
              >
                <Mic size={24} className="pulse-icon" />
                <span>กำลังฟัง...</span>
              </button>
            )}

            {conversationState === 'processing' && (
              <button
                className="voice-control-btn processing-btn"
                disabled
                aria-label="กำลังประมวลผล"
              >
                <div className="spinner-icon" />
                <span>กำลังคิด...</span>
              </button>
            )}
          </div>

          {speechError && (
            <p className="voice-error">{speechError}</p>
          )}

          {!ttsSupported && (
            <p className="voice-warning">เบราว์เซอร์ไม่รองรับการพูด</p>
          )}
        </div>

        <div className="voice-mode-info">
          <p>• พูดเพื่อสนทนากับ AI</p>
          <p>• สามารถพูดแทรกได้ตลอดเวลา</p>
          <p>• กดปิดเพื่อออกจากโหมดเสียง</p>
        </div>
      </div>
    </div>
  );
}
