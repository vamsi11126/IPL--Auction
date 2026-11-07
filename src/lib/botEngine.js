import { IPL_PLAYERS } from '../data/players.js';
import { TEAMS } from '../data/teams.js';
import { countOverseas, isOverseasPlayer, toFiniteNumber } from './auctionDisplay.js';

/**
 * Player Set → Tier Multipliers
 * Controls how aggressively bots value players from each set.
 * Higher = more willing to pay a premium.
 */
const SET_TIER = {
  'Marquee Set 1':       { base: 2.4, max: 5.5 },
  'Marquee Set 2':       { base: 2.2, max: 4.8 },
  'Marquee Icons Set 1': { base: 2.5, max: 6.0 },
  'Marquee Icons Set 2': { base: 2.3, max: 5.2 },
  'BA1':                 { base: 1.4, max: 2.8 },
  'AL1':                 { base: 1.5, max: 3.2 },
  'WK1':                 { base: 1.4, max: 3.0 },
  'FA1':                 { base: 1.5, max: 3.2 },
  'SP1':                 { base: 1.3, max: 2.7 },
  'UBA1':                { base: 0.9, max: 1.8 },
  'UAL1':                { base: 1.0, max: 2.0 },
  'UWK1':                { base: 0.9, max: 1.8 },
  'UFA1':                { base: 0.9, max: 2.0 },
  'USP1':                { base: 0.8, max: 1.6 },
  'BA2':                 { base: 0.8, max: 1.6 },
  'AL2':                 { base: 0.8, max: 1.7 },
  'WK2':                 { base: 0.8, max: 1.5 },
  'FA2':                 { base: 0.8, max: 1.6 },
  'SP2':                 { base: 0.7, max: 1.4 },
  'UBA2':                { base: 0.6, max: 1.2 },
  'UAL2':                { base: 0.6, max: 1.2 },
  'UWK2':                { base: 0.6, max: 1.2 },
  'UFA2':                { base: 0.6, max: 1.2 },
  'USP2':                { base: 0.5, max: 1.1 },
  'ACC1':                { base: 0.5, max: 1.0 },
  'ACC2':                { base: 0.4, max: 0.9 },
  'Set 1':               { base: 1.5, max: 3.0 },
  'Set 2':               { base: 1.2, max: 2.2 },
  'Set 3':               { base: 1.0, max: 1.7 },
  'Set 4':               { base: 0.8, max: 1.4 },
};

/**
 * Team Personality Preferences
 * Each team has unique role affinities that boost their max willingness for certain player types.
 * Values are multipliers applied on top of the tier valuation.
 */
