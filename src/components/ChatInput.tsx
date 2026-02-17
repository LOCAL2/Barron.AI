import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Loader2, Lock, Mic, MicOff, ChevronDown } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { AIConfig } from '../types/chat';
import { AVAILABLE_MODES } from '../types/chat';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  isSharedView?: boolean;
  config: AIConfig;
  onConfigChange: (config: Partial<AIConfig>) => void;
}

export function ChatInput({ onSend, isLoading, disabled, isSharedView, config, onConfigChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    transcript,
    isListening,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: 'th-TH'
  });

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled && !isSharedView) {
      onSend(input);
      setInput('');
      resetTranscript();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInput('');
      startListening();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentMode = AVAILABLE_MODES.find(m => m.id === config.mode);

  // Shared view - show locked input
  if (isSharedView) {
    return (
      <div className="chat-input-container disabled">
        <div className="chat-input-wrapper disabled">
          <div className="shared-input-overlay">
            <div className="shared-input-message">
              <Lock size={18} />
              <span>นี่คือแชทที่แชร์ - ไม่สามารถส่งข้อความได้</span>
            </div>
          </div>
          <textarea
            className="chat-textarea"
            placeholder="พิมพ์ข้อความของคุณ..."
            disabled
            rows={1}
          />
          <button className="send-button" disabled>
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        {speechSupported && (
          <button
            onClick={handleMicClick}
            disabled={isLoading || disabled}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            aria-label={isListening ? "หยุดฟัง" : "เริ่มฟัง"}
            title={isListening ? "หยุดฟัง" : "พูดเพื่อพิมพ์ข้อความ"}
          >
            {isListening ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "กำลังฟัง..." : "พิมพ์ข้อความของคุณ..."}
          disabled={isLoading || disabled}
          rows={1}
          className={`chat-textarea ${isListening ? 'listening' : ''}`}
        />
        
        {/* Mode Selector */}
        <div className="input-model-selector" ref={dropdownRef}>
          <button
            className="input-model-btn"
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            disabled={isLoading || disabled}
            title="เลือกโหมด"
          >
            <span className="input-model-name">
              {currentMode?.name || 'Pro'}
            </span>
            <ChevronDown size={14} className={`input-chevron ${showModeDropdown ? 'open' : ''}`} />
          </button>
          
          {showModeDropdown && (
            <div className="input-model-dropdown">
              {AVAILABLE_MODES.map(mode => (
                <button
                  key={mode.id}
                  className={`input-model-item ${config.mode === mode.id ? 'active' : ''}`}
                  onClick={() => {
                    onConfigChange({ mode: mode.id as 'fast' | 'thinking' | 'pro' });
                    setShowModeDropdown(false);
                  }}
                >
                  <div className="input-model-info">
                    <span className="input-model-display-name">
                      {mode.name}
                    </span>
                    <span className="input-model-desc">{mode.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || disabled}
          className="send-button"
          aria-label="ส่งข้อความ"
        >
          {isLoading ? (
            <Loader2 className="spinner" size={18} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      {speechError && (
        <p className="speech-error">{speechError}</p>
      )}
      {isListening && (
        <p className="listening-indicator">กำลังฟังเสียง กรุณาพูดข้อความของคุณ</p>
      )}
      <p className="input-hint">
        กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่
        {speechSupported && ", หรือคลิกไมค์เพื่อพูด"}
      </p>
    </div>
  );
}
