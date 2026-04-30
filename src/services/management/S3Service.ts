import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

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
    const key = `${folder}/${uuidv4()}-${fileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: mimeType,
      ACL: 'public-read',
    };

    try {
      const result = await s3.upload(params).promise();
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
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
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
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Generate presigned URL for download
   */
  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
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
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
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
