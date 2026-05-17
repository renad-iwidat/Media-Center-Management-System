# Integration Guide - TranscriptWithTimestamps Component

## 📋 Overview

The `TranscriptWithTimestamps` component displays transcripts with timestamps and an interactive audio player. It's ready to be integrated into the AudioProcessing component.

## 🔧 Integration Steps

### Step 1: Import the Component

In `frontend/src/components/ai/AudioProcessing.tsx`, add:

```typescript
import TranscriptWithTimestamps from './TranscriptWithTimestamps';
```

### Step 2: Add State for Segments

Add this state variable to store segments:

```typescript
const [resultSegments, setResultSegments] = useState<any[]>([]);
```

### Step 3: Update Result Handling

When you receive the response from the API, store both transcript and segments:

```typescript
// For production streaming extraction
if (extractRes.success && extractRes.data?.transcript) {
  setResult(extractRes.data.transcript);
  setResultSegments(extractRes.data.segments || []);
}

// For download-first method
if (downloadFirstRes.success && downloadFirstRes.data?.transcript) {
  setResult(downloadFirstRes.data.transcript);
  setResultSegments(downloadFirstRes.data.segments || []);
}

// For legacy method
if (extractRes.success && extractRes.data?.transcript) {
  setResult(extractRes.data.transcript);
  setResultSegments(extractRes.data.segments || []);
}
```

### Step 4: Replace Result Display

Find the result display section in AudioProcessing (around line 450+) and replace it with:

```typescript
{activeMode === 'STT' ? (
  result ? (
    <div className="w-full h-full flex flex-col text-right">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} className="text-blue-600" />
        <h4 className="text-sm font-bold text-gray-900">التفريغ النهائي</h4>
        {selectedFile && (
          <span className="text-xs text-gray-600 mr-auto">
            {selectedFile.display_name}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <TranscriptWithTimestamps
          transcript={result}
          segments={resultSegments}
          audioUrl={audioUrl}
          onSegmentClick={(startTime) => {
            console.log('Segment clicked at:', startTime);
          }}
        />
      </div>
    </div>
  ) : (
    <div className="opacity-30 flex flex-col items-center gap-3 text-gray-600">
      <Mic size={48} />
      <p className="text-sm">اختر ملفاً للتفريغ</p>
    </div>
  )
) : (
  // TTS mode remains the same
  ...
)}
```

### Step 5: Clear Segments on New Selection

When user selects a new file, clear the previous segments:

```typescript
const handleFileSelection = (fileId: number) => {
  setSelectedFileId(fileId);
  setResult(null);
  setResultSegments([]);
};
```

## 📝 Complete Example

Here's a minimal example of how to integrate:

```typescript
import React, { useState } from 'react';
import TranscriptWithTimestamps from './TranscriptWithTimestamps';

export default function AudioProcessing() {
  const [result, setResult] = useState<string | null>(null);
  const [resultSegments, setResultSegments] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSTT = async () => {
    try {
      const response = await api.processVideoToText(videoUrl, true);
      
      if (response.success) {
        setResult(response.data.transcript);
        setResultSegments(response.data.segments || []);
        setAudioUrl(response.data.audioUrl); // if available
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {result && (
        <TranscriptWithTimestamps
          transcript={result}
          segments={resultSegments}
          audioUrl={audioUrl}
        />
      )}
    </div>
  );
}
```

## 🎨 Component Features

### Props

```typescript
interface TranscriptWithTimestampsProps {
  transcript: string;              // Full transcript text
  segments?: Segment[];            // Array of segments with timestamps
  audioUrl?: string;               // URL to audio file for playback
  onSegmentClick?: (startTime: number) => void;  // Callback when segment is clicked
}

interface Segment {
  start: number;                   // Start time in seconds
  end: number;                     // End time in seconds
  text: string;                    // Segment text
  startFormatted: string;          // Formatted start time (HH:MM:SS.MS)
  endFormatted: string;            // Formatted end time (HH:MM:SS.MS)
}
```

### Features

1. **Audio Player**
   - Play/Pause button
   - Timeline with progress
   - Current time display
   - Duration display

2. **View Modes**
   - "Segments" - Shows each segment with timestamp
   - "Full Text" - Shows complete transcript

3. **Segment Interaction**
   - Click segment to play from that time
   - Current segment is highlighted during playback
   - Play button on each segment

4. **Actions**
   - Copy transcript to clipboard
   - Download transcript as .txt file

## 🔍 Testing

### Test 1: Verify Segments are Returned

```typescript
const response = await api.processVideoToText(videoUrl, true);
console.log('Segments:', response.data.segments);
// Should show array of segments with timestamps
```

### Test 2: Verify Component Renders

```typescript
<TranscriptWithTimestamps
  transcript="Sample text"
  segments={[
    {
      start: 0.5,
      end: 2.3,
      text: "Sample segment",
      startFormatted: "00:00:00.50",
      endFormatted: "00:00:02.30"
    }
  ]}
/>
```

### Test 3: Verify Audio Playback

- Click play button
- Audio should play
- Timeline should progress
- Current segment should highlight

## 🐛 Troubleshooting

### Segments Not Showing

1. Check if `includeTimestamps` is true in API call
2. Verify response includes `segments` array
3. Check browser console for errors

### Audio Not Playing

1. Verify `audioUrl` is provided
2. Check if audio file is accessible
3. Check browser console for CORS errors

### Timestamps Not Correct

1. Verify backend is calculating cumulative time correctly
2. Check if chunked processing is being used
3. Verify OpenAI API is returning verbose_json format

## 📚 Additional Resources

- See `TIMESTAMPS_IMPLEMENTATION.md` for backend details
- See `TIMESTAMPS_STATUS.md` for current status
- Check `TranscriptWithTimestamps.tsx` for component code

## ✅ Checklist

- [ ] Import TranscriptWithTimestamps component
- [ ] Add resultSegments state
- [ ] Update API calls to store segments
- [ ] Replace result display with new component
- [ ] Test with video file
- [ ] Test with audio file
- [ ] Verify timestamps are correct
- [ ] Test audio playback
- [ ] Test segment clicking
- [ ] Test copy/download functionality
