import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL ,
  
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};