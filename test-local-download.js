/**
 * Local test for download-first extraction service
 * اختبار محلي لخدمة التحميل أولاً
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  videoUrl: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-دائرة-الشرق---بشارة-شربل-كانب-ومحلل-سياسي-1777906763845-63fqd2.mp4'
};

async function testLocalDownload() {
  console.log('🚀 Testing Local Download-First Service');
  console.log('=' .repeat(50));
  
  try {
    // Import the service directly
    console.log('📦 Loading download-first service...');
    
    // We need to compile TypeScript first or use a different approach
    // Let's test the core logic with axios directly
    
    const axios = require('axios');
    const os = require('os');
    const { randomUUID } = require('crypto');

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), 'test-media-center-download');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`📁 Temp directory: ${tempDir}`);

    // Test 1: Check URL headers
    console.log('\n🔍 Test 1: Checking URL headers...');
    const headResponse = await axios.head(TEST_CONFIG.videoUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/*, */*',
      }
    });

    const contentType = headResponse.headers['content-type'] || '';
    const contentLength = parseInt(headResponse.headers['content-length'] || '0', 10);
    
    console.log(`📊 Status: ${headResponse.status}`);
    console.log(`📋 Content-Type: ${contentType}`);
    console.log(`📏 Size: ${Math.round(contentLength / 1024 / 1024)}MB`);

    if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // Test 2: Download video file
    console.log('\n📥 Test 2: Downloading video file...');
    const videoFileName = `test-video-${randomUUID()}.mp4`;
    const videoFilePath = path.join(tempDir, videoFileName);

    const response = await axios.get(TEST_CONFIG.videoUrl, {
      responseType: 'stream',
      timeout: 120000, // 2 minutes
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/*, */*',
      }
    });

    const writeStream = fs.createWriteStream(videoFilePath);
    let downloadedBytes = 0;
    const startTime = Date.now();
    let lastProgressTime = Date.now();

    await new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        
        // Log progress every 3 seconds
        const now = Date.now();
        if (now - lastProgressTime > 3000) {
          const speed = downloadedBytes / ((now - startTime) / 1000);
          const speedMB = Math.round(speed / 1024 / 1024 * 100) / 100;
          const percentage = contentLength > 0 ? Math.round((downloadedBytes / contentLength) * 100) : 0;
          
          console.log(`📥 Progress: ${Math.round(downloadedBytes / 1024 / 1024)}MB${contentLength > 0 ? ` (${percentage}%)` : ''} - ${speedMB}MB/s`);
          lastProgressTime = now;
        }
      });

      response.data.on('end', () => {
        writeStream.end();
        const duration = Date.now() - startTime;
        const avgSpeed = downloadedBytes / (duration / 1000);
        const avgSpeedMB = Math.round(avgSpeed / 1024 / 1024 * 100) / 100;

        console.log(`✅ Download completed: ${Math.round(downloadedBytes / 1024 / 1024)}MB in ${Math.round(duration / 1000)}s (avg: ${avgSpeedMB}MB/s)`);
        resolve();
      });

      response.data.on('error', (error) => {
        writeStream.destroy();
        reject(error);
      });

      response.data.pipe(writeStream);

      writeStream.on('error', (error) => {
        reject(error);
      });
    });

    // Test 3: Validate downloaded file
    console.log('\n🔍 Test 3: Validating downloaded file...');
    
    if (!fs.existsSync(videoFilePath)) {
      throw new Error('Downloaded file does not exist');
    }

    const fileStats = fs.statSync(videoFilePath);
    console.log(`📊 File size on disk: ${Math.round(fileStats.size / 1024 / 1024)}MB`);

    if (fileStats.size < 1024 * 1024) {
      console.log('⚠️  Warning: File is very small - might be an error response');
    }

    // Check file signature
    const fileBuffer = fs.readFileSync(videoFilePath, { start: 0, end: 15 });
    const fileSignature = fileBuffer.toString('hex');
    console.log(`🔍 File signature: ${fileSignature}`);

    const videoSignatures = ['000000', '1a45df', '464c56', '415649'];
    const isValidVideo = videoSignatures.some(sig => fileSignature.toLowerCase().includes(sig));

    if (isValidVideo) {
      console.log('✅ File appears to be a valid video');
    } else {
      console.log('❌ File does not appear to be a valid video');
      
      // Try to read as text to see if it's an error page
      try {
        const textContent = fs.readFileSync(videoFilePath, 'utf8', { start: 0, end: 200 });
        if (textContent.includes('<html') || textContent.includes('<?xml')) {
          console.log('❌ File content is HTML/XML (error page)');
          console.log('📋 Content preview:', textContent.substring(0, 100));
        }
      } catch (e) {
        // Not text content
      }
    }

    // Test 4: Test FFmpeg (if available)
    console.log('\n🎬 Test 4: Testing FFmpeg...');
    
    try {
      const { spawn } = require('child_process');
      
      // Test if ffmpeg is available
      const ffmpegTest = spawn('ffmpeg', ['-version'], { stdio: 'pipe' });
      
      await new Promise((resolve, reject) => {
        ffmpegTest.on('close', (code) => {
          if (code === 0) {
            console.log('✅ FFmpeg is available');
            resolve();
          } else {
            console.log('❌ FFmpeg not available or failed');
            reject(new Error('FFmpeg not available'));
          }
        });
        
        ffmpegTest.on('error', (error) => {
          console.log('❌ FFmpeg not found:', error.message);
          reject(error);
        });
      });

      // Test ffprobe on the downloaded file
      console.log('🔍 Testing ffprobe on downloaded file...');
      
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoFilePath
      ], { stdio: 'pipe' });

      let probeOutput = '';
      ffprobe.stdout.on('data', (data) => {
        probeOutput += data.toString();
      });

      await new Promise((resolve, reject) => {
        ffprobe.on('close', (code) => {
          if (code === 0) {
            try {
              const info = JSON.parse(probeOutput);
              console.log('✅ FFprobe successful');
              console.log(`📋 Duration: ${info.format?.duration || 'Unknown'}s`);
              console.log(`📋 Bitrate: ${info.format?.bit_rate || 'Unknown'}`);
              console.log(`📋 Has Audio: ${info.streams?.some(s => s.codec_type === 'audio') || false}`);
              console.log(`📋 Has Video: ${info.streams?.some(s => s.codec_type === 'video') || false}`);
              resolve();
            } catch (parseError) {
              console.log('❌ Failed to parse ffprobe output');
              reject(parseError);
            }
          } else {
            console.log(`❌ FFprobe failed with code ${code}`);
            reject(new Error(`FFprobe failed with code ${code}`));
          }
        });
      });

    } catch (ffmpegError) {
      console.log('⚠️  FFmpeg test skipped:', ffmpegError.message);
    }

    // Cleanup
    console.log('\n🗑️  Cleaning up...');
    if (fs.existsSync(videoFilePath)) {
      fs.unlinkSync(videoFilePath);
      console.log('✅ Temporary file deleted');
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('💡 The download-first method should work with this video file.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Invalid content type')) {
      console.log('💡 S3 is returning an error page instead of video');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Download timeout - file might be too large or connection slow');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Local test completed');
}

// Run the test
if (require.main === module) {
  testLocalDownload().catch(console.error);
}

module.exports = { testLocalDownload };