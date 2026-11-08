import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  Smartphone,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const LocalPlayRoadmap = ({
  onSelectOfflineMode,
  collapsible = true,
  defaultOpen = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible && !isOpen) {
    return (
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 hover:bg-white/[0.05] transition-all flex items-center justify-between gap-3 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
              <Radio size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white group-hover:text-orange-400 transition-colors">
                  How to Host Offline over Mobile Hotspot
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Zero Data • Sub-5ms Ping
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                Play locally with friends on personal phone hotspot — no recharge, internet, or cloud limits.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
            <span>Show Guide</span>
            <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="How to play offline with mobile hotspot"
      className={`w-full rounded-3xl p-3 sm:p-4 z-10 relative ${className}`}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.03] via-blue-600/[0.02] to-transparent rounded-3xl blur-2xl pointer-events-none -z-10" />

      <div className="bg-[#0c0c0c]/90 rounded-[1.8rem] border border-white/10 p-4 sm:p-6 md:p-7 relative overflow-hidden">
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

        {/* ── Header ── */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Wifi size={10} /> Local Hotspot Protocol
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-pixel uppercase leading-snug text-white">
              PLAY WITH FRIENDS OVER{' '}
              <span className="text-[#ff5500] drop-shadow-[0_2px_10px_rgba(255,85,0,0.3)]">
                HOTSPOT & WI-FI
              </span>
            </h3>

            <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1 leading-relaxed">
              With <strong className="text-gray-200">Offline Hotspot Mode</strong>, you host auctions right on your personal phone hotspot. Enjoy zero cloud limits, zero lag, and zero internet data used!
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
            {onSelectOfflineMode && (
              <button
                type="button"
                onClick={onSelectOfflineMode}
                className="px-3.5 py-2 rounded-xl bg-[#ff5500] active:scale-[0.98] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:bg-orange-600 shadow-[0_4px_12px_rgba(255,85,0,0.3)]"
              >
                <span>Select Hotspot</span>
                <ArrowRight size={13} />
              </button>
            )}

            {collapsible && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer border border-white/10"
              >
                <span>Collapse</span>
                <ChevronUp size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── 3 Simple Steps: How to Play Offline ── */}
        <div className="relative z-10 pt-4 sm:pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-orange-400" />
              <span>How It Works in 3 Easy Steps</span>
            </h4>
            <span className="text-[9px] font-mono text-gray-400 uppercase">
              No Data Pack Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-[#ff5500]/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                    STEP 01
                  </span>
                  <Smartphone size={16} className="text-gray-400 group-hover:text-orange-400 transition-colors" />
                </div>
                <h5 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Turn On Mobile Hotspot
                </h5>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Turn on your phone's personal hotspot (or connect to any Wi-Fi). <span className="text-gray-200 font-medium">No mobile data balance or recharge is needed!</span>
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={11} />
                <span>Zero data consumed</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    STEP 02
                  </span>
                  <Wifi size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <h5 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Friends Connect Wi-Fi
                </h5>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Friends open their Wi-Fi settings and connect to your phone's hotspot. Works smoothly across Android, iPhone, PC & Mac.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">
                <ShieldCheck size={11} />
                <span>Instant local link</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    STEP 03
                  </span>
                  <Zap size={16} className="text-gray-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <h5 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Start & Bid with Zero Lag
                </h5>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Select <strong className="text-white">Local Hotspot</strong> mode in Create tab. Friends enter the room code to bid with sub-5ms paddle latency.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 text-[9px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                <Sparkles size={11} />
                <span>Sub-5ms paddle latency</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocalPlayRoadmap;
