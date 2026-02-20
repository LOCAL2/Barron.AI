# 🎙️ Real-Time Voice Conversational AI Mode

## ภาพรวม
ระบบสนทนาด้วยเสียงแบบเรียลไทม์ที่ทำงานแบบต่อเนื่องอัตโนมัติ

## คุณสมบัติหลัก

### 1. Speech-to-Text (รับเสียง)
- ใช้ Web Speech API (SpeechRecognition)
- รองรับภาษาไทย (th-TH)
- แสดงข้อความที่กำลังฟังแบบเรียลไทม์

### 2. Text-to-Speech (พูดกลับ)
- ใช้ Web Speech Synthesis API
- ตั้งค่าเสียงภาษาไทย
- ปรับความเร็ว pitch และระดับเสียงได้

### 3. Continuous Conversation Flow
- ผู้ใช้พูด → AI ประมวลผล → AI พูดกลับ → ฟังต่ออัตโนมัติ
- วนซ้ำต่อเนื่องจนกว่าจะหยุด

## ไฟล์ที่สร้าง/แก้ไข

### ไฟล์ใหม่
1. `src/hooks/useTextToSpeech.ts` - Custom hook สำหรับ Text-to-Speech
2. `src/components/VoiceMode.tsx` - Component หลักของโหมดเสียง
3. `src/components/VoiceMode.css` - Styling สำหรับโหมดเสียง

### ไฟล์ที่แก้ไข
1. `src/components/ChatContainer.tsx` - เพิ่มปุ่มและ integration
2. `src/components/ChatContainer.css` - เพิ่ม styling สำหรับปุ่มโหมดเสียง

## วิธีใช้งาน

### เปิดโหมดเสียง
1. คลิกปุ่มไมโครโฟน (🎙️) ที่ header
2. Modal โหมดเสียงจะเปิดขึ้น

### สนทนา
1. คลิก "เริ่มสนทนา" เพื่อเริ่มฟัง
2. พูดข้อความของคุณ
3. AI จะประมวลผลและตอบกลับด้วยเสียง
4. หลัง AI พูดเสร็จ จะเริ่มฟังอัตโนมัติ
5. วนซ้ำต่อไป

### หยุดสนทนา
- คลิก "หยุดสนทนา" เพื่อหยุดโหมดเสียง
- คลิก "หยุดพูด" เพื่อข้าม AI กำลังพูดและฟังใหม่
- คลิก X เพื่อปิดโหมดเสียง

## สถานะการทำงาน

### 4 สถานะหลัก
1. **Idle** - พร้อมเริ่มสนทนา (สีเทา)
2. **Listening** - กำลังฟังเสียงผู้ใช้ (สีน้ำเงิน + pulse)
3. **Processing** - AI กำลังประมวลผล (สีเหลือง + spinner)
4. **Speaking** - AI กำลังพูด (สีเขียว + pulse)

## UI/UX Design

### Professional Minimal Design
- Full-screen overlay พร้อม backdrop blur
- ไอคอนกลมขนาดใหญ่แสดงสถานะ
- สีเปลี่ยนตามสถานะ
- Animation minimal และมีจุดประสงค์
- ปุ่มควบคุมชัดเจน

### Responsive
- รองรับทั้ง desktop และ mobile
- ปรับขนาดและ spacing ตามหน้าจอ

## Technical Details

### useTextToSpeech Hook
```typescript
interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}
```

### VoiceMode Component Props
```typescript
interface VoiceModeProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  config: AIConfig;
  onClose: () => void;
  lastAssistantMessage?: string;
}
```

## Browser Compatibility

### Speech Recognition
- Chrome/Edge: ✅ รองรับเต็มรูปแบบ
- Firefox: ⚠️ รองรับบางส่วน
- Safari: ⚠️ รองรับบางส่วน (iOS 14.5+)

### Speech Synthesis
- Chrome/Edge: ✅ รองรับเต็มรูปแบบ
- Firefox: ✅ รองรับเต็มรูปแบบ
- Safari: ✅ รองรับเต็มรูปแบบ

## การทำงานภายใน

### Flow Diagram
```
User clicks "เริ่มสนทนา"
    ↓
Start Listening (state: listening)
    ↓
User speaks → transcript updates
    ↓
User stops speaking → transcript complete
    ↓
Send message to AI (state: processing)
    ↓
AI responds → lastAssistantMessage updates
    ↓
Speak AI response (state: speaking)
    ↓
Speaking complete
    ↓
Auto start listening again (state: listening)
    ↓
Loop continues...
```

### State Management
- ใช้ `useState` สำหรับ conversation state
- ใช้ `useEffect` สำหรับ auto-transition ระหว่างสถานะ
- Cleanup เมื่อ component unmount

## ข้อควรระวัง

1. **Microphone Permission** - ต้องขออนุญาตใช้ไมโครโฟน
2. **Network Connection** - Speech Recognition ต้องใช้ internet
3. **Browser Support** - ตรวจสอบ isSupported ก่อนใช้งาน
4. **Background Noise** - เสียงรบกวนอาจทำให้รู้จำเสียงผิดพลาด

## การปรับแต่ง

### เปลี่ยนเสียง TTS
```typescript
useTextToSpeech({
  language: 'th-TH',
  rate: 1.0,      // ความเร็ว (0.1-10)
  pitch: 1.0,     // ระดับเสียง (0-2)
  volume: 1.0     // ระดับเสียง (0-1)
})
```

### เปลี่ยนภาษา Speech Recognition
```typescript
useSpeechRecognition({
  language: 'en-US',  // เปลี่ยนเป็นภาษาอังกฤษ
  continuous: false,
  interimResults: true
})
```

## Future Enhancements

- [ ] เพิ่มการเลือกเสียง TTS (male/female)
- [ ] บันทึกประวัติการสนทนาด้วยเสียง
- [ ] Wake word detection
- [ ] Noise cancellation
- [ ] Multi-language support
- [ ] Voice activity detection (VAD)
- [ ] Custom voice models
