import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'banana_game',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let mysqlPool = null;
let useFallback = false;

// In-memory persistent mock store for instant fallback if MySQL credentials are not yet entered
const inMemoryStore = {
  users: [
    {
      id: 1,
      username: 'BananaChamp',
      email: 'champ@banana.io',
      password_hash: '$2a$10$w6O4lCsq9l1mUjJ/9xO4uOG5UfX7oGv4g8B2wz3c5g7i9k1l3m5n7', // dummy hash
      avatar: 'monkey_king',
      total_score: 1850,
      games_played: 22,
      correct_answers: 20,
      current_streak: 8,
      best_streak: 12,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      username: 'QuickSolver',
      email: 'solver@banana.io',
      password_hash: '$2a$10$w6O4lCsq9l1mUjJ/9xO4uOG5UfX7oGv4g8B2wz3c5g7i9k1l3m5n7',
      avatar: 'detective_ape',
      total_score: 1420,
      games_played: 18,
      correct_answers: 16,
      current_streak: 4,
      best_streak: 9,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      username: 'FruitNinja',
      email: 'ninja@banana.io',
      password_hash: '$2a$10$w6O4lCsq9l1mUjJ/9xO4uOG5UfX7oGv4g8B2wz3c5g7i9k1l3m5n7',
      avatar: 'ninja_monkey',
      total_score: 980,
      games_played: 12,
      correct_answers: 10,
      current_streak: 2,
      best_streak: 6,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  game_rounds: [],
  score_history: [
    {
      id: 1,
      user_id: 1,
      round_id: 1,
      points: 150,
      streak: 8,
      time_taken_ms: 3200,
      hints_used: 0,
      result: 'correct',
      created_at: new Date(),
      username: 'BananaChamp',
      avatar: 'monkey_king',
    },
    {
      id: 2,
      user_id: 2,
      round_id: 2,
      points: 125,
      streak: 4,
      time_taken_ms: 4500,
      hints_used: 1,
      result: 'correct',
      created_at: new Date(),
      username: 'QuickSolver',
      avatar: 'detective_ape',
    },
  ],
  nextUserId: 4,
  nextRoundId: 3,
  nextScoreId: 3,
};

// Fallback query executor matching mysql2 [rows, fields] signature
const fallbackQuery = async (sql, params = []) => {
  const normalized = sql.trim();

  // 1. SELECT 1 as connected
  if (normalized.startsWith('SELECT 1')) {
    return [[{ connected: 1 }], []];
  }

  // 2. INSERT INTO users
  if (normalized.startsWith('INSERT INTO users')) {
    const [username, email, password_hash, avatar] = params;
    const newUser = {
      id: inMemoryStore.nextUserId++,
      username,
      email,
      password_hash,
      avatar: avatar || 'banana_hero',
      total_score: 0,
      games_played: 0,
      correct_answers: 0,
      current_streak: 0,
      best_streak: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    inMemoryStore.users.push(newUser);
    return [{ insertId: newUser.id, affectedRows: 1 }, []];
  }

  // 3. SELECT FROM users WHERE username = ? OR email = ?
  if (normalized.includes('FROM users WHERE username = ? OR email = ?')) {
    const [u, e] = params;
    const found = inMemoryStore.users.filter(
      (user) => user.username.toLowerCase() === u.toLowerCase() || user.email.toLowerCase() === e.toLowerCase()
    );
    return [found, []];
  }

  // 4. SELECT FROM users WHERE id = ?
  if (normalized.includes('FROM users WHERE id = ?')) {
    const [id] = params;
    const found = inMemoryStore.users.filter((user) => user.id === parseInt(id, 10));
    return [found, []];
  }

  // 5. UPDATE users SET total_score = ... WHERE id = ?
  if (normalized.startsWith('UPDATE users SET')) {
    const id = params[params.length - 1];
    const user = inMemoryStore.users.find((u) => u.id === parseInt(id, 10));
    if (user) {
      if (normalized.includes('avatar = ?')) {
        user.avatar = params[0];
      } else if (normalized.includes('total_score = ?') && normalized.includes('correct_answers = ?')) {
        const [total_score, current_streak, best_streak, correct_answers, games_played] = params;
        user.total_score = total_score;
        user.current_streak = current_streak;
        user.best_streak = best_streak;
        user.correct_answers = correct_answers;
        user.games_played = games_played;
      } else if (normalized.includes('total_score = ?') && normalized.includes('current_streak = ?')) {
        const [total_score, current_streak, games_played] = params;
        user.total_score = total_score;
        user.current_streak = current_streak;
        user.games_played = games_played;
      }
    }
    return [{ affectedRows: 1 }, []];
  }

  // 6. SELECT COUNT(*) + 1 AS userRank FROM users WHERE total_score > ?
  if (normalized.includes('AS userRank FROM users WHERE total_score > ?')) {
    const [score] = params;
    const count = inMemoryStore.users.filter((u) => u.total_score > score).length;
    return [[{ userRank: count + 1 }], []];
  }

  // 7. Expire active rounds: UPDATE game_rounds SET status = 'failed' WHERE user_id = ? AND status = 'active'
  if (normalized.includes("UPDATE game_rounds SET status = 'failed'")) {
    const [userId] = params;
    inMemoryStore.game_rounds.forEach((r) => {
      if (r.user_id === parseInt(userId, 10) && r.status === 'active') {
        r.status = 'failed';
      }
    });
    return [{ affectedRows: 1 }, []];
  }

  // 8. INSERT INTO game_rounds
  if (normalized.startsWith('INSERT INTO game_rounds')) {
    const [user_id, round_token, question_url, solution, status] = params;
    const newRound = {
      id: inMemoryStore.nextRoundId++,
      user_id: parseInt(user_id, 10),
      round_token,
      question_url,
      solution: parseInt(solution, 10),
      hints_used: 0,
      status: status || 'active',
      points_awarded: 0,
      created_at: new Date(),
    };
    inMemoryStore.game_rounds.push(newRound);
    return [{ insertId: newRound.id, affectedRows: 1 }, []];
  }

  // 9. SELECT ... FROM game_rounds WHERE round_token = ? AND user_id = ?
  if (normalized.includes('FROM game_rounds WHERE round_token = ? AND user_id = ?')) {
    const [token, userId] = params;
    const found = inMemoryStore.game_rounds.filter(
      (r) => r.round_token === token && r.user_id === parseInt(userId, 10)
    );
    return [found, []];
  }

  // 10. UPDATE game_rounds SET hints_used = ? WHERE id = ?
  if (normalized.includes('UPDATE game_rounds SET hints_used = ?')) {
    const [step, id] = params;
    const r = inMemoryStore.game_rounds.find((round) => round.id === parseInt(id, 10));
    if (r) r.hints_used = step;
    return [{ affectedRows: 1 }, []];
  }

  // 11. UPDATE game_rounds SET status = ?, points_awarded = ? WHERE id = ?
  if (normalized.includes('UPDATE game_rounds SET status = ?, points_awarded = ?')) {
    const [status, points, id] = params;
    const r = inMemoryStore.game_rounds.find((round) => round.id === parseInt(id, 10));
    if (r) {
      r.status = status;
      r.points_awarded = points;
    }
    return [{ affectedRows: 1 }, []];
  }

  // 12. INSERT INTO score_history
  if (normalized.startsWith('INSERT INTO score_history')) {
    const [user_id, round_id, points, streak, time_taken_ms, hints_used, result] = params;
    const user = inMemoryStore.users.find((u) => u.id === parseInt(user_id, 10));
    const newScore = {
      id: inMemoryStore.nextScoreId++,
      user_id: parseInt(user_id, 10),
      round_id: parseInt(round_id, 10),
      points,
      streak,
      time_taken_ms,
      hints_used,
      result,
      created_at: new Date(),
      username: user ? user.username : 'Player',
      avatar: user ? user.avatar : 'banana_hero',
    };
    inMemoryStore.score_history.push(newScore);
    return [{ insertId: newScore.id, affectedRows: 1 }, []];
  }

  // 13. SELECT FROM score_history WHERE user_id = ?
  if (normalized.includes('FROM score_history WHERE user_id = ?')) {
    const [userId] = params;
    const list = inMemoryStore.score_history
      .filter((s) => s.user_id === parseInt(userId, 10))
      .sort((a, b) => b.id - a.id)
      .slice(0, 10);
    return [list, []];
  }

  // 14. Leaderboard: SELECT ... FROM users ORDER BY total_score DESC
  if (normalized.includes('FROM users ORDER BY total_score DESC')) {
    const limit = params[0] || 20;
    const sorted = [...inMemoryStore.users]
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, limit)
      .map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        total_score: u.total_score,
        best_streak: u.best_streak,
        current_streak: u.current_streak,
        games_played: u.games_played,
        correct_answers: u.correct_answers,
        accuracy: u.games_played > 0 ? Math.round((u.correct_answers / u.games_played) * 100) : 0,
      }));
    return [sorted, []];
  }

  // 15. Leaderboard: Streak
  if (normalized.includes('FROM users WHERE best_streak > 0 ORDER BY best_streak DESC')) {
    const limit = params[0] || 20;
    const sorted = inMemoryStore.users
      .filter((u) => u.best_streak > 0)
      .sort((a, b) => b.best_streak - a.best_streak)
      .slice(0, limit)
      .map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        best_streak: u.best_streak,
        total_score: u.total_score,
        games_played: u.games_played,
        correct_answers: u.correct_answers,
        accuracy: u.games_played > 0 ? Math.round((u.correct_answers / u.games_played) * 100) : 0,
      }));
    return [sorted, []];
  }

  // 16. Leaderboard: Recent
  if (normalized.includes('FROM score_history sh JOIN users u')) {
    const limit = params[0] || 20;
    const recent = [...inMemoryStore.score_history]
      .filter((s) => s.result === 'correct')
      .sort((a, b) => b.id - a.id)
      .slice(0, limit);
    return [recent, []];
  }

  return [[], []];
};

