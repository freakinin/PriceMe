import { db } from '../utils/db.js';
import { upsertNotionUser } from '../services/notion.service.js';

async function fetchAndSync(rows: any[]): Promise<void> {
  for (const row of rows) {
    await upsertNotionUser({
      name: row.name,
      email: row.email,
      plan: row.plan,
      status: row.status,
      signupDate: new Date(row.created_at).toISOString().split('T')[0],
      lastActive: row.last_active_at
        ? new Date(row.last_active_at).toISOString().split('T')[0]
        : null,
      products: row.product_count,
      sales: row.sales_count,
    });
    // Notion rate limit: 3 req/s; each upsert = 2 requests (query + write)
    await new Promise((r) => setTimeout(r, 400));
  }
}

export class NotionSyncJob {
  static isConfigured(): boolean {
    return !!((process.env.NOTION_API_KEY || process.env.NOTION_TOKEN) && process.env.NOTION_USERS_DB_ID);
  }

  /** Sync a single user by ID — fire-and-forget from controllers */
  static async syncUser(userId: number): Promise<void> {
    if (!NotionSyncJob.isConfigured()) return;
    try {
      const result = await db`
        SELECT
          u.id, u.name, u.email, u.created_at, u.last_active_at,
          COALESCE(s.plan, 'free')    AS plan,
          COALESCE(s.status, 'active') AS status,
          COUNT(DISTINCT p.id)::int   AS product_count,
          COUNT(DISTINCT sa.id)::int  AS sales_count
        FROM users u
        LEFT JOIN subscriptions s ON s.user_id = u.id
        LEFT JOIN products p ON p.user_id = u.id
        LEFT JOIN sales sa ON sa.user_id = u.id
        WHERE u.id = ${userId}
        GROUP BY u.id, s.plan, s.status
      `;
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      if (rows.length > 0) await upsertNotionUser({
        name: rows[0].name,
        email: rows[0].email,
        plan: rows[0].plan,
        status: rows[0].status,
        signupDate: new Date(rows[0].created_at).toISOString().split('T')[0],
        lastActive: rows[0].last_active_at
          ? new Date(rows[0].last_active_at).toISOString().split('T')[0]
          : null,
        products: rows[0].product_count,
        sales: rows[0].sales_count,
      });
    } catch (err: any) {
      console.error('[NotionSync] syncUser failed for userId', userId, err.message);
    }
  }

  /** Full sync — runs on startup and daily */
  static async run(): Promise<void> {
    if (!NotionSyncJob.isConfigured()) {
      console.log('[NotionSync] Skipped — NOTION_API_KEY or NOTION_USERS_DB_ID not set');
      return;
    }

    console.log('[NotionSync] Starting full user sync...');
    try {
      const result = await db`
        SELECT
          u.id, u.name, u.email, u.created_at, u.last_active_at,
          COALESCE(s.plan, 'free')    AS plan,
          COALESCE(s.status, 'active') AS status,
          COUNT(DISTINCT p.id)::int   AS product_count,
          COUNT(DISTINCT sa.id)::int  AS sales_count
        FROM users u
        LEFT JOIN subscriptions s ON s.user_id = u.id
        LEFT JOIN products p ON p.user_id = u.id
        LEFT JOIN sales sa ON sa.user_id = u.id
        GROUP BY u.id, u.name, u.email, u.created_at, u.last_active_at, s.plan, s.status
        ORDER BY u.created_at DESC
      `;
      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      console.log(`[NotionSync] Syncing ${rows.length} users...`);
      await fetchAndSync(rows);
      console.log(`[NotionSync] Done. Synced ${rows.length} users.`);
    } catch (err: any) {
      console.error('[NotionSync] Full sync failed:', err.message);
    }
  }
}
