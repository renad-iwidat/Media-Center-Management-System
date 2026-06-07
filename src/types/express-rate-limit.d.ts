declare module 'express-rate-limit' {
  import { RequestHandler } from 'express';

  interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string | object;
    statusCode?: number;
    headers?: boolean;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: any) => string;
    handler?: (req: any, res: any, next: any, options: any) => void;
    skip?: (req: any, res: any) => boolean;
    standardHeaders?: boolean | string;
    legacyHeaders?: boolean;
  }

  function rateLimit(options?: RateLimitOptions): RequestHandler;
  export default rateLimit;
  export { rateLimit, RateLimitOptions };
}
