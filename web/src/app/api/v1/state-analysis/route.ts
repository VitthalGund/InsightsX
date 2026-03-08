import { OLLAMA_BASE_URL, OLLAMA_MODEL } from '@/lib/ai-config';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { stateName, analysisData } = await req.json();

        if (!stateName || !analysisData) {
            return Response.json(
                { error: 'Missing stateName or analysisData' },
                { status: 400 }
            );
        }

        // Build a concise prompt for Ollama
        const prompt = `You are a UPI payments analytics expert. Provide a brief executive summary (3-4 paragraphs, no markdown headers) for the state "${stateName}" based on this data:

Total Transactions: ${analysisData.overview?.totalTransactions ?? 'N/A'}
Total Volume: ₹${((analysisData.overview?.totalAmount ?? 0) / 10000000).toFixed(2)} Cr
Success Rate: ${analysisData.overview?.successRate?.toFixed(1) ?? 'N/A'}%
Fraud Rate: ${analysisData.fraud?.fraudRate?.toFixed(2) ?? 'N/A'}%
Fraud Count: ${analysisData.fraud?.totalFraud ?? 'N/A'}
Top Transaction Type: ${analysisData.transactionTypes?.[0]?.name ?? 'N/A'} (${analysisData.transactionTypes?.[0]?.value ?? 0})
Top Device: ${analysisData.devices?.[0]?.name ?? 'N/A'} (${analysisData.devices?.[0]?.value ?? 0})
Top Network: ${analysisData.networks?.[0]?.name ?? 'N/A'} (${analysisData.networks?.[0]?.value ?? 0})
Top Bank: ${analysisData.banks?.[0]?.name ?? 'N/A'} (${analysisData.banks?.[0]?.value ?? 0})
Top Age Group: ${analysisData.demographics?.[0]?.name ?? 'N/A'} (${analysisData.demographics?.[0]?.value ?? 0} txns)
Top Revenue Category: ${analysisData.revenueByCategory?.[0]?.name ?? 'N/A'} (₹${((analysisData.revenueByCategory?.[0]?.value ?? 0) / 100000).toFixed(1)}L)

Highlight key business insights: performance strengths, risk areas, and one actionable recommendation. Be concise.`;

        // Call Ollama
        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                options: { temperature: 0.3, num_predict: 400 }
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!ollamaResponse.ok) {
            console.warn(`[state-analysis] Ollama returned ${ollamaResponse.status}`);
            return Response.json({ summary: `Analysis complete for ${stateName}. Ollama summary unavailable.` });
        }

        const ollamaData = await ollamaResponse.json();
        return Response.json({ summary: ollamaData.response || `Analysis complete for ${stateName}.` });

    } catch (err) {
        console.error('[state-analysis] Error:', err);
        return Response.json(
            { summary: 'AI summary generation timed out. Data analysis is still available below.' },
            { status: 200 }
        );
    }
}
