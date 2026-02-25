import React from 'react';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter,
  RadialBarChart, RadialBar,
  ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

// ─── Chart Palette ──────────────────────────────────────────────────
const COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

// ─── Supported Chart Types ──────────────────────────────────────────
export type ChartType =
  | 'bar'
  | 'pie'
  | 'line'
  | 'area'
  | 'radar'
  | 'scatter'
  | 'radialBar'
  | 'composed';

// ─── Props ──────────────────────────────────────────────────────────
export type GenerativeInsightCardProps = {
  intent: string;
  filters: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  narrative: string;
  chartType: ChartType;
  dataKeyX?: string;
  dataKeyY?: string;
};

// ─── Chart Renderer ─────────────────────────────────────────────────
function RenderChart({
  chartType,
  data,
  dataKeyX = 'name',
  dataKeyY = 'value',
}: {
  chartType: ChartType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKeyX: string;
  dataKeyY: string;
}) {
  switch (chartType) {
    case 'bar':
      return (
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dataKeyX} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: 'rgba(79,70,229,0.06)' }} contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <Bar dataKey={dataKeyY} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      );

    case 'pie':
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKeyY}
            nameKey={dataKeyX}
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={40}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#94a3b8' }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '10px' }} />
          <Legend />
        </PieChart>
      );

    case 'line':
      return (
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dataKeyX} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <Line
            type="monotone"
            dataKey={dataKeyY}
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#4f46e5' }}
          />
        </LineChart>
      );

    case 'area':
      return (
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dataKeyX} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <Area
            type="monotone"
            dataKey={dataKeyY}
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#areaGradient)"
          />
        </AreaChart>
      );

    case 'radar':
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey={dataKeyX} tick={{ fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fontSize: 10 }} />
          <Radar
            dataKey={dataKeyY}
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip contentStyle={{ borderRadius: '10px' }} />
        </RadarChart>
      );

    case 'scatter':
      return (
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dataKeyX} name={dataKeyX} tick={{ fontSize: 12 }} />
          <YAxis dataKey={dataKeyY} name={dataKeyY} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '10px' }} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill="#4f46e5">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      );

    case 'radialBar':
      return (
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          barSize={18}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}
            dataKey={dataKeyY}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </RadialBar>
          <Legend
            iconSize={10}
            layout="horizontal"
            verticalAlign="bottom"
          />
          <Tooltip contentStyle={{ borderRadius: '10px' }} />
        </RadialBarChart>
      );

    case 'composed':
      return (
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dataKeyX} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
          <Bar dataKey={dataKeyY} fill="#4f46e5" radius={[4, 4, 0, 0]} opacity={0.7} />
          <Line
            type="monotone"
            dataKey={dataKeyY}
            stroke="#f43f5e"
            strokeWidth={2}
            dot={{ fill: '#f43f5e', r: 3 }}
          />
        </ComposedChart>
      );

    default:
      return (
        <BarChart data={data}>
          <XAxis dataKey={dataKeyX} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKeyY} fill="#4f46e5" />
        </BarChart>
      );
  }
}

// ─── Main Component ─────────────────────────────────────────────────
export function GenerativeInsightCard({
  intent,
  filters,
  data,
  narrative,
  chartType = 'bar',
  dataKeyX = 'name',
  dataKeyY = 'value',
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
        <span className="text-xs text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
          {chartType}
        </span>
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
        {data.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RenderChart chartType={chartType} data={data} dataKeyX={dataKeyX} dataKeyY={dataKeyY} />
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
            No data returned for this query.
          </div>
        )}

        {/* Zone 4: Narrative Insight */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 italic text-gray-700">
          <span className="opacity-50 inline-block align-top mr-1">&ldquo;</span>
          {narrative}
          <span className="opacity-50 inline-block align-top ml-1">&rdquo;</span>
        </div>
      </div>
    </div>
  );
}
