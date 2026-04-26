# STT Integration - Quick Start Guide
# دليل البدء السريع لتكامل خدمة تحويل الصوت إلى نص

## ✅ What's Been Done

The Speech-to-Text (STT) service has been fully integrated into your Media Center system. Here's what was implemented:

### Backend
- ✅ STT Service (`src/services/ai-hub/stt.service.ts`)
- ✅ STT Controller (`src/controllers/ai-hub/stt.controller.ts`)
- ✅ STT Routes (`src/routes/ai-hub/stt.routes.ts`)
- ✅ Route Registration in main `src/index.ts`

### Frontend
- ✅ API Methods in `frontend-mearg/src/services/api.ts`
- ✅ Updated `AudioProcessing.tsx` component to use STT service

### Configuration
- ✅ Added `form-data` dependency to `package.json`

### Documentation
- ✅ Comprehensive STT documentation (`docs/STT_SERVICE_DOCUMENTATION.md`)
- ✅ Integration summary (`STT_INTEGRATION_SUMMARY.md`)

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

This will install the `form-data` package needed for audio file handling.

### 2. Configure Environment
Make sure your `.env` file has:
```env
AI_MODEL=http://93.127.132.59:8080
```

### 3. Start the Backend Server
```bash
npm run dev
```

You should see:
```
✅ Server running on port 4000
📝 Environment: development
```

### 4. Start the Frontend
```bash
cd frontend-mearg
npm run dev
```

## 📝 How to Use

### In the Frontend (Audio Processing Component)

1. **Navigate to the Audio Processing section** (المختبر الصوتي)
2. **Select "صوت لنص (STT)"** tab
3. **Choose an audio file** from the uploaded files list
4. **Click "بدء التفريغ"** (Start Transcription)
5. **Wait for the transcription** to complete
6. **View the transcript** in the result panel

### API Endpoints

#### Transcribe from URL
```bash
curl -X POST http://localhost:4000/api/ai-hub/stt/transcribe-url \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://s3.example.com/audio.mp3",
    "language": "ar"
  }'
```

#### Transcribe from File
```bash
curl -X POST http://localhost:4000/api/ai-hub/stt/transcribe-file \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": 123,
    "s3Url": "https://s3.example.com/audio.mp3",
    "language": "ar"
  }'
```

#### Get Supported Languages
```bash
curl http://localhost:4000/api/ai-hub/stt/languages
```

## 🎯 Key Features

### Supported Audio Formats
- MP3
- WAV
- M4A
- OGG
- FLAC
- WEBM

### Supported Languages
- Arabic (العربية) - ar
- English - en
- French - fr
- Spanish - es
- German - de
- Italian - it
- Portuguese - pt
- Russian - ru
- Chinese - zh
- Japanese - ja

### Default Settings
- **Default Language:** Arabic (ar)
- **Default Timeout:** 60 seconds
- **Max File Size:** Up to API limit (typically 25MB)

## 📊 How It Works

```
User selects audio file
        ↓
Clicks "بدء التفريغ"
        ↓
Frontend calls api.transcribeAudioFromFile()
        ↓
Backend receives request
        ↓
Backend downloads audio from S3
        ↓
Backend sends to external STT API (http://93.127.132.59:8080/stt)
        ↓
External API transcribes audio
        ↓
Backend returns transcript
        ↓
Frontend displays transcript
```

## 🔍 Testing

### Test 1: Check if STT API is accessible
```bash
curl http://localhost:4000/api/ai-hub/stt/languages
```

Expected response:
```json
{
  "success": true,
  "data": {
    "ar": "Arabic (العربية)",
    "en": "English",
    ...
  }
}
```

### Test 2: Transcribe a test audio file
```bash
curl -X POST http://localhost:4000/api/ai-hub/stt/transcribe-url \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/test-audio.mp3",
    "language": "ar"
  }'
```

