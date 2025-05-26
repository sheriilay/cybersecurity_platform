const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

class PasswordResetService {
  constructor() {
    // Configure email transport if available
    if (process.env.EMAIL_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  /**
   * Generate a secure reset token and store it
   * @param {string} username - User's username
   * @param {string} email - User's email address
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async initiateReset(username, email) {
    let client;
    try {
      client = await pool.connect();
      
      // Find the user
      const userResult = await client.query(
        'SELECT id, email FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      
      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      const user = userResult.rows[0];
      
      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Set expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Check if entry already exists and update it, or create new one
      await client.query(`
        INSERT INTO password_reset_tokens 
        (user_id, token, expires_at) 
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) 
        DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP
      `, [user.id, tokenHash, expiresAt]);
      
      // Log this event
      await client.query(`
        INSERT INTO security_logs 
        (user_id, action, details) 
        VALUES ($1, $2, $3)
      `, [user.id, 'password_reset_request', JSON.stringify({
        source: 'user_request',
        reason: 'Initiated by user'
      })]);
      
      // Send email if configuration exists
      if (this.transporter) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user.id}`;
        
        await this.transporter.sendMail({
          to: user.email,
          subject: 'Password Reset',
          html: `
            <p>You requested a password reset.</p>
            <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
            <p>If you didn't request this, you can ignore this email.</p>
            <p>The link expires in 1 hour.</p>
          `
        });
      }
      
      return {
        success: true,
        message: 'Password reset initiated. Check your email for instructions.'
      };
      
    } catch (error) {
      console.error('Password reset initiation error:', error);
      return { 
        success: false, 
        message: 'Failed to process password reset request' 
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Complete password reset with token
   * @param {number} userId - User ID
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async completeReset(userId, token, newPassword) {
    let client;
    try {
      client = await pool.connect();
      
      // Hash the token for comparison
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Check if token exists and is valid
      const tokenResult = await client.query(`
        SELECT * FROM password_reset_tokens
        WHERE user_id = $1 AND token = $2 AND expires_at > CURRENT_TIMESTAMP
      `, [userId, tokenHash]);
      
      if (tokenResult.rows.length === 0) {
        return {
          success: false,
          message: 'Invalid or expired token'
        };
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the user's password
      await client.query(`
        UPDATE users SET password = $1 WHERE id = $2
      `, [hashedPassword, userId]);
      
      // Delete the used token
      await client.query(`
        DELETE FROM password_reset_tokens WHERE user_id = $1
      `, [userId]);
      
      // Log this event
      await client.query(`
        INSERT INTO security_logs 
        (user_id, action, details) 
        VALUES ($1, $2, $3)
      `, [userId, 'password_reset_complete', JSON.stringify({
        source: 'user_completed',
        timestamp: new Date()
      })]);
      
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
      
    } catch (error) {
      console.error('Password reset completion error:', error);
      return {
        success: false,
        message: 'Failed to reset password'
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  
  /**
   * Admin function to force reset a user's password
   * @param {number} adminId - Admin user ID performing the reset
   * @param {number} targetUserId - User ID to reset
   * @param {string} temporaryPassword - Temporary password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async adminForceReset(adminId, targetUserId, temporaryPassword) {
    let client;
    try {
      client = await pool.connect();
      
      // Verify admin privileges
      const adminCheck = await client.query(`
        SELECT role FROM users WHERE id = $1 AND role = 'admin'
      `, [adminId]);
      
      if (adminCheck.rows.length === 0) {
        return {
          success: false,
          message: 'Unauthorized action'
        };
      }
      
      // Check if target user exists
      const userCheck = await client.query(`
        SELECT id FROM users WHERE id = $1
      `, [targetUserId]);
      
      if (userCheck.rows.length === 0) {
        return {
          success: false,
          message: 'Target user not found'
        };
      }
      
      // Hash the temporary password
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      
      // Update the user's password
      await client.query(`
        UPDATE users SET 
        password = $1,
        password_reset_required = TRUE
        WHERE id = $2
      `, [hashedPassword, targetUserId]);
      
      // Log this action
      await client.query(`
        INSERT INTO security_logs 
        (user_id, action, details) 
        VALUES ($1, $2, $3)
      `, [targetUserId, 'admin_password_reset', JSON.stringify({
        admin_id: adminId,
        reason: 'Admin force reset',
        timestamp: new Date()
      })]);
      
      return {
        success: true,
        message: 'User password has been reset'
      };
      
    } catch (error) {
      console.error('Admin password reset error:', error);
      return {
        success: false,
        message: 'Failed to reset user password'
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}

module.exports = new PasswordResetService(); 