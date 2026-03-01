'use client';

import React from "react";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function DashboardPage() {
  const router = useRouter();

  const handleAnalyze = (query: string) => {
    // Redirect to chat with the query parameter so the AI automatically runs it
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      <Navbar />
      
      <main className="p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Briefing
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Real-time business intelligence and ML-powered strategic simulations.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-2">
             <ExecutiveDashboard onAnalyze={handleAnalyze} />
          </div>
        </div>
      </main>
    </div>
  );
}