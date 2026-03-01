import React from "react";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const handleAnalyze = (query: string) => {
    // Redirect to chat with the query parameter
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            InsightsX Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Real-time business intelligence and ML-powered simulations.
          </p>
        </div>

        <ExecutiveDashboard onAnalyze={handleAnalyze} />
      </div>
    </div>
  );
}
