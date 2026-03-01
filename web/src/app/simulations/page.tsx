'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart,
  Area, AreaChart, ReferenceLine
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
    
    return months.map((m, idx) => {
      if (idx < 6) {
        return { month: m, historical: baseHistorical[idx], projected: null };
      } else {
        const lastVal = baseHistorical[baseHistorical.length - 1];
        const projection = lastVal * Math.pow(multiplier, idx - 5) + (Math.random() * 8 - 4);
        if (idx === 6) return { month: m, historical: null, projected: Math.round(projection), transition: lastVal };
        return { month: m, historical: null, projected: Math.round(projection) };
      }
    });
  }, [scenario]);

  // ==========================================
  // SIMULATION 3: Partner Downtime Impact
  // ==========================================
  const [downtimeBank, setDowntimeBank] = useState<string>('SBI');
  const [downtimeHours, setDowntimeHours] = useState<number>(2);

  const outageData = useMemo(() => {
    const baseHourly = downtimeBank === 'SBI' ? 850 : downtimeBank === 'HDFC' ? 620 : 410; 
    const categories = ['P2P Transfers', 'Retail Purchases', 'Utility Bills', 'Travel Bookings'];
    
    return categories.map((cat, idx) => {
      const weight = 1 - (idx * 0.15); 
      const lostTx = Math.round(baseHourly * downtimeHours * weight);
      return {
        category: cat,
        safeVolume: Math.round(baseHourly * 24 * weight) - lostTx,
        lostVolume: lostTx
      };
    });
  }, [downtimeBank, downtimeHours]);

  // ==========================================
  // SIMULATION 4: Demographic Market Expansion
  // ==========================================
  const [marketingBoost, setMarketingBoost] = useState<number>(10);

  const expansionData = useMemo(() => {
    const baseData = [
      { group: '18-25 (Gen Z)', base: 45000, sensitivity: 1.5 },
      { group: '26-35 (Millennials)', base: 85000, sensitivity: 1.2 },
      { group: '36-45 (Gen X)', base: 55000, sensitivity: 0.8 },
      { group: '46-55 (Boomers)', base: 25000, sensitivity: 0.4 },
    ];

    return baseData.map(d => ({
      group: d.group,
      currentVolume: d.base,
      projectedGrowth: Math.round(d.base * (marketingBoost / 100) * d.sensitivity)
    }));
  }, [marketingBoost]);

  // ==========================================
  // SIMULATION 5: Connectivity Stress Test
  // ==========================================
  const [networkDrop, setNetworkDrop] = useState<number>(5);

  const connectivityData = useMemo(() => {
    const networks = ['5G Network', '4G Network', 'WiFi'];
    return networks.map((net, idx) => {
      const baseSuccess = 95 - (idx * 2);
      const impact = net === '5G Network' ? networkDrop * 0.5 : net === '4G Network' ? networkDrop * 1.2 : networkDrop * 0.2;
      return {
        network: net,
        successRate: Math.max(0, baseSuccess - impact),
        declineRate: Math.min(100, (100 - baseSuccess) + impact)
      };
    });
  }, [networkDrop]);

  const simulations = [
    { id: 'approval', icon: ShieldCheck, title: 'Approval Optimizer', desc: 'Balance fraud prevention vs. revenue' },
    { id: 'forecast', icon: TrendingUp, title: 'Revenue Projection', desc: 'Predict future transaction volumes' },
    { id: 'outage', icon: ZapOff, title: 'Partner Downtime', desc: 'Assess third-party failure impact' },
    { id: 'expansion', icon: Users, title: 'Market Expansion', desc: 'Simulate demographic targeting' },
    { id: 'network', icon: WifiOff, title: 'Connectivity Stress', desc: 'Test infrastructure resilience' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-surface border-r border-slate-200 dark:border-white/10 shrink-0 overflow-y-auto">
          <div className="p-6 pb-2 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Strategic Simulations</h2>
            <p className="text-xs text-slate-500 mt-1">Interactive business scenario modeling</p>
          </div>
          <div className="p-4 space-y-2">
            {simulations.map((sim) => {
              const Icon = sim.icon;
              const isActive = activeSim === sim.id;
              return (
                <button
                  key={sim.id}
                  onClick={() => setActiveSim(sim.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                      : 'border border-transparent hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isActive ? 'text-primary-dark dark:text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                      {sim.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{sim.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-4xl mx-auto">
            
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
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                          labelFormatter={(val) => `Strictness Level: ${val}%`}
                        />
                        <Legend />
                        <ReferenceLine x={securityLevel} stroke="#4f46e5" strokeDasharray="3 3" label={{ position: 'top', value: 'Current Policy', fill: '#4f46e5', fontSize: 12 }} yAxisId="left" />
                        <Line yAxisId="left" type="monotone" name="Fraud Prevented" dataKey="prevented" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                        <Line yAxisId="left" type="monotone" name="Revenue Lost (False Declines)" dataKey="lostRevenue" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                      </ComposedChart>
                    </ResponsiveContainer>
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

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                        />
                        <Legend />
                        <Bar dataKey="historical" name="Actual Historical Volume" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Area type="monotone" dataKey="projected" name="Projected Volume" stroke="#4f46e5" strokeWidth={3} fill="url(#colorProj)" />
                      </AreaChart>
                    </ResponsiveContainer>
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
                        <XAxis type="number" tick={{fontSize: 12}} />
                        <YAxis dataKey="category" type="category" tick={{fontSize: 12}} width={110} />
                        <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px' }}/>
                        <Legend />
                        <Bar dataKey="safeVolume" stackId="a" name="Unaffected Transactions" fill="#e2e8f0" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="lostVolume" stackId="a" name="Transactions At Risk" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION 4 RENDER */}
            {activeSim === 'expansion' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Market Expansion Simulator</h1>
                  <p className="text-slate-500 mt-2">Project transaction volume increases across demographic groups based on targeted marketing investments.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between text-sm mb-2 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Marketing Budget Increase</span>
                      <span className="text-primary">+{marketingBoost}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="50" step="5" value={marketingBoost} 
                      onChange={(e) => setMarketingBoost(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expansionData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="group" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="currentVolume" name="Current Baseline Volume" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="projectedGrowth" name="New Volume Gained" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={connectivityData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="network" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `${val}%`} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} formatter={(val) => `${Number(val).toFixed(1)}%`}/>
                        <Legend />
                        <Bar dataKey="successRate" stackId="a" name="Transaction Success Rate" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="declineRate" stackId="a" name="Technical Decline Rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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