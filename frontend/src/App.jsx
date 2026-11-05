import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'leaderboard'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/20 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* Dynamic Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-yellow-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 pb-16">
          {activeTab === 'game' ? (
            <GameBoard onOpenAuth={() => setIsAuthOpen(true)} />
          ) : (
            <Leaderboard />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-850 py-6 text-center text-xs text-slate-500 glass-card">
          <p>© 2026 BananaQuest Game • Powered by Banana API & MySQL • Server-Side Anti-Cheat Protected</p>
        </footer>
      </div>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
