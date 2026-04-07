/**
 * Data Storage Service
 * 
 * مسؤول عن حفظ البيانات في ملفات JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import { RSSFetchResult } from './rss-fetcher.service';

/**
 * واجهة لنتيجة التخزين
 */
export interface StorageResult {
  timestamp: string;
  totalSources: number;
  successCount: number;
  failureCount: number;
  data: RSSFetchResult[];
}

/**
 * فئة Data Storage Service
 * تتعامل مع حفظ البيانات في JSON
 */
class DataStorageService {
  private outputDir = path.join(process.cwd(), 'output');

  constructor() {
    // إنشاء مجلد output إذا لم يكن موجود
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * حفظ نتائج RSS في ملف JSON
   * 
   * @param results - نتائج السحب
   * @param filename - اسم الملف
   * @returns مسار الملف المحفوظ
   */
  saveRSSResults(results: RSSFetchResult[], filename: string): string {
    const successCount = results.filter((r) => !r.error).length;
    const failureCount = results.filter((r) => r.error).length;

    const storageResult: StorageResult = {
      timestamp: new Date().toISOString(),
      totalSources: results.length,
      successCount,
      failureCount,
      data: results,
    };

    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(storageResult, null, 2), 'utf-8');

    return filepath;
  }

  /**
   * حفظ نتائج متعددة في ملف واحد
   * 
   * @param mainResults - النتائج الرئيسية
   * @param diverseResults - النتائج المتنوعة
   * @param filename - اسم الملف
   * @returns مسار الملف المحفوظ
   */
  saveAllResults(
    mainResults: RSSFetchResult[],
    diverseResults: RSSFetchResult[],
    filename: string
  ): string {
    const allResults = [...mainResults, ...diverseResults];
    const successCount = allResults.filter((r) => !r.error).length;
    const failureCount = allResults.filter((r) => r.error).length;

    const storageResult: StorageResult = {
      timestamp: new Date().toISOString(),
      totalSources: allResults.length,
      successCount,
      failureCount,
      data: allResults,
    };

    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(storageResult, null, 2), 'utf-8');

    return filepath;
  }

  /**
   * قراءة ملف JSON
   * 
   * @param filename - اسم الملف
   * @returns البيانات المقروءة
   */
  readResults(filename: string): StorageResult | null {
    try {
      const filepath = path.join(this.outputDir, filename);
      if (!fs.existsSync(filepath)) {
        return null;
      }

      const data = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ خطأ في قراءة الملف:', error);
      return null;
    }
  }

  /**
   * الحصول على مسار مجلد الـ output
   */
  getOutputDir(): string {
    return this.outputDir;
  }
}

// تصدير instance واحد من الخدمة
export const dataStorageService = new DataStorageService();
