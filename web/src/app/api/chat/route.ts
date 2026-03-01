import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import {
    LLM_PROVIDER,
    featherless,
    FEATHERLESS_API_KEY,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    GEMINI_API_KEYS,
    GEMINI_MODEL,
    getNextGeminiKey,
    tools,
    SYSTEM_PROMPT
} from '@/lib/ai-config';

export const maxDuration = 60;
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized. Please log in first." }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const json = await req.json();
        let uiMessages: UIMessage[] = json.messages;
        if (!Array.isArray(uiMessages)) {
            console.error('[chat] Provided messages payload is not an array:', json.messages);
            uiMessages = [];
        }

        console.log(`[chat] Payload keys: ${Object.keys(json)}, Provider: ${LLM_PROVIDER}, Messages: ${uiMessages.length}`);
        console.log(`[chat] Payload messages dump:`, JSON.stringify(uiMessages).slice(0, 1000));
        const messages = await convertToModelMessages(uiMessages);

        if (LLM_PROVIDER === 'featherless') {
            const featherlessResult = await handleFeatherless(messages);
            if (featherlessResult) return featherlessResult;

            console.warn('[chat] Featherless failed, falling back to Gemini');
            return handleGemini(messages);
        }

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

// ─── Provider Implementations ───────────────────────────────────────

async function handleFeatherless(messages: Awaited<ReturnType<typeof convertToModelMessages>>) {
    try {
        if (!FEATHERLESS_API_KEY) {
            console.warn('[featherless] API key missing');
            return null;
        }

        const result = streamText({
            model: featherless.chat('deepseek-ai/DeepSeek-V3.2'),
            system: SYSTEM_PROMPT,
            messages,
            tools,
        });
        return result.toUIMessageStreamResponse();
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[featherless] Stream error: ${error.message}`);
        return null;
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

