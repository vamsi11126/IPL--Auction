/**
 * db.js — Frontend data layer
 *
 * All PostgreSQL queries now go through the Crick Auction backend API
 * (which connects to Neon). Supabase is kept only for Realtime Broadcast
 * channels (hotspot/LAN mode in localAuctionEngine.js).
 *
 * Drop-in replacement for the previous direct supabase.from(...) calls.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `API error ${res.status}`);
    err.code = body.code || String(res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/* ══════════════════════════════════════════════════════════════
   AUCTIONS
   ══════════════════════════════════════════════════════════════ */

/** Fetch a single auction record (for server routing + room join). */
export async function fetchAuction(id) {
  if (!id) return null;
  try {
    return await apiFetch(`/api/auctions/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/** Fetch multiple auctions by ID array (history page). */
export async function fetchAuctions(ids = []) {
  if (!ids.length) return [];
  return apiFetch(`/api/auctions?ids=${ids.map(encodeURIComponent).join(',')}`);
}

/** Fetch public lobbies for the landing page. */
export async function fetchPublicLobbies() {
  return apiFetch('/api/auctions/public');
}

/** Fetch admin auctions listing with total/active/completed counts. */
export async function fetchAdminAuctions() {
  return apiFetch('/api/auctions/admin');
}

/**
 * Insert a brand-new auction row (room creation).
 * Returns { error: null } on success.
 * Returns { error: { code: '23505' } } if the room code is already taken.
 */
export async function insertAuction(payload, server = 'primary') {
  try {
    await apiFetch('/api/auctions', {
      method: 'POST',
      body: JSON.stringify({ ...payload, server }),
    });
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Upsert an auction row (room-state flush, status updates).
 * Returns { error: null } on success.
 */
export async function upsertAuction(payload, server) {
  try {
    // Try PATCH first (room already exists in most flush cases)
    const { id, ...rest } = payload;
    await apiFetch(`/api/auctions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(server ? { ...rest, server } : rest),
    });
    return { error: null };
  } catch (err) {
    // If not found, fall back to POST (insert)
    if (err.status === 404) {
      return insertAuction(payload, server);
    }
    return { error: err };
  }
}

/** Update specific fields on an auction row. */
export async function updateAuction(id, fields) {
  try {
    await apiFetch(`/api/auctions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/** Delete an auction row. */
export async function deleteAuction(id) {
  try {
    await apiFetch(`/api/auctions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/* ══════════════════════════════════════════════════════════════
   TEAMS
   ══════════════════════════════════════════════════════════════ */

/** Get all teams for an auction (summary page). */
export async function fetchTeamsByAuction(auctionId) {
  if (!auctionId) return [];
  return apiFetch(`/api/teams?auction_id=${encodeURIComponent(auctionId)}`);
}

/** Get a user's team history (landing page history section). */
export async function fetchTeamsByUser(userId) {
  if (!userId) return [];
  return apiFetch(`/api/teams?user_id=${encodeURIComponent(userId)}`);
}

/** Upsert one or multiple team rows. */
export async function upsertTeams(teams) {
  const payload = Array.isArray(teams) ? teams : [teams];
  if (!payload.length) return { error: null };
  try {
    await apiFetch('/api/teams/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/** Delete a team row (user deletes their history). */
export async function deleteTeam(id) {
  try {
    await apiFetch(`/api/teams/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

/* ══════════════════════════════════════════════════════════════
   FEEDBACKS
   ══════════════════════════════════════════════════════════════ */

/** Submit user feedback. */
export async function submitFeedback(payload) {
  try {
    return await apiFetch('/api/feedbacks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { error: err };
  }
}

/** List all feedbacks (admin panel). */
export async function fetchFeedbacks() {
  return apiFetch('/api/feedbacks');
}

/** Delete a feedback entry (admin). */
export async function deleteFeedback(id) {
  try {
    await apiFetch(`/api/feedbacks/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { error: null };
  } catch (err) {
    return { error: err };
  }
}
