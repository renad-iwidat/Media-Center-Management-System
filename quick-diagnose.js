/**
 * Quick S3 URL Diagnosis Script
 * سكريبت تشخيص سريع لروابط S3
 */

const axios = require('axios');

const VIDEO_URL = 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-دائرة-الشرق---بشارة-شربل-كانب-ومحلل-سياسي-1777906763845-63fqd2.mp4';

async function quickDiagnose() {
  console.log('🔍 Quick S3 URL Diagnosis');
  console.log('=' .repeat(50));
  console.log(`🌐 URL: ${VIDEO_URL}`);
  console.log('');

  try {
    // Step 1: HEAD request
    console.log('📋 Step 1: Checking headers...');
    const headResponse = await axios.head(VIDEO_URL, {
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

    // Step 2: Check if accessible
    if (headResponse.status !== 200) {
      console.log(`❌ URL not accessible (Status: ${headResponse.status})`);
      if (headResponse.status === 403) {
        console.log('💡 File is not publicly accessible');
      } else if (headResponse.status === 404) {
        console.log('💡 File not found');
      }
      return;
    }

    // Step 3: Check content type
    const contentType = headResponse.headers['content-type'] || '';
    if (contentType.includes('text/html') || contentType.includes('text/xml')) {
      console.log('❌ Content-Type indicates HTML/XML (error page)');
      console.log('💡 S3 is returning an error page instead of the video');
      return;
    }

    if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
      console.log(`⚠️  Unexpected Content-Type: ${contentType}`);
    }

    // Step 4: Download first 1KB to check file signature
    console.log('\n📋 Step 2: Checking file signature...');
    try {
      const sampleResponse = await axios.get(VIDEO_URL, {
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
        // Check if it's text/HTML
        const textContent = buffer.toString('utf8', 0, 100);
        if (textContent.includes('<html') || textContent.includes('<?xml')) {
          console.log('❌ File content is HTML/XML (error page)');
          console.log('📋 Content preview:', textContent.substring(0, 100));
        } else {
          console.log('⚠️  Unknown file format');
        }
      }

    } catch (rangeError) {
      console.log('⚠️  Range request not supported, trying full download test...');
      
      // Try downloading first few MB
      try {
        const testResponse = await axios.get(VIDEO_URL, {
          responseType: 'stream',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        let receivedBytes = 0;
        const startTime = Date.now();

        testResponse.data.on('data', (chunk) => {
          receivedBytes += chunk.length;
          
          // Stop after 1MB or 5 seconds
          if (receivedBytes > 1024 * 1024 || Date.now() - startTime > 5000) {
            testResponse.data.destroy();
            
            const duration = Date.now() - startTime;
            const speedMBps = (receivedBytes / 1024 / 1024) / (duration / 1000);
            
            console.log(`📊 Downloaded ${Math.round(receivedBytes / 1024)}KB in ${duration}ms`);
            console.log(`📊 Speed: ${speedMBps.toFixed(2)}MB/s`);
            
            if (speedMBps > 50 && receivedBytes > 100 * 1024) {
              console.log('⚠️  Very fast download - might be an error response');
            } else {
              console.log('✅ Download speed looks normal');
            }
          }
        });

        testResponse.data.on('error', (err) => {
          console.log('❌ Download test failed:', err.message);
        });

      } catch (downloadError) {
        console.log('❌ Download test failed:', downloadError.message);
      }
    }

    console.log('\n✅ Diagnosis completed');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('💡 URL is not responding - network issue');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS resolution failed - invalid domain');
    }
  }
}

// Run diagnosis
quickDiagnose().catch(console.error);