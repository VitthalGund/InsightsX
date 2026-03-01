# 🚀 InsightsX (FinSight) – Zero-Latency AI Data Analyst

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-WASM-yellow?logo=duckdb)](https://duckdb.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-blue?logo=google)](https://deepmind.google/technologies/gemini/)
[![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)](https://mongodb.com/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**InsightsX (FinSight)** is a zero-latency, in-browser AI analytics platform that lets users query **250k+ financial transactions in plain English** and get **verified charts instantly** — no backend OLAP, no waiting.

---

## ✨ What Makes It Different

- ⚡ **Instant Analytics in Browser**  
  Uses **DuckDB-WASM + Parquet** to run OLAP queries fully inside the browser.

- 🔒 **Privacy-First by Design**  
  Transaction data never leaves the client device.

- 🧠 **Deterministic AI (No Hallucinated SQL)**  
  Gemini is used only for intent classification → mapped to **pre-validated SQL templates**.

- 📊 **Explainable Charts**  
  Every visualization shows the SQL logic behind it.

---

## 🏗️ High-Level Architecture

1. **Data**: CSV → compressed `.parquet`
2. **Compute**: DuckDB-WASM (browser memory)
3. **AI**: Vercel AI SDK + Gemini (intent → tool calls)
4. **UI**: Next.js + Tailwind + Recharts
5. **Auth & Storage**: NextAuth + MongoDB

---

## 🛠️ Local Setup

### Prerequisites
- Node.js `>=18`
- MongoDB URI (Atlas works)
- Google Gemini API key

### Clone & Install
```bash
git clone https://github.com/yourusername/insightsx.git
cd insightsx/web
npm install
````

### Environment Variables

Create `web/.env.local`:

```env
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/insightsx"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_random_secret"
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
```

### Data File

Ensure this file exists:

```
web/public/transactions.parquet
```

(Pre-generated file included. No setup needed.)

### Run the App

```bash
npm run dev
```

Open 👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 How to Use

### AI Chat

Ask natural language questions like:

* “Compare fraud rates across payment networks”
* “Show transaction trends for Maharashtra”
* “What happens if a major bank goes offline for 4 hours?”

### Dashboard

* KPI overview
* Interactive India map
* Click any state → auto contextual analysis

---

## 📁 Project Structure

```text
insightsx/
├── convert_to_parquet.py
├── data/
└── web/
    ├── public/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   └── models/
    └── package.json
```

---

## 🏁 Summary

**InsightsX** demonstrates how **AI + WASM databases** can deliver:

* sub-second analytics
* zero backend compute
* explainable, production-safe AI

Perfect for **hackathons, fintech demos, and modern analytics workflows**.

---

### 👥 Team

Built by passionate engineers exploring the future of **AI-native analytics**.

```
