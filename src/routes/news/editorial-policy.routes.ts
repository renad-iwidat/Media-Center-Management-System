/**
 * Editorial Policy Routes
 * مسارات تطبيق سياسات التحرير
 */

import { Router } from 'express';
import {
  applyPolicy,
  applyPoliciesPipeline,
  applyPoliciesSequential,
  saveEditedText,
  getPolicies,
  getPolicyDetails,
  updatePolicy,
  createPolicy,
  deletePolicy,
} from '../../controllers/news/editorial-policy.controller';

const router = Router();

/**
 * GET /api/news/editorial-policies
 * جلب جميع السياسات المفعّلة
 */
router.get('/', getPolicies);

/**
 * POST /api/news/editorial-policies
 * إنشاء سياسة جديدة
 */
router.post('/', createPolicy);

/**
 * POST /api/news/editorial-policies/apply
 * تطبيق سياسة واحدة على نص أو خبر من الطابور
 */
router.post('/apply', applyPolicy);

/**
 * POST /api/news/editorial-policies/pipeline
 * تطبيق سلسلة من السياسات على نص
 */
router.post('/pipeline', applyPoliciesPipeline);

/**
 * POST /api/news/editorial-policies/sequential
 * تطبيق سياسات بشكل متسلسل — output1 يصير input للسياسة التالية
 */
router.post('/sequential', applyPoliciesSequential);

/**
 * POST /api/news/editorial-policies/save-edited
 * حفظ النص المعدّل يدوياً من المحرر بعد التطبيق المتسلسل
 */
router.post('/save-edited', saveEditedText);

/**
 * GET /api/news/editorial-policies/:policyName
 * جلب تفاصيل سياسة واحدة
 */
router.get('/:policyName', getPolicyDetails);

/**
 * PUT /api/news/editorial-policies/:policyName
 * تحديث سياسة
 */
router.put('/:policyName', updatePolicy);

/**
 * DELETE /api/news/editorial-policies/:policyName
 * حذف سياسة
 */
router.delete('/:policyName', deletePolicy);

export default router;
