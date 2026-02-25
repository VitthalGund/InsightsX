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

                const worker = new Worker(bundle.mainWorker!);
                const logger = new duckdb.ConsoleLogger();
                const database = new duckdb.AsyncDuckDB(logger, worker);

                await database.instantiate(bundle.mainModule, bundle.pthreadWorker);

                // Load the parquet file from the public directory
                const c = await database.connect();
                console.log('Loading transactions.parquet into DuckDB...');
                await c.query(`
          CREATE TABLE transactions AS 
          SELECT * FROM read_parquet('/transactions.parquet')
        `);
                await c.close();

                setDb(database);
            } catch (err: any) {
                console.error('Failed to initialize DuckDB:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, []);

    return { db, loading, error };
}
