import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import { z } from 'zod';

export const maxDuration = 60;

// ─── Provider Configuration ─────────────────────────────────────────
const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'gemini';
const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS ?? '').split(',').map(k => k.trim()).filter(Boolean);
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
let geminiKeyIndex = 0;
function getNextGeminiKey(): string {
    if (GEMINI_API_KEYS.length === 0) throw new Error('No GEMINI_API_KEYS in .env');
    const key = GEMINI_API_KEYS[geminiKeyIndex % GEMINI_API_KEYS.length];
    geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    return key;
}
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b';

// ─── DATA SCHEMA (for system prompt context) ────────────────────────
const DATA_SCHEMA = `
TABLE: transactions
COLUMNS:
- transaction_id (VARCHAR)
- transaction_type (category: P2P, P2M, Bill Payment, Recharge, etc.)
- amount_inr (DOUBLE — transaction value in Indian Rupees)
- timestamp (TIMESTAMP)
- merchant_category (category: Food, Grocery, Shopping, Utilities, Entertainment, Healthcare, Education, Other)
- transaction_status (category: SUCCESS, FAILED, PENDING, REFUNDED)
- fraud_flag (INTEGER: 0 or 1)
- sender_age_group (category: 18-25, 26-35, 36-45, 46-55, 56+)
- receiver_age_group (same categories)
- sender_state (VARCHAR — Indian state names like Maharashtra, Karnataka, Tamil Nadu)
- sender_bank (VARCHAR — bank names like SBI, HDFC, ICICI, etc.)
- receiver_bank (VARCHAR — bank names)
- device_type (category: Smartphone, Feature Phone, Tablet, Desktop)
- network_type (category: 5G, 4G, 3G, WiFi)
- day_of_week (category: Monday, Tuesday, ... Sunday)
- hour_of_day (INTEGER 0-23)

TOTAL ROWS: ~50,000 UPI transactions from 2024
`;

// ─── Tool Definitions ───────────────────────────────────────────────
const tools = {
    analyze_transaction_status: {
        description: 'Distribution of transaction statuses (SUCCESS/FAILED/PENDING/REFUNDED) filtered by age group and state.',
        inputSchema: z.object({
            age_group: z.enum(['18-25', '26-35', '36-45', '46-55', '56+']).describe('Age bracket'),
            state: z.string().describe('Indian state name'),
        }),
    },
    compare_network_failures: {
        description: 'Compare failure rates between two network types.',
        inputSchema: z.object({
            primary_network: z.enum(['5G', '4G', '3G', 'WiFi']).describe('First network'),
            secondary_network: z.enum(['5G', '4G', '3G', 'WiFi']).describe('Second network'),
        }),
    },
    average_transaction_value: {
        description: 'Average transaction amount for a merchant category within an hour range.',
        inputSchema: z.object({
            category: z.enum(['Food', 'Grocery', 'Shopping', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Other']),
            start_hour: z.number().min(0).max(23).default(0),
            end_hour: z.number().min(0).max(23).default(23),
        }),
    },
    merchant_risk_analysis: {
        description: 'Top merchant categories by fraud-flagged transaction count.',
        inputSchema: z.object({
            limit: z.number().default(5),
        }),
    },
    hourly_volume_trend: {
        description: 'Transaction volume (count) for each hour of the day. Optionally filter by state or category.',
        inputSchema: z.object({
            state: z.string().optional().describe('Optional state filter'),
            category: z.string().optional().describe('Optional category filter'),
        }),
    },
    daily_pattern_analysis: {
        description: 'Transaction volume broken down by day of the week (Monday–Sunday).',
        inputSchema: z.object({
            status_filter: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'REFUNDED', 'ALL']).default('ALL'),
        }),
    },
    bank_performance: {
        description: 'Success vs failure count by sender bank. Shows top banks by volume.',
        inputSchema: z.object({
            limit: z.number().default(10).describe('Number of banks to show'),
        }),
    },
    geographic_distribution: {
        description: 'Transaction count by state. Shows geographic spread of UPI usage.',
        inputSchema: z.object({
            status_filter: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'REFUNDED', 'ALL']).default('ALL'),
            limit: z.number().default(10),
        }),
    },
    device_type_breakdown: {
        description: 'Share of transactions by device type (Smartphone, Feature Phone, Tablet, Desktop).',
        inputSchema: z.object({
            state: z.string().optional().describe('Optional state filter'),
        }),
    },
    revenue_by_category: {
        description: 'Total transaction value (sum of amount_inr) per merchant category.',
        inputSchema: z.object({
            age_group: z.enum(['18-25', '26-35', '36-45', '46-55', '56+', 'ALL']).default('ALL'),
        }),
    },
    transaction_type_split: {
        description: 'Distribution of transaction types (P2P, P2M, Bill Payment, Recharge, etc.).',
        inputSchema: z.object({
            state: z.string().optional().describe('Optional state filter'),
        }),
    },
    peak_usage_analysis: {
        description: 'Identify peak transaction hours with average amounts, grouped by hour.',
        inputSchema: z.object({
            category: z.string().optional(),
            state: z.string().optional(),
        }),
    },
};

// ─── System Prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are InsightsX — an advanced AI analytics assistant for a Unified Payments (UPI) dataset loaded in DuckDB. You have access to tools that query the data and generate visualizations.

## Your Data
${DATA_SCHEMA}

## How You Should Respond

1. **For data/analytical questions**: Call the appropriate tool to generate a visualization. You can call MULTIPLE tools if the question requires multiple perspectives. Always include reasoning text alongside tool calls.

2. **For explanatory/discussion questions**: Respond with rich, well-formatted text using:
   - **Bold** and *italics* for emphasis
   - Bullet lists and numbered lists for structured info
   - Tables (markdown) for comparisons
   - Headers (## and ###) for sections
   - > Blockquotes for key insights
   - Code blocks for any technical details

3. **For business strategy questions**: Combine data tool calls with strategic analysis text. Provide actionable recommendations with reasoning.

4. **Always**:
   - Extract parameters from natural language (e.g., "Maharashtra" → state, "morning" → hours 6-12)
   - Provide context and insight, not just raw data
   - If a question is ambiguous, make a reasonable assumption and state it
   - Use Indian context (₹, state names, UPI terminology)

## Parameter Extraction Hints
- Age mentions like "youth" or "young" → 18-25
- "Senior" or "elderly" → 56+
- "Morning" → hours 6-12, "Afternoon" → 12-17, "Evening" → 17-22, "Night" → 22-6
- State abbreviations: MH → Maharashtra, KA → Karnataka, TN → Tamil Nadu, etc.
- "Fraud", "risk", "suspicious" → merchant_risk_analysis
- "Trend", "over time", "hourly" → hourly_volume_trend
- "Weekly", "day of week" → daily_pattern_analysis
- "Bank", "which bank" → bank_performance
- "Region", "state-wise", "geography" → geographic_distribution
- "Phone", "device", "mobile" → device_type_breakdown
- "Revenue", "total amount", "₹" → revenue_by_category
- "UPI type", "P2P", "P2M" → transaction_type_split
- "Peak", "busiest" → peak_usage_analysis`;

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
        return new Response(
            JSON.stringify({ error: 'Ollama request failed', detail: error.message }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
