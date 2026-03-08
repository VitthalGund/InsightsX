"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { Loader2, TrendingUp, AlertTriangle, ShieldAlert, Map as MapIcon } from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { StateAnalysisModal, type StateAnalysisData } from './StateAnalysisModal';
import { BoardroomReport } from './BoardroomReport';

const INDIA_TOPO_JSON = "/india_v5.geojson";
const STATE_ANALYSIS_JSON = "/state-analysis.json";

interface ExecutiveDashboardProps {
  onAnalyze: (query: string) => void;
}

interface KPIState {
  tpv: number | null;
  declineRate: number | null;
  fraudFlags: number | null;
  topState: { state: string; volume: number } | null;
  stateVolumes: Record<string, number>;
}

// Pre-generated analysis data shape (includes aiSummary)
interface PreGeneratedStateData extends StateAnalysisData {
  aiSummary: string;
}

export function ExecutiveDashboard({ onAnalyze }: ExecutiveDashboardProps) {
  const { db, loading: dbLoading } = useDuckDB();
  const [kpis, setKpis] = useState<KPIState>({
    tpv: null,
    declineRate: null,
    fraudFlags: null,
    topState: null,
    stateVolumes: {}
  });
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState<any>(null);

  // Pre-loaded state analysis data
  const [allStateAnalysis, setAllStateAnalysis] = useState<Record<string, PreGeneratedStateData> | null>(null);

  // Modal state
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Boardroom Report state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Load geo data
  useEffect(() => {
    fetch(INDIA_TOPO_JSON)
      .then(res => res.json())
      .then(data => setGeoData(data.features || data))
      .catch(console.error);
  }, []);

  // Load pre-generated state analysis JSON
  useEffect(() => {
    fetch(STATE_ANALYSIS_JSON)
      .then(res => res.json())
      .then(data => setAllStateAnalysis(data))
      .catch(err => console.error("Failed to load state analysis:", err));
  }, []);

  // Load KPIs from DuckDB
  useEffect(() => {
    async function fetchKPIs() {
      if (!db || dbLoading) return;
      try {
        setLoading(true);
        const conn = await db.connect();

        const tpvResult = await conn.query(`SELECT SUM(amount_inr) as tpv FROM transactions WHERE transaction_status = 'SUCCESS'`);
        const tpv = Number(tpvResult.get(0)?.tpv || 0);

        const declineResult = await conn.query(`
          SELECT 
            CAST(SUM(CASE WHEN transaction_status = 'FAILED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as decline_rate 
          FROM transactions
        `);
        const declineRate = Number(declineResult.get(0)?.decline_rate || 0);

        const fraudResult = await conn.query(`SELECT SUM(fraud_flag) as fraud_count FROM transactions`);
        const fraudFlags = Number(fraudResult.get(0)?.fraud_count || 0);

        const stateResult = await conn.query(`
          SELECT sender_state, SUM(amount_inr) as volume 
          FROM transactions 
          WHERE transaction_status = 'SUCCESS' 
          GROUP BY sender_state 
          ORDER BY volume DESC
        `);
        
        const stateVolumes: Record<string, number> = {};
        for (let i = 0; i < stateResult.numRows; i++) {
          const row = stateResult.get(i);
          if (row?.sender_state && row?.volume) {
            stateVolumes[row.sender_state.toString()] = Number(row.volume);
          }
        }
        
        const topState = Object.keys(stateVolumes).length > 0 
          ? { state: Object.keys(stateVolumes)[0], volume: stateVolumes[Object.keys(stateVolumes)[0]] }
          : null;

        setKpis({ tpv, declineRate, fraudFlags, topState, stateVolumes });
        await conn.close();
      } catch (err) {
        console.error("Failed to load KPIs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, [db, dbLoading]);

  // ─── Boardroom Report Generation ──────────────────────────────────
  const generateBoardroomReport = useCallback(async () => {
    if (!db || isGeneratingReport) return;
    setIsGeneratingReport(true);
    try {
      const conn = await db.connect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toRows = (result: any) => {
        const rows: { name: string; value: number; [k: string]: any }[] = [];
        for (let i = 0; i < result.numRows; i++) {
          const row = result.get(i);
          if (row) {
            const obj: any = {};
            for (const [k, v] of Object.entries(row.toJSON ? row.toJSON() : row)) {
              obj[k] = typeof v === 'bigint' ? Number(v) : v;
            }
            rows.push(obj as any);
          }
        }
        return rows;
      };

      // 1. Core KPIs
      const kpiRes = await conn.query(`SELECT
        CAST(COUNT(*) AS INTEGER) as total_txns,
        CAST(SUM(amount_inr) AS DOUBLE) as total_volume,
        CAST(AVG(amount_inr) AS DOUBLE) as avg_amount,
        CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS INTEGER) as success_count,
        CAST(SUM(CASE WHEN transaction_status='FAILED' THEN 1 ELSE 0 END) AS INTEGER) as failed_count,
        CAST(SUM(CASE WHEN transaction_status='PENDING' THEN 1 ELSE 0 END) AS INTEGER) as pending_count,
        CAST(SUM(CASE WHEN transaction_status='REFUNDED' THEN 1 ELSE 0 END) AS INTEGER) as refunded_count,
        CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN amount_inr ELSE 0 END) AS DOUBLE) as success_volume,
        CAST(SUM(fraud_flag) AS INTEGER) as fraud_count,
        CAST(SUM(fraud_flag) AS FLOAT) / COUNT(*) * 100 as fraud_rate,
        CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as success_rate
      FROM transactions`);
      const kpi = kpiRes.get(0);

      // 2. Hourly Volume Trend
      const hourlyRes = await conn.query(`SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions GROUP BY hour_of_day ORDER BY hour_of_day`);
      const hourlyTrend = toRows(hourlyRes);

      // 3. Daily Pattern
      const dailyRes = await conn.query(`SELECT day_of_week as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions GROUP BY day_of_week ORDER BY CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END`);
      const dailyPattern = toRows(dailyRes);

      // 4. Top States (full table)
      const statesRes = await conn.query(`SELECT sender_state as name,
        CAST(COUNT(*) AS INTEGER) as total,
        CAST(SUM(amount_inr) AS DOUBLE) as volume,
        CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as success_rate,
        CAST(SUM(fraud_flag) AS FLOAT) / COUNT(*) * 100 as fraud_rate
      FROM transactions GROUP BY sender_state ORDER BY volume DESC LIMIT 10`);
      const topStates = toRows(statesRes);

      // 5. Top Banks
      const banksRes = await conn.query(`SELECT sender_bank as name,
        CAST(COUNT(*) AS INTEGER) as total,
        CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS INTEGER) as success,
        CAST(SUM(CASE WHEN transaction_status='FAILED' THEN 1 ELSE 0 END) AS INTEGER) as failed,
        CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as success_rate
      FROM transactions GROUP BY sender_bank ORDER BY total DESC LIMIT 10`);
      const topBanks = toRows(banksRes);

      // 6. Revenue by Category
      const revCatRes = await conn.query(`SELECT merchant_category as name,
        CAST(COUNT(*) AS INTEGER) as txn_count,
        CAST(SUM(amount_inr) AS DOUBLE) as revenue,
        CAST(AVG(amount_inr) AS DOUBLE) as avg_ticket
      FROM transactions WHERE transaction_status='SUCCESS' GROUP BY merchant_category ORDER BY revenue DESC`);
      const revenueByCategory = toRows(revCatRes);

      // 7. Device Type
      const deviceRes = await conn.query(`SELECT device_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions GROUP BY device_type ORDER BY value DESC`);
      const devices = toRows(deviceRes);

      // 8. Network Type
      const networkRes = await conn.query(`SELECT network_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions GROUP BY network_type ORDER BY value DESC`);
      const networks = toRows(networkRes);

      // 9. Age Demographics
      const demoRes = await conn.query(`SELECT sender_age_group as name,
        CAST(COUNT(*) AS INTEGER) as total,
        CAST(AVG(amount_inr) AS DOUBLE) as avg_amount,
        CAST(SUM(amount_inr) AS DOUBLE) as total_volume
      FROM transactions GROUP BY sender_age_group ORDER BY total DESC`);
      const demographics = toRows(demoRes);

      // 10. Transaction Types
      const txTypeRes = await conn.query(`SELECT transaction_type as name, CAST(COUNT(*) AS INTEGER) as value, CAST(SUM(amount_inr) AS DOUBLE) as volume FROM transactions GROUP BY transaction_type ORDER BY value DESC`);
      const transactionTypes = toRows(txTypeRes);

      // 11. Fraud by dimension
      const fraudByCat = await conn.query(`SELECT merchant_category as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE fraud_flag=1 GROUP BY merchant_category ORDER BY value DESC`);
      const fraudByDevice = await conn.query(`SELECT device_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE fraud_flag=1 GROUP BY device_type ORDER BY value DESC`);
      const fraudByNetwork = await conn.query(`SELECT network_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE fraud_flag=1 GROUP BY network_type ORDER BY value DESC`);

      // 12. Status distribution
      const statusRes = await conn.query(`SELECT transaction_status as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions GROUP BY transaction_status ORDER BY value DESC`);
      const statusDistribution = toRows(statusRes);

      await conn.close();

      setReportData({
        kpi: {
          totalTransactions: Number(kpi?.total_txns || 0),
          totalVolume: Number(kpi?.total_volume || 0),
          avgAmount: Number(kpi?.avg_amount || 0),
          successCount: Number(kpi?.success_count || 0),
          failedCount: Number(kpi?.failed_count || 0),
          pendingCount: Number(kpi?.pending_count || 0),
          refundedCount: Number(kpi?.refunded_count || 0),
          successVolume: Number(kpi?.success_volume || 0),
          fraudCount: Number(kpi?.fraud_count || 0),
          fraudRate: Number(kpi?.fraud_rate || 0),
          successRate: Number(kpi?.success_rate || 0),
        },
        hourlyTrend, dailyPattern, topStates, topBanks,
        revenueByCategory, devices, networks, demographics,
        transactionTypes, statusDistribution,
        fraudByCategory: toRows(fraudByCat),
        fraudByDevice: toRows(fraudByDevice),
        fraudByNetwork: toRows(fraudByNetwork),
      });
    } catch (err) {
      console.error('Failed to generate boardroom report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [db, isGeneratingReport]);

  // ─── Handle map click: instant lookup from pre-loaded JSON ────────
  const handleStateClick = (stateName: string) => {
    if (!stateName) return;
    // Try exact match first, then case-insensitive
    const key = allStateAnalysis
      ? Object.keys(allStateAnalysis).find(
          k => k.toLowerCase() === stateName.toLowerCase()
        )
      : null;
    if (key) {
      setSelectedState(key);
    } else {
      // State not in pre-generated data — still show modal with a message
      setSelectedState(stateName);
    }
  };

  // Get data for the currently selected state
  const selectedData = selectedState && allStateAnalysis
    ? allStateAnalysis[selectedState] || null
    : null;
  const selectedSummary = selectedData?.aiSummary || null;

  // ─── Color scale ──────────────────────────────────────────────────
  const volumes = Object.values(kpis.stateVolumes);
  const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 1;
  
  const colorScale = scaleLinear<string>()
    .domain([0, maxVolume])
    .range(["#f0fdf4", "#166534"]);

  if (dbLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Gathering Executive Insights...</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* KPI Cards — display only, no click redirect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Payment Volume</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{kpis.tpv !== null ? formatCurrency(kpis.tpv) : '---'}</div>
            <p className="text-xs text-slate-400 mt-1">Settled successful transactions</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium text-slate-500">Decline Rate</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{kpis.declineRate !== null ? `${kpis.declineRate.toFixed(1)}%` : '---'}</div>
            <p className="text-xs text-slate-400 mt-1">Across all network types</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5" />
          <div className="flex flex-row items-center justify-between p-6 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-slate-500">Active Fraud Flags</h3>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="p-6 pt-0 relative z-10">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis.fraudFlags?.toLocaleString() || '---'}</div>
            <p className="text-xs text-slate-400 mt-1">Requires immediate attention</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium text-slate-500">Top Performing State</h3>
            <MapIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold truncate" title={kpis.topState?.state || '---'}>
              {kpis.topState?.state || '---'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {kpis.topState ? formatCurrency(kpis.topState.volume) : '---'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Geospatial Volume Heatmap</h3>
            <p className="text-sm text-slate-500">Transaction distribution across India. Click a region to analyze.</p>
          </div>
          <div className="p-6 pt-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg m-6 mt-0">
             <div className="w-full h-[350px] overflow-hidden">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 1000,
                    center: [80, 22]
                  }}
                  className="w-full h-full"
                >
                  {geoData && (
                    <Geographies geography={geoData}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const geoName: string = geo.properties.st_nm || geo.properties.NAME_1 || geo.properties.name || "";
                          const stateEntry = Object.entries(kpis.stateVolumes).find(([st]) => 
                            geoName.toLowerCase() === st.toLowerCase() ||
                            geoName.replace(/&/g, "and").toLowerCase() === st.toLowerCase() ||
                            st.toLowerCase().includes(geoName.toLowerCase())
                          );
                          const stateName = stateEntry ? stateEntry[0] : "";
                          const volume = stateEntry ? stateEntry[1] : 0;
                          const fill = volume > 0 ? colorScale(volume) : "#f1f5f9";
                          return (
                            <Geography
                              key={geo.rsmKey || geo.properties.name}
                              geography={geo}
                              fill={fill}
                              stroke="#cbd5e1"
                              strokeWidth={0.5}
                              className="transition-all hover:opacity-80 hover:stroke-primary focus:outline-none cursor-pointer"
                              onClick={() => {
                                if (stateName) handleStateClick(stateName);
                              }}
                              onMouseEnter={() => {}}
                            />
                          );
                        })
                      }
                    </Geographies>
                  )}
                </ComposableMap>
             </div>
          </div>
        </div>
        
        {/* Quick Insights — KEEPS onAnalyze redirect to chat */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Quick Insights</h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
             <div 
               className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               onClick={() => onAnalyze("Detail the anomaly detection: Have there been any recent network failure spikes?")}
             >
               <h4 className="text-sm font-semibold">Network Failures</h4>
               <p className="text-xs text-slate-500 mt-1">Check for 5G vs 4G failure anomalies.</p>
             </div>
             <div 
               className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               onClick={() => onAnalyze("Run the fraud rule stringency simulation. What happens if we tighten rules by 20%?")}
             >
               <h4 className="text-sm font-semibold">Fraud Simulation</h4>
               <p className="text-xs text-slate-500 mt-1">Simulate revenue lost vs fraud prevented.</p>
             </div>
             <div 
               className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               onClick={() => onAnalyze("Simulate an infrastructure outage of 2 hours for our top banking partner.")}
             >
               <h4 className="text-sm font-semibold">Outage Impact</h4>
               <p className="text-xs text-slate-500 mt-1">Test downtime impact on processing.</p>
             </div>
             <div 
               className="p-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:brightness-110 transition-all shadow-md mt-6 text-center flex items-center justify-center gap-2"
               onClick={generateBoardroomReport}
             >
               {isGeneratingReport ? (
                 <><Loader2 className="w-4 h-4 animate-spin" /><h4 className="text-sm font-medium">Generating...</h4></>
               ) : (
                 <h4 className="text-sm font-medium">Generate Boardroom Report</h4>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* State Analysis Modal — instant from pre-loaded JSON */}
      {selectedState && (
        <StateAnalysisModal
          stateName={selectedState}
          data={selectedData}
          aiSummary={selectedSummary}
          loading={false}
          summaryLoading={false}
          onClose={() => setSelectedState(null)}
        />
      )}

      {/* Boardroom Report Modal */}
      {reportData && (
        <BoardroomReport
          data={reportData}
          onClose={() => setReportData(null)}
        />
      )}
    </div>
  );
}
