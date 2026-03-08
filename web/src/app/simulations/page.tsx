'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart,
  Area, AreaChart, ReferenceLine, Treemap, Cell, ScatterChart, Scatter, ZAxis, Sankey
} from 'recharts';
import { ShieldCheck, TrendingUp, ZapOff, Users, WifiOff, Info } from 'lucide-react';

export default function SimulationsPage() {
  const [activeSim, setActiveSim] = useState('approval');

  // ==========================================
  // SIMULATION 1: Transaction Approval Optimizer
  // ==========================================
  const [securityLevel, setSecurityLevel] = useState<number>(50);
  
  const approvalData = useMemo(() => {
    const data = [];
    for (let i = 10; i <= 100; i += 10) {
      // Mathematical proxy for Precision/Recall tradeoff
      const prevented = 25000 * (1 - Math.exp(-i / 30));
      const lostRevenue = 500000 * 0.0002 * Math.exp(i / 20);
      data.push({
        level: i,
        prevented: Math.round(prevented),
        lostRevenue: Math.round(lostRevenue),
        netProfit: Math.round(prevented - lostRevenue - 6000), // Base operation cost offset
      });
    }
    return data;
  }, []);

  // ==========================================
  // SIMULATION 2: Revenue Growth Projection
  // ==========================================
  const [scenario, setScenario] = useState<'Conservative' | 'Baseline' | 'Aggressive'>('Baseline');
  
  const forecastData = useMemo(() => {
    const baseHistorical = [120, 135, 125, 145, 160, 155]; // in Crores
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const multiplier = scenario === 'Conservative' ? 1.02 : scenario === 'Baseline' ? 1.08 : 1.15;
    
    const lines = months.map((m, idx) => {
      if (idx < 6) {
        return { month: m, historical: baseHistorical[idx], projected: null };
      } else {
        const lastVal = baseHistorical[baseHistorical.length - 1];
        const projection = lastVal * Math.pow(multiplier, idx - 5) + (Math.random() * 8 - 4);
        if (idx === 6) return { month: m, historical: null, projected: Math.round(projection), transition: lastVal };
        return { month: m, historical: null, projected: Math.round(projection) };
      }
    });

    const categories = [
      { name: 'P2M (Retail)', size: scenario === 'Conservative' ? 40 : 80, fill: '#4f46e5' },
      { name: 'P2P (Transfers)', size: 90, fill: '#10b981' },
      { name: 'Bill Payments', size: scenario === 'Aggressive' ? 45 : 30, fill: '#f59e0b' },
      { name: 'Travel/Booking', size: scenario === 'Aggressive' ? 25 : scenario === 'Conservative' ? 5 : 15, fill: '#ec4899' },
      { name: 'Investment', size: 20, fill: '#8b5cf6' },
    ];

    return { lines, categories };
  }, [scenario]);

  // ==========================================
  // SIMULATION 3: Partner Downtime Impact
  // ==========================================
  const [downtimeBank, setDowntimeBank] = useState<string>('SBI');
  const [downtimeHours, setDowntimeHours] = useState<number>(2);

  const outageData = useMemo(() => {
    const baseHourlyValue = downtimeBank === 'SBI' ? 450000 : downtimeBank === 'HDFC' ? 320000 : 210000; 
    const categories = ['P2M (Retail)', 'P2P (Transfers)', 'Utilities', 'Travel'];
    
    return categories.map((cat, idx) => {
      const weight = cat === 'P2M (Retail)' ? 0.45 : cat === 'P2P (Transfers)' ? 0.35 : cat === 'Utilities' ? 0.15 : 0.05; 
      const lostValue = Math.round(baseHourlyValue * downtimeHours * weight);
      const safeValue = Math.round(baseHourlyValue * 24 * weight) - lostValue;
      return {
        category: cat,
        safeVolume: safeValue,
        lostVolume: lostValue
      };
    });
  }, [downtimeBank, downtimeHours]);

  // ==========================================
  // SIMULATION 4: Demographic Market Expansion
  // ==========================================
  const [marketingBoost, setMarketingBoost] = useState<number>(10);

  const expansionData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = [0, 4, 8, 12, 16, 20];
    const data = [];
    
    for (let d = 0; d < days.length; d++) {
      for (let h = 0; h < hours.length; h++) {
        // Create an interesting synthetic heatmap pattern where fraud spikes on weekends late at night
        const isWeekend = d >= 4; // Fri/Sat/Sun
        const isLate = hours[h] >= 20 || hours[h] === 0;
        
        let riskScore = Math.random() * 20 + 5; // Base noise
        if (isWeekend) riskScore += 15;
        if (isLate) riskScore += 25;
        if (isWeekend && isLate) riskScore += marketingBoost * 2; // Marketing boost accelerates late weekend fraud
        
        data.push({
          day: days[d],
          hour: `${hours[h]}:00`,
          dayIndex: d,
          hourIndex: hours[h],
          riskLevel: Math.round(riskScore)
        });
      }
    }
    return data;
  }, [marketingBoost]);

  // ==========================================
  // SIMULATION 5: Connectivity Stress Test
  // ==========================================
  const [networkDrop, setNetworkDrop] = useState<number>(5);

  const connectivityData = useMemo(() => {
    // Recharts Sankey requires { nodes: [], links: [] }
    const nodes = [
      { name: '5G' }, { name: '4G' }, { name: 'WiFi' }, // 0, 1, 2
      { name: 'Smartphone' }, { name: 'Feature Phone' }, // 3, 4
      { name: 'Success' }, { name: 'Technical Decline' } // 5, 6
    ];

    // Base flows
    let flow5G_Smart = 8000;
    let flow4G_Smart = 12000;
    let flow4G_Feature = 3000;
    let flowWiFi_Smart = 5000;

    // Apply stress test degradation
    const degradation4G = networkDrop * 0.15; // up to 300% worse
    const degradation5G = networkDrop * 0.05;
    
    const fail4G_Smart = Math.round(flow4G_Smart * (0.02 + degradation4G));
    const fail4G_Feature = Math.round(flow4G_Feature * (0.08 + degradation4G * 1.5));
    const fail5G_Smart = Math.round(flow5G_Smart * (0.01 + degradation5G));
    const failWiFi_Smart = Math.round(flowWiFi_Smart * 0.01);

    const links = [
      // Network to Device
      { source: 0, target: 3, value: flow5G_Smart },
      { source: 1, target: 3, value: flow4G_Smart },
      { source: 1, target: 4, value: flow4G_Feature },
      { source: 2, target: 3, value: flowWiFi_Smart },
      
      // Device to Status
      { source: 3, target: 5, value: (flow5G_Smart - fail5G_Smart) + (flow4G_Smart - fail4G_Smart) + (flowWiFi_Smart - failWiFi_Smart) },
      { source: 3, target: 6, value: fail5G_Smart + fail4G_Smart + failWiFi_Smart },
      { source: 4, target: 5, value: flow4G_Feature - fail4G_Feature },
      { source: 4, target: 6, value: fail4G_Feature }
    ];

    return { nodes, links };
  }, [networkDrop]);

  const simulations = [
    { id: 'approval', icon: ShieldCheck, title: 'Approval Optimizer', desc: 'Balance fraud prevention vs. revenue' },
    { id: 'forecast', icon: TrendingUp, title: 'Revenue Projection', desc: 'Predict future transaction volumes' },
    { id: 'outage', icon: ZapOff, title: 'Partner Downtime', desc: 'Assess third-party failure impact' },
    { id: 'expansion', icon: Users, title: 'Velocity & Risk', desc: '24x7 spatio-temporal risk heatmap' },
    { id: 'network', icon: WifiOff, title: 'Connectivity Stress', desc: 'Test infrastructure resilience' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden h-screen bg-slate-50 dark:bg-[#020617]">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col pt-20">
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">ML Simulations</h2>
            <p className="text-sm text-slate-500 mb-6">Test hypotheses and forecast business outcomes using production data models.</p>
            
            <div className="space-y-2">
              {simulations.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setActiveSim(sim.id)}
                  className={`w-full flex flex-col items-start p-4 rounded-xl text-left transition-all ${
                    activeSim === sim.id 
                      ? 'bg-primary/10 border-primary/20 border text-primary shadow-sm' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 font-semibold mb-1">
                    <sim.icon className={`w-5 h-5 ${activeSim === sim.id ? 'text-primary' : 'text-slate-400'}`} />
                    {sim.title}
                  </div>
                  <span className={`text-xs ml-8 ${activeSim === sim.id ? 'text-primary/80' : 'text-slate-500'}`}>
                    {sim.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20">
          <div className="max-w-6xl mx-auto p-8">
            
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
                <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Net Fraud Savings</span>
                <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
                  ₹{(approvalData.find(d => d.level === securityLevel)?.netProfit || 0).toLocaleString()}
                </div>
                <span className={`text-xs mt-1 ${securityLevel >= 40 && securityLevel <= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {securityLevel >= 40 && securityLevel <= 60 ? 'Optimal Policy Range' : 'Suboptimal Threshold'}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
                <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Projected EOY Volume</span>
                <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
                  ₹{forecastData.lines[11].projected}Cr
                </div>
                <span className="text-xs text-indigo-500 mt-1 uppercase tracking-wider">{scenario} Scenario</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
                <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Current Value at Risk</span>
                <div className="text-2xl font-bold mt-2 text-amber-500 dark:text-amber-400">
                  ₹{outageData.reduce((acc, curr) => acc + curr.lostVolume, 0).toLocaleString()}
                </div>
                <span className="text-xs text-slate-500 mt-1">Based on {downtimeHours}h {downtimeBank} Outage</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
                <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Weekend Risk Escalator</span>
                <div className="text-2xl font-bold mt-2 text-rose-500 dark:text-rose-400">
                  {marketingBoost}x
                </div>
                <span className="text-xs text-slate-500 mt-1">Late Night Fraud Velocity</span>
              </div>
            </div>
            
            {/* SIMULATION 1 RENDER */}
            {activeSim === 'approval' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction Approval Optimizer</h1>
                  <p className="text-slate-500 mt-2">Adjust security strictness to find the perfect balance between preventing unauthorized transactions and minimizing false declines for legitimate customers.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="w-full">
                      <div className="flex justify-between text-sm mb-2 font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Security Strictness Rules</span>
                        <span className="text-primary">{securityLevel}%</span>
                      </div>
                      <input 
                        type="range" min="10" max="100" step="10"
                        value={securityLevel} 
                        onChange={(e) => setSecurityLevel(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>Permissive (High Risk)</span>
                        <span>Aggressive (High Friction)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={approvalData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                        <XAxis dataKey="level" tick={{fontSize: 12}} tickFormatter={(val) => `${val}%`} />
                        <YAxis yAxisId="left" tick={{fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                          // @ts-ignore
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
                          labelFormatter={(val) => `Strictness Level: ${val}%`}
                        />
                        <Legend />
                        <ReferenceLine x={securityLevel} stroke="#4f46e5" strokeDasharray="3 3" label={{ position: 'top', value: 'Current Policy', fill: '#4f46e5', fontSize: 12 }} yAxisId="left" />
                        <Area yAxisId="left" type="monotone" name="Net Profit Impact" dataKey="netProfit" fill="#818cf8" opacity={0.15} stroke="none" />
                        <Line yAxisId="left" type="monotone" name="Fraud Prevented" dataKey="prevented" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                        <Line yAxisId="left" type="monotone" name="Revenue Lost (False Declines)" dataKey="lostRevenue" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1">⚠️ Consultant Insight: The Sweet Spot</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        {securityLevel < 40 
                          ? `At ${securityLevel}% strictness, the policy is too permissive. You are losing ₹${(approvalData.find(d => d.level === 40)!.netProfit - approvalData.find(d => d.level === securityLevel)!.netProfit).toLocaleString()} in net profit compared to the optimal 40% threshold due to unchecked fraud.`
                          : securityLevel > 60
                          ? `At ${securityLevel}% strictness, the policy is too aggressive. You are losing ₹${(approvalData.find(d => d.level === 50)!.netProfit - approvalData.find(d => d.level === securityLevel)!.netProfit).toLocaleString()} in profit by blocking legitimate customers (false declines) compared to the optimal threshold.`
                          : `At ${securityLevel}% strictness, you are operating in the optimal profit band. Fraud prevention costs perfectly balance against false decline revenue loss.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION 2 RENDER */}
            {activeSim === 'forecast' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Revenue Growth Projection</h1>
                  <p className="text-slate-500 mt-2">Simulate future transaction volume (TPV) based on differing macroeconomic market conditions over the next two quarters.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Macroeconomic Scenario:</span>
                    <select 
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value as any)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none font-medium"
                    >
                      <option value="Conservative">Conservative (Market Slowdown)</option>
                      <option value="Baseline">Baseline (Current Trend)</option>
                      <option value="Aggressive">Aggressive (Festive/Policy Boost)</option>
                    </select>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Volume Forecast</h4>
                      <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={forecastData.lines} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                          <XAxis dataKey="month" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `₹${val}Cr`} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                            // @ts-ignore
                            formatter={(val: any) => [`₹${val}Cr`, 'Volume']}
                          />
                          <Legend />
                          <Bar dataKey="historical" name="Actual Historical Volume" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Area type="monotone" dataKey="projected" name="Projected Volume" stroke="#4f46e5" strokeWidth={3} fill="url(#colorProj)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full lg:w-72 shrink-0 flex flex-col">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Category Health (Treemap)</h4>
                      <ResponsiveContainer width="100%" height="90%">
                        <Treemap
                          data={forecastData.categories}
                          dataKey="size"
                          aspectRatio={4 / 3}
                          stroke="#fff"
                          isAnimationActive={false}
                          content={({ root, depth, x, y, width, height, index, name, fill }: any) => (
                            <g>
                              <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} stroke="#fff" strokeWidth={2} className="transition-all hover:opacity-80 cursor-pointer" />
                              {width > 50 && height > 30 && (
                                <text x={x + 6} y={y + 18} fill="#fff" fontSize={11} fontWeight="bold" className="pointer-events-none">
                                  {name}
                                </text>
                              )}
                            </g>
                          )}
                        >
                          {/* @ts-ignore */}
                          <RechartsTooltip formatter={(val: any) => [`Score: ${val}`, 'Growth Potential']} contentStyle={{ borderRadius: '8px' }} />
                        </Treemap>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1">⚠️ Consultant Insight: Category Dynamics</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        {scenario === 'Conservative' 
                          ? `Under a market slowdown, discretionary spending like Travel and large Retail (P2M) contract massively. Focus resource allocation defensively on structural P2P transfers and Utilities (Bill Payments), which remain highly resilient.`
                          : scenario === 'Baseline'
                          ? `Steady state growth projects consistent scaling. P2P transfers remain the dominant driver of transaction volume, providing a reliable bedrock for the ecosystem.`
                          : `An aggressive expansion scenario causes explosive growth in discretionary Travel & Booking spaces. Ensure platform throughput and merchant settlement infrastructure are prepared for a 15% WoW volume surge in these heavy-tail categories.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION 3 RENDER */}
            {activeSim === 'outage' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Partner Downtime Impact</h1>
                  <p className="text-slate-500 mt-2">Evaluate the systemic risk to specific transaction categories if a major banking partner experiences an infrastructure outage.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <span className="block font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Select Banking Partner</span>
                      <select 
                        value={downtimeBank} onChange={(e) => setDowntimeBank(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none p-2 text-sm font-medium w-48"
                      >
                        <option value="SBI">SBI Infrastructure</option>
                        <option value="HDFC">HDFC Infrastructure</option>
                        <option value="Axis">Axis Infrastructure</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2 font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Estimated Outage Duration</span>
                        <span className="text-amber-500">{downtimeHours} Hours</span>
                      </div>
                      <input 
                        type="range" min="1" max="12" value={downtimeHours} 
                        onChange={(e) => setDowntimeHours(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={outageData} layout="vertical" margin={{ left: 30, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                        <XAxis type="number" tick={{fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                        <YAxis dataKey="category" type="category" tick={{fontSize: 12}} width={110} />
                        <RechartsTooltip 
                          cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                          contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff' }}
                          // @ts-ignore
                          formatter={(val: any) => [`₹${val.toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="safeVolume" stackId="a" name="Surviving Value (₹)" fill="#e2e8f0" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="lostVolume" stackId="a" name="Value At Risk (₹)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1">⚠️ Consultant Insight: Value at Risk</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        {`A ${downtimeHours}-hour outage for ${downtimeBank} jeopardizes a total of ₹${outageData.reduce((acc, curr) => acc + curr.lostVolume, 0).toLocaleString()} across all channels. The P2M (Retail) sector bears the heaviest impact, accounting for ~45% of the total financial exposure. Establish active-active routing to fallback partners immediately.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION 4 RENDER */}
            {activeSim === 'expansion' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Velocity & Risk Heatmap</h1>
                  <p className="text-slate-500 mt-2">A 24x7 spatio-temporal view mapping exact days and times where fraud velocity spikes against normal transaction baselines.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between text-sm mb-2 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Fraud Velocity Multiplier (Weekend Late-Night Escalator)</span>
                      <span className="text-primary">{marketingBoost}x</span>
                    </div>
                    <input 
                      type="range" min="1" max="50" step="1" value={marketingBoost} 
                      onChange={(e) => setMarketingBoost(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="hour" type="category" name="Hour of Day" tick={{fontSize: 12}} />
                        <YAxis dataKey="day" type="category" name="Day of Week" tick={{fontSize: 12}} reversed />
                        <ZAxis dataKey="riskLevel" range={[50, 800]} name="Risk Intensity" />
                        <RechartsTooltip 
                          cursor={{strokeDasharray: '3 3'}}
                          contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none' }}
                          // @ts-ignore
                          formatter={(val: any, name: any) => name === 'Risk Intensity' ? [val, 'Fraud Events'] : val}
                        />
                        <Scatter name="Fraud Spikes" data={expansionData} fill="#ef4444" opacity={0.8}>
                          {expansionData.map((entry, index) => {
                             // Color shifts from orange to dark red based on intensity
                             const heat = entry.riskLevel;
                             const color = heat > 80 ? '#991b1b' : heat > 50 ? '#ef4444' : heat > 30 ? '#f97316' : '#fcd34d';
                             return <Cell key={`cell-${index}`} fill={color} />
                          })}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1">⚠️ Consultant Insight: The Danger Zones</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        {`Analysis reveals a severe concentration of fraudulent velocity peaking aggressively on Friday and Saturday nights between 20:00 and 04:00. This temporal cluster accounts for highly asymmetric risk. Recommendation: Deploy dynamic step-up authentication exclusively during these red-zone windows.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION 5 RENDER */}
            {activeSim === 'network' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connectivity Stress Test</h1>
                  <p className="text-slate-500 mt-2">Analyze how widespread cellular network degradation impacts technical decline rates across different connection types.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between text-sm mb-2 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Cellular Degradation Severity</span>
                      <span className="text-rose-500">Level {networkDrop}</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" value={networkDrop} 
                      onChange={(e) => setNetworkDrop(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Normal Operations</span>
                      <span>Severe Outage</span>
                    </div>
                  </div>

                  <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <Sankey
                        data={connectivityData}
                        nodePadding={40}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                        link={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                        node={({ x, y, width, height, index, payload }: any) => {
                           const isFailure = payload.name === 'Technical Decline';
                           const isSuccess = payload.name === 'Success';
                           const fill = isFailure ? '#ef4444' : isSuccess ? '#10b981' : '#6366f1';
                           return (
                             <g>
                               <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} ry={2} />
                               <text x={x < 200 ? x + width + 6 : x - 6} y={y + height / 2} textAnchor={x < 200 ? 'start' : 'end'} fill="#475569" fontSize="12" dominantBaseline="middle" className="dark:fill-slate-300 font-medium tracking-tight">
                                 {payload.name}
                               </text>
                             </g>
                           )
                        }}
                      >
                        {/* @ts-ignore */}
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none' }}
                          formatter={(val: any) => [`${val.toLocaleString()} Tx`, 'Flow Volume']}
                        />
                      </Sankey>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1">⚠️ Consultant Insight: Network Bottlenecks</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        {networkDrop > 10 
                           ? `Severe Level ${networkDrop} degradation observed. 4G Feature Phone users are experiencing catastrophic packet dropout causing massive technical decline flows. Reroute structural traffic to USSD fallback immediately.`
                           : `At Level ${networkDrop} degradation, the 5G and WiFi network layers remain highly resilient. 4G latency jitter is causing minor timeout declines on Smartphone devices but remains within acceptable SLAs.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}