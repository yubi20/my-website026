import React, { useState } from 'react';
import { Lightbulb, Lock, Unlock, HelpCircle, AlertCircle } from 'lucide-react';
import { playClickSound, playHintSound } from '../services/sound';

export const HintPanel = ({ hintsUsed, onUnlockHint, activeHints = [], disabled = false }) => {
  const [loadingStep, setLoadingStep] = useState(null);

  const steps = [
    {
      step: 1,
      title: 'Step 1: Parity & Range',
      desc: 'Reveals if answer is even/odd and in lower or upper half (0-4 vs 5-9)',
      cost: 15,
      icon: '💡',
    },
    {
      step: 2,
      title: 'Step 2: Math Bounds & Multiples',
      desc: 'Reveals divisibility, prime/square traits, or strict bounds',
      cost: 25,
      icon: '🔍',
    },
    {
      step: 3,
      title: 'Step 3: 50/50 Elimination',
      desc: 'Narrows the puzzle solution down to exactly 2 digits!',
      cost: 40,
      icon: '🎯',
    },
  ];

  const handleUnlock = async (step) => {
    if (disabled || step <= hintsUsed || loadingStep) return;
    playClickSound();
    setLoadingStep(step);
    try {
      await onUnlockHint(step);
      playHintSound();
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-amber-500/20 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">3-Step Hint Assistant</h3>
            <p className="text-xs text-slate-400">Unlock hints sequentially with small point deductions</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-amber-400/10 text-amber-300 border border-amber-500/30 rounded-full">
          {hintsUsed}/3 Unlocked
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((s) => {
          const isUnlocked = s.step <= hintsUsed;
          const isNext = s.step === hintsUsed + 1;
          const hintText = activeHints.find((h) => h.step === s.step)?.text;

          return (
            <div
              key={s.step}
              className={`rounded-2xl p-4 transition-all border ${
                isUnlocked
                  ? 'bg-amber-950/30 border-amber-500/40 shadow-inner'
                  : isNext
                  ? 'bg-slate-800/60 border-slate-700/80 hover:border-amber-500/30'
                  : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl p-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    {s.icon}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {s.title}
                      {isUnlocked && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                          ACTIVE
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>

                {isUnlocked ? (
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Unlock className="w-4 h-4" />
                  </div>
                ) : (
                  <button
                    disabled={!isNext || disabled || loadingStep === s.step}
                    onClick={() => handleUnlock(s.step)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isNext && !disabled
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>-{s.cost} pts</span>
                  </button>
                )}
              </div>

              {/* Revealed Hint Message */}
              {isUnlocked && hintText && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-200 animate-fadeIn flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{hintText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HintPanel;
