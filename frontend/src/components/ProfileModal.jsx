import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, updateUserAvatar } from '../services/api';
import { AVATAR_LIST, getAvatarMeta } from '../utils/avatars';
import { X, Award, Flame, Target, Sparkles, Check, Clock } from 'lucide-react';
import { playClickSound } from '../services/sound';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'banana_hero');

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setSelectedAvatar(user?.avatar || 'banana_hero');
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetchUserProfile();
      if (res.data?.success) {
        setProfileData(res.data.profile);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = async (avatarId) => {
    playClickSound();
    setSelectedAvatar(avatarId);
    setSavingAvatar(true);
    try {
      await updateUserAvatar(avatarId);
      await refreshUser();
    } catch (err) {
      console.error('Failed to update avatar:', err);
    } finally {
      setSavingAvatar(false);
    }
  };

  if (!isOpen) return null;

  const currentAvatarMeta = getAvatarMeta(selectedAvatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-700/60">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${currentAvatarMeta.bg} flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20`}>
            {currentAvatarMeta.emoji}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-black text-white">{user?.username}</h2>
              <span className="text-xs px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded-full">
                Rank #{profileData?.rank || user?.rank || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
            <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1 justify-center sm:justify-start">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Banana Explorer since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="my-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Career Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-center">
              <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-lg font-black text-white font-mono">{user?.total_score || 0}</span>
              <p className="text-[11px] text-slate-400">Total Points</p>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-center">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <span className="text-lg font-black text-orange-400 font-mono">{user?.best_streak || 0}x</span>
              <p className="text-[11px] text-slate-400">Best Streak</p>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-center">
              <Target className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-lg font-black text-emerald-400 font-mono">
                {user?.games_played > 0
                  ? Math.round((user.correct_answers / user.games_played) * 100)
                  : 0}%
              </span>
              <p className="text-[11px] text-slate-400">Accuracy</p>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-center">
              <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <span className="text-lg font-black text-white font-mono">{user?.games_played || 0}</span>
              <p className="text-[11px] text-slate-400">Puzzles Played</p>
            </div>
          </div>
        </div>

        {/* Avatar Customization */}
        <div className="my-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Choose Your Character Avatar
            </h3>
            {savingAvatar && <span className="text-xs text-amber-400 font-bold">Saving...</span>}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {AVATAR_LIST.map((av) => {
              const isSelected = selectedAvatar === av.id;
              return (
                <button
                  key={av.id}
                  onClick={() => handleSelectAvatar(av.id)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                  title={av.name}
                >
                  <span className="text-xl">{av.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-300 truncate max-w-full">
                    {av.name.split(' ')[0]}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-amber-400 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Game Rounds History */}
        {profileData?.history && profileData.history.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Recent Game History
            </h3>
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-850">
              {profileData.history.map((h) => (
                <div key={h.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        h.result === 'correct' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="font-bold text-white capitalize">{h.result}</span>
                    <span className="text-slate-400">
                      ({h.time_taken_ms ? (h.time_taken_ms / 1000).toFixed(1) : 0}s, {h.hints_used} hints)
                    </span>
                  </div>
                  <span
                    className={`font-black font-mono ${
                      h.points > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {h.points > 0 ? `+${h.points}` : h.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileModal;
