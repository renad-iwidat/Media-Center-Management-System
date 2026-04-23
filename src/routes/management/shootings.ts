import { Router, Request, Response } from 'express';
import { ShootingController } from '../../controllers/management/ShootingController';

const router = Router();
const shootingController = new ShootingController();

// CRUD
router.post('/', (req: Request, res: Response) => { shootingController.createShooting(req, res); });
router.get('/', (req: Request, res: Response) => { shootingController.getAllShootings(req, res); });
router.get('/:id', (req: Request, res: Response) => { shootingController.getShooting(req, res); });
router.put('/:id', (req: Request, res: Response) => { shootingController.updateShooting(req, res); });
router.delete('/:id', (req: Request, res: Response) => { shootingController.deleteShooting(req, res); });

// Filtering
router.get('/order/:orderId', (req: Request, res: Response) => { shootingController.getShootingsByOrder(req, res); });
router.get('/task/:taskId', (req: Request, res: Response) => { shootingController.getShootingsByTask(req, res); });
router.get('/creator/:userId', (req: Request, res: Response) => { shootingController.getShootingsByCreator(req, res); });

export default router;
