/**
 * Simple S3 URL Diagnostic Test (No Authentication Required)
 * اختبار تشخيص رابط S3 بسيط (بدون مصادقة)
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  videoUrl: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-دائرة-الشرق---بشارة-شربل-كانب-ومحلل-سياسي-1777906763845-63fqd2.mp4'
};

/**
 * Direct S3 URL diagnosis (bypasses server authentication)
 */
async function diagnoseUrlDirectly() {
  console.log('🔍 Direct S3 URL Diagnosis');
  console.log('=' .repeat(50));
  console.log(`🌐 Testing URL: ${TEST_CONFIG.videoUrl}`);
  
  try {
    // Step 1: HEAD request to check accessibility
    console.log('\n📋 Step 1: Checking URL accessibility...');
    const headResponse = await axios.head(TEST_CONFIG.videoUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/*, */*'
      },
      maxRedirects: 5,
      validateStatus: () => true // Accept all status codes
    });

    console.log(`📊 Status Code: ${headResponse.status}`);
    console.log(`📋 Content-Type: ${headResponse.headers['content-type'] || 'Not specified'}`);
    console.log(`📏 Content-Length: ${Math.round((headResponse.headers['content-length'] || 0) / 1024 / 1024)}MB`);

    // Step 2: Analyze results
    const issues = [];
    const recommendations = [];

    if (headResponse.status === 200) {
      console.log('✅ URL is accessible');
    } else if (headResponse.status === 403) {
      issues.push('Access denied (403) - File is not publicly accessible');
      recommendations.push('Make the S3 object public or check bucket permissions');
    } else if (headResponse.status === 404) {
      issues.push('File not found (404) - File does not exist');
      recommendations.push('Verify the file exists in S3 and the URL is correct');
    } else {
      issues.push(`HTTP error ${headResponse.status}`);
    }

    // Check content type
    const contentType = headResponse.headers['content-type'] || '';
    if (contentType.includes('text/html') || contentType.includes('text/xml')) {
      issues.push('Content-Type indicates HTML/XML response (likely an error page)');
      recommendations.push('Check S3 bucket configuration and object permissions');
    } else if (contentType.includes('video/') || contentType.includes('application/octet-stream')) {
      console.log('✅ Content-Type indicates video file');
    } else if (!contentType) {
      issues.push('No Content-Type header - might indicate an issue');
    }

    // Check content length
    const contentLength = parseInt(headResponse.headers['content-length'] || '0', 10);
    if (contentLength === 0) {
      issues.push('Content-Length is 0 - file might be empty or inaccessible');
    } else if (contentLength < 1024 * 1024) { // Less than 1MB
      issues.push('File is very small - might be an error response');
    }

    // Step 3: Download first few bytes to validate
    if (headResponse.status === 200 && contentLength > 0) {
      console.log('\n🔍 Step 2: Downloading first 1KB to validate...');
      try {
        const sampleResponse = await axios.get(TEST_CONFIG.videoUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'Range': 'bytes=0-1023', // First 1KB
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const buffer = Buffer.from(sampleResponse.data);
        const firstBytes = buffer.toString('hex', 0, Math.min(16, buffer.length));
        console.log(`🔍 First 16 bytes (hex): ${firstBytes}`);

        // Check for common video file signatures
        const videoSignatures = [
          '000000', // MP4/MOV (ftyp box)
          '1a45df', // WebM/MKV
          '464c56', // FLV
          '415649', // AVI
        ];

        const isVideoSignature = videoSignatures.some(sig => 
          firstBytes.toLowerCase().includes(sig.toLowerCase())
        );

        if (isVideoSignature) {
          console.log('✅ File appears to be a valid video based on signature');
        } else {
          // Check if it looks like HTML/text
          const textContent = buffer.toString('utf8', 0, Math.min(100, buffer.length));
          if (textContent.includes('<html') || textContent.includes('<?xml')) {
            issues.push('File content appears to be HTML/XML (error page)');
            recommendations.push('S3 is returning an error page instead of the video file');
          } else {
            console.log(`📋 File signature: ${firstBytes} (unknown format)`);
          }
        }

      } catch (rangeError) {
        console.log('⚠️  Range request failed, server might not support partial content');
        issues.push('Server does not support range requests');
      }
    }

    // Step 4: Final assessment
    console.log('\n' + '='.repeat(50));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));

    if (issues.length === 0) {
      console.log('✅ URL appears to be valid and accessible for video processing');
    } else {
      console.log(`❌ Found ${issues.length} issue(s):`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Step 5: Test with ffprobe-like approach (if accessible)
    if (headResponse.status === 200 && issues.length === 0) {
      console.log('\n🎬 Step 3: Testing video processing compatibility...');
      console.log('✅ URL should work with video processing tools like FFmpeg');
      console.log('💡 You can now test with the full download-first extraction method');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS resolution failed - check the domain name');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - server is not accessible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏱️  Request timed out - check network connectivity');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Diagnostic completed');
}

// Run the diagnostic
if (require.main === module) {
  diagnoseUrlDirectly().catch(console.error);
}

module.exports = { diagnoseUrlDirectly };