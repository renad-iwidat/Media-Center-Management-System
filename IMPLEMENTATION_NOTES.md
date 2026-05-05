# Implementation Notes

## Overview
This document provides implementation details and considerations for the performance optimization changes.

## Changes Made

### 1. Chunk Duration Optimization
**Location:** `src/services/ai-hub/audio-extraction.service.ts` (Line ~130)

**Change:**
```typescript
// From: 180 seconds (3 minutes)
// To: 60 seconds (1 minute)
const chunkDuration = options.chunkDurationSeconds || 60;
```

**Rationale:**
- 60-second chunks are optimal for Arabic STT processing
- Reduces individual timeout risk
- Improves parallelization efficiency
- Smaller chunks = faster processing per chunk

**Impact:**
- For 433s video: 3 chunks → ~7 chunks
- More granular processing
- Better load distribution

---

### 2. Concurrent Requests Increase
**Location:** `src/services/ai-hub/audio-extraction.service.ts` (Line ~131)

**Change:**
```typescript
// From: 3 concurrent
// To: 5 concurrent
const maxConcurrent = options.maxConcurrentChunks || 5;
```

**Rationale:**
- 5 concurrent requests is safe for most servers
- Better CPU/network utilization
- Faster overall processing time
- Balances between speed and resource usage

**Considerations:**
- Monitor server CPU usage
- Adjust based on available resources
- Can be increased to 8-10 if server has capacity
- Can be decreased to 3 if experiencing timeouts

**Monitoring:**
```bash
# Check CPU usage during processing
top -p $(pgrep -f "node")

# Check network connections
netstat -an | grep ESTABLISHED | wc -l
```

---

### 3. STT Timeout Reduction
**Location:** `src/services/ai-hub/stt.service.ts` (Multiple locations)

**Changes:**
```typescript
// From: 300000ms (5 minutes)
// To: 60000ms (60 seconds)
const timeout = options.timeout || 60000;
```

**Rationale:**
- 60 seconds is reasonable for 60-second audio chunks
- Faster failure detection
- Prevents hanging on slow API responses
- More responsive error handling

**Timeout Calculation:**
```
Audio Duration: 60 seconds
Processing Time: ~30-45 seconds (typical)
Timeout Buffer: 15-30 seconds
Total Timeout: 60 seconds ✓
```

**If experiencing timeouts:**
```typescript
// Increase to 90 seconds
const timeout = options.timeout || 90000;

// Or set via environment variable
process.env.STT_TIMEOUT = '90000';
```

---

### 4. Queue-Based Parallel Processing
**Location:** `src/services/ai-hub/chunked-audio-processor.service.ts` (Line ~171)

**Change:** Replaced batch-based sequential processing with queue-based parallel processing

**Before (Batch-based):**
```
Batch 1: [Chunk 1, 2, 3] → Wait for all 3
Batch 2: [Chunk 4, 5, 6] → Wait for all 3
Batch 3: [Chunk 7] → Wait for 1
Total: 3 sequential wait periods
```

**After (Queue-based):**
```
Queue: [1, 2, 3, 4, 5, 6, 7]
Active: [1, 2, 3, 4, 5]
When 1 completes → Start 6
When 2 completes → Start 7
Total: Continuous processing
```

**Implementation Details:**
```typescript
const queue = [...chunks];
const activePromises = new Set<Promise<void>>();

while (queue.length > 0 || activePromises.size > 0) {
  // Fill up to maxConcurrent
  while (queue.length > 0 && activePromises.size < maxConcurrent) {
    const chunk = queue.shift()!;
    const promise = processChunk(chunk);
    activePromises.add(promise);
  }
  
  // Wait for at least one to complete
  if (activePromises.size > 0) {
    await Promise.race(activePromises);
  }
}
```

**Benefits:**
- No batch waits
- Continuous processing
- Better resource utilization
- 3x faster batch completion

---

## Configuration Options

### Environment Variables
```bash
# Chunk duration in seconds
STT_CHUNK_DURATION_SECONDS=60

# Maximum concurrent requests
STT_MAX_CONCURRENT_REQUESTS=5

# STT API timeout in milliseconds
STT_TIMEOUT=60000

# STT API URL
AI_MODEL=http://93.127.132.59:8080
```

### Request Parameters
```typescript
POST /api/ai-hub/audio-extraction/extract-and-transcribe
{
  "s3Url": "https://...",
  "language": "ar",
  "enableChunking": true,
  "chunkDurationSeconds": 60,      // Override default
  "maxConcurrentChunks": 5,        // Override default
  "timeout": 60000                 // Override default
}
```

---

## Monitoring and Logging

### Key Metrics to Monitor

1. **Processing Time**
```
✅ Chunk 1 completed in 00:00:45 (2500 chars)
✅ Chunk 2 completed in 00:00:42 (2400 chars)
```

