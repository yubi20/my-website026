import { getPool } from '../config/db.js';
import { fetchBananaPuzzle, generateHint } from '../services/bananaService.js';

/**
 * Start a new game round.
 * Solution is securely saved in the database; only question_url and roundToken are returned.
 */
export const startRound = async (req, res) => {
  try {
    const userId = req.user.id;
    const puzzle = await fetchBananaPuzzle();

    const db = getPool();

    // Expire any existing active rounds for this user to prevent reusing old tokens
    await db.query(
      "UPDATE game_rounds SET status = 'failed' WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    // Save secret solution and round metadata
    await db.query(
      'INSERT INTO game_rounds (user_id, round_token, question_url, solution, hints_used, status) VALUES (?, ?, ?, ?, 0, ?)',
      [userId, puzzle.roundToken, puzzle.questionUrl, puzzle.solution, 'active']
    );

    // Clean payload returned: NO solution returned to client!
    return res.json({
      success: true,
      roundToken: puzzle.roundToken,
      questionUrl: puzzle.questionUrl,
      hintsUsed: 0,
      maxHints: 3,
      startTime: Date.now(),
    });
  } catch (error) {
    console.error('Error starting round:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not load new puzzle round. Please try again.',
    });
  }
};

/**
 * Request a 3-step hint for an active game round.
 */
export const getHint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roundToken, requestedStep } = req.body;

    if (!roundToken || !requestedStep) {
      return res.status(400).json({ success: false, message: 'Missing roundToken or requestedStep' });
    }

    const step = parseInt(requestedStep, 10);
    if (step < 1 || step > 3) {
      return res.status(400).json({ success: false, message: 'Hint step must be 1, 2, or 3.' });
    }

    const db = getPool();
    const [rounds] = await db.query(
      'SELECT id, solution, hints_used, status FROM game_rounds WHERE round_token = ? AND user_id = ? LIMIT 1',
      [roundToken, userId]
    );

    if (rounds.length === 0) {
      return res.status(404).json({ success: false, message: 'Round not found.' });
    }

    const round = rounds[0];
    if (round.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This round is already finished.' });
    }

    if (step <= round.hints_used) {
      // Re-generate previously unlocked hint without extra penalty
      const hintData = generateHint(round.solution, step);
      return res.json({
        success: true,
        alreadyUnlocked: true,
        hint: hintData.hint,
        step,
        hintsUsed: round.hints_used,
      });
    }

    // Step must be unlocked sequentially or up to the requested step
    const nextStep = round.hints_used + 1;
    if (step > nextStep) {
      return res.status(400).json({
        success: false,
        message: `Please unlock Hint ${nextStep} first before Hint ${step}.`,
      });
    }

    const hintData = generateHint(round.solution, step);

    // Update hints_used in database
    await db.query('UPDATE game_rounds SET hints_used = ? WHERE id = ?', [step, round.id]);

    return res.json({
      success: true,
      hint: hintData.hint,
      cost: hintData.cost,
      step,
      hintsUsed: step,
    });
  } catch (error) {
    console.error('Error fetching hint:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve hint.' });
  }
};

/**
 * Submit answer for the active game round.
 * Server verifies the solution, calculates scores, updates user streak, and returns shake or points.
 */
export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roundToken, answer, timeTakenMs = 0 } = req.body;

    if (!roundToken || answer === undefined || answer === null || answer === '') {
      return res.status(400).json({ success: false, message: 'Please provide an answer.' });
    }

    const numericAnswer = parseInt(answer, 10);
    if (isNaN(numericAnswer) || numericAnswer < 0 || numericAnswer > 9) {
      return res.status(400).json({ success: false, message: 'Answer must be a digit between 0 and 9.' });
    }

    const db = getPool();
    const [rounds] = await db.query(
      'SELECT id, solution, hints_used, status, user_id FROM game_rounds WHERE round_token = ? AND user_id = ? LIMIT 1',
      [roundToken, userId]
    );

    if (rounds.length === 0) {
      return res.status(404).json({ success: false, message: 'Round not found.' });
    }

    const round = rounds[0];
    if (round.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This round has already been submitted or completed.',
      });
    }

    // Retrieve user current stats
    const [users] = await db.query(
      'SELECT id, total_score, current_streak, best_streak, games_played, correct_answers FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];

    const isCorrect = numericAnswer === round.solution;

    if (!isCorrect) {
      // Wrong answer:
      // Shake triggered, penalty applied, streak reset to 0
      const penalty = 20;
      const newScore = Math.max(0, user.total_score - penalty);
      const newStreak = 0;
      const gamesPlayed = user.games_played + 1;

      // Update user stats
      await db.query(
        'UPDATE users SET total_score = ?, current_streak = ?, games_played = ? WHERE id = ?',
        [newScore, newStreak, gamesPlayed, userId]
      );

      // Record in score history
      await db.query(
        'INSERT INTO score_history (user_id, round_id, points, streak, time_taken_ms, hints_used, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, round.id, -penalty, newStreak, timeTakenMs, round.hints_used, 'wrong']
      );

      return res.json({
        success: true,
        correct: false,
        shake: true, // Trigger vibration & shaking animation on frontend
        message: 'Oops! That is not correct.',
        penalty,
        totalScore: newScore,
        currentStreak: newStreak,
        bestStreak: user.best_streak,
      });
    }

    // CORRECT ANSWER!
    // Base points: 100
    const basePoints = 100;

    // Speed bonus: up to 50 points if answered within 15 seconds
    const timeInSec = Math.max(1, timeTakenMs / 1000);
    let speedBonus = 0;
    if (timeInSec <= 5) {
      speedBonus = 50;
    } else if (timeInSec <= 15) {
      speedBonus = Math.round(50 * (1 - (timeInSec - 5) / 10));
    }

    // Streak multiplier bonus
    const newStreak = user.current_streak + 1;
    let streakMultiplier = 1.0;
    if (newStreak >= 10) streakMultiplier = 2.0;
    else if (newStreak >= 5) streakMultiplier = 1.5;
    else if (newStreak >= 3) streakMultiplier = 1.25;

    // Hint penalties
    let hintDeduction = 0;
    if (round.hints_used === 1) hintDeduction = 15;
    else if (round.hints_used === 2) hintDeduction = 40; // 15 + 25
    else if (round.hints_used === 3) hintDeduction = 80; // 15 + 25 + 40

    const rawPoints = Math.round((basePoints + speedBonus) * streakMultiplier) - hintDeduction;
    const pointsAwarded = Math.max(20, rawPoints); // Guarantee at least 20 pts for correct

    const newScore = user.total_score + pointsAwarded;
    const newBestStreak = Math.max(user.best_streak, newStreak);
    const newCorrect = user.correct_answers + 1;
    const newGamesPlayed = user.games_played + 1;

    // Update user record
    await db.query(
      'UPDATE users SET total_score = ?, current_streak = ?, best_streak = ?, correct_answers = ?, games_played = ? WHERE id = ?',
      [newScore, newStreak, newBestStreak, newCorrect, newGamesPlayed, userId]
    );

    // Update round status to completed
    await db.query(
      'UPDATE game_rounds SET status = ?, points_awarded = ? WHERE id = ?',
      ['completed', pointsAwarded, round.id]
    );

    // Record score history
    await db.query(
      'INSERT INTO score_history (user_id, round_id, points, streak, time_taken_ms, hints_used, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, round.id, pointsAwarded, newStreak, timeTakenMs, round.hints_used, 'correct']
    );

    return res.json({
      success: true,
      correct: true,
      shake: false,
      message: 'Bingo! Fantastic job!',
      solution: round.solution, // Safe to reveal now that round is completed!
      pointsAwarded,
      breakdown: {
        base: basePoints,
        speedBonus,
        streakMultiplier,
        hintDeduction,
      },
      totalScore: newScore,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      accuracy: Math.round((newCorrect / newGamesPlayed) * 100),
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify answer.' });
  }
};

export default {
  startRound,
  getHint,
  submitAnswer,
};
