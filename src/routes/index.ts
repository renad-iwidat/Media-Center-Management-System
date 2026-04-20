import { Router } from 'express';
import managementRouter from './management';

/**
 * Main API Routes
 * 
 * All API routes are organized by module:
 * - /api/orders - Order management
 * - /api/tasks - Task management
 * - (Future) /api/content - Content management
 * - (Future) /api/users - User management
 * - (Future) /api/news - News management
 */

const router = Router();

/**
 * Management routes
 * Includes: Orders, Tasks
 */
router.use('/', managementRouter);

export default router;
