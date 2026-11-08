import React, { useState, useMemo, useEffect } from 'react';
import { TEAMS } from '../../data/teams';
import { IPL_FRANCHISE_ROSTERS } from '../../data/teamRosters';
import { formatCrores } from '../../lib/auctionDisplay';
import {
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  Save,
  Loader2,
  Users,
  Coins,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Plus
} from 'lucide-react';

export default function RetentionDesk({
  roomId,
  currentAuction,
  currentUserPlayer,
  roomTeams = [],
  saveTeamRetentions,
  isAdmin
}) {
  const isMega = (currentAuction?.auctionType || 'mega') === 'mega';
  const isMini = currentAuction?.auctionType === 'mini';

  // Default to user's team, or first available franchise
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    return currentUserPlayer?.team || 'MI';
  });

  useEffect(() => {
    if (currentUserPlayer?.team) {
      setSelectedTeamId(currentUserPlayer.team);
    }
  }, [currentUserPlayer?.team]);

  const activeTeamInfo = useMemo(() => {
    return TEAMS.find(t => t.id === selectedTeamId) || TEAMS[0];
  }, [selectedTeamId]);

  const activeTeamDoc = useMemo(() => {
    return roomTeams.find(t => t.teamId === selectedTeamId);
  }, [roomTeams, selectedTeamId]);

  const isBotTeam = activeTeamDoc?.userId?.startsWith('bot_') || activeTeamDoc?.isBot;

  // Full roster of the franchise
  const franchiseRoster = useMemo(() => {
    return IPL_FRANCHISE_ROSTERS[selectedTeamId] || [];
  }, [selectedTeamId]);

  // Retention selection state:
  // For human managers, start with empty selection (no pre-populated data)
  // unless the manager has explicitly chosen and saved retentions.
  const [retainedSet, setRetainedSet] = useState(() => {
    if (activeTeamDoc?.retainedIds && Array.isArray(activeTeamDoc.retainedIds)) {
      return new Set(activeTeamDoc.retainedIds);
    }
    if (isBotTeam) {
      const def = franchiseRoster.filter(p => p.defaultRetained).map(p => p.id);
      return new Set(def);
    }
    return new Set();
  });

  // Sync when team changes or activeTeamDoc changes
  useEffect(() => {
    if (activeTeamDoc?.retainedIds && Array.isArray(activeTeamDoc.retainedIds)) {
      setRetainedSet(new Set(activeTeamDoc.retainedIds));
    } else if (isBotTeam) {
      const def = (IPL_FRANCHISE_ROSTERS[selectedTeamId] || []).filter(p => p.defaultRetained).map(p => p.id);
      setRetainedSet(new Set(def));
    } else {
      // Human manager starts clean - user retains on their own choice!
      setRetainedSet(new Set());
    }
  }, [selectedTeamId, activeTeamDoc?.retainedIds, isBotTeam]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculations
  const retainedList = useMemo(() => {
    return franchiseRoster.filter(p => retainedSet.has(p.id));
  }, [franchiseRoster, retainedSet]);

  const totalDeduction = useMemo(() => {
    return retainedList.reduce((sum, p) => sum + (p.retentionPrice || 0), 0);
  }, [retainedList]);

  const remainingPurse = useMemo(() => {
    return Math.max(0, 120.0 - totalDeduction);
  }, [totalDeduction]);

  const slotsToBuy = useMemo(() => {
    return Math.max(0, 25 - retainedList.length);
  }, [retainedList.length]);

  const canEdit = useMemo(() => {
    if (isAdmin) return true;
    if (currentUserPlayer?.team === selectedTeamId) return true;
    return false;
  }, [isAdmin, currentUserPlayer?.team, selectedTeamId]);

  const togglePlayerRetention = async (player) => {
    if (!canEdit) {
      setErrorMsg("Only the manager of this franchise (or the room host) can modify retentions.");
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    const next = new Set(retainedSet);
    if (next.has(player.id)) {
      next.delete(player.id);
    } else {
      if (isMega && next.size >= 6) {
        setErrorMsg("Mega Auction rules allow a maximum of 6 retentions per franchise.");
        setTimeout(() => setErrorMsg(''), 3500);
        return;
      }
      next.add(player.id);
    }
    setRetainedSet(next);
    setSaveSuccess(false);

    // Auto-save the user's choice to room state
    if (saveTeamRetentions) {
      try {
        await saveTeamRetentions(roomId, selectedTeamId, Array.from(next));
      } catch (e) {
        console.warn('[RetentionDesk] Auto-save background error:', e);
      }
    }
  };

  const handleSave = async () => {
    if (!saveTeamRetentions) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      await saveTeamRetentions(roomId, selectedTeamId, Array.from(retainedSet));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[RetentionDesk] Save failed', err);
      setErrorMsg('Failed to save retentions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    const empty = new Set();
    setRetainedSet(empty);
    setSaveSuccess(false);
    if (saveTeamRetentions) {
      try {
        await saveTeamRetentions(roomId, selectedTeamId, []);
      } catch (e) {}
    }
  };

  const handleLoadOfficialRetentions = async () => {
    const def = franchiseRoster.filter(p => p.defaultRetained).map(p => p.id);
    const next = new Set(def);
    setRetainedSet(next);
    setSaveSuccess(false);
    if (saveTeamRetentions) {
      try {
        await saveTeamRetentions(roomId, selectedTeamId, def);
      } catch (e) {}
    }
  };

  const filteredRoster = useMemo(() => {
    return franchiseRoster.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All' || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [franchiseRoster, search, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Franchise Selector Strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Select Franchise Roster
          </span>
          <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
            {activeTeamInfo.name}
          </span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {TEAMS.map((t) => {
            const isSelected = selectedTeamId === t.id;
            const isMine = currentUserPlayer?.team === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_12px_rgba(255,85,0,0.3)] scale-105'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 p-1 flex items-center justify-center mb-0.5">
                  <img src={t.logo} alt={t.name} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-black uppercase text-white truncate max-w-full">
                  {t.id}
                </span>
                {isMine && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black shadow" title="Your Franchise" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>{isMega ? 'Mega Auction Retention Choice' : 'Mini Auction Squad Releases'}</span>
              {canEdit ? (
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-black">YOUR CHOICE</span>
              ) : (
                <span className="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.2 rounded font-black">VIEW ONLY</span>
              )}
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              {isMega
                ? 'You can choose to retain up to 6 players from your roster on your own choice. Retained players stay in your squad, while all other players are released into the open auction pool. Retention prices deduct from your ₹120.0 Cr purse.'
                : 'Select which players to release from your squad into the auction pool. Kept players stay in your squad and are deducted from ₹120.0 Cr.'}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase text-gray-400 hover:text-red-400 transition-all flex items-center gap-1 cursor-pointer"
              title="Clear all retentions"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={handleLoadOfficialRetentions}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              title="Load official IPL retentions"
            >
              <RotateCcw size={11} />
              <span>Load Real IPL</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-[#ff5500] to-[#ff7722] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,85,0,0.3)]'
              }`}
            >
              {isSaving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={12} strokeWidth={3} />
              ) : (
                <Save size={12} />
              )}
              <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Choices'}</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-0.5">
            Retained by You
          </span>
          <span className={`text-sm sm:text-base font-black ${isMega && retainedList.length === 6 ? 'text-orange-400' : retainedList.length > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {retainedList.length} {isMega ? '/ 6 Max' : 'Players'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-0.5">
            Deducted From Purse
          </span>
          <span className="text-sm sm:text-base font-black text-yellow-400">
            ₹{totalDeduction.toFixed(2)} Cr
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-0.5">
            Leftover Auction Purse
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-400">
            ₹{remainingPurse.toFixed(2)} Cr
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-0.5">
            Open Auction Slots
          </span>
          <span className="text-sm sm:text-base font-black text-blue-400">
            {slotsToBuy} Slots
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
        <div className="relative w-full sm:w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search roster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === role
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
        {filteredRoster.map((player) => {
          const isRetained = retainedSet.has(player.id);
          return (
            <div
              key={player.id}
              onClick={() => togglePlayerRetention(player)}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                isRetained
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = 'https://documents.iplt20.com/ipl/IPLHeadshot2025/12.png';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate max-w-[130px]">
                      {player.name}
                    </span>
                    <span className="text-[8px] px-1 py-0.2 rounded font-black bg-white/10 text-gray-300">
                      ★ {player.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                      {player.role}
                    </span>
                    <span className="text-[7px] px-1 rounded font-bold uppercase bg-white/5 text-gray-400">
                      {player.type === 'Overseas' ? 'OS' : 'IND'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="text-xs font-black text-yellow-400 font-mono">
                  ₹{player.retentionPrice ? player.retentionPrice.toFixed(2) : '2.00'} Cr
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                    isRetained
                      ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : 'bg-white/5 text-gray-500 border border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {isRetained ? (
                    <>
                      <Check size={9} strokeWidth={3} />
                      <span>Retained</span>
                    </>
                  ) : (
                    <>
                      <Plus size={9} />
                      <span>Click to Retain</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