const TEAM_PREFERENCES = {
  CSK: {
    roles: { 'All-Rounder': 1.40, 'Bowler': 1.25 },
    sets: { 'Marquee Set 1': 1.20, 'Marquee Icons Set 1': 1.25, 'AL1': 1.20 },
    personality: 'conservative',
  },
  MI: {
    roles: { 'Bowler': 1.35, 'Batsman': 1.20, 'Batter': 1.20 },
    sets: { 'Marquee Set 1': 1.30, 'Marquee Icons Set 1': 1.35, 'FA1': 1.20 },
    personality: 'aggressive',
  },
  RCB: {
    roles: { 'Batsman': 1.45, 'Batter': 1.45, 'All-Rounder': 1.20 },
    sets: { 'Marquee Set 1': 1.35, 'Marquee Icons Set 1': 1.40, 'BA1': 1.25, 'AL1': 1.20 },
    personality: 'aggressive',
  },
  KKR: {
    roles: { 'Bowler': 1.30, 'All-Rounder': 1.25 },
    sets: { 'Marquee Icons Set 2': 1.25, 'SP1': 1.25, 'AL1': 1.20 },
    personality: 'balanced',
  },
  DC: {
    roles: { 'Bowler': 1.30, 'Wicket-Keeper': 1.30, 'Wicketkeeper': 1.30 },
    sets: { 'UFA1': 1.20, 'UBA1': 1.15, 'WK1': 1.20 },
    personality: 'value',
  },
  PBKS: {
    roles: { 'Batsman': 1.25, 'Batter': 1.25, 'All-Rounder': 1.20, 'Wicket-Keeper': 1.20, 'Wicketkeeper': 1.20 },
    sets: { 'Marquee Set 1': 1.30, 'UBA1': 1.30, 'UAL1': 1.25 },
    personality: 'value',
  },
  RR: {
    roles: { 'All-Rounder': 1.35, 'Bowler': 1.20 },
    sets: { 'UBA1': 1.30, 'UAL1': 1.25, 'UFA1': 1.20, 'FA1': 1.20 },
    personality: 'value',
  },
  SRH: {
    roles: { 'Bowler': 1.40, 'Batsman': 1.25, 'Batter': 1.25 },
    sets: { 'FA1': 1.25, 'Marquee Set 1': 1.20, 'BA1': 1.20 },
    personality: 'balanced',
  },
  GT: {
    roles: { 'All-Rounder': 1.30, 'Bowler': 1.20 },
    sets: { 'FA1': 1.20, 'SP1': 1.20 },
    personality: 'conservative',
  },
  LSG: {
    roles: { 'Wicket-Keeper': 1.35, 'Wicketkeeper': 1.35, 'Batsman': 1.20, 'Batter': 1.20 },
    sets: { 'WK1': 1.25, 'Marquee Set 1': 1.25 },
    personality: 'balanced',
  },
};

/**
 * Computes a bot's max valuation for a player.
 * Returns a value in Cr that varies per team, per player, and per auction run.
 */
function computeBotValuation({ player, botTeam, squadLimit, budgetRemaining, initialBudget }) {
  const basePrice = toFiniteNumber(player.basePrice, 0.30);
  const set = player.set || 'Set 4';
  const teamId = botTeam.teamId;

  // 1. Set tier drives the baseline
  const tier = SET_TIER[set] || { base: 0.7, max: 1.1 };

  // 2. Team personality multiplier (role + set affinity)
  const prefs = TEAM_PREFERENCES[teamId] || {};
  let personalityMult = 1.0;
  if (prefs.roles && prefs.roles[player.role]) {
    personalityMult *= prefs.roles[player.role];
  }
  if (prefs.sets && prefs.sets[set]) {
    personalityMult *= prefs.sets[set];
  }

  // 3. Per-bot random willingness (simulates scouting reports / mood)
  //    Each bot rolls a number per player that varies how keen they are this time
  const willingnessFactor = tier.base + Math.random() * (tier.max - tier.base);

  // 4. Budget pressure factor — bots spend slightly more aggressively
  //    as the auction progresses (e.g., "must complete squad")
  const budgetUsed = 1 - (budgetRemaining / (initialBudget || 120));
  const urgencyBoost = 1.0 + budgetUsed * 0.25; // up to +25% late in auction

  // 5. Squad completion pressure — boost if squad is almost full and slots remain
  const slotsLeft = squadLimit - (botTeam.squad?.length || 0);
  const squadUrgency = slotsLeft <= 3 ? 1.15 : 1.0;

  // 6. Final max valuation
  let maxVal = basePrice * willingnessFactor * personalityMult * urgencyBoost * squadUrgency;

  // Personality cap overrides
  if (prefs.personality === 'aggressive') {
    maxVal = Math.min(maxVal, budgetRemaining * 0.40); // can spend up to 40% of remaining on one player
  } else if (prefs.personality === 'conservative') {
    maxVal = Math.min(maxVal, budgetRemaining * 0.25);
  } else if (prefs.personality === 'value') {
    maxVal = Math.min(maxVal, budgetRemaining * 0.30);
  } else {
    maxVal = Math.min(maxVal, budgetRemaining * 0.32);
  }

  // Hard floor: never value below base price
  maxVal = Math.max(basePrice, maxVal);

  return parseFloat(maxVal.toFixed(2));
}

