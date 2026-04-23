import dotenv from 'dotenv';

dotenv.config();

/**
 * Build DATABASE_URL from individual variables if not provided directly
 * مفيد للـ deployment على Render/Railway اللي بيعطوا المتغيرات منفصلة
 */
const buildDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl;

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    return '';
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

export const environment = {
  // Database
  DATABASE_URL: buildDatabaseUrl(),
  
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Aliases for portal-r compatibility
  databaseUrl: buildDatabaseUrl(),
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};
