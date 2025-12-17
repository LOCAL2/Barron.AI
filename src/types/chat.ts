export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface AIConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
}

export const DEFAULT_CONFIG: AIConfig = {
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.95,
};

export const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Barron 70B', description: 'ฉลาดและอเนกประสงค์', params: 70621347840 },
  { id: 'llama-3.1-8b-instant', name: 'Barron 8B', description: 'เร็วมาก', params: 8030261248 },
  { id: 'qwen/qwen3-32b', name: 'Barron 32B', description: 'สมดุลดี', params: 32514190336 },
];
