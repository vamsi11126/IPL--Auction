import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertCircle, X, Gavel } from 'lucide-react';

import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import PageLoader from '../components/PageLoader';
import ConfirmDialog from '../components/ConfirmDialog';
import useRoomServer from '../hooks/useRoomServer';
import { withServerParam } from '../lib/auctionServers';
import { isHotspotRoomCode } from '../lib/roomCodes';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
   clampTimer,
   countOverseas,
   isOverseasPlayer,
   timerProgress,
   toFiniteNumber,
} from '../lib/auctionDisplay';
import { getLiveRemainingMs, isInLastCall } from '../lib/localAuctionEngine';
import { evaluateSquadStrength } from '../lib/squadRatingEngine';

// Modular Auction Components
import AuctionNavbar from '../components/auction/AuctionNavbar';
import ArenaView from '../components/auction/ArenaView';
import SquadsView from '../components/auction/SquadsView';
import CatalogView from '../components/auction/CatalogView';
import WarRoomView from '../components/auction/WarRoomView';
import HostDeskDrawer from '../components/auction/HostDeskDrawer';

const AuctionRoom = () => {
   const { id } = useParams();
   useDocumentTitle(`Auction Room #${id || ''} | CrickAuction`, 'Live multiplayer IPL Auction bidding arena.', true);
   const navigate = useNavigate();
   const { server, ready: serverReady } = useRoomServer(id);
   const {
      currentAuction,
      team,
      roomTeams,
      loading,
      placeBid,
      joinAuction,
      joinRoomDb,
      endPlayerAuction,
      pauseAuction,
      resumeAuction,
      endAuction,
      messages,
      updateRoomSettings,
      kickPlayer,
      getSyncedTime
   } = useAuction();
   const { user } = useAuth();

   // Navigation & View State: 'arena' | 'squads' | 'catalog' | 'war-room'
   const [activeScreen, setActiveScreen] = useState('arena');
   const [selectedTeamId, setSelectedTeamId] = useState('CSK');
   const [activeOverlayTab, setActiveOverlayTab] = useState('upcoming');

   // UI Flags & Modals
   const [, setTimerTick] = useState(0);
   const [error, setError] = useState('');
   const [copied, setCopied] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showHostDesk, setShowHostDesk] = useState(false);
   const [showEndConfirm, setShowEndConfirm] = useState(false);
   const [isEnding, setIsEnding] = useState(false);
   const [optimisticState, setOptimisticState] = useState(null);
   const [joiningTeam, setJoiningTeam] = useState(null);
   const [banError, setBanError] = useState(null);
   const [isBiddingInFlight, setIsBiddingInFlight] = useState(false);
   const [spectateMode, setSpectateMode] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('spectate') === 'true';
   });

   const celebrationAudioRef = useRef(null);
   const fallbackAudioRef = useRef(null);
   const redirectedToLobbyRef = useRef(false);

   // Clear optimistic state when DB catches up
   useEffect(() => {
      if (optimisticState && currentAuction?.currentAuction?.currentBid >= optimisticState.currentBid) {
         setOptimisticState(null);
      }
   }, [currentAuction?.currentAuction?.currentBid, optimisticState]);

   const displayAuctionState = optimisticState || currentAuction?.currentAuction;

   // Derived timer state
   const configuredBidTimer = toFiniteNumber(currentAuction?.settings?.bidTimer, 10);
   const timerTotal = configuredBidTimer > 0 ? configuredBidTimer : 10;
   const isTimerBidding = displayAuctionState?.status === 'bidding';
   const isTimerPaused = displayAuctionState?.status === 'paused';
   const isHotspotRoom = isHotspotRoomCode(id) || currentAuction?.server === 'local';
   const inLastCall = isHotspotRoom && isInLastCall(displayAuctionState);
   const rawMsRemaining = isHotspotRoom
      ? getLiveRemainingMs(displayAuctionState)
      : (isTimerPaused
         ? Math.max(0, displayAuctionState?.remainingMs || 0)
         : (isTimerBidding && displayAuctionState?.timerEndsAt ? Math.max(0, displayAuctionState.timerEndsAt - getSyncedTime()) : 0));
   const rawSecondsRemaining = (isTimerBidding || isTimerPaused)
      ? Math.ceil(rawMsRemaining / 1000)
      : 0;
   const secondsRemaining = (isTimerBidding || isTimerPaused)
      ? clampTimer(rawSecondsRemaining, timerTotal)
      : 0;
   const timerPercent = (isTimerBidding || isTimerPaused)
      ? timerProgress(rawSecondsRemaining, timerTotal)
      : 0;

   // Real-time team ratings using wise franchise strength evaluation
   const liveTeamRatings = useMemo(() => {
      const minPlayers = currentAuction?.auctionType === 'sprint5' ? 5 : currentAuction?.auctionType === 'sprint11' ? 11 : 18;
      const ratingMap = {};

      TEAMS.forEach(team => {
         const teamDoc = roomTeams.find(doc => doc.teamId === team.id);
         const squad = teamDoc?.squad || [];
         const evaluation = evaluateSquadStrength(squad, minPlayers);
         const avgRating = squad.length > 0 ? evaluation.overallScore.toFixed(1) : null;

         ratingMap[team.id] = { 
            totalRating: evaluation.overallScore, 
            avgRating, 
            playerCount: squad.length,
            playingXIRating: evaluation.playingXIRating,
            balanceScore: evaluation.balanceScore,
            benchScore: evaluation.benchScore,
            balanceTags: evaluation.balanceTags
         };
      });

      const rankedTeams = [...TEAMS].sort((a, b) => {
         const rA = ratingMap[a.id]?.avgRating ? parseFloat(ratingMap[a.id].avgRating) : 0;
         const rB = ratingMap[b.id]?.avgRating ? parseFloat(ratingMap[b.id].avgRating) : 0;
         if (rB !== rA) return rB - rA;
         return a.name.localeCompare(b.name);
      });

      return { ratingMap, rankedTeams };
   }, [roomTeams, currentAuction]);

   // Audio unlocker for mobile browsers
   useEffect(() => {
      if (!celebrationAudioRef.current) {
         celebrationAudioRef.current = new Audio();
      }
      const unlockAudio = () => {
         if (celebrationAudioRef.current) {
            celebrationAudioRef.current.src = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
            celebrationAudioRef.current.play().then(() => {
               celebrationAudioRef.current.pause();
               celebrationAudioRef.current.currentTime = 0;
            }).catch(() => { });
         }
      };

      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      return () => {
         window.removeEventListener('click', unlockAudio);
         window.removeEventListener('touchstart', unlockAudio);
      };
   }, []);

   // Redirect on complete
   useEffect(() => {
      if (!serverReady) return;
      if (currentAuction?.status === 'completed') {
         navigate(withServerParam(`/summary/${id}`, server), { replace: true });
      }
   }, [currentAuction?.status, id, navigate, server, serverReady]);

   // Missing-auth redirects
   useEffect(() => {
      if (!serverReady) return;
      if (!user && !loading && !redirectedToLobbyRef.current) {
         redirectedToLobbyRef.current = true;
         navigate(withServerParam(`/lobby/${id}`, server), { replace: true });
      }
   }, [user, loading, id, navigate, server, serverReady]);

   const TEAM_SONGS = {
      'csk': '/CSK.mp3',
      'mi': '/MI.mp3',
      'rcb': '/RCB.mp3',
      'kkr': '/KKR.mp3',
      'dc': '/DC.mp3',
      'pbks': '/PBKS.mp3',
      'rr': '/RR.mp3',
      'srh': '/SRH.mp3',
      'lsg': '/LSG.mp3',
      'gt': '/GT.mp3',
   };

   useEffect(() => {
      if (team?.teamId) setSelectedTeamId(team.teamId);
   }, [team?.teamId]);

   const currentPlayer = useMemo(() => {
      return IPL_PLAYERS.find(p => p.id === displayAuctionState?.playerId) || IPL_PLAYERS[0];
   }, [displayAuctionState?.playerId]);

   // Voice Auctioneer TTS
   const [isTtsEnabled, setIsTtsEnabled] = useState(true);
   const [ttsSpeed, setTtsSpeed] = useState(1.15);
   const [ttsPitch, setTtsPitch] = useState(0.95);
   const [availableVoices, setAvailableVoices] = useState([]);
   const [selectedVoiceName, setSelectedVoiceName] = useState('');

   const lastSpokenPlayerIdRef = useRef(null);
   const lastSpokenBidRef = useRef(0);
   const lastSpokenStatusRef = useRef(null);

   const formatPriceForSpeech = (amount) => {
      if (amount === 0) return "zero crores";
      if (amount < 1) {
         const lakhs = Math.round(amount * 100);
         return `${lakhs} lakh${lakhs !== 1 ? 's' : ''}`;
      } else {
         const crores = Math.floor(amount);
         const lakhs = Math.round((amount - crores) * 100);
         if (lakhs === 0) return `${crores} crore${crores !== 1 ? 's' : ''}`;
         return `${crores} crore${crores !== 1 ? 's' : ''} ${lakhs} lakh${lakhs !== 1 ? 's' : ''}`;
      }
   };

   const getVoiceLabel = (name) => {
      const cleanName = name.toLowerCase();
      if (cleanName.includes("neerja")) return "Neerja (Indian Female)";
      if (cleanName.includes("rishi")) return "Rishi (Indian Male)";
      if (cleanName.includes("daniel")) return "Daniel (UK Auctioneer)";
      if (cleanName.includes("david")) return "David (Professional Male)";
      if (cleanName.includes("samantha")) return "Samantha (US Female)";
      return name.replace("Microsoft", "").replace("Google", "").replace("Desktop", "").trim();
   };

   useEffect(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
         const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const targetPatterns = [
               "Google US English",
               "Google UK English Male",
               "Google UK English Female",
               "Microsoft David",
               "Neerja",
               "Daniel",
               "Samantha",
               "Rishi",
               "Microsoft Mark",
               "Microsoft Zira"
            ];

            let filtered = voices.filter(v =>
               v.lang.startsWith('en') &&
               targetPatterns.some(pattern => v.name.toLowerCase().includes(pattern.toLowerCase()))
            );

            if (filtered.length === 0) {
               filtered = voices.filter(v => v.lang.startsWith('en')).slice(0, 5);
            }

            setAvailableVoices(filtered);

            if (!selectedVoiceName && filtered.length > 0) {
               const defaultVoice = filtered.find(v =>
                  v.name.includes("Neerja") ||
                  v.name.includes("Daniel") ||
                  v.name.includes("Rishi") ||
                  v.name.includes("David") ||
                  v.name.includes("Google US")
               ) || filtered[0];

               if (defaultVoice) {
                  setSelectedVoiceName(defaultVoice.name);
               }
            }
         };

         updateVoices();
         if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
         }
      }
   }, [selectedVoiceName]);

   const speak = (text) => {
      if (!isTtsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const chosen = voices.find(v => v.name === selectedVoiceName) || voices[0];
      if (chosen) utterance.voice = chosen;
      utterance.rate = ttsSpeed;
      utterance.pitch = ttsPitch;
      window.speechSynthesis.speak(utterance);
   };

   useEffect(() => {
      if (currentAuction?.status !== 'active' || !displayAuctionState) return;

      const playerId = displayAuctionState.playerId;
      const currentBidVal = displayAuctionState.currentBid || 0;
      const status = displayAuctionState.status;
      const highBidderTeamId = displayAuctionState.highBidderTeamId;

      if (status === 'paused') {
         if (lastSpokenStatusRef.current !== 'paused') {
            lastSpokenStatusRef.current = 'paused';
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            speak("Auction paused by Admin.");
         }
         return;
      }

      if (status === 'bidding') {
         if (lastSpokenStatusRef.current === 'paused') {
            lastSpokenStatusRef.current = 'bidding';
            speak("Auction resumed. Bidding is open.");
            return;
         }
         if (lastSpokenPlayerIdRef.current !== playerId) {
            lastSpokenPlayerIdRef.current = playerId;
            lastSpokenBidRef.current = 0;
            lastSpokenStatusRef.current = 'bidding';
            const pName = currentPlayer?.name || "Player";
            const pRole = currentPlayer?.role || "";
            const baseValStr = formatPriceForSpeech(currentPlayer?.basePrice || 0);
            speak(`Now up for auction: ${pName}, a ${pRole}. Base price: ${baseValStr}.`);
         } else if (currentBidVal > lastSpokenBidRef.current) {
            lastSpokenBidRef.current = currentBidVal;
            const teamName = TEAMS.find(t => t.id === highBidderTeamId)?.name || highBidderTeamId || "a manager";
            speak(`Bid is ${formatPriceForSpeech(currentBidVal)} with ${teamName}!`);
         }
      } else if (status === 'sold' && lastSpokenStatusRef.current !== 'sold') {
         lastSpokenStatusRef.current = 'sold';
         const teamName = TEAMS.find(t => t.id === highBidderTeamId)?.name || highBidderTeamId || "a franchise";
         speak(`Sold! ${currentPlayer?.name || "Player"} goes to ${teamName} for ${formatPriceForSpeech(currentBidVal)}!`);
      } else if (status === 'unsold' && lastSpokenStatusRef.current !== 'unsold') {
         lastSpokenStatusRef.current = 'unsold';
         speak(`${currentPlayer?.name || "Player"} is unsold.`);
      }
   }, [displayAuctionState?.playerId, displayAuctionState?.currentBid, displayAuctionState?.status, currentAuction?.status, isTtsEnabled, currentPlayer]);

   useEffect(() => {
      return () => {
         if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      };
   }, []);

   const isAdmin = currentAuction?.hostId === user?.uid;
   const currentBid = displayAuctionState?.currentBid || 0;
   const increment = currentBid < 5 ? 0.20 : 0.25;
   const nextBidAmount = currentBid === 0 ? (currentPlayer?.basePrice || 0) : currentBid + increment;

   // Player categories for catalog
   const playerCategories = useMemo(() => {
      const soldIds = new Set();
      const soldWithBids = {};
      roomTeams.forEach(t => {
         (t.squad || []).forEach(p => {
            soldIds.add(p.id);
            soldWithBids[p.id] = { bid: p.bid, teamId: t.teamId };
         });
      });

      const playerOrder = currentAuction?.playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
      const currentPlayerId = displayAuctionState?.playerId;
      const currentPlayerIndexInOrder = playerOrder.indexOf(IPL_PLAYERS.findIndex(p => p.id === currentPlayerId));

      const upcoming = [];
      const sold = [];
      const unsold = [];

      playerOrder.forEach((idx, i) => {
         const p = IPL_PLAYERS[idx];
         if (!p) return;
         if (soldIds.has(p.id)) {
            sold.push({ ...p, ...soldWithBids[p.id] });
         } else if (i < currentPlayerIndexInOrder) {
            unsold.push(p);
         } else {
            upcoming.push(p);
         }
      });

      return { upcoming, sold, unsold };
   }, [currentAuction?.playerOrder, displayAuctionState?.playerId, roomTeams]);

   // Room connection
   useEffect(() => {
      if (!serverReady || !id || !user?.uid) return;
      const unsub = joinAuction(id, user.uid, server);
      const autoJoin = async () => {
         try {
            await joinRoomDb(id, user.uid, { name: user.displayName || 'Manager' }, server);
         } catch (e) {
            if (e?.message?.includes("kicked")) setBanError(e.message);
         }
      };
      autoJoin();
      return () => unsub();
   }, [id, user?.uid, user?.displayName, joinAuction, joinRoomDb, server, serverReady]);

   // Ban check
   useEffect(() => {
      if (currentAuction && user && currentAuction.bannedPlayers?.includes(user.uid)) {
         setBanError("You have been kicked from this room.");
      }
   }, [currentAuction, user]);

   // Audio Context Beep
   const audioCtxRef = useRef(null);
   const playBeep = (freq = 440, duration = 0.1) => {
      if (displayAuctionState?.status === 'paused') return;
      try {
         if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
         }
         const ctx = audioCtxRef.current;
         if (ctx.state === 'suspended') ctx.resume();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.type = 'sine';
         osc.frequency.setValueAtTime(freq, ctx.currentTime);
         gain.gain.setValueAtTime(0.1, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.start();
         osc.stop(ctx.currentTime + duration);
      } catch { }
   };

   // Confetti and Celebration Sound
   const lastHandledSoundStatusRef = useRef(null);
   useEffect(() => {
      const status = displayAuctionState?.status;
      let rafId;

      if (status === 'sold') {
         const key = `sold_${displayAuctionState?.highBidderTeamId}_${displayAuctionState?.currentBid}`;
         if (lastHandledSoundStatusRef.current !== key) {
            lastHandledSoundStatusRef.current = key;
            const teamId = displayAuctionState?.highBidderTeamId;
            const end = Date.now() + 2500;
            const frame = () => {
               confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
               confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
               if (Date.now() < end) rafId = requestAnimationFrame(frame);
            };
            frame();

            if (teamId && TEAM_SONGS[teamId.toLowerCase()]) {
               if (!celebrationAudioRef.current) celebrationAudioRef.current = new Audio();
               const audio = celebrationAudioRef.current;
               try {
                  audio.pause();
                  audio.src = TEAM_SONGS[teamId.toLowerCase()];
                  audio.volume = 0.5;
                  audio.play().catch(() => { });
               } catch { }
            }
         }
      } else if (status === 'unsold') {
         const key = `unsold_${displayAuctionState?.playerId}`;
         if (lastHandledSoundStatusRef.current !== key) {
            lastHandledSoundStatusRef.current = key;
            if (!celebrationAudioRef.current) celebrationAudioRef.current = new Audio();
            const audio = celebrationAudioRef.current;
            try {
               audio.pause();
               audio.src = '/unsold1.mpeg';
               audio.volume = 0.6;
               audio.play().catch(() => { });
            } catch { }
         }
      } else {
         lastHandledSoundStatusRef.current = null;
         if (celebrationAudioRef.current) {
            celebrationAudioRef.current.pause();
            celebrationAudioRef.current.currentTime = 0;
         }
      }

      return () => {
         if (rafId) cancelAnimationFrame(rafId);
      };
   }, [displayAuctionState?.status, displayAuctionState?.highBidderTeamId, displayAuctionState?.playerId, displayAuctionState?.currentBid]);

   // Round Timer interval
   const lastBeepedSecRef = useRef(-1);
   const endTriggeredRef = useRef(false);

   useEffect(() => {
      endTriggeredRef.current = false;
   }, [displayAuctionState?.playerId]);

   useEffect(() => {
      if (currentAuction?.status !== 'active' || !displayAuctionState || (displayAuctionState?.status !== 'bidding' && displayAuctionState?.status !== 'paused')) {
         return;
      }
      if (displayAuctionState?.status === 'paused') {
         setTimerTick(t => t + 1);
         return;
      }

      lastBeepedSecRef.current = -1;
      const isHotspot = isHotspotRoomCode(id) || currentAuction?.server === 'local';
      const interval = setInterval(() => {
         const rawMs = isHotspot
            ? getLiveRemainingMs(displayAuctionState)
            : (displayAuctionState.timerEndsAt - getSyncedTime());
         const diff = Math.max(0, Math.ceil(rawMs / 1000));

         if (diff <= 5 && diff > 0 && diff !== lastBeepedSecRef.current) {
            lastBeepedSecRef.current = diff;
            playBeep(diff === 1 ? 880 : 440, 0.1);
         }

         setTimerTick(t => t + 1);
         if (diff === 0 && !isHotspot) {
            const shouldTrigger = (isAdmin || rawMs < -1500) && displayAuctionState.status === 'bidding' && !endTriggeredRef.current;
            if (shouldTrigger) {
               endTriggeredRef.current = true;
               clearInterval(interval);
               setTimeout(() => {
                  endPlayerAuction(id);
               }, 300);
            }
         }
      }, 200);

      return () => clearInterval(interval);
   }, [displayAuctionState?.timerEndsAt, displayAuctionState?.status, currentAuction?.status, isAdmin, id, endPlayerAuction, getSyncedTime]);

   // Bid Action
   const handleBid = async () => {
      if (isBiddingInFlight || displayAuctionState?.highBidderId === user?.uid) return;

      if ((team?.budgetRemaining || 0) < nextBidAmount) {
         setError('Insufficient Purse Remaining');
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      const squadLimit = toFiniteNumber(currentAuction?.squadLimit, 25);
      if ((team?.squad?.length || 0) >= squadLimit) {
         setError(`Squad Full (Max ${squadLimit} Players)`);
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      const isOverseas = isOverseasPlayer(currentPlayer);
      const overseasLimit = toFiniteNumber(currentAuction?.overseasLimit, 8);
      if (isOverseas && countOverseas(team?.squad, IPL_PLAYERS) >= overseasLimit) {
         setError(`Overseas Limit Reached (Max ${overseasLimit})`);
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      playBeep(660, 0.1);
      setError('');
      setIsBiddingInFlight(true);

      setOptimisticState({
         ...displayAuctionState,
         currentBid: nextBidAmount,
         highBidderId: user?.uid,
         highBidderName: user?.displayName || 'Manager',
         highBidderTeamId: team?.teamId,
         timerEndsAt: getSyncedTime() + (currentAuction?.settings?.bidTimer || 10) * 1000
      });

      try {
         await placeBid(nextBidAmount);
      } catch (err) {
         setOptimisticState(null);
         setError(err?.message || 'Bid failed');
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
      } finally {
         setIsBiddingInFlight(false);
      }
   };

   const copyRoomId = () => {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   // Banned screen
   if (banError) {
      return (
         <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white">
            <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
               <ShieldAlert size={40} className="text-red-500 mx-auto mb-4" />
               <h1 className="text-2xl font-black mb-2 uppercase text-red-500">Access Denied</h1>
               <p className="text-gray-400 text-xs mb-6 uppercase tracking-wider">{banError}</p>
               <button onClick={() => navigate('/')} className="w-full py-3 bg-white text-black font-black uppercase text-xs rounded-xl cursor-pointer">
                  Back to Home
               </button>
            </div>
         </div>
      );
   }

   if (!user && !loading) return <PageLoader />;
   if (!serverReady || loading) return <PageLoader />;

   // Late joiner / Team selection guard
   if (!spectateMode && !team && !loading && user) {
      const takenTeamIds = new Set(roomTeams.map(t => t.teamId));
      (currentAuction?.players || []).forEach(p => { if (p.team) takenTeamIds.add(p.team); });
      const availableTeams = TEAMS.filter(t => !takenTeamIds.has(t.id));

      const handleQuickJoin = async (selectedTeam) => {
         if (joiningTeam) return;
         setJoiningTeam(selectedTeam.id);
         try {
            await joinRoomDb(id, user.uid, { name: user.displayName || 'Manager', team: selectedTeam.id }, server);
         } catch {
            setError('Failed to join that franchise.');
            setTimeout(() => setError(''), 3000);
            setJoiningTeam(null);
         }
      };

      return (
         <div className="h-screen-safe bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-xl w-full">
               <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 mx-auto mb-4">
                  <Gavel size={32} />
               </div>
               <h2 className="text-2xl sm:text-3xl font-black uppercase mb-2">Claim Franchise</h2>
               <p className="text-gray-400 text-xs mb-6">Select your franchise to start bidding in the live auction.</p>

               <div className="grid grid-cols-5 gap-3 mb-6">
                  {TEAMS.map((t) => {
                     const isTaken = takenTeamIds.has(t.id);
                     const isJoining = joiningTeam === t.id;
                     return (
                        <button
                           key={t.id}
                           onClick={() => !isTaken && handleQuickJoin(t)}
                           disabled={isTaken || !!joiningTeam}
                           className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isJoining ? 'border-yellow-400 bg-yellow-400/10' : isTaken ? 'opacity-25 border-white/5 cursor-not-allowed' : 'border-white/10 hover:border-yellow-500/40 hover:bg-white/5'}`}
                        >
                           <div className="w-10 h-10 p-1 mb-1">
                              <img src={t.logo} alt={t.name} className="w-full h-full object-contain" />
                           </div>
                           <span className="text-[9px] font-black uppercase">{isJoining ? 'Joining' : isTaken ? 'Taken' : t.id}</span>
                        </button>
                     );
                  })}
               </div>

               <div className="flex gap-3 justify-center">
                  <button onClick={() => setSpectateMode(true)} className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                     Spectator Mode
                  </button>
                  <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-400 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                     Home
                  </button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="h-screen-safe bg-[#0a0a0c] text-white flex flex-col items-center overflow-hidden">
         {/* Minimal Top Header with Desktop Tabs */}
         <AuctionNavbar
            id={id}
            copied={copied}
            copyRoomId={copyRoomId}
            spectateMode={spectateMode}
            currentAuction={currentAuction}
            team={team}
            isAdmin={isAdmin}
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            setShowHostDesk={setShowHostDesk}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            navigate={navigate}
         />

         {/* Dedicated Screen Viewport */}
         <main className="w-full flex-1 flex flex-col min-h-0 overflow-hidden relative pb-14 md:pb-0">
            {activeScreen === 'arena' && (
               <ArenaView
                  currentPlayer={currentPlayer}
                  displayAuctionState={displayAuctionState}
                  team={team}
                  currentAuction={currentAuction}
                  user={user}
                  spectateMode={spectateMode}
                  isTimerPaused={isTimerPaused}
                  inLastCall={inLastCall}
                  secondsRemaining={secondsRemaining}
                  timerPercent={timerPercent}
                  nextBidAmount={nextBidAmount}
                  handleBid={handleBid}
                  isBiddingInFlight={isBiddingInFlight}
               />
            )}

            {activeScreen === 'squads' && (
               <SquadsView
                  roomTeams={roomTeams}
                  currentAuction={currentAuction}
                  user={user}
                  liveTeamRatings={liveTeamRatings}
                  selectedTeamId={selectedTeamId}
                  setSelectedTeamId={setSelectedTeamId}
               />
            )}

            {activeScreen === 'catalog' && (
               <CatalogView
                  playerCategories={playerCategories}
                  activeOverlayTab={activeOverlayTab}
                  setActiveOverlayTab={setActiveOverlayTab}
               />
            )}

            {activeScreen === 'war-room' && (
               <WarRoomView
                  messages={messages}
                  roomId={id}
               />
            )}
         </main>

         {/* Host Control Desk Drawer (Admin only) */}
         {isAdmin && (
            <HostDeskDrawer
               isOpen={showHostDesk}
               onClose={() => setShowHostDesk(false)}
               displayAuctionState={displayAuctionState}
               currentAuction={currentAuction}
               id={id}
               pauseAuction={pauseAuction}
               resumeAuction={resumeAuction}
               setShowEndConfirm={setShowEndConfirm}
               updateRoomSettings={updateRoomSettings}
               kickPlayer={kickPlayer}
               setError={setError}
            />
         )}

         {/* Voice & Audio Settings Modal */}
         <AnimatePresence>
            {showSettings && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-16 right-4 z-[100] bg-[#0f1015] border border-white/10 p-5 rounded-3xl shadow-2xl w-80 backdrop-blur-2xl">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                     <span className="text-xs font-black uppercase text-white tracking-wider">Audio & Voice Settings</span>
                     <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white cursor-pointer"><X size={15} /></button>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-yellow-400">Voice Auctioneer</span>
                        <button onClick={() => setIsTtsEnabled(!isTtsEnabled)} className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isTtsEnabled ? 'bg-yellow-500' : 'bg-white/10'}`}>
                           <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${isTtsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                     </div>

                     <div className={isTtsEnabled ? 'space-y-1' : 'opacity-40 pointer-events-none space-y-1'}>
                        <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                           <span>Speed</span>
                           <span>{ttsSpeed.toFixed(2)}x</span>
                        </div>
                        <input type="range" min="0.75" max="1.50" step="0.05" value={ttsSpeed} onChange={(e) => setTtsSpeed(parseFloat(e.target.value))} className="w-full accent-yellow-500 bg-white/10 h-1 rounded-lg" />
                     </div>

                     {availableVoices.length > 0 && isTtsEnabled && (
                        <div>
                           <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Voice</label>
                           <select value={selectedVoiceName} onChange={(e) => setSelectedVoiceName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-gray-200">
                              {availableVoices.map(v => (
                                 <option key={v.name} value={v.name} className="bg-black text-white">{getVoiceLabel(v.name)}</option>
                              ))}
                           </select>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* In-Auction Error Toast */}
         <AnimatePresence>
            {error && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-16 md:bottom-8 bg-red-500/20 border border-red-500/50 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-red-400 font-bold text-xs z-[130]">
                  <AlertCircle size={14} />
                  <span>{error}</span>
               </motion.div>
            )}
         </AnimatePresence>

         {/* End Auction Confirmation Dialog */}
         <ConfirmDialog
            isOpen={showEndConfirm}
            title="End Auction?"
            message="Are you sure you want to end this auction? All teams and final squads will be saved permanently."
            confirmLabel={isEnding ? 'Ending...' : 'End Auction'}
            cancelLabel="Cancel"
            isDestructive={true}
            onConfirm={async () => {
               setIsEnding(true);
               try {
                  await endAuction(id);
               } catch (err) {
                  setError('Failed to end auction.');
                  setTimeout(() => setError(''), 3000);
                  setIsEnding(false);
               }
            }}
            onCancel={() => setShowEndConfirm(false)}
         />
      </div>
   );
};

export default AuctionRoom;
