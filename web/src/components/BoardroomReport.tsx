import React from 'react';
import { Printer, X } from 'lucide-react';

interface ReportData {
  tpv: number;
  fraudRate: number;
  topState: { state: string; volume: number };
  topCategory: { category: string; volume: number };
  failedTxCount: number;
  totalTxCount: number;
}

export function BoardroomReport({ data, onClose }: { data: ReportData; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative flex flex-col printable-report">
        
        {/* Header Actions - Hidden on Print */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm print:hidden">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Executive Summary Generator</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 sm:p-12 space-y-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" id="report-content">
          <div className="border-b-4 border-primary pb-6">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">InsightsX Boardroom Report</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">Automated Payments Intelligence Summary</p>
            <p className="text-sm font-medium text-slate-400 mt-4 uppercase tracking-wider">Generated: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Payment Volume</h3>
              <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(data.tpv)}</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Network Technical Declines</h3>
              <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{((data.failedTxCount / Math.max(1, data.totalTxCount)) * 100).toFixed(2)}%</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Critical Fraud Flags</h3>
              <p className="text-4xl font-black text-red-600 dark:text-red-400">{data.fraudRate.toFixed(2)}%</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Top Sector</h3>
              <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{data.topCategory.category}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-slate-200 dark:border-slate-700 pb-2">Strategic Analysis</h2>
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed">
                The InsightsX engine processed <strong>{data.totalTxCount.toLocaleString()}</strong> transactions in this reporting period. 
                Our Top Performing State remains <strong>{data.topState.state}</strong>, generating <strong>{formatCurrency(data.topState.volume)}</strong> in settled volume.
              </p>
              
              <ul className="mt-4 space-y-3">
                <li><strong>Revenue Generation:</strong> The <strong>{data.topCategory.category}</strong> categoric sector led the revenue charts with {formatCurrency(data.topCategory.volume)}, indicating strong consumer engagement in this segment.</li>
                <li><strong>Infrastructure Stability:</strong> We observed <strong className="text-amber-600 dark:text-amber-400">{data.failedTxCount.toLocaleString()} failed transactions</strong>. Continuous monitoring of 4G vs 5G banking handshakes is recommended.</li>
                <li><strong>Risk & Security:</strong> System AI marked {data.fraudRate.toFixed(2)}% of total volume with elevated fraud heuristic flags. Re-calibrating stringency rules slightly could optimize false-decline recovery.</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800">
            <p>Generated securely via In-Browser WASM Analytics — Zero Data Exfiltration</p>
            <p className="mt-1 font-semibold text-slate-300">CONFIDENTIAL - FOR INTERNAL USE ONLY</p>
          </div>
        </div>
      </div>
    </div>
  );
}
