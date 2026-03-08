import React, { useState } from 'react';
import {
  Printer, X, ChevronDown, ChevronRight, TrendingUp,
  ShieldAlert, Building2, Smartphone, Wifi, Users,
  ShoppingBag, Clock, CalendarDays, AlertTriangle,
  BarChart3, CheckCircle2, XCircle, RefreshCw, Zap
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface ReportKPI {
  totalTransactions: number;
  totalVolume: number;
  avgAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
  successVolume: number;
  fraudCount: number;
  fraudRate: number;
  successRate: number;
}

interface NameValue {
  name: string;
  value: number;
  [k: string]: any;
}

interface ReportData {
  kpi: ReportKPI;
  hourlyTrend: NameValue[];
  dailyPattern: NameValue[];
  topStates: NameValue[];
  topBanks: NameValue[];
  revenueByCategory: NameValue[];
  devices: NameValue[];
  networks: NameValue[];
  demographics: NameValue[];
  transactionTypes: NameValue[];
  statusDistribution: NameValue[];
  fraudByCategory: NameValue[];
  fraudByDevice: NameValue[];
  fraudByNetwork: NameValue[];
}

// ─── Helpers ────────────────────────────────────────────────────────
function fmt(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
}
function num(v: number) { return v.toLocaleString('en-IN'); }
function pct(v: number) { return `${v.toFixed(1)}%`; }

function riskColor(rate: number) {
  if (rate > 3) return 'text-red-600 dark:text-red-400';
  if (rate > 1.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function riskBadge(rate: number) {
  if (rate > 3) return { label: 'HIGH', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
  if (rate > 1.5) return { label: 'MEDIUM', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
  return { label: 'LOW', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' };
}

// ─── Collapsible Section ────────────────────────────────────────────
function Section({
  title, icon: Icon, children, defaultOpen = true, badge
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">{title}</span>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{badge}</span>}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Mini SVG Charts ────────────────────────────────────────────────
function SparkArea({ data, height = 60 }: { data: NameValue[]; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 200;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = height - (d.value / max) * (height - 4);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(' ')} ${w},${height}`} fill="url(#reportGrad)" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--color-primary, #6366f1)" strokeWidth="1.5" />
    </svg>
  );
}

function HorizBar({ items, maxVal, color = 'bg-primary' }: { items: NameValue[]; maxVal: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-2 text-xs group">
          <span className="w-20 truncate text-slate-500 dark:text-slate-400" title={item.name}>{item.name}</span>
          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all duration-700 group-hover:brightness-110`} style={{ width: `${Math.max((item.value / maxVal) * 100, 2)}%` }} />
          </div>
          <span className="w-12 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">{num(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ items, size = 100 }: { items: NameValue[]; size?: number }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const colors = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];
  const r = 38; const cx = 50; const cy = 50; const stroke = 12;

  // Pre-compute path data to avoid mutation during render
  const paths = items.reduce<{ name: string; d: string; color: string; cumAngle: number }[]>((acc, item, i) => {
    const prevAngle = acc.length > 0 ? acc[acc.length - 1].cumAngle : -90;
    const angle = (item.value / total) * 360;
    const startAngle = prevAngle;
    const endAngle = prevAngle + angle;
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
    const large = angle > 180 ? 1 : 0;
    acc.push({
      name: item.name,
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: colors[i % colors.length],
      cumAngle: endAngle,
    });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {paths.map((p) => (
          <path key={p.name} d={p.d}
            fill={p.color} opacity="0.85" className="hover:opacity-100 transition-opacity" />
        ))}
        <circle cx={cx} cy={cy} r={r - stroke} fill="white" className="dark:fill-slate-900" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-800 dark:fill-white text-[10px] font-bold">{num(total)}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-slate-400 text-[5px]">TOTAL</text>
      </svg>
      <div className="space-y-1 text-xs">
        {items.slice(0, 6).map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[100px]">{item.name}</span>
            <span className="font-mono text-slate-500 ml-auto">{pct(item.value / total * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Report ────────────────────────────────────────────────────
export function BoardroomReport({ data, onClose }: { data: ReportData; onClose: () => void }) {
  const { kpi } = data;
  const declineRate = ((kpi.failedCount / Math.max(kpi.totalTransactions, 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl relative flex flex-col">
        
        {/* Header Actions */}
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">InsightsX Boardroom Report</h2>
              <p className="text-[11px] text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors text-xs font-medium">
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full" id="report-content">

          {/* ── REPORT TITLE ── */}
          <div className="border-b-2 border-primary/30 pb-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Automated Payments Intelligence</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Comprehensive UPI analytics across {num(kpi.totalTransactions)} transactions · Generated by InsightsX Engine</p>
          </div>

          {/* ── EXECUTIVE KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard label="Total Volume" value={fmt(kpi.totalVolume)} sub={`${num(kpi.totalTransactions)} transactions`} icon={TrendingUp} accent="text-emerald-500" />
            <KPICard label="Success Rate" value={pct(kpi.successRate)} sub={`${num(kpi.successCount)} succeeded`} icon={CheckCircle2} accent={kpi.successRate > 90 ? 'text-emerald-500' : 'text-amber-500'} />
            <KPICard label="Decline Rate" value={pct(declineRate)} sub={`${num(kpi.failedCount)} failed`} icon={XCircle} accent={declineRate > 5 ? 'text-red-500' : 'text-amber-500'} />
            <KPICard label="Fraud Flags" value={num(kpi.fraudCount)} sub={`${pct(kpi.fraudRate)} flagged`} icon={ShieldAlert} accent="text-red-500" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard label="Settled TPV" value={fmt(kpi.successVolume)} sub="Successful volume" icon={Zap} accent="text-primary" />
            <KPICard label="Avg. Transaction" value={fmt(kpi.avgAmount)} sub="Per txn average" icon={BarChart3} accent="text-blue-500" />
            <KPICard label="Pending" value={num(kpi.pendingCount)} sub="Awaiting settlement" icon={RefreshCw} accent="text-amber-500" />
            <KPICard label="Refunded" value={num(kpi.refundedCount)} sub="Returned to sender" icon={RefreshCw} accent="text-purple-500" />
          </div>

          {/* ── TRANSACTION STATUS OVERVIEW ── */}
          <Section title="Transaction Status Overview" icon={CheckCircle2} badge={`${pct(kpi.successRate)} success`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Distribution</h4>
                <DonutChart items={data.statusDistribution} size={120} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Counts</h4>
                <div className="space-y-3">
                  {data.statusDistribution.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.name === 'SUCCESS' ? 'bg-emerald-500' : s.name === 'FAILED' ? 'bg-red-500' : s.name === 'PENDING' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold tabular-nums">{num(s.value)}</span>
                        <span className="text-xs text-slate-400 ml-1.5">{pct(s.value / kpi.totalTransactions * 100)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* ── VOLUME TRENDS ── */}
          <Section title="Transaction Volume Trends" icon={Clock} badge="24-hour cycle">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hourly Volume Pattern</h4>
                <SparkArea data={data.hourlyTrend} height={80} />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Day-of-Week Pattern</h4>
                <div className="flex items-end gap-2 h-20">
                  {data.dailyPattern.map(day => {
                    const maxD = Math.max(...data.dailyPattern.map(d => d.value), 1);
                    const h = (day.value / maxD) * 100;
                    return (
                      <div key={day.name} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{num(day.value)}</span>
                        <div className="w-full relative" style={{ height: '50px' }}>
                          <div className="absolute bottom-0 w-full bg-primary/70 rounded-t-sm group-hover:bg-primary transition-colors" style={{ height: `${h}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{day.name.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          {/* ── GEOGRAPHIC PERFORMANCE ── */}
          <Section title="Geographic Performance Scorecard" icon={Building2} badge={`${data.topStates.length} states`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">#</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">State</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Transactions</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Volume</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Success Rate</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Fraud Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topStates.map((st, i) => {
                    const risk = riskBadge(st.fraud_rate || 0);
                    return (
                      <tr key={st.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-2 text-slate-400 font-medium">{i + 1}</td>
                        <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-200">{st.name}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{num(st.total || 0)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-medium">{fmt(st.volume || 0)}</td>
                        <td className={`py-2.5 px-2 text-right tabular-nums font-medium ${(st.success_rate || 0) > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct(st.success_rate || 0)}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${risk.cls}`}>{risk.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── BANKING INFRASTRUCTURE ── */}
          <Section title="Banking Infrastructure Scorecard" icon={Building2} badge="Top 10 Banks">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Bank</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Success</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Failed</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topBanks.map(bank => (
                    <tr key={bank.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-200">{bank.name}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{num(bank.total || 0)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-emerald-600">{num(bank.success || 0)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-red-500">{num(bank.failed || 0)}</td>
                      <td className={`py-2.5 px-2 text-right tabular-nums font-medium ${(bank.success_rate || 0) > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct(bank.success_rate || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── MERCHANT SECTOR ANALYSIS ── */}
          <Section title="Merchant Sector Revenue Analysis" icon={ShoppingBag} badge="Revenue breakdown">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Transactions</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Avg. Ticket</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase w-32">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByCategory.map(cat => {
                    const totalRev = data.revenueByCategory.reduce((s, c) => s + (c.revenue || 0), 0) || 1;
                    const share = ((cat.revenue || 0) / totalRev) * 100;
                    return (
                      <tr key={cat.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-200">{cat.name}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{num(cat.txn_count || 0)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-medium text-emerald-600">{fmt(cat.revenue || 0)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{fmt(cat.avg_ticket || 0)}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-400 w-8 text-right tabular-nums">{pct(share)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── TRANSACTION TYPES ── */}
          <Section title="Transaction Type Distribution" icon={BarChart3} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Count</h4>
                <DonutChart items={data.transactionTypes} size={110} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Volume per Type</h4>
                <HorizBar items={data.transactionTypes.map(t => ({ name: t.name, value: t.volume || 0 }))} maxVal={Math.max(...data.transactionTypes.map(t => t.volume || 0), 1)} color="bg-violet-500" />
              </div>
            </div>
          </Section>

          {/* ── FRAUD INTELLIGENCE ── */}
          <Section title="Fraud Intelligence Report" icon={ShieldAlert} badge={`${num(kpi.fraudCount)} flags`}>
            <div className={`flex items-start gap-3 rounded-xl border p-3 mb-4 ${kpi.fraudRate > 2 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${kpi.fraudRate > 2 ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{num(kpi.fraudCount)} transactions flagged ({pct(kpi.fraudRate)} of total)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Risk Level: <span className={`font-bold ${riskColor(kpi.fraudRate)}`}>{riskBadge(kpi.fraudRate).label}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">By Merchant Category</h4>
                <HorizBar items={data.fraudByCategory.slice(0, 5)} maxVal={Math.max(...data.fraudByCategory.map(f => f.value), 1)} color="bg-red-500" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">By Device Type</h4>
                <HorizBar items={data.fraudByDevice} maxVal={Math.max(...data.fraudByDevice.map(f => f.value), 1)} color="bg-orange-500" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">By Network Type</h4>
                <HorizBar items={data.fraudByNetwork} maxVal={Math.max(...data.fraudByNetwork.map(f => f.value), 1)} color="bg-amber-500" />
              </div>
            </div>
          </Section>

          {/* ── DIGITAL INFRASTRUCTURE ── */}
          <Section title="Digital Infrastructure Analysis" icon={Smartphone} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Device Distribution</h4>
                <DonutChart items={data.devices} size={110} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Network Distribution</h4>
                <DonutChart items={data.networks} size={110} />
              </div>
            </div>
          </Section>

          {/* ── CONSUMER DEMOGRAPHICS ── */}
          <Section title="Consumer Demographics Profile" icon={Users} defaultOpen={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Age Group</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Transactions</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Total Volume</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">Avg. Ticket</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase w-24">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.demographics.map(d => {
                    const totalD = data.demographics.reduce((s, x) => s + (x.total || 0), 0) || 1;
                    return (
                      <tr key={d.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-200">{d.name}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{num(d.total || 0)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-medium">{fmt(d.total_volume || 0)}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{fmt(d.avg_amount || 0)}</td>
                        <td className="py-2.5 px-2">
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${((d.total || 0) / totalD) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── STRATEGIC ANALYSIS ── */}
          <Section title="Strategic Analysis & Recommendations" icon={TrendingUp}>
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h4 className="text-sm font-bold text-primary mb-2">Key Findings</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside mb-0">
                  <li><strong>Revenue Leader:</strong> {data.revenueByCategory[0]?.name || 'N/A'} dominates with {fmt(data.revenueByCategory[0]?.revenue || 0)} in settled volume, indicating strong consumer engagement.</li>
                  <li><strong>Market Leader:</strong> {data.topStates[0]?.name || 'N/A'} generates the highest UPI volume at {fmt(data.topStates[0]?.volume || 0)} with a {pct(data.topStates[0]?.success_rate || 0)} success rate.</li>
                  <li><strong>Banking Infrastructure:</strong> {data.topBanks[0]?.name || 'N/A'} leads with {num(data.topBanks[0]?.total || 0)} transactions and a {pct(data.topBanks[0]?.success_rate || 0)} success rate.</li>
                  <li><strong>Network Health:</strong> The overall decline rate is {pct(declineRate)}, with {num(kpi.failedCount)} failed transactions requiring infrastructure optimization.</li>
                  <li><strong>Fraud Posture:</strong> {num(kpi.fraudCount)} transactions flagged ({pct(kpi.fraudRate)}). Top affected category: {data.fraudByCategory[0]?.name || 'N/A'}.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">Strengths</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{pct(kpi.successRate)} success rate with {fmt(kpi.successVolume)} settled volume demonstrates robust payment infrastructure.</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Areas to Monitor</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{num(kpi.pendingCount)} pending transactions and {pct(declineRate)} decline rate warrant continuous monitoring.</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3">
                  <h5 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-1">Risk Factors</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Fraud flags at {pct(kpi.fraudRate)} with {data.fraudByCategory[0]?.name || 'N/A'} category most affected — rule calibration recommended.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── FOOTER ── */}
          <div className="pt-6 text-center text-slate-400 text-[11px] border-t border-slate-100 dark:border-slate-800 space-y-1">
            <p>Generated securely via In-Browser WASM Analytics — Zero Data Exfiltration</p>
            <p className="font-semibold text-slate-300 uppercase tracking-wider">CONFIDENTIAL · FOR INTERNAL USE ONLY</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3.5 hover:border-primary/30 transition-colors group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${accent} opacity-70 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</div>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
