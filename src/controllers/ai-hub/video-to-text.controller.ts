/**
 * Video to Text Controller
 * Combines audio extraction and STT services
 * يدمج خدمات استخراج الصوت وتحويل الصوت لنص
 */

import { Request, Response } from 'express';
import { extractAudioFromVideoUrl } from '../../services/ai-hub/audio-extraction.service';
import { 
  transcribeAudioWithOpenAI,
  formatTimestamp
} from '../../services/ai-hub/openai-stt.service';
import {
  splitAudioIntoChunks,
  processAudioChunksInParallel,
  combineTranscripts,
  cleanupChunks,
} from '../../services/ai-hub/chunked-audio-processor.service';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Process large audio with chunking
 * معالجة الصوت الكبير بالتقسيم
 */
async function processAudioWithChunking(audioBuffer: Buffer, language: string, includeTimestamps: boolean = true): Promise<{ transcript: string; segments?: any[] }> {
  const tempDir = path.join(os.tmpdir(), 'media-center-video-processing');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);

  try {
    // Save audio buffer to file
    fs.writeFileSync(audioPath, audioBuffer);
    console.log(`💾 Audio saved to: ${audioPath}`);

    // Split audio into chunks (5 minutes each)
    console.log('\n🎵 Splitting audio into chunks...');
    const chunks = await splitAudioIntoChunks(audioPath, {
      chunkDurationSeconds: 300, // 5 minutes
    });
    console.log(`✅ Audio split into ${chunks.length} chunks`);

    // Process chunks in parallel (3 at a time)
    console.log('\n🔄 Processing chunks in parallel...');
    const { transcribeAudioWithOpenAI } = await import('../../services/ai-hub/openai-stt.service');
    
    let allSegments: any[] = [];
    let chunkOffset = 0;

    const processedChunks = await processAudioChunksInParallel(
      chunks,
      async (chunk) => {
        try {
          console.log(`  🎵 Processing chunk ${chunk.index + 1}/${chunks.length}...`);
          const result = await transcribeAudioWithOpenAI(
            fs.readFileSync(chunk.filePath),
            { language, includeTimestamps }
          );
          
          let transcript: string;
          if (typeof result === 'string') {
            transcript = result;
          } else {
            transcript = result.text;
            // Adjust segment timestamps based on chunk offset
            if (result.segments && includeTimestamps) {
              const adjustedSegments = result.segments.map(seg => ({
                ...seg,
                start: seg.start + chunkOffset,
                end: seg.end + chunkOffset
              }));
              allSegments.push(...adjustedSegments);
            }
          }
          
          console.log(`  ✅ Chunk ${chunk.index + 1} completed (${transcript.length} chars)`);
          return transcript;
        } catch (error) {
          console.error(`  ❌ Error processing chunk ${chunk.index + 1}:`, error);
          throw error;
        }
      },
      { maxConcurrentChunks: 3 }
    );

    // Combine transcripts
    console.log('\n📝 Combining transcripts...');
    const finalTranscript = combineTranscripts(processedChunks);
    console.log(`✅ Final transcript: ${finalTranscript.length} characters`);

    // Cleanup
    console.log('\n🗑️  Cleaning up temporary files...');
    await cleanupChunks(chunks);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      transcript: finalTranscript,
      segments: includeTimestamps ? allSegments : undefined
    };
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

