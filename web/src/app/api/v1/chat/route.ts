/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import {
    LLM_PROVIDER,
    featherless,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    GEMINI_API_KEYS,
    GEMINI_MODEL,
    getNextGeminiKey,
    tools,
    SYSTEM_PROMPT
} from '@/lib/ai-config';

export const maxDuration = 60;

// ─── Request Handler ────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON payload." }), { status: 400 });
        }

        const userMessage = body.message;
        if (!userMessage || typeof userMessage !== 'string') {
            return new Response(JSON.stringify({ error: "Missing or invalid 'message' field in payload." }), { status: 400 });
        }

        const messages: any[] = [
            { role: 'user', content: userMessage }
        ];

        // Include previous history if provided by the tester
        if (body.history && Array.isArray(body.history)) {
            messages.unshift(...body.history);
        }

        console.log(`[v1/chat] Standalone API Request. Provider: ${LLM_PROVIDER}`);

        if (LLM_PROVIDER === 'featherless') {
            const featherlessResult = await handleFeatherless(messages);
            if (featherlessResult) return featherlessResult;

            console.warn('[v1/chat] Featherless failed, falling back to Gemini');
            return handleGemini(messages);
        }

        if (LLM_PROVIDER === 'ollama') {
            const ollamaResult = await handleOllama(messages);
            if (ollamaResult) return ollamaResult;

            console.warn('[v1/chat] Ollama failed, falling back to Gemini');
            return handleGemini(messages);
        }

        return handleGemini(messages);
    } catch (err) {
        console.error('[v1/chat] Request handler error:', err);
        return new Response(
            JSON.stringify({ error: 'Request processing failed', detail: String(err) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// ─── Provider Implementations ───────────────────────────────────────

function formatResponse(result: any) {
    return new Response(JSON.stringify({
        text: result.text,
        toolCalls: result.toolCalls,
        finishReason: result.finishReason,
        usage: result.usage
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleFeatherless(messages: any[]) {
    try {
        const result = await generateText({
            model: featherless.chat('deepseek-ai/DeepSeek-V3.2'),
            system: SYSTEM_PROMPT,
            messages,
            tools,
        });
        return formatResponse(result);
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[featherless] Generate error: ${error.message}`);
        return null;
    }
}

async function handleGemini(messages: any[]) {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < Math.max(GEMINI_API_KEYS.length, 1); attempt++) {
        const apiKey = getNextGeminiKey();
        try {
            const google = createGoogleGenerativeAI({ apiKey });
            const result = await generateText({
                model: google(GEMINI_MODEL),
                system: SYSTEM_PROMPT,
                messages,
                tools,
            });
            return formatResponse(result);
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

async function handleOllama(messages: any[]): Promise<Response | null> {
    try {
        const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!healthCheck.ok) return null;

        const tags = await healthCheck.json();
        const models = (tags.models || []).map((m: { name: string }) => m.name);
        if (!models.some((m: string) => m.startsWith(OLLAMA_MODEL.split(':')[0]))) return null;

        const ollama = createOllama({ baseURL: `${OLLAMA_BASE_URL}/api` });
        const result = await generateText({
            model: ollama(OLLAMA_MODEL),
            system: SYSTEM_PROMPT,
            messages,
            tools,
        });
        return formatResponse(result);
    } catch {
        return null;
    }
}
