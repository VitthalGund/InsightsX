/**
 * generate-state-analysis.mjs
 * 
 * Pre-generates comprehensive analysis JSON for all states in the UPI dataset.
 * Uses DuckDB (Node.js) to query the parquet file and Gemini for AI summaries.
 * 
 * Usage:  node scripts/generate-state-analysis.mjs
 * Output: public/state-analysis.json
 */

import duckdb from 'duckdb';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARQUET_PATH = resolve(__dirname, '../public/transactions.parquet');
const OUTPUT_PATH = resolve(__dirname, '../public/state-analysis.json');

// Gemini config
const GEMINI_API_KEY = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean)[0];
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.error('❌ No GEMINI_API_KEYS found in .env');
  process.exit(1);
}

// ─── DuckDB helpers ─────────────────────────────────────────────────
function createDB() {
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(':memory:', (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function query(conn, sql) {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getConnection(db) {
  return new Promise((resolve, reject) => {
    const conn = db.connect();
    resolve(conn);
  });
}

// ─── Gemini call ────────────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`  ⚠ Gemini API error (${res.status}): ${errText.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ─── Run all analysis queries for a state ───────────────────────────
async function analyzeState(conn, stateName) {
  const s = stateName.replace(/'/g, "''");

  // 1. Overview
  const [ovr] = await query(conn, `
    SELECT 
      CAST(COUNT(*) AS INTEGER) as total,
      CAST(SUM(amount_inr) AS DOUBLE) as total_amt,
      CAST(AVG(amount_inr) AS DOUBLE) as avg_amt,
      CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as success_rate
    FROM transactions WHERE sender_state='${s}'
  `);
  const overview = {
    totalTransactions: ovr.total,
    totalAmount: ovr.total_amt,
    avgAmount: Math.round(ovr.avg_amt * 100) / 100,
    successRate: Math.round(ovr.success_rate * 100) / 100,
  };

  // 2. Status Distribution
  const statusDistribution = await query(conn, `
    SELECT transaction_status as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY transaction_status ORDER BY value DESC
  `);

  // 3. Transaction Types
  const transactionTypes = await query(conn, `
    SELECT transaction_type as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY transaction_type ORDER BY value DESC
  `);

  // 4. Fraud
  const [fr] = await query(conn, `
    SELECT 
      CAST(SUM(fraud_flag) AS INTEGER) as fraud_count,
      CAST(SUM(fraud_flag) AS FLOAT) / COUNT(*) * 100 as fraud_rate
    FROM transactions WHERE sender_state='${s}'
  `);
  const fraudByCategory = await query(conn, `
    SELECT merchant_category as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' AND fraud_flag=1 
    GROUP BY merchant_category ORDER BY value DESC
  `);
  const fraud = {
    totalFraud: fr.fraud_count,
    fraudRate: Math.round(fr.fraud_rate * 100) / 100,
    byCategory: fraudByCategory,
  };

  // 5. Devices
  const devices = await query(conn, `
    SELECT device_type as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY device_type ORDER BY value DESC
  `);

  // 6. Networks
  const networks = await query(conn, `
    SELECT network_type as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY network_type ORDER BY value DESC
  `);

  // 7. Banks
  const banks = await query(conn, `
    SELECT sender_bank as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY sender_bank ORDER BY value DESC LIMIT 8
  `);

  // 8. Hourly Trend
  const hourlyTrend = await query(conn, `
    SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY hour_of_day ORDER BY hour_of_day
  `);

  // 9. Daily Pattern
  const dailyPattern = await query(conn, `
    SELECT day_of_week as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' 
    GROUP BY day_of_week 
    ORDER BY CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END
  `);

  // 10. Demographics
  const demographics = await query(conn, `
    SELECT sender_age_group as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY sender_age_group ORDER BY value DESC
  `);

  // 11. Revenue by Category
  const revenueByCategory = await query(conn, `
    SELECT merchant_category as name, CAST(SUM(amount_inr) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY merchant_category ORDER BY value DESC
  `);

  // 12. Peak Hours
  const peakHours = await query(conn, `
    SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value 
    FROM transactions WHERE sender_state='${s}' GROUP BY hour_of_day ORDER BY value DESC LIMIT 5
  `);

  return {
    overview, statusDistribution, transactionTypes, fraud,
    devices, networks, banks, hourlyTrend, dailyPattern,
    demographics, revenueByCategory, peakHours,
  };
}

// ─── Build Gemini prompt for a state ────────────────────────────────
function buildSummaryPrompt(stateName, data) {
  return `You are a UPI payments analytics expert. Write a concise executive summary (3-4 short paragraphs, plain text, no markdown headers or bullet points) for the Indian state "${stateName}" based on this transaction data:

Total Transactions: ${data.overview.totalTransactions}
Total Volume: ₹${(data.overview.totalAmount / 10000000).toFixed(2)} Cr
Avg Transaction: ₹${data.overview.avgAmount.toFixed(0)}
Success Rate: ${data.overview.successRate}%
Fraud Rate: ${data.fraud.fraudRate}%
Fraud Count: ${data.fraud.totalFraud}
Top Transaction Type: ${data.transactionTypes[0]?.name} (${data.transactionTypes[0]?.value})
Top Device: ${data.devices[0]?.name} (${data.devices[0]?.value})
Top Network: ${data.networks[0]?.name} (${data.networks[0]?.value})
Top Bank: ${data.banks[0]?.name} (${data.banks[0]?.value})
Top Age Group: ${data.demographics[0]?.name} (${data.demographics[0]?.value} txns)
Top Revenue Category: ${data.revenueByCategory[0]?.name} (₹${((data.revenueByCategory[0]?.value || 0) / 100000).toFixed(1)}L)

Highlight performance strengths, risk areas (especially fraud if notable), and one actionable recommendation. Be concise.`;
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting state analysis generation...');
  console.log(`   Parquet: ${PARQUET_PATH}`);
  console.log(`   Output:  ${OUTPUT_PATH}`);
  console.log(`   Model:   ${GEMINI_MODEL}\n`);

  // Init DuckDB
  const db = await createDB();
  const conn = await getConnection(db);

  // Load parquet
  console.log('📦 Loading parquet into DuckDB...');
  await query(conn, `CREATE TABLE transactions AS SELECT * FROM read_parquet('${PARQUET_PATH.replace(/\\/g, '/')}')`);

  // Get all unique states
  const states = await query(conn, `SELECT DISTINCT sender_state as name FROM transactions WHERE sender_state IS NOT NULL ORDER BY name`);
  console.log(`📍 Found ${states.length} states\n`);

  const result = {};
  
  for (let i = 0; i < states.length; i++) {
    const stateName = states[i].name;
    console.log(`[${i + 1}/${states.length}] Analyzing: ${stateName}...`);

    // Run all DuckDB queries
    const analysisData = await analyzeState(conn, stateName);

    // Call Gemini for AI summary
    let aiSummary = null;
    try {
      aiSummary = await callGemini(buildSummaryPrompt(stateName, analysisData));
      if (aiSummary) {
        console.log(`  ✅ Gemini summary generated (${aiSummary.length} chars)`);
      } else {
        console.log(`  ⚠ No Gemini response`);
      }
    } catch (err) {
      console.log(`  ⚠ Gemini error: ${err.message}`);
    }

    result[stateName] = {
      ...analysisData,
      aiSummary: aiSummary || `Analysis complete for ${stateName}. AI summary was not available at generation time.`,
    };

    // Small delay to avoid rate limits
    if (i < states.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // Save JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\n✅ Done! Saved ${Object.keys(result).length} states to ${OUTPUT_PATH}`);
  console.log(`   File size: ${(readFileSync(OUTPUT_PATH).length / 1024).toFixed(1)} KB`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
