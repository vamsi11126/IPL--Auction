import { IPL_PLAYERS } from '../src/data/players.js';

console.log('--- Starting Player Data Validation ---');

const errors = [];
const warnings = [];

const validRoles = new Set(['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']);
const validTypes = new Set(['Indian', 'Overseas']);
const validBasePrices = new Set([0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.5, 2]);

const seenIds = new Set();
const seenNames = new Set();

IPL_PLAYERS.forEach((p, idx) => {
  // ID check
  if (!p.id) errors.push(`[#${idx}] Missing ID`);
  else if (seenIds.has(p.id)) errors.push(`[#${idx}] Duplicate ID: ${p.id}`);
  seenIds.add(p.id);

  // Name check
  if (!p.name || typeof p.name !== 'string' || !p.name.trim()) errors.push(`[#${idx}] Invalid Name`);
  else if (seenNames.has(p.name.toLowerCase())) warnings.push(`Duplicate Name: ${p.name}`);
  seenNames.add(p.name.toLowerCase());

  // Role check
  if (!validRoles.has(p.role)) errors.push(`[#${idx}] Invalid Role: ${p.role} for ${p.name}`);

  // Type check
  if (!validTypes.has(p.type)) errors.push(`[#${idx}] Invalid Type: ${p.type} for ${p.name}`);

  // Base Price check
  if (typeof p.basePrice !== 'number' || isNaN(p.basePrice) || !validBasePrices.has(p.basePrice)) {
    errors.push(`[#${idx}] Invalid Base Price: ${p.basePrice} for ${p.name}`);
  }

  // Set check
  if (!p.set || typeof p.set !== 'string') errors.push(`[#${idx}] Missing Set for ${p.name}`);

  // Rating check
  if (typeof p.rating !== 'number' || isNaN(p.rating) || p.rating < 40 || p.rating > 100) {
    errors.push(`[#${idx}] Invalid Rating: ${p.rating} for ${p.name}`);
  }

  // Stats check
  if (!p.stats || typeof p.stats !== 'object') {
    errors.push(`[#${idx}] Missing Stats for ${p.name}`);
  }
});

console.log(`Total Players Validated: ${IPL_PLAYERS.length}`);
console.log(`Errors Found: ${errors.length}`);
console.log(`Warnings Found: ${warnings.length}`);

if (errors.length > 0) {
  console.error('Validation Errors:');
  errors.slice(0, 10).forEach(e => console.error(e));
  process.exit(1);
} else {
  console.log('✅ ALL PLAYERS PASSED VALIDATION WITH ZERO ERRORS!');
}
