/**
 * Swagger Configuration
 * إعدادات Swagger للـ API Documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Media Center Management System API',
      version: '1.0.0',
      description: 'API للنظام الإداري لمركز الإعلام - سحب وتصنيف الأخبار',
      contact: {
        name: 'Media Center',
        email: 'info@mediacenter.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: 'https://api.mediacenter.com',
        description: 'Production Server',
      },
    ],
    components: {
      schemas: {
        Source: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            url: { type: 'string' },
            source_type_id: { type: 'number' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            default_category_id: { type: 'number' },
          },
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            source_id: { type: 'number' },
            source_type_id: { type: 'number' },
            category_id: { type: 'number' },
            url: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            fetch_status: { type: 'string' },
            fetched_at: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            slug: { type: 'string' },
            flow: { type: 'string' },
            is_active: { type: 'boolean' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            count: { type: 'number' },
            data: { type: 'array' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Sources',
        description: 'المصادر - إدارة مصادر الأخبار',
      },
      {
        name: 'Articles',
        description: 'الأخبار - إدارة الأخبار والمقالات',
      },
      {
        name: 'Categories',
        description: 'التصنيفات - إدارة تصنيفات الأخبار',
      },
      {
        name: 'Statistics',
        description: 'الإحصائيات - البيانات والإحصائيات',
      },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
