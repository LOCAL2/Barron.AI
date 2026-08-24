import { memo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, AlertCircle, ChevronDown, BrainCircuit, Search } from 'lucide-react';
import { getUserAvatar } from '../services/ai';
import { generateImage } from '../services/imageGeneration';
import { ChartDiagram } from './ChartDiagram';
import { ImageGenerator } from './ImageGenerator';
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

  // Function to render content with Chart and Image support
  const renderContent = (content: string) => {
    // Split content by chart and image JSON blocks
    const parts = content.split(/(```(?:chart|image)\s*\n?[\s\S]*?\n?```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a chart
      const chartMatch = part.match(/```chart\s*\n?([\s\S]*?)\n?```/);
      
      if (chartMatch) {
        try {
          const jsonString = chartMatch[1].trim();
          const chartData = JSON.parse(jsonString);
          
          if (!chartData.type || !chartData.labels || !chartData.datasets) {
            throw new Error('Missing required fields');
          }
          
          return <ChartDiagram key={index} data={chartData} />;
        } catch (e) {
          console.error('Chart parsing error:', e, 'Raw data:', chartMatch[1]);
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
              <details style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                <summary style={{ cursor: 'pointer' }}>ดูรายละเอียด</summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {chartMatch[1]}
                </pre>
              </details>
            </div>
          );
        }
      }
      
      // Check if this part is an image
      const imageMatch = part.match(/```image\s*\n?([\s\S]*?)\n?```/);
      
      if (imageMatch) {
        return <ImageGenerator key={index} jsonData={imageMatch[1].trim()} />;
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
        <div className="ai-process-container">
          {/* --- ULTRA PREMIUM DEEP RESEARCH UI --- */}
          {message.isThinking && mode === 'pro' && (
            <div className="deep-research-live">
              <div className="dr-header">
                <div className="dr-orb">
                  <div className="dr-orb-inner"></div>
                  <div className="dr-orb-ring"></div>
                </div>
                <div className="dr-title">
                  <span className="dr-title-text">Deep Researching</span>
                  <span className="dr-dots">...</span>
                </div>
              </div>
              {message.thinkingContent && (
                <div className="dr-content-window">
                  <div className="dr-scanner"></div>
                  <div className="dr-content-text">
                    {message.thinkingContent}
                  </div>
                </div>
              )}
            </div>
          )}

          {!message.isThinking && !message.isLoading && message.thinkingContent && mode === 'pro' && (
            <div className={`dr-completed-container ${showThinking ? 'expanded' : ''}`}>
              <button className="dr-toggle-btn" onClick={() => setShowThinking(!showThinking)}>
                <div className="dr-toggle-left">
                  <div className="dr-orb-static"></div>
                  <span className="dr-toggle-title">Deep Research Complete</span>
                </div>
                <ChevronDown size={16} className="dr-chevron" />
              </button>
              
              {showThinking && (
                <div className="dr-completed-content">
                  <div className="dr-content-text">
                    {searchQuery ? highlightText(message.thinkingContent, searchQuery) : message.thinkingContent}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- MINIMALIST AI THINKING UI (NORMAL MODE) --- */}
          {message.isThinking && mode !== 'pro' && (
            <div className="ai-process-live">
              <div className="ai-process-header pulsing">
                <BrainCircuit size={14} className="pulse" />
                <span>Analyzing...</span>
              </div>
              {message.thinkingContent && (
                <div className="ai-process-content" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message.thinkingContent}
                </div>
              )}
            </div>
          )}

          {!message.isThinking && !message.isLoading && message.thinkingContent && mode !== 'pro' && (
            <div className={`ai-process-completed ${showThinking ? 'expanded' : ''}`}>
              <button className="ai-process-toggle" onClick={() => setShowThinking(!showThinking)}>
                <div className="ai-process-toggle-left">
                  <BrainCircuit size={14} />
                  <span>Thought Process</span>
                </div>
                <ChevronDown size={14} className="ai-process-chevron" />
              </button>
              
              {showThinking && (
                <div className="ai-process-content">
                  {searchQuery ? (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {highlightText(message.thinkingContent, searchQuery)}
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {message.thinkingContent}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
          ) : message.isError ? (
            <div className="message-error">
              <AlertCircle size={20} className="error-icon" />
              <div className="error-content">
                <p>ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ หรือเซิร์ฟเวอร์ไม่ตอบสนอง</p>
                <p className="error-subtext">กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ</p>
              </div>
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
