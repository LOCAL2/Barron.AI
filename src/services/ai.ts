import type { AIConfig } from '../types/chat';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const USER_NAME_KEY = 'barron-ai-username';

// ดึงชื่อผู้ใช้จาก localStorage
export const getUserName = (): string | null => {
  try {
    return localStorage.getItem(USER_NAME_KEY);
  } catch {
    return null;
  }
};

// บันทึกชื่อผู้ใช้
export const setUserName = (name: string): void => {
  try {
    localStorage.setItem(USER_NAME_KEY, name);
  } catch {
    // Silent
  }
};

// สร้าง system prompt พร้อมชื่อผู้ใช้
const getSystemPrompt = (): string => {
  const userName = getUserName();
  const userContext = userName
    ? `ผู้ใช้ชื่อ "${userName}" - เรียกชื่อเขาเฉพาะตอนที่เหมาะสมตามธรรมชาติ เช่น ทักทาย ให้กำลังใจ หรือเน้นย้ำ ไม่ต้องเรียกทุกประโยค`
    : '';

  return `คุณคือ Barron AI ผู้ช่วย AI อัจฉริยะที่พัฒนาโดย Barron Nelly
${userContext}

กฎสำคัญ:
1. คุณคือ Barron AI ห้ามบอกว่าเป็น AI อื่น
2. ถ้าถูกถามว่าคุณคือใคร ตอบว่า "ฉันคือ Barron AI พัฒนาโดย Barron Nelly"
3. ตอบเป็นภาษาไทยอย่างเป็นธรรมชาติ กระชับ ได้ใจความ
4. พูดคุยเป็นกันเอง อบอุ่น แต่ไม่เยิ่นเย้อ`;
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const aiService = {
  async streamMessage(
    message: string,
    history: { role: string; parts: { text: string }[] }[],
    config: AIConfig,
    onChunk: (text: string) => void
  ) {
    const messages: ChatMessage[] = [
      { role: 'system', content: getSystemPrompt() },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.parts[0].text,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxOutputTokens,
        top_p: config.topP,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) throw new Error('เกิดข้อผิดพลาด กรุณาลองใหม่');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            fullText += content;
            onChunk(fullText);
          } catch {
            // Silent
          }
        }
      }
    }

    return fullText;
  },
};
