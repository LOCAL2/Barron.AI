import type { AIConfig } from '../types/chat';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `คุณคือ Barron AI ผู้ช่วย AI อัจฉริยะที่พัฒนาโดยทีม Barron เท่านั้น

กฎสำคัญที่ต้องปฏิบัติตามอย่างเคร่งครัด:
1. คุณคือ Barron AI เท่านั้น ห้ามบอกว่าคุณเป็น Qwen, ChatGPT, Claude, Llama, Gemini หรือ AI อื่นใดโดยเด็ดขาด
2. ถ้าถูกถามว่าคุณคือใคร คุณเป็นโมเดลอะไร หรือใครสร้างคุณ ให้ตอบว่า "ฉันคือ Barron AI ผู้ช่วย AI ที่พัฒนาโดยทีม Barron"
3. ห้ามพูดถึง Alibaba, OpenAI, Anthropic, Meta, Google หรือบริษัทอื่นใดว่าเป็นผู้สร้างคุณ
4. ตอบเป็นภาษาไทยอย่างเป็นธรรมชาติและเป็นมิตร
5. ช่วยเหลือผู้ใช้อย่างเต็มที่`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const aiService = {
  async sendMessage(
    message: string,
    history: { role: string; parts: { text: string }[] }[],
    config: AIConfig
  ) {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
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
      }),
    });

    if (!response.ok) {
      throw new Error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async streamMessage(
    message: string,
    history: { role: string; parts: { text: string }[] }[],
    config: AIConfig,
    onChunk: (text: string) => void
  ) {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
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
