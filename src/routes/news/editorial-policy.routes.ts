/**
 * Editorial Policy Routes
 * مسارات تطبيق سياسات التحرير
 */

import { Router } from 'express';
import {
  applyPolicy,
  applyPoliciesPipeline,
  getPolicies,
  getPolicyDetails,
  updatePolicy,
  createPolicy,
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
 * GET /api/news/editorial-policies/:policyName
 * جلب تفاصيل سياسة واحدة
 */
router.get('/:policyName', getPolicyDetails);

/**
 * PUT /api/news/editorial-policies/:policyName
 * تحديث سياسة
 */
router.put('/:policyName', updatePolicy);

export default router;
