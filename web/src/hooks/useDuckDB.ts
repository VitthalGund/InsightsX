'use client';
import { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

export function useDuckDB() {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            try {
                const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

                // Create a local blob to bypass cross-origin worker restrictions
                const workerUrl = URL.createObjectURL(
                    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
                );
                const worker = new Worker(workerUrl);
                const logger = new duckdb.ConsoleLogger();
                const database = new duckdb.AsyncDuckDB(logger, worker);

                await database.instantiate(bundle.mainModule, bundle.pthreadWorker);

                // Register the parquet file from the public directory so DuckDB can fetch it
                const parquetUrl = new URL('/transactions.parquet', window.location.href).href;
                await database.registerFileURL('transactions.parquet', parquetUrl, duckdb.DuckDBDataProtocol.HTTP, false);

                const c = await database.connect();
                console.log('Loading transactions.parquet into DuckDB...');
                await c.query(`
          CREATE TABLE transactions AS 
          SELECT * FROM read_parquet('transactions.parquet')
        `);
                await c.close();

                setDb(database);
            } catch (err: unknown) {
                console.error('Failed to initialize DuckDB:', err);
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        }

        init();
    }, []);

    return { db, loading, error };
}
