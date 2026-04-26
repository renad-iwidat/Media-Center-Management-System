# Speech-to-Text (STT) Service Documentation
# توثيق خدمة تحويل الصوت إلى نص

## Overview
The STT (Speech-to-Text) service integrates with an external AI model API to transcribe audio files into text. It supports multiple languages including Arabic, English, French, and more.

## Configuration

### Environment Variables
Add the following to your `.env` file:

```env
# AI Model Configuration
AI_MODEL=http://93.127.132.59:8080
```

The service will use the `/stt` endpoint on this URL for transcription.

## API Endpoints

### 1. Transcribe Audio from URL
**Endpoint:** `POST /api/ai-hub/stt/transcribe-url`

**Description:** Transcribe audio from a URL (S3 or any accessible URL)

**Request Body:**
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "language": "ar"
}
```

**Parameters:**
- `audioUrl` (required): URL of the audio file to transcribe
- `language` (optional): Language hint for transcription (default: "ar" for Arabic)

**Supported Audio Formats:**
- MP3
- WAV
- M4A
- OGG
- FLAC
- WEBM

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص المفرغ من الملف الصوتي",
    "language": "ar",
    "audioUrl": "https://example.com/audio.mp3"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### 2. Transcribe Audio from File
**Endpoint:** `POST /api/ai-hub/stt/transcribe-file`

**Description:** Transcribe audio from an uploaded file (using S3 URL)

**Request Body:**
```json
{
  "fileId": 123,
  "s3Url": "https://s3.example.com/uploads/audio-موجز-1234567890-usr5f3.mp3",
  "language": "ar"
}
```

**Parameters:**
- `fileId` (optional): ID of the uploaded file in the database
- `s3Url` (required): S3 URL of the audio file
- `language` (optional): Language hint for transcription (default: "ar" for Arabic)

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "transcript": "النص المفرغ من الملف الصوتي",
    "language": "ar",
    "s3Url": "https://s3.example.com/uploads/audio-موجز-1234567890-usr5f3.mp3"
  }
}
```

### 3. Get Supported Languages
**Endpoint:** `GET /api/ai-hub/stt/languages`

**Description:** Get list of supported languages for transcription

**Response:**
```json
{
  "success": true,
  "data": {
    "ar": "Arabic (العربية)",
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese",
    "ja": "Japanese"
  }
}
```

## Frontend Integration

### Using the API Client

```typescript
import { api } from '../../services/api';

// Transcribe from S3 URL
const result = await api.transcribeAudioFromFile(
  fileId,
  s3Url,
  'ar' // language
);

if (result.success) {
  console.log('Transcript:', result.data.transcript);
} else {
  console.error('Error:', result.error);
}
```

### In AudioProcessing Component

The `AudioProcessing.tsx` component has been updated to use the STT service:

```typescript
const handleSTT = async () => {
  if (!selectedFileId) return;

  const file = uploadedFiles.find(f => f.id === selectedFileId);
  if (!file) return;

  setIsLoading(true);
  setResult(null);
  try {
    const res = await api.transcribeAudioFromFile(file.id, file.s3_url, 'ar');
    
    if (res.success && res.data?.transcript) {
      setResult(res.data.transcript);
    } else {
      throw new Error(res.error || 'Failed to transcribe audio');
    }
  } catch (error) {
    setResult('حدث خطأ أثناء التفريغ الصوتي: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};
```

## Backend Service

### STT Service (`src/services/ai-hub/stt.service.ts`)

The service provides two main functions:

#### `transcribeAudioFromUrl(audioUrl, options)`
Transcribe audio from a URL by downloading it first.

```typescript
import { transcribeAudioFromUrl } from '../../services/ai-hub/stt.service';

const transcript = await transcribeAudioFromUrl(
  'https://example.com/audio.mp3',
  { language: 'ar', timeout: 60000 }
);
```

#### `transcribeAudioFromFile(filePath, options)`
Transcribe audio from a local file path.

```typescript
import { transcribeAudioFromFile } from '../../services/ai-hub/stt.service';

const transcript = await transcribeAudioFromFile(
  '/path/to/audio.mp3',
  { language: 'ar', timeout: 60000 }
);
```

