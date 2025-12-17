import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Trash2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Brain,
  Code,
  Lightbulb,
  X,
  Menu,
  Search,
  Square,
  RefreshCw,
  Share2,
  ArrowLeft,
  Settings,
  Briefcase,
  Coffee,
  Moon,
  Sun,
  Zap,
  BookOpen,
  MessageCircle,
  Palette,
  Music,
  Heart,
  Globe,
  Calculator,
  FileText,
  Dumbbell,
  Plane,
  ShoppingCart,
  Gamepad2,
  GraduationCap,
  Utensils,
  Car,
  Home,
  Smile,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
import { Toast } from './Toast';
import { WelcomeModal } from './WelcomeModal';
import { SettingsModal } from './SettingsModal';
import { useChat } from '../hooks/useChat';
import { AVAILABLE_MODELS } from '../types/chat';
import { getUserName, setUserName } from '../services/ai';
import './ChatContainer.css';

// Dynamic suggestions based on time and context
const ALL_SUGGESTIONS = [
  // Morning (6-12)
  { text: 'วางแผนงานวันนี้ให้หน่อย', icon: Briefcase, timeRange: [6, 12] },
  { text: 'แนะนำอาหารเช้าที่ดีต่อสุขภาพ', icon: Coffee, timeRange: [6, 12] },
  { text: 'สรุปข่าวเทคโนโลยีวันนี้', icon: Globe, timeRange: [6, 12] },
  { text: 'ช่วยเขียน To-do list', icon: FileText, timeRange: [6, 12] },
  { text: 'แนะนำท่าออกกำลังกายตอนเช้า', icon: Dumbbell, timeRange: [6, 12] },
  { text: 'ช่วยเตรียมตัวสัมภาษณ์งาน', icon: Users, timeRange: [6, 12] },

  // Afternoon (12-18)
  { text: 'ช่วยเขียนโค้ด Python ให้หน่อย', icon: Code, timeRange: [12, 18] },
  { text: 'อธิบาย React Hooks ให้ฟังหน่อย', icon: Brain, timeRange: [12, 18] },
  { text: 'แนะนำไอเดียโปรเจคให้หน่อย', icon: Lightbulb, timeRange: [12, 18] },
  { text: 'ช่วยแก้ปัญหา Bug ในโค้ด', icon: Zap, timeRange: [12, 18] },
  { text: 'สอนเรื่อง Database ให้หน่อย', icon: GraduationCap, timeRange: [12, 18] },
  { text: 'ช่วยวางแผนการเงิน', icon: Wallet, timeRange: [12, 18] },

  // Evening (18-22)
  { text: 'แนะนำหนังสือน่าอ่าน', icon: BookOpen, timeRange: [18, 22] },
  { text: 'แนะนำเพลงฟังผ่อนคลาย', icon: Music, timeRange: [18, 22] },
  { text: 'สอนทำอาหารง่ายๆ', icon: Utensils, timeRange: [18, 22] },
  { text: 'แนะนำวิธีพักผ่อนหลังเลิกงาน', icon: Coffee, timeRange: [18, 22] },
  { text: 'แนะนำเกมสนุกๆ เล่นคลายเครียด', icon: Gamepad2, timeRange: [18, 22] },
  { text: 'ช่วยวางแผนท่องเที่ยว', icon: Plane, timeRange: [18, 22] },

  // Night (22-6)
  { text: 'เล่านิทานก่อนนอนให้ฟัง', icon: Moon, timeRange: [22, 6] },
  { text: 'แนะนำวิธีนอนหลับให้ดีขึ้น', icon: Moon, timeRange: [22, 6] },
  { text: 'สรุปสิ่งที่เรียนรู้วันนี้', icon: BookOpen, timeRange: [22, 6] },
  { text: 'วางแผนสำหรับพรุ่งนี้', icon: Sun, timeRange: [22, 6] },
  { text: 'แนะนำวิธีทำสมาธิ', icon: Heart, timeRange: [22, 6] },
  { text: 'ช่วยเขียนไดอารี่', icon: FileText, timeRange: [22, 6] },

  // General (anytime)
  { text: 'สวัสดี แนะนำตัวหน่อย', icon: Sparkles, timeRange: [0, 24] },
  { text: 'ช่วยคิดเลขให้หน่อย', icon: Calculator, timeRange: [0, 24] },
  { text: 'แปลภาษาให้หน่อย', icon: Globe, timeRange: [0, 24] },
  { text: 'ช่วยเขียนข้อความ', icon: MessageCircle, timeRange: [0, 24] },
  { text: 'แนะนำสีสำหรับออกแบบ', icon: Palette, timeRange: [0, 24] },
  { text: 'ช่วยสรุปบทความ', icon: FileText, timeRange: [0, 24] },
  { text: 'แนะนำของใช้ในบ้าน', icon: Home, timeRange: [0, 24] },
  { text: 'ช่วยตั้งเป้าหมายชีวิต', icon: Target, timeRange: [0, 24] },
  { text: 'แนะนำวิธีเพิ่มรายได้', icon: TrendingUp, timeRange: [0, 24] },
  { text: 'ช่วยเลือกของขวัญ', icon: Heart, timeRange: [0, 24] },
  { text: 'แนะนำรถยนต์น่าซื้อ', icon: Car, timeRange: [0, 24] },
  { text: 'ช่วยทำรายการซื้อของ', icon: ShoppingCart, timeRange: [0, 24] },
  { text: 'แนะนำวิธีคิดบวก', icon: Smile, timeRange: [0, 24] },
  { text: 'สอนภาษาอังกฤษให้หน่อย', icon: GraduationCap, timeRange: [0, 24] },
];

// Get suggestions based on current time
const getSuggestions = () => {
  const hour = new Date().getHours();
  
  // Filter suggestions by time range
  const timeBased = ALL_SUGGESTIONS.filter(s => {
    const [start, end] = s.timeRange;
    if (start < end) {
      return hour >= start && hour < end;
    } else {
      // Handle overnight range (e.g., 22-6)
      return hour >= start || hour < end;
    }
  });
  
  // Shuffle and pick 4
  const shuffled = [...timeBased].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
};

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
    stopGenerating,
    regenerate,
    newChat,
    selectChat,
    deleteChat,
    clearChat,
    updateConfig,
    shareChat,
    getSharedChat,
    isSharedView,
  } = useChat();

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => !getUserName());
  const [userName, setUserNameState] = useState(() => getUserName());
  const [showSettings, setShowSettings] = useState(false);
  const [suggestions, setSuggestions] = useState(() => getSuggestions());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(newValue));
      } catch {
        // Silent
      }
      return newValue;
    });
  };

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    setUserNameState(name);
    setShowWelcome(false);
  };

  const handleNameChange = (name: string) => {
    setUserNameState(name);
  };

  // Refresh suggestions when chat is cleared or new chat
  useEffect(() => {
    if (messages.length === 0) {
      setSuggestions(getSuggestions());
    }
  }, [messages.length, activeChatId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get shared chat data if in shared view
  const sharedChat = isSharedView ? getSharedChat() : null;
  const displayMessages = isSharedView && sharedChat ? sharedChat.messages : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') {
          e.preventDefault();
          newChat();
        } else if (e.key === 'k') {
          e.preventDefault();
          setShowSearch(prev => !prev);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [newChat]);

  const handleCopy = useCallback(() => {
    setToast({ message: 'คัดลอกแล้ว', type: 'success' });
  }, []);

  const handleShare = useCallback(async () => {
    const url = shareChat();
    if (url) {
      // ใช้ Web Share API สำหรับมือถือ หรือ fallback เป็น clipboard
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: 'Barron AI Chat',
            text: 'ดูแชทที่แชร์',
            url: url,
          });
          setToast({ message: 'แชร์สำเร็จ', type: 'success' });
        } catch (err) {
          // User cancelled หรือ error - fallback to clipboard
          if ((err as Error).name !== 'AbortError') {
            await copyToClipboard(url);
          }
        }
      } else {
        await copyToClipboard(url);
      }
    } else {
      setToast({ message: 'ไม่สามารถแชร์ได้', type: 'error' });
    }
  }, [shareChat]);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback สำหรับ browser เก่า
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setToast({ message: 'คัดลอกลิงก์แชร์แล้ว', type: 'success' });
    } catch {
      setToast({ message: 'ไม่สามารถคัดลอกได้', type: 'error' });
    }
  };

  const handleBackToChat = () => {
    window.location.href = '/';
  };

  const filteredChats = searchQuery
    ? chats.filter(
        chat =>
          chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : chats;

  const currentModel = AVAILABLE_MODELS.find(m => m.id === config.model);
  const lastAssistantIndex = [...displayMessages].reverse().findIndex(m => m.role === 'assistant');
  const lastAssistantId =
    lastAssistantIndex !== -1
      ? displayMessages[displayMessages.length - 1 - lastAssistantIndex]?.id
      : null;

  // Shared view - readonly
  if (isSharedView) {
    return (
      <div className="app-layout">
        <div className="chat-container">
          <header className="chat-header shared-header">
            <div className="header-left">
              <button className="header-btn back-btn" onClick={handleBackToChat}>
                <ArrowLeft size={20} />
              </button>
              <div className="header-logo">
                <Sparkles size={22} />
              </div>
              <div className="header-info">
                <h1>{sharedChat?.title || 'แชทที่แชร์'}</h1>
                <span className="shared-badge">แชร์ (อ่านอย่างเดียว)</span>
              </div>
            </div>
          </header>

          <div className="chat-messages">
            {sharedChat ? (
              displayMessages.map(message => (
                <ChatMessage key={message.id} message={message} onCopy={handleCopy} />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Bot size={48} />
                </div>
                <h2>ไม่พบแชทที่แชร์</h2>
                <p className="empty-subtitle">ลิงก์อาจหมดอายุหรือไม่ถูกต้อง</p>
                <button className="back-home-btn" onClick={handleBackToChat}>
                  กลับหน้าหลัก
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {sharedChat && <ChatInput onSend={() => {}} isLoading={false} isSharedView={true} />}
        </div>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="app-layout">
      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}

      <ChatSidebar
        chats={filteredChats}
        activeChatId={activeChatId}
        loadingChats={loadingChats}
        onNewChat={newChat}
        onSelectChat={id => {
          selectChat(id);
          setShowSidebar(false);
        }}
        onDeleteChat={deleteChat}
        isOpen={showSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(prev => !prev)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <div className="chat-container">
        <header className="chat-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setShowSidebar(true)}>
              <Menu size={20} />
            </button>
            <div className="header-logo desktop-only">
              <Sparkles size={20} />
            </div>
            <div className="header-info">
              <h1 className="desktop-only">Barron AI</h1>
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
            <button
              className="header-btn desktop-only"
              onClick={() => setShowSearch(prev => !prev)}
              title="ค้นหา (Ctrl+K)"
            >
              <Search size={18} />
            </button>
            {messages.length > 0 && (
              <>
                <button onClick={handleShare} className="header-btn" title="แชร์แชท">
                  <Share2 size={18} />
                </button>
                <button onClick={clearChat} className="header-btn" title="ล้างแชท">
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button 
              onClick={() => setShowSettings(true)} 
              className="header-btn" 
              title="ตั้งค่า"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button className="error-retry" onClick={regenerate}>
              <RefreshCw size={14} />
              <span>ลองใหม่</span>
            </button>
            <button className="error-close" onClick={() => {}}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="chat-messages">
          {displayMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-hero">
                <div className="empty-icon">
                  <Bot size={48} />
                </div>
                <div className="empty-glow" />
              </div>
              <h2>สวัสดี{userName ? ` ${userName}` : ''} 👋</h2>
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
                  {suggestions.map(({ text, icon: Icon }) => (
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
            displayMessages.map(message => (
              <ChatMessage
                key={message.id}
                message={message}
                onCopy={handleCopy}
                onRegenerate={regenerate}
                isLastAssistant={message.id === lastAssistantId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {isLoading && (
          <div className="stop-generating">
            <button onClick={stopGenerating} className="stop-btn">
              <Square size={14} />
              <span>หยุดสร้าง</span>
            </button>
          </div>
        )}

        <ChatInput onSend={sendMessage} isLoading={isLoading} isSharedView={false} />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {showWelcome && !isSharedView && <WelcomeModal onComplete={handleWelcomeComplete} />}
      
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          onNameChange={handleNameChange}
        />
      )}
    </div>
  );
}
