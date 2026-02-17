# Barron AI - ผู้ช่วย AI อัจฉริยะ

AI Chatbot ที่ทรงพลังพร้อมโหมดต่างๆ: Fast, Thinking, และ Pro (พร้อมการค้นหาข้อมูลจากอินเทอร์เน็ต)

## ✨ คุณสมบัติเด่น

- 🚀 **Fast Mode**: ตอบเร็ว กระชับ ตรงประเด็น
- 🧠 **Thinking Mode**: แสดงกระบวนการคิดอย่างละเอียด
- 🔍 **Pro Mode**: ค้นหาข้อมูลจากอินเทอร์เน็ตพร้อมอ้างอิงแหล่งที่มา
- 📊 **Graph & Diagram**: วาดกราฟและแผนภาพได้หลายประเภท
- 🎤 **Voice Input**: พูดคุยด้วยเสียง (Speech Recognition)
- 💾 **Chat History**: บันทึกประวัติการสนทนา
- 🌙 **Dark Mode**: รองรับธีมมืด
- 📱 **Responsive**: ใช้งานได้ทุกอุปกรณ์

## 🚀 การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# รันโปรเจค
npm run dev
```

## ⚙️ การตั้งค่า

### 1. Groq API Key (จำเป็น)

1. ไปที่ [Groq Console](https://console.groq.com/)
2. สร้าง API Key
3. เพิ่มใน `.env`:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### 2. Google Custom Search API (สำหรับ Pro Mode - ไม่บังคับ)

เพื่อให้ Pro Mode สามารถค้นหาข้อมูลจากอินเทอร์เน็ตจริงๆ:

#### ขั้นตอนที่ 1: สร้าง API Key
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจคใหม่หรือเลือกโปรเจคที่มีอยู่
3. ไปที่ **APIs & Services** > **Credentials**
4. คลิก **Create Credentials** > **API Key**
5. คัดลอก API Key ที่ได้

#### ขั้นตอนที่ 2: เปิดใช้งาน Custom Search API
1. ไปที่ **APIs & Services** > **Library**
2. ค้นหา "Custom Search API"
3. คลิก **Enable**

#### ขั้นตอนที่ 3: สร้าง Search Engine
1. ไปที่ [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. คลิก **Add** เพื่อสร้าง Search Engine ใหม่
3. ตั้งค่า:
   - **Sites to search**: เลือก "Search the entire web"
   - **Name**: ตั้งชื่อตามต้องการ
4. คลิก **Create**
5. คัดลอก **Search Engine ID**

#### ขั้นตอนที่ 4: เพิ่มใน .env
```env
VITE_SEARCH_API_KEY=your_google_api_key_here
VITE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

**หมายเหตุ**: ถ้าไม่ตั้งค่า Google Search API, Pro Mode จะใช้ข้อมูลจำลองแทน

## 📖 วิธีใช้งาน

### โหมดต่างๆ

1. **Fast Mode** 🚀
   - ตอบเร็ว กระชับ
   - เหมาะสำหรับคำถามทั่วไป

2. **Thinking Mode** 🧠
   - แสดงกระบวนการคิด
   - วิเคราะห์อย่างละเอียด
   - เหมาะสำหรับปัญหาซับซ้อน

3. **Pro Mode** 🔍
   - ค้นหาข้อมูลจากอินเทอร์เน็ต
   - อ้างอิงแหล่งที่มาชัดเจน
   - เหมาะสำหรับข้อมูลล่าสุด

### การวาดกราฟ 📊

AI สามารถวาดกราฟและแผนภาพได้หลายประเภท:

**ตัวอย่างคำสั่ง:**
- "วาดกราฟยอดขายรายเดือน"
- "สร้างแผนภาพขั้นตอนการสมัครสมาชิก"
- "วาดกราฟวงกลมแสดงสัดส่วนงบประมาณ"
- "สร้าง flowchart สำหรับกระบวนการตัดสินใจ"
- "วาดแผนการทำงานโปรเจค"

**ประเภทกราฟที่รองรับ:**
- 📈 Line Chart (กราฟเส้น)
- 📊 Bar Chart (กราฟแท่ง)
- 🥧 Pie Chart (กราฟวงกลม)
- 🔄 Flowchart (แผนภาพลำดับงาน)
- 📋 Sequence Diagram (แผนภาพลำดับเหตุการณ์)
- 📅 Gantt Chart (แผนภูมิแกนต์)
- 🏗️ Class Diagram (แผนภาพคลาส)
- 🧠 Mind Map (แผนผังความคิด)

**หมายเหตุ**: หลังจากอัพเดทโค้ด ให้รีสตาร์ทเซิร์ฟเวอร์ (Ctrl+C แล้ว `npm run dev` ใหม่) เพื่อให้ AI โหลดคำแนะนำใหม่

### การใช้เสียง 🎤

1. คลิกไอคอนไมโครโฟน 🎤
2. พูดคำถามของคุณ
3. AI จะตอบอัตโนมัติ

## 🛠️ เทคโนโลยีที่ใช้

- **React** + **TypeScript** + **Vite**
- **Groq API** (LLaMA 3.3 70B)
- **Google Custom Search API**
- **Mermaid** (สำหรับกราฟและแผนภาพ)
- **Web Speech API**
- **React Markdown**

## 📝 License

MIT

---

## 🔧 การพัฒนา

```bash
# รัน development server
npm run dev

# Build สำหรับ production
npm run build

# Preview production build
npm run preview
```

## 🐛 การแก้ไขปัญหา

### Pro Mode ไม่ค้นหาข้อมูลจากอินเทอร์เน็ต
- ตรวจสอบว่าตั้งค่า `VITE_SEARCH_API_KEY` และ `VITE_SEARCH_ENGINE_ID` ใน `.env` แล้ว
- ตรวจสอบว่าเปิดใช้งาน Custom Search API ใน Google Cloud Console แล้ว
- ตรวจสอบ quota ของ API (ฟรี 100 queries/วัน)

### Voice Input ไม่ทำงาน
- ตรวจสอบว่าเบราว์เซอร์รองรับ Web Speech API (Chrome, Edge แนะนำ)
- ตรวจสอบว่าอนุญาตให้เข้าถึงไมโครโฟนแล้ว
- ใช้ HTTPS หรือ localhost เท่านั้น

### กราฟแสดง Error "Lexical error"
- ปัญหานี้เกิดจาก AI ใช้ภาษาไทยใน Mermaid syntax
- **วิธีแก้**: รีสตาร์ทเซิร์ฟเวอร์ (Ctrl+C แล้ว `npm run dev` ใหม่)
- AI จะโหลดคำแนะนำใหม่และใช้ภาษาอังกฤษใน syntax
- ถ้ายังเกิดปัญหา ลองถามใหม่อีกครั้ง AI จะแก้ไขให้

---

พัฒนาโดย Barron Nelly 💙
