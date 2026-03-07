import { Client } from '@notionhq/client';

const PLAN_MRR: Record<string, number> = {
  free: 0,
  starter: 10.99,
  growth: 24.99,
  pro: 35.99,
};

export interface NotionUserPayload {
  name: string | null;
  email: string;
  plan: string;
  status: string;
  signupDate: string;  // ISO date string YYYY-MM-DD
  lastActive: string | null;
  products: number;
  sales: number;
}

function getToken(): string | null {
  return process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || null;
}

function getClient(): Client | null {
  const token = getToken();
  if (!token) return null;
  return new Client({ auth: token });
}

function buildProperties(user: NotionUserPayload) {
  return {
    'Name': { title: [{ text: { content: user.name || user.email } }] },
    'Email': { email: user.email },
    'Plan': { select: { name: user.plan } },
    'Status': { select: { name: user.status } },
    'MRR': { number: PLAN_MRR[user.plan] ?? 0 },
    'Signup Date': { date: { start: user.signupDate } },
    'Last Active': user.lastActive ? { date: { start: user.lastActive } } : { date: null },
    'Products': { number: user.products },
    'Sales': { number: user.sales },
  };
}

/** Query the Notion database directly via REST API (SDK v5 removed databases.query) */
async function queryByEmail(dbId: string, email: string): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: { property: 'Email', email: { equals: email } },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion query failed: ${res.status} ${body}`);
  }

  const data: any = await res.json();
  return data.results?.[0]?.id ?? null;
}

export async function upsertNotionUser(user: NotionUserPayload): Promise<void> {
  const notion = getClient();
  const dbId = process.env.NOTION_USERS_DB_ID;
  if (!notion || !dbId) return;

  try {
    const existingPageId = await queryByEmail(dbId, user.email);
    const properties = buildProperties(user);

    if (existingPageId) {
      await notion.pages.update({ page_id: existingPageId, properties });
    } else {
      await notion.pages.create({ parent: { database_id: dbId }, properties });
    }
  } catch (err: any) {
    console.error('[Notion] Failed to upsert user:', user.email, err.message);
  }
}
