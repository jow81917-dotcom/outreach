/**
 * Neon Database Client
 *
 * Uses @neondatabase/serverless which sends SQL queries via HTTP
 * to Neon's serverless HTTP endpoint. This works in the browser.
 *
 * ⚠️ SECURITY NOTE:
 * The VITE_ prefix makes this env var available in the browser bundle.
 * This is acceptable for personal/local tools but NOT for public production apps.
 * For public apps, route queries through a serverless function (Vercel, Netlify, etc.)
 *
 * ℹ️ API NOTE:
 * @neondatabase/serverless v1.x only supports the tagged-template literal syntax:
 *   sql`SELECT * FROM table WHERE id = ${id}`
 * Parameterised call-style sql("query", [params]) is NOT supported in v1.
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    'VITE_NEON_DATABASE_URL is not set. Add it to your .env file.'
  );
}

export const sql = neon(DATABASE_URL);

// ─── PROSPECTS ─────────────────────────────────────────────────────────────

export async function getProspects({ status = 'all', search = '' } = {}) {
  // Build query based on filters — tagged template literals only
  if (status !== 'all' && search) {
    const like = `%${search}%`;
    return sql`
      SELECT p.*,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.prospect_id = p.id AND f.completed = false) AS pending_followups
      FROM prospects p
      WHERE p.status = ${status}
        AND (p.name ILIKE ${like} OR p.business_name ILIKE ${like} OR p.niche ILIKE ${like})
      ORDER BY p.created_at DESC
    `;
  }
  if (status !== 'all') {
    return sql`
      SELECT p.*,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.prospect_id = p.id AND f.completed = false) AS pending_followups
      FROM prospects p
      WHERE p.status = ${status}
      ORDER BY p.created_at DESC
    `;
  }
  if (search) {
    const like = `%${search}%`;
    return sql`
      SELECT p.*,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.prospect_id = p.id AND f.completed = false) AS pending_followups
      FROM prospects p
      WHERE p.name ILIKE ${like} OR p.business_name ILIKE ${like} OR p.niche ILIKE ${like}
      ORDER BY p.created_at DESC
    `;
  }
  return sql`
    SELECT p.*,
      (SELECT COUNT(*) FROM follow_ups f WHERE f.prospect_id = p.id AND f.completed = false) AS pending_followups
    FROM prospects p
    ORDER BY p.created_at DESC
  `;
}

export async function getProspectById(id) {
  const rows = await sql`SELECT * FROM prospects WHERE id = ${id}`;
  return rows[0] || null;
}

export async function createProspect(data) {
  const rows = await sql`
    INSERT INTO prospects
      (name, business_name, niche, contact_method, contact_handle, profile_url, status, notes, date_added)
    VALUES (
      ${data.name},
      ${data.business_name || null},
      ${data.niche || null},
      ${data.contact_method || null},
      ${data.contact_handle || null},
      ${data.profile_url || null},
      ${data.status || 'not_contacted'},
      ${data.notes || null},
      CURRENT_DATE
    )
    RETURNING *
  `;
  return rows[0];
}

export async function updateProspect(id, data) {
  const rows = await sql`
    UPDATE prospects SET
      name = ${data.name},
      business_name = ${data.business_name || null},
      niche = ${data.niche || null},
      contact_method = ${data.contact_method || null},
      contact_handle = ${data.contact_handle || null},
      profile_url = ${data.profile_url || null},
      status = ${data.status || 'not_contacted'},
      notes = ${data.notes || null},
      first_contacted_at = ${data.first_contacted_at || null},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteProspect(id) {
  await sql`DELETE FROM prospects WHERE id = ${id}`;
}

// ─── ACTIVITIES ────────────────────────────────────────────────────────────

export async function getActivities(prospectId = null, limit = 50) {
  if (prospectId) {
    return sql`
      SELECT a.*, p.name as prospect_name, p.business_name
      FROM outreach_activities a
      JOIN prospects p ON p.id = a.prospect_id
      WHERE a.prospect_id = ${prospectId}
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;
  }
  return sql`
    SELECT a.*, p.name as prospect_name, p.business_name
    FROM outreach_activities a
    JOIN prospects p ON p.id = a.prospect_id
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
}

export async function createActivity(data) {
  const rows = await sql`
    INSERT INTO outreach_activities (prospect_id, activity_type, content)
    VALUES (${data.prospect_id}, ${data.activity_type}, ${data.content || null})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteActivity(id) {
  await sql`DELETE FROM outreach_activities WHERE id = ${id}`;
}

// ─── FOLLOW-UPS ───────────────────────────────────────────────────────────

export async function getFollowUps(prospectId = null) {
  if (prospectId) {
    return sql`
      SELECT f.*, p.name as prospect_name, p.business_name, p.status as prospect_status
      FROM follow_ups f
      JOIN prospects p ON p.id = f.prospect_id
      WHERE f.prospect_id = ${prospectId}
      ORDER BY f.due_at ASC
    `;
  }
  return sql`
    SELECT f.*, p.name as prospect_name, p.business_name, p.status as prospect_status
    FROM follow_ups f
    JOIN prospects p ON p.id = f.prospect_id
    ORDER BY f.due_at ASC
  `;
}

export async function createFollowUp(data) {
  const rows = await sql`
    INSERT INTO follow_ups (prospect_id, due_at, note)
    VALUES (${data.prospect_id}, ${data.due_at}, ${data.note || null})
    RETURNING *
  `;
  return rows[0];
}

export async function completeFollowUp(id) {
  const rows = await sql`
    UPDATE follow_ups SET completed = true, completed_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return rows[0];
}

export async function rescheduleFollowUp(id, newDueAt) {
  const rows = await sql`
    UPDATE follow_ups SET due_at = ${newDueAt}, completed = false, completed_at = NULL WHERE id = ${id} RETURNING *
  `;
  return rows[0];
}

export async function deleteFollowUp(id) {
  await sql`DELETE FROM follow_ups WHERE id = ${id}`;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────

export async function getDashboardStats() {
  const statsRows = await sql`
    SELECT
      COUNT(*)::int AS total_prospects,
      COUNT(*) FILTER (WHERE status != 'not_contacted')::int AS contacted,
      COUNT(*) FILTER (WHERE status = 'replied')::int AS replies,
      COUNT(*) FILTER (WHERE status = 'interested')::int AS interested,
      COUNT(*) FILTER (WHERE status = 'client')::int AS clients_won
    FROM prospects
  `;
  const stats = statsRows[0];

  const fuRows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE due_at::date = CURRENT_DATE AND completed = false)::int AS due_today,
      COUNT(*) FILTER (WHERE due_at::date < CURRENT_DATE AND completed = false)::int AS overdue
    FROM follow_ups
  `;
  const followUpStats = fuRows[0];

  const chartData = await sql`
    SELECT
      DATE(created_at) AS day,
      COUNT(*)::int AS count
    FROM outreach_activities
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `;

  return {
    ...stats,
    ...followUpStats,
    chartData,
  };
}
