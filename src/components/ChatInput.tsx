import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled) {
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
            <Loader2 className="spinner" size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      <p className="input-hint">กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่</p>
    </div>
  );
}
