/**
 * Uploaded Files Controller
 * التحكم في الملفات المرفوعة (صوت وفيديو)
 */

import { Request, Response } from 'express';
import { query } from '../../config/database';

interface FileRow {
  id: number;
  source_id: number;
  source_type_id: number;
  file_type: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  s3_bucket: string;
  s3_key: string;
  s3_url: string;
  processing_status: string;
  uploaded_by: number;
  uploaded_at: string;
  processed_at: string | null;
  media_unit_id: number;
}

/**
 * استخراج النص العربي من S3 URL
 * مثال: "https://...manual-input-audio/audio-موجز-ضيياء---تست-رفع-صوت-1776608939260-usr5f3.mp3"
 * النتيجة: "موجز-ضيياء---تست-رفع-صوت"
 * 
 * النمط: [type]-[arabic-name]-[timestamp]-[random].[ext]
 */
function extractArabicNameFromS3(s3Url: string): string {
  try {
    // استخراج اسم الملف من الـ URL
    const filename = s3Url.split('/').pop() || '';
    
    // البحث عن النمط: [type]-[arabic-name]-[timestamp]-[random].[ext]
    // نبحث عن: (audio|video|image)-([ء-ي\s\-]+?)-(\d+)-([a-z0-9]+)\.[a-z]+
    const match = filename.match(/(?:audio|video|image)-([ء-ي\s\-]+?)-\d+-[a-z0-9]+\.[a-z]+/i);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // إذا فشل النمط الأول، نحاول استخراج أي نص عربي
    const arabicMatch = filename.match(/[ء-ي\s\-]+/);
    if (arabicMatch) {
      return arabicMatch[0].trim();
    }
    
    // إذا لم نجد نص عربي، نرجع اسم الملف بدون الامتداد
    return filename.replace(/\.[^/.]+$/, '');
  } catch (error) {
    console.error('Error extracting Arabic name from S3 URL:', error);
    return '';
  }
}

export class UploadedFilesController {
  /**
   * الحصول على جميع الملفات المرفوعة
   */
  static async getAllFiles(_req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT 
          id,
          source_id,
          source_type_id,
          file_type,
          original_filename,
          file_size,
          mime_type,
          s3_bucket,
          s3_key,
          s3_url,
          processing_status,
          uploaded_by,
          uploaded_at,
          processed_at,
          media_unit_id
        FROM uploaded_files
        ORDER BY uploaded_at DESC`
      );

      const filesWithArabicNames = result.rows.map((file: FileRow) => ({
        ...file,
        display_name: extractArabicNameFromS3(file.s3_url),
      }));

      res.json({
        success: true,
        data: filesWithArabicNames,
        count: filesWithArabicNames.length,
      });
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch uploaded files',
      });
    }
  }

  /**
   * الحصول على ملفات صوتية فقط
   */
  static async getAudioFiles(_req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT 
          id,
          source_id,
          source_type_id,
          file_type,
          original_filename,
          file_size,
          mime_type,
          s3_bucket,
          s3_key,
          s3_url,
          processing_status,
          uploaded_by,
          uploaded_at,
          processed_at,
          media_unit_id
        FROM uploaded_files
        WHERE file_type = 'audio'
        ORDER BY uploaded_at DESC`
      );

      const filesWithArabicNames = result.rows.map((file: FileRow) => ({
        ...file,
        display_name: extractArabicNameFromS3(file.s3_url),
      }));

      res.json({
        success: true,
        data: filesWithArabicNames,
        count: filesWithArabicNames.length,
      });
    } catch (error) {
      console.error('Error fetching audio files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audio files',
      });
    }
  }

  /**
   * الحصول على ملفات فيديو فقط
   */
  static async getVideoFiles(_req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT 
          id,
          source_id,
          source_type_id,
          file_type,
          original_filename,
          file_size,
          mime_type,
          s3_bucket,
          s3_key,
          s3_url,
          processing_status,
          uploaded_by,
          uploaded_at,
          processed_at,
          media_unit_id
        FROM uploaded_files
        WHERE file_type = 'video'
        ORDER BY uploaded_at DESC`
      );

      const filesWithArabicNames = result.rows.map((file: FileRow) => ({
        ...file,
        display_name: extractArabicNameFromS3(file.s3_url),
      }));

      res.json({
        success: true,
        data: filesWithArabicNames,
        count: filesWithArabicNames.length,
      });
    } catch (error) {
      console.error('Error fetching video files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch video files',
      });
    }
  }

  /**
   * الحصول على ملف بالـ ID
   */
  static async getFileById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT 
          id,
          source_id,
          source_type_id,
          file_type,
          original_filename,
          file_size,
          mime_type,
          s3_bucket,
          s3_key,
          s3_url,
          processing_status,
          uploaded_by,
          uploaded_at,
          processed_at,
          media_unit_id
        FROM uploaded_files
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }

      const file: FileRow = result.rows[0];
      res.json({
        success: true,
        data: {
          ...file,
          display_name: extractArabicNameFromS3(file.s3_url),
        },
      });
    } catch (error) {
      console.error('Error fetching file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch file',
      });
    }
  }

  /**
   * الحصول على ملفات حسب نوع المصدر
   */
  static async getFilesBySourceType(req: Request, res: Response) {
    try {
      const { sourceTypeId } = req.params;
      const result = await query(
        `SELECT 
          id,
          source_id,
          source_type_id,
          file_type,
          original_filename,
          file_size,
          mime_type,
          s3_bucket,
          s3_key,
          s3_url,
          processing_status,
          uploaded_by,
          uploaded_at,
          processed_at,
          media_unit_id
        FROM uploaded_files
        WHERE source_type_id = $1
        ORDER BY uploaded_at DESC`,
        [sourceTypeId]
      );

      const filesWithArabicNames = result.rows.map((file: FileRow) => ({
        ...file,
        display_name: extractArabicNameFromS3(file.s3_url),
      }));

      res.json({
        success: true,
        data: filesWithArabicNames,
        count: filesWithArabicNames.length,
      });
    } catch (error) {
      console.error('Error fetching files by source type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch files',
      });
    }
  }
}
