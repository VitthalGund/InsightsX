"use client";

import React from 'react';
import {
  X, TrendingUp, ShieldAlert, Smartphone, Wifi, Building2,
  Clock, CalendarDays, Users, ShoppingBag, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Sparkles, BarChart3,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
export interface StateAnalysisData {
  overview: {
    totalTransactions: number;
    totalAmount: number;
    avgAmount: number;
    successRate: number;
  };
  statusDistribution: { name: string; value: number }[];
  transactionTypes: { name: string; value: number }[];
  fraud: {
    totalFraud: number;
    fraudRate: number;
    byCategory: { name: string; value: number }[];
  };
  devices: { name: string; value: number }[];
  networks: { name: string; value: number }[];
  banks: { name: string; value: number }[];
  hourlyTrend: { name: string; value: number }[];
  dailyPattern: { name: string; value: number }[];
  demographics: { name: string; value: number }[];
  revenueByCategory: { name: string; value: number }[];
  peakHours: { name: string; value: number }[];
}

interface StateAnalysisModalProps {
  stateName: string;
  data: StateAnalysisData | null;
  aiSummary: string | null;
  loading: boolean;
  summaryLoading: boolean;
  onClose: () => void;
}

// ─── Helper Components ──────────────────────────────────────────────
function MiniBar({ items, colorClass = "bg-emerald-500" }: { items: { name: string; value: number }[]; colorClass?: string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-1.5">
      {items.slice(0, 6).map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="w-24 truncate text-slate-500 dark:text-slate-400" title={item.name}>{item.name}</span>
          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colorClass} transition-all duration-500`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-12 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
            {item.value.toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function StatCard({ label, value, icon: Icon, trend, trendUp }: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/50 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-[11px] mt-0.5 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-700/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// ─── Mini Hourly Sparkline ──────────────────────────────────────────
function HourlySparkline({ data }: { data: { name: string; value: number }[] }) {
  const sorted = [...data].sort((a, b) => Number(a.name) - Number(b.name));
  const max = Math.max(...sorted.map(d => d.value), 1);
  const points = sorted.map((d, i) => {
    const x = (i / (sorted.length - 1 || 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-16 mt-2">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#sparkFill)"
          className="text-primary"
        />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────
export function StateAnalysisModal({ stateName, data, aiSummary, loading, summaryLoading, onClose }: StateAnalysisModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mt-[5vh] mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{stateName}</h2>
              <p className="text-xs text-slate-500">Comprehensive UPI Transaction Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Running analysis for {stateName}...</p>
              <p className="text-xs text-slate-400 mt-1">Querying all data dimensions</p>
            </div>
          ) : data ? (
            <>
              {/* AI Summary */}
              <div className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-purple-50/30 dark:from-primary/10 dark:via-slate-800/50 dark:to-slate-800/30 rounded-xl border border-primary/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Executive Summary</span>
                </div>
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating insight with Ollama...</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aiSummary || 'Summary unavailable.'}
                  </p>
                )}
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Transactions"
                  value={data.overview.totalTransactions.toLocaleString('en-IN')}
                  icon={BarChart3}
                />
                <StatCard
                  label="Total Volume"
                  value={formatCurrency(data.overview.totalAmount)}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Avg. Transaction"
                  value={formatCurrency(data.overview.avgAmount)}
                  icon={ShoppingBag}
                />
                <StatCard
                  label="Success Rate"
                  value={`${data.overview.successRate.toFixed(1)}%`}
                  icon={CheckCircle2}
                  trend={data.overview.successRate > 90 ? 'Healthy' : 'Below target'}
                  trendUp={data.overview.successRate > 90}
                />
              </div>

              {/* Fraud Alert */}
              {data.fraud.fraudRate > 0 && (
                <div className={`flex items-start gap-3 rounded-xl border p-3 ${
                  data.fraud.fraudRate > 2
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${data.fraud.fraudRate > 2 ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {data.fraud.totalFraud} fraud-flagged transactions ({data.fraud.fraudRate.toFixed(2)}% rate)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Top flagged: {data.fraud.byCategory.slice(0, 3).map(c => c.name).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnalysisSection title="Transaction Status" icon={CheckCircle2}>
                  <MiniBar items={data.statusDistribution} colorClass="bg-blue-500" />
                </AnalysisSection>

                <AnalysisSection title="Transaction Types" icon={ShoppingBag}>
                  <MiniBar items={data.transactionTypes} colorClass="bg-violet-500" />
                </AnalysisSection>

                <AnalysisSection title="Device Distribution" icon={Smartphone}>
                  <MiniBar items={data.devices} colorClass="bg-cyan-500" />
                </AnalysisSection>

                <AnalysisSection title="Network Type" icon={Wifi}>
                  <MiniBar items={data.networks} colorClass="bg-teal-500" />
                </AnalysisSection>

                <AnalysisSection title="Top Banks (by volume)" icon={Building2}>
                  <MiniBar items={data.banks} colorClass="bg-indigo-500" />
                </AnalysisSection>

                <AnalysisSection title="Age Demographics" icon={Users}>
                  <MiniBar items={data.demographics} colorClass="bg-pink-500" />
                </AnalysisSection>

                <AnalysisSection title="Revenue by Category" icon={TrendingUp}>
                  <div className="space-y-1.5">
                    {data.revenueByCategory.slice(0, 6).map((item) => {
                      const max = Math.max(...data.revenueByCategory.map(i => i.value), 1);
                      return (
                        <div key={item.name} className="flex items-center gap-2 text-xs">
                          <span className="w-24 truncate text-slate-500 dark:text-slate-400" title={item.name}>{item.name}</span>
                          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${(item.value / max) * 100}%` }}
                            />
                          </div>
                          <span className="w-16 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums text-[11px]">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </AnalysisSection>

                <AnalysisSection title="Fraud by Category" icon={ShieldAlert}>
                  <MiniBar items={data.fraud.byCategory} colorClass="bg-red-500" />
                </AnalysisSection>
              </div>

              {/* Hourly Trend */}
              <AnalysisSection title="Hourly Volume Trend" icon={Clock}>
                <HourlySparkline data={data.hourlyTrend} />
              </AnalysisSection>

              {/* Daily Pattern */}
              <AnalysisSection title="Day-of-Week Pattern" icon={CalendarDays}>
                <div className="flex items-end gap-1.5 h-20 mt-2">
                  {data.dailyPattern.map((day) => {
                    const max = Math.max(...data.dailyPattern.map(d => d.value), 1);
                    const height = (day.value / max) * 100;
                    return (
                      <div key={day.name} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative" style={{ height: '60px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-primary/80 rounded-t-sm transition-all duration-500"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{day.name.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </AnalysisSection>

              {/* Peak Hours */}
              <AnalysisSection title="Peak Transaction Hours" icon={XCircle}>
                <div className="flex flex-wrap gap-2">
                  {data.peakHours.slice(0, 5).map((h, i) => (
                    <div key={h.name} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      i === 0
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}>
                      {h.name}:00 — {h.value.toLocaleString('en-IN')} txns
                    </div>
                  ))}
                </div>
              </AnalysisSection>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <XCircle className="w-8 h-8 mb-3" />
              <p className="text-sm">No analysis data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
