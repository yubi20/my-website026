import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvatarMeta } from '../utils/avatars';
import { Trophy, Flame, User, LogOut, LogIn, Sparkles, Gamepad2 } from 'lucide-react';
import { playClickSound } from '../services/sound';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth, onOpenProfile }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const avatarMeta = getAvatarMeta(user?.avatar);

  const handleTabChange = (tab) => {
    playClickSound();
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-amber-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => handleTabChange('game')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform animate-float">
            🍌
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-2xl tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                BANANA
              </span>
              <span className="text-white font-extrabold text-2xl tracking-wide">
                QUEST
              </span>
            </div>
            <p className="text-xs text-amber-200/60 font-medium">Solve the Banana Math Puzzle</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/50">
          <button
            onClick={() => handleTabChange('game')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'game'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Play</span>
          </button>

          <button
            onClick={() => handleTabChange('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* Right Section: Player Stats & Profile/Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Score pill */}
              <div className="hidden sm:flex items-center gap-3 bg-slate-800/80 border border-slate-700/70 px-3.5 py-1.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{user?.total_score || 0} pts</span>
                </div>
                {user?.current_streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400 font-extrabold text-sm border-l border-slate-700 pl-2.5">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                    <span>{user.current_streak}x</span>
                  </div>
                )}
              </div>

              {/* Profile Button */}
              <button
                onClick={() => {
                  playClickSound();
                  onOpenProfile();
                }}
                className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-600/60 px-3 py-1.5 rounded-2xl transition-all shadow-sm group"
                title="View Profile & Stats"
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${avatarMeta.bg} flex items-center justify-center text-sm shadow-inner`}>
                  {avatarMeta.emoji}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {user?.username}
                  </p>
                  <p className="text-[10px] text-amber-300/80 font-medium">Rank #{user?.rank || 1}</p>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => {
                  playClickSound();
                  logout();
                }}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/30"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                playClickSound();
                onOpenAuth();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Play</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
