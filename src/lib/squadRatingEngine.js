import { IPL_PLAYERS } from '../data/players.js';

/**
 * Multi-Factor Player Rating Calculator
 * Evaluates performance across roles, experience, efficiency, and domestic talent scouting.
 */
export function calculatePlayerRating(player) {
  if (!player) return 50;
  const { role, set = '', basePrice = 0.3, stats = {} } = player;

  // 1. Establish Tier Baseline (Contextual Talent Tier)
  let baseline = 58;
  if (set.includes('Icons')) {
    baseline = 86;
  } else if (set.includes('Marquee')) {
    baseline = 84;
  } else if (set.startsWith('BA1') || set.startsWith('AL1') || set.startsWith('WK1') || set.startsWith('FA1') || set.startsWith('SP1')) {
    baseline = 76;
  } else if (set.startsWith('BA2') || set.startsWith('AL2') || set.startsWith('WK2') || set.startsWith('FA2') || set.startsWith('SP2')) {
    baseline = 71;
  } else if (set.startsWith('UBA1') || set.startsWith('UAL1') || set.startsWith('UWK1') || set.startsWith('UFA1') || set.startsWith('USP1')) {
    baseline = 67;
  } else if (set.startsWith('UBA2') || set.startsWith('UAL2') || set.startsWith('UWK2') || set.startsWith('UFA2') || set.startsWith('USP2')) {
    baseline = 61;
  } else if (set.startsWith('ACC1')) {
    baseline = 60;
  } else {
    baseline = 56;
  }

  // Base price valuation proxy if uncapped in higher bracket
  if (basePrice >= 2.0 && baseline < 76) baseline = 76;
  else if (basePrice >= 1.5 && baseline < 74) baseline = 74;
  else if (basePrice >= 1.0 && baseline < 70) baseline = 70;

  // 2. Statistical Multi-Factor Modifiers (-10 to +10)
  let modifier = 0;
  const matches = Number(stats.matches) || 0;

  if (role === 'Batsman' || role === 'Batter') {
    const runs = Number(stats.runs) || 0;
    const avg = Number(stats.avg) || 0;
    const sr = Number(stats.sr) || 0;

    // Strike Rate modifier (T20 benchmark: 130)
    if (sr > 0) {
      if (sr >= 165) modifier += 4.5;
      else if (sr >= 150) modifier += 3.0;
      else if (sr >= 140) modifier += 1.5;
      else if (sr >= 130) modifier += 0.5;
      else if (sr < 115) modifier -= 2.5;
      else if (sr < 125) modifier -= 1.0;
    }

    // Average modifier (T20 benchmark: 26)
    if (avg > 0) {
      if (avg >= 40) modifier += 4.0;
      else if (avg >= 35) modifier += 2.5;
      else if (avg >= 30) modifier += 1.5;
      else if (avg < 20) modifier -= 2.0;
    }

    // Volume & Longevity modifier (if seasoned player)
    if (matches >= 15) {
      if (runs >= 5000) modifier += 3.5;
      else if (runs >= 3000) modifier += 2.5;
      else if (runs >= 1500) modifier += 1.5;
      else if (runs >= 500) modifier += 0.5;
    } else {
      // Debutant / Emerging domestic talent modifier
      if (sr >= 140 && avg >= 28) modifier += 2.0;
    }
  } else if (role === 'Bowler') {
    const wickets = Number(stats.wickets) || 0;
    const econ = Number(stats.econ) || 0;
    const avg = Number(stats.avg) || 0;

    // Economy modifier (T20 benchmark: 8.2)
    if (econ > 0) {
      if (econ <= 7.2) modifier += 4.5;
      else if (econ <= 7.8) modifier += 3.0;
      else if (econ <= 8.2) modifier += 1.0;
      else if (econ >= 9.5) modifier -= 3.0;
      else if (econ >= 9.0) modifier -= 1.5;
    }

    // Strike Average modifier (T20 benchmark: 26)
    if (avg > 0) {
      if (avg <= 20) modifier += 3.5;
      else if (avg <= 24) modifier += 2.0;
      else if (avg <= 28) modifier += 0.5;
      else if (avg >= 35) modifier -= 2.0;
    }

    // Volume & Longevity modifier
    if (matches >= 15) {
      if (wickets >= 170) modifier += 4.0;
      else if (wickets >= 120) modifier += 2.5;
      else if (wickets >= 70) modifier += 1.5;
      else if (wickets >= 30) modifier += 0.5;
    } else {
      // Debutant / Emerging domestic pacer modifier
      if (econ > 0 && econ <= 7.5) modifier += 2.5;
      if (wickets >= 5) modifier += 1.5;
    }
  } else if (role === 'All-Rounder') {
    const runs = Number(stats.runs) || 0;
    const sr = Number(stats.sr) || 0;
    const wickets = Number(stats.wickets) || 0;
    const econ = Number(stats.econ) || 0;

    // Batting contribution
    if (sr >= 155) modifier += 2.5;
    else if (sr >= 140) modifier += 1.5;
    if (runs >= 2000) modifier += 2.0;
    else if (runs >= 800) modifier += 1.0;

    // Bowling contribution
    if (econ > 0 && econ <= 7.8) modifier += 2.5;
    else if (econ > 0 && econ <= 8.4) modifier += 1.0;
    if (wickets >= 80) modifier += 2.0;
    else if (wickets >= 30) modifier += 1.0;

    // Dual-threat versatility bonus
    if (runs >= 500 && wickets >= 20) modifier += 1.5;
  } else if (role === 'Wicket-Keeper') {
    const runs = Number(stats.runs) || 0;
    const avg = Number(stats.avg) || 0;
    const sr = Number(stats.sr) || 0;

    // Glovework premium
    modifier += 1.5;

    // Batting impact
    if (sr >= 150) modifier += 3.0;
    else if (sr >= 135) modifier += 1.5;
    else if (sr < 115) modifier -= 2.0;

    if (avg >= 35) modifier += 2.5;
    else if (avg >= 28) modifier += 1.0;

    if (matches >= 15) {
      if (runs >= 3000) modifier += 2.5;
      else if (runs >= 1000) modifier += 1.0;
    }
  }

  // Elite individual icon caps & ceilings
  if (player.name === 'Virat Kohli' || player.name === 'Jasprit Bumrah') {
    return 94;
  }
  if (player.name === 'Heinrich Klaasen' || player.name === 'Suryakumar Yadav' || player.name === 'Rashid Khan') {
    return 91;
  }

  return Math.round(Math.min(94, Math.max(50, baseline + modifier)));
}

