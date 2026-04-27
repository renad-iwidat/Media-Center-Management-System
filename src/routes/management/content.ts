import { Router, Request, Response } from 'express';
import { ContentController } from '../../controllers/management/ContentController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const contentController = new ContentController();

router.use(authenticate);

// Metadata
router.get('/types', requirePermission('content.view'), (req: Request, res: Response) => { contentController.getContentTypes(req, res); });
router.get('/statuses', requirePermission('content.view'), (req: Request, res: Response) => { contentController.getContentStatuses(req, res); });
router.get('/analytics/most-reused', requirePermission('kpi.view'), (req: Request, res: Response) => { contentController.getMostReusedContent(req, res); });

// Pipeline
router.post('/from-shooting', requirePermission('content.create'), (req: Request, res: Response) => { contentController.createFromShooting(req, res); });
router.post('/from-shooting/batch', requirePermission('content.create'), (req: Request, res: Response) => { contentController.createMultipleFromShooting(req, res); });

// CRUD + Filter
router.post('/', requirePermission('content.create'), (req: Request, res: Response) => { contentController.createContent(req, res); });
router.get('/', requirePermission('content.view'), (req: Request, res: Response) => { contentController.searchContent(req, res); });
router.get('/:id', requirePermission('content.view'), (req: Request, res: Response) => { contentController.getContent(req, res); });
router.put('/:id', requirePermission('content.edit'), (req: Request, res: Response) => { contentController.updateContent(req, res); });
router.delete('/:id', requirePermission('content.delete'), (req: Request, res: Response) => { contentController.deleteContent(req, res); });

// Tags
router.post('/:id/tags', requirePermission('content.edit'), (req: Request, res: Response) => { contentController.addTag(req, res); });
router.delete('/:id/tags/:tagId', requirePermission('content.edit'), (req: Request, res: Response) => { contentController.removeTag(req, res); });

// Reuse
router.post('/:id/reuse', requirePermission('content.view'), (req: Request, res: Response) => { contentController.reuseContent(req, res); });
router.get('/:id/reuse-count', requirePermission('content.view'), (req: Request, res: Response) => { contentController.getReuseCount(req, res); });
router.get('/:id/reuse-history', requirePermission('content.view'), (req: Request, res: Response) => { contentController.getContentReuseHistory(req, res); });

// Task Linking
router.post('/:id/link-task', requirePermission('content.edit'), (req: Request, res: Response) => { contentController.linkToTask(req, res); });
router.delete('/:id/unlink-task/:taskId', requirePermission('content.edit'), (req: Request, res: Response) => { contentController.unlinkFromTask(req, res); });

// Archive
router.post('/:id/archive', requirePermission('content.archive'), (req: Request, res: Response) => { contentController.archiveContent(req, res); });

export default router;
