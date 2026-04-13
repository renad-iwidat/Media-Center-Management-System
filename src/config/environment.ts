import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  aiClassifierUrl: process.env.AI_CLASSIFIER_URL || '',
  articlesPerSource: parseInt(process.env.ARTICLES_PER_SOURCE || '20', 10),
  schedulerInterval: parseInt(process.env.SCHEDULER_INTERVAL || '10', 10),
};
