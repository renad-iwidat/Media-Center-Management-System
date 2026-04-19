/**
 * Data Routes
 * مسارات البيانات (المصادر والأخبار والتصنيفات)
 */

import { Router } from 'express';
import {
  getAllSources,
  getActiveSources,
  getAllArticles,
  getArticlesBySource,
  getAllCategories,
  getArticlesByCategory,
  getComprehensiveData,
  getStatistics,
  getMediaUnits,
  getIncompleteArticles,
  getArticleById,
  updateArticleContent,
  deleteArticle,
} from '../../controllers/news/data.controller';

const router = Router();

// Media Units
router.get('/media-units', getMediaUnits);

// أخبار ناقصة المحتوى
router.get('/articles/incomplete', getIncompleteArticles);
router.get('/articles/:id/detail', getArticleById);
router.put('/articles/:id/content', updateArticleContent);
router.delete('/articles/:id', deleteArticle);

/**
 * @swagger
 * /data/sources:
 *   get:
 *     summary: الحصول على جميع المصادر
 *     description: جلب قائمة بجميع مصادر الأخبار
 *     tags:
 *       - Sources
 *     responses:
 *       200:
 *         description: نجح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Source'
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/sources', getAllSources);

/**
 * @swagger
 * /data/sources/active:
 *   get:
 *     summary: الحصول على المصادر النشطة
 *     description: جلب قائمة بالمصادر النشطة فقط
 *     tags:
 *       - Sources
 *     responses:
 *       200:
 *         description: نجح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Source'
 */
router.get('/sources/active', getActiveSources);

/**
 * @swagger
 * /data/articles:
 *   get:
 *     summary: الحصول على جميع الأخبار
 *     description: جلب قائمة بجميع الأخبار مع دعم الـ pagination
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: عدد الأخبار (افتراضي 100)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *         description: رقم البداية (افتراضي 0)
 *     responses:
 *       200:
 *         description: نجح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: number
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 */
router.get('/articles', getAllArticles);

/**
 * @swagger
 * /data/articles/source/{sourceId}:
 *   get:
 *     summary: الحصول على أخبار مصدر معين
 *     description: جلب جميع الأخبار من مصدر محدد
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: number
 *         description: معرف المصدر
 *     responses:
 *       200:
 *         description: نجح
 *       400:
 *         description: معرف المصدر غير صحيح
 */
router.get('/articles/source/:sourceId', getArticlesBySource);

/**
 * @swagger
 * /data/categories:
 *   get:
 *     summary: الحصول على جميع التصنيفات
 *     description: جلب قائمة بجميع تصنيفات الأخبار
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: نجح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/categories', getAllCategories);

/**
 * @swagger
 * /data/articles/category/{categoryId}:
 *   get:
 *     summary: الحصول على أخبار تصنيف معين
 *     description: جلب جميع الأخبار من تصنيف محدد
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: number
 *         description: معرف التصنيف
 *     responses:
 *       200:
 *         description: نجح
 *       400:
 *         description: معرف التصنيف غير صحيح
 */
router.get('/articles/category/:categoryId', getArticlesByCategory);

/**
 * @swagger
 * /data/comprehensive:
 *   get:
 *     summary: الحصول على بيانات شاملة
 *     description: جلب جميع البيانات (مصادر + أخبار + تصنيفات)
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: نجح
 */
router.get('/comprehensive', getComprehensiveData);

/**
 * @swagger
 * /data/statistics:
 *   get:
 *     summary: الحصول على الإحصائيات
 *     description: جلب إحصائيات شاملة عن النظام
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: نجح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSources:
 *                       type: number
 *                     activeSources:
 *                       type: number
 *                     totalArticles:
 *                       type: number
 *                     totalCategories:
 *                       type: number
 *                     articlesByCategory:
 *                       type: object
 *                     articlesBySource:
 *                       type: object
 */
router.get('/statistics', getStatistics);

export default router;
