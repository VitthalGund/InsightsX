import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { question, contextData } = await req.json();

    const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
    const apiKey = apiKeys[0];

    if (!apiKey) {
      return NextResponse.json({ riskArgument: null, growthArgument: null }, { status: 500 });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Run both perspectives in parallel
    const [riskRes, growthRes] = await Promise.all([
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a RISK-AVERSE COMPLIANCE OFFICER at a major Indian bank. You prioritize regulatory compliance, fraud prevention, and customer trust above all else.\n\nThe executive has asked: "${question}"\n\n${contextData ? `Context data: ${JSON.stringify(contextData).slice(0, 2000)}` : ''}\n\nProvide a concise argument (max 200 words) from your risk-averse perspective. Use bullet points, bold key numbers, and end with a clear recommendation. Be data-driven and specific.`
              }]
            }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
          }),
        }
      ),
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a GROWTH-FOCUSED SALES DIRECTOR at a major Indian fintech. You prioritize revenue growth, customer acquisition, user experience, and market expansion above all else.\n\nThe executive has asked: "${question}"\n\n${contextData ? `Context data: ${JSON.stringify(contextData).slice(0, 2000)}` : ''}\n\nProvide a concise argument (max 200 words) from your growth-focused perspective. Use bullet points, bold key numbers, and end with a clear recommendation. Be data-driven and specific.`
              }]
            }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
          }),
        }
      ),
    ]);

    let riskArgument = '';
    let growthArgument = '';

    if (riskRes.ok) {
      const data = await riskRes.json();
      riskArgument = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    if (growthRes.ok) {
      const data = await growthRes.json();
      growthArgument = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    return NextResponse.json({ riskArgument, growthArgument });
  } catch {
    return NextResponse.json({ riskArgument: null, growthArgument: null }, { status: 500 });
  }
}
