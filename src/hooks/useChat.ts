import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, Chat, AIConfig } from '../types/chat';
import { DEFAULT_CONFIG } from '../types/chat';
import { aiService } from '../services/ai';

const STORAGE_KEY = 'barron-ai-chats';
const CONFIG_KEY = 'barron-ai-config';

const generateId = () => Math.random().toString(36).substring(2, 8);

const getChatIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/c\/([a-z0-9]+)$/);
  return match ? match[1] : null;
};

const isSharedUrl = (): boolean => {
  return window.location.pathname.startsWith('/s/');
};

const getSharedChatIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/s\/([a-z0-9]+)$/);
  return match ? match[1] : null;
};

const SHARED_CHATS_KEY = 'barron-ai-shared';

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
    const urlChatId = getChatIdFromUrl();
    
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
        // ถ้ามี URL chat ID และ chat นั้นมีอยู่จริง ให้ไปที่ chat นั้น
        if (urlChatId && chats.some((c: Chat) => c.id === urlChatId)) {
          return { chats, activeChatId: urlChatId };
        }
        
        // ถ้าไม่มี URL chat ID (เปิดเว็บใหม่) ให้สร้าง chat ใหม่เปล่าๆ
        if (!urlChatId) {
          const newChat = createNewChat();
          return { chats: [newChat, ...chats], activeChatId: newChat.id };
        }
        
        // กรณีอื่นๆ ให้ไปที่ chat แรก
        return { chats, activeChatId: chats[0].id };
      }
    }
  } catch {
    // Silent
  }
  
  // ถ้าไม่มี chat เลย ให้สร้าง chat ใหม่
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats, activeChatId }));
  }, [chats, activeChatId]);

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    // ถ้าเป็น chat ใหม่ที่ยังไม่มีข้อความ ให้ไปที่ root path
    const currentChat = chats.find(c => c.id === activeChatId);
    if (currentChat && currentChat.messages.length === 0) {
      if (window.location.pathname !== '/' && !isSharedUrl()) {
        window.history.pushState({}, '', '/');
      }
    } else {
      // ถ้ามีข้อความแล้ว ให้ไปที่ URL ของ chat นั้น
      const newUrl = `/c/${activeChatId}`;
      if (window.location.pathname !== newUrl && !isSharedUrl()) {
        window.history.pushState({}, '', newUrl);
      }
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    const handlePopState = () => {
      const urlChatId = getChatIdFromUrl();
      if (urlChatId && chats.some(c => c.id === urlChatId)) {
        setActiveChatId(urlChatId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];
  const isLoading = loadingChats.has(activeChatId);

  useEffect(() => {
    if (chats.length > 0 && !chats.find(c => c.id === activeChatId)) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  const updateChatMessages = useCallback(
    (chatId: string, updater: (msgs: Message[]) => Message[]) => {
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: updater(chat.messages), updatedAt: new Date() }
            : chat
        )
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, regenerateId?: string) => {
      const chatId = activeChatId;
      if (loadingChats.has(chatId)) return;
      if (!regenerateId && !content.trim()) return;

      abortControllerRef.current = new AbortController();

      let currentMessages: Message[];
      let assistantMessageId: string;

      if (regenerateId) {
        assistantMessageId = generateId();
        setChats(prev =>
          prev.map(chat => {
            if (chat.id === chatId) {
              const msgIndex = chat.messages.findIndex(m => m.id === regenerateId);
              if (msgIndex !== -1) {
                const newMessages = [...chat.messages];
                newMessages[msgIndex] = {
                  ...newMessages[msgIndex],
                  id: assistantMessageId,
                  content: '',
                  isLoading: true,
                };
                return { ...chat, messages: newMessages };
              }
            }
            return chat;
          })
        );
        const currentChat = chats.find(c => c.id === chatId);
        const msgIndex = currentChat?.messages.findIndex(m => m.id === regenerateId) || 0;
        currentMessages = currentChat?.messages.slice(0, msgIndex) || [];
        const lastUserMsg = currentMessages.filter(m => m.role === 'user').pop();
        content = lastUserMsg?.content || content;
      } else {
        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: content.trim(),
          timestamp: new Date(),
        };

        assistantMessageId = generateId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isLoading: true,
          isThinking: config.mode === 'thinking' || config.mode === 'pro',
          thinkingContent: '',
        };

        const currentChat = chats.find(c => c.id === chatId);
        currentMessages = currentChat?.messages || [];

        if (currentMessages.length === 0) {
          const title = content.trim().slice(0, 30) + (content.length > 30 ? '...' : '');
          setChats(prev => prev.map(chat => (chat.id === chatId ? { ...chat, title } : chat)));
          
          // อัปเดต URL เมื่อส่งข้อความแรก
          const newUrl = `/c/${chatId}`;
          if (window.location.pathname !== newUrl && !isSharedUrl()) {
            window.history.pushState({}, '', newUrl);
          }
        }

        updateChatMessages(chatId, msgs => [...msgs, userMessage, assistantMessage]);
      }

      setLoadingChats(prev => new Set(prev).add(chatId));
      setError(null);

      try {
        const history = currentMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          parts: [{ text: msg.content }],
        }));

        await aiService.streamMessage(content.trim(), history, config, (text, isThinking) => {
          updateChatMessages(chatId, msgs =>
            msgs.map(msg =>
              msg.id === assistantMessageId 
                ? { 
                    ...msg, 
                    content: isThinking ? msg.content : text,
                    thinkingContent: isThinking ? text : msg.thinkingContent,
                    isThinking: isThinking,
                    isLoading: false 
                  } 
                : msg
            )
          );
        }, abortControllerRef.current?.signal);
      } catch (error) {
        if (error instanceof Error && error.message === 'Request aborted') {
          // ถูก abort โดยผู้ใช้
          updateChatMessages(chatId, msgs =>
            msgs.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content || 'การตอบถูกหยุดโดยผู้ใช้', isLoading: false, isThinking: false }
                : msg
            )
          );
        } else {
          setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
          updateChatMessages(chatId, msgs =>
            msgs.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่', isLoading: false, isThinking: false }
                : msg
            )
          );
        }
      } finally {
        setLoadingChats(prev => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });
        abortControllerRef.current = null;
      }
    },
    [chats, activeChatId, loadingChats, config, updateChatMessages]
  );

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
    setLoadingChats(prev => {
      const next = new Set(prev);
      next.delete(activeChatId);
      return next;
    });
    updateChatMessages(activeChatId, msgs =>
      msgs.map(msg => (msg.isLoading ? { ...msg, isLoading: false, isThinking: false } : msg))
    );
  }, [activeChatId, updateChatMessages]);

  const regenerate = useCallback(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      const assistantIndex = messages.findIndex(m => m.id === lastAssistantMsg.id);
      const userMsgBefore = messages.slice(0, assistantIndex).reverse().find(m => m.role === 'user');
      if (userMsgBefore) {
        sendMessage(userMsgBefore.content, lastAssistantMsg.id);
      }
    }
  }, [messages, sendMessage]);

  const newChat = useCallback(() => {
    const chat = createNewChat();
    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);
    setError(null);
    
    // ไปที่ root path เมื่อสร้าง chat ใหม่
    if (window.location.pathname !== '/' && !isSharedUrl()) {
      window.history.pushState({}, '', '/');
    }
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

  const shareChat = useCallback((): string | null => {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || chat.messages.length === 0) return null;

    const shareId = generateId();
    const sharedData = {
      id: shareId,
      title: chat.title,
      messages: chat.messages,
      sharedAt: new Date(),
    };

    try {
      const existing = localStorage.getItem(SHARED_CHATS_KEY);
      const shared = existing ? JSON.parse(existing) : {};
      shared[shareId] = sharedData;
      localStorage.setItem(SHARED_CHATS_KEY, JSON.stringify(shared));
    } catch {
      return null;
    }

    return `${window.location.origin}/s/${shareId}`;
  }, [chats, activeChatId]);

  const getSharedChat = useCallback((): { title: string; messages: Message[] } | null => {
    const shareId = getSharedChatIdFromUrl();
    if (!shareId) return null;

    try {
      const stored = localStorage.getItem(SHARED_CHATS_KEY);
      if (stored) {
        const shared = JSON.parse(stored);
        if (shared[shareId]) {
          return {
            title: shared[shareId].title,
            messages: shared[shareId].messages.map((msg: Message) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          };
        }
      }
    } catch {
      // Silent
    }
    return null;
  }, []);

  const isSharedView = isSharedUrl();

  return {
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
  };
}
