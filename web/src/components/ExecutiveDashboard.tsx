"use client";

import React, { useEffect, useState } from 'react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { Loader2, TrendingUp, AlertTriangle, ShieldAlert, Map as MapIcon } from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const INDIA_TOPO_JSON = "/india_v5.geojson";

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

  useEffect(() => {
    async function fetchKPIs() {
      if (!db || dbLoading) return;
      try {
        setLoading(true);
        const conn = await db.connect();

        // 1. TPV
        const tpvResult = await conn.query(`SELECT SUM(amount_inr) as tpv FROM transactions WHERE transaction_status = 'SUCCESS'`);
        const tpv = Number(tpvResult.get(0)?.tpv || 0);

        // 2. Decline Rate
        const declineResult = await conn.query(`
          SELECT 
            CAST(SUM(CASE WHEN transaction_status = 'FAILED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as decline_rate 
          FROM transactions
        `);
        const declineRate = Number(declineResult.get(0)?.decline_rate || 0);

        // 3. Fraud Flags
        const fraudResult = await conn.query(`SELECT SUM(fraud_flag) as fraud_count FROM transactions`);
        const fraudFlags = Number(fraudResult.get(0)?.fraud_count || 0);

        // 4. Top State & State Volumes
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

  // Determine color scale for map
  const volumes = Object.values(kpis.stateVolumes);
  const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 1;
  
  const colorScale = scaleLinear<string>()
    .domain([0, maxVolume])
    .range(["#f0fdf4", "#166534"]); // Light green to dark green

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group"
          onClick={() => onAnalyze("Give me a detailed breakdown of our Total Payment Volume (TPV) today.")}
        >
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-primary transition-colors">Total Payment Volume</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{kpis.tpv !== null ? formatCurrency(kpis.tpv) : '---'}</div>
            <p className="text-xs text-slate-400 mt-1">Settled successful transactions</p>
          </div>
        </div>

        <div 
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group"
          onClick={() => onAnalyze("Run a diagnostic on our current technical decline rates. What is causing failures?")}
        >
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-primary transition-colors">Decline Rate</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{kpis.declineRate !== null ? `${kpis.declineRate.toFixed(1)}%` : '---'}</div>
            <p className="text-xs text-slate-400 mt-1">Across all network types</p>
          </div>
        </div>

        <div 
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden"
          onClick={() => onAnalyze("Analyze active fraud flags. Which merchants or regions are riskiest?")}
        >
          <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
          <div className="flex flex-row items-center justify-between p-6 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-red-500 transition-colors">Active Fraud Flags</h3>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="p-6 pt-0 relative z-10">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis.fraudFlags?.toLocaleString() || '---'}</div>
            <p className="text-xs text-slate-400 mt-1">Requires immediate attention</p>
          </div>
        </div>

        <div 
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group"
          onClick={() => onAnalyze(`Why is ${kpis.topState?.state || 'our top region'} performing so well? Compare it to the bottom states.`)}
        >
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-primary transition-colors">Top Performing State</h3>
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
                    center: [80, 22] // Center of India
                  }}
                  className="w-full h-full"
                >
                  <Geographies geography={INDIA_TOPO_JSON}>
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
                        const fill = volume > 0 ? colorScale(volume) : "#f1f5f9"; // Default slate-100
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fill}
                            stroke="#cbd5e1"
                            strokeWidth={0.5}
                            className="transition-all hover:opacity-80 hover:stroke-primary focus:outline-none cursor-pointer"
                            onClick={() => onAnalyze(`Analyze transactions in ${stateName || 'this region'}.`)}
                            onMouseEnter={() => {}}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
             </div>
          </div>
        </div>
        
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
               className="p-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:brightness-110 transition-all shadow-md mt-6 text-center"
               onClick={() => onAnalyze("Generate a comprehensive Executive Summary Boardroom Report based on the current data.")}
             >
               <h4 className="text-sm font-medium">Generate Boardroom Report</h4>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
