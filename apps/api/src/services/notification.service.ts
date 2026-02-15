
import { db } from '../utils/db.js';

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(
    userId: number,
    type: 'price_alert' | 'system' | 'opportunity',
    title: string,
    message: string,
    data: any = null
  ) {
    try {
      await db`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (${userId}, ${type}, ${title}, ${message}, ${data})
      `;
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw, just log. Notifications shouldn't break the flow.
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: number) {
    const result = await db`
      SELECT * FROM notifications 
      WHERE user_id = ${userId} AND is_read = FALSE
      ORDER BY created_at DESC
    `;
    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Get all notifications for a user
   */
  static async getAllNotifications(userId: number, limit = 50) {
    const result = await db`
      SELECT * FROM notifications 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: number, userId: number) {
    await db`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = ${notificationId} AND user_id = ${userId}
    `;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number) {
    await db`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE user_id = ${userId} AND is_read = FALSE
    `;
  }
}
