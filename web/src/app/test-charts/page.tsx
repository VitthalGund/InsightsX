'use client';

import { GenerativeInsightCard, type ChartType } from '@/components/GenerativeInsightCard';

const SAMPLE_DATA = [
  { name: 'Food', value: 4200 },
  { name: 'Grocery', value: 3800 },
  { name: 'Shopping', value: 2900 },
  { name: 'Utilities', value: 1500 },
  { name: 'Entertainment', value: 2100 },
  { name: 'Healthcare', value: 900 },
  { name: 'Education', value: 1100 },
  { name: 'Other', value: 600 },
];

const CHART_TYPES: ChartType[] = ['bar', 'pie', 'line', 'area', 'radar', 'scatter', 'radialBar', 'composed'];

export default function TestChartsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chart Type Preview</h1>
        <p className="text-gray-500 mb-8">Visual test page for all supported chart types in GenerativeInsightCard.</p>

        <div className="space-y-6">
          {CHART_TYPES.map((type) => (
            <GenerativeInsightCard
              key={type}
              intent={`Chart Type: ${type}`}
              filters={{ category: 'All', source: 'Sample Data' }}
              data={SAMPLE_DATA}
              narrative={`This is a ${type} chart rendering sample transaction data across 8 merchant categories. The data shows Food leading with 4,200 transactions.`}
              chartType={type}
              dataKeyX="name"
              dataKeyY="value"
            />
          ))}
        </div>

        {/* Multi-chart example */}
        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Multi-Chart Response Example</h2>
        <p className="text-gray-500 mb-6">A single tool response can render multiple visualizations side by side.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GenerativeInsightCard
            intent="Distribution View"
            filters={{ age_group: '18-25' }}
            data={[
              { name: 'SUCCESS', value: 6200 },
              { name: 'FAILED', value: 800 },
              { name: 'PENDING', value: 350 },
              { name: 'REFUNDED', value: 150 },
            ]}
            narrative="Pie chart showing transaction status distribution."
            chartType="pie"
          />
          <GenerativeInsightCard
            intent="Trend View"
            filters={{ age_group: '18-25' }}
            data={[
              { name: '6AM', value: 120 },
              { name: '9AM', value: 450 },
              { name: '12PM', value: 680 },
              { name: '3PM', value: 520 },
              { name: '6PM', value: 890 },
              { name: '9PM', value: 740 },
              { name: '12AM', value: 200 },
            ]}
            narrative="Area chart showing hourly transaction volume trend."
            chartType="area"
          />
        </div>
      </div>
    </div>
  );
}
