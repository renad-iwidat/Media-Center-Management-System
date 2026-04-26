# Audio Extraction Service Documentation
# توثيق خدمة استخراج الصوت من الفيديو

## Overview
The Audio Extraction service allows you to extract audio from video files and convert them to various audio formats. This is particularly useful for transcribing video content to text.

## Prerequisites

### FFmpeg Installation
This service requires FFmpeg to be installed on your system.

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

**Verify Installation:**
```bash
ffmpeg -version
ffprobe -version
```

## Configuration

### Environment Variables
No additional environment variables are required beyond the existing setup.

## API Endpoints

### 1. Extract Audio from File
**Endpoint:** `POST /api/ai-hub/audio-extraction/extract-from-file`

**Description:** Extract audio from a local video file

**Request Body:**
```json
{
  "videoFilePath": "/path/to/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```

**Parameters:**
- `videoFilePath` (required): Path to the video file
- `outputFormat` (optional): Output audio format (default: "mp3")
  - Supported: mp3, wav, aac, flac, ogg
- `bitrate` (optional): Audio bitrate (default: "128k")
  - Examples: 64k, 128k, 192k, 256k, 320k

**Response:**
```json
{
  "success": true,
  "data": {
    "audioBase64": "base64 encoded audio data",
    "audioSize": 1234567,
    "format": "mp3",
    "bitrate": "128k"
  }
}
```

### 2. Extract Audio from URL
**Endpoint:** `POST /api/ai-hub/audio-extraction/extract-from-url`

**Description:** Extract audio from a video URL

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```

**Parameters:**
- `videoUrl` (required): URL of the video file
- `outputFormat` (optional): Output audio format (default: "mp3")
- `bitrate` (optional): Audio bitrate (default: "128k")

**Response:**
```json
{
  "success": true,
  "data": {
    "audioBase64": "base64 encoded audio data",
    "audioSize": 1234567,
    "format": "mp3",
    "bitrate": "128k",
    "videoUrl": "https://example.com/video.mp4"
  }
}
```

### 3. Extract Audio from S3
**Endpoint:** `POST /api/ai-hub/audio-extraction/extract-from-s3`

**Description:** Extract audio from a video file stored in S3

**Request Body:**
```json
{
  "fileId": 123,
  "s3Url": "https://s3.example.com/uploads/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```

**Parameters:**
- `fileId` (optional): ID of the uploaded file in the database
- `s3Url` (required): S3 URL of the video file
- `outputFormat` (optional): Output audio format (default: "mp3")
- `bitrate` (optional): Audio bitrate (default: "128k")

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "audioBase64": "base64 encoded audio data",
    "audioSize": 1234567,
    "format": "mp3",
    "bitrate": "128k",
    "s3Url": "https://s3.example.com/uploads/video.mp4"
  }
}
```

### 4. Get Video Information
**Endpoint:** `POST /api/ai-hub/audio-extraction/video-info`

**Description:** Get detailed information about a video file

**Request Body:**
```json
{
  "videoFilePath": "/path/to/video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "format": {
      "filename": "video.mp4",
      "nb_streams": 2,
      "nb_programs": 0,
      "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
      "format_long_name": "QuickTime / MOV",
      "start_time": "0.000000",
      "duration": "120.500000",
      "size": "50000000",
      "bit_rate": "3333333"
    },
    "streams": [
      {
        "index": 0,
        "codec_type": "video",
        "codec_name": "h264",
        "width": 1920,
        "height": 1080,
        "r_frame_rate": "30/1"
      },
      {
        "index": 1,
        "codec_type": "audio",
        "codec_name": "aac",
        "sample_rate": "48000",
        "channels": 2
      }
    ],
    "duration": 120.5,
    "bitrate": 3333333,
    "hasAudio": true,
    "hasVideo": true
  }
}
```

### 5. Get Supported Formats
**Endpoint:** `GET /api/ai-hub/audio-extraction/formats`

**Description:** Get list of supported video and audio formats

**Response:**
```json
{
  "success": true,
  "data": {
    "videoFormats": [
      "mp4", "avi", "mov", "mkv", "flv", "wmv", "webm", "ogv", "3gp", "ts", "mts", "m2ts"
    ],
    "audioFormats": [
      "mp3", "wav", "aac", "flac", "ogg"
    ]
  }
}
```

## Frontend Integration

### Using the API Client

```typescript
import { api } from '../../services/api';

// Extract audio from S3 video
const result = await api.extractAudioFromS3(
  fileId,
  s3Url,
  'mp3',  // output format
  '128k'  // bitrate
);

