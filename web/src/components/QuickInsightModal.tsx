"use client";

import React from 'react';
import { X, TrendingUp, ShieldAlert, Clock } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface NameValue { name: string; value: number; [k: string]: any; }

export type InsightType = 'revenue' | 'fraud' | 'peak_hours';

export interface InsightData {
  type: InsightType;
  title: string;
  // Revenue
  revenueByCategory?: NameValue[];
  // Fraud
  fraudByState?: NameValue[];
  fraudByDevice?: NameValue[];
  fraudByCategory?: NameValue[];
  fraudSummary?: { total: number; rate: number };
  // Peak Hours
  hourlyTrend?: NameValue[];
  peakHours?: NameValue[];
  hourlySuccessRate?: NameValue[];
}

// ─── Helpers ────────────────────────────────────────────────────────
function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}
function num(v: number) { return v.toLocaleString('en-IN'); }
function pct(v: number) { return `${v.toFixed(1)}%`; }

function HBar({ items, maxVal, color }: { items: NameValue[]; maxVal: number; color: string }) {
  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.name} className="flex items-center gap-2 text-xs group">
          <span className="w-24 truncate text-slate-600 dark:text-slate-400 font-medium" title={it.name}>{it.name}</span>
          <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all duration-500 group-hover:brightness-110`}
              style={{ width: `${Math.max((it.value / maxVal) * 100, 2)}%` }} />
          </div>
          <span className="w-14 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">{num(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Revenue Section ────────────────────────────────────────────────
function RevenueInsight({ data }: { data: InsightData }) {
  const cats = data.revenueByCategory || [];
  const totalRev = cats.reduce((s, c) => s + (c.revenue || 0), 0) || 1;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800/30">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{fmt(totalRev)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800/30">
          <p className="text-[10px] uppercase tracking-wider text-blue-600 font-medium">Categories</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{cats.length}</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl p-3 text-center border border-violet-200 dark:border-violet-800/30">
          <p className="text-[10px] uppercase tracking-wider text-violet-600 font-medium">Top Sector</p>
          <p className="text-sm font-bold text-violet-700 dark:text-violet-400 mt-1 truncate">{cats[0]?.name || '-'}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Category</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Txns</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
              <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Avg Ticket</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase w-28">Share</th>
            </tr>
          </thead>
          <tbody>
            {cats.map(c => {
              const share = ((c.revenue || 0) / totalRev) * 100;
              return (
                <tr key={c.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-2 font-semibold text-slate-700 dark:text-slate-200">{c.name}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{num(c.txn_count || 0)}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-medium text-emerald-600">{fmt(c.revenue || 0)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmt(c.avg_ticket || 0)}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 w-8 text-right tabular-nums">{pct(share)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fraud Section ──────────────────────────────────────────────────
function FraudInsight({ data }: { data: InsightData }) {
  const byCat = data.fraudByCategory || [];
  const byDev = data.fraudByDevice || [];
  const bySt = data.fraudByState || [];
  const summary = data.fraudSummary || { total: 0, rate: 0 };
  const maxCat = Math.max(...byCat.map(f => f.value), 1);
  const maxDev = Math.max(...byDev.map(f => f.value), 1);
  const maxSt = Math.max(...bySt.map(f => f.value), 1);

  return (
    <div className="space-y-5">
      {/* Alert */}
      <div className={`flex items-start gap-3 rounded-xl border p-3 ${summary.rate > 2 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'}`}>
        <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${summary.rate > 2 ? 'text-red-500' : 'text-amber-500'}`} />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{num(summary.total)} fraud-flagged transactions ({pct(summary.rate)} of total)</p>
          <p className="text-xs text-slate-500 mt-0.5">Risk Level: <span className={`font-bold ${summary.rate > 3 ? 'text-red-600' : summary.rate > 1.5 ? 'text-amber-600' : 'text-emerald-600'}`}>{summary.rate > 3 ? 'HIGH' : summary.rate > 1.5 ? 'MEDIUM' : 'LOW'}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By State</h4>
          <HBar items={bySt.slice(0, 6)} maxVal={maxSt} color="bg-red-500" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Device Type</h4>
          <HBar items={byDev} maxVal={maxDev} color="bg-orange-500" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Category</h4>
          <HBar items={byCat.slice(0, 6)} maxVal={maxCat} color="bg-amber-500" />
        </div>
      </div>
    </div>
  );
}

// ─── Peak Hours Section ─────────────────────────────────────────────
function PeakHoursInsight({ data }: { data: InsightData }) {
  const hourly = data.hourlyTrend || [];
  const peaks = data.peakHours || [];
  const successByHour = data.hourlySuccessRate || [];
  const maxH = Math.max(...hourly.map(h => h.value), 1);

  return (
    <div className="space-y-5">
      {/* Peak hours summary */}
      <div className="grid grid-cols-5 gap-2">
        {peaks.slice(0, 5).map((p, i) => (
          <div key={p.name} className={`rounded-xl p-2.5 text-center border ${i === 0 ? 'bg-primary/10 border-primary/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{p.name}:00</p>
            <p className="text-[10px] text-slate-400">{num(p.value)} txns</p>
            {i === 0 && <p className="text-[9px] text-primary font-bold mt-0.5 uppercase">Peak Hour</p>}
          </div>
        ))}
      </div>

      {/* Hourly bar chart */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">24-Hour Volume Distribution</h4>
        <div className="flex items-end gap-0.5 h-28">
          {hourly.map(h => {
            const height = (h.value / maxH) * 100;
            const isPeak = peaks.slice(0, 3).some(p => p.name === h.name);
            return (
              <div key={h.name} className="flex-1 flex flex-col items-center group" title={`${h.name}:00 — ${num(h.value)} txns`}>
                <span className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 tabular-nums">{num(h.value)}</span>
                <div className="w-full relative" style={{ height: '80px' }}>
                  <div className={`absolute bottom-0 w-full rounded-t-sm transition-colors ${isPeak ? 'bg-primary' : 'bg-primary/40'} group-hover:bg-primary`}
                    style={{ height: `${height}%` }} />
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5">{Number(h.name) % 3 === 0 ? h.name : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success rate by hour */}
      {successByHour.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Success Rate by Hour</h4>
          <div className="flex items-end gap-0.5 h-16">
            {successByHour.map(h => {
              const height = h.value; // already a percentage
              return (
                <div key={h.name} className="flex-1 flex flex-col items-center group" title={`${h.name}:00 — ${pct(h.value)} success`}>
                  <div className="w-full relative" style={{ height: '48px' }}>
                    <div className={`absolute bottom-0 w-full rounded-t-sm ${h.value > 90 ? 'bg-emerald-500/60 group-hover:bg-emerald-500' : h.value > 80 ? 'bg-amber-500/60 group-hover:bg-amber-500' : 'bg-red-500/60 group-hover:bg-red-500'} transition-colors`}
                      style={{ height: `${height}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-0.5">
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────
const ICONS: Record<InsightType, React.ElementType> = {
  revenue: TrendingUp,
  fraud: ShieldAlert,
  peak_hours: Clock,
};

export function QuickInsightModal({ data, loading, onClose }: {
  data: InsightData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const Icon = data ? ICONS[data.type] : TrendingUp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{data?.title || 'Loading...'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Analyzing data...</p>
            </div>
          ) : data?.type === 'revenue' ? (
            <RevenueInsight data={data} />
          ) : data?.type === 'fraud' ? (
            <FraudInsight data={data} />
          ) : data?.type === 'peak_hours' ? (
            <PeakHoursInsight data={data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
