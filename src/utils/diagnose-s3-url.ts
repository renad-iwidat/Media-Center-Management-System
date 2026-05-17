/**
 * S3 URL Diagnostic Tool
 * أداة تشخيص روابط S3
 * 
 * This tool helps diagnose issues with S3 URLs before attempting video processing
 */

import axios from 'axios';

interface DiagnosticResult {
  url: string;
  accessible: boolean;
  contentType: string;
  contentLength: number;
  statusCode: number;
  headers: Record<string, string>;
  isValidVideo: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Diagnose S3 URL to identify potential issues
 * تشخيص رابط S3 لتحديد المشاكل المحتملة
 */
export async function diagnoseS3Url(url: string): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    url,
    accessible: false,
    contentType: '',
    contentLength: 0,
    statusCode: 0,
    headers: {},
    isValidVideo: false,
    issues: [],
    recommendations: []
  };

  try {
    console.log(`🔍 Diagnosing S3 URL: ${url}`);

    // Step 1: HEAD request to check accessibility and headers
    console.log('📋 Step 1: Checking URL headers...');
    const headResponse = await axios.head(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/*, */*'
      },
      maxRedirects: 5,
      validateStatus: () => true // Accept all status codes
    });

    result.statusCode = headResponse.status;
    result.headers = headResponse.headers as Record<string, string>;
    result.contentType = headResponse.headers['content-type'] || '';
    result.contentLength = parseInt(headResponse.headers['content-length'] || '0', 10);

    console.log(`📊 Status Code: ${result.statusCode}`);
    console.log(`📋 Content-Type: ${result.contentType}`);
    console.log(`📏 Content-Length: ${Math.round(result.contentLength / 1024 / 1024)}MB`);

    // Check status code
    if (result.statusCode === 200) {
      result.accessible = true;
    } else if (result.statusCode === 403) {
      result.issues.push('Access denied (403) - File is not publicly accessible');
      result.recommendations.push('Make the S3 object public or check bucket permissions');
    } else if (result.statusCode === 404) {
      result.issues.push('File not found (404) - File does not exist');
      result.recommendations.push('Verify the file exists in S3 and the URL is correct');
    } else if (result.statusCode >= 300 && result.statusCode < 400) {
      result.issues.push(`Redirect (${result.statusCode}) - URL is redirecting`);
      result.recommendations.push('Use the final redirect URL directly');
    } else {
      result.issues.push(`HTTP error ${result.statusCode}`);
    }

    // Check content type
    if (result.contentType.includes('text/html') || result.contentType.includes('text/xml')) {
      result.issues.push('Content-Type indicates HTML/XML response (likely an error page)');
      result.recommendations.push('Check S3 bucket configuration and object permissions');
    } else if (result.contentType.includes('video/') || result.contentType.includes('application/octet-stream')) {
      result.isValidVideo = true;
    } else if (!result.contentType) {
      result.issues.push('No Content-Type header - might indicate an issue');
      result.recommendations.push('Check if the file exists and is properly configured');
    } else {
      result.issues.push(`Unexpected Content-Type: ${result.contentType}`);
    }

    // Check content length
    if (result.contentLength === 0) {
      result.issues.push('Content-Length is 0 - file might be empty or inaccessible');
    } else if (result.contentLength < 1024 * 1024) { // Less than 1MB
      result.issues.push('File is very small - might be an error response');
    }

    // Step 2: Download first few bytes to validate
    if (result.accessible && result.contentLength > 0) {
      console.log('🔍 Step 2: Downloading first 1KB to validate...');
      try {
        const sampleResponse = await axios.get(url, {
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
          result.isValidVideo = true;
          console.log('✅ File appears to be a valid video based on signature');
        } else {
          // Check if it looks like HTML/text
          const textContent = buffer.toString('utf8', 0, Math.min(100, buffer.length));
          if (textContent.includes('<html') || textContent.includes('<?xml')) {
            result.issues.push('File content appears to be HTML/XML (error page)');
            result.recommendations.push('S3 is returning an error page instead of the video file');
          } else {
            console.log(`📋 File signature: ${firstBytes} (unknown format)`);
          }
        }

      } catch (rangeError) {
        console.log('⚠️  Range request failed, server might not support partial content');
        result.issues.push('Server does not support range requests');
      }
    }

    // Step 3: Additional checks
    console.log('🔍 Step 3: Additional validation...');

    // Check URL structure
    if (!url.includes('.s3.') && !url.includes('.amazonaws.com')) {
      result.issues.push('URL does not appear to be a valid S3 URL');
    }

    // Check for Arabic characters in URL
    if (/[\u0600-\u06FF]/.test(url)) {
      result.issues.push('URL contains Arabic characters - might cause encoding issues');
      result.recommendations.push('Ensure proper URL encoding for Arabic characters');
    }

    // Generate final assessment
    if (result.accessible && result.isValidVideo && result.issues.length === 0) {
      console.log('✅ URL appears to be valid and accessible');
    } else {
      console.log(`❌ Found ${result.issues.length} issue(s) with the URL`);
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    result.issues.push(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        result.recommendations.push('URL is not responding - check network connectivity');
      } else if (error.message.includes('ENOTFOUND')) {
        result.recommendations.push('DNS resolution failed - check the domain name');
      } else if (error.message.includes('ECONNREFUSED')) {
        result.recommendations.push('Connection refused - server is not accessible');
      }
    }
  }

  return result;
}

/**
 * Print diagnostic results in a readable format
 * طباعة نتائج التشخيص بشكل قابل للقراءة
 */
export function printDiagnosticResults(result: DiagnosticResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 S3 URL DIAGNOSTIC RESULTS');
  console.log('='.repeat(60));
  console.log(`📋 URL: ${result.url}`);
  console.log(`📊 Status: ${result.statusCode}`);
  console.log(`📋 Content-Type: ${result.contentType}`);
  console.log(`📏 Size: ${Math.round(result.contentLength / 1024 / 1024)}MB`);
  console.log(`✅ Accessible: ${result.accessible ? 'Yes' : 'No'}`);
  console.log(`🎬 Valid Video: ${result.isValidVideo ? 'Yes' : 'No'}`);

  if (result.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    result.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * CLI usage
 */
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.log('Usage: ts-node diagnose-s3-url.ts <S3_URL>');
    process.exit(1);
  }

  diagnoseS3Url(url)
    .then(result => {
      printDiagnosticResults(result);
      process.exit(result.issues.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Diagnostic failed:', error);
      process.exit(1);
    });
}