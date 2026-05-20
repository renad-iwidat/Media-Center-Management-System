import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

/**
 * Administrative Procedures S3 Service
 * خدمة رفع الملفات الإدارية إلى bucket منفصل
 * 
 * Bucket name: admin-procedures-archive
 * منفصل تماماً عن bucket المواد العادية
 */

// Log Admin S3 configuration on startup
console.log('Admin Procedures S3 Configuration:');
console.log('  Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
console.log('  Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
console.log('  Region:', process.env.AWS_REGION || '✗ Missing');
console.log('  Admin Bucket:', process.env.AWS_S3_ADMIN_BUCKET || 'admin-procedures-archive (default)');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Bucket name منفصل عن النظام العادي
const ADMIN_BUCKET = process.env.AWS_S3_ADMIN_BUCKET || 'admin-procedures-archive';

export class AdminProcS3Service {
  /**
   * Get the admin bucket name
   */
  static getBucketName(): string {
    return ADMIN_BUCKET;
  }

  /**
   * Upload file to Admin S3 bucket
   */
  static async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'admin-task-attachments',
    title?: string,
    description?: string
  ): Promise<{ url: string; key: string; bucket: string; title?: string; description?: string }> {
    const key = `${folder}/${uuidv4()}-${fileName}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: ADMIN_BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
    };

    // محاولة تفعيل public-read (قد تفشل في bucket محمي)
    try {
      params.ACL = 'public-read';
    } catch {
      // تجاهل
    }

    try {
      console.log('Uploading to Admin S3:', { 
        bucket: ADMIN_BUCKET, 
        key, 
        size: file.length 
      });
      
      let result;
      try {
        result = await s3.upload(params).promise();
      } catch (aclError: any) {
        // لو فشل بسبب الـ ACL → جرب بدونه
        if (aclError.code === 'AccessControlListNotSupported' || aclError.message?.includes('ACL')) {
          delete params.ACL;
          result = await s3.upload(params).promise();
        } else {
          throw aclError;
        }
      }
      
      console.log('Admin S3 upload successful:', result.Location);
      
      return {
        url: result.Location,
        key: result.Key,
        bucket: ADMIN_BUCKET,
        title,
        description,
      };
    } catch (error) {
      console.error('Admin S3 upload error:', error);
      throw new Error(`Failed to upload file to Admin S3: ${error}`);
    }
  }

  /**
   * Delete file from Admin S3 bucket
   */
  static async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: ADMIN_BUCKET,
      Key: key,
    };

    try {
      await s3.deleteObject(params).promise();
      console.log('Admin S3 delete successful:', key);
    } catch (error) {
      console.error('Admin S3 delete error:', error);
      throw new Error(`Failed to delete file from Admin S3: ${error}`);
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(key: string): string {
    const region = process.env.AWS_REGION;
    
    if (!region) {
      throw new Error('AWS_REGION environment variable is not set');
    }

    return `https://${ADMIN_BUCKET}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Generate presigned URL for download
   */
  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: ADMIN_BUCKET,
      Key: key,
      Expires: expiresIn,
    };

    try {
      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Admin Presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Create the admin bucket if it doesn't exist
   * يستدعى مرة واحدة عند بدء التشغيل
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      // فحص إذا الـ bucket موجود
      await s3.headBucket({ Bucket: ADMIN_BUCKET }).promise();
      console.log(`✅ Admin bucket "${ADMIN_BUCKET}" exists`);

      // محاولة تطبيق سياسة public read
      try {
        await s3.putBucketPolicy({
          Bucket: ADMIN_BUCKET,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${ADMIN_BUCKET}/*`,
              },
            ],
          }),
        }).promise();
        console.log(`✅ Admin bucket public read policy applied`);
      } catch (policyError: any) {
        console.warn(`⚠️  Could not apply public policy: ${policyError.message}`);
      }
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 'NotFound' || error.code === 'NoSuchBucket') {
        console.log(`📦 Creating admin bucket "${ADMIN_BUCKET}"...`);
        try {
          const region = process.env.AWS_REGION || 'eu-north-1';
          
          const createParams: AWS.S3.CreateBucketRequest = {
            Bucket: ADMIN_BUCKET,
          };
          
          // إذا الـ region مش us-east-1 لازم نحدده
          if (region !== 'us-east-1') {
            createParams.CreateBucketConfiguration = {
              LocationConstraint: region,
            };
          }

          await s3.createBucket(createParams).promise();
          console.log(`✅ Admin bucket "${ADMIN_BUCKET}" created successfully`);
          
          // تطبيق سياسة public read
          try {
            await s3.putBucketPolicy({
              Bucket: ADMIN_BUCKET,
              Policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${ADMIN_BUCKET}/*`,
                  },
                ],
              }),
            }).promise();
            console.log(`✅ Admin bucket public read policy applied`);
          } catch (policyError: any) {
            console.warn(`⚠️  Could not apply public policy: ${policyError.message}`);
          }
        } catch (createError: any) {
          console.error(`❌ Failed to create admin bucket:`, createError.message);
          // ما نوقف التطبيق - الـ admin يقدر ينشئها يدوياً
        }
      } else {
        console.error(`❌ Error checking admin bucket:`, error.message);
      }
    }
  }
}
