import prisma from '../db';
import { emitToUser } from '../socket';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'APPOINTMENT' | 'EMERGENCY' | 'INVENTORY' | 'QUEUE' | 'SYSTEM';
  link?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  static async create(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'SYSTEM',
          link: params.link || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });

      // Emit real-time notification to user via socket
      emitToUser(params.userId, 'notification:new', notification);

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  static async getUserNotifications(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

