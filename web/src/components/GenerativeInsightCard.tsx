import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type GenerativeInsightCardProps = {
  intent: string;
  filters: Record<string, string>;
  data: any[];
  narrative: string;
  chartType: 'bar' | 'pie';
  dataKeyX?: string;
  dataKeyY?: string;
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#ef4444'];

export function GenerativeInsightCard({ 
  intent, 
  filters, 
  data, 
  narrative,
  chartType = 'bar',
  dataKeyX = 'name',
  dataKeyY = 'value'
}: GenerativeInsightCardProps) {
  
  return (
    <div className="bg-white border text-sm border-gray-200 shadow-sm rounded-xl overflow-hidden font-sans w-full max-w-full my-4">
      {/* Zone 1: Intent Trace */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-indigo-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {intent}
        </div>
      </div>
      
      <div className="p-4 space-y-5">
        {/* Zone 2: Filter Badges */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([k, v]) => (
              <span key={k} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 shadow-sm">
                {k}: <strong className="ml-1">{v}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Zone 3: Visualization */}
        <div className="h-64 w-full cursor-auto">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey={dataKeyX} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey={dataKeyY} fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie data={data} dataKey={dataKeyY} nameKey={dataKeyX} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Zone 4: Narrative Insight */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 italic text-gray-700">
          <span className="opacity-50 inline-block align-top mr-1">"</span>
          {narrative}
          <span className="opacity-50 inline-block align-top ml-1">"</span>
        </div>
      </div>
    </div>
  );
}
