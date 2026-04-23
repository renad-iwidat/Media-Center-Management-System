import { Router } from 'express';
import ordersRouter from './orders';
import tasksRouter from './tasks';
import kpiRouter from './kpi';

/**
 * Management Routes
 * 
 * Main router for all management-related endpoints:
 * - /api/orders - Order management
 * - /api/tasks - Task management
 * - /api/kpi - KPI & Analytics
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

/**
 * KPI routes
 * Base path: /api/kpi
 */
router.use('/kpi', kpiRouter);

export default router;
