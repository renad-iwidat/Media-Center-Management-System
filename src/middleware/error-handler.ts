/**
 * Global Error Handler Middleware
 * معالج الأخطاء المركزي — يمسك أي خطأ لم يُعالج في الـ controllers
 *
 * الفوائد:
 * - response format موحد لكل الأخطاء
 * - لا يتسرب stack trace للـ client في production
 * - تسجيل مركزي للأخطاء
 */

import { Request, Response, NextFunction } from 'express';

// ── Custom Error Classes ─────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'المورد') {
    super(404, `${resource} غير موجود`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'غير مصرح — يرجى تسجيل الدخول') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'غير مسموح — لا تملك صلاحية الوصول') {
    super(403, message);
  }
}

// ── Error Handler Middleware ─────────────────────────────────────────────────

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = 500;
  let message = 'خطأ داخلي في السيرفر';
  let isOperational = false;

  // AppError (أخطاء متوقعة)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }
  // PostgreSQL errors
  else if ((err as any).code) {
    const pgCode = (err as any).code;
    if (pgCode === '23505') {
      statusCode = 409;
      message = 'البيانات موجودة مسبقاً (تكرار)';
      isOperational = true;
    } else if (pgCode === '23503') {
      statusCode = 400;
      message = 'مرجع غير صالح — البيانات المرتبطة غير موجودة';
      isOperational = true;
    } else if (pgCode === '42P01') {
      statusCode = 500;
      message = 'خطأ في قاعدة البيانات — جدول مفقود';
    }
  }
  // JSON parse errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'خطأ في صيغة البيانات المرسلة (JSON غير صالح)';
    isOperational = true;
  }

  // تسجيل الخطأ (فقط الأخطاء غير المتوقعة تستحق stack trace كامل)
  if (!isOperational) {
    console.error('❌ [ERROR] خطأ غير متوقع:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // إرسال الرد
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
}

// ── Async Handler Wrapper ────────────────────────────────────────────────────

/**
 * يلف الـ async controller functions لمسك الأخطاء تلقائياً
 * بدل ما كل handler يحتاج try/catch
 *
 * استخدام:
 *   router.get('/users', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
