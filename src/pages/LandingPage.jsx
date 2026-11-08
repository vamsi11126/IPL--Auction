import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuction } from "../contexts/AuctionContext";
import { normalizeRoomCode, isHotspotRoomCode } from "../lib/roomCodes";
import { withServerParam } from "../lib/auctionServers";
import { TEAMS } from "../data/teams";
import {
  Zap,
  Users,
  Trophy,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Gavel,
  Radio,
  Coins,
  Bot,
  Volume2,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Hash,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Flame
} from "lucide-react";
import BuyMeACoffee from "../components/BuyMeACoffee";
import Footer from "../components/Footer";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function LandingPage() {
  useDocumentTitle(
    "IPL Auction Simulator & Game | Live IPL Mega Auction 2026",
    "Play the ultimate multiplayer IPL Auction Simulator online. Host live IPL Mega Auctions with friends, manage purse budgets, bid on top T20 players, and build championship squads!",
  );

  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoomDb } = useAuction();
  const [quickCode, setQuickCode] = useState("");
  const [quickCodeError, setQuickCodeError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isStepsOpen, setIsStepsOpen] = useState(false);

  const handleQuickJoin = async (e) => {
    e.preventDefault();
    if (!quickCode.trim()) return;

    const code = normalizeRoomCode(quickCode.trim());
    if (isHotspotRoomCode(code)) {
      navigate(`/lobby/${code}?local=true&server=local`);
      return;
    }

    if (!user) {
      navigate(`/rooms?tab=join&code=${encodeURIComponent(code)}`);
      return;
    }

    setIsJoining(true);
    setQuickCodeError("");
    try {
      const resolvedServer = await joinRoomDb(code, user.uid, {
        name: user.displayName || "Manager",
        team: "",
      });
      navigate(withServerParam(`/lobby/${code}`, resolvedServer));
    } catch (err) {
      setQuickCodeError(err.message || "Could not find or join this room.");
      setTimeout(() => setQuickCodeError(""), 4000);
    } finally {
      setIsJoining(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: "Real-Time Multiplayer",
      desc: "Live synchronized auction room with sub-second paddle bidding, auctioneer countdown clocks, and instant outbid alerts.",
      tag: "Live Sync",
      tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
    {
      icon: Bot,
      title: "Smart AI Bot Managers",
      desc: "Playing solo or co-op? Fill empty franchise desks with intelligent bots that strategize budgets and battle fiercely for marquee players.",
      tag: "Solo & Co-op",
      tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Trophy,
      title: "Wise Squad Rating Engine",
      desc: "Sophisticated squad evaluation algorithm ranking team balance, batting power, bowling depth, and IPL XI readiness.",
      tag: "Analytics",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Coins,
      title: "Authentic IPL Purse & Quotas",
      desc: "Full IPL 2026 rule enforcement: ₹120 Cr salary caps, 18-25 squad size limits, 8 maximum overseas slots, and RTM cards.",
      tag: "Official Rules",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Volume2,
      title: "Voice Auctioneer & Sound FX",
      desc: "Live synthetic voice audio calling bids, countdown timer warning audio, gavel soundboard, and sold confetti animations.",
      tag: "Audio HUD",
      tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Radio,
      title: "Zero-Lag Offline Hotspot Mode",
      desc: "Host auctions directly over your phone's personal hotspot with friends. Zero mobile data consumed and sub-5ms local LAN speed.",
      tag: "Zero Data",
      tagColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Create or Join Room",
      desc: "Spin up a public or private room in 1 tap, or connect via local phone hotspot without needing internet.",
    },
    {
      num: "02",
      title: "Pick Your Franchise",
      desc: "Claim CSK, MI, RCB, or any of the 10 IPL franchises and manage your official ₹120 Cr purse allocation.",
    },
    {
      num: "03",
      title: "Bid & Build Your XI",
      desc: "Outbid rivals as marquee players go under the hammer and see your squad rating update in real-time.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#070707] flex flex-col items-center pt-4 sm:pt-8 px-4 font-sans text-white overflow-x-hidden">
      {/* Top Floating Support Button (GitHub icon removed) */}
      <BuyMeACoffee />

      {/* Ambient Radial Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[12%] -left-[10%] w-[45%] h-[45%] bg-orange-700/15 blur-[140px] rounded-full" />
        <div className="absolute top-[30%] -right-[15%] w-[40%] h-[40%] bg-blue-700/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Navbar Header */}
      <header className="w-full max-w-6xl flex items-center justify-between gap-3 mb-8 z-10 relative py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5500] to-[#ff7722] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,85,0,0.4)]">
            <Gavel size={16} />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-none block">
              CRICK<span className="text-[#ff5500]">AUCTION</span>
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">
              IPL 2026 Mega Auction
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/guide"
            className="hidden sm:inline-flex text-[11px] font-bold text-gray-400 hover:text-white uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Game Guide
          </Link>
          <Link
            to="/rooms?tab=new"
            className="px-3.5 py-2 rounded-xl bg-[#ff5500] hover:bg-orange-600 text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_4px_14px_rgba(255,85,0,0.3)] cursor-pointer"
          >
            <span>Auction Hub</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="text-center z-10 relative max-w-4xl px-2 sm:px-4 mt-2 sm:mt-6 mb-12">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span>IPL Mega Auction 2026 Protocol Live</span>
        </div>

        {/* Big Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-pixel uppercase tracking-tight text-white leading-[1.05] drop-shadow-sm">
          CREATE YOUR{" "}
          <span className="text-[#ff5500] drop-shadow-[0_4px_20px_rgba(255,85,0,0.35)] block sm:inline">
            AUCTION ROOM
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm md:text-base text-gray-300 font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
          The ultimate multiplayer IPL auction simulator and strategy game. Host live IPL Mega Auctions with friends online or over personal mobile hotspot, manage ₹120 Cr purses, battle smart AI bots, and construct championship squads.
        </p>

        {/* ── PRIMARY CALL TO ACTION BUTTONS ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 max-w-md mx-auto">
          <Link
            to="/rooms?tab=new"
            className="w-full sm:w-auto flex-1 h-13 sm:h-14 px-6 rounded-2xl bg-gradient-to-r from-[#ff5500] to-[#ff7722] hover:brightness-110 active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,85,0,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle size={17} />
            <span>Create Room</span>
          </Link>

          <Link
            to="/rooms?tab=join"
            className="w-full sm:w-auto flex-1 h-13 sm:h-14 px-6 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Hash size={17} className="text-orange-400" />
            <span>Join Room</span>
          </Link>
        </div>

        {/* Quick Code Fast Join Input */}
        <form
          onSubmit={handleQuickJoin}
          className="mt-6 max-w-sm mx-auto flex items-center gap-2 bg-black/60 border border-white/10 rounded-2xl p-1.5 focus-within:border-orange-500/60 shadow-lg"
        >
          <input
            type="text"
            placeholder="Enter 6-char Room Code..."
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            maxLength={16}
            className="w-full bg-transparent px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isJoining || !quickCode.trim()}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            {isJoining ? "..." : "Join"}
          </button>
        </form>
        {quickCodeError && (
          <p className="text-[11px] text-red-400 mt-2 font-medium">{quickCodeError}</p>
        )}

        {/* Telemetry Metrics Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400">
          <span className="flex items-center gap-1.5">
            <Coins size={12} className="text-orange-400" /> ₹120 Cr Official Purse
          </span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-1.5">
            <Trophy size={12} className="text-yellow-400" /> 10 IPL Franchises
          </span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-1.5">
            <Users size={12} className="text-blue-400" /> Real-Time Multiplayer
          </span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-1.5">
            <Radio size={12} className="text-emerald-400" /> Zero-Lag Hotspot Mode
          </span>
        </div>
      </section>

      {/* ── 10 IPL FRANCHISES SHOWCASE STRIP ── */}
      <section className="w-full max-w-6xl z-10 relative mb-16">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Flame size={13} className="text-orange-500" /> All 10 Official IPL Franchises
          </span>
          <span className="text-[9px] font-mono text-gray-500 uppercase">
            IPL 2026 Catalog
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {TEAMS.map((team) => (
            <div
              key={team.id}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/40 hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center text-center group cursor-default"
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center p-1.5 mb-1.5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: team.color ? `${team.color}25` : "#ffffff10" }}
              >
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-full h-full object-contain drop-shadow"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] font-black uppercase text-white tracking-wide">
                {team.id}
              </span>
              <span className="text-[8px] text-gray-500 font-mono hidden sm:block truncate w-full">
                ₹120 Cr
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CORE WEBSITE FEATURES ── */}
      <section className="w-full max-w-6xl z-10 relative mb-16">
        <div className="text-center mb-8">
          <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
            TOURNAMENT-GRADE ENGINE
          </span>
          <h2 className="text-xl sm:text-3xl font-pixel uppercase text-white mt-2">
            EVERYTHING YOU NEED FOR AN EPIC AUCTION
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto mt-1">
            Built from scratch for cricket enthusiasts, fantasy managers, and competitive friends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-3xl bg-[#0f0f0f] border border-white/10 hover:border-orange-500/30 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_10px_30px_rgba(255,85,0,0.1)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white group-hover:text-[#ff5500] group-hover:border-orange-500/30 transition-colors">
                      <Icon size={18} />
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${f.tagColor}`}
                    >
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-normal">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── COLLAPSIBLE HOW TO PLAY & HOTSPOT STEPS (DROPDOWN ACCORDION) ── */}
      <section className="w-full max-w-6xl z-10 relative mb-16">
        {!isStepsOpen ? (
          <button
            type="button"
            onClick={() => setIsStepsOpen(true)}
            className="w-full p-4 sm:p-5 rounded-3xl bg-[#0e0e0e] border border-white/10 hover:border-orange-500/40 hover:bg-[#121212] transition-all flex items-center justify-between gap-3 text-left group cursor-pointer shadow-sm hover:shadow-[0_10px_30px_rgba(255,85,0,0.15)]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
                <Zap size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white group-hover:text-orange-400 transition-colors">
                    How to Play & Hotspot Guide
                  </span>
                  <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">
                    3 Easy Steps
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-0.5">
                  Create room • Claim franchise • Bid & build your dream XI (Click to expand)
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3.5 py-2 rounded-xl border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
              <span>Show Steps</span>
              <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </div>
          </button>
        ) : (
          <div className="bg-[#0e0e0e] border border-white/10 rounded-3xl sm:rounded-[2.2rem] p-6 sm:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">
                  QUICK-START GUIDE
                </span>
                <h3 className="text-base sm:text-xl font-pixel uppercase text-white mt-1">
                  HOW TO PLAY IN 3 EASY STEPS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStepsOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
              >
                <span>Collapse</span>
                <ChevronUp size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-orange-500/30 transition-all"
                >
                  <div>
                    <span className="text-xs font-mono font-black text-[#ff5500] block mb-2">
                      STEP {s.num}
                    </span>
                    <h4 className="text-sm font-black uppercase text-white mb-1">
                      {s.title}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── BOTTOM CTA BANNER ── */}
      <section className="w-full max-w-6xl z-10 relative mb-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#ff5500]/15 to-transparent border border-[#ff5500]/30 shadow-[0_20px_50px_rgba(255,85,0,0.15)]">
          <h2 className="text-2xl sm:text-4xl font-pixel uppercase text-white mb-2">
            READY TO TAKE THE AUCTION PADDLE?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto mb-6">
            Assemble your friends, claim your favorite IPL franchise, and see who builds the strongest championship XI.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/rooms?tab=new"
              className="px-6 py-3.5 rounded-2xl bg-[#ff5500] hover:bg-orange-600 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_8px_25px_rgba(255,85,0,0.4)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Auction Room Now</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
