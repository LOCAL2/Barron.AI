import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getUserAvatar } from '../services/ai';
import { ChartDiagram } from './ChartDiagram';
import type { Message } from '../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  isLastAssistant?: boolean;
  searchQuery?: string;
  mode?: string;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onCopy,
  onRegenerate,
  onFeedback,
  isLastAssistant,
  searchQuery,
  mode,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === 'user';
  const userAvatar = getUserAvatar();

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

  // Function to highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  // Function to render content with Chart support
  const renderContent = (content: string) => {
    // Split content by chart JSON blocks
    const parts = content.split(/(```chart\n[\s\S]*?\n```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a chart
      const chartMatch = part.match(/```chart\n([\s\S]*?)\n```/);
      
      if (chartMatch) {
        try {
          const chartData = JSON.parse(chartMatch[1]);
          return <ChartDiagram key={index} data={chartData} />;
        } catch (e) {
          return (
            <div key={index} style={{
              color: '#ef4444',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              margin: '16px 0'
            }}>
              ⚠️ ไม่สามารถแสดงกราฟได้: รูปแบบข้อมูลไม่ถูกต้อง
            </div>
          );
        }
      }
      
      // Regular markdown content
      if (part.trim()) {
        return searchQuery ? (
          <div key={index}>{highlightText(part, searchQuery)}</div>
        ) : (
          <ReactMarkdown key={index}>{part}</ReactMarkdown>
        );
      }
      
      return null;
    });
  };

  // Parse thinking content for Thinking mode
  // ไม่ต้องใช้แล้ว เพราะจัดการใน aiService แล้ว

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? (
          userAvatar ? (
            <img src={userAvatar} alt="User Avatar" className="avatar-img" />
          ) : (
            <User size={20} />
          )
        ) : (
          <Bot size={20} />
        )}
      </div>
      <div className="message-wrapper">
        {/* Thinking Section - แยกออกมานอกกรอบคำตอบ */}
        {message.isThinking && (
          <div className={`thinking-indicator ${mode === 'pro' ? 'research-mode' : ''}`}>
            <div className="thinking-header">
              <div className="thinking-icon">
                {mode === 'pro' ? (
                  <>
                    <div className="research-icon">•</div>
                    <div className="research-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="thinking-brain">•</div>
                    <div className="thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </>
                )}
              </div>
              <span className="thinking-label">
                {mode === 'pro' ? 'กำลังวิจัยและวิเคราะห์...' : 'กำลังคิด...'}
              </span>
            </div>
            <div className="thinking-content-live">
              {message.thinkingContent && (
                <ReactMarkdown>{message.thinkingContent}</ReactMarkdown>
              )}
            </div>
          </div>
        )}

        {/* Completed Thinking Section - แยกออกมานอกกรอบคำตอบ */}
        {!message.isThinking && !message.isLoading && message.thinkingContent && (
          <div className="thinking-section-completed">
            <button 
              className="thinking-toggle"
              onClick={() => setShowThinking(!showThinking)}
            >
              <div className="thinking-toggle-content">
                {mode === 'pro' ? (
                  <>
                    <span className="research-icon-small">•</span>
                    <span style={{ color: '#ffffff' }}>กระบวนการวิจัย</span>
                    <span className="research-badge">Pro Research</span>
                  </>
                ) : (
                  <>
                    <span className="thinking-icon-small">•</span>
                    <span style={{ color: '#ffffff' }}>กระบวนการคิด</span>
                    <span className="thinking-badge">Thinking</span>
                  </>
                )}
              </div>
              <span className={`thinking-chevron ${showThinking ? 'open' : ''}`}>▼</span>
            </button>
            {showThinking && (
              <div className="thinking-content-completed">
                {searchQuery ? (
                  <div>{highlightText(message.thinkingContent, searchQuery)}</div>
                ) : (
                  <ReactMarkdown>{message.thinkingContent}</ReactMarkdown>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Content - กรอบคำตอบจริง */}
        <div className={`message-content ${message.isThinking ? 'waiting-for-thinking' : ''}`}>
          {message.isLoading ? (
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : message.isThinking ? (
            <div className="waiting-indicator">
              <div className="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="waiting-text">
                {mode === 'pro' ? 'รอการวิจัยเสร็จสิ้น...' : 'รอการคิดเสร็จสิ้น...'}
              </span>
            </div>
          ) : (
            <div className="markdown-content">
              {renderContent(message.content)}
            </div>
          )}
          {!isUser && !message.isThinking && (
            <span className="message-time">
              {message.timestamp.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        {!isUser && !message.isLoading && (
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
      </div>
    </div>
  );
});
