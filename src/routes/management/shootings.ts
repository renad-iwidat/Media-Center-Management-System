import { Router, Request, Response } from 'express';
import { ShootingController } from '../../controllers/management/ShootingController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const shootingController = new ShootingController();

router.use(authenticate);

router.get('/enriched', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getAllShootingsEnriched(req, res); });
router.post('/', requirePermission('shootings.create'), (req: Request, res: Response) => { shootingController.createShooting(req, res); });
router.get('/', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getAllShootings(req, res); });
router.get('/:id', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getShooting(req, res); });
router.put('/:id', requirePermission('shootings.edit'), (req: Request, res: Response) => { shootingController.updateShooting(req, res); });
router.delete('/:id', requirePermission('shootings.edit'), (req: Request, res: Response) => { shootingController.deleteShooting(req, res); });
router.get('/:id/enriched', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getShootingEnriched(req, res); });
router.get('/:id/full', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getShootingFull(req, res); });
router.get('/order/:orderId', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getShootingsByOrder(req, res); });
router.get('/task/:taskId', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getShootingsByTask(req, res); });
router.get('/creator/:userId', requirePermission('shootings.view'), (req: Request, res: Response) => { shootingController.getShootingsByCreator(req, res); });

export default router;