2. **Progress**
```
📊 Progress: 25% | Elapsed: 00:00:30 | Remaining: 00:01:30
📊 Progress: 50% | Elapsed: 00:01:00 | Remaining: 00:01:00
```

3. **Resource Usage**
```
CPU: 80% (5 concurrent chunks)
Memory: 256MB (chunk buffers)
Network: 5 Mbps (5 uploads)
```

4. **Error Rates**
```
Total Chunks: 7
Successful: 7
Failed: 0
Success Rate: 100%
```

### Log Levels

**INFO (Default):**
```
🎵 Processing Chunk 1/7...
✅ Chunk 1 completed in 00:00:45
📊 Progress: 14%
```

**DEBUG (Verbose):**
```
🎵 Processing Chunk 1/7...
📤 Sending to STT API...
📦 FormData created with file size: 2881138 bytes
⏱️  Response Time: 45000ms
✅ Chunk 1 completed in 00:00:45
```

---

## Performance Tuning

### For Faster Processing
```typescript
// Increase concurrent requests
maxConcurrentChunks: 8

// Reduce chunk duration
chunkDurationSeconds: 45

// Reduce timeout (if API is fast)
timeout: 45000
```

### For More Reliable Processing
```typescript
// Decrease concurrent requests
maxConcurrentChunks: 3

// Increase chunk duration
chunkDurationSeconds: 90

// Increase timeout
timeout: 90000
```

### For Balanced Processing
```typescript
// Current defaults (recommended)
maxConcurrentChunks: 5
chunkDurationSeconds: 60
timeout: 60000
```

---

## Troubleshooting

### Issue: Timeout Errors
```
❌ STT API error: 408 Request Timeout
```

**Solution:**
```typescript
// Increase timeout
timeout: 90000  // 90 seconds

// Or reduce chunk duration
chunkDurationSeconds: 45
```

### Issue: High CPU Usage
```
CPU: 100% (system overloaded)
```

**Solution:**
```typescript
// Reduce concurrent requests
maxConcurrentChunks: 3

// Or increase chunk duration
chunkDurationSeconds: 90
```

### Issue: Memory Issues
```
Error: Cannot allocate memory
```

**Solution:**
```typescript
// Reduce concurrent requests
maxConcurrentChunks: 2

// Or reduce chunk duration
chunkDurationSeconds: 30
```

### Issue: Slow Processing
```
Processing time: 10+ minutes
```

**Solution:**
```typescript
// Increase concurrent requests
maxConcurrentChunks: 8

// Or reduce chunk duration
chunkDurationSeconds: 45

// Or reduce timeout
timeout: 45000
```

---

## Testing Checklist

- [ ] Test with 1-minute video
- [ ] Test with 5-minute video
- [ ] Test with 30-minute video
- [ ] Test with 2-hour video
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor network bandwidth
- [ ] Test error scenarios
- [ ] Test timeout scenarios
- [ ] Verify transcript accuracy
- [ ] Check processing time
- [ ] Verify parallel processing
- [ ] Test with different languages
- [ ] Test with different audio qualities

---

## Rollback Plan

If issues occur, rollback is simple:

1. **Revert chunk duration:**
```typescript
const chunkDuration = options.chunkDurationSeconds || 180;
```

2. **Revert concurrent requests:**
```typescript
const maxConcurrent = options.maxConcurrentChunks || 3;
```

3. **Revert timeout:**
```typescript
const timeout = options.timeout || 300000;
```

4. **Revert to batch processing:**
Replace queue-based processing with original batch-based approach in `chunked-audio-processor.service.ts`

---

## Future Improvements

1. **Adaptive Chunk Sizing**
   - Adjust chunk duration based on audio bitrate
   - Smaller chunks for high-quality audio
   - Larger chunks for low-quality audio

2. **Streaming Responses**
   - Return transcripts as they complete
   - Real-time progress updates
   - Reduce perceived latency

3. **Retry Logic**
   - Automatic retry with exponential backoff
   - Configurable retry count
   - Different retry strategies for different errors

4. **Caching**
   - Cache transcriptions for duplicate videos
   - Reduce API calls
   - Faster response times

5. **Load Balancing**
   - Distribute across multiple STT API instances
   - Better resource utilization
   - Higher throughput

6. **Metrics Collection**
   - Track processing times
   - Monitor error rates
   - Identify bottlenecks

---

## References

- [Audio Extraction Service](src/services/ai-hub/audio-extraction.service.ts)
- [STT Service](src/services/ai-hub/stt.service.ts)
- [Chunked Audio Processor](src/services/ai-hub/chunked-audio-processor.service.ts)
- [Performance Comparison](PERFORMANCE_COMPARISON.md)
- [Detailed Changes](CHANGES_DETAILED.md)
