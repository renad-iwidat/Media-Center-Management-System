import { Router } from 'express';
import ordersRouter from './orders';
import tasksRouter from './tasks';

/**
 * Management Routes
 * 
 * Main router for all management-related endpoints:
 * - /api/orders - Order management
 * - /api/tasks - Task management
 */

const router = Router();

/**
 * Order routes
 * Base path: /api/orders
 */
router.use('/orders', ordersRouter);

/**
 * Task routes
 * Base path: /api/tasks
 */
router.use('/tasks', tasksRouter);

export default router;
