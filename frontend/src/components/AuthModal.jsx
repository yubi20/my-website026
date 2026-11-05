import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Sparkles, ArrowRight } from 'lucide-react';
import { playClickSound } from '../services/sound';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    playClickSound();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(identifier, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = () => {
    setTab('login');
    setIdentifier('BananaChamp');
    setPassword('banana123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl relative">
        
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

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
            🍌
          </div>
          <h2 className="text-2xl font-black text-white">
            {tab === 'login' ? 'Welcome Back!' : 'Join BananaQuest'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'login'
              ? 'Log in to continue your streak and earn points'
              : 'Create an account to start playing and climbing ranks'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setTab('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setTab('register');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' ? (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. BananaNinja"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? 'Processing...' : tab === 'login' ? 'Sign In & Play' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AuthModal;
