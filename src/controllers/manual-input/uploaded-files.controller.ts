/**
 * Uploaded Files Controller
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

export class UploadedFilesController {
  /**
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط±ظپظˆط¹ط©
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
        display_name: file.original_filename,
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
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ظ„ظپط§طھ طµظˆطھظٹط© ظپظ‚ط·
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
        display_name: file.original_filename,
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
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ظ„ظپط§طھ ظپظٹط¯ظٹظˆ ظپظ‚ط·
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
        display_name: file.original_filename,
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
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ظ„ظپ ط¨ط§ظ„ظ€ ID
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
          display_name: file.original_filename,
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
   * ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ظ„ظپط§طھ ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ظ…طµط¯ط±
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
        display_name: file.original_filename,
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
