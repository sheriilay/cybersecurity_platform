const pool = require('../config/database');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum requests per window

const rateLimiter = async (req, res, next) => {
  const userId = req.user?.id;
  const endpoint = req.path;
  const now = new Date();

  try {
    // Get or create rate limit record
    const [rows] = await pool.execute(
      'SELECT * FROM rate_limits WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );

    let rateLimit = rows[0];

    if (!rateLimit) {
      // Create new rate limit record
      const [result] = await pool.execute(
        'INSERT INTO rate_limits (user_id, endpoint, request_count, window_start) VALUES (?, ?, 1, ?)',
        [userId, endpoint, now]
      );
      rateLimit = {
        id: result.insertId,
        request_count: 1,
        window_start: now
      };
    } else {
      // Check if window has expired
      const windowStart = new Date(rateLimit.window_start);
      if (now - windowStart > WINDOW_MS) {
        // Reset window
        await pool.execute(
          'UPDATE rate_limits SET request_count = 1, window_start = ? WHERE id = ?',
          [now, rateLimit.id]
        );
        rateLimit.request_count = 1;
        rateLimit.window_start = now;
      } else {
        // Increment request count
        await pool.execute(
          'UPDATE rate_limits SET request_count = request_count + 1 WHERE id = ?',
          [rateLimit.id]
        );
        rateLimit.request_count++;
      }
    }

    // Check if rate limit exceeded
    if (rateLimit.request_count > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((WINDOW_MS - (now - new Date(rateLimit.window_start))) / 1000)
      });
    }

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': MAX_REQUESTS,
      'X-RateLimit-Remaining': MAX_REQUESTS - rateLimit.request_count,
      'X-RateLimit-Reset': Math.ceil((new Date(rateLimit.window_start).getTime() + WINDOW_MS) / 1000)
    });

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Continue without rate limiting if there's an error
  }
};

module.exports = rateLimiter; 