import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

// Neon SQL client — uses the DATABASE_URL env var
const sql = neon(process.env.DATABASE_URL);

/* ─────────────────────────── Health ─────────────────────────── */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ─────────────────────────── AUCTIONS ───────────────────────── */

// GET /api/auctions/public — public lobby listing
app.get('/api/auctions/public', async (req, res) => {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const rows = await sql`
      SELECT id, host_name, status, auction_type, players, squad_limit, settings, created_at
      FROM auctions
      WHERE status IN ('waiting', 'active')
        AND is_public = true
        AND host_online = true
        AND created_at >= ${threeHoursAgo}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    res.json(rows);
  } catch (err) {
    console.error('[api] GET /auctions/public', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auctions/admin — admin list with counts
app.get('/api/auctions/admin', async (_req, res) => {
  try {
    const [counts] = await sql`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status != 'completed' THEN 1 END)::int AS active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed
      FROM auctions
    `;
    const auctions = await sql`
      SELECT id, host_name, status, auction_type, settings, created_at
      FROM auctions
      ORDER BY created_at DESC
      LIMIT 100
    `;
    res.json({
      auctions: auctions || [],
      totalCount: counts?.total || 0,
      activeCount: counts?.active || 0,
      completedCount: counts?.completed || 0,
    });
  } catch (err) {
    console.error('[api] GET /auctions/admin', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auctions/:id — fetch one auction record
app.get('/api/auctions/:id', async (req, res) => {
  try {
    const [row] = await sql`
      SELECT id, settings, status, auction_type, overseas_limit, squad_limit, created_at, server
      FROM auctions
      WHERE id = ${req.params.id}
    `;
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    console.error('[api] GET /auctions/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auctions?ids=a,b,c — fetch multiple auction records by IDs
app.get('/api/auctions', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);
    const rows = await sql`
      SELECT id, settings, status, auction_type, overseas_limit, squad_limit, created_at
      FROM auctions
      WHERE id = ANY(${ids})
    `;
    res.json(rows);
  } catch (err) {
    console.error('[api] GET /auctions', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auctions — insert a new auction (room creation)
app.post('/api/auctions', async (req, res) => {
  try {
    const {
      id, host_id, host_name, host_online = true, is_public = false,
      status = 'waiting', auction_type = 'mega', squad_limit = 25,
      overseas_limit = 8, players = [], settings = {}, server = 'primary',
      player_order = [], banned_players = []
    } = req.body;

    // Use INSERT not upsert — primary key collision = room code taken (code 23505)
    await sql`
      INSERT INTO auctions (
        id, host_id, host_name, host_online, is_public, status,
        auction_type, squad_limit, overseas_limit, players, settings,
        server, player_order, banned_players
      ) VALUES (
        ${id}, ${host_id}, ${host_name}, ${host_online}, ${is_public},
        ${status}, ${auction_type}, ${squad_limit}, ${overseas_limit},
        ${JSON.stringify(players)}, ${JSON.stringify(settings)},
        ${server}, ${JSON.stringify(player_order)}, ${JSON.stringify(banned_players)}
      )
    `;
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'ROOM_CODE_TAKEN', code: '23505' });
    }
    console.error('[api] POST /auctions', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auctions/:id — update auction fields
app.patch('/api/auctions/:id', async (req, res) => {
  try {
    const {
      status, host_online, is_public, players, settings,
      player_order, banned_players, server
    } = req.body;

    // Build dynamic SET clause only for provided fields
    const updates = [];
    const values = [];

    if (status !== undefined)        { updates.push(`status = $${updates.length + 2}`);        values.push(status); }
    if (host_online !== undefined)   { updates.push(`host_online = $${updates.length + 2}`);   values.push(host_online); }
    if (is_public !== undefined)     { updates.push(`is_public = $${updates.length + 2}`);     values.push(is_public); }
    if (players !== undefined)       { updates.push(`players = $${updates.length + 2}`);       values.push(JSON.stringify(players)); }
    if (settings !== undefined)      { updates.push(`settings = $${updates.length + 2}`);      values.push(JSON.stringify(settings)); }
    if (player_order !== undefined)  { updates.push(`player_order = $${updates.length + 2}`);  values.push(JSON.stringify(player_order)); }
    if (banned_players !== undefined){ updates.push(`banned_players = $${updates.length + 2}`);values.push(JSON.stringify(banned_players)); }
    if (server !== undefined)        { updates.push(`server = $${updates.length + 2}`);        values.push(server); }

    if (!updates.length) return res.json({ ok: true });

    updates.push(`updated_at = NOW()`);
    const query = `UPDATE auctions SET ${updates.join(', ')} WHERE id = $1`;
    await sql(query, [req.params.id, ...values]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] PATCH /auctions/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auctions/:id — delete auction
app.delete('/api/auctions/:id', async (req, res) => {
  try {
    await sql`DELETE FROM auctions WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] DELETE /auctions/:id', err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────── TEAMS ──────────────────────────── */