/**
 * Evaluates whether a Bot Team should place a bid on the current auction player.
 *
 * @param {Object} params
 * @param {Object} params.player - Current IPL player object
 * @param {number} params.currentBid - Current live bid amount in Cr
 * @param {string} params.highBidderId - User ID of current highest bidder
 * @param {Object} params.botTeam - Team state for this bot (budgetRemaining, squad)
 * @param {number} params.squadLimit - Room squad size limit (e.g. 25, 11, 5)
 * @param {number} params.overseasLimit - Overseas quota (e.g. 8, 4, 2)
 * @param {number} params.initialBudget - Starting budget for the auction mode
 * @returns {Object|null} Bid decision object if bot should bid, or null
 */
export function evaluateBotBid({
  player,
  currentBid,
  highBidderId,
  botTeam,
  squadLimit = 25,
  overseasLimit = 8,
  initialBudget = 120.0,
}) {
  if (!player || !botTeam) return null;

  const botUserId = botTeam.userId;
  const teamId = botTeam.teamId;

  // 1. Don't outbid yourself
  if (highBidderId === botUserId) return null;

  // 2. Squad size limit check
  const currentSquad = botTeam.squad || [];
  if (currentSquad.length >= squadLimit) return null;

  // 3. Overseas limit check
  const isOverseas = isOverseasPlayer(player);
  if (isOverseas) {
    const currentOverseasCount = countOverseas(currentSquad, IPL_PLAYERS);
    if (currentOverseasCount >= overseasLimit) return null;
  }

  // 4. Role Balance Check — soft caps to avoid over-stacking one role
  const slotsRemaining = squadLimit - currentSquad.length;
  const currentRoleCount = currentSquad.reduce((acc, s) => {
    const pInfo = IPL_PLAYERS.find(p => p.id === (typeof s === 'string' ? s : s.id));
    return pInfo && pInfo.role === player.role ? acc + 1 : acc;
  }, 0);
  const maxPerRole = squadLimit <= 5 ? 3 : squadLimit <= 11 ? 5 : 9;
  if (currentRoleCount >= maxPerRole && slotsRemaining > 1) return null;

  // 5. Calculate the next incremental bid amount
  const cBid = toFiniteNumber(currentBid, 0);
  const increment = cBid < 5 ? 0.20 : 0.25;
  const nextBid = cBid === 0 ? toFiniteNumber(player.basePrice, 0.30) : parseFloat((cBid + increment).toFixed(2));

  // 6. Budget check
  const budgetRemaining = botTeam.budgetRemaining ?? initialBudget;
  if (budgetRemaining < nextBid) return null;

  // Reserve budget safety: ensure enough average budget for remaining slots
  const remainingAfterBid = budgetRemaining - nextBid;
  if (slotsRemaining > 1 && (remainingAfterBid / (slotsRemaining - 1)) < 0.30) {
    return null; // protect purse for remaining squad slots
  }

  // 7. Compute this bot's max valuation for this player (varies per team + per run)
  const maxValuation = computeBotValuation({
    player,
    botTeam,
    squadLimit,
    budgetRemaining,
    initialBudget,
  });

  // 8. Bidding decision — only bid if next bid is within valuation
  if (nextBid > maxValuation) return null;

  // 9. Graduated willingness — as price climbs toward max, bot gets progressively
  //    less likely to bid (simulates hesitation / second thoughts mid-auction)
  const priceRatio = nextBid / maxValuation; // 0 = cheap, 1 = at max
  const baseBidChance = priceRatio < 0.50 ? 0.95   // well below max → almost always bid
    : priceRatio < 0.70 ? 0.82                      // mid-range → usually bid
    : priceRatio < 0.85 ? 0.65                      // getting pricey → sometimes drop
    : 0.40;                                          // near ceiling → coin-flip drop-off

  if (Math.random() > baseBidChance) return null;

  return {
    shouldBid: true,
    botUserId,
    teamId,
    nextBid,
    maxValuation,
  };
}
