"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root">
      {/* Global Universal Navbar */}
      <Navbar />
      
      <main className="grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
          {/* Background Decoration */}
          <div className="absolute -top-24 -right-24 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-0 -z-10 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-indigo-300/10 dark:bg-indigo-500/10 blur-3xl"></div>
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div className="flex flex-col items-start gap-6 max-w-2xl">
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                  New: Real-time Anomaly Detection v2.0
                </div>
                <h1 className="text-4xl font-black tracking-tight text-text-main sm:text-5xl lg:text-6xl leading-[1.1]">
                  Your AI Analyst for <br className="hidden lg:block"/>
                  <span className="text-primary">Payment Data</span>
                </h1>
                <p className="text-lg text-text-muted leading-relaxed max-w-lg">
                  Ask questions about millions of payment transactions in plain English — no SQL, no analysts required. Get executive-ready insights in seconds.
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <Link
                    href={session ? "/chat" : "/register"}
                    className="flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-white shadow-lg hover:bg-primary-dark hover:shadow-primary/25 transition-all"
                  >
                    Try the AI Analyst
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-12 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-8 text-base font-bold text-text-main shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Book a Demo
                  </Link>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
                  <div className="flex -space-x-2">
                    <div
                      className="h-8 w-8 rounded-full bg-gray-200 border-2 border-surface overflow-hidden"
                      title="User avatar 1"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="User 1"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbHomfEWGjpOynvhQFniSYBpsrjQO0dNvWjBCn0XLyo2Ocw7Ph9lW1Ge8DXPuQPDwzb-s3UB9IM0QBDCp0GbcmaexqGMeIFZsZ55a8ESZP9c0aGGmjl9wDvr5ZitkK_UpiDfBDEAuC-R9Jqwnvr4QRLt3Ydzw50I92xOOwFE_ZJiO6a7bUuBzQPR-6xrt1nan7bVzeyj-Q1XF_qQDZJ2_TluYsH0oqvWUXP0gp8N6xlP-zD2A03c1j6UAfIugkwol2WBMR9Zw3"
                      />
                    </div>
                    <div
                      className="h-8 w-8 rounded-full bg-gray-200 border-2 border-surface overflow-hidden"
                      title="User avatar 2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="User 2"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4jLiDXDUu_R6fvWHatMBM5DfwiE9KR_mK5veU8Ce1DW5VumYT-gL9kP7JtFMVlUr4iI-4ZwpfGYaPlRDjo8q7tfMT0qeOorab7ONInJ0gI9wjVHjbz3HQPQah_UZRnEbfTr1yaczx7kbREo07IglW13M41QAPav19mdrIn-jIDTgmO6nFcCD4O5IRzlAYGK8Fur60Ld-BqUHlyQMZKtRO0RO-tsss8hC2jdBqITrUM0UvI-RzjZpQNyrjZMCMHqM-HRRFGh4R"
                      />
                    </div>
                    <div
                      className="h-8 w-8 rounded-full bg-gray-200 border-2 border-surface overflow-hidden"
                      title="User avatar 3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="User 3"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC01b5dFDTflRaXIoYRw-9FbKRKm1KlaU6IPN1MrcVkZ6hOrExeb6FPiqU4QAsB6Ax-6qriSnLYdSkmEJdb7CZ6R00LIku8AAFPavYjaxBEn3xq3Iny6RQ85d7ftioG6d6zd_jEs9-0xPZGeL8PAoCcH1XGXpan_c_dO6AKzpSXVo36H42szLezV4tlYgg08kWCNBFpJc8REJErzM0CUUNK6GxwDsPwa7gklXsnrN7jHULNMR2Xmax7UcS5bjkzLIAhqX7pDTNV"
                      />
                    </div>
                  </div>
                  <p>Trusted by 500+ Finance Leaders</p>
                </div>
              </div>
              {/* Isometric Mockup */}
              <div className="relative lg:h-[600px] flex items-center justify-center perspective-container w-full">
                <style dangerouslySetInnerHTML={{ __html: `
                  .isometric-card {
                      transform: perspective(1000px) rotateX(10deg) rotateY(-10deg) rotateZ(2deg);
                      box-shadow: 20px 20px 50px rgba(80, 72, 229, 0.15);
                      transition: transform 0.3s ease;
                  }
                  .isometric-card:hover {
                      transform: perspective(1000px) rotateX(5deg) rotateY(-5deg) rotateZ(1deg) translateY(-10px);
                  }
                `}} />
                <div className="relative w-full max-w-lg isometric-card bg-surface rounded-2xl border border-gray-100 dark:border-white/10 p-6">
                  {/* Header of Mockup */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-xs font-mono text-gray-400">
                      FinSight Analyst Console
                    </div>
                  </div>
                  {/* Chat Interface Mockup */}
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300">
                        <span className="material-symbols-outlined text-sm">
                          person
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 rounded-lg rounded-tl-none p-3 text-sm text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-white/5">
                        Show me revenue by merchant category for Q3 2024.
                        Highlight any anomalies.
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">
                          smart_toy
                        </span>
                      </div>
                      <div className="bg-primary/5 rounded-lg rounded-tr-none p-4 text-sm text-gray-800 dark:text-gray-200 shadow-sm w-full border border-primary/10">
                        <p className="mb-3 font-medium text-primary">
                          Here is the breakdown. I detected a 45% spike in
                          "Electronics" transactions on September 12th.
                        </p>
                        {/* Mini Chart Visual */}
                        <div className="h-32 flex items-end justify-between gap-2 px-2 pb-2 border-l border-b border-gray-200 dark:border-white/10">
                          <div className="w-1/5 bg-primary/40 rounded-t-sm h-[40%]"></div>
                          <div className="w-1/5 bg-primary/60 rounded-t-sm h-[65%]"></div>
                          <div className="w-1/5 bg-primary rounded-t-sm h-[90%] relative group">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              $1.2M (Spike)
                            </div>
                          </div>
                          <div className="w-1/5 bg-primary/50 rounded-t-sm h-[55%]"></div>
                          <div className="w-1/5 bg-primary/30 rounded-t-sm h-[30%]"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                          <span>Jul</span>
                          <span>Aug</span>
                          <span>Sep</span>
                          <span>Oct</span>
                          <span>Nov</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating Element */}
                <div
                  className="absolute -bottom-6 -left-6 bg-surface p-4 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 animate-bounce"
                  style={{ animationDuration: "3s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">
                        System Status
                      </div>
                      <div className="text-sm font-bold text-text-main">
                        All Systems Operational
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Marquee Section */}
        <section className="py-10 border-y border-gray-100 dark:border-white/5 bg-background overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-text-muted">Trusted by Finance Teams at Leading Companies</p>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 30s linear infinite;
              display: flex;
              width: max-content;
            }
          `}} />
          <div className="relative flex w-full overflow-hidden">
            {/* Gradient overlays to smooth edges */}
            <div className="absolute left-0 top-0 z-10 w-32 h-full bg-linear-to-r from-background to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 z-10 w-32 h-full bg-linear-to-l from-background to-transparent pointer-events-none"></div>
            
            <div className="animate-marquee">
              <div className="flex items-center justify-around gap-16 px-8 text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-500 opacity-60">
                <span className="font-serif">Stripe</span>
                <span className="font-sans italic">VISA</span>
                <span className="font-sans tracking-tight">Shopify</span>
                <span className="font-mono">coinbase</span>
                <span className="font-sans font-black">Square</span>
                <span className="font-sans italic tracking-tighter">PayPal</span>
                <span className="font-sans font-semibold whitespace-nowrap">REVOLUT</span>
                <span className="font-serif font-black">PLAID</span>
                <span className="font-sans tracking-wide">Brex</span>
                <span className="font-mono font-bold">RAMP</span>
              </div>
              <div className="flex items-center justify-around gap-16 px-8 text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-500 opacity-60">
                <span className="font-serif">Stripe</span>
                <span className="font-sans italic">VISA</span>
                <span className="font-sans tracking-tight">Shopify</span>
                <span className="font-mono">coinbase</span>
                <span className="font-sans font-black">Square</span>
                <span className="font-sans italic tracking-tighter">PayPal</span>
                <span className="font-sans font-semibold whitespace-nowrap">REVOLUT</span>
                <span className="font-serif font-black">PLAID</span>
                <span className="font-sans tracking-wide">Brex</span>
                <span className="font-mono font-bold">RAMP</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-surface">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl max-w-2xl mb-4">
                Enterprise-Grade Intelligence
              </h2>
              <p className="text-lg text-text-muted max-w-2xl">
                FinSight transforms raw payment logs into strategic narratives
                for the modern CFO, enabling data-driven decisions at speed.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined text-2xl">
                    psychology
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-main">
                  Interpret Intent
                </h3>
                <p className="text-text-muted leading-relaxed">
                  Natural language processing deciphers complex transaction
                  anomalies instantly. Ask questions like you would to a human
                  analyst.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined text-2xl">
                    shield_lock
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-main">
                  Proactive Risk Detection
                </h3>
                <p className="text-text-muted leading-relaxed">
                  Identify fraud patterns before they settle. Our real-time
                  heuristic scanning engine monitors thousands of signals per
                  millisecond.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined text-2xl">
                    visibility
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-main">
                  Glass-Box Explainability
                </h3>
                <p className="text-text-muted leading-relaxed">
                  No black boxes. Every AI insight comes with a full audit trail
                  and transparent logic visualization for regulatory compliance.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Data Integrations Section */}
        <section className="py-16 bg-surface overflow-hidden border-t border-gray-200 dark:border-white/10">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-text-muted mb-10">
              Seamlessly integrates with your modern data stack
            </p>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#336791]/10 rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#336791]">
                    database
                  </span>
                </div>
                <span className="font-bold text-xl text-text-main tracking-tight">
                  PostgreSQL
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#29B5E8]/10 rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#29B5E8]">
                    ac_unit
                  </span>
                </div>
                <span className="font-bold text-xl text-text-main tracking-tight">
                  Snowflake
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#47A248]/10 rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#47A248]">
                    energy_savings_leaf
                  </span>
                </div>
                <span className="font-bold text-xl text-text-main tracking-tight">
                  MongoDB
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#4285F4]/10 rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#4285F4]">
                    query_stats
                  </span>
                </div>
                <span className="font-bold text-xl text-text-main tracking-tight">
                  BigQuery
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="py-24 bg-background border-t border-gray-200 dark:border-white/10">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl font-bold text-text-main tracking-tight sm:text-4xl mb-6">
                From Data to Decision in Seconds
              </h2>
              <p className="text-text-muted text-lg">
                A simple three-step process to transform how your organization
                handles payment intelligence.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent -translate-y-12"></div>
              <div className="relative flex flex-col items-center text-center group">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_30px_rgba(80,72,229,0.3)] transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-4xl">
                    cable
                  </span>
                </div>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-gray-200 dark:border-gray-700 text-xs font-bold mb-4 text-text-main">
                  1
                </div>
                <h3 className="text-xl font-bold text-text-main mb-3">Connect</h3>
                <p className="text-text-muted text-sm leading-relaxed px-4">
                  Securely link your payment gateways and data warehouses with
                  one-click OAuth integrations.
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center group">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_30px_rgba(80,72,229,0.3)] transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-4xl">
                    search_insights
                  </span>
                </div>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-gray-200 dark:border-gray-700 text-xs font-bold mb-4 text-text-main">
                  2
                </div>
                <h3 className="text-xl font-bold text-text-main mb-3">Query</h3>
                <p className="text-text-muted text-sm leading-relaxed px-4">
                  Ask complex financial questions in plain English. Our
                  LLM-engine translates intent to deep analytics.
                </p>
              </div>
              <div className="relative flex flex-col items-center text-center group">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_30px_rgba(80,72,229,0.3)] transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined text-4xl">
                    bolt
                  </span>
                </div>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-gray-200 dark:border-gray-700 text-xs font-bold mb-4 text-text-main">
                  3
                </div>
                <h3 className="text-xl font-bold text-text-main mb-3">Act</h3>
                <p className="text-text-muted text-sm leading-relaxed px-4">
                  Receive automated summaries and direct actions to mitigate
                  risks or optimize your revenue streams.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <section className="py-24 bg-surface border-y border-gray-200 dark:border-white/10">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-text-main mb-4 tracking-tight">
                Trusted by Industry Titans
              </h2>
              <p className="text-text-muted text-lg">
                See how finance executives are leveraging FinSight to drive real business metrics.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-background flex flex-col p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-4 text-8xl text-primary opacity-[0.03] font-serif pt-4 leading-none transition-transform group-hover:scale-110">"</div>
                <div className="flex text-amber-400 mb-6">
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-800">
                    70% Faster Investigations
                  </span>
                </div>
                <p className="text-text-main font-medium italic mb-8 leading-relaxed relative z-10 flex-grow">
                  "FinSight reduced our fraud investigation time by 70%. The ability to query millions of transactions in seconds without SQL is an indispensable part of our workflow."
                </p>
                <div className="flex items-center gap-4 mt-auto border-t border-gray-100 dark:border-white/10 pt-6">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 overflow-hidden relative">
                    <img alt="Sarah Jenkins" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main">Sarah Jenkins</span>
                    <span className="text-xs text-text-muted font-medium">CFO, GlobalPay</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-background flex flex-col p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-4 text-8xl text-primary opacity-[0.03] font-serif pt-4 leading-none transition-transform group-hover:scale-110">"</div>
                <div className="flex text-amber-400 mb-6">
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
                    100% Audit Confidence
                  </span>
                </div>
                <p className="text-text-main font-medium italic mb-8 leading-relaxed relative z-10 flex-grow">
                  "The glass-box explainability feature is a massive game-changer. For the first time, our risk and compliance teams actually trust the AI-generated insights because they can audit the logic."
                </p>
                <div className="flex items-center gap-4 mt-auto border-t border-gray-100 dark:border-white/10 pt-6">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 overflow-hidden relative">
                    <img alt="David Chen" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main">David Chen</span>
                    <span className="text-xs text-text-muted font-medium">VP of Data, Shopify</span>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-background flex flex-col p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden md:col-span-2 lg:col-span-1 group">
                <div className="absolute top-0 right-4 text-8xl text-primary opacity-[0.03] font-serif pt-4 leading-none transition-transform group-hover:scale-110">"</div>
                <div className="flex text-amber-400 mb-6">
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                  <span className="material-symbols-outlined hover:scale-110 transition-transform cursor-default">star</span>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-800">
                    Real-time Threat Response
                  </span>
                </div>
                <p className="text-text-main font-medium italic mb-8 leading-relaxed relative z-10 flex-grow">
                  "Traditional BI tools took days to process ad-hoc queries. FinSight gives me a pulse on our $50B+ volume in real-time. We've caught three major anomalies before they impacted our bottom line."
                </p>
                <div className="flex items-center gap-4 mt-auto border-t border-gray-100 dark:border-white/10 pt-6">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 overflow-hidden relative">
                    <img alt="Marcus Thorne" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-main">Marcus Thorne</span>
                    <span className="text-xs text-text-muted font-medium">Chief Risk Officer, Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA Section */}
        <section className="py-24 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#fff,transparent)] scale-150"></div>
          </div>
          <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl mb-6">
              Ready to lead with clarity?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 mx-auto max-w-2xl font-medium">
              Join 500+ enterprises using FinSight to monitor billions in daily
              volume.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={session ? "/chat" : "/register"}
                className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-white text-primary font-bold rounded-lg shadow-xl hover:bg-gray-50 transition-all text-lg"
              >
                {session ? "Go to Dashboard" : "Start 14-Day Free Trial"}
              </Link>
            </div>
            <p className="mt-6 text-sm text-indigo-200">
              No credit card required. SOC2 Type II Compliant.
            </p>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 bg-surface pt-16 pb-8">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-sm">
                    analytics
                  </span>
                </div>
                <span className="font-bold text-lg text-text-main">FinSight</span>
              </div>
              <p className="text-sm text-text-muted max-w-xs mb-6">
                Empowering finance teams with AI-driven insights for a smarter,
                safer financial future.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Features
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Integrations
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Enterprise
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Changelog
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Documentation
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    API Reference
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Blog
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Community
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    About
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Careers
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Legal
                  </span>
                </li>
                <li>
                  <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                    Contact
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-muted">
              © 2024 FinSight Analytics, Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                Privacy Policy
              </span>
              <span className="text-sm text-text-muted hover:text-primary transition-colors cursor-default">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}