import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuction } from "../contexts/AuctionContext";
import {
  getActiveServer,
  getRtdb,
  getAvailableServers,
  goOfflineServer,
  isServerAvailable,
} from "../lib/firebase";
import {
  fetchPublicLobbies as getPublicLobbies,
  fetchTeamsByUser,
  fetchAuctions,
  deleteTeam,
  deleteAuction,
} from "../lib/db";
import { generateRoomCode, normalizeRoomCode, isHotspotRoomCode } from "../lib/roomCodes";
import { formatAuthError } from "../utils/authErrors";
import { ref, remove } from "firebase/database";
import {
  getAuctionServer,
  getPreferredServer,
  getServerFromSearch,
  setPreferredServer,
  withServerParam,
} from "../lib/auctionServers";
import { IPL_PLAYERS } from "../data/players";
import { TEAMS } from "../data/teams";
import {
  Zap,
  Loader2,
  Users,
  Trophy,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  Star,
  Wifi,
  Radio,
  Globe,
  History,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Layers,
  ArrowRight,
  PlusCircle,
  Hash,
  LogIn
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import LocalPlayRoadmap from "../components/LocalPlayRoadmap";
import Footer from "../components/Footer";
import ServerSwitcher from "../components/ServerSwitcher";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  computeTeamSpent,
  countOverseas,
  formatCrores,
  isOverseasPlayer,
  toFiniteNumber,
} from "../lib/auctionDisplay";

