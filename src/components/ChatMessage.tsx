import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Loader2 } from 'lucide-react';
import type { Message } from '../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (
          <User size={20} />
        ) : (
          <Bot size={20} />
        )}
      </div>
      <div className="message-content">
        {message.isLoading ? (
          <div className="loading-indicator">
            <Loader2 className="spinner" size={16} />
            <span>กำลังพิมพ์...</span>
          </div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <span className="message-time">
          {message.timestamp.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
});