// GET /api/teams?auction_id=:id — get teams for an auction
app.get('/api/teams', async (req, res) => {
  try {
    const { auction_id, user_id } = req.query;
    if (!auction_id && !user_id) return res.json([]);

    let rows;
    if (auction_id && user_id) {
      rows = await sql`
        SELECT * FROM teams WHERE auction_id = ${auction_id} AND user_id = ${user_id}
      `;
    } else if (auction_id) {
      rows = await sql`SELECT * FROM teams WHERE auction_id = ${auction_id}`;
    } else {
      rows = await sql`
        SELECT id, auction_id, user_id, team_id, team_name, budget_remaining, spent, squad, created_at
        FROM teams
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
        LIMIT 20
      `;
    }
    res.json(rows);
  } catch (err) {
    console.error('[api] GET /teams', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teams/upsert — upsert one or many team rows
app.post('/api/teams/upsert', async (req, res) => {
  try {
    const teams = Array.isArray(req.body) ? req.body : [req.body];
    for (const t of teams) {
      await sql`
        INSERT INTO teams (id, auction_id, user_id, team_id, team_name, budget_remaining, spent, squad)
        VALUES (
          ${t.id}, ${t.auction_id}, ${t.user_id}, ${t.team_id},
          ${t.team_name}, ${t.budget_remaining ?? 120}, ${t.spent ?? 0},
          ${JSON.stringify(t.squad || [])}
        )
        ON CONFLICT (id) DO UPDATE SET
          team_id          = EXCLUDED.team_id,
          team_name        = EXCLUDED.team_name,
          budget_remaining = EXCLUDED.budget_remaining,
          spent            = EXCLUDED.spent,
          squad            = EXCLUDED.squad,
          updated_at       = NOW()
      `;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] POST /teams/upsert', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/teams/:id — delete a team row
app.delete('/api/teams/:id', async (req, res) => {
  try {
    await sql`DELETE FROM teams WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] DELETE /teams/:id', err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────── FEEDBACKS ──────────────────────── */

// GET /api/feedbacks — list all feedbacks (admin)
app.get('/api/feedbacks', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 500
    `;
    res.json(rows);
  } catch (err) {
    console.error('[api] GET /feedbacks', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedbacks — submit feedback
app.post('/api/feedbacks', async (req, res) => {
  try {
    const { user_id, message, rating, page, metadata } = req.body;
    const [row] = await sql`
      INSERT INTO feedbacks (user_id, message, rating, page, metadata)
      VALUES (${user_id}, ${message}, ${rating}, ${page}, ${JSON.stringify(metadata || {})})
      RETURNING id
    `;
    res.status(201).json({ id: row.id });
  } catch (err) {
    console.error('[api] POST /feedbacks', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/feedbacks/:id — delete feedback (admin)
app.delete('/api/feedbacks/:id', async (req, res) => {
  try {
    await sql`DELETE FROM feedbacks WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] DELETE /feedbacks/:id', err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────── Start ──────────────────────────── */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[api] Crick Auction API running on :${PORT}`));
