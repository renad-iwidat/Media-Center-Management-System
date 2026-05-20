import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL ,
  
  // Server
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Facebook Publishing
  FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID || '',
  FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN || '',
};
