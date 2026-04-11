/**
 * Classifier Controller
 * متحكم تصنيف الأخبار
 */

import { Request, Response } from 'express';
import { unclassifiedProcessorService } from '../../services/news/unclassified-processor.service';

/**
 * تصنيف الأخبار بدون تصنيف
 */
export async function classifyUnclassifiedArticles(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log('🚀 بدء تصنيف الأخبار بدون تصنيف...');
    
    const result = await unclassifiedProcessorService.processUnclassifiedArticles();

    res.status(200).json({
      success: true,
      message: 'تم معالجة الأخبار بنجاح',
      data: result,
    });
  } catch (error) {
    console.error('❌ خطأ في تصنيف الأخبار:', error);
    
    res.status(500).json({
      success: false,
      message: 'فشل تصنيف الأخبار',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على الأخبار بدون تصنيف
 */
export async function getUnclassifiedArticles(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const articles = await unclassifiedProcessorService.getUnclassifiedArticles();

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الأخبار بدون تصنيف:', error);
    
    res.status(500).json({
      success: false,
      message: 'فشل جلب الأخبار بدون تصنيف',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}
