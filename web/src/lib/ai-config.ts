
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export const maxDuration = 60;

// ─── Provider Configuration ─────────────────────────────────────────
export const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'featherless';

export const FEATHERLESS_API_KEY = process.env.featherlessai;
export const featherless = createOpenAI({
    apiKey: FEATHERLESS_API_KEY,
    baseURL: 'https://api.featherless.ai/v1',
});

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b';

export const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS ?? '').split(',').map(k => k.trim()).filter(Boolean);
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
let geminiKeyIndex = 0;
export function getNextGeminiKey(): string {
    if (GEMINI_API_KEYS.length === 0) throw new Error('No GEMINI_API_KEYS in .env');
    const key = GEMINI_API_KEYS[geminiKeyIndex % GEMINI_API_KEYS.length];
    geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    return key;
}

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
export const tools = {
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
        description: 'Transaction count by state. Shows geographic spread of usage.',
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
    user_demographics_analysis: {
        description: 'Analyze transaction behavior grouped by sender age group, showing volume and average transaction size.',
        inputSchema: z.object({
            state: z.string().optional().describe('Optional state filter'),
        })
    },
    suspicious_behavior_flags: {
        description: 'Detailed breakdown of fraud flags across different dimensions like device_type or network_type.',
        inputSchema: z.object({
            dimension: z.enum(['device_type', 'network_type', 'sender_bank', 'transaction_type']).default('device_type'),
        })
    },
    simulate_fraud_rule: {
        description: 'Simulate increasing or decreasing fraud rule stringency to see the impact on blocked fraud vs false declines (lost revenue).',
        inputSchema: z.object({
            stringency_delta: z.number().describe('Percentage change in rule strictness (e.g., 20 for 20% tighter, -10 for 10% looser)'),
        })
    },
    simulate_outage: {
        description: 'Simulate an infrastructure outage for a specific banking partner or network to calculate the lost transaction volume.',
        inputSchema: z.object({
            partner_name: z.string().describe('Name of the bank or network experiencing the outage'),
            duration_hours: z.number().describe('Duration of the simulated outage in hours'),
        })
    },
    generate_boardroom_report: {
        description: 'Generate a comprehensive executive summary boardroom report. ALWAYS use this tool when the user asks for a boardroom report.',
        inputSchema: z.object({})
    },
    adversarial_debate: {
        description: 'Trigger a Strategy Debate between two AI personas with opposing viewpoints. Use this when the user asks a strategic, policy, or macro question like "Should we tighten fraud rules?", "Should we expand to rural markets?", etc. This spawns Risk-Averse vs Growth-Focused AI arguments side by side.',
        inputSchema: z.object({
            question: z.string().describe('The strategic question to debate'),
        })
    }
};

// ─── System Prompt ──────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are InsightsX — an advanced AI analytics assistant for a Unified Payments (UPI) dataset powered by the InsightsX Analytics Engine. You have access to tools that query the data and generate interactive visualizations.

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

### 3. Architectural & Flow Diagrams
When discussing systems, processes, flows, or architecture, use **mermaid** code blocks.
CRITICAL: ONLY use standard mermaid syntax. NEVER use ascii art, ASCII lines like \`|\` or \`*\`, or invalid operators like \`>>>\`. Use \`-->\` for connections.

Supported mermaid diagram types:
- **flowchart/graph** — for process flows, decision trees, system architecture
- **sequenceDiagram** — for interaction flows, API call sequences
- **classDiagram** — for data models, entity relationships
- **stateDiagram-v2** — for state machines, status transitions
- **pie** — for simple distributions (use tool call for interactive ones)
- **gantt** — for timelines, project schedules
- **erDiagram** — for database schemas, entity relationships

### 4. Rich Formatting
Structure responses with:
- **## Headers** for major sections
- **### Sub-headers** for sub-topics
- **Bold** for key metrics and important terms
- *Italics* for context and caveats
- > Blockquotes for key insights and takeaways
- \`code\` for technical terms or field names
- Tables for structured comparisons
- Numbered lists for step-by-step explanations
- Bullet lists for feature lists and key points

### 5. Formatting Constraints
- **Keep responses moderate in length.** Do not be overly verbose.
- **Use point-wise formatting** (bullet points) instead of long continuous paragraphs.
- **Leave a clear blank line** after each section or list item to make the response look clean.
- **Do not use long dashes** (\`—\` or \`-\`) for structural formatting. Rely on standard markdown headers and blank lines.
- **Maintain a highly human, concise, and clean chat response structure.**

### 6. Tool Usage
- Call tools when data visualization is needed
- You can call MULTIPLE tools for comprehensive analysis
- Always provide text explanation alongside tool calls
- For business questions: combine data + strategic text + diagrams
- Extract parameters from natural language (e.g., "Maharashtra" → state, "morning" → hours 6-12)

## Parameter Extraction Hints
- Age: "youth"/"young" → 18-25, "middle-aged" → 36-45, "senior"/"elderly" → 56+
- Time: "morning" → 6-12, "afternoon" → 12-17, "evening" → 17-22, "night" → 22-6
- States: MH → Maharashtra, KA → Karnataka, TN → Tamil Nadu, UP → Uttar Pradesh, DL → Delhi
- "Fraud"/"risk"/"suspicious" → merchant_risk_analysis or suspicious_behavior_flags
- "Trend"/"over time"/"hourly" → hourly_volume_trend
- "Weekly"/"day of week" → daily_pattern_analysis
- "Bank"/"which bank" → bank_performance
- "Region"/"state-wise"/"geography" → geographic_distribution
- "Phone"/"device"/"mobile" → device_type_breakdown
- "Revenue"/"total amount"/"₹" → revenue_by_category
- "UPI type"/"P2P"/"P2M" → transaction_type_split
- "Peak"/"busiest" → peak_usage_analysis
- "Demographics"/"age" → user_demographics_analysis
- "Simulate fraud"/"tighten rules"/"stringency" → simulate_fraud_rule
- "Outage"/"downtime"/"simulation"/"impact" → simulate_outage
- "Should we"/"debate"/"pros and cons"/"strategy"/"tighten"/"expand"/"policy" → adversarial_debate (spawns two opposing AI arguments)
- "Boardroom report"/"executive summary"/"full report" → generate_boardroom_report`;
