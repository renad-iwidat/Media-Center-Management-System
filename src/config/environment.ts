import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://media_center_db_user:r7Xdw8zqsFnNwauT2UDppnbQU9k4ZR41@dpg-d7bg2jqa214c73edlb10-a.oregon-postgres.render.com/media_center_db',
  
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
