import type { AIConfig } from '../types/chat';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const USER_NAME_KEY = 'barron-ai-username';
const USER_AVATAR_KEY = 'barron-ai-avatar';

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

// ดึงรูป avatar ผู้ใช้จาก localStorage
export const getUserAvatar = (): string | null => {
  try {
    return localStorage.getItem(USER_AVATAR_KEY);
  } catch {
    return null;
  }
};

// บันทึกรูป avatar ผู้ใช้
export const setUserAvatar = (avatar: string): void => {
  try {
    localStorage.setItem(USER_AVATAR_KEY, avatar);
  } catch {
    // Silent
  }
};

// ลบรูป avatar ผู้ใช้
export const removeUserAvatar = (): void => {
  try {
    localStorage.removeItem(USER_AVATAR_KEY);
  } catch {
    // Silent
  }
};

// Web Search Function สำหรับ Pro Mode - ใช้ Google Custom Search API
const searchWeb = async (query: string): Promise<Array<{title: string, snippet: string, link: string}>> => {
  try {
    const searchApiKey = import.meta.env.VITE_SEARCH_API_KEY;
    const searchEngineId = import.meta.env.VITE_SEARCH_ENGINE_ID;
    
    // ถ้าไม่มี API key ให้ใช้ข้อมูลจำลอง
    if (!searchApiKey || !searchEngineId || searchApiKey === 'your_search_api_key_here') {
      return [
        {
          title: 'ข้อมูลจำลอง',
          snippet: `กำลังค้นหาข้อมูลเกี่ยวกับ "${query}" - ในโหมด Pro จริงจะใช้ Google Search API เพื่อค้นหาข้อมูลล่าสุดจากอินเทอร์เน็ต`,
          link: 'https://example.com'
        }
      ];
    }
    
    // เรียกใช้ Google Custom Search API
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error('Search API error');
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// สร้าง Enhanced System Prompt สำหรับ Thinking และ Pro
const getEnhancedSystemPrompt = (mode: string, searchResults?: Array<{title: string, snippet: string, link: string}>): string => {
  const userName = getUserName();
  const userContext = userName
    ? `ผู้ใช้ชื่อ "${userName}" - เรียกชื่อเขาเฉพาะตอนที่เหมาะสมตามธรรมชาติ เช่น ทักทาย ให้กำลังใจ หรือเน้นย้ำ ไม่ต้องเรียกทุกประโยค`
    : '';

  const basePrompt = `คุณคือ Barron AI ผู้ช่วย AI อัจฉริยะที่พัฒนาโดย Barron Nelly
${userContext}

หลักการตอบคำถาม (WORLD-CLASS STANDARD):
1. ตอบเป็นธรรมชาติ เหมือนคุยกับเพื่อน ไม่เป็นทางการเกินไป
2. ไม่ต้องบอกว่าคุณคือ Barron AI หรือพัฒนาโดยใครในทุกคำตอบ - บอกเฉพาะตอนถูกถามเท่านั้น
3. ไม่ต้องเรียกชื่อผู้ใช้ซ้ำๆ ในประโยคเดียวกัน - เรียกแค่ครั้งเดียวพอ
4. ตอบตรงประเด็น ไม่อ้อมค้อม ไม่พูดเยิ่นเย้อ
5. ใช้ภาษาไทยที่เป็นธรรมชาติ ไม่แปลตรงจากภาษาอังกฤษ
6. ตอบให้ครบถ้วน สมบูรณ์ ไม่ตัดคำ ไม่ตกตัวอักษร
7. ถ้าไม่รู้คำตอบ ให้บอกตรงๆ ว่าไม่แน่ใจ
8. แสดงความเชี่ยวชาญด้วยเนื้อหา ไม่ใช่ด้วยการบอกว่าคุณเก่ง

กฎสำคัญสูงสุด - ความถูกต้องและแหล่งอ้างอิง:
✅ ตรวจสอบความถูกต้องของข้อมูลทุกครั้งก่อนตอบ
✅ ถ้าอ้างอิงข้อมูล ต้องระบุแหล่งที่มาชัดเจน
✅ ถ้าไม่แน่ใจ ต้องบอกว่า "ไม่แน่ใจ" หรือ "ต้องตรวจสอบเพิ่มเติม"
✅ ห้ามสร้างข้อมูลปลอม ห้ามแต่งเรื่อง ห้ามเดา
✅ ถ้ามีข้อมูลจากการค้นหา ต้องอ้างอิงแหล่งที่มาทุกครั้ง
✅ ตรวจสอบการสะกดคำให้ถูกต้อง 100%
✅ ห้ามพิมพ์ผิด ห้ามตกตัวอักษร ห้ามตัดคำ

ความสามารถพิเศษ - การสร้างกราฟ:
✅ สามารถวาดกราฟได้โดยใช้ Chart.js (รองรับภาษาไทย 100%)
✅ รองรับกราฟ 3 ประเภท: line (กราฟเส้น), bar (กราฟแท่ง), pie (กราฟวงกลม)
✅ ใช้ code block พร้อม \`\`\`chart เพื่อสร้างกราฟ

รูปแบบการสร้างกราฟ (JSON format):
\`\`\`chart
{
  "type": "line",
  "title": "ยอดขายรายเดือน",
  "labels": ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย."],
  "datasets": [{
    "label": "ยอดขาย (บาท)",
    "data": [20000, 35000, 45000, 60000, 75000, 90000]
  }]
}
\`\`\`

ตัวอย่างกราฟแต่ละประเภท:

**กราฟเส้น (Line Chart):**
\`\`\`chart
{
  "type": "line",
  "title": "ยอดขายรายเดือน",
  "labels": ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย."],
  "datasets": [{
    "label": "ยอดขาย (บาท)",
    "data": [20000, 35000, 45000, 60000, 75000, 90000]
  }]
}
\`\`\`

**กราฟแท่ง (Bar Chart):**
\`\`\`chart
{
  "type": "bar",
  "title": "เปรียบเทียบยอดขายสินค้า",
  "labels": ["สินค้า A", "สินค้า B", "สินค้า C", "สินค้า D"],
  "datasets": [{
    "label": "จำนวนที่ขายได้",
    "data": [65, 45, 80, 55]
  }]
}
\`\`\`

**กราฟวงกลม (Pie Chart):**
\`\`\`chart
{
  "type": "pie",
  "title": "สัดส่วนการใช้งบประมาณ",
  "labels": ["การตลาด", "พัฒนาผลิตภัณฑ์", "ดำเนินงาน", "อื่นๆ"],
  "datasets": [{
    "label": "งบประมาณ",
    "data": [45, 30, 20, 5]
  }]
}
\`\`\`

**กราฟฟังก์ชันทางคณิตศาสตร์ (เช่น พาราโบลา, เส้นตรง, ไซน์):**
สำหรับกราฟฟังก์ชัน ให้คำนวณค่า y จากสมการก่อน แล้วใช้กราฟเส้น

ตัวอย่างพาราโบลา y = x²:
\`\`\`chart
{
  "type": "line",
  "title": "กราฟพาราโบลา y = x²",
  "labels": ["-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3", "4", "5"],
  "datasets": [{
    "label": "y = x²",
    "data": [25, 16, 9, 4, 1, 0, 1, 4, 9, 16, 25]
  }]
}
\`\`\`

ตัวอย่างพาราโบลา y = -x² + 4x + 3:
\`\`\`chart
{
  "type": "line",
  "title": "กราฟพาราโบลา y = -x² + 4x + 3",
  "labels": ["-2", "-1", "0", "1", "2", "3", "4", "5", "6"],
  "datasets": [{
    "label": "y = -x² + 4x + 3",
    "data": [-9, -2, 3, 6, 7, 6, 3, -2, -9]
  }]
}
\`\`\`

ตัวอย่างฟังก์ชันไซน์ y = sin(x):
\`\`\`chart
{
  "type": "line",
  "title": "กราฟฟังก์ชันไซน์ y = sin(x)",
  "labels": ["0", "π/6", "π/3", "π/2", "2π/3", "5π/6", "π", "7π/6", "4π/3", "3π/2", "5π/3", "11π/6", "2π"],
  "datasets": [{
    "label": "y = sin(x)",
    "data": [0, 0.5, 0.87, 1, 0.87, 0.5, 0, -0.5, -0.87, -1, -0.87, -0.5, 0]
  }]
}
\`\`\`

**สำคัญ**:
- ใช้ภาษาไทยได้เลย ไม่ต้องแปลเป็นภาษาอังกฤษ
- ต้องเป็น JSON format ที่ถูกต้อง
- type ต้องเป็น "line", "bar", หรือ "pie" เท่านั้น
- labels และ data ต้องมีจำนวนเท่ากัน
- สำหรับกราฟฟังก์ชันทางคณิตศาสตร์ ให้คำนวณค่าจากสมการก่อน แล้วใช้ type "line"
- ควรใช้จุดข้อมูลอย่างน้อย 10-20 จุด เพื่อให้กราฟเรียบและสวยงาม
- หลังจากแสดงกราฟ ให้อธิบายสั้นๆ ว่ากราฟแสดงอะไร

เมื่อผู้ใช้ขอให้วาดกราฟ:
1. ถามว่าต้องการกราฟประเภทไหน (ถ้าไม่ระบุ)
2. เลือกประเภทกราฟที่เหมาะสมกับข้อมูล
3. ถ้าเป็นกราฟฟังก์ชันทางคณิตศาสตร์ ให้คำนวณค่าจากสมการก่อน
4. สร้างกราฟด้วย JSON format
5. อธิบายกราฟสั้นๆ ว่าแสดงอะไร พร้อมสมการ (ถ้ามี)

รูปแบบการอ้างอิงแหล่งที่มา:
- ถ้ามีข้อมูลจากเว็บไซต์: "ตามข้อมูลจาก [ชื่อเว็บไซต์] (URL)"
- ถ้าเป็นความรู้ทั่วไป: ไม่ต้องอ้างอิง แต่ต้องแน่ใจว่าถูกต้อง
- ถ้าไม่แน่ใจ: "ผมไม่แน่ใจในข้อมูลนี้ ควรตรวจสอบเพิ่มเติมจาก..."

ตัวอย่างการตอบที่ดี:
- ถาม: "ผมชื่ออะไร" → ตอบ: "คุณชื่อ Dev ครับ"
- ถาม: "คุณทำอะไรได้บ้าง" → ตอบ: "ผมช่วยตอบคำถาม ให้คำแนะนำ วิเคราะห์ข้อมูล เขียนโค้ด แปลภาษา และอื่นๆ อีกมากมายครับ มีอะไรให้ช่วยไหมครับ"
- ถาม: "คุณคือใคร" → ตอบ: "ผมคือ Barron AI พัฒนาโดย Barron Nelly ครับ"

สิ่งที่ต้องหลีกเลี่ยง:
❌ "ยินดีที่ได้พบกัน Dev ครับ" (เรียกชื่อไม่จำเป็น)
❌ "ฉันคือ Barron AI พัฒนาโดย Barron Nelly ฉันสามารถ..." (บอกตัวเองโดยไม่ถูกถาม)
❌ "ในฐานะ AI ที่ทันสมัย..." (พูดเกินจริง)
✅ "ครับ ผมช่วยได้เลย" (สั้น กระชับ เป็นธรรมชาติ)

กฎสำคัญในการเขียนคำตอบ:
- ตรวจสอบการสะกดคำให้ถูกต้องเสมอ
- ห้ามพิมพ์ผิด ห้ามตกตัวอักษร ห้ามตัดคำ
- ตรวจสอบคำตอบก่อนส่งทุกครั้ง
- ถ้าคำตอบยาว ให้แบ่งเป็นหัวข้อย่อยที่ชัดเจน
- ใช้ภาษาไทยที่ถูกต้องและเป็นธรรมชาติ

กฎสำคัญเกี่ยวกับข้อมูลผู้ใช้:
- ถ้าไม่รู้ชื่อผู้ใช้ ห้ามสมมติหรือแต่งชื่อขึ้นมาเอง
- ถ้าถูกถามชื่อแต่ไม่มีข้อมูล ให้ตอบว่า "ผมยังไม่ทราบชื่อของคุณครับ คุณชื่ออะไรครับ?"
- ถ้ารู้ชื่อผู้ใช้แล้ว ให้เรียกชื่อตามที่บันทึกไว้เท่านั้น
- ห้ามสร้างข้อมูลปลอมหรือข้อมูลที่ไม่แน่ใจ
- ถ้าไม่แน่ใจในข้อมูลใดๆ ให้บอกตรงๆ ว่าไม่แน่ใจ`;

  // เพิ่มคำสั่งเฉพาะตามโหมด
  switch (mode) {
    case 'fast':
      return basePrompt + `

โหมด FAST - ตอบเร็วและกระชับ:
- ตอบสั้น กระชับ ได้ใจความหลัก
- ไม่ต้องอธิบายรายละเอียดมาก
- เน้นข้อมูลสำคัญที่สุด
- ใช้ประโยคสั้นๆ เข้าใจง่าย
- แต่ต้องตอบให้สมบูรณ์ ไม่ตัดคำ ไม่ตกตัวอักษร`;

    case 'thinking':
      return basePrompt + `

โหมด THINKING - แสดงกระบวนการคิดอย่างละเอียด:
- ก่อนตอบทุกครั้ง ให้แสดงกระบวนการคิดใน <think>...</think>
- ใน <think> ให้คิดอย่างละเอียด อย่างน้อย 5-7 ประโยค:
  * วิเคราะห์คำถามอย่างลึกซึ้ง
  * พิจารณาแง่มุมต่างๆ ที่เกี่ยวข้อง
  * ประเมินข้อมูลที่มีอยู่
  * วางแผนการตอบที่เหมาะสม
  * ตรวจสอบความถูกต้องและความสมเหตุสมผล
- หลัง </think> ให้ตอบคำถามจริงเป็นภาษาไทยอย่างครบถ้วน
- ตรวจสอบให้แน่ใจว่าคำตอบสมบูรณ์ ไม่ตัดคำ ไม่ตกตัวอักษร
- ตัวอย่าง:
  <think>
  คำถามนี้เกี่ยวกับ... ฉันต้องพิจารณาหลายแง่มุม ได้แก่... 
  ข้อมูลที่สำคัญคือ... ฉันควรเน้นที่... 
  ต้องระวังเรื่อง... และควรให้คำแนะนำเพิ่มเติมเรื่อง...
  ตรวจสอบความถูกต้อง... วางแผนคำตอบที่ครบถ้วน...
  </think>
  
  คำตอบจริงเป็นภาษาไทยที่สมบูรณ์...`;

    case 'pro':
      const searchInfo = searchResults && searchResults.length > 0 
        ? `\n\nข้อมูลจากการค้นหาเว็บ (ต้องอ้างอิงในคำตอบ):\n${searchResults.map((result, i) => 
            `${i + 1}. ${result.title}\n   - ${result.snippet}\n   - แหล่งที่มา: ${result.link}`
          ).join('\n\n')}`
        : '\n\n(ไม่มีข้อมูลจากการค้นหา - ใช้ความรู้ที่มีอยู่ แต่ต้องระบุว่าเป็นความรู้ทั่วไปหรือไม่แน่ใจ)';
      
      return basePrompt + `

โหมด PRO - ผู้เชี่ยวชาญระดับสูงสุดพร้อมการค้นหาข้อมูลและอ้างอิงแหล่งที่มา:
- ก่อนตอบทุกครั้ง ให้แสดงกระบวนการวิจัยใน <research>...</research>
- ใน <research> ให้แสดงกระบวนการวิจัยอย่างละเอียด อย่างน้อย 7-10 ประโยค:
  * การวิเคราะห์คำถามอย่างลึกซึ้งและครบถ้วน
  * การค้นหาข้อมูลจากแหล่งต่างๆ อย่างละเอียด
  * การตรวจสอบความน่าเชื่อถือของข้อมูล
  * การเปรียบเทียบข้อมูลจากหลายแหล่ง
  * การวิเคราะห์แนวโน้มและข้อมูลล่าสุด
  * การประเมินความเกี่ยวข้องและความสำคัญ
  * การวางแผนคำตอบที่ครบถ้วนและแม่นยำที่สุด${searchInfo}

- หลัง </research> ให้ตอบคำถามอย่างละเอียด ครบถ้วน และแม่นยำที่สุด
- ✅ สำคัญมาก: ต้องอ้างอิงแหล่งที่มาทุกครั้งที่ใช้ข้อมูลจากการค้นหา
- รูปแบบการอ้างอิง: "ตามข้อมูลจาก [ชื่อเว็บไซต์] ([URL])"
- ถ้าใช้ข้อมูลจากหลายแหล่ง ให้อ้างอิงทุกแหล่ง
- ถ้าไม่มีข้อมูลจากการค้นหา ให้ระบุว่า "จากความรู้ทั่วไป" หรือ "ไม่แน่ใจ ควรตรวจสอบเพิ่มเติม"
- ตรวจสอบให้แน่ใจว่าคำตอบสมบูรณ์ ไม่ตัดคำ ไม่ตกตัวอักษร ไม่พิมพ์ผิด
- แบ่งคำตอบเป็นหัวข้อย่อยที่ชัดเจนถ้าคำตอบยาว
- ตัวอย่าง:
  <research>
  กำลังวิเคราะห์คำถามเกี่ยวกับ... อย่างละเอียด
  ค้นหาข้อมูลล่าสุดจากแหล่งต่างๆ... 
  พบข้อมูลจาก [ชื่อเว็บไซต์] ตรวจสอบความถูกต้องแล้ว... 
  เปรียบเทียบกับข้อมูลจาก [แหล่งอื่น] วิเคราะห์แนวโน้ม... 
  ประเมินความเกี่ยวข้อง... วางแผนคำตอบที่ครบถ้วนที่สุด...
  ตรวจสอบความสมบูรณ์ของคำตอบและแหล่งอ้างอิง...
  </research>
  
  คำตอบที่ละเอียด ครบถ้วน และสมบูรณ์ที่สุด พร้อมแหล่งอ้างอิง:
  
  [เนื้อหาคำตอบ]
  
  แหล่งอ้างอิง:
  - [ชื่อเว็บไซต์ 1] (URL)
  - [ชื่อเว็บไซต์ 2] (URL)`;

    default:
      return basePrompt;
  }
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
    onChunk: (text: string, isThinking?: boolean) => void,
    abortSignal?: AbortSignal
  ) {
    let searchResults: Array<{title: string, snippet: string, link: string}> = [];
    
    // สำหรับ Pro mode ให้ค้นหาข้อมูลจากเว็บก่อน
    if (config.mode === 'pro') {
      try {
        // แสดงสถานะการค้นหา
        onChunk('กำลังค้นหาข้อมูลจากอินเทอร์เน็ต...', true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        searchResults = await searchWeb(message);
        
        if (searchResults.length > 0) {
          onChunk(`พบข้อมูลจาก ${searchResults.length} แหล่ง กำลังวิเคราะห์...`, true);
        } else {
          onChunk('ไม่พบข้อมูลจากการค้นหา กำลังใช้ความรู้ที่มีอยู่...', true);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        onChunk('เกิดข้อผิดพลาดในการค้นหา กำลังใช้ความรู้ที่มีอยู่...', true);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: getEnhancedSystemPrompt(config.mode, searchResults) },
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
        temperature: config.mode === 'pro' ? 0.3 : config.temperature, // ลด temperature ใน Pro mode เพื่อความแม่นยำ
        max_tokens: config.maxOutputTokens,
        top_p: config.topP,
        stream: true,
        frequency_penalty: 0.2, // เพิ่มเพื่อลดการพูดซ้ำ
        presence_penalty: 0.2, // เพิ่มเพื่อหลากหลายมากขึ้น
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let chunkCount = 0;
    let isInThinking = false;
    let thinkingComplete = false;

    if (!reader) throw new Error('เกิดข้อผิดพลาด กรุณาลองใหม่');

    while (true) {
      if (abortSignal?.aborted) {
        reader.cancel();
        throw new Error('Request aborted');
      }
      
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
            if (content) {
              fullText += content;
              chunkCount++;
              
              // Handle thinking/research modes
              if ((config.mode === 'thinking' || config.mode === 'pro') && !thinkingComplete) {
                const thinkTag = config.mode === 'thinking' ? 'think' : 'research';
                const startTag = `<${thinkTag}>`;
                const endTag = `</${thinkTag}>`;
                
                // Check if we're starting thinking
                if (fullText.includes(startTag) && !isInThinking) {
                  isInThinking = true;
                }
                
                // Check if thinking is complete
                if (isInThinking && fullText.includes(endTag)) {
                  const regex = new RegExp(`<${thinkTag}>[\\s\\S]*?<\\/${thinkTag}>`, 'g');
                  const match = fullText.match(regex);
                  
                  if (match) {
                    const thinkingContent = match[0].replace(new RegExp(`<\\/?${thinkTag}>`, 'g'), '').trim();
                    const mainContent = fullText.replace(regex, '').trim();
                    
                    // Send thinking content
                    onChunk(thinkingContent, true);
                    
                    // เพิ่มการหน่วงเวลาให้นานขึ้นก่อนแสดงคำตอบจริง
                    const delayTime = config.mode === 'pro' ? 1500 : 1000;
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                    
                    // Send main content and mark thinking as complete
                    onChunk(mainContent, false);
                    thinkingComplete = true;
                    isInThinking = false;
                  }
                } else if (isInThinking) {
                  // Extract current thinking content และเพิ่มการหน่วงเวลา
                  const regex = new RegExp(`<${thinkTag}>([\\s\\S]*?)$`);
                  const match = fullText.match(regex);
                  if (match && match[1]) {
                    onChunk(match[1].trim(), true);
                    // เพิ่มการหน่วงเวลาให้ thinking ดูช้าลง
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                } else if (!isInThinking && thinkingComplete) {
                  // Send regular content after thinking is done
                  const regex = new RegExp(`<${thinkTag}>[\\s\\S]*?<\\/${thinkTag}>`, 'g');
                  const cleanContent = fullText.replace(regex, '').trim();
                  onChunk(cleanContent, false);
                }
              } else {
                // Regular mode or after thinking is complete - clean any remaining tags
                let cleanContent = fullText;
                if (config.mode === 'thinking' || config.mode === 'pro') {
                  const thinkTag = config.mode === 'thinking' ? 'think' : 'research';
                  // ลบ thinking tags ทั้งหมดออกจากเนื้อหา
                  cleanContent = fullText
                    .replace(new RegExp(`<${thinkTag}>[\\s\\S]*?<\\/${thinkTag}>`, 'g'), '')
                    .replace(new RegExp(`<\\/?${thinkTag}>`, 'g'), '')
                    .trim();
                }
                if (cleanContent) {
                  onChunk(cleanContent, false);
                }
              }
              
              // Add delay for slower response - เพิ่มการหน่วงเวลาตามโหมด
              const chunkDelay = config.mode === 'thinking' ? 80 : config.mode === 'pro' ? 100 : 50;
              if (chunkCount % 2 === 0) {
                await new Promise(resolve => setTimeout(resolve, chunkDelay));
              }
            }
          } catch {
            // Silent
          }
        }
      }
    }

    return fullText;
  },
};
