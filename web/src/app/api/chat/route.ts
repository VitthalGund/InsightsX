import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import { z } from 'zod';

export const maxDuration = 60;

// ─── Provider Configuration ─────────────────────────────────────────

const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'gemini';

// Gemini: comma-separated API keys with round-robin rotation
const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS ?? '')
    .split(',').map(k => k.trim()).filter(Boolean);
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
let geminiKeyIndex = 0;

function getNextGeminiKey(): string {
    if (GEMINI_API_KEYS.length === 0) throw new Error('No GEMINI_API_KEYS in .env');
    const key = GEMINI_API_KEYS[geminiKeyIndex % GEMINI_API_KEYS.length];
    geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    return key;
}

// Ollama: local server
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b';

// ─── Tool Definitions (AI SDK v5: inputSchema) ─────────────────────

const tools = {
    compare_network_failures: {
        description:
            'ALWAYS use this tool when the user asks to compare failure rates, drop-offs, or errors across different network types (5G, 4G, 3G, WiFi). Extract both network names from the query.',
        inputSchema: z.object({
            primary_network: z.enum(['5G', '4G', '3G', 'WiFi']).describe('First network to compare'),
            secondary_network: z.enum(['5G', '4G', '3G', 'WiFi']).describe('Second network to compare'),
        }),
    },
    analyze_transaction_status: {
        description:
            'ALWAYS use this tool when the user asks about transaction statuses, distributions, or breakdowns for a demographic. Extract the age group and state/region from the query. The state parameter is the Indian state name.',
        inputSchema: z.object({
            age_group: z.enum(['18-25', '26-35', '36-45', '46-55', '56+']).describe('Age bracket of the demographic'),
            state: z.string().describe('Indian state name like Maharashtra, Karnataka, Tamil Nadu, etc.'),
        }),
    },
    average_transaction_value: {
        description:
            'ALWAYS use this tool when the user asks about average transaction values, spending patterns, or amounts for a merchant category within a time range. Extract category and hour range.',
        inputSchema: z.object({
            category: z.enum(['Food', 'Grocery', 'Shopping', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Other']).describe('Merchant category'),
            start_hour: z.number().min(0).max(23).describe('Start hour (0-23)'),
            end_hour: z.number().min(0).max(23).describe('End hour (0-23)'),
        }),
    },
    merchant_risk_analysis: {
        description:
            'ALWAYS use this tool when the user asks about fraud, risk, suspicious transactions, or anomalous merchant categories. Returns top flagged categories.',
        inputSchema: z.object({
            limit: z.number().default(5).describe('Number of top categories to return'),
        }),
    },
};

// ─── System Prompt ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a STRICT deterministic AI semantic router for a financial OLAP data engine.

RULES:
1. You MUST ALWAYS call exactly ONE tool for every user query. NEVER refuse or say you cannot help.
2. Extract ALL parameters from the user's natural language query and map them to the closest matching tool.
3. You will NOT write SQL. You will NOT explain what you cannot do. You will ONLY call a tool.
4. If a user mentions an age group like "18-25", map it to the age_group parameter.
5. If a user mentions a location/state/region like "Maharashtra", map it to the state parameter.
6. If a user mentions networks like "4G vs 5G", map to compare_network_failures.
7. If a user asks about fraud/risk/flags, use merchant_risk_analysis.
8. If a user asks about spending/amounts/values for a category, use average_transaction_value.
9. Default hour range is 0-23 if not specified. Default limit is 5 if not specified.`;

// ─── Request Handler ────────────────────────────────────────────────

export async function POST(req: Request) {
    const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();
    const messages = await convertToModelMessages(uiMessages);

    if (LLM_PROVIDER === 'ollama') {
        return handleOllama(messages);
    }
    return handleGemini(messages);
}

async function handleGemini(messages: Awaited<ReturnType<typeof convertToModelMessages>>) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
        const apiKey = getNextGeminiKey();
        try {
            const google = createGoogleGenerativeAI({ apiKey });
            const result = streamText({
                model: google(GEMINI_MODEL),
                system: SYSTEM_PROMPT,
                messages,
                tools,
            });
            return result.toUIMessageStreamResponse();
        } catch (err: unknown) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(`[gemini] Key ${attempt + 1}/${GEMINI_API_KEYS.length} failed: ${lastError.message}`);
        }
    }

    return new Response(
        JSON.stringify({ error: 'All Gemini keys exhausted', detail: lastError?.message }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
}

async function handleOllama(messages: Awaited<ReturnType<typeof convertToModelMessages>>) {
    try {
        const ollama = createOllama({ baseURL: OLLAMA_BASE_URL });
        const result = streamText({
            model: ollama(OLLAMA_MODEL),
            system: SYSTEM_PROMPT,
            messages,
            tools,
        });
        return result.toUIMessageStreamResponse();
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[ollama] Error: ${error.message}`);
        return new Response(
            JSON.stringify({ error: 'Ollama request failed', detail: error.message }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
