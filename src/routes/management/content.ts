import { Router, Request, Response } from 'express';
import { ContentController } from '../../controllers/management/ContentController';

const router = Router();
const contentController = new ContentController();

// ============ Metadata (before :id routes) ============
router.get('/types', (req: Request, res: Response) => { contentController.getContentTypes(req, res); });
router.get('/statuses', (req: Request, res: Response) => { contentController.getContentStatuses(req, res); });
router.get('/analytics/most-reused', (req: Request, res: Response) => { contentController.getMostReusedContent(req, res); });

// ============ Pipeline: Shooting → Content ============
router.post('/from-shooting', (req: Request, res: Response) => { contentController.createFromShooting(req, res); });
router.post('/from-shooting/batch', (req: Request, res: Response) => { contentController.createMultipleFromShooting(req, res); });

// ============ CRUD + Unified Filter ============
router.post('/', (req: Request, res: Response) => { contentController.createContent(req, res); });
router.get('/', (req: Request, res: Response) => { contentController.searchContent(req, res); });
router.get('/:id', (req: Request, res: Response) => { contentController.getContent(req, res); });
router.put('/:id', (req: Request, res: Response) => { contentController.updateContent(req, res); });
router.delete('/:id', (req: Request, res: Response) => { contentController.deleteContent(req, res); });

// ============ Tags ============
router.post('/:id/tags', (req: Request, res: Response) => { contentController.addTag(req, res); });
router.delete('/:id/tags/:tagId', (req: Request, res: Response) => { contentController.removeTag(req, res); });

// ============ Reuse ============
router.post('/:id/reuse', (req: Request, res: Response) => { contentController.reuseContent(req, res); });
router.get('/:id/reuse-count', (req: Request, res: Response) => { contentController.getReuseCount(req, res); });
router.get('/:id/reuse-history', (req: Request, res: Response) => { contentController.getContentReuseHistory(req, res); });

// ============ Task Linking ============
router.post('/:id/link-task', (req: Request, res: Response) => { contentController.linkToTask(req, res); });
router.delete('/:id/unlink-task/:taskId', (req: Request, res: Response) => { contentController.unlinkFromTask(req, res); });

// ============ Archive ============
router.post('/:id/archive', (req: Request, res: Response) => { contentController.archiveContent(req, res); });

export default router;