### STT Controller (`src/controllers/ai-hub/stt.controller.ts`)

Handles HTTP requests and responses for STT operations.

## Workflow

### User Flow in Frontend

1. User selects an audio file from the uploaded files list
2. User clicks "بدء التفريغ" (Start Transcription) button
3. Frontend calls `api.transcribeAudioFromFile()` with the file's S3 URL
4. Backend downloads the audio from S3
5. Backend sends audio to external STT API
6. Backend receives transcript and returns it to frontend
7. Frontend displays the transcript in the result panel

### Technical Flow

```
Frontend (AudioProcessing.tsx)
    ↓
API Client (api.ts)
    ↓
Backend Route (stt.routes.ts)
    ↓
STT Controller (stt.controller.ts)
    ↓
STT Service (stt.service.ts)
    ↓
External STT API (http://93.127.132.59:8080/stt)
    ↓
Response back through the chain
```

## Error Handling

The service includes comprehensive error handling:

- **Network Errors:** Caught and logged with descriptive messages
- **API Errors:** HTTP status codes and error messages from the STT API
- **File Errors:** Missing files or invalid URLs
- **Timeout Errors:** Configurable timeout (default: 60 seconds)

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AI_MODEL environment variable is not configured` | Missing AI_MODEL in .env | Add `AI_MODEL=http://93.127.132.59:8080` to .env |
| `Failed to download audio: 404` | Audio URL is invalid or file not found | Verify the S3 URL is correct and accessible |
| `STT API error: 500` | External STT API error | Check if the STT API is running and accessible |
| `No transcript returned from STT API` | API returned empty response | Check audio file format and quality |

## Logging

The service includes detailed logging for debugging:

```
🎙️  [2024-01-15T10:30:45.123Z] Starting STT Transcription
🌐 STT API URL: http://93.127.132.59:8080/stt
📥 Audio URL: https://s3.example.com/audio.mp3
🗣️  Language: ar
📥 Downloading audio file...
✅ Audio downloaded (1234567 bytes)
📤 Sending to STT API...
⏱️  Response Time: 5234ms
📊 Status: 200 OK
📥 STT Response: {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  status: "completed",
  language: "ar",
  transcriptLength: 456
}
✅ Transcription completed (456 characters)
```

## Performance Considerations

- **Timeout:** Default 60 seconds per transcription
- **File Size:** Supports files up to the API's limit (typically 25MB)
- **Concurrent Requests:** Each request is independent; multiple transcriptions can run in parallel
- **Caching:** Consider caching transcripts for the same audio file

## Security

- Audio files are downloaded and processed server-side
- No audio files are stored permanently on the server
- S3 URLs must be publicly accessible or have proper credentials
- API communication uses HTTPS when available

## Testing

### Test Transcription Endpoint

```bash
curl -X POST http://localhost:4000/api/ai-hub/stt/transcribe-url \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/audio.mp3",
    "language": "ar"
  }'
```

### Test File Transcription

```bash
curl -X POST http://localhost:4000/api/ai-hub/stt/transcribe-file \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": 123,
    "s3Url": "https://s3.example.com/uploads/audio.mp3",
    "language": "ar"
  }'
```

### Get Supported Languages

```bash
curl http://localhost:4000/api/ai-hub/stt/languages
```

## Future Enhancements

- [ ] Add support for real-time streaming transcription
- [ ] Implement transcript caching
- [ ] Add speaker diarization (identifying different speakers)
- [ ] Support for custom vocabulary/domain-specific terms
- [ ] Batch transcription for multiple files
- [ ] Webhook notifications for long-running transcriptions
- [ ] Transcript editing and correction UI
- [ ] Export transcripts in multiple formats (PDF, DOCX, SRT)

## Dependencies

- `form-data`: For multipart form data handling when sending audio files
- `node-fetch`: Built-in fetch API for HTTP requests

## Related Documentation

- [Audio Processing Component](./USER_INPUT_PANEL_INTEGRATION.md)
- [TTS Service Documentation](./TTS_SERVICE_DOCUMENTATION.md)
- [API Reference](./API_REFERENCE.md)