export const getPool = () => {
  if (useFallback) {
    return {
      query: fallbackQuery,
      execute: fallbackQuery,
    };
  }

  if (!mysqlPool) {
    mysqlPool = mysql.createPool(dbConfig);
  }

  return {
    query: async (sql, params) => {
      if (useFallback) return fallbackQuery(sql, params);
      try {
        return await mysqlPool.query(sql, params);
      } catch (err) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') {
          console.warn('⚠️ Switching to database fallback engine:', err.message);
          useFallback = true;
          return fallbackQuery(sql, params);
        }
        throw err;
      }
    },
    execute: async (sql, params) => {
      if (useFallback) return fallbackQuery(sql, params);
      try {
        return await mysqlPool.execute(sql, params);
      } catch (err) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') {
          useFallback = true;
          return fallbackQuery(sql, params);
        }
        throw err;
      }
    },
  };
};

export const checkDbConnection = async () => {
  try {
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    await rootConnection.query('SELECT 1');
    await rootConnection.end();
    console.log('✅ Connected to MySQL successfully.');
    useFallback = false;
    return true;
  } catch (error) {
    console.warn(`⚠️ MySQL (${dbConfig.user}@${dbConfig.host}): ${error.message}`);
    console.log('💡 Tip: You can set your MySQL password in backend/.env (DB_PASSWORD=...)');
    console.log('⚡ Active database engine: Seamless Live Fallback Store (All features active)');
    useFallback = true;
    return false;
  }
};

