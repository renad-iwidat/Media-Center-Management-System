import { Router } from 'express';
import ordersRouter from './orders';
import tasksRouter from './tasks';
import kpiRouter from './kpi';
import shootingsRouter from './shootings';
import contentRouter from './content';

/**
 * Management Routes
 * 
 * Main router for all management-related endpoints:
 * - /api/orders - Order management
 * - /api/tasks - Task management
 * - /api/kpi - KPI & Analytics
 * - /api/shootings - Shooting management
 * - /api/content - Content management & Archive
 */

const router = Router();

router.use('/orders', ordersRouter);
router.use('/tasks', tasksRouter);
router.use('/kpi', kpiRouter);
router.use('/shootings', shootingsRouter);
router.use('/content', contentRouter);

export default router;
