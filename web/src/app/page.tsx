'use client';
import { useDuckDB } from '@/hooks/useDuckDB';
import { useState } from 'react';

export default function Home() {
  const { db, loading, error } = useDuckDB();
  const [count, setCount] = useState<number | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  async function runQuery() {
    if (!db) return;
    try {
      setQueryError(null);
      const c = await db.connect();
      const result = await c.query('SELECT COUNT(*) as count FROM transactions');
      
      // result is an Apache Arrow object. result.toArray() works.
      const row = result.toArray()[0];
      setCount(Number(row.count));
      
      await c.close();
    } catch (err: any) {
      console.error(err);
      setQueryError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans">
        <p className="text-xl">Initializing DuckDB-WASM data engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 text-red-600 bg-red-50 font-sans">
        <h1 className="text-2xl font-bold">DuckDB Initialization Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-12 bg-gray-50 text-gray-900 font-sans">
      <main className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Data Engine Pipeline</h1>
          <p className="text-gray-500">In-browser OLAP testing interface</p>
        </header>

        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">DuckDB WASM Test</h2>
          <p className="text-sm text-gray-600">
            This query runs locally across the statically served <code>transactions.parquet</code> file with zero backend latency.
          </p>
          <div className="pt-2">
            <button 
              onClick={runQuery} 
              className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Run COUNT(*) Query
            </button>
          </div>
          
          {count !== null && (
            <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
              <span className="font-semibold block">Query Success:</span>
              Total Indexed Rows: <strong>{count.toLocaleString()}</strong>
            </div>
          )}

          {queryError && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              <span className="font-semibold block">Query Error:</span>
              {queryError}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
