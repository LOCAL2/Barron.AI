import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Trash2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Zap,
  Brain,
  Code,
  Lightbulb,
  X,
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
import { useChat } from '../hooks/useChat';
import { AVAILABLE_MODELS } from '../types/chat';
import './ChatContainer.css';

const SUGGESTIONS = [
  { text: 'สวัสดี แนะนำตัวหน่อย', icon: Sparkles },
  { text: 'ช่วยเขียนโค้ด Python ให้หน่อย', icon: Code },
  { text: 'อธิบาย React Hooks ให้ฟังหน่อย', icon: Brain },
  { text: 'แนะนำไอเดียโปรเจคให้หน่อย', icon: Lightbulb },
];

const formatParams = (num: number) => num.toLocaleString('en-US');

export function ChatContainer() {
  const {
    chats,
    activeChatId,
    messages,
    isLoading,
    loadingChats,
    error,
    config,
    sendMessage,
    newChat,
    selectChat,
    deleteChat,
    clearChat,
    updateConfig,
  } = useChat();
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === config.model);

  return (
    <div className="app-layout">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        loadingChats={loadingChats}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
      />
      <div className="chat-container">
        <header className="chat-header">
          <div className="header-left">
            <div className="header-logo">
              <Sparkles size={22} />
            </div>
            <div className="header-info">
              <h1>Barron AI</h1>
              <div className="model-selector" ref={dropdownRef}>
                <button
                  className="model-selector-btn"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                >
                  <span className="status-dot" />
                  <span className="model-selector-name">{currentModel?.name}</span>
                  <ChevronDown size={14} className={`chevron ${showModelDropdown ? 'open' : ''}`} />
                </button>
                {showModelDropdown && (
                  <div className="model-dropdown">
                    <div className="model-dropdown-header">
                      <span>เลือกโมเดล</span>
                    </div>
                    {AVAILABLE_MODELS.map(model => (
                      <button
                        key={model.id}
                        className={`model-dropdown-item ${config.model === model.id ? 'active' : ''}`}
                        onClick={() => {
                          updateConfig({ model: model.id });
                          setShowModelDropdown(false);
                        }}
                      >
                        <div className="model-item-left">
                          <span className="model-name">{model.name}</span>
                          <span className="model-desc">{model.description}</span>
                        </div>
                        <div className="model-item-right">
                          <span className="model-params">{formatParams(model.params)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="header-actions">
            {messages.length > 0 && (
              <button onClick={clearChat} className="header-btn clear-button" title="ล้างแชท">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button className="error-close" onClick={() => {}}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-hero">
                <div className="empty-icon">
                  <Bot size={48} />
                </div>
                <div className="empty-glow" />
              </div>
              <h2>ยินดีต้อนรับสู่ Barron AI</h2>
              <p className="empty-subtitle">
                ผู้ช่วย AI อัจฉริยะที่พร้อมช่วยเหลือคุณในทุกเรื่อง
              </p>

              <div className="model-info-card">
                <div className="model-info-header">
                  <span>โมเดลที่ใช้งาน</span>
                </div>
                <div className="model-info-content">
                  <span className="model-info-name">{currentModel?.name}</span>
                  <div className="model-info-stats">
                    <span className="stat">
                      <strong>{currentModel ? formatParams(currentModel.params) : ''}</strong>
                      <span>Parameters</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="suggestions-section">
                <p className="suggestions-label">ลองถามอะไรสักอย่าง</p>
                <div className="suggestion-chips">
                  {SUGGESTIONS.map(({ text, icon: Icon }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className="suggestion-chip"
                    >
                      <Icon size={16} />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map(message => <ChatMessage key={message.id} message={message} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
