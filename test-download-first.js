/**
 * Test script for download-first extraction method
 * سكريبت اختبار لطريقة التحميل أولاً
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001', // Adjust if your server runs on different port
  videoUrl: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-دائرة-الشرق---بشارة-شربل-كانب-ومحلل-سياسي-1777906763845-63fqd2.mp4',
  authToken: 'your-auth-token-here' // Add your auth token if needed
};

async function testDownloadFirst() {
  console.log('🚀 Testing Download-First Extraction Method');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Get video information
    console.log('\n📊 Test 1: Getting video information...');
    const videoInfoResponse = await axios.post(`${TEST_CONFIG.baseUrl}/api/ai-hub/streaming-extraction/video-info`, {
      videoUrl: TEST_CONFIG.videoUrl
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`
      }
    });
    
    if (videoInfoResponse.data.success) {
      console.log('✅ Video info retrieved successfully');
      console.log('📋 Video Info:', JSON.stringify(videoInfoResponse.data.data.videoInfo, null, 2));
    } else {
      console.log('❌ Failed to get video info:', videoInfoResponse.data.error);
    }
    
    // Test 2: Download-first extraction
    console.log('\n📥 Test 2: Testing download-first extraction...');
    const extractionResponse = await axios.post(`${TEST_CONFIG.baseUrl}/api/ai-hub/streaming-extraction/download-first`, {
      videoUrl: TEST_CONFIG.videoUrl,
      language: 'ar',
      outputFormat: 'mp3',
      bitrate: '128k',
      enableChunking: true,
      chunkDurationSeconds: 180,
      maxConcurrentChunks: 3,
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      timeout: 1200000 // 20 minutes
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`
      }
    });
    
    if (extractionResponse.data.success) {
      console.log('✅ Download-first extraction successful');
      console.log('📋 Results:');
      console.log(`   - Job ID: ${extractionResponse.data.data.jobId}`);
      console.log(`   - Transcript Length: ${extractionResponse.data.data.transcript?.length || 0} characters`);
      console.log(`   - Audio Size: ${Math.round(extractionResponse.data.data.audioSize / 1024)}KB`);
      console.log(`   - Video Size: ${Math.round(extractionResponse.data.data.videoSize / 1024 / 1024)}MB`);
      console.log(`   - Processing Time: ${Math.round(extractionResponse.data.data.processingTime / 1000)}s`);
      console.log(`   - Chunks Processed: ${extractionResponse.data.data.chunksProcessed}`);
      console.log(`   - Method: ${extractionResponse.data.data.processingMethod}`);
      
      if (extractionResponse.data.data.transcript) {
        console.log('\n📝 Transcript Preview (first 200 chars):');
        console.log(extractionResponse.data.data.transcript.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ Download-first extraction failed:', extractionResponse.data.error);
    }
    
    // Test 3: Fallback method (streaming with forceDownloadFirst)
    console.log('\n🔄 Test 3: Testing fallback method via extract-and-transcribe...');
    const fallbackResponse = await axios.post(`${TEST_CONFIG.baseUrl}/api/ai-hub/streaming-extraction/extract-and-transcribe`, {
      videoUrl: TEST_CONFIG.videoUrl,
      language: 'ar',
      outputFormat: 'mp3',
      bitrate: '128k',
      enableChunking: true,
      chunkDurationSeconds: 180,
      maxConcurrentChunks: 3,
      forceDownloadFirst: true // Force download-first method
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`
      }
    });
    
    if (fallbackResponse.data.success) {
      console.log('✅ Fallback method successful');
      console.log('📋 Results:');
      console.log(`   - Job ID: ${fallbackResponse.data.data.jobId}`);
      console.log(`   - Processing Method: ${fallbackResponse.data.data.processingMethod}`);
      console.log(`   - Transcript Length: ${fallbackResponse.data.data.transcript?.length || 0} characters`);
      console.log(`   - Audio Size: ${Math.round(fallbackResponse.data.data.audioSize / 1024)}KB`);
      console.log(`   - Video Size: ${Math.round((fallbackResponse.data.data.videoSize || 0) / 1024 / 1024)}MB`);
    } else {
      console.log('❌ Fallback method failed:', fallbackResponse.data.error);
    }
    
    // Test 4: System stats
    console.log('\n📊 Test 4: Getting system stats...');
    const statsResponse = await axios.get(`${TEST_CONFIG.baseUrl}/api/ai-hub/streaming-extraction/stats`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`
      }
    });
    
    if (statsResponse.data.success) {
      console.log('✅ System stats retrieved');
      console.log('📋 Stats:', JSON.stringify(statsResponse.data.data, null, 2));
    } else {
      console.log('❌ Failed to get system stats:', statsResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed');
}

// Run the test
if (require.main === module) {
  testDownloadFirst().catch(console.error);
}

module.exports = { testDownloadFirst };