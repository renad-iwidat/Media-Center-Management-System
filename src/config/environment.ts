import dotenv from 'dotenv';

dotenv.config();

// Build DATABASE_URL from individual variables if not provided
const buildDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl;

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 5432;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    return '';
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

export const environment = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: buildDatabaseUrl(),
  aiClassifierUrl: process.env.AI_CLASSIFIER_URL || '',
  articlesPerSource: parseInt(process.env.ARTICLES_PER_SOURCE || '20', 10),
  schedulerInterval: parseInt(process.env.SCHEDULER_INTERVAL || '10', 10),
};
