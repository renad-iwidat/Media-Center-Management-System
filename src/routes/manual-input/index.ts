import { Router } from 'express';
import { ManualInputController } from '../../controllers/manual-input/ManualInputController';
import { uploadAudio, uploadVideo } from '../../middleware/upload';

/**
 * Manual Input Routes
 * مسارات API للإدخال اليدوي
 */

const router = Router();

// ==================== GET Routes ====================

// GET /api/manual-input/categories - جلب التصنيفات النشطة
router.get('/categories', ManualInputController.getCategories);

// GET /api/manual-input/sources - جلب كل المصادر (نص، صوت، فيديو)
router.get('/sources', ManualInputController.getSources);

// GET /api/manual-input/source/text - جلب مصدر النص فقط
router.get('/source/text', ManualInputController.getTextSource);

// GET /api/manual-input/pending-files - جلب الملفات المعلقة للمعالجة
router.get('/pending-files', ManualInputController.getPendingFiles);

// GET /api/manual-input/media-units - جلب قائمة الوحدات الإعلامية
router.get('/media-units', ManualInputController.getMediaUnits);

// GET /api/manual-input/users - جلب قائمة كل المستخدمين
router.get('/users', ManualInputController.getAllUsers);

// ==================== POST Routes ====================

// POST /api/manual-input/submit - إرسال خبر نصي جديد
router.post('/submit', ManualInputController.submitNews);

// POST /api/manual-input/upload-audio - رفع ملف صوتي
// Body: multipart/form-data
// - file: الملف الصوتي (required)
// - uploaded_by: معرف المستخدم (required)
router.post('/upload-audio', uploadAudio.single('file'), ManualInputController.uploadAudio);

// POST /api/manual-input/upload-video - رفع ملف فيديو
// Body: multipart/form-data
// - file: ملف الفيديو (required)
// - uploaded_by: معرف المستخدم (required)
router.post('/upload-video', uploadVideo.single('file'), ManualInputController.uploadVideo);

export default router;
