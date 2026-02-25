import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 30;

// Parse comma-separated API keys from env
const API_KEYS = (process.env.GEMINI_API_KEYS ?? '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

// Round-robin index that persists across requests in the same server process
let currentKeyIndex = 0;

function getNextKey(): string {
    if (API_KEYS.length === 0) {
        throw new Error('No GEMINI_API_KEYS configured in .env');
    }
    const key = API_KEYS[currentKeyIndex % API_KEYS.length];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

// Tool definitions using inputSchema (AI SDK v5 convention)
const tools = {
    compare_network_failures: {
        description: 'Compare the technical failure rates of transactions initiated on different networks.',
        inputSchema: z.object({
            primary_network: z.enum(["5G", "4G", "3G", "WiFi"]),
            secondary_network: z.enum(["5G", "4G", "3G", "WiFi"]),
        }),
    },
    analyze_transaction_status: {
        description: 'Show me the distribution of transaction statuses for a given demographic.',
        inputSchema: z.object({
            age_group: z.enum(["18-25", "26-35", "36-45", "46-55", "56+"]),
            state: z.string(),
        }),
    },
    average_transaction_value: {
        description: 'Get the average transaction value for a merchant category within a specific hour range.',
        inputSchema: z.object({
            category: z.enum(["Food", "Grocery", "Shopping", "Utilities", "Entertainment", "Healthcare", "Education", "Other"]),
            start_hour: z.number().min(0).max(23),
            end_hour: z.number().min(0).max(23),
        }),
    },
    merchant_risk_analysis: {
        description: 'Find which merchant category has the highest ratio of fraud-flagged transactions.',
        inputSchema: z.object({
            limit: z.number().default(5),
        }),
    },
};

const SYSTEM_PROMPT = "You are a deterministic AI semantic router for an OLAP data engine. Your goal is to map user queries to the STRICTEST available tool to guarantee 100% deterministic query building. You will NOT write SQL. You will extract parameters from the user's intent and supply them to the proper tool.";

export async function POST(req: Request) {
    const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();
    const messages = await convertToModelMessages(uiMessages);

    // Try each API key until one succeeds (handles rate limits / expired keys)
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
        const apiKey = getNextKey();
        try {
            const google = createGoogleGenerativeAI({ apiKey });

            const result = streamText({
                model: google('gemini-2.5-flash'),
                system: SYSTEM_PROMPT,
                messages,
                tools,
            });

            return result.toUIMessageStreamResponse();
        } catch (err: unknown) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(`Gemini key attempt ${attempt + 1} failed: ${lastError.message}. Rotating...`);
        }
    }

    return new Response(
        JSON.stringify({ error: 'All Gemini API keys exhausted or rate-limited', detail: lastError?.message }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
}