### Test 3: Use the frontend component
1. Upload an audio file through the UI
2. Go to Audio Processing → STT tab
3. Select the file and click "بدء التفريغ"
4. Check the browser console for logs

## 🐛 Troubleshooting

### Issue: "AI_MODEL environment variable is not configured"
**Solution:** Add `AI_MODEL=http://93.127.132.59:8080` to `.env`

### Issue: "Failed to download audio: 404"
**Solution:** Verify the audio URL is correct and accessible

### Issue: "STT API error: 500"
**Solution:** Check if the external STT API is running at `http://93.127.132.59:8080`

### Issue: "No transcript returned from STT API"
**Solution:** 
- Verify audio file format is supported
- Check audio quality
- Try with a different audio file

### Issue: Transcription takes too long
**Solution:** 
- Check network connection
- Verify the external STT API is responsive
- Try with a shorter audio file

## 📚 Documentation

For detailed information, see:
- **Full Documentation:** `docs/STT_SERVICE_DOCUMENTATION.md`
- **Integration Summary:** `STT_INTEGRATION_SUMMARY.md`
- **API Reference:** `docs/API_REFERENCE.md`

## 🔧 Configuration Options

### Change Default Language
In `frontend-mearg/src/components/ai/AudioProcessing.tsx`:
```typescript
// Change this line:
const res = await api.transcribeAudioFromFile(file.id, file.s3_url, 'ar');

// To your preferred language:
const res = await api.transcribeAudioFromFile(file.id, file.s3_url, 'en');
```

### Change Timeout
In `src/services/ai-hub/stt.service.ts`:
```typescript
// Change this line:
const timeout = options.timeout || 60000; // 60 seconds

// To your preferred timeout (in milliseconds):
const timeout = options.timeout || 120000; // 120 seconds
```

## 📈 Performance Tips

1. **Use appropriate audio quality** - Higher quality = better transcription but slower
2. **Keep audio files under 25MB** - Larger files may timeout
3. **Use Arabic language hint for Arabic audio** - Improves accuracy
4. **Monitor server logs** - Check response times and adjust timeout if needed

## 🔐 Security Notes

- Audio files are downloaded and processed server-side
- No audio files are stored permanently
- S3 URLs must be publicly accessible
- All requests are logged for audit purposes
- Consider implementing rate limiting for production

## 📞 Support

If you encounter issues:

1. **Check the logs** - Look for detailed error messages in console
2. **Verify configuration** - Ensure `.env` has correct `AI_MODEL` URL
3. **Test the API** - Use curl to test endpoints directly
4. **Review documentation** - See `docs/STT_SERVICE_DOCUMENTATION.md`

## ✨ Next Steps

1. ✅ Test the STT integration with various audio files
2. ✅ Monitor performance and adjust settings as needed
3. 📋 Consider implementing transcript caching
4. 📋 Add support for batch transcription
5. 📋 Implement transcript editing UI
6. 📋 Add export functionality (PDF, DOCX, SRT)

## 📝 Files Modified/Created

### Created Files
- `src/services/ai-hub/stt.service.ts`
- `src/controllers/ai-hub/stt.controller.ts`
- `src/routes/ai-hub/stt.routes.ts`
- `docs/STT_SERVICE_DOCUMENTATION.md`
- `STT_INTEGRATION_SUMMARY.md`
- `STT_QUICK_START.md` (this file)

### Modified Files
- `src/controllers/ai-hub/index.ts`
- `src/routes/ai-hub/index.ts`
- `src/index.ts`
- `frontend-mearg/src/services/api.ts`
- `frontend-mearg/src/components/ai/AudioProcessing.tsx`
- `package.json`

## 🎉 You're All Set!

The STT integration is complete and ready to use. Start transcribing audio files to Arabic text right away!

For any questions or issues, refer to the comprehensive documentation in `docs/STT_SERVICE_DOCUMENTATION.md`.
