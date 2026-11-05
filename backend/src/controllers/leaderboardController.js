import { getPool } from '../config/db.js';

/**
 * Get dynamic leaderboard from MySQL.
 * Strictly prevents data leaks (excludes password_hash, email, or internal data).
 */
export const getLeaderboard = async (req, res) => {
  try {
    const type = req.query.type || 'score'; // 'score' | 'streak' | 'recent'
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));

    const db = getPool();

    if (type === 'streak') {
      const [rows] = await db.query(
        `SELECT id, username, avatar, best_streak, total_score, games_played, correct_answers,
                ROUND((correct_answers / GREATEST(games_played, 1)) * 100) AS accuracy
         FROM users
         WHERE best_streak > 0
         ORDER BY best_streak DESC, total_score DESC
         LIMIT ?`,
        [limit]
      );

      const ranked = rows.map((row, index) => ({
        rank: index + 1,
        ...row,
      }));

      return res.json({ success: true, type: 'streak', leaderboard: ranked });
    }

    if (type === 'recent') {
      const [rows] = await db.query(
        `SELECT sh.id, sh.points, sh.streak, sh.time_taken_ms, sh.hints_used, sh.created_at,
                u.username, u.avatar
         FROM score_history sh
         JOIN users u ON u.id = sh.user_id
         WHERE sh.result = 'correct'
         ORDER BY sh.id DESC
         LIMIT ?`,
        [limit]
      );

      return res.json({ success: true, type: 'recent', activity: rows });
    }

    // Default: Top Scorers
    const [rows] = await db.query(
      `SELECT id, username, avatar, total_score, best_streak, current_streak, games_played, correct_answers,
              ROUND((correct_answers / GREATEST(games_played, 1)) * 100) AS accuracy
       FROM users
       ORDER BY total_score DESC, best_streak DESC, id ASC
       LIMIT ?`,
      [limit]
    );

    const ranked = rows.map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

    return res.json({ success: true, type: 'score', leaderboard: ranked });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard data.' });
  }
};

export default {
  getLeaderboard,
};
