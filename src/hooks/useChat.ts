import { useState, useCallback, useEffect } from 'react';
import type { Message, Chat, AIConfig } from '../types/chat';
import { DEFAULT_CONFIG } from '../types/chat';
import { aiService } from '../services/ai';

const STORAGE_KEY = 'barron-ai-chats';
const CONFIG_KEY = 'barron-ai-config';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createNewChat = (): Chat => ({
  id: generateId(),
  title: 'แชทใหม่',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const loadChatsFromStorage = (): { chats: Chat[]; activeChatId: string } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const chats = data.chats.map((chat: Chat) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      if (chats.length > 0) {
        // ตรวจสอบว่า activeChatId ยังมีอยู่ใน chats หรือไม่
        const activeExists = chats.some((c: Chat) => c.id === data.activeChatId);
        const activeChatId = activeExists ? data.activeChatId : chats[0].id;
        return { chats, activeChatId };
      }
    }
  } catch {
    // Silent
  }
  const newChat = createNewChat();
  return { chats: [newChat], activeChatId: newChat.id };
};

const loadConfigFromStorage = (): AIConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Silent
  }
  return DEFAULT_CONFIG;
};

export function useChat() {
  const [initialData] = useState(() => loadChatsFromStorage());
  const [chats, setChats] = useState<Chat[]>(initialData.chats);
  const [activeChatId, setActiveChatId] = useState<string>(initialData.activeChatId);
  const [loadingChats, setLoadingChats] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AIConfig>(() => loadConfigFromStorage());

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats, activeChatId }));
  }, [chats, activeChatId]);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];
  const isLoading = loadingChats.has(activeChatId);

  // ถ้า activeChatId ไม่ตรงกับ chat ใดๆ ให้เลือก chat แรก
  useEffect(() => {
    if (chats.length > 0 && !chats.find(c => c.id === activeChatId)) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  const updateChatMessages = useCallback((chatId: string, updater: (msgs: Message[]) => Message[]) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: updater(chat.messages), updatedAt: new Date() }
          : chat
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const chatId = activeChatId;
      if (!content.trim() || loadingChats.has(chatId)) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      };

      const currentChat = chats.find(c => c.id === chatId);
      const currentMessages = currentChat?.messages || [];

      if (currentMessages.length === 0) {
        const title = content.trim().slice(0, 30) + (content.length > 30 ? '...' : '');
        setChats(prev => prev.map(chat => (chat.id === chatId ? { ...chat, title } : chat)));
      }

      updateChatMessages(chatId, msgs => [...msgs, userMessage, assistantMessage]);
      setLoadingChats(prev => new Set(prev).add(chatId));
      setError(null);

      try {
        const history = currentMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          parts: [{ text: msg.content }],
        }));

        await aiService.streamMessage(content.trim(), history, config, text => {
          updateChatMessages(chatId, msgs =>
            msgs.map(msg =>
              msg.id === assistantMessage.id ? { ...msg, content: text, isLoading: false } : msg
            )
          );
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        setError(errorMessage);
        updateChatMessages(chatId, msgs =>
          msgs.map(msg =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
                  isLoading: false,
                }
              : msg
          )
        );
      } finally {
        setLoadingChats(prev => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
      }
    },
    [chats, activeChatId, loadingChats, config, updateChatMessages]
  );

  const newChat = useCallback(() => {
    const chat = createNewChat();
    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);
    setError(null);
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setError(null);
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      setChats(prev => {
        const filtered = prev.filter(c => c.id !== chatId);
        if (filtered.length === 0) {
          const newC = createNewChat();
          setActiveChatId(newC.id);
          return [newC];
        }
        if (chatId === activeChatId) {
          setActiveChatId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeChatId]
  );

  const clearChat = useCallback(() => {
    updateChatMessages(activeChatId, () => []);
    setChats(prev =>
      prev.map(chat => (chat.id === activeChatId ? { ...chat, title: 'แชทใหม่' } : chat))
    );
    setError(null);
  }, [activeChatId, updateChatMessages]);

  const updateConfig = useCallback((newConfig: Partial<AIConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
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
  };
}
