import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

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

## CRITICAL RULES

### 1. Always Explain
- **EVERY tool call MUST be accompanied by explanatory text** — never return a tool call without context
- Before calling a tool, explain WHAT you're about to analyze and WHY
- After tool results, provide insight: what the data means, key takeaways, and actionable recommendations
- Use **bold**, *italics*, bullet points, numbered lists, and > blockquotes for emphasis

### 2. Conversation Context
- You have FULL access to the entire conversation history
- Reference previous messages, earlier charts, and prior analysis when relevant
- Build on previous insights — don't repeat the same analysis
- If the user asks a follow-up, connect it to what was discussed before
- Example: "Based on the earlier analysis showing 95% success rates in Maharashtra..."

### 3. Architectural & Flow Diagrams
When discussing systems, processes, flows, or architecture, use **mermaid** code blocks.
CRITICAL: ONLY use standard mermaid syntax. NEVER use ascii art, ASCII lines like \`|\` or \`*\`, or invalid operators like \`>>>\`. Use \`-->\` for connections.

Example of VALID syntax:
\`\`\`mermaid
graph TD
    A[User Query] -->|"Sends to"| B[LLM Router]
    B -->|Routes| C{Tool Selection}
    C -->|"Data Question"| D[DuckDB Query]
    C -->|"Flow Question"| E[Mermaid Diagram]
\`\`\`

Supported mermaid diagram types:
- **flowchart/graph** — for process flows, decision trees, system architecture
- **sequenceDiagram** — for interaction flows, API call sequences
- **classDiagram** — for data models, entity relationships
- **stateDiagram-v2** — for state machines, status transitions
- **pie** — for simple distributions (use tool call for interactive ones)
- **gantt** — for timelines, project schedules
- **erDiagram** — for database schemas, entity relationships

Use mermaid diagrams when the user asks about:
- How the system works, architecture, or data flow
- Transaction processing pipelines
- UPI payment flow / settlement flow
- Decision trees for fraud detection
- State transitions (transaction statuses)
- Any "how does X work" or "explain the flow" type questions

### 4. Rich Formatting
Structure responses with:
- **## Headers** for major sections
- **### Sub-headers** for sub-topics
- **Bold** for key metrics and important terms
- *Italics* for context and caveats
- > Blockquotes for key insights and takeaways
- \`code\` for technical terms, field names, SQL concepts
- Tables for structured comparisons
- Numbered lists for step-by-step explanations
- Bullet lists for feature lists and key points

### 5. Tool Usage
- Call tools when data visualization is needed
- You can call MULTIPLE tools for comprehensive analysis
- Always provide text explanation alongside tool calls
- For business questions: combine data + strategic text + diagrams
- Extract parameters from natural language (e.g., "Maharashtra" → state, "morning" → hours 6-12)

## Parameter Extraction Hints
- Age: "youth"/"young" → 18-25, "middle-aged" → 36-45, "senior"/"elderly" → 56+
- Time: "morning" → 6-12, "afternoon" → 12-17, "evening" → 17-22, "night" → 22-6
- States: MH → Maharashtra, KA → Karnataka, TN → Tamil Nadu, UP → Uttar Pradesh, DL → Delhi
- "Fraud"/"risk"/"suspicious" → merchant_risk_analysis
- "Trend"/"over time"/"hourly" → hourly_volume_trend
- "Weekly"/"day of week" → daily_pattern_analysis
- "Bank"/"which bank" → bank_performance
- "Region"/"state-wise"/"geography" → geographic_distribution
- "Phone"/"device"/"mobile" → device_type_breakdown
- "Revenue"/"total amount"/"₹" → revenue_by_category
- "UPI type"/"P2P"/"P2M" → transaction_type_split
- "Peak"/"busiest" → peak_usage_analysis`;

// ─── Request Handler ────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isApproved) {
            return new Response(
                JSON.stringify({ error: "Unauthorized. Your account is pending admin approval." }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();
        const messages = await convertToModelMessages(uiMessages);

        console.log(`[chat] Provider: ${LLM_PROVIDER}, Messages: ${uiMessages.length}`);

        if (LLM_PROVIDER === 'ollama') {
            // Try Ollama first, auto-fallback to Gemini on failure
            const ollamaResult = await handleOllama(messages);
            if (ollamaResult) return ollamaResult;

            console.warn('[chat] Ollama failed, falling back to Gemini');
            return handleGemini(messages);
        }
        return handleGemini(messages);
    } catch (err) {
        console.error('[chat] Request handler error:', err);
        return new Response(
            JSON.stringify({ error: 'Request processing failed', detail: String(err) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleGemini(messages: Awaited<ReturnType<typeof convertToModelMessages>>) {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < Math.max(GEMINI_API_KEYS.length, 1); attempt++) {
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

async function handleOllama(messages: Awaited<ReturnType<typeof convertToModelMessages>>): Promise<Response | null> {
    // Health check: verify Ollama is running
    try {
        const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!healthCheck.ok) {
            console.warn(`[ollama] Health check failed: ${healthCheck.status}`);
            return null;
        }
        const tags = await healthCheck.json();
        const models = (tags.models || []).map((m: { name: string }) => m.name);
        console.log(`[ollama] Available models: ${models.join(', ')}`);

        // Check if requested model is available
        const modelBase = OLLAMA_MODEL.split(':')[0];
        const hasModel = models.some((m: string) => m.startsWith(modelBase));
        if (!hasModel) {
            console.warn(`[ollama] Model "${OLLAMA_MODEL}" not found. Available: ${models.join(', ')}`);
            return null;
        }
    } catch (err) {
        console.warn(`[ollama] Server not reachable at ${OLLAMA_BASE_URL}:`, err);
        return null;
    }

    // Make the actual request
    try {
        const ollama = createOllama({ baseURL: `${OLLAMA_BASE_URL}/api` });
        const result = streamText({
            model: ollama(OLLAMA_MODEL),
            system: SYSTEM_PROMPT,
            messages,
            tools,
        });
        return result.toUIMessageStreamResponse();
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[ollama] Stream error: ${error.message}`);
        return null; // Return null to trigger Gemini fallback
    }
}

