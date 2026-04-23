/**
 * Uploaded Files Routes
 * مسارات الملفات المرفوعة
 */

import express from 'express';
import { UploadedFilesController } from '../../controllers/manual-input/uploaded-files.controller';

const router = express.Router();

// الحصول على جميع الملفات
router.get('/', UploadedFilesController.getAllFiles);

// الحصول على ملفات صوتية فقط
router.get('/audio', UploadedFilesController.getAudioFiles);

// الحصول على ملفات فيديو فقط
router.get('/video', UploadedFilesController.getVideoFiles);

// الحصول على ملفات حسب نوع المصدر
router.get('/source-type/:sourceTypeId', UploadedFilesController.getFilesBySourceType);

// الحصول على ملف بالـ ID
router.get('/:id', UploadedFilesController.getFileById);

export default router;
