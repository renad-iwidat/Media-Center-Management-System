import { Request, Response } from 'express';
import { ContentService } from '../../services/management/ContentService';

export class ContentController {
  private contentService: ContentService;

  constructor() {
    this.contentService = new ContentService();
  }

  // ============ CRUD ============

  async createContent(req: Request, res: Response): Promise<void> {
    try {
      const { title, content_type_id, task_id, owner_type, owner_id, status_id, media_unit_id, created_by, tags, cloud_url, file_size, duration } = req.body;

      if (!title || !content_type_id || !created_by) {
        this.sendError(res, 'title, content_type_id, and created_by are required', 400);
        return;
      }

      const content = await this.contentService.createContent({
        title,
        content_type_id: BigInt(content_type_id),
        task_id: task_id ? BigInt(task_id) : undefined,
        owner_type,
        owner_id: owner_id ? BigInt(owner_id) : undefined,
        status_id: status_id ? BigInt(status_id) : undefined,
        media_unit_id: media_unit_id ? BigInt(media_unit_id) : undefined,
        created_by: BigInt(created_by),
        tags,
        cloud_url,
        file_size,
        duration,
      });

      this.sendSuccess(res, content, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async uploadContent(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, media_unit_id, created_by, tags } = req.body;
      const file = (req as any).file;

      if (!file || !title || !created_by) {
        this.sendError(res, 'file, title, and created_by are required', 400);
        return;
      }

      // Upload file to S3
      const { S3Service } = await import('../../services/management/S3Service');
      const uploadResult = await S3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'content',
        title
      );

      // Create content record
      const content = await this.contentService.createContent({
        title,
        content_type_id: BigInt(1), // Default content type
        media_unit_id: media_unit_id ? BigInt(media_unit_id) : undefined,
        created_by: BigInt(created_by),
        tags: tags ? JSON.parse(tags) : [],
        cloud_url: uploadResult.url,
        file_size: file.size,
      });

      this.sendSuccess(res, content, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getContent(req: Request, res: Response): Promise<void> {
    try {
      const content = await this.contentService.getContent(BigInt(req.params.id));
      this.sendSuccess(res, content);
    } catch (error) {
      this.sendError(res, error, 404);
    }
  }

  async getContentDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const content = await this.contentService.getContent(BigInt(req.params.id));
      if (!content.cloud_url) {
        this.sendError(res, 'No download URL available for this content', 404);
        return;
      }
      
      // Extract S3 key from URL
      const url = new URL(content.cloud_url);
      const key = url.pathname.substring(1); // Remove leading slash
      
      const downloadUrl = await this.contentService.getPresignedDownloadUrl(key);
      this.sendSuccess(res, { download_url: downloadUrl });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getAllContent(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const content = await this.contentService.getAllContent(limit, offset);
      this.sendSuccess(res, content);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async updateContent(req: Request, res: Response): Promise<void> {
    try {
      const { title, content_type_id, status_id, is_final, tags, cloud_url, file_size, duration } = req.body;
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (content_type_id !== undefined) updates.content_type_id = BigInt(content_type_id);
      if (status_id !== undefined) updates.status_id = BigInt(status_id);
      if (is_final !== undefined) updates.is_final = is_final;
      if (tags !== undefined) updates.tags = tags;
      if (cloud_url !== undefined) updates.cloud_url = cloud_url;
      if (file_size !== undefined) updates.file_size = file_size;
      if (duration !== undefined) updates.duration = duration;

      const content = await this.contentService.updateContent(BigInt(req.params.id), updates);
      this.sendSuccess(res, content);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async deleteContent(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.contentService.deleteContent(BigInt(req.params.id));
      this.sendSuccess(res, { deleted: result });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Pipeline: Shooting → Content ============

  async createFromShooting(req: Request, res: Response): Promise<void> {
    try {
      const { shooting_id, title, content_type_id, created_by, cloud_url, file_size, duration, tags, output_type } = req.body;

      if (!shooting_id || !title || !content_type_id || !created_by || !output_type) {
        this.sendError(res, 'shooting_id, title, content_type_id, created_by, and output_type are required', 400);
        return;
      }

      const validTypes = ['report', 'social', 'video', 'archive'];
      if (!validTypes.includes(output_type)) {
        this.sendError(res, `output_type must be one of: ${validTypes.join(', ')}`, 400);
        return;
      }

      const content = await this.contentService.createContentFromShooting({
        shooting_id: BigInt(shooting_id),
        title,
        content_type_id: BigInt(content_type_id),
        created_by: BigInt(created_by),
        cloud_url,
        file_size,
        duration,
        tags,
        output_type,
      });

      this.sendSuccess(res, content, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async createMultipleFromShooting(req: Request, res: Response): Promise<void> {
    try {
      const { shooting_id, items, created_by } = req.body;

      if (!shooting_id || !items || !Array.isArray(items) || items.length === 0 || !created_by) {
        this.sendError(res, 'shooting_id, items (array), and created_by are required', 400);
        return;
      }

      const contents = await this.contentService.createMultipleFromShooting(
        BigInt(shooting_id),
        items.map((item: any) => ({
          ...item,
          content_type_id: BigInt(item.content_type_id),
        })),
        BigInt(created_by)
      );

      this.sendSuccess(res, contents, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Unified Search & Filter ============

  async searchContent(req: Request, res: Response): Promise<void> {
    try {
      // Accept both 'archived' and 'is_archived' parameter names
      const archivedParam = req.query.archived !== undefined ? req.query.archived : req.query.is_archived;
      
      const result = await this.contentService.searchContent({
        keyword: req.query.keyword as string,
        content_type_id: req.query.content_type_id ? BigInt(req.query.content_type_id as string) : undefined,
        status_id: req.query.status_id ? BigInt(req.query.status_id as string) : undefined,
        media_unit_id: req.query.media_unit_id ? BigInt(req.query.media_unit_id as string) : undefined,
        created_by: req.query.created_by ? BigInt(req.query.created_by as string) : undefined,
        program_id: req.query.program_id ? BigInt(req.query.program_id as string) : undefined,
        desk_id: req.query.desk_id ? BigInt(req.query.desk_id as string) : undefined,
        from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
        to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
        is_archived: archivedParam !== undefined ? archivedParam === 'true' : undefined,
        sort: (req.query.sort as 'newest' | 'oldest') || 'newest',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      });
      this.sendSuccess(res, result.data, 200, result.total);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Metadata ============

  async getContentTypes(_req: Request, res: Response): Promise<void> {
    try {
      const types = await this.contentService.getContentTypes();
      this.sendSuccess(res, types);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getContentStatuses(_req: Request, res: Response): Promise<void> {
    try {
      const statuses = await this.contentService.getContentStatuses();
      this.sendSuccess(res, statuses);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Tags ============

  async addTag(req: Request, res: Response): Promise<void> {
    try {
      const { tag_id } = req.body;
      if (!tag_id) { this.sendError(res, 'tag_id is required', 400); return; }
      await this.contentService.addTag(BigInt(req.params.id), BigInt(tag_id));
      this.sendSuccess(res, { message: 'Tag added' }, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async removeTag(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.contentService.removeTag(BigInt(req.params.id), BigInt(req.params.tagId));
      this.sendSuccess(res, { removed: result });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Task Linking (Reuse) ============

  async linkToTask(req: Request, res: Response): Promise<void> {
    try {
      const { task_id, linked_by, usage_type } = req.body;
      if (!task_id || !linked_by) { this.sendError(res, 'task_id and linked_by are required', 400); return; }
      await this.contentService.linkToTask(BigInt(req.params.id), BigInt(task_id), BigInt(linked_by), usage_type || 'reference');
      this.sendSuccess(res, { message: 'Content linked to task' }, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async reuseContent(req: Request, res: Response): Promise<void> {
    try {
      const { task_id, reused_by } = req.body;
      if (!task_id || !reused_by) { this.sendError(res, 'task_id and reused_by are required', 400); return; }
      await this.contentService.reuseContent(BigInt(req.params.id), BigInt(task_id), BigInt(reused_by));
      this.sendSuccess(res, { message: 'Content reused successfully' }, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getReuseCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.contentService.getReuseCount(BigInt(req.params.id));
      this.sendSuccess(res, { content_id: req.params.id, reuse_count: count });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getMostReusedContent(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const content = await this.contentService.getMostReusedContent(limit);
      this.sendSuccess(res, content);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getContentReuseHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await this.contentService.getContentReuseHistory(BigInt(req.params.id));
      this.sendSuccess(res, history);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async unlinkFromTask(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.contentService.unlinkFromTask(BigInt(req.params.id), BigInt(req.params.taskId));
      this.sendSuccess(res, { unlinked: result });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Archive ============

  async archiveContent(req: Request, res: Response): Promise<void> {
    try {
      const { archived_by } = req.body;
      if (!archived_by) { this.sendError(res, 'archived_by is required', 400); return; }
      await this.contentService.archiveContent(BigInt(req.params.id), BigInt(archived_by));
      this.sendSuccess(res, { message: 'Content archived' });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Helpers ============

  private sendSuccess(res: Response, data: any, statusCode: number = 200, total?: number): void {
    const response: any = { success: true, data, timestamp: new Date().toISOString() };
    if (total !== undefined) response.total = total;
    res.status(statusCode).json(response);
  }

  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({ success: false, error: message, timestamp: new Date().toISOString() });
  }
}