export default function RoomHub({ initialTab }) {
  useDocumentTitle(
    "Auction Room Hub | Create, Join & Host IPL 2026 Auctions",
    "Create or join real-time multiplayer IPL Mega Auction rooms. Play online or offline over local hotspot, manage franchises, and bid on elite players.",
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loginWithGoogle, loginAsGuest, logout } = useAuth();
  const { createRoom, joinRoomDb } = useAuction();

  // Tab state: 'new' | 'join' | 'lobbies' | 'history'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "join") return "join";
    if (tabParam === "lobbies" || tabParam === "public") return "lobbies";
    if (tabParam === "history") return "history";
    if (initialTab) return initialTab;
    return "new";
  });

  const [selectedTeam, setSelectedTeam] = useState("MI");
  const [hostingType, setHostingType] = useState(() => {
    const mode = searchParams.get("mode");
    return mode === "hotspot" ? "hotspot" : "cloud";
  });
  const [auctionType, setAuctionType] = useState("mega");
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [roomCode, setRoomCode] = useState(() => searchParams.get("code") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Server state
  const availableServers = useMemo(() => getAvailableServers(), []);
  const [selectedServer, setSelectedServer] = useState(() => {
    const hinted = getServerFromSearch(window.location.search);
    if (hinted && isServerAvailable(hinted)) return hinted;
    const preferred = getPreferredServer();
    if (isServerAvailable(preferred)) return preferred;
    return availableServers[0]?.id || "primary";
  });

  const handleServerChange = (server) => {
    setSelectedServer(server);
    setPreferredServer(server);
    const url = new URL(window.location.href);
    url.searchParams.set("server", server);
    window.history.replaceState({}, "", url.toString());
  };

  // Public lobbies state
  const [publicRooms, setPublicRooms] = useState([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const publicLobbiesCacheRef = useRef({ data: null, timestamp: 0 });

  const fetchPublicLobbies = async (force = false) => {
    const now = Date.now();
    if (!force && publicLobbiesCacheRef.current.data && now - publicLobbiesCacheRef.current.timestamp < 30000) {
      setPublicRooms(publicLobbiesCacheRef.current.data);
      return;
    }
    setLobbiesLoading(true);
    try {
      const supabaseRooms = await getPublicLobbies();
      if (supabaseRooms && supabaseRooms.length > 0) {
        const list = supabaseRooms.map((r) => {
          const players = r.players || [];
          const uniquePlayers = [];
          const seenIds = new Set();
          players.forEach((p) => {
            const pid = p?.id || p?.userId;
            if (pid && !seenIds.has(pid)) {
              seenIds.add(pid);
              uniquePlayers.push(p);
            }
          });
          const host = uniquePlayers.find((p) => p.isHost) || uniquePlayers[0];
          return {
            roomId: r.id,
            server: getAuctionServer(r),
            hostName: r.host_name || host?.name || "Manager",
            status: r.status,
            auctionType: r.auction_type || "mega",
            players: uniquePlayers,
            squadLimit: toFiniteNumber(r.squad_limit, 25),
            settings: r.settings || {},
          };
        });
        publicLobbiesCacheRef.current = { data: list, timestamp: Date.now() };
        setPublicRooms(list);
      } else {
        setPublicRooms([]);
      }
    } catch {
      setPublicRooms([]);
    } finally {
      setLobbiesLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicLobbies();
  }, []);

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const historyRequestRef = useRef(false);
  const historyCacheRef = useRef(new Map());

  const fetchHistory = useCallback(async (force = false) => {
    const userId = user?.uid;
    if (!userId) {
      setHistoryData([]);
      return;
    }
    const cached = historyCacheRef.current.get(userId);
    if (!force && cached && Date.now() - cached.timestamp < 45000) {
      setHistoryData(cached.data);
      return;
    }
    if (historyRequestRef.current) return;
    historyRequestRef.current = true;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const supabaseTeams = await fetchTeamsByUser(userId);
      if (!supabaseTeams || supabaseTeams.length === 0) {
        setHistoryData([]);
        historyCacheRef.current.set(userId, { data: [], timestamp: Date.now() });
        return;
      }
      const auctionIds = [...new Set(supabaseTeams.map((t) => t.auction_id))].filter(Boolean);
      const supabaseAuctions = await fetchAuctions(auctionIds);
      const auctionMap = {};
      (supabaseAuctions || []).forEach((a) => {
        auctionMap[a.id] = a;
      });

      const sessions = supabaseTeams.map((teamData) => {
        const auctionData = auctionMap[teamData.auction_id];
        const totalBudget = toFiniteNumber(auctionData?.settings?.budget, 120);
        const spent = computeTeamSpent({
          budget: totalBudget,
          budgetRemaining: teamData.budget_remaining,
          spent: teamData.spent,
        });

        return {
          id: teamData.id,
          roomId: teamData.auction_id,
          server: getAuctionServer(auctionData),
          teamId: teamData.team_id,
          teamName: teamData.team_name,
          mode: auctionData?.auction_type || "mega",
          status: auctionData?.status || "waiting",
          budgetRemaining: teamData.budget_remaining ?? null,
          spent,
          overseasLimit: toFiniteNumber(auctionData?.overseas_limit, 8),
          squadLimit: toFiniteNumber(auctionData?.squad_limit, 25),
          squad: (teamData.squad || [])
            .map((s) => {
              const pid = typeof s === "string" ? s : s.id;
              const bid = typeof s === "string" ? null : (s.bid ?? null);
              const playerInfo = IPL_PLAYERS.find((p) => p.id === pid);
              return {
                id: pid,
                name: playerInfo?.name || pid,
                role: playerInfo?.role || "Player",
                image: playerInfo?.image || "",
                country: playerInfo?.country,
                type: playerInfo?.type,
                bid,
              };
            })
            .filter((p) => p.id),
          date: teamData.created_at
            ? new Date(teamData.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Recent Session",
        };
      });
      setHistoryData(sessions);
      historyCacheRef.current.set(userId, { data: sessions, timestamp: Date.now() });
    } catch (err) {
      console.error("[history] Failed to load history", err);
      setHistoryError("Could not load your auction history.");
    } finally {
      historyRequestRef.current = false;
      setHistoryLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) fetchHistory();
  }, [user?.uid, fetchHistory]);

  const filteredPublicRooms = useMemo(() => {
    return publicRooms.filter((room) => {
      const matchesServer = room.server === selectedServer;
      const matchesSearch =
        room.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = filterMode === "all" || room.auctionType === filterMode;
      return matchesServer && matchesSearch && matchesMode;
    });
  }, [publicRooms, selectedServer, searchQuery, filterMode]);

  const serverRoomCount = useMemo(
    () => publicRooms.filter((room) => room.server === selectedServer).length,
    [publicRooms, selectedServer]
  );

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyData;
    return historyData.filter((session) => session.server === historyFilter);
  }, [historyData, historyFilter]);

  const handleDeleteHistory = async () => {
    const session = sessionToDelete;
    if (!session) return;
    const roomId = session.roomId;
    const teamDocId = session.id;

    setHistoryData((prev) => prev.filter((item) => item.id !== teamDocId));
    setPublicRooms((prev) => prev.filter((room) => room.roomId !== roomId));
    if (expandedSession === teamDocId) setExpandedSession(null);
    setSessionToDelete(null);

    try {
      await deleteTeam(teamDocId);
      await deleteAuction(roomId);
    } catch (err) {
      console.error("[history] Delete failed", err);
      setHistoryData((prev) =>
        prev.some((item) => item.id === teamDocId) ? prev : [session, ...prev]
      );
      setError("Could not delete this room. Please try again.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (isServerAvailable(session.server)) {
      try {
        await remove(ref(getRtdb(session.server), `auctions/${roomId}`));
      } catch {
        // non-fatal
      } finally {
        goOfflineServer(session.server);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(formatAuthError(err));
      setTimeout(() => setError(""), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async (e) => {
    e?.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter a manager name");
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsGuest(guestName.trim());
      setIsSubmitting(false);
    } catch {
      setError("Guest login failed. Please try again.");
      setTimeout(() => setError(""), 3000);
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError("");

    try {
      const displayName = user.displayName || "Manager";

      if (activeTab === "new") {
        if (hostingType === "hotspot") {
          const localRoomId = `HOTSPOT-${generateRoomCode(4)}`;
          try {
            await createRoom(
              localRoomId,
              user.uid,
              { name: displayName, team: selectedTeam },
              auctionType,
              false,
              "local"
            );
          } catch {
            // non-fatal
          }
          setIsSubmitting(false);
          navigate(`/lobby/${localRoomId}?local=true&server=local`);
          return;
        }

        const newRoomId = generateRoomCode(6);
        const resolvedServer = await createRoom(
          newRoomId,
          user.uid,
          { name: displayName, team: selectedTeam },
          auctionType,
          isPublicRoom,
          selectedServer
        );
        const actualServer = resolvedServer || selectedServer;
        setSelectedServer(actualServer);
        navigate(withServerParam(`/lobby/${newRoomId}`, actualServer));
      } else if (activeTab === "join") {
        if (!roomCode) {
          setIsSubmitting(false);
          return;
        }
        const code = normalizeRoomCode(roomCode);
        if (isHotspotRoomCode(code) || selectedServer === "local") {
          setIsSubmitting(false);
          navigate(`/lobby/${code}?local=true&server=local`);
          return;
        }
        const resolvedServer = await joinRoomDb(code, user.uid, {
          name: displayName,
          team: "",
        });
        const actualServer = resolvedServer || selectedServer;
        setSelectedServer(actualServer);
        navigate(withServerParam(`/lobby/${code}`, actualServer));
      }
    } catch (err) {
      goOfflineServer(getActiveServer());
      setError(err.message || "Failed to create or join room. Please try again.");
      setTimeout(() => setError(""), 4000);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#060606] flex flex-col items-center pt-4 sm:pt-8 px-3 sm:px-6 font-sans text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-orange-700/15 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] bg-blue-700/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header Navigation */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 mb-6 z-10 relative">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 rounded-xl border border-white/10 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          {availableServers.length > 1 && (
            <ServerSwitcher
              servers={availableServers}
              value={selectedServer}
              onChange={handleServerChange}
            />
          )}

          {user && (
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 pl-3 pr-2 py-1.5 rounded-xl">
              <span className="text-[11px] font-bold text-gray-300 max-w-[120px] truncate">
                {user.displayName || "Manager"}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-[10px] text-gray-500 hover:text-orange-400 font-bold uppercase tracking-wider ml-1"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Hub Container */}
      <div className="w-full max-w-5xl z-10 relative mb-12">
        <div className="bg-[#0e0e0e] border border-white/10 rounded-3xl sm:rounded-[2.2rem] p-4 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Subtle Orange Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#ff5500]/10 to-transparent blur-2xl pointer-events-none" />

          {/* Segmented Tab Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("new");
                  setSearchParams({ tab: "new" });
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "new"
                    ? "bg-[#ff5500] text-white shadow-[0_4px_16px_rgba(255,85,0,0.4)]"
                    : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
                }`}
              >
                <PlusCircle size={15} />
                <span>Create Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("join");
                  setSearchParams({ tab: "join" });
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "join"
                    ? "bg-[#ff5500] text-white shadow-[0_4px_16px_rgba(255,85,0,0.4)]"
                    : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
                }`}
              >
                <Hash size={15} />
                <span>Join with Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("lobbies");
                  setSearchParams({ tab: "lobbies" });
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "lobbies"
                    ? "bg-[#ff5500] text-white shadow-[0_4px_16px_rgba(255,85,0,0.4)]"
                    : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
                }`}
              >
                <Users size={15} />
                <span>Public Lobbies</span>
                {serverRoomCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded-full text-white">
                    {serverRoomCount}
                  </span>
                )}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("history");
                    setSearchParams({ tab: "history" });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "history"
                      ? "bg-[#ff5500] text-white shadow-[0_4px_16px_rgba(255,85,0,0.4)]"
                      : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
                  }`}
                >
                  <History size={15} />
                  <span>My History</span>
                </button>
              )}
            </div>
          </div>

          {/* Not signed in banner if creating or joining */}
          {!user && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <LogIn size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">
                    Sign in to Save Your Squads & History
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Quickly log in with Google or start immediately with Guest Access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-100 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google</span>
                </button>

                {!isGuestMode ? (
                  <button
                    type="button"
                    onClick={() => setIsGuestMode(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Guest
                  </button>
                ) : (
                  <form onSubmit={handleGuestSignIn} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Manager Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded-lg bg-black border border-white/20 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                    >
                      OK
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* TAB 1: CREATE ROOM */}
          {activeTab === "new" && (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Franchise Selector */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    1. Select Your Franchise
                  </span>
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                    {TEAMS.find((t) => t.id === selectedTeam)?.name || selectedTeam}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TEAMS.map((team) => {
                    const isSelected = selectedTeam === team.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeam(team.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer relative ${
                          isSelected
                            ? "bg-white/[0.08] border-[#ff5500] shadow-[0_0_15px_rgba(255,85,0,0.25)]"
                            : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center p-1 shrink-0"
                          style={{ backgroundColor: team.color ? `${team.color}25` : "#ffffff15" }}
                        >
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-7 h-7 object-contain drop-shadow"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase text-white truncate">
                            {team.id}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium truncate">
                            ₹120 Cr
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rules & Hosting Mode Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Auction Format */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                    2. Auction Format
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAuctionType("mega")}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-center ${
                        auctionType === "mega"
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Mega (₹120 Cr)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuctionType("mini")}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-center ${
                        auctionType === "mini"
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Mini (₹100 Cr)
                    </button>
                  </div>
                </div>

                {/* Hosting Mode */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                    3. Connection Mode
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHostingType("cloud")}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 ${
                        hostingType === "cloud"
                          ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Globe size={12} />
                      <span>Cloud Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHostingType("hotspot")}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 ${
                        hostingType === "hotspot"
                          ? "bg-orange-500/30 text-orange-300 border border-orange-500/40"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Radio size={12} />
                      <span>Hotspot Wi-Fi</span>
                    </button>
                  </div>
                </div>

                {/* Visibility */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                    4. Room Visibility
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPublicRoom(true)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-center ${
                        isPublicRoom
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublicRoom(false)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-center ${
                        !isPublicRoom
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE HOTSPOT MODE STEPS ACCORDION */}
              <LocalPlayRoadmap
                collapsible={true}
                defaultOpen={false}
                onSelectOfflineMode={() => setHostingType("hotspot")}
              />

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#ff5500] to-[#ff7722] hover:brightness-110 active:scale-[0.99] text-white font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,85,0,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Spinning up room...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Auction Room as {selectedTeam} Manager</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: JOIN WITH CODE */}
          {activeTab === "join" && (
            <form onSubmit={handleFormSubmit} className="space-y-6 max-w-xl mx-auto py-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mx-auto mb-3">
                  <Hash size={24} />
                </div>
                <h3 className="text-lg font-black uppercase text-white tracking-wide">
                  Enter Auction Room Code
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ask the host for their 6-character room code or connect via hotspot code.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="e.g. 7K2M9P or HOTSPOT-ABCD"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full h-14 rounded-2xl bg-black/60 border border-white/15 px-4 text-center text-xl font-mono font-bold tracking-[0.2em] text-white uppercase placeholder-gray-600 focus:outline-none focus:border-orange-500 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !roomCode.trim()}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#ff5500] to-[#ff7722] hover:brightness-110 active:scale-[0.99] text-white font-black text-xs uppercase tracking-widest shadow-[0_8px_25px_rgba(255,85,0,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Entering Auction...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Auction Room</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2">
                <LocalPlayRoadmap collapsible={true} defaultOpen={false} />
              </div>
            </form>
          )}

          {/* TAB 3: PUBLIC LOBBIES */}
          {activeTab === "lobbies" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by Room ID or Host..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => fetchPublicLobbies(true)}
                    disabled={lobbiesLoading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Refresh Lobbies"
                  >
                    <RefreshCw size={14} className={lobbiesLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {lobbiesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Scanning active hubs...
                  </span>
                </div>
              ) : filteredPublicRooms.length === 0 ? (
                <div className="py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2">
                    No active public lobbies on {selectedServer} server
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-wider hover:bg-orange-500/30"
                  >
                    Create the First Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPublicRooms.map((room) => (
                    <div
                      key={room.roomId}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-white font-mono">
                              #{room.roomId}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              {room.auctionType}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Host: {room.hostName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1 justify-end">
                            <Users size={12} />
                            <span>{room.players.length}/10</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) {
                            setError("Please sign in or enter guest name above to join");
                            return;
                          }
                          try {
                            const actualServer = room.server || selectedServer;
                            await joinRoomDb(room.roomId, user.uid, {
                              name: user.displayName || "Manager",
                              team: "",
                            });
                            navigate(withServerParam(`/lobby/${room.roomId}`, actualServer));
                          } catch (err) {
                            setError(err.message || "Failed to join room.");
                          }
                        }}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-orange-500 text-white hover:text-black font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Join Room</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Your Past Auctions
                </span>
                <button
                  type="button"
                  onClick={() => fetchHistory(true)}
                  disabled={historyLoading}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <RefreshCw size={13} className={historyLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {historyLoading ? (
                <div className="py-12 flex justify-center text-gray-500">
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-wider">
                    No auction history recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHistory.map((session) => {
                    const isExpanded = expandedSession === session.id;
                    return (
                      <div
                        key={session.id}
                        className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase text-white font-mono">
                              #{session.roomId}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {session.teamName} • {session.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-orange-400">
                              {session.squad.length} Players
                            </span>
                            <ChevronDown
                              size={14}
                              className={`text-gray-500 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {session.squad.map((p) => (
                              <div
                                key={p.id}
                                className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]"
                              >
                                <span className="font-bold text-white truncate mr-1">
                                  {p.name}
                                </span>
                                <span className="text-gray-400 font-mono shrink-0">
                                  {p.bid ? `₹${p.bid}L` : "Base"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
