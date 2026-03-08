import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { context, intent } = await req.json();

    // Try to use Gemini for generating the report
    const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
    const apiKey = apiKeys[0];

    if (!apiKey) {
      return NextResponse.json({ report: null }, { status: 500 });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an incident report generator for a financial analytics platform. Based on the following data analysis, generate a professional, formatted incident report suitable for emailing to an engineering or operations team.\n\nContext:\n${context}\n\nGenerate a report with sections: Executive Summary, Key Findings, Data Evidence, Risk Assessment, Recommended Actions, and Next Steps. Keep it concise but professional. Use markdown formatting.`
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const report = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate report.';
      return NextResponse.json({ report });
    }

    return NextResponse.json({ report: null }, { status: 500 });
  } catch {
    return NextResponse.json({ report: null }, { status: 500 });
  }
}
