import { Plus, MessageSquare, Trash2, Loader2, Search, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import type { Chat } from '../types/chat';
import './ChatSidebar.css';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string;
  loadingChats: Set<string>;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({
  chats,
  activeChatId,
  loadingChats,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  return (
    <aside className={`chat-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <>
            <button className="new-chat-btn" onClick={onNewChat}>
              <Plus size={18} />
              <span>แชทใหม่</span>
            </button>
            <button className="search-toggle-btn" onClick={onToggleSearch}>
              {showSearch ? <X size={18} /> : <Search size={18} />}
            </button>
          </>
        )}
        {isCollapsed && (
          <button className="new-chat-btn collapsed-btn" onClick={onNewChat} title="แชทใหม่">
            <Plus size={18} />
          </button>
        )}
        <button 
          className="collapse-btn desktop-only" 
          onClick={onToggleCollapse}
          title={isCollapsed ? 'ขยาย Sidebar' : 'พับ Sidebar'}
        >
          {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {!isCollapsed && showSearch && (
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาแชท..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => onSearchChange('')}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="chat-list">
        {chats.length === 0 ? (
          !isCollapsed && <div className="no-results">ไม่พบแชท</div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
              title={isCollapsed ? chat.title : undefined}
            >
              {loadingChats.has(chat.id) ? (
                <Loader2 size={16} className="loading-icon" />
              ) : (
                <MessageSquare size={16} />
              )}
              {!isCollapsed && <span className="chat-title">{chat.title}</span>}
              {!isCollapsed && (
                <button
                  className="delete-chat-btn"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