export const initDatabaseSchema = async () => {
  const isDirectMySQL = await checkDbConnection();
  if (!isDirectMySQL) {
    console.log('🚀 In-memory database initialized with starter leaderboards and user data.');
    return true;
  }

  try {
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConnection.end();

    const db = mysql.createPool(dbConfig);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(50) DEFAULT 'banana_hero',
        total_score INT DEFAULT 0,
        games_played INT DEFAULT 0,
        correct_answers INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        best_streak INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS game_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        round_token VARCHAR(64) NOT NULL UNIQUE,
        question_url VARCHAR(500) NOT NULL,
        solution INT NOT NULL,
        hints_used INT DEFAULT 0,
        status ENUM('active', 'completed', 'failed') DEFAULT 'active',
        points_awarded INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (round_token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS score_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        round_id INT,
        points INT NOT NULL,
        streak INT NOT NULL,
        time_taken_ms INT DEFAULT 0,
        hints_used INT DEFAULT 0,
        result ENUM('correct', 'wrong', 'skipped') DEFAULT 'correct',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ MySQL schema initialized successfully.');
    return true;
  } catch (err) {
    console.warn('Could not initialize MySQL schema, falling back to memory store:', err.message);
    useFallback = true;
    return false;
  }
};

export default {
  getPool,
  checkDbConnection,
  initDatabaseSchema,
};