/**
 * Wise Squad Ranking Engine
 * Evaluates Playing XI power, squad balance & synergy, and bench depth.
 */
export function evaluateSquadStrength(squadInput = [], minPlayers = 18) {
  const squad = squadInput
    .map(p => {
      if (typeof p === 'string') {
        const found = IPL_PLAYERS.find(x => x.id === p);
        return found ? { ...found } : null;
      }
      if (p?.id) {
        const found = IPL_PLAYERS.find(x => x.id === p.id);
        return found ? { ...found, ...p } : p;
      }
      return null;
    })
    .filter(Boolean)
    .map(p => ({
      ...p,
      effectiveRating: p.rating || calculatePlayerRating(p)
    }));

  if (squad.length === 0) {
    return {
      overallScore: 0,
      playingXIRating: 0,
      balanceScore: 0,
      benchScore: 0,
      playingXI: [],
      bench: [],
      balanceTags: ['Empty Squad'],
      isDisqualified: true
    };
  }

  // Target Playing XI size (sprint modes adjust XI size accordingly)
  const targetXISize = Math.min(squad.length, minPlayers <= 5 ? 5 : minPlayers <= 11 ? 11 : 11);

  // 1. Optimal Playing XI Selection
  // Constraints: Max 4 Overseas (or proportional for sprint5), Min 1 WK, Min 3 Batters, Min 3 Bowlers
  const sorted = [...squad].sort((a, b) => b.effectiveRating - a.effectiveRating);

  const playingXI = [];
  const bench = [];
  let overseasCount = 0;
  const maxOverseasInXI = minPlayers <= 5 ? 2 : 4;

  const canAdd = (player) => {
    if (player.type === 'Overseas' && overseasCount >= maxOverseasInXI) return false;
    return true;
  };

  const addPlayer = (player) => {
    playingXI.push(player);
    if (player.type === 'Overseas') overseasCount++;
  };

  // Step A: Pick best Wicket-Keeper
  const bestWK = sorted.find(p => p.role === 'Wicket-Keeper' && canAdd(p));
  if (bestWK) addPlayer(bestWK);

  // Step B: Pick top Batters (at least 3 if full XI, or 1 for sprint5)
  const minBatters = minPlayers <= 5 ? 1 : 3;
  const batters = sorted.filter(p => (p.role === 'Batsman' || p.role === 'Batter') && !playingXI.includes(p));
  for (const b of batters) {
    if (playingXI.filter(p => p.role === 'Batsman' || p.role === 'Batter').length >= minBatters) break;
    if (canAdd(b)) addPlayer(b);
  }

  // Step C: Pick top Bowlers (at least 3 if full XI, or 1 for sprint5)
  const minBowlers = minPlayers <= 5 ? 1 : 3;
  const bowlers = sorted.filter(p => p.role === 'Bowler' && !playingXI.includes(p));
  for (const b of bowlers) {
    if (playingXI.filter(p => p.role === 'Bowler').length >= minBowlers) break;
    if (canAdd(b)) addPlayer(b);
  }

  // Step D: Fill remaining slots up to targetXISize with highest available ratings
  const remaining = sorted.filter(p => !playingXI.includes(p));
  for (const p of remaining) {
    if (playingXI.length >= targetXISize) break;
    if (canAdd(p)) addPlayer(p);
  }

  // Whatever is left goes to the bench
  sorted.forEach(p => {
    if (!playingXI.includes(p)) bench.push(p);
  });

  const playingXIRating = playingXI.length > 0 
    ? Number((playingXI.reduce((sum, p) => sum + p.effectiveRating, 0) / playingXI.length).toFixed(1))
    : 0;

  // 2. Balance & Synergy Score (0 to 100)
  let balanceScore = 0;
  const balanceTags = [];

  // A. Wicket-Keeper check
  const wkCount = squad.filter(p => p.role === 'Wicket-Keeper').length;
  if (wkCount === 0) {
    balanceTags.push('No Keeper!');
  } else {
    balanceScore += 25;
    if (wkCount >= 2) balanceScore += 5; // Backup keeper bonus
  }

  // B. Bowling Options
  const squadBowlers = squad.filter(p => p.role === 'Bowler').length;
  const squadAllRounders = squad.filter(p => p.role === 'All-Rounder').length;
  const bowlingOptions = squadBowlers + (squadAllRounders * 0.75);

  if (minPlayers <= 5) {
    if (bowlingOptions >= 2) balanceScore += 25;
    else balanceScore += 10;
  } else {
    if (bowlingOptions >= 6) {
      balanceScore += 25;
      balanceTags.push('Strong Bowling Depth');
    } else if (bowlingOptions >= 5) {
      balanceScore += 20;
    } else if (bowlingOptions >= 4) {
      balanceScore += 10;
      balanceTags.push('Thin Bowling');
    } else {
      balanceTags.push('Lacks 5 Bowlers');
    }
  }

  // C. Batting Depth
  const battingOptions = squad.filter(p => (
    p.role === 'Batsman' || 
    p.role === 'Batter' || 
    p.role === 'Wicket-Keeper' || 
    (p.role === 'All-Rounder' && (p.stats?.runs > 200 || p.stats?.sr > 130))
  )).length;

  if (minPlayers <= 5) {
    if (battingOptions >= 3) balanceScore += 25;
    else balanceScore += 10;
  } else {
    if (battingOptions >= 7) {
      balanceScore += 25;
      balanceTags.push('Deep Batting Lineup');
    } else if (battingOptions >= 5) {
      balanceScore += 20;
    } else {
      balanceTags.push('Shallow Batting');
    }
  }

  // D. Pace & Spin Balance
  const hasPace = squad.some(p => p.role === 'Bowler' && (p.set?.includes('FA') || (p.stats?.econ || 0) >= 7.8));
  const hasSpin = squad.some(p => p.role === 'Bowler' && (p.set?.includes('SP') || p.name?.includes('Chahal') || p.name?.includes('Kuldeep') || p.name?.includes('Rashid') || p.name?.includes('Noor')));
  if (hasPace && hasSpin) {
    balanceScore += 20;
  } else {
    balanceScore += 10;
    if (minPlayers > 5) balanceTags.push('Imbalanced Attack');
  }

  balanceScore = Math.min(100, Math.max(20, balanceScore));

  // 3. Bench Depth Score (0 to 100)
  let benchScore = 60;
  if (bench.length >= 4) {
    const top4Bench = bench.slice(0, 4);
    const avgBenchRating = top4Bench.reduce((sum, p) => sum + p.effectiveRating, 0) / 4;
    benchScore = Number(avgBenchRating.toFixed(1));
  } else if (bench.length > 0) {
    const avgBenchRating = bench.reduce((sum, p) => sum + p.effectiveRating, 0) / bench.length;
    benchScore = Number((avgBenchRating * (bench.length / 4) + 50 * ((4 - bench.length) / 4)).toFixed(1));
  } else {
    benchScore = 40;
  }

  // 4. Composite Overall Score
  // 65% Best XI + 20% Balance + 15% Bench
  const isDisqualified = squad.length < minPlayers;
  let overallScore = Number(((playingXIRating * 0.65) + (balanceScore * 0.20) + (benchScore * 0.15)).toFixed(1));

  if (isDisqualified) {
    overallScore = Number((overallScore * 0.85).toFixed(1));
  }

  return {
    overallScore,
    playingXIRating,
    balanceScore,
    benchScore,
    playerCount: squad.length,
    overseasCount: squad.filter(p => p.type === 'Overseas').length,
    balanceTags,
    isDisqualified,
    playingXI: playingXI.map(p => ({ id: p.id, name: p.name, role: p.role, rating: p.effectiveRating, type: p.type })),
    benchCount: bench.length
  };
}
