import { Request, Response } from 'express';
import { NotificationService } from '../../services/management/NotificationService';

export class NotificationController {

  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const notifications = await NotificationService.getByUser(BigInt(req.user!.user_id), limit, offset);
      res.json({ success: true, data: notifications, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationService.getUnreadCount(BigInt(req.user!.user_id));
      res.json({ success: true, data: { unread_count: count }, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      await NotificationService.markAsRead(BigInt(req.params.id));
      res.json({ success: true, data: { message: 'Notification marked as read' }, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationService.markAllAsRead(BigInt(req.user!.user_id));
      res.json({ success: true, data: { marked: count }, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async checkDeadlines(_req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationService.checkDeadlines();
      res.json({ success: true, data: { notifications_sent: count }, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }
}
