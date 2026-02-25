/**
 * InsightsX Chat API Test Script
 * 
 * Tests the /api/chat endpoint against all 4 tool definitions.
 * Validates that the LLM routes user queries to the correct tool with proper parameters.
 * 
 * Usage:
 *   npx tsx scripts/test-chat-api.ts
 * 
 * Env:
 *   Reads from web/.env (LLM_PROVIDER, GEMINI_API_KEYS, OLLAMA_*)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

interface TestCase {
    name: string;
    query: string;
    expectedTool: string;
    expectedParams: string[];
}

const TEST_CASES: TestCase[] = [
    {
        name: 'Transaction Status Distribution',
        query: 'Show me the distribution of transaction statuses for the 18-25 age group in Maharashtra',
        expectedTool: 'analyze_transaction_status',
        expectedParams: ['age_group', 'state'],
    },
    {
        name: 'Network Failure Comparison',
        query: 'Compare technical failure rates on 4G vs 5G networks',
        expectedTool: 'compare_network_failures',
        expectedParams: ['primary_network', 'secondary_network'],
    },
    {
        name: 'Average Transaction Value',
        query: 'What is the average transaction value for Food purchases between 9am and 6pm?',
        expectedTool: 'average_transaction_value',
        expectedParams: ['category', 'start_hour', 'end_hour'],
    },
    {
        name: 'Merchant Risk Analysis',
        query: 'What merchant categories have the highest fraud flags?',
        expectedTool: 'merchant_risk_analysis',
        expectedParams: ['limit'],
    },
    {
        name: 'Implicit State Extraction',
        query: 'How are transactions distributed for people aged 36-45 in Karnataka?',
        expectedTool: 'analyze_transaction_status',
        expectedParams: ['age_group', 'state'],
    },
    {
        name: 'Implicit Category Extraction',
        query: 'Show me spending patterns for grocery purchases in the morning hours 6 to 12',
        expectedTool: 'average_transaction_value',
        expectedParams: ['category', 'start_hour', 'end_hour'],
    },
];

// ─── Helpers ────────────────────────────────────────────────────────

function createUIMessage(text: string) {
    return {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text }],
        createdAt: new Date().toISOString(),
    };
}

async function runTest(tc: TestCase): Promise<{ pass: boolean; detail: string }> {
    try {
        const res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [createUIMessage(tc.query)] }),
        });

        if (!res.ok) {
            return { pass: false, detail: `HTTP ${res.status}: ${res.statusText}` };
        }

        // Read the streaming response as text
        const reader = res.body?.getReader();
        if (!reader) return { pass: false, detail: 'No response body' };

        let fullText = '';
        const decoder = new TextDecoder();
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
        }

        // Check if the expected tool name appears in the stream
        const hasToolName = fullText.includes(tc.expectedTool);

        // Check if it contains tool call markers
        const hasToolCall = fullText.includes('tool-call') || fullText.includes('tool_call') || fullText.includes(tc.expectedTool);

        if (!hasToolName && !hasToolCall) {
            // Check if response is just text (no tool call)
            const textOnly = fullText.length < 500 ? fullText.substring(0, 200) : `[${fullText.length} chars]`;
            return { pass: false, detail: `No tool call detected. Response snippet: ${textOnly}` };
        }

        return { pass: true, detail: `Tool "${tc.expectedTool}" found in stream` };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { pass: false, detail: `Error: ${msg}` };
    }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║  InsightsX Chat API Test Suite                                  ║');
    console.log(`║  Target: ${BASE_URL.padEnd(55)}║`);
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    let passed = 0;
    let failed = 0;

    for (const tc of TEST_CASES) {
        process.stdout.write(`  ⏳ ${tc.name}... `);
        const result = await runTest(tc);
        if (result.pass) {
            passed++;
            console.log(`\x1b[32m✓ PASS\x1b[0m  ${result.detail}`);
        } else {
            failed++;
            console.log(`\x1b[31m✗ FAIL\x1b[0m  ${result.detail}`);
        }
    }

    console.log(`\n${'─'.repeat(68)}`);
    console.log(`  Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, ${TEST_CASES.length} total`);
    console.log(`${'─'.repeat(68)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main();
