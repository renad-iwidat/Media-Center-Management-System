/**
 * Transcription Editorial Routes
 * مسارات إدارة الجهات الإعلامية وأنواع المخرجات ومنصات السوشال
 */

import { Router } from 'express';
import {
  getOutletProfiles,
  getOutletProfileBySlug,
  createOutletProfile,
  updateOutletProfile,
  deleteOutletProfile,
  getOutputTypes,
  createOutputType,
  updateOutputType,
  getSocialPlatforms,
  createSocialPlatform,
  getOutletOutputConfig,
  upsertOutletOutputConfig,
  getAngleRules,
  createAngleRule,
  getQualityCriteria,
} from '../../controllers/ai-hub/transcription-editorial.controller';

const router = Router();

// ── Outlet Editorial Profiles (الجهات الإعلامية) ────────────────────────────
router.get('/outlets', getOutletProfiles);
router.get('/outlets/:slug', getOutletProfileBySlug);
router.post('/outlets', createOutletProfile);
router.put('/outlets/:slug', updateOutletProfile);
router.delete('/outlets/:slug', deleteOutletProfile);

// ── Transcription Output Types (أنواع المخرجات) ─────────────────────────────
router.get('/output-types', getOutputTypes);
router.post('/output-types', createOutputType);
router.put('/output-types/:id', updateOutputType);

// ── Social Media Platforms (منصات السوشال) ───────────────────────────────────
router.get('/social-platforms', getSocialPlatforms);
router.post('/social-platforms', createSocialPlatform);

// ── Outlet Output Config (تخصيص المخرجات حسب الجهة) ─────────────────────────
router.get('/outlet-config/:outletSlug', getOutletOutputConfig);
router.post('/outlet-config', upsertOutletOutputConfig);

// ── Angle Decision Rules (خريطة القرار) ─────────────────────────────────────
router.get('/angle-rules', getAngleRules);
router.post('/angle-rules', createAngleRule);

// ── Quality Criteria (معايير الجودة) ─────────────────────────────────────────
router.get('/quality-criteria', getQualityCriteria);

export default router;
