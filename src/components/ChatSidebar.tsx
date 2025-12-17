import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import type { Chat } from '../types/chat';
import './ChatSidebar.css';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string;
  loadingChats: Set<string>;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatSidebar({
  chats,
  activeChatId,
  loadingChats,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  return (
    <aside className="chat-sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={18} />
        <span>แชทใหม่</span>
      </button>

      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            {loadingChats.has(chat.id) ? (
              <Loader2 size={16} className="loading-icon" />
            ) : (
              <MessageSquare size={16} />
            )}
            <span className="chat-title">{chat.title}</span>
            <button
              className="delete-chat-btn"
              onClick={e => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
