import React, { useMemo, useState } from 'react';
import { Trophy, Users, Star, ChevronDown, ChevronUp, ShieldCheck, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS } from '../data/teams';
import { evaluateSquadStrength } from '../lib/squadRatingEngine';

const SquadRating = ({ roomTeams = [], currentAuction }) => {
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const minPlayers = useMemo(() => {
    const type = currentAuction?.auctionType || 'mega';
    if (type === 'mega') return 18;
    if (type === 'sprint11') return 11;
    if (type === 'sprint5') return 5;
    return currentAuction?.settings?.minPlayers || 18;
  }, [currentAuction]);

  const calculatedLeaderboard = useMemo(() => {
    return roomTeams.map(team => {
      const { userId, userName, teamId, squad = [] } = team;
      const teamInfo = TEAMS.find(t => t.id === teamId);
      
      const evaluation = evaluateSquadStrength(squad, minPlayers);

      return {
        userId,
        userName: userName || (teamInfo ? teamInfo.name : teamId),
        teamId,
        teamName: teamInfo?.name || teamId,
        teamLogo: teamInfo?.logo || null,
        overallScore: evaluation.overallScore,
        avgRating: evaluation.overallScore,
        playingXIRating: evaluation.playingXIRating,
        balanceScore: evaluation.balanceScore,
        benchScore: evaluation.benchScore,
        balanceTags: evaluation.balanceTags,
        playingXI: evaluation.playingXI,
        benchCount: evaluation.benchCount,
        overseasCount: evaluation.overseasCount,
        playerCount: evaluation.playerCount,
        isDisqualified: evaluation.isDisqualified
      };
    }).sort((a, b) => {
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      return b.overallScore - a.overallScore;
    });
  }, [roomTeams, minPlayers]);

  if (roomTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Users className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-300">No Squads Yet</h3>
        <p className="text-gray-500 mt-2">Squad ratings will appear once franchises start buying players.</p>
      </div>
    );
  }

  const toggleExpand = (teamId) => {
    setExpandedTeamId(prev => prev === teamId ? null : teamId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 sm:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Franchise Power Index
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Wise ranking based on Best Playing XI (65%), Tactical Balance (20%), and Bench Depth (15%)
          </p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {calculatedLeaderboard.map((team, idx) => {
          const isExpanded = expandedTeamId === team.teamId;

          return (
            <motion.div 
              key={team.teamId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`w-full rounded-2xl sm:rounded-3xl bg-[#0c0c0c] border transition-all duration-300 relative overflow-hidden group ${
                team.isDisqualified 
                  ? 'border-red-900/30 opacity-75' 
                  : idx === 0 
                    ? 'border-orange-500/50 shadow-2xl' 
                    : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Massive Background Logo Watermark */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 sm:w-64 sm:h-64 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none grayscale">
                {team.teamLogo && <img src={team.teamLogo} alt={`${team.teamName} Logo`} className="w-full h-full object-contain" />}
              </div>

              {/* Main Team Card Header */}
              <div 
                onClick={() => toggleExpand(team.teamId)}
                className="p-3 sm:p-5 flex flex-row items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 sm:gap-4 relative z-10 min-w-0">
                  {/* Team Logo Badge */}
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-xl shrink-0 relative ${
                    team.isDisqualified ? 'bg-red-950/20 border-red-900/30' : ''
                  }`}>
                    {!team.isDisqualified && idx === 0 && (
                      <Star className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                    )}
                    {team.teamLogo ? (
                      <img src={team.teamLogo} alt={team.teamName} className={`w-full h-full object-contain ${team.isDisqualified ? 'opacity-50' : ''}`} />
                    ) : (
                      <Users className="w-full h-full text-gray-500 p-1" />
                    )}
                  </div>
                  
                  {/* Name and Meta */}
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-gray-400 font-black text-xs sm:text-base shrink-0">#{idx + 1}</span>
                      <h3 className={`text-sm sm:text-xl font-black uppercase tracking-tight transition-colors truncate ${
                        team.isDisqualified ? 'text-gray-400' : 'text-white group-hover:text-orange-500'
                      }`}>
                        {team.teamName}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        team.isDisqualified ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-300'
                      }`}>
                        {team.playerCount} / {minPlayers} Players
                      </span>

                      {team.overseasCount > 0 && (
                        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {team.overseasCount} OS
                        </span>
                      )}

                      {team.isDisqualified && (
                        <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
                          Under Min Squad
                        </span>
                      )}

                      {/* Tactical Badges */}
                      {team.balanceTags.map((tag, tIdx) => (
                        <span 
                          key={tIdx} 
                          className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            tag.includes('!') || tag.includes('Lacks') || tag.includes('Thin')
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown & Total Score */}
                <div className="flex items-center gap-2 sm:gap-6 relative z-10 shrink-0">
                  {/* Secondary pills (Hidden on small screens) */}
                  <div className="hidden md:flex items-center gap-3 text-right">
                    <div className="bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-widest text-gray-500 font-bold">Best XI</span>
                      <span className="text-sm font-black text-white">{team.playingXIRating}</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-widest text-gray-500 font-bold">Balance</span>
                      <span className="text-sm font-black text-emerald-400">{team.balanceScore}</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-xl">
                      <span className="block text-[8px] uppercase tracking-widest text-gray-500 font-bold">Bench</span>
                      <span className="text-sm font-black text-blue-400">{team.benchScore}</span>
                    </div>
                  </div>

                  {/* Primary Power Score */}
                  <div className="flex flex-col items-end justify-center pl-2">
                    <span className={`block text-[7px] sm:text-[8px] font-black uppercase tracking-widest mb-0.5 ${
                      team.isDisqualified ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      Power Score
                    </span>
                    <span className={`text-xl sm:text-3xl font-black leading-none ${
                      team.isDisqualified 
                        ? 'text-red-600/50' 
                        : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-[#ff5500]'
                    }`}>
                      {team.overallScore}
                    </span>
                  </div>

                  <button className="text-gray-400 group-hover:text-white transition-colors p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Best XI Drawer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/5 bg-black/40 px-3 py-4 sm:px-6 sm:py-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs sm:text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        Predicted Best Playing XI
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        {team.playingXI.length} Players • {team.benchCount} on Bench
                      </span>
                    </div>

                    {team.playingXI.length === 0 ? (
                      <p className="text-xs text-gray-500">No players drafted in this squad yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {team.playingXI.map((p, pIdx) => (
                          <div 
                            key={p.id || pIdx} 
                            className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase truncate">{p.role}</span>
                                {p.type === 'Overseas' && (
                                  <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1 rounded">OS</span>
                                )}
                              </div>
                              <p className="text-xs font-black text-white truncate">{p.name}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                              <span className="text-[8px] uppercase text-gray-500 font-bold">Rating</span>
                              <span className="text-xs font-black text-orange-400">{p.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SquadRating;
