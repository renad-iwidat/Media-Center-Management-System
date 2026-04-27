import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { AuthService } from './AuthService';

let io: SocketServer | null = null;

// ربط كل مستخدم بالاتصالات تبعه
const userSockets: Map<string, Set<string>> = new Map();

export class SocketService {

  /**
   * تهيئة الويب سوكت مع السيرفر
   */
  static init(httpServer: HttpServer): SocketServer {
    io = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket: Socket) => {
      console.log('Socket connected:', socket.id);

      // المستخدم بيبعث التوكن عشان نعرف مين هو
      socket.on('authenticate', (token: string) => {
        try {
          const payload = AuthService.verifyToken(token);
          const userId = payload.user_id;

          // نربط الاتصال بالمستخدم
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId)!.add(socket.id);

          // نضم الاتصال لغرفة المستخدم
          socket.join('user_' + userId);

          socket.emit('authenticated', { message: 'Connected successfully' });
          console.log('User authenticated:', userId, '| Socket:', socket.id);
        } catch {
          socket.emit('auth_error', { message: 'Invalid token' });
        }
      });

      socket.on('disconnect', () => {
        // ننظف الاتصال
        for (const [userId, sockets] of userSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              userSockets.delete(userId);
            }
            break;
          }
        }
        console.log('Socket disconnected:', socket.id);
      });
    });

    console.log('WebSocket server initialized');
    return io;
  }

  /**
   * إرسال إشعار لحظي لمستخدم معين
   */
  static sendToUser(userId: string | bigint, event: string, data: any): void {
    if (!io) return;
    io.to('user_' + String(userId)).emit(event, data);
  }

  /**
   * إرسال إشعار لحظي لمستخدم — اختصار
   */
  static notifyUser(userId: string | bigint, notification: any): void {
    this.sendToUser(userId, 'notification', notification);
  }

  /**
   * إرسال لكل المتصلين
   */
  static broadcast(event: string, data: any): void {
    if (!io) return;
    io.emit(event, data);
  }

  /**
   * هل المستخدم متصل؟
   */
  static isUserOnline(userId: string | bigint): boolean {
    return userSockets.has(String(userId));
  }

  /**
   * عدد المتصلين
   */
  static getOnlineCount(): number {
    return userSockets.size;
  }
}
