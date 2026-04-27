/**
 * AI Usage Logger Middleware
 * Middleware لتسجيل استخدام AI Hub تلقائياً
 */

import { Request, Response, NextFunction } from 'express';
import { logAIUsage, AIFeature, ResponseStatus } from '../services/ai-hub/ai-usage-logger.service';
import { getClientIdentifier } from '../services/ai-hub/rate-limiter.service';

interface AILoggerOptions {
  feature: AIFeature;
  action: string;
  captureRequest?: boolean;
  captureResponse?: boolean;
}

/**
 * Middleware لتسجيل استخدام AI
 */
export function aiUsageLogger(options: AILoggerOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const userIdentifier = getClientIdentifier(req);
    const userAgent = req.get('user-agent');
    const endpoint = req.originalUrl || req.url;

    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let responseData: any = null;
    let responseStatus: ResponseStatus = 'success';

    // Override res.json to capture response
    res.json = function (body: any) {
      responseData = body;
      
      // Determine status
      if (res.statusCode >= 400) {
        responseStatus = res.statusCode === 429 ? 'rate_limited' : 'error';
      } else if (body && !body.success) {
        responseStatus = 'error';
      }

      return originalJson(body);
    };

    // Override res.send to capture response
    res.send = function (body: any) {
      if (!responseData) {
        responseData = body;
        
        if (res.statusCode >= 400) {
          responseStatus = res.statusCode === 429 ? 'rate_limited' : 'error';
        }
      }

      return originalSend(body);
    };

    // Log after response is sent
    res.on('finish', async () => {
      const durationMs = Date.now() - startTime;

      try {
        // Prepare request data (sanitize sensitive info)
        let requestData: any = null;
        if (options.captureRequest && req.body) {
          requestData = { ...req.body };
          
          // Remove sensitive fields
          if (requestData.password) delete requestData.password;
          if (requestData.token) delete requestData.token;
          if (requestData.apiKey) delete requestData.apiKey;
          
          // Truncate long text fields
          if (requestData.prompt && requestData.prompt.length > 500) {
            requestData.prompt = requestData.prompt.substring(0, 500) + '...';
          }
          if (requestData.text && requestData.text.length > 500) {
            requestData.text = requestData.text.substring(0, 500) + '...';
          }
        }

        // Prepare response data
        let logResponseData: any = null;
        if (options.captureResponse && responseData) {
          if (typeof responseData === 'object') {
            logResponseData = {
              success: responseData.success,
              error: responseData.error,
              // Don't log full response to save space
            };
          }
        }

        // Extract tokens if available
        let tokensUsed: number | undefined;
        if (responseData && typeof responseData === 'object') {
          tokensUsed = responseData.tokensUsed || responseData.tokens_used;
        }

        // Log the usage
        await logAIUsage({
          userIdentifier,
          userAgent,
          feature: options.feature,
          action: options.action,
          endpoint,
          requestData,
          responseStatus,
          responseData: logResponseData,
          durationMs,
          tokensUsed,
        });
      } catch (error) {
        // Don't break the request flow
        console.error('❌ [AI Logger Middleware] Failed to log:', error);
      }
    });

    next();
  };
}

/**
 * Helper لإنشاء middleware بسرعة
 */
export const createAILogger = (feature: AIFeature, action: string) => {
  return aiUsageLogger({
    feature,
    action,
    captureRequest: true,
    captureResponse: true,
  });
};
