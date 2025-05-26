const WebSocket = require('ws');
const pool = require('../config/database');

class NotificationService {
  constructor() {
    this.clients = new Map(); // userId -> WebSocket
    this.initializeWebSocket();
  }

  initializeWebSocket() {
    this.wss = new WebSocket.Server({ port: 8080 });

    this.wss.on('connection', (ws, req) => {
      const userId = this.getUserIdFromRequest(req);
      if (userId) {
        this.clients.set(userId, ws);

        ws.on('close', () => {
          this.clients.delete(userId);
        });
      }
    });
  }

  getUserIdFromRequest(req) {
    // Extract user ID from request (implement your authentication logic)
    return req.headers['user-id'];
  }

  async createNotification(userId, type, message) {
    try {
      // Save notification to database
      const [result] = await pool.execute(
        'INSERT INTO user_notifications (user_id, type, message) VALUES (?, ?, ?)',
        [userId, type, message]
      );

      // Send real-time notification if user is connected
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type,
          message,
          timestamp: new Date().toISOString()
        }));
      }

      return result.insertId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotifications(userId, limit = 10) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );
      return rows;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      await pool.execute(
        'UPDATE user_notifications SET read = TRUE WHERE id = ?',
        [notificationId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await pool.execute(
        'UPDATE user_notifications SET read = TRUE WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      await pool.execute(
        'DELETE FROM user_notifications WHERE id = ?',
        [notificationId]
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Specialized notification methods
  async notifyThreatDetected(userId, threatDetails) {
    return this.createNotification(
      userId,
      'threat',
      `New threat detected: ${threatDetails.type} - ${threatDetails.severity}`
    );
  }

  async notifyScanComplete(userId, scanDetails) {
    return this.createNotification(
      userId,
      'scan',
      `Scan completed for ${scanDetails.url} with score: ${scanDetails.score}`
    );
  }

  async notifySystemAlert(userId, alertDetails) {
    return this.createNotification(
      userId,
      'system',
      `System alert: ${alertDetails.message}`
    );
  }
}

module.exports = new NotificationService(); 