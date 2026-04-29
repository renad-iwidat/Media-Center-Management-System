/**
 * BigInt Serialization Utility
 * 
 * PostgreSQL BIGSERIAL returns bigint in Node.js
 * JSON.stringify() doesn't support bigint by default
 * This utility converts bigint to number for JSON responses
 */

/**
 * Convert bigint values to numbers recursively
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj) as T;
  }

  // Don't convert Date objects
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as T;
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key as keyof T];
        // Don't convert Date objects
        if (value instanceof Date) {
          serialized[key] = value;
        } else {
          serialized[key] = serializeBigInt(value);
        }
      }
    }
    return serialized;
  }

  return obj;
}

/**
 * Custom JSON.stringify that handles bigint
 */
export function stringifyWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'bigint') return Number(value);
    if (value instanceof Date) return value.toISOString();
    return value;
  });
}

/**
 * Express middleware to automatically serialize bigint in responses
 */
export function bigIntSerializerMiddleware(_req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    return originalJson(serializeBigInt(body));
  };
  
  next();
}
