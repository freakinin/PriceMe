
import { Router } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/notifications - Get all notifications for user
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const notifications = await NotificationService.getAllNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread - Get unread notifications
router.get('/unread', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const notifications = await NotificationService.getUnreadNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({ error: 'Failed to fetch unread notifications' });
    }
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const notificationId = parseInt(req.params.id);
        await NotificationService.markAsRead(notificationId, userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', async (req, res) => {
    try {
        const userId = (req as any).userId;
        await NotificationService.markAllAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

export default router;
