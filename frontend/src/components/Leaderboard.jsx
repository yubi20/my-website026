import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarMeta } from '../utils/avatars';
import { Trophy, Flame, Zap, Award, Sparkles, RefreshCw } from 'lucide-react';
import { playClickSound } from '../services/sound';

export const Leaderboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('score'); // 'score' | 'streak' | 'recent'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (selectedTab) => {
    setLoading(true);
    try {
      const res = await fetchLeaderboard(selectedTab);
      if (res.data?.success) {
        if (selectedTab === 'recent') {
          setData(res.data.activity || []);
        } else {
          setData(res.data.leaderboard || []);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  const handleTabChange = (t) => {
    playClickSound();
    setTab(t);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
            🏆
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Live Hall of Fame</h1>
            <p className="text-xs text-slate-400">Dynamic rankings stored securely in MySQL (Zero hardcoded data)</p>
          </div>
        </div>

        <button
          onClick={() => loadData(tab)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Leaderboard Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/60 max-w-md mx-auto">
        <button
          onClick={() => handleTabChange('score')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'score'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Top Scorers</span>
        </button>

        <button
          onClick={() => handleTabChange('streak')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'streak'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Top Streaks</span>
        </button>

        <button
          onClick={() => handleTabChange('recent')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'recent'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Recent Wins</span>
        </button>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="glass-panel rounded-3xl border border-slate-700/60 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 text-center text-amber-400 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold">Querying live player stats from database...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">No records found yet!</p>
            <p className="text-xs text-slate-500">Be the first to solve a puzzle and take the top spot!</p>
          </div>
        ) : tab === 'recent' ? (
          // Recent Wins View
          <div className="divide-y divide-slate-800">
            {data.map((item) => {
              const avatar = getAvatarMeta(item.avatar);
              return (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${avatar.bg} flex items-center justify-center text-lg shadow-sm`}>
                      {avatar.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white">{item.username}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Hints used: {item.hints_used}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-extrabold text-sm block">+{item.points} pts</span>
                    <span className="text-[11px] text-orange-400 font-bold">{item.streak}x streak</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Top Scorers / Top Streaks Ranked View
          <div className="divide-y divide-slate-800">
            {data.map((player) => {
              const avatar = getAvatarMeta(player.avatar);
              const isCurrentUser = user && user.id === player.id;

              let rankBadge = (
                <span className="font-extrabold text-slate-400 text-sm w-7 text-center">
                  #{player.rank}
                </span>
              );

              if (player.rank === 1) {
                rankBadge = <span className="text-2xl w-7 text-center">🥇</span>;
              } else if (player.rank === 2) {
                rankBadge = <span className="text-2xl w-7 text-center">🥈</span>;
              } else if (player.rank === 3) {
                rankBadge = <span className="text-2xl w-7 text-center">🥉</span>;
              }

              return (
                <div
                  key={player.id}
                  className={`p-4 flex items-center justify-between transition-all ${
                    isCurrentUser
                      ? 'bg-amber-500/10 border-l-4 border-amber-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {rankBadge}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${avatar.bg} flex items-center justify-center text-lg shadow-md`}>
                      {avatar.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white">{player.username}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Accuracy: <span className="text-slate-300 font-semibold">{player.accuracy || 0}%</span> • Games: {player.games_played}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {tab === 'score' ? (
                      <>
                        <span className="text-base font-black text-amber-400 block font-mono">
                          {player.total_score} pts
                        </span>
                        <span className="text-[11px] text-slate-400">Best Streak: {player.best_streak}x</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base font-black text-orange-400 block font-mono">
                          {player.best_streak}x Streak
                        </span>
                        <span className="text-[11px] text-slate-400">{player.total_score} pts</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Leaderboard;
