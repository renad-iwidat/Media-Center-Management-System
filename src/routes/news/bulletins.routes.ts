import { Router } from 'express';
import {
  createBulletin,
  getBulletins,
  getBulletinById,
  updateBulletin,
  deleteBulletin,
  markAudioGenerated,
} from '../../controllers/news/bulletins.controller';
import { authenticate } from '../../middleware/auth';

/**
 * Bulletins Routes
 * مسارات الموجزات والنشرات المحفوظة
 */

const router = Router();

// إضافة المصادقة على جميع routes
router.use(authenticate);

// CRUD
router.post('/', createBulletin);
router.get('/', getBulletins);
router.get('/:id', getBulletinById);
router.put('/:id', updateBulletin);
router.delete('/:id', deleteBulletin);

// تحديث حالة الصوت
router.patch('/:id/audio', markAudioGenerated);

export default router;
