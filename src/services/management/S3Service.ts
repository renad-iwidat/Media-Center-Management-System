import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Log AWS configuration on startup
console.log('AWS Configuration:');
console.log('  Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
console.log('  Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
console.log('  Region:', process.env.AWS_REGION || '✗ Missing');
console.log('  Bucket:', process.env.AWS_S3_BUCKET || '✗ Missing');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export class S3Service {
  /**
   * Upload file to S3
   */
  static async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'task-attachments',
    title?: string,
    description?: string
  ): Promise<{ url: string; key: string; title?: string; description?: string }> {
    const bucket = process.env.AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    const key = `${folder}/${uuidv4()}-${fileName}`;

    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
      ACL: 'public-read',
    };

    try {
      console.log('Uploading to S3:', { bucket, key, size: file.length });
      const result = await s3.upload(params).promise();
      console.log('S3 upload successful:', result.Location);
      return {
        url: result.Location,
        key: result.Key,
        title,
        description,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    const bucket = process.env.AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    const params = {
      Bucket: bucket,
      Key: key,
    };

    try {
      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error}`);
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(key: string): string {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    
    if (!bucket || !region) {
      throw new Error('AWS_S3_BUCKET or AWS_REGION environment variable is not set');
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Generate presigned URL for download
   */
  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const bucket = process.env.AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn,
    };

    try {
      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * List files in folder
   */
  static async listFiles(folder: string): Promise<AWS.S3.ObjectList> {
    const bucket = process.env.AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }

    const params = {
      Bucket: bucket,
      Prefix: folder,
    };

    try {
      const result = await s3.listObjects(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error('S3 list error:', error);
      throw new Error(`Failed to list files from S3: ${error}`);
    }
  }
}
