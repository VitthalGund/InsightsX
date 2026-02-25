'use client';

import { useChat } from '@ai-sdk/react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { GenerativeInsightCard } from '@/components/GenerativeInsightCard';
import { Send, Loader2, Database, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ChatDashboard() {
  const { db, loading: dbLoading, error: dbError } = useDuckDB();
  const [toolDataStore, setToolDataStore] = useState<Record<string, any>>({});
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5,
    async onToolCall({ toolCall }) {
      if (!db) return;
      const c = await db.connect();
      console.log('Intercepted Tool Call:', toolCall);
      
      try {
        let query = '';
        let chartProps: any = { type: 'bar', x: 'name', y: 'value', narrative: '' };
        
        switch (toolCall.toolName) {
          case 'analyze_transaction_status':
            const { age_group, state } = toolCall.args as any;
            query = `
              SELECT transaction_status as name, CAST(COUNT(*) AS INTEGER) as value 
              FROM transactions 
              WHERE sender_age_group = '${age_group}' AND sender_state = '${state}'
              GROUP BY transaction_status
            `;
            chartProps = {
              type: 'pie', x: 'name', y: 'value',
              narrative: `There is a significant distribution of statuses for the ${age_group} demographic in ${state}.`
            };
            break;
            
          case 'compare_network_failures':
            const { primary_network, secondary_network } = toolCall.args as any;
            query = `
              SELECT network_type as name, CAST(COUNT(*) AS INTEGER) as value
              FROM transactions
              WHERE network_type IN ('${primary_network}', '${secondary_network}')
                AND transaction_status = 'FAILED'
              GROUP BY network_type
            `;
            chartProps = {
              type: 'bar', x: 'name', y: 'value',
              narrative: `Comparing technical drop-offs between ${primary_network} and ${secondary_network}.`
            };
            break;
            
          case 'average_transaction_value':
            const { category, start_hour, end_hour } = toolCall.args as any;
            query = `
              SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(AVG(amount_inr) AS INTEGER) as value
              FROM transactions
              WHERE merchant_category = '${category}' 
                AND hour_of_day BETWEEN ${start_hour} AND ${end_hour}
              GROUP BY hour_of_day
              ORDER BY hour_of_day ASC
            `;
            chartProps = {
              type: 'bar', x: 'name', y: 'value',
              narrative: `Average transaction amounts for ${category} purchases between ${start_hour}:00 and ${end_hour}:00.`
            };
            break;
            
          case 'merchant_risk_analysis':
            const { limit } = toolCall.args as any;
            query = `
              SELECT merchant_category as name, CAST(COUNT(*) AS INTEGER) as value
              FROM transactions
              WHERE fraud_flag = 1
              GROUP BY merchant_category
              ORDER BY value DESC
              LIMIT ${limit || 5}
            `;
            chartProps = {
              type: 'bar', x: 'name', y: 'value',
              narrative: `Top ${limit || 5} categories historically flagged for potentially anomalous transactions.`
            };
            break;
        }

        if (query) {
           console.log("Executing strict deterministc query:", query);
           const result = await c.query(query);
           const rows = result.toArray().map(r => Object.fromEntries(r as any));
           
           setToolDataStore(prev => ({
             ...prev,
             [toolCall.toolCallId]: { data: rows, ...chartProps }
           }));
        }

      } catch (e) {
        console.error("DuckDB Query Exec Error:", e);
      } finally {
        await c.close();
      }
    }
  });

  if (dbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-sans">
        <Database className="h-8 w-8 text-indigo-500 mb-4 animate-pulse" />
        <p className="text-lg font-medium">Booting In-Browser Data Engine...</p>
        <p className="text-sm mt-2">Loading transactions.parquet (0 network latency)</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-red-50 font-sans">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 max-w-lg text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-900 mb-2">Engine Initialization Failed</h1>
            <p className="text-red-700">{dbError}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar Panel */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
           <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Database className="h-5 w-5" />
              <h1 className="text-lg font-bold tracking-tight">InsightsX OLAP</h1>
           </div>
           <p className="text-sm text-gray-500 leading-tight">Zero-latency In-Browser Query Engine using DuckDB-WASM x Gemini.</p>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
           <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Architecture</h3>
           <ul className="space-y-3 text-sm text-gray-600">
             <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full bg-green-100 p-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /></div>
                DuckDB Worker: Active
             </li>
             <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full bg-green-100 p-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /></div>
                LLM Router: Operational
             </li>
             <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full bg-green-100 p-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /></div>
                Parquet Source: Loaded
             </li>
           </ul>
           
           <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-4">Query Examples</h3>
           <div className="space-y-2">
             <button onClick={() => handleInputChange({ target: { value: "Show me the distribution of transaction statuses for the 18-25 age group in Maharashtra" } } as any)} className="text-left w-full text-xs p-2.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-gray-600">
                Show me the distribution of transaction statuses for the 18-25 age group in Maharashtra
             </button>
             <button onClick={() => handleInputChange({ target: { value: "Compare the technical failure rates of transactions initiated on 4G vs 5G." } } as any)} className="text-left w-full text-xs p-2.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-gray-600">
                Compare technical failure rates on 4G vs 5G networks.
             </button>
              <button onClick={() => handleInputChange({ target: { value: "Find which merchant category has the highest ratio of fraud-flagged transactions." } } as any)} className="text-left w-full text-xs p-2.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-gray-600">
                What merchant categories have the highest fraud flags?
             </button>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex-1 overflow-y-auto px-8 w-full max-w-4xl mx-auto py-8">
           {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                 <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3">
                    <Database className="h-8 w-8 text-white -rotate-3" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-800">Determininstic AI Explorer</h2>
                 <p className="text-center max-w-md">
                   Ask analytical questions in natural language. The LLM translates intent to strict Zod parameters, executing lighting fast SQL locally.
                 </p>
              </div>
           )}

           {messages.map((m) => (
             <div key={m.id} className={`mb-8 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${m.role === 'user' ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                    {m.role === 'user' ? 'U' : <Database className="h-4 w-4" />}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 space-y-2 min-w-0">
                     {/* Text content if any */}
                     {m.content && (
                       <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm border ${
                          m.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none border-transparent' 
                          : 'bg-white text-gray-800 rounded-tl-none border-gray-100'
                       }`}>
                         {m.content}
                       </div>
                     )}

                     {/* Tool Invocations for Glass Box UI */}
                     {m.toolInvocations?.map((toolInvocation) => {
                       const toolCallId = toolInvocation.toolCallId;
                       const resultData = toolDataStore[toolCallId];

                       return (
                         <div key={toolCallId} className="w-full animation-fade-in mt-4">
                            {toolInvocation.state === 'call' ? (
                               <div className="flex items-center gap-2 p-3 bg-indigo-50/50 text-indigo-700 rounded-lg text-sm border border-indigo-100 w-fit">
                                 <Loader2 className="h-4 w-4 animate-spin" />
                                 <span className="font-medium">Routing intent to localized DuckDB...</span>
                                 <code className="text-xs bg-indigo-100/50 px-2 py-0.5 rounded opacity-70">
                                   {toolInvocation.toolName}(...)
                                 </code>
                               </div>
                            ) : resultData ? (
                               <GenerativeInsightCard
                                 intent={`Interpreted Query: ${toolInvocation.toolName.replace(/_/g, ' ')}`}
                                 filters={toolInvocation.args as any}
                                 data={resultData.data}
                                 chartType={resultData.type}
                                 dataKeyX={resultData.x}
                                 dataKeyY={resultData.y}
                                 narrative={resultData.narrative}
                               />
                            ) : null}
                         </div>
                       );
                     })}
                  </div>
               </div>
             </div>
           ))}
           {isLoading && messages[messages.length-1]?.role === 'user' && (
              <div className="flex gap-4 max-w-[85%] mt-8 animation-pulse">
                  <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                     Semantic routing in progress...
                  </div>
              </div>
           )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 pb-8 px-8 max-w-4xl mx-auto w-full">
           <form onSubmit={handleSubmit} className="relative flex items-center">
             <input
               value={input}
               onChange={handleInputChange}
               placeholder="Ask for an insight about the Unified Payments data..."
               className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans text-[15px] shadow-sm"
               disabled={isLoading}
             />
             <button
               type="submit"
               disabled={isLoading || !input.trim()}
               className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
             >
               <Send className="h-4 w-4" />
             </button>
           </form>
           <div className="text-center mt-3 text-xs text-gray-400">
              Generative outputs mapped securely to deterministic schemas. Zero data leaves your browser.
           </div>
        </div>
      </div>
    </div>
  );
}
