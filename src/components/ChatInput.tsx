import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Loader2, Lock } from 'lucide-react';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  isSharedView?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled, isSharedView }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled && !isSharedView) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

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
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="พิมพ์ข้อความของคุณ..."
          disabled={isLoading || disabled}
          rows={1}
          className="chat-textarea"
        />
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
      <p className="input-hint">กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่</p>
    </div>
  );
}
