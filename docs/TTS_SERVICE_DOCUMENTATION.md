# Text-to-Speech (TTS) Service Documentation

## Overview
خدمة تحويل النص إلى صوت باستخدام OpenAI API مع دعم أصوات متعددة.

## Backend Implementation

### Service: `src/services/ai-hub/tts.service.ts`

#### Functions

**`textToSpeech(text: string, voice: TTSVoice): Promise<Buffer>`**
- تحويل النص إلى صوت وإرجاع Buffer
- المعاملات:
  - `text`: النص المراد تحويله
  - `voice`: نوع الصوت (alloy, echo, fable, onyx, nova, shimmer)
- الإرجاع: Buffer يحتوي على ملف صوتي MP3

**`textToSpeechBase64(text: string, voice: TTSVoice): Promise<string>`**
- تحويل النص إلى صوت وإرجاع base64
- مفيد للإرسال عبر JSON

**`getAvailableVoices(): Record<TTSVoice, { name: string; description: string }>`**
- الحصول على قائمة الأصوات المتاحة

### Controller: `src/controllers/ai-hub/tts.controller.ts`

#### Endpoints

**POST `/api/ai-hub/tts/generate`**
- تحويل النص إلى صوت
- Request Body:
  ```json
  {
    "text": "النص المراد تحويله",
    "voice": "nova"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "audioBase64": "SUQzBAAAAAAAI1NUVEUAAAAOAAAAU3RhcnRpbmcgQXVkaW8=",
    "mimeType": "audio/mpeg",
    "remaining": 99,
    "resetTime": 1234567890
  }
  ```

**GET `/api/ai-hub/tts/voices`**
- الحصول على قائمة الأصوات المتاحة
- Response:
  ```json
  {
    "success": true,
    "voices": {
      "nova": {
        "name": "Nova",
        "description": "Bright, energetic voice"
      },
      "shimmer": {
        "name": "Shimmer",
        "description": "Clear, crisp voice"
      },
      "onyx": {
        "name": "Onyx",
        "description": "Deep, professional voice"
      },
      "echo": {
        "name": "Echo",
        "description": "Warm, friendly voice"
      }
    }
  }
  ```

## Frontend Implementation

### API Service: `frontend-mearg/src/services/api.ts`

```typescript
// Generate TTS
api.generateTTS(text: string, voice: string = 'nova')

// Get available voices
api.getTTSVoices()
```

### Component: `frontend-mearg/src/components/ai/AudioProcessing.tsx`

#### Features
- اختيار مصدر النص (نص مباشر أو أخبار منشورة)
- اختيار الصوت (nova, shimmer, onyx, echo)
- تشغيل الصوت المُنتج
- تحميل الملف الصوتي

#### Available Voices
- **Nova** (أنثى) - صوت مشرق وحيوي
- **Shimmer** (أنثى) - صوت واضح وحاد
- **Onyx** (ذكر) - صوت عميق واحترافي
- **Echo** (ذكر) - صوت دافئ وودود

## Environment Variables

```env
OPENAI_API_KEY=sk-...
```

## Rate Limiting

الخدمة تستخدم نفس نظام Rate Limiting الموجود في AI Hub:
- 100 طلب لكل ساعة لكل عنوان IP
- يتم إرجاع `remaining` و `resetTime` في الـ Response

## Error Handling

### Common Errors

1. **Empty Text**
   ```json
   {
     "success": false,
     "error": "Text cannot be empty"
   }
   ```

2. **Invalid Voice**
   ```json
   {
     "success": false,
     "error": "Invalid voice. Must be one of: alloy, echo, fable, onyx, nova, shimmer"
   }
   ```

3. **Rate Limit Exceeded**
   ```json
   {
     "success": false,
     "error": "Rate limit exceeded. Please try again later.",
     "remaining": 0,
     "resetTime": 1234567890
   }
   ```

4. **OpenAI API Error**
   ```json
   {
     "success": false,
     "error": "OpenAI API error: 401 Unauthorized - Invalid API key"
   }
   ```

## Usage Example

### Frontend
```typescript
// Generate TTS
const response = await api.generateTTS('مرحبا بك', 'nova');

if (response.success) {
  // Convert base64 to blob
  const binaryString = atob(response.audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Play audio
  const audio = new Audio(audioUrl);
  audio.play();
}
```

### Backend
```typescript
import { textToSpeech, getAvailableVoices } from './services/ai-hub/tts.service';

// Generate audio
const audioBuffer = await textToSpeech('مرحبا بك', 'nova');

// Get available voices
const voices = getAvailableVoices();
```

## Language Support

✅ **العربية** - مدعومة بالكامل
✅ **English** - مدعومة بالكامل
✅ **جميع اللغات المدعومة من OpenAI** - مدعومة

OpenAI TTS API يدعم النصوص بالعربية والإنجليزية وجميع اللغات الأخرى. يتم معالجة النصوص بشكل صحيح مع الحفاظ على الترتيب والتشكيل.

- الطلب الأول قد يستغرق 2-3 ثواني
- الطلبات اللاحقة عادة ما تستغرق 1-2 ثانية
- حجم الملف الصوتي يعتمد على طول النص (عادة 50-200 KB)

## Future Enhancements

- [ ] دعم لغات أخرى
- [ ] تخزين مؤقت للملفات الصوتية
- [ ] دعم تحميل الملفات الصوتية
- [ ] تحسين جودة الصوت
- [ ] دعم تأثيرات صوتية
