// @ts-nocheck
import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: google('models/gemini-2.5-flash') as any, // Use Gemini as default provider
        system: "You are a deterministic AI semantic router for an OLAP data engine. Your goal is to map user queries to the STRICTEST available tool to guarantee 100% deterministic query building. You will NOT write SQL. You will extract parameters from the user's intent and supply them to the proper tool.",
        messages,
        tools: {
            compare_network_failures: tool({
                description: 'Compare the technical failure rates of transactions initiated on different networks.',
                parameters: z.object({
                    primary_network: z.enum(["5G", "4G", "3G", "WiFi"]),
                    secondary_network: z.enum(["5G", "4G", "3G", "WiFi"]),
                }),
            }),
            analyze_transaction_status: tool({
                description: 'Show me the distribution of transaction statuses for a given demographic.',
                parameters: z.object({
                    age_group: z.enum(["18-25", "26-35", "36-45", "46-55", "56+"]),
                    state: z.string(),
                })
            }),
            average_transaction_value: tool({
                description: 'Get the average transaction value for a merchant category within a specific hour range.',
                parameters: z.object({
                    category: z.enum(["Food", "Grocery", "Shopping", "Utilities", "Entertainment", "Healthcare", "Education", "Other"]),
                    start_hour: z.number().min(0).max(23),
                    end_hour: z.number().min(0).max(23)
                })
            }),
            merchant_risk_analysis: tool({
                description: 'Find which merchant category has the highest ratio of fraud-flagged transactions.',
                parameters: z.object({
                    // Risk parameters if any
                    limit: z.number().default(5)
                })
            }),
        }
    });

    return result.toDataStreamResponse();
}
