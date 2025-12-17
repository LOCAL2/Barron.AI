import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Message } from '../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  isLastAssistant?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onCopy,
  onRegenerate,
  onFeedback,
  isLastAssistant,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    setFeedback(prev => (prev === type ? null : type));
    onFeedback?.(message.id, type);
  };

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="message-content">
        {message.isLoading ? (
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        ) : (
          <>
            <div className="markdown-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {!isUser && (
              <div className="message-actions">
                <button className="action-btn" onClick={handleCopy} title="คัดลอก">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  className={`action-btn ${feedback === 'like' ? 'active-like' : ''}`}
                  onClick={() => handleFeedback('like')}
                  title="ชอบ"
                >
                  <ThumbsUp size={14} />
                </button>
                <button
                  className={`action-btn ${feedback === 'dislike' ? 'active-dislike' : ''}`}
                  onClick={() => handleFeedback('dislike')}
                  title="ไม่ชอบ"
                >
                  <ThumbsDown size={14} />
                </button>
                {isLastAssistant && onRegenerate && (
                  <button className="action-btn" onClick={onRegenerate} title="สร้างใหม่">
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
        <span className="message-time">
          {message.timestamp.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
});
