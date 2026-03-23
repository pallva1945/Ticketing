import { Router, Request, Response } from 'express';
import { pool } from './db';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const SYSTEM_INSTRUCTION = `
You are the Strategic Board Advisor to Luis Scola, CEO of Pallacanestro Varese.
**TONE:** Brutally honest, executive, brief. No fluff. No "Hello I can help you". Start directly with the insight or the risk.
**MANDATE:** Identify financial bleed, yield opportunities, pricing strategies, and risks to revenue targets.

You have persistent memory across sessions. When relevant past conversations are provided, use them to maintain continuity — reference prior analyses, track how metrics evolved, and avoid repeating yourself. If the user asked something similar before, acknowledge it and build on the previous answer.
`;

const EMBEDDING_MODEL = 'text-embedding-004';
const CHAT_MODEL = 'gemini-2.0-flash';
const EMBEDDING_DIM = 768;

async function initAiTables() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_memory (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        context_summary TEXT,
        embedding vector(${EMBEDDING_DIM}),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_memory_user ON chat_memory(user_email)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_memory_created ON chat_memory(created_at DESC)
    `);
    console.log('[AI] Chat memory tables initialized');
  } catch (err) {
    console.error('[AI] Failed to init tables:', err);
  } finally {
    client.release();
  }
}

initAiTables();

async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });
    return result.embeddings?.[0]?.values || null;
  } catch (err) {
    console.error('[AI] Embedding error:', err);
    return null;
  }
}

async function retrieveRelevantMemories(
  userEmail: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<{ user_message: string; ai_response: string; created_at: string }[]> {
  try {
    const embStr = `[${queryEmbedding.join(',')}]`;
    const result = await pool.query(
      `SELECT user_message, ai_response, created_at,
              1 - (embedding <=> $1::vector) as similarity
       FROM chat_memory
       WHERE user_email = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [embStr, userEmail, limit]
    );
    return result.rows.filter((r: any) => r.similarity > 0.3);
  } catch (err) {
    console.error('[AI] Memory retrieval error:', err);
    return [];
  }
}

async function getRecentConversations(
  userEmail: string,
  limit: number = 3
): Promise<{ user_message: string; ai_response: string; created_at: string }[]> {
  try {
    const result = await pool.query(
      `SELECT user_message, ai_response, created_at
       FROM chat_memory
       WHERE user_email = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userEmail, limit]
    );
    return result.rows;
  } catch (err) {
    console.error('[AI] Recent fetch error:', err);
    return [];
  }
}

async function storeMemory(
  userEmail: string,
  userMessage: string,
  aiResponse: string,
  contextSummary: string | null,
  embedding: number[] | null
) {
  try {
    const embStr = embedding ? `[${embedding.join(',')}]` : null;
    await pool.query(
      `INSERT INTO chat_memory (user_email, user_message, ai_response, context_summary, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)`,
      [userEmail, userMessage, aiResponse, contextSummary, embStr]
    );
  } catch (err) {
    console.error('[AI] Store memory error:', err);
  }
}

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, contextData, userEmail } = req.body;

    if (!message || !userEmail) {
      return res.status(400).json({ error: 'message and userEmail required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const queryEmbedding = await getEmbedding(message, apiKey);

    let relevantMemories: { user_message: string; ai_response: string; created_at: string }[] = [];
    let recentConversations: { user_message: string; ai_response: string; created_at: string }[] = [];

    if (queryEmbedding) {
      relevantMemories = await retrieveRelevantMemories(userEmail, queryEmbedding, 5);
    }
    recentConversations = await getRecentConversations(userEmail, 3);

    const allMemories = new Map<string, { user_message: string; ai_response: string; created_at: string }>();
    for (const m of recentConversations) {
      allMemories.set(m.created_at, m);
    }
    for (const m of relevantMemories) {
      allMemories.set(m.created_at, m);
    }

    const uniqueMemories = Array.from(allMemories.values())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let memoryContext = '';
    if (uniqueMemories.length > 0) {
      memoryContext = '\n\n=== CONVERSATION MEMORY (Past Sessions) ===\n';
      for (const m of uniqueMemories) {
        const date = new Date(m.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        memoryContext += `\n[${date}]\nUser: ${m.user_message.substring(0, 300)}\nAdvisor: ${m.ai_response.substring(0, 500)}\n`;
      }
      memoryContext += '\n=== END MEMORY ===\n';
    }

    const prompt = `
${SYSTEM_INSTRUCTION}
${memoryContext}

CURRENT DATA CONTEXT:
${contextData || 'No specific data context provided.'}

USER QUERY:
${message}
    `;

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
    });

    const aiResponse = response.text || "I processed the data but couldn't generate a specific insight.";

    storeMemory(userEmail, message, aiResponse, null, queryEmbedding).catch(() => {});

    return res.json({ response: aiResponse, memoriesUsed: uniqueMemories.length });
  } catch (error: any) {
    console.error('[AI] Chat error:', error);
    return res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

router.get('/memory/stats', async (req: Request, res: Response) => {
  try {
    const userEmail = req.query.email as string;
    if (!userEmail) return res.status(400).json({ error: 'email required' });

    const result = await pool.query(
      `SELECT COUNT(*) as total,
              MIN(created_at) as first_conversation,
              MAX(created_at) as last_conversation
       FROM chat_memory WHERE user_email = $1`,
      [userEmail]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get memory stats' });
  }
});

router.delete('/memory', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    await pool.query('DELETE FROM chat_memory WHERE user_email = $1', [email]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear memory' });
  }
});

export default router;
