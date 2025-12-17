import type { AIConfig } from '../types/chat';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
    const messages: ChatMessage[] = history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.parts[0].text,
    }));
    messages.push({ role: 'user', content: message });

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
    const messages: ChatMessage[] = history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.parts[0].text,
    }));
    messages.push({ role: 'user', content: message });

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
