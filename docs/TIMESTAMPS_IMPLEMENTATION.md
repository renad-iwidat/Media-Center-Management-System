# Timestamps Implementation Guide

## ✅ Backend Implementation

### 1. **Video-to-Text Controller** (`src/controllers/ai-hub/video-to-text.controller.ts`)
- ✅ Returns `segments` array with timestamps
- ✅ Handles chunked processing with correct timestamp adjustment
- ✅ Supports both single file and S3 processing

**Response Format:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص الكامل...",
    "segments": [
      {
        "start": 0.5,
        "end": 2.3,
        "text": "جزء من النص",
        "startFormatted": "00:00:00.50",
        "endFormatted": "00:00:02.30"
      }
    ],
    "segmentCount": 45
  }
}
```

### 2. **Streaming Extraction Controller** (`src/controllers/ai-hub/streaming-extraction.controller.ts`)
- ✅ `extractAndTranscribe()` - Returns segments with correct timestamps
- ✅ `extractWithDownloadFirst()` - Returns segments with correct timestamps
- ✅ Calculates cumulative time for chunked processing

### 3. **Audio Extraction Controller** (`src/controllers/ai-hub/audio-extraction.controller.ts`)
- ✅ `extractAndTranscribe()` - Returns segments with correct timestamps
- ✅ Handles S3 video processing with timestamp support

### 4. **OpenAI STT Service** (`src/services/ai-hub/openai-stt.service.ts`)
- ✅ Uses `verbose_json` format when `includeTimestamps: true`
- ✅ Returns segments with `start`, `end`, `text`, `duration`
- ✅ Provides `formatTimestamp()` function for HH:MM:SS.MS format

## ✅ Frontend Implementation

### 1. **API Service** (`frontend/src/services/api.ts`)
- ✅ `processVideoToText()` - Accepts `includeTimestamps` parameter
- ✅ `processVideoToTextFromS3()` - Accepts `includeTimestamps` parameter
- ✅ `extractAndTranscribeProduction()` - Accepts `includeTimestamps` parameter
- ✅ `extractWithDownloadFirst()` - Accepts `includeTimestamps` parameter
- ✅ `extractAudioAndTranscribe()` - Accepts `includeTimestamps` parameter

### 2. **TranscriptWithTimestamps Component** (`frontend/src/components/ai/TranscriptWithTimestamps.tsx`)
- ✅ Displays segments with timestamps
- ✅ Audio player with timeline
- ✅ Click on segment to play from that time
- ✅ Highlights current segment during playback
- ✅ Two view modes: "Segments" and "Full Text"
- ✅ Copy and download functionality

## 🔧 How to Use

### Backend Usage

```typescript
// Video-to-Text with timestamps
const response = await api.processVideoToText(videoUrl, true);
// Returns: { transcript, segments, segmentCount }

// Streaming Extraction with timestamps
const response = await api.extractAndTranscribeProduction(videoUrl, {
  includeTimestamps: true
});
// Returns: { transcript, segments, segmentCount }
```

### Frontend Usage

```typescript
import TranscriptWithTimestamps from '@/components/ai/TranscriptWithTimestamps';

// In your component
<TranscriptWithTimestamps
  transcript={data.transcript}
  segments={data.segments}
  audioUrl={audioUrl}
  onSegmentClick={(startTime) => console.log('Clicked at:', startTime)}
/>
```

## 📊 Timestamp Calculation

### Single File Processing
- Timestamps are returned directly from OpenAI Whisper API
- Format: `HH:MM:SS.MS` (e.g., "00:05:23.45")

### Chunked Processing
- Each chunk is processed separately
- Cumulative time is calculated based on chunk duration
- Formula: `segment.start = segment.start + cumulativeTime`

Example:
```
Chunk 1 (0-300s):
  Segment: start=2.5, end=5.3
  Adjusted: start=2.5, end=5.3

Chunk 2 (300-600s):
  Segment: start=1.2, end=3.8
  Adjusted: start=301.2, end=303.8 (300 + 1.2, 300 + 3.8)
```

## ✅ Verification Checklist

- [x] Backend returns segments with timestamps
- [x] Timestamps are correctly adjusted for chunked processing
- [x] Frontend API accepts `includeTimestamps` parameter
- [x] TranscriptWithTimestamps component displays segments
- [x] Audio player syncs with segments
- [x] Click on segment plays from that time
- [x] Current segment is highlighted during playback

## 🚀 Next Steps

1. **Integrate TranscriptWithTimestamps into AudioProcessing component**
   - Update the result display to show segments when available
   - Pass segments data to the new component

2. **Add timestamp display to other components**
   - NewsRoom component
   - ChatInterface component
   - Any other component that displays transcripts

3. **Enhance UI/UX**
   - Add search within segments
   - Add export to SRT format
   - Add segment editing capabilities
   - Add speaker identification (if available)

## 📝 Notes

- Default `includeTimestamps` is `true` for all endpoints
- Timestamps are only available when using OpenAI Whisper API
- For very long audio (>1 hour), chunked processing is automatic
- Each chunk is processed independently, then combined with adjusted timestamps
