/**
 * Simple test for download-first extraction (no auth required)
 * اختبار بسيط لطريقة التحميل أولاً (بدون مصادقة)
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001', // Adjust if your server runs on different port
  videoUrl: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-دائرة-الشرق---بشارة-شربل-كانب-ومحلل-سياسي-1777906763845-63fqd2.mp4'
};

async function testSimpleDownload() {
  console.log('🚀 Testing Simple Download-First Method (No Auth)');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Direct diagnosis without auth
    console.log('\n🔍 Test 1: Direct URL diagnosis...');
    
    // Use the same logic as quick-diagnose.js but integrated
    const headResponse = await axios.head(TEST_CONFIG.videoUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: () => true
    });

    console.log(`📊 Status: ${headResponse.status}`);
    console.log(`📋 Content-Type: ${headResponse.headers['content-type'] || 'Not specified'}`);
    console.log(`📏 Content-Length: ${headResponse.headers['content-length'] || 'Not specified'}`);
    
    if (headResponse.headers['content-length']) {
      const sizeMB = Math.round(parseInt(headResponse.headers['content-length']) / 1024 / 1024);
      console.log(`📊 Size: ${sizeMB}MB`);
    }

    if (headResponse.status !== 200) {
      console.log(`❌ URL not accessible (Status: ${headResponse.status})`);
      return;
    }

    const contentType = headResponse.headers['content-type'] || '';
    if (contentType.includes('text/html') || contentType.includes('text/xml')) {
      console.log('❌ Content-Type indicates HTML/XML (error page)');
      return;
    }

    console.log('✅ URL appears to be valid');

    // Test 2: Test download speed and file signature
    console.log('\n📥 Test 2: Testing download and file validation...');
    
    const sampleResponse = await axios.get(TEST_CONFIG.videoUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'Range': 'bytes=0-1023',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const buffer = Buffer.from(sampleResponse.data);
    const firstBytes = buffer.toString('hex', 0, 16);
    console.log(`🔍 First 16 bytes: ${firstBytes}`);

    // Check for video signatures
    const videoSignatures = ['000000', '1a45df', '464c56', '415649'];
    const isVideo = videoSignatures.some(sig => firstBytes.toLowerCase().includes(sig));

    if (isVideo) {
      console.log('✅ File appears to be a valid video');
    } else {
      console.log('⚠️  Unknown file format or corrupted');
    }

    // Test 3: Test actual download (first 5MB)
    console.log('\n📥 Test 3: Testing actual download performance...');
    
    const downloadResponse = await axios.get(TEST_CONFIG.videoUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    let receivedBytes = 0;
    const startTime = Date.now();
    const maxTestSize = 5 * 1024 * 1024; // 5MB test

    return new Promise((resolve) => {
      downloadResponse.data.on('data', (chunk) => {
        receivedBytes += chunk.length;
        
        // Stop after 5MB or 10 seconds
        if (receivedBytes > maxTestSize || Date.now() - startTime > 10000) {
          downloadResponse.data.destroy();
          
          const duration = Date.now() - startTime;
          const speedMBps = (receivedBytes / 1024 / 1024) / (duration / 1000);
          
          console.log(`📊 Downloaded ${Math.round(receivedBytes / 1024)}KB in ${duration}ms`);
          console.log(`📊 Speed: ${speedMBps.toFixed(2)}MB/s`);
          
          if (speedMBps > 50 && receivedBytes > 100 * 1024) {
            console.log('⚠️  Very fast download - might indicate an issue');
            console.log('💡 This could mean S3 is returning an error page instead of video');
          } else if (speedMBps < 0.1) {
            console.log('⚠️  Very slow download - network or server issue');
          } else {
            console.log('✅ Download speed looks normal for video content');
          }
          
          resolve();
        }
      });

      downloadResponse.data.on('error', (err) => {
        console.log('❌ Download test failed:', err.message);
        resolve();
      });

      downloadResponse.data.on('end', () => {
        const duration = Date.now() - startTime;
        const speedMBps = (receivedBytes / 1024 / 1024) / (duration / 1000);
        
        console.log(`✅ Download completed: ${Math.round(receivedBytes / 1024)}KB in ${duration}ms`);
        console.log(`📊 Final speed: ${speedMBps.toFixed(2)}MB/s`);
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('💡 Network timeout - server might be slow or unreachable');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS resolution failed - check domain name');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Connection refused - server not accessible');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Simple test completed');
  console.log('\n💡 Next steps:');
  console.log('   1. If video is valid, the issue is likely with FFmpeg on Render');
  console.log('   2. The download-first method should work better than streaming');
  console.log('   3. Try running the server locally and test the API endpoints');
}

// Run the test
if (require.main === module) {
  testSimpleDownload().catch(console.error);
}

module.exports = { testSimpleDownload };