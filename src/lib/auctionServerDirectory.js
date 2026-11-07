import {
  fetchAuction,
  insertAuction,
  upsertAuction,
} from './db';
import {
  getAuctionServer,
  getPreferredServer,
  normalizeServer,
} from './auctionServers';

const directoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1-minute in-memory cache

/** Read one auction directory row. Returns null when API is unavailable. */
export async function fetchAuctionRecord(roomId) {
  if (!roomId) return null;

  const cached = directoryCache.get(roomId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.record;
  }

  try {
    const data = await fetchAuction(roomId);
    if (data) {
      directoryCache.set(roomId, { record: data, timestamp: Date.now() });
    }
    return data || null;
  } catch (err) {
    console.warn('[directory] fetchAuctionRecord failed', err);
    return null;
  }
}

const LOOKUP_TIMEOUT_MS = 1500;

function withLookupTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(undefined), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Resolve which RTDB server a room belongs to.
 * Falls back to hint or preferred server if the API is slow/down.
 */
export async function resolveRoomServer(roomId, hint = null) {
  const hinted = normalizeServer(hint, null);
  const record = await withLookupTimeout(
    fetchAuctionRecord(roomId).catch(() => null),
    LOOKUP_TIMEOUT_MS,
  );
  if (record) return getAuctionServer(record);
  if (hinted) return hinted;
  return getPreferredServer();
}

/**
 * Insert a brand-new auction directory row.
 * Returns { error } — a 23505/409 error means the room code is taken.
 */
export async function insertAuctionWithServer(payload, server) {
  return insertAuction(payload, normalizeServer(server));
}

/**
 * Upsert an auction row (used for room-state flushes).
 * Returns { error }.
 */
export async function upsertAuctionWithServer(payload, server) {
  return upsertAuction(payload, normalizeServer(server));
}