if (result.success) {
  // Convert base64 to blob
  const binaryString = atob(result.data.audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Use the audio URL for transcription or playback
  console.log('Audio extracted:', audioUrl);
} else {
  console.error('Error:', result.error);
}
```

### In AudioProcessing Component

The component automatically handles video files:

```typescript
const handleSTT = async () => {
  const file = uploadedFiles.find(f => f.id === selectedFileId);
  
  if (file.file_type === 'video') {
    // Extract audio from video
    const extractRes = await api.extractAudioFromS3(file.id, file.s3_url, 'mp3', '128k');
    
    // Convert to blob and transcribe
    const audioBlob = new Blob([...], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Transcribe the extracted audio
    const transcribeRes = await api.transcribeAudioFromUrl(audioUrl, 'ar');
  }
};
```

## Supported Formats

### Video Formats
- MP4
- AVI
- MOV
- MKV
- FLV
- WMV
- WEBM
- OGV
- 3GP
- TS
- MTS
- M2TS

### Audio Output Formats
- MP3 (MPEG Audio)
- WAV (Waveform Audio)
- AAC (Advanced Audio Coding)
- FLAC (Free Lossless Audio Codec)
- OGG (Ogg Vorbis)

## Workflow

### Video to Text Transcription Flow

```
User selects video file
        ↓
Clicks "بدء التفريغ"
        ↓
Frontend calls api.extractAudioFromS3()
        ↓
Backend downloads video from S3
        ↓
Backend uses FFmpeg to extract audio
        ↓
Backend returns audio as base64
        ↓
Frontend converts base64 to blob
        ↓
Frontend calls api.transcribeAudioFromUrl()
        ↓
Backend transcribes audio using STT API
        ↓
Frontend displays transcript
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `FFmpeg is not installed` | FFmpeg not found on system | Install FFmpeg (see Prerequisites) |
| `Video file not found` | Invalid file path | Verify the file path is correct |
| `Failed to download video` | Invalid URL or network error | Check URL accessibility |
| `FFmpeg extraction failed` | Video format not supported | Use a supported video format |
| `No audio stream found` | Video has no audio track | Use a video with audio |

## Performance Considerations

- **Extraction Time:** Depends on video length and bitrate
  - 1 minute video: ~5-10 seconds
  - 10 minute video: ~30-60 seconds
  - 1 hour video: ~5-10 minutes
- **File Size:** Depends on bitrate
  - 128k bitrate: ~1MB per minute
  - 192k bitrate: ~1.5MB per minute
  - 256k bitrate: ~2MB per minute
- **Memory Usage:** Streams data to avoid loading entire file in memory
- **Timeout:** Default 5 minutes (300 seconds)

## Security

- Video files are downloaded and processed server-side
- No video files are stored permanently
- Audio extraction is temporary
- S3 URLs must be publicly accessible
- All operations are logged

## Testing

### Test Audio Extraction

```bash
# Extract audio from S3 video
curl -X POST http://localhost:4000/api/ai-hub/audio-extraction/extract-from-s3 \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": 123,
    "s3Url": "https://s3.example.com/video.mp4",
    "outputFormat": "mp3",
    "bitrate": "128k"
  }'

# Get video information
curl -X POST http://localhost:4000/api/ai-hub/audio-extraction/video-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoFilePath": "/path/to/video.mp4"
  }'

# Get supported formats
curl http://localhost:4000/api/ai-hub/audio-extraction/formats
```

## Advanced Usage

### Custom Bitrate
```typescript
// High quality audio (320k)
const result = await api.extractAudioFromS3(fileId, s3Url, 'mp3', '320k');

// Low quality audio (64k)
const result = await api.extractAudioFromS3(fileId, s3Url, 'mp3', '64k');
```

### Different Audio Formats
```typescript
// Extract as WAV
const result = await api.extractAudioFromS3(fileId, s3Url, 'wav', '128k');

// Extract as AAC
const result = await api.extractAudioFromS3(fileId, s3Url, 'aac', '128k');

// Extract as FLAC (lossless)
const result = await api.extractAudioFromS3(fileId, s3Url, 'flac', '128k');
```

## Troubleshooting

### FFmpeg Not Found
```bash
# Check if FFmpeg is installed
ffmpeg -version

# If not installed, install it:
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

### Video Format Not Supported
- Ensure the video file is in a supported format
- Try converting the video using FFmpeg:
```bash
ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4
```

### Audio Extraction Takes Too Long
- Check system resources (CPU, memory)
- Try reducing bitrate
- Check network connection if downloading from URL

### No Audio Stream in Video
- Verify the video has an audio track
- Use `ffprobe` to check:
```bash
ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 video.mp4
```

## Future Enhancements

- [ ] Support for more audio formats (OPUS, VORBIS)
- [ ] Batch video processing
- [ ] Audio normalization
- [ ] Noise reduction
- [ ] Audio effects (fade in/out)
- [ ] Subtitle extraction
- [ ] Video thumbnail extraction
- [ ] Streaming extraction for large files

## Related Documentation

- [STT Service Documentation](./STT_SERVICE_DOCUMENTATION.md)
- [Audio Processing Component](./USER_INPUT_PANEL_INTEGRATION.md)
- [API Reference](./API_REFERENCE.md)

## Dependencies

- `ffmpeg` - System dependency for audio/video processing
- `ffprobe` - System dependency for media information
- `child_process` - Node.js built-in for executing FFmpeg
- `fs` - Node.js built-in for file operations
- `path` - Node.js built-in for path operations