export class VideoToTextController {
  /**
   * Extract audio from video and convert to text
   * استخرج الصوت من الفيديو وحوله لنص
   * POST /api/ai-hub/video-to-text/process
   * 
   * Body:
   * {
   *   "videoUrl": "https://example.com/video.mp4",
   *   "language": "ar" (optional, default: "ar"),
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k"),
   *   "useChunking": boolean (optional, default: false) - استخدام التقسيم للفيديوهات الكبيرة
   *   "includeTimestamps": boolean (optional, default: true) - تضمين التايم كود
   * }
   */
  static async processVideoToText(req: Request, res: Response) {
    try {
      const { 
        videoUrl, 
        language = 'ar', 
        outputFormat = 'mp3', 
        bitrate = '128k',
        useChunking = false,
        includeTimestamps = true
      } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl is required',
        });
      }

      console.log(`\n🎬➡️📝 [Video to Text Controller] Processing: ${videoUrl}`);
      console.log(`🗣️  Language: ${language}`);
      console.log(`🎵 Audio Format: ${outputFormat}`);
      console.log(`📊 Bitrate: ${bitrate}`);
      console.log(`🔄 Use Chunking: ${useChunking}`);
      console.log(`⏱️  Include Timestamps: ${includeTimestamps}`);

      // Step 1: Extract audio from video
      console.log('\n📹 Step 1: Extracting audio from video...');
      const audioBuffer = await extractAudioFromVideoUrl(videoUrl, {
        outputFormat,
        bitrate,
      });
      console.log(`✅ Audio extracted: ${audioBuffer.length} bytes`);

      // Check if audio is large (> 20 MB) and chunking is enabled
      const audioSizeMB = audioBuffer.length / (1024 * 1024);
      const shouldUseChunking = useChunking || audioSizeMB > 20;

      let transcript: string;
      let segments: any[] = [];

      if (shouldUseChunking) {
        console.log(`\n🔄 Audio is large (${audioSizeMB.toFixed(2)} MB) - using chunked processing...`);
        const result = await processAudioWithChunking(audioBuffer, language, includeTimestamps);
        transcript = result.transcript;
        segments = result.segments || [];
      } else {
        // Step 2: Convert audio to text (normal processing)
        console.log('\n🎙️  Step 2: Converting audio to text...');
        const result = await transcribeAudioWithOpenAI(audioBuffer, {
          language,
          includeTimestamps
        });
        
        if (typeof result === 'string') {
          transcript = result;
        } else {
          transcript = result.text;
          segments = result.segments || [];
        }
      }

      console.log(`✅ Transcription completed: ${transcript.length} characters`);

      const responseData: any = {
        videoUrl,
        transcript,
        language,
        audioSize: audioBuffer.length,
        audioFormat: outputFormat,
        bitrate,
        transcriptLength: transcript.length,
        usedChunking: shouldUseChunking,
      };

      // Include segments with timestamps if available
      if (includeTimestamps && segments.length > 0) {
        responseData.segments = segments.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          startFormatted: formatTimestamp(seg.start),
          endFormatted: formatTimestamp(seg.end),
        }));
        responseData.segmentCount = segments.length;
      }

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('❌ Error in video to text controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process video to text',
      });
    }
  }

  /**
   * Extract audio from S3 video and convert to text
   * استخرج الصوت من فيديو S3 وحوله لنص
   * POST /api/ai-hub/video-to-text/process-s3
   * 
   * Body:
   * {
   *   "fileId": 123,
   *   "s3Url": "https://s3.example.com/video.mp4",
   *   "language": "ar" (optional, default: "ar"),
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k"),
   *   "useChunking": boolean (optional, default: false) - استخدام التقسيم للفيديوهات الكبيرة
   *   "includeTimestamps": boolean (optional, default: true) - تضمين التايم كود
   * }
   */
  static async processS3VideoToText(req: Request, res: Response) {
    try {
      const { 
        fileId,
        s3Url, 
        language = 'ar', 
        outputFormat = 'mp3', 
        bitrate = '128k',
        useChunking = false,
        includeTimestamps = true
      } = req.body;

      if (!s3Url) {
        return res.status(400).json({
          success: false,
          error: 's3Url is required',
        });
      }

      console.log(`\n🎬➡️📝 [Video to Text Controller] Processing S3: ${s3Url}`);
      console.log(`📁 File ID: ${fileId}`);
      console.log(`🗣️  Language: ${language}`);
      console.log(`🎵 Audio Format: ${outputFormat}`);
      console.log(`📊 Bitrate: ${bitrate}`);
      console.log(`🔄 Use Chunking: ${useChunking}`);
      console.log(`⏱️  Include Timestamps: ${includeTimestamps}`);

      // Step 1: Extract audio from S3 video
      console.log('\n📹 Step 1: Extracting audio from S3 video...');
      const audioBuffer = await extractAudioFromVideoUrl(s3Url, {
        outputFormat,
        bitrate,
      });
      console.log(`✅ Audio extracted: ${audioBuffer.length} bytes`);

      // Check if audio is large (> 20 MB) and chunking is enabled
      const audioSizeMB = audioBuffer.length / (1024 * 1024);
      const shouldUseChunking = useChunking || audioSizeMB > 20;

      let transcript: string;
      let segments: any[] = [];

      if (shouldUseChunking) {
        console.log(`\n🔄 Audio is large (${audioSizeMB.toFixed(2)} MB) - using chunked processing...`);
        const result = await processAudioWithChunking(audioBuffer, language, includeTimestamps);
        transcript = result.transcript;
        segments = result.segments || [];
      } else {
        // Step 2: Convert audio to text (normal processing)
        console.log('\n🎙️  Step 2: Converting audio to text...');
        const result = await transcribeAudioWithOpenAI(audioBuffer, {
          language,
          includeTimestamps
        });
        
        if (typeof result === 'string') {
          transcript = result;
        } else {
          transcript = result.text;
          segments = result.segments || [];
        }
      }

      console.log(`✅ Transcription completed: ${transcript.length} characters`);

      const responseData: any = {
        fileId,
        s3Url,
        transcript,
        language,
        audioSize: audioBuffer.length,
        audioFormat: outputFormat,
        bitrate,
        transcriptLength: transcript.length,
        usedChunking: shouldUseChunking,
      };

      // Include segments with timestamps if available
      if (includeTimestamps && segments.length > 0) {
        responseData.segments = segments.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          startFormatted: formatTimestamp(seg.start),
          endFormatted: formatTimestamp(seg.end),
        }));
        responseData.segmentCount = segments.length;
      }

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('❌ Error in S3 video to text controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process S3 video to text',
      });
    }
  }
}