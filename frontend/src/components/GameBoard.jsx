import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { startNewRound, submitRoundAnswer, requestHint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HintPanel from './HintPanel';
import { playCorrectSound, playWrongSound, playClickSound, triggerVibration } from '../services/sound';
import { Flame, Sparkles, RefreshCw, Send, CheckCircle2, XCircle, Timer } from 'lucide-react';

export const GameBoard = ({ onOpenAuth }) => {
  const { user, isAuthenticated, updateStats } = useAuth();

  const [roundToken, setRoundToken] = useState(null);
  const [questionUrl, setQuestionUrl] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [activeHints, setActiveHints] = useState([]);
  const [answerInput, setAnswerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Animation states
  const [isShaking, setIsShaking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', message, points }
  const [floatingPoints, setFloatingPoints] = useState(null);

  const timerRef = useRef(null);

  // Load new puzzle round
  const loadRound = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setFeedback(null);
    setFloatingPoints(null);
    setAnswerInput('');
    setHintsUsed(0);
    setActiveHints([]);
    setTimerSeconds(0);

    try {
      const res = await startNewRound();
      if (res.data?.success) {
        setRoundToken(res.data.roundToken);
        setQuestionUrl(res.data.questionUrl);
        setRoundStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to load round:', err);
      setFeedback({
        type: 'wrong',
        message: err.response?.data?.message || 'Failed to fetch puzzle from Banana API. Please retry.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRound();
    }
  }, [isAuthenticated]);

  // Round timer
  useEffect(() => {
    if (roundToken && !feedback?.type) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [roundToken, feedback]);

  // Keyboard shortcut listener (0-9 and Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isAuthenticated || submitting || loading) return;
      if (e.key >= '0' && e.key <= '9') {
        playClickSound();
        setAnswerInput(e.key);
      } else if (e.key === 'Enter' && answerInput !== '') {
        handleSubmitAnswer(answerInput);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, submitting, loading, answerInput, roundToken]);

  // Submit Answer with shaking on error and confetti on correct
  const handleSubmitAnswer = async (selectedDigit) => {
    const val = selectedDigit !== undefined ? selectedDigit : answerInput;
    if (val === '' || !roundToken || submitting) return;

    setSubmitting(true);
    playClickSound();
    const timeTakenMs = Date.now() - roundStartTime;

    try {
      const res = await submitRoundAnswer({
        roundToken,
        answer: parseInt(val, 10),
        timeTakenMs,
      });

      const data = res.data;

      if (data.shake || !data.correct) {
        // TRIGGER SHAKE ANIMATION & HAPTIC VIBRATION
        setIsShaking(true);
        triggerVibration([120, 60, 150, 60, 200]);
        playWrongSound();

        setFeedback({
          type: 'wrong',
          message: data.message || 'Incorrect answer!',
          penalty: data.penalty || 20,
        });

        setFloatingPoints(`-${data.penalty || 20}`);

        updateStats({
          total_score: data.totalScore,
          current_streak: data.currentStreak,
        });

        setTimeout(() => setIsShaking(false), 700);
      } else {
        // CORRECT ANSWER CELEBRATION
        playCorrectSound();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FBBF24', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
        });

        setFeedback({
          type: 'correct',
          message: data.message || 'Correct!',
          points: data.pointsAwarded,
          breakdown: data.breakdown,
          solution: data.solution,
        });

        setFloatingPoints(`+${data.pointsAwarded}`);

        updateStats({
          total_score: data.totalScore,
          current_streak: data.currentStreak,
          best_streak: data.bestStreak,
        });

        // Auto load next puzzle after 2.5 seconds
        setTimeout(() => {
          loadRound();
        }, 2500);
      }
    } catch (err) {
      setIsShaking(true);
      playWrongSound();
      triggerVibration();
      setTimeout(() => setIsShaking(false), 700);
      setFeedback({
        type: 'wrong',
        message: err.response?.data?.message || 'Error validating answer. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Unlock 3-step hint
  const handleUnlockHint = async (step) => {
    if (!roundToken) return;
    try {
      const res = await requestHint({
        roundToken,
        requestedStep: step,
      });

      if (res.data?.success) {
        setHintsUsed(res.data.hintsUsed);
        setActiveHints((prev) => [
          ...prev.filter((h) => h.step !== step),
          { step, text: res.data.hint },
        ]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not unlock hint.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="glass-panel p-10 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
            🍌
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Login Required to Play</h2>
            <p className="text-slate-300 mt-2 max-w-md mx-auto text-sm">
              Sign in to play the Banana Math Puzzle, earn points, maintain streaks, unlock 3-step hints, and compete on the global leaderboard!
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/30 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Sign In / Register Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Game Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-amber-500/20 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white font-mono">{timerSeconds}s</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-bold text-orange-400">Streak: {user?.current_streak || 0}</span>
          </div>
        </div>

        <button
          onClick={loadRound}
          disabled={loading || submitting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 hover:border-amber-500/40 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>New Puzzle</span>
        </button>
      </div>

      {/* Main Puzzle Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Banana Puzzle Card (with dynamic vibration & shake class) */}
        <div className="lg:col-span-7 space-y-5">
          <div 
            className={`glass-panel rounded-3xl p-6 border transition-all relative overflow-hidden ${
              isShaking 
                ? 'animate-game-shake border-rose-500 shadow-2xl shadow-rose-500/40 bg-rose-950/20' 
                : feedback?.type === 'correct'
                ? 'animate-success-glow border-emerald-500 shadow-2xl shadow-emerald-500/30'
                : 'border-amber-500/20 shadow-xl'
            }`}
          >
            {/* Floating Points Badge */}
            {floatingPoints && (
              <div 
                className={`absolute top-6 right-6 px-4 py-2 rounded-2xl font-black text-xl z-20 pointer-events-none animate-float-up ${
                  floatingPoints.startsWith('+')
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50'
                    : 'bg-rose-500 text-white shadow-lg shadow-rose-500/50'
                }`}
              >
                {floatingPoints}
              </div>
            )}

            <div className="text-center mb-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                Banana Math Puzzle
              </span>
              <h2 className="text-xl font-black text-white mt-1">What is the missing number? (0 - 9)</h2>
            </div>

            {/* Puzzle Image Container */}
            <div className="w-full bg-slate-950/80 rounded-2xl border border-slate-800 p-2 flex items-center justify-center min-h-[260px] relative overflow-hidden group">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 text-amber-400">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold tracking-wide">Fetching fresh banana puzzle...</span>
                </div>
              ) : questionUrl ? (
                <img
                  src={questionUrl}
                  alt="Banana Math Quest"
                  className="w-full h-auto max-h-[340px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                />
              ) : (
                <div className="text-slate-400 text-sm">No puzzle loaded. Click "New Puzzle".</div>
              )}
            </div>

            {/* Answer Display & Submit Feedback */}
            {feedback && (
              <div 
                className={`mt-4 p-4 rounded-2xl flex items-center justify-between text-sm font-bold border transition-all ${
                  feedback.type === 'correct'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === 'correct' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p>{feedback.message}</p>
                    {feedback.type === 'correct' && (
                      <p className="text-xs text-emerald-400/80 mt-0.5">
                        +{feedback.points} pts awarded! Loading next round...
                      </p>
                    )}
                  </div>
                </div>

                {feedback.type === 'correct' && (
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    +{feedback.points}
                  </span>
                )}
              </div>
            )}

            {/* Number Keypad 0-9 */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Select digit (0 to 9) or type on keyboard:</span>
                {answerInput !== '' && (
                  <span className="text-xs font-black text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-lg">
                    Selected: {answerInput}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
                  <button
                    key={digit}
                    disabled={submitting || loading || feedback?.type === 'correct'}
                    onClick={() => {
                      setAnswerInput(digit.toString());
                      handleSubmitAnswer(digit);
                    }}
                    className={`py-3.5 rounded-2xl font-black text-xl transition-all shadow-md cursor-pointer active:scale-95 ${
                      answerInput === digit.toString()
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-amber-500/40 scale-105 ring-2 ring-amber-300'
                        : 'bg-slate-800 hover:bg-slate-750 text-white border border-slate-700/80 hover:border-amber-500/50 hover:text-amber-300'
                    }`}
                  >
                    {digit}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right: 3-Step Hint Panel */}
        <div className="lg:col-span-5 space-y-5">
          <HintPanel
            hintsUsed={hintsUsed}
            activeHints={activeHints}
            onUnlockHint={handleUnlockHint}
            disabled={loading || submitting || feedback?.type === 'correct'}
          />

          {/* Point System Breakdown Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-700/60 text-xs space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Point System Rules</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold block">+100 pts</span>
                Base Correct Answer
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-bold block">Up to +50 pts</span>
                Speed Bonus (&lt;15s)
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-orange-400 font-bold block">1.25x - 2.0x</span>
                Streak Multiplier
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-rose-400 font-bold block">-20 pts & Shake</span>
                Wrong Mistake Penalty
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default GameBoard;
