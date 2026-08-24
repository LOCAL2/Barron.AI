export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isThinking?: boolean;
  thinkingContent?: string;
  isError?: boolean;
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
  mode: 'fast' | 'thinking' | 'pro';
}

export const DEFAULT_CONFIG: AIConfig = {
  model: 'llama-3.3-70b-versatile', // ใช้โมเดลที่ใหญ่ที่สุด 70B parameters
  temperature: 0.2, // ลดลงเพื่อความแม่นยำสูงสุด ตัวอักษรไม่ตก
  maxOutputTokens: 8192, // เพิ่มเป็น 8K เพื่อให้ตอบได้ยาวและครบถ้วน
  topP: 0.8, // ลดลงเพื่อให้เลือกคำที่แม่นยำที่สุด
  mode: 'pro', // โหมด Pro เป็นค่าเริ่มต้น
};

export const AVAILABLE_MODES = [
  { id: 'fast', name: 'Fast', description: 'ตอบเร็ว กระชับ ได้ใจความ' },
  { id: 'thinking', name: 'Thinking', description: 'แสดงกระบวนการคิด วิเคราะห์ลึก' },
  { id: 'pro', name: 'Pro', description: 'ตอบละเอียด ครบถ้วน แม่นยำ' },
] as const;

export const AVAILABLE_MODELS = [
  { id: 'llama-3.1-8b-instant', name: 'Barron 8B', description: 'เร็วมาก เบาสบาย', params: 8030261248 },
  { id: 'qwen/qwen3-32b', name: 'Barron 32B', description: 'สมดุลดี ทั้งเร็วทั้งฉลาด', params: 32514190336 },
  { id: 'llama-3.3-70b-versatile', name: 'Barron 70B', description: 'แม่นยำ ตอบละเอียด มั่ง', params: 70621347840 },
];
