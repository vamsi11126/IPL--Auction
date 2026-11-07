import React from 'react';
import { TEAMS } from '../data/teams';
import { Gavel, Users, Bot, Coins, Zap, Trophy, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuctionActivityFeed({ activeCount = 0 }) {
  const displayCount = Math.max(Number(activeCount) || 0, 1);

  const features = [
    {
      icon: Users,
      title: 'Real-Time Multiplayer',
      desc: 'Bid live with friends online or over local Wi-Fi hotspot with instant sync.',
      tag: 'Live Sync',
      tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    },
    {
      icon: Bot,
      title: 'Smart AI Managers',
      desc: 'Playing solo? Fill empty tables with autonomous AI bots that bid strategically.',
      tag: 'Solo & Co-op',
      tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      icon: Coins,
      title: 'Authentic IPL Purse & Quotas',
      desc: 'Manage ₹120 Cr budgets, enforce overseas limits (8 max), and fill mandatory roles.',
      tag: 'Official Rules',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      icon: Gavel,
      title: 'Host Auctioneer Desk',
      desc: 'Take the gavel with sound effects, audio calls, bid timers, and sold confirmations.',
      tag: 'Host Controls',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ];

  const steps = [
    { num: '01', title: 'Create or Join', desc: 'Spin up a private room or enter a 6-character code.' },
    { num: '02', title: 'Pick Franchise', desc: 'Select CSK, MI, RCB, or any of the 10 IPL teams.' },
    { num: '03', title: 'Bid & Conquer', desc: 'Outbid rivals in real-time to build your dream squad.' },
  ];

  return (
    <div className="flex flex-col justify-between h-full space-y-5">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#ff5500]/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Header with Live Status */}
      <div className="flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ff5500]/10 border border-[#ff5500]/30 flex items-center justify-center text-[#ff5500] shadow-[0_0_20px_rgba(255,85,0,0.2)]">
              <Trophy size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wider leading-none">
                IPL Auction Arena
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Multiplayer Cricket Auction Simulator
              </p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>{displayCount} Active {displayCount === 1 ? 'Hub' : 'Hubs'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10 my-4" />
      </div>

      {/* Feature Grid (2x2 on larger screens, compact on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:text-[#ff5500] transition-colors">
                    <Icon size={14} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${f.tagColor}`}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-1">
                  {f.title}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* How to Play 3 Steps Strip */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Zap size={11} className="text-[#ff5500]" /> How to Play in 3 Steps
          </span>
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
            No Setup Required
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {steps.map((s) => (
            <div key={s.num} className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col">
              <span className="text-[9px] font-black text-[#ff5500] font-mono mb-0.5">
                {s.num}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">
                {s.title}
              </span>
              <span className="text-[8px] text-gray-400 leading-tight mt-1 hidden sm:block">
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 10 IPL Franchises Logo Bar */}
      <div className="pt-1 border-t border-white/5 flex items-center justify-between gap-2">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 flex-shrink-0">
          10 Franchises
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {TEAMS.map((team) => (
            <div
              key={team.id}
              title={team.name}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1 hover:scale-110 hover:border-white/30 transition-transform flex-shrink-0 cursor-default"
            >
              <img
                src={team.logo}
                alt={team.id}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
