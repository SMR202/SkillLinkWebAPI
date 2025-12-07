const express = require('express');
const { Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get my notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isRead, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Count unread notifications
    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Notification not found' 
      });
    }

    // Verify ownership
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only update your own notifications' 
      });
    }

    await notification.update({ isRead: true });

    res.json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to mark notification as read',
      error: error.message 
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to mark all notifications as read',
      error: error.message 
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Notification not found' 
      });
    }

    // Verify ownership
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You can only delete your own notifications' 
      });
    }

    await notification.destroy();

    res.json({
      status: 'success',
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to delete notification',
      error: error.message 
    });
  }
});

module.exports = router;
