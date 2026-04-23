import { Router, Request, Response } from 'express';
import { ContentController } from '../../controllers/management/ContentController';

const router = Router();
const contentController = new ContentController();

// ============ Metadata (before :id routes) ============
router.get('/types', (req: Request, res: Response) => { contentController.getContentTypes(req, res); });
router.get('/statuses', (req: Request, res: Response) => { contentController.getContentStatuses(req, res); });
router.get('/search', (req: Request, res: Response) => { contentController.searchContent(req, res); });
router.get('/archived', (req: Request, res: Response) => { contentController.getArchivedContent(req, res); });

// ============ Pipeline: Shooting → Content ============
router.post('/from-shooting', (req: Request, res: Response) => { contentController.createFromShooting(req, res); });
router.post('/from-shooting/batch', (req: Request, res: Response) => { contentController.createMultipleFromShooting(req, res); });

// ============ CRUD ============
router.post('/', (req: Request, res: Response) => { contentController.createContent(req, res); });
router.get('/', (req: Request, res: Response) => { contentController.getAllContent(req, res); });
router.get('/:id', (req: Request, res: Response) => { contentController.getContent(req, res); });
router.put('/:id', (req: Request, res: Response) => { contentController.updateContent(req, res); });
router.delete('/:id', (req: Request, res: Response) => { contentController.deleteContent(req, res); });

// ============ Filtering ============
router.get('/type/:typeId', (req: Request, res: Response) => { contentController.getContentByType(req, res); });
router.get('/status/:statusId', (req: Request, res: Response) => { contentController.getContentByStatus(req, res); });
router.get('/creator/:userId', (req: Request, res: Response) => { contentController.getContentByCreator(req, res); });
router.get('/media-unit/:mediaUnitId', (req: Request, res: Response) => { contentController.getContentByMediaUnit(req, res); });

// ============ Tags ============
router.post('/:id/tags', (req: Request, res: Response) => { contentController.addTag(req, res); });
router.delete('/:id/tags/:tagId', (req: Request, res: Response) => { contentController.removeTag(req, res); });

// ============ Task Linking (Reuse) ============
router.post('/:id/link-task', (req: Request, res: Response) => { contentController.linkToTask(req, res); });
router.delete('/:id/unlink-task/:taskId', (req: Request, res: Response) => { contentController.unlinkFromTask(req, res); });

// ============ Archive ============
router.post('/:id/archive', (req: Request, res: Response) => { contentController.archiveContent(req, res); });

export default router;
