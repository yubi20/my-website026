import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_banana_jwt_key_987654321_secure';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: 'Username must be 3 to 20 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const db = getPool();

    // Check existing username or email
    const [existing] = await db.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      const match = existing[0];
      if (match.username.toLowerCase() === username.trim().toLowerCase()) {
        return res.status(409).json({ success: false, message: 'Username is already taken.' });
      }
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const defaultAvatar = 'banana_hero';

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), passwordHash, defaultAvatar]
    );

    const userId = result.insertId;

    const token = jwt.sign(
      { id: userId, username: username.trim(), email: email.trim().toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: userId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        avatar: defaultAvatar,
        total_score: 0,
        games_played: 0,
        correct_answers: 0,
        current_streak: 0,
        best_streak: 0,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please enter username/email and password.' });
    }

    const db = getPool();

    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [identifier.trim(), identifier.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Compute rank
    const [rankResult] = await db.query(
      'SELECT COUNT(*) + 1 AS userRank FROM users WHERE total_score > ?',
      [user.total_score]
    );

    const rank = rankResult[0]?.userRank || 1;

    return res.json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        total_score: user.total_score,
        games_played: user.games_played,
        correct_answers: user.correct_answers,
        current_streak: user.current_streak,
        best_streak: user.best_streak,
        rank,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const db = getPool();
    const [users] = await db.query(
      'SELECT id, username, email, avatar, total_score, games_played, correct_answers, current_streak, best_streak, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    const [rankResult] = await db.query(
      'SELECT COUNT(*) + 1 AS userRank FROM users WHERE total_score > ?',
      [user.total_score]
    );

    const rank = rankResult[0]?.userRank || 1;

    return res.json({
      success: true,
      user: {
        ...user,
        rank,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user data.' });
  }
};

export default {
  register,
  login,
  getMe,
};
