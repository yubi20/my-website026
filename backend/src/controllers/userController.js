import { getPool } from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getPool();

    // Get user stats
    const [users] = await db.query(
      `SELECT id, username, email, avatar, total_score, games_played, correct_answers,
              current_streak, best_streak, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    // Compute rank
    const [rankResult] = await db.query(
      'SELECT COUNT(*) + 1 AS userRank FROM users WHERE total_score > ?',
      [user.total_score]
    );
    const rank = rankResult[0]?.userRank || 1;

    // Get recent 10 games history
    const [history] = await db.query(
      `SELECT id, points, streak, time_taken_ms, hints_used, result, created_at
       FROM score_history
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 10`,
      [userId]
    );

    return res.json({
      success: true,
      profile: {
        ...user,
        rank,
        accuracy: user.games_played > 0 ? Math.round((user.correct_answers / user.games_played) * 100) : 0,
        history,
      },
    });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    const allowedAvatars = [
      'banana_hero',
      'monkey_king',
      'detective_ape',
      'golden_banana',
      'ninja_monkey',
      'cyber_ape',
      'banana_wizard',
      'captain_chimp',
    ];

    if (!avatar || !allowedAvatars.includes(avatar)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid avatar choice.',
        allowedAvatars,
      });
    }

    const db = getPool();
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);

    return res.json({
      success: true,
      message: 'Avatar updated successfully!',
      avatar,
    });
  } catch (error) {
    console.error('updateAvatar error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update avatar.' });
  }
};

export default {
  getProfile,
  updateAvatar,
};
