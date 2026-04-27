import { Router } from 'express';
import authRouter from './auth';
import ordersRouter from './orders';
import tasksRouter from './tasks';
import kpiRouter from './kpi';
import shootingsRouter from './shootings';
import contentRouter from './content';
import permissionsRouter from './permissions';
import notificationsRouter from './notifications';

const router = Router();

router.use('/auth', authRouter);
router.use('/orders', ordersRouter);
router.use('/tasks', tasksRouter);
router.use('/kpi', kpiRouter);
router.use('/shootings', shootingsRouter);
router.use('/content', contentRouter);
router.use('/permissions', permissionsRouter);
router.use('/notifications', notificationsRouter);

export default router;
