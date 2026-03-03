import { Response } from 'express';
import { Client } from '@notionhq/client';
import { AuthRequest } from '../middleware/auth.js';
import { createTicketSchema } from '@priceme/shared';
import { db } from '../utils/db.js';

// Client is created lazily per-request so env vars are guaranteed to be loaded
function getNotionClient() {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature Request',
  question: 'Question',
  other: 'Other',
};

export const submitTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      return res.status(503).json({
        status: 'error',
        message: 'Support is temporarily unavailable. Please try again later.',
      });
    }

    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const { subject, message, category } = parsed.data;

    // Fetch user details for context
    const result = await db`SELECT email FROM users WHERE id = ${req.userId}`;
    const rows = Array.isArray(result) ? result : result.rows || [];
    const userEmail = rows[0]?.email || req.userEmail || 'Unknown';

    await getNotionClient().pages.create({
      parent: { database_id: databaseId },
      properties: {
        Subject: {
          title: [{ text: { content: subject } }],
        },
        Message: {
          rich_text: [{ text: { content: message } }],
        },
        Category: {
          select: { name: CATEGORY_LABELS[category] ?? 'Other' },
        },
        'User Email': {
          email: userEmail,
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Your ticket has been submitted. We\'ll get back to you soon.',
    });
  } catch (error: any) {
    console.error('Support ticket error:', error?.body ?? error);
    return res.status(502).json({
      status: 'error',
      message: 'Failed to submit ticket. Please try again later.',
    });
  }
};
