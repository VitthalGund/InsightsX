'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, UIMessage } from 'ai';
import { useDuckDB } from '@/hooks/useDuckDB';
import { GenerativeInsightCard, type ChartType } from '@/components/GenerativeInsightCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { Send, Loader2, Database, AlertCircle, LogOut, PlusCircle, MessageSquare, Trash2, Pencil } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearchParams, useRouter } from 'next/navigation';
import { Components } from 'react-markdown';
import { ExecutiveDashboard } from '@/components/ExecutiveDashboard';
import { BoardroomReport } from '@/components/BoardroomReport';

interface ChartProps {
  type: ChartType;
  x: string;
  y: string;
  narrative: string;
}

interface ToolData extends ChartProps {
  data: Record<string, unknown>[];
  sql?: string;
}

const markdownComponents: Components = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pre({ children, ...props }: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = (children as any)?.[0] || children;
    if (child?.props?.className?.includes('language-mermaid')) {
      return <>{children}</>;
    }
    return <pre className="overflow-x-auto max-w-full p-4 rounded-lg bg-gray-900 text-gray-100" {...props}>{children}</pre>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match?.[1];
    const codeString = String(children).replace(/\n$/, '');
    
    if (lang === 'mermaid') {
      return <MermaidDiagram code={codeString} />;
    }
    
    if (lang) {
      return (
        <div className="relative my-2 max-w-full">
          <div className="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-800 rounded-bl-md rounded-tr-md">
            {lang}
          </div>
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      );
    }
    return <code className={`${className} break-words`} {...props}>{children}</code>;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3 border border-gray-200 dark:border-white/10 rounded-lg max-w-full">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    );
  },
};

export default function ChatDashboardPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-background text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ChatDashboardContainer />
    </Suspense>
  );
}

function ChatDashboardContainer() {
  const { data: session } = useSession();
  const { db, loading: dbLoading, error: dbError } = useDuckDB();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const chatId = searchParams?.get('id') || null;

  const [chatHistory, setChatHistory] = useState<{_id: string, title: string, updatedAt: string}[]>([]);
  const [activeChatData, setActiveChatData] = useState<{messages: UIMessage[], toolDataStore: Record<string, ToolData>} | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchChats = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      if (data.chats) setChatHistory(data.chats);
    } catch(e) { console.error('Failed to fetch history', e) }
  }, [session]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!chatId) {
      setActiveChatData({ messages: [], toolDataStore: {} });
      return;
    }
    let isMounted = true;
    const fetchActive = async () => {
      setIsLoadingChat(true);
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        const data = await res.json();
        if (isMounted && data.chat) {
          setActiveChatData({
            messages: data.chat.messages || [],
            toolDataStore: data.chat.toolDataStore || {}
          });
        }
      } catch(e) { 
        console.error('Failed to fetch chat contents', e); 
      } finally { 
        if (isMounted) setIsLoadingChat(false); 
      }
    };
    fetchActive();
    return () => { isMounted = false; };
  }, [chatId]);

  const handleCreateNewChat = () => {
    router.replace('/chat');
  };

  const handleRenameSubmit = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setEditingChatId(null);
      fetchChats();
    } catch(e) { console.error(e); }
  };

  const handleDeleteChat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      if (chatId === id) {
        router.replace('/chat');
      }
      fetchChats();
    } catch(e) { console.error(e); }
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-muted font-sans transition-colors">
        <Database className="h-8 w-8 text-primary mb-4 animate-pulse" />
        <p className="text-lg font-medium text-text-main">Booting In-Browser Data Engine...</p>
        <p className="text-sm mt-2">Loading transactions.parquet (0 network latency)</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-red-500/10 font-sans transition-colors">
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-red-500/20 max-w-lg text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-500 mb-2">Engine Initialization Failed</h1>
          <p className="text-red-400">{dbError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans transition-colors overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-surface border-r border-gray-200 dark:border-white/10 shadow-sm flex flex-col transition-colors z-10 shrink-0">
        <div className="p-6 border-b border-gray-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Database className="h-5 w-5" />
              <h1 className="text-lg font-bold tracking-tight text-text-main">InsightsX OLAP</h1>
            </div>
            <p className="text-[13px] text-text-muted leading-tight">Zero-latency In-Browser Analytics.</p>
          </div>
          <button 
            onClick={handleCreateNewChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-dark rounded-xl font-medium transition-colors border border-primary/20 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">History</h3>
          {chatHistory.length === 0 && (
            <p className="text-xs text-text-muted px-2 py-4 italic text-center">No previous chats.</p>
          )}
          {chatHistory.map((history) => (
            <div 
              key={history._id} 
              className={`group flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer ${
                chatId === history._id 
                  ? 'bg-primary/10 border-primary/30 text-primary' 
                  : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-text-main'
              }`}
              onClick={() => {
                if (chatId !== history._id && editingChatId !== history._id) {
                  router.push(`/chat?id=${history._id}`);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                {editingChatId === history._id ? (
                  <form 
                    className="flex-1 min-w-0"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit(history._id, editTitle);
                    }}
                  >
                    <input 
                      autoFocus
                      className="w-full bg-background border border-primary/50 text-text-main rounded px-2 py-0.5 text-sm focus:outline-none"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onBlur={() => handleRenameSubmit(history._id, editTitle)}
                    />
                  </form>
                ) : (
                  <span className="text-sm truncate pr-2 font-medium">{history.title}</span>
                )}
              </div>
              
              {editingChatId !== history._id && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTitle(history.title);
                      setEditingChatId(history._id);
                    }}
                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(history._id);
                    }}
                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* User Profile / Logout */}
        <div className="px-4 pt-4 pb-12 border-t border-gray-200 dark:border-white/10 bg-surface/80 flex items-center justify-between mt-auto shrink-0 transition-colors relative">
          <div className="text-[13px] font-medium text-text-main truncate min-w-0 pr-3 z-10">
             {session?.user?.email}
          </div>
          <div className="flex gap-1 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="p-2 text-text-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-background transition-colors relative overflow-hidden">
        {isLoadingChat || !activeChatData ? (
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <ChatWorkspace 
            key={chatId || 'new'}
            chatId={chatId}
            initialMessages={activeChatData.messages}
            initialToolDataStore={activeChatData.toolDataStore}
            db={db}
            refetchHistory={fetchChats}
          />
        )}
      </div>
    </div>
  );
}

function ChatWorkspace({ 
  chatId, 
  initialMessages, 
  initialToolDataStore, 
  db, 
  refetchHistory 
}: {
  chatId: string | null;
  initialMessages: UIMessage[];
  initialToolDataStore: Record<string, ToolData>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  refetchHistory: () => void;
}) {
  const [toolDataStore, setToolDataStore] = useState<Record<string, ToolData>>(initialToolDataStore);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isToolExecuting, setIsToolExecuting] = useState(false);
  const [input, setInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeReport, setActiveReport] = useState<any | null>(null);
  
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');
  
  const activeIdRef = useRef<string | null>(chatId);
  const [anomaly, setAnomaly] = useState<{title: string, query: string} | null>(null);

  useEffect(() => {
    if (!db) return;
    let isMounted = true;
    const checkAnomalies = async () => {
      try {
        const c = await db.connect();
        const res = await c.query(`
          SELECT sender_bank, 
                 CAST(SUM(CASE WHEN transaction_status = 'FAILED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as fail_rate 
          FROM transactions 
          WHERE sender_bank IS NOT NULL
          GROUP BY sender_bank 
          HAVING fail_rate > 10
          ORDER BY fail_rate DESC 
          LIMIT 1
        `);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstRow = (res.toArray() as any[])[0];
        if (isMounted && firstRow) {
          setAnomaly({
            title: `Spike in Failure Rates detected for ${firstRow.sender_bank} (${Number(firstRow.fail_rate).toFixed(1)}%)`,
            query: `Analyze technical decline rates for ${firstRow.sender_bank}. Why are they failing and what is the business impact? Include comparison with average failure rates.`
          });
        }
        await c.close();
      } catch (e) { console.error("Anomaly Detection Error:", e) }
    }
    checkAnomalies();
    return () => { isMounted = false; }
  }, [db]);

  // Helper for sanitizing SQL strings
  const sanitize = (str: string) => str.replace(/'/g, "''");

  // Active sync function that saves state to backend
  const syncChatStateToBackend = async (msgs: UIMessage[], tds: Record<string, ToolData>) => {
    const cid = activeIdRef.current;
    if (!cid) return;
    try {
      await fetch(`/api/chats/${cid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, toolDataStore: tds })
      });
    } catch (e) { console.error('Failed to sync chat state to DB', e); }
  };

  const toolDataStoreRef = useRef(toolDataStore);
  useEffect(() => {
    toolDataStoreRef.current = toolDataStore;
  }, [toolDataStore]);

  const transport = useMemo(() => new DefaultChatTransport({ 
    api: '/api/chat',
    prepareSendMessagesRequest: ({ messages }) => {
      return {
        body: { 
          messages,
          chatId: activeIdRef.current, 
          toolDataStore: toolDataStoreRef.current 
        }
      };
    }
  }), []);

  // FIX: Collect all helper functions to bypass strict SDK TypeScript errors dynamically
  const chatHelpers = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // @ts-expect-error AI SDK type definitions for initialMessages mismatch in local environment
    initialMessages,
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async onToolCall({ toolCall }: { toolCall: any }) {
      setIsToolExecuting(true);
      if (!db || toolCall.dynamic) { setIsToolExecuting(false); return; }

      const toolName = toolCall.toolName as string;
      const toolCallId = toolCall.toolCallId as string;
      const args = (toolCall.input ?? {}) as Record<string, unknown>;

      const c = await db.connect();
      try {
        let query = '';
        let chartProps: ChartProps = { type: 'bar', x: 'name', y: 'value', narrative: '' };

        switch (toolName) {
          case 'analyze_transaction_status': {
            const ageGroup = sanitize(String(args.age_group ?? ''));
            const state = sanitize(String(args.state ?? ''));
            query = `SELECT transaction_status as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE sender_age_group='${ageGroup}' AND sender_state='${state}' GROUP BY transaction_status`;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Transaction status distribution for ${ageGroup} demographic in ${state}.` };
            break;
          }
          case 'compare_network_failures': {
            const pn = sanitize(String(args.primary_network ?? ''));
            const sn = sanitize(String(args.secondary_network ?? ''));
            query = `SELECT network_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE network_type IN ('${pn}','${sn}') AND transaction_status='FAILED' GROUP BY network_type`;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Failure comparison between ${pn} and ${sn} networks.` };
            break;
          }
          case 'average_transaction_value': {
            const cat = sanitize(String(args.category ?? ''));
            const sh = Number(args.start_hour ?? 0);
            const eh = Number(args.end_hour ?? 23);
            query = `SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(AVG(amount_inr) AS INTEGER) as value FROM transactions WHERE merchant_category='${cat}' AND hour_of_day BETWEEN ${sh} AND ${eh} GROUP BY hour_of_day ORDER BY hour_of_day`;
            chartProps = { type: 'line', x: 'name', y: 'value', narrative: `Average ₹ for ${cat} between ${sh}:00 and ${eh}:00.` };
            break;
          }
          case 'merchant_risk_analysis': {
            const lim = Number(args.limit) || 5;
            query = `SELECT merchant_category as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE fraud_flag=1 GROUP BY merchant_category ORDER BY value DESC LIMIT ${lim}`;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Top ${lim} categories flagged for anomalous transactions.` };
            break;
          }
          case 'hourly_volume_trend': {
            const stateF = args.state ? `AND sender_state='${sanitize(String(args.state))}'` : '';
            const catF = args.category ? `AND merchant_category='${sanitize(String(args.category))}'` : '';
            query = `SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${stateF} ${catF} GROUP BY hour_of_day ORDER BY hour_of_day`;
            chartProps = { type: 'area', x: 'name', y: 'value', narrative: `Hourly transaction volume trend${args.state ? ` in ${args.state}` : ''}${args.category ? ` for ${args.category}` : ''}.` };
            break;
          }
          case 'daily_pattern_analysis': {
            const sf = args.status_filter === 'ALL' || !args.status_filter ? '' : `AND transaction_status='${sanitize(String(args.status_filter))}'`;
            query = `SELECT day_of_week as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${sf} GROUP BY day_of_week ORDER BY CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 END`;
            chartProps = { type: 'radar', x: 'name', y: 'value', narrative: `Weekly transaction pattern${args.status_filter && args.status_filter !== 'ALL' ? ` (${args.status_filter} only)` : ''}.` };
            break;
          }
          case 'bank_performance': {
            const bankLim = Number(args.limit) || 10;
            query = `SELECT sender_bank as name, CAST(SUM(CASE WHEN transaction_status='SUCCESS' THEN 1 ELSE 0 END) AS INTEGER) as value, CAST(SUM(CASE WHEN transaction_status='FAILED' THEN 1 ELSE 0 END) AS INTEGER) as failed FROM transactions GROUP BY sender_bank ORDER BY (value+failed) DESC LIMIT ${bankLim}`;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Top ${bankLim} banks by transaction volume (success count shown).` };
            break;
          }
          case 'geographic_distribution': {
            const geoSf = args.status_filter === 'ALL' || !args.status_filter ? '' : `AND transaction_status='${sanitize(String(args.status_filter))}'`;
            const geoLim = Number(args.limit) || 10;
            query = `SELECT sender_state as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${geoSf} GROUP BY sender_state ORDER BY value DESC LIMIT ${geoLim}`;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Geographic distribution of UPI transactions across top ${geoLim} states.` };
            break;
          }
          case 'device_type_breakdown': {
            const devState = args.state ? `AND sender_state='${sanitize(String(args.state))}'` : '';
            query = `SELECT device_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${devState} GROUP BY device_type ORDER BY value DESC`;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Device type distribution${args.state ? ` in ${args.state}` : ''}.` };
            break;
          }
          case 'revenue_by_category': {
            const ageF = args.age_group === 'ALL' || !args.age_group ? '' : `AND sender_age_group='${sanitize(String(args.age_group))}'`;
            query = `SELECT merchant_category as name, CAST(SUM(amount_inr) AS INTEGER) as value FROM transactions WHERE 1=1 ${ageF} GROUP BY merchant_category ORDER BY value DESC`;
            chartProps = { type: 'composed', x: 'name', y: 'value', narrative: `Total revenue (₹) per merchant category${args.age_group && args.age_group !== 'ALL' ? ` for ${args.age_group} age group` : ''}.` };
            break;
          }
          case 'transaction_type_split': {
            const txState = args.state ? `AND sender_state='${sanitize(String(args.state))}'` : '';
            query = `SELECT transaction_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${txState} GROUP BY transaction_type ORDER BY value DESC`;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Transaction type distribution (P2P, P2M, etc.)${args.state ? ` in ${args.state}` : ''}.` };
            break;
          }
          case 'peak_usage_analysis': {
            const pkCat = args.category ? `AND merchant_category='${sanitize(String(args.category))}'` : '';
            const pkState = args.state ? `AND sender_state='${sanitize(String(args.state))}'` : '';
            query = `SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${pkCat} ${pkState} GROUP BY hour_of_day ORDER BY value DESC LIMIT 10`;
            chartProps = { type: 'area', x: 'name', y: 'value', narrative: `Peak usage hours${args.category ? ` for ${args.category}` : ''}${args.state ? ` in ${args.state}` : ''}.` };
            break;
          }
          case 'simulate_fraud_rule': {
            const delta = Number(args.stringency_delta) || 0;
            query = `
              WITH baselines AS (
                SELECT 
                  SUM(fraud_flag) as base_blocked,
                  CAST(COUNT(*) * 0.02 AS INTEGER) as base_false
                FROM transactions
              )
              SELECT 'Original Blocked Fraud' as name, base_blocked as value FROM baselines
              UNION ALL
              SELECT 'Simulated Blocked Fraud (${delta>0?'+':''}${delta}%)' as name, CAST(base_blocked * (1.0 + (${delta} / 100.0)) AS INTEGER) as value FROM baselines
              UNION ALL
              SELECT 'Original False Declines' as name, base_false as value FROM baselines
              UNION ALL
              SELECT 'Simulated False Declines (${delta>0?'+':''}${delta}%)' as name, CAST(base_false * (1.0 + (${Math.max(0, delta)} / 50.0)) AS INTEGER) as value FROM baselines
            `;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Simulation impact: ${delta}% change in fraud rule stringency.` };
            break;
          }
          case 'simulate_outage': {
            const partnerName = sanitize(String(args.partner_name ?? ''));
            const duration = Number(args.duration_hours) || 1;
            query = `
              WITH partner_volume AS (
                SELECT 
                  sender_bank,
                  CAST(COUNT(*) / 365.0 AS INTEGER) as daily_avg_tx,
                  CAST(SUM(amount_inr) / 365.0 AS INTEGER) as daily_avg_inr
                FROM transactions
                WHERE LOWER(sender_bank) LIKE LOWER('%${partnerName.toLowerCase()}%') OR LOWER(network_type) LIKE LOWER('%${partnerName.toLowerCase()}%')
                GROUP BY sender_bank
                LIMIT 1
              )
              SELECT 'Normal Daily Volume (INR)' as name, daily_avg_inr as value FROM partner_volume
              UNION ALL
              SELECT 'Estimated Lost Volume (INR)' as name, CAST(daily_avg_inr * (${duration} / 24.0) AS INTEGER) as value FROM partner_volume
            `;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Simulated impact of ${duration} hour outage for ${partnerName}.` };
            break;
          }
          case 'generate_boardroom_report': {
            query = `
              WITH metrics AS (
                SELECT 
                  SUM(CASE WHEN transaction_status = 'SUCCESS' THEN amount_inr ELSE 0 END) as tpv,
                  CAST(SUM(CASE WHEN transaction_status = 'FAILED' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as decline_rate,
                  CAST(SUM(fraud_flag) AS FLOAT) / COUNT(*) * 100 as fraudRate,
                  COUNT(*) as totalTxCount,
                  SUM(CASE WHEN transaction_status = 'FAILED' THEN 1 ELSE 0 END) as failedTxCount
                FROM transactions
              ),
              top_state AS (
                SELECT sender_state as state, SUM(amount_inr) as volume 
                FROM transactions WHERE transaction_status = 'SUCCESS' GROUP BY sender_state ORDER BY volume DESC LIMIT 1
              ),
              top_cat AS (
                SELECT merchant_category as category, SUM(amount_inr) as volume 
                FROM transactions WHERE transaction_status = 'SUCCESS' GROUP BY merchant_category ORDER BY volume DESC LIMIT 1
              )
              SELECT 
                m.tpv, m.fraudRate, m.totalTxCount, m.failedTxCount,
                s.state as top_state_name, s.volume as top_state_volume,
                c.category as top_cat_name, c.volume as top_cat_volume
              FROM metrics m
              CROSS JOIN top_state s
              CROSS JOIN top_cat c
            `;
            chartProps = { type: 'boardroom', x: '', y: '', narrative: 'Generated Executive Boardroom Report.' };
            break;
          }
        }

        if (query) {
          const result = await c.query(query);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows = result.toArray().map((r: any) => {
            const entries = r as Iterable<[string, unknown]>;
            return Object.fromEntries(entries);
          });

          const nextToolDataStore = {
            ...toolDataStore,
            [toolCallId]: { data: rows, ...chartProps, sql: query }
          };
          
          setToolDataStore(nextToolDataStore);
          
          if (activeIdRef.current) {
             syncChatStateToBackend(chatHelpers.messages, nextToolDataStore);
          }

          chatHelpers.addToolResult({
            tool: toolName,
            toolCallId,
            output: { rowCount: rows.length, chartType: chartProps.type, narrative: chartProps.narrative },
          });
        }
      } catch (e) {
        chatHelpers.addToolResult({
          tool: toolName,
          toolCallId,
          output: { error: String(e) },
        });
      } finally {
        await c.close();
        setIsToolExecuting(false);
      }
    }
  });

  const { messages, status } = chatHelpers;
  
  // DEBUG LOG
  console.log('[ChatWorkspace Render Mode] messages.length:', messages.length, 'status:', status, 'isCreatingChat:', isCreatingChat);
  const isLoading = isToolExecuting || status === 'submitted' || status === 'streaming' || isCreatingChat;

  useEffect(() => {
    activeIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      if (activeIdRef.current && messages.length > 0 && messages !== initialMessages) {
        syncChatStateToBackend(messages, toolDataStore);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, status]);


  useEffect(() => {
    if (isAutoScrollEnabled) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isAutoScrollEnabled, isCreatingChat]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAutoScrollEnabled(isAtBottom);
  };

  const onSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const textToSubmit = overrideInput !== undefined ? overrideInput : input;
    if (!textToSubmit.trim() || isLoading) return;
    
    setInput('');
    setPendingQuery(textToSubmit);
    setIsAutoScrollEnabled(true);
    
    let currentChatId = activeIdRef.current;

    // Create new chat backend mapping if this is the absolute first message
    if (!currentChatId) {
       setIsCreatingChat(true); 
       try {
         const res = await fetch('/api/chats', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ initialMessage: textToSubmit })
         });
         const data = await res.json();
         if (data.id) {
           currentChatId = data.id;
           activeIdRef.current = data.id;
           // window.history.replaceState(null, '', `/chat?id=${data.id}`);
           refetchHistory(); 
         }
       } catch(e) { 
         console.error('Failed to instantiate new chat state', e) 
       } finally {
         setIsCreatingChat(false);
       }
    }
    
    const msgId = Date.now().toString();
    const newMsg = { id: msgId, role: 'user', content: textToSubmit, parts: [{ type: 'text', text: textToSubmit }] };
    chatHelpers.setMessages([...chatHelpers.messages, newMsg as any]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chatHelpers.sendMessage({ id: msgId, role: 'user', content: textToSubmit } as any).catch((e: unknown) => {
        console.error('Failed to send message:', e);
    });
    
    setPendingQuery('');
  };

  const EXAMPLES = [
    'Show me the distribution of transaction statuses for the 18-25 age group in Maharashtra',
    'Compare technical failure rates on 4G vs 5G networks',
    'What merchant categories have the highest fraud flags?',
    'Show me the hourly transaction volume trend',
    'Which states have the most UPI transactions?',
    'Show me revenue by merchant category',
    'Which banks have the best success rates?',
    'Give me a business overview of the UPI data',
  ];

  return (
    <>
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden w-full mx-auto pb-8 z-0 relative [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/** Anomaly Banner **/}
        {anomaly && messages.length === 0 && !isCreatingChat && (
          <div className="mx-auto max-w-5xl mt-6 px-4 sm:px-8">
             <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[15px]">🚨 Anomaly Detected</h4>
                    <p className="text-sm opacity-90 mt-0.5">{anomaly.title}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    onSubmit(undefined, anomaly.query);
                  }}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium whitespace-nowrap shadow-sm"
                >
                  Click here for AI Root Cause Analysis
                </button>
             </div>
          </div>
        )}

        {/* Empty State: Executive Dashboard */}
        {messages.length === 0 && !isCreatingChat && (
          <div className="h-full w-full px-4 sm:px-8 pb-32">
             <ExecutiveDashboard onAnalyze={(q) => onSubmit(undefined, q)} />
          </div>
        )}

        {messages.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
            {messages.map((m) => {
          // FIX: The silent UI bug. Standard user messages have `content` string, not `parts`.
           
          const textContent = m.parts 
            ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')
            : '';

          // FIX: Standardize tool extractions to support AI SDK v3 / v4 mixed formats 
          const toolInvocations = ('toolInvocations' in m && m.toolInvocations) ? (m as any).toolInvocations as any[] : [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolParts = m.parts?.filter((p: any) => (p.type.startsWith('tool-') || p.type === 'dynamic-tool') && 'toolCallId' in p) || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeTools: any[] = ((toolInvocations as any[])?.length > 0) ? (toolInvocations as any[]) : (toolParts as any[]);

          return (
            <div key={m.id} className={`mb-8 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${m.role === 'user' ? 'bg-surface border border-gray-200 dark:border-white/10 text-text-muted' : 'bg-primary/20 text-primary'}`}>
                  {m.role === 'user' ? 'U' : <Database className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2 min-w-0">
                  {textContent && (
                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm border ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none border-transparent'
                        : 'bg-surface text-text-main rounded-tl-none border-gray-200 dark:border-white/10'
                    }`}>
                      {m.role === 'user' ? (
                        <div className="wrap-break-word whitespace-pre-wrap">{textContent}</div>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert break-words prose-headings:text-text-main prose-strong:text-text-main prose-a:text-primary prose-blockquote:border-primary/50 prose-blockquote:text-text-muted prose-code:bg-background prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:text-xs prose-pre:bg-background prose-pre:text-text-main prose-th:bg-background prose-td:border-gray-200 dark:prose-td:border-white/10 prose-th:border-gray-200 dark:prose-th:border-white/10">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {textContent}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(activeTools || []).map((part: any) => {
                    const toolCallId = part.toolCallId as string;
                    const resultData = toolDataStore[toolCallId];
                    const toolName = (part.toolName ? String(part.toolName) : String(part.type).replace('tool-', ''));

                    return (
                      <div key={toolCallId} className="w-full mt-4">
                        {part.state === 'input-streaming' || part.state === 'partial-call' ? (
                          <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20 w-fit">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-medium">Initializing Secure Analytics Engine...</span>
                            <code className="text-xs bg-primary/20 px-2 py-0.5 rounded opacity-70">
                              {toolName}(...)
                            </code>
                          </div>
                        ) : resultData ? (
                          resultData.type === 'boardroom' ? (
                            <div className="flex flex-col gap-3 p-5 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl max-w-sm mt-4">
                              <h4 className="font-semibold text-primary/90">Executive Summary Ready</h4>
                              <p className="text-sm text-text-muted mb-1">Your comprehensive boardroom report has been generated successfully.</p>
                              <button 
                                onClick={(e) => { e.preventDefault(); setActiveReport(resultData.data[0]); }}
                                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                              >
                                View Printable Report
                              </button>
                            </div>
                          ) : (
                            <GenerativeInsightCard
                              intent={`${toolName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`}
                              filters={Object.fromEntries(
                                Object.entries((part.args || part.input || {}) as Record<string, unknown>)
                                  .filter(([, v]) => v !== undefined && v !== null && v !== '')
                                  .map(([k, v]) => [k.replace(/_/g, ' '), String(v)])
                              )}
                              data={resultData.data}
                              chartType={resultData.type}
                              dataKeyX={resultData.x}
                              dataKeyY={resultData.y}
                              narrative={resultData.narrative}
                              executedQuery={resultData.sql}
                            />
                          )
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-500 rounded-lg text-sm border border-amber-500/20 w-fit">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing {toolName}...</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        </div>
        )}

        {isCreatingChat && pendingQuery && (
          <div className="mb-8 flex justify-end">
            <div className="flex gap-4 max-w-[85%] flex-row-reverse">
              <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-gray-200 dark:border-white/10 text-text-muted">
                U
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm border bg-primary text-white rounded-tr-none border-transparent break-words whitespace-pre-wrap">
                  {pendingQuery}
                </div>
              </div>
            </div>
          </div>
        )}

        {(isLoading) && (messages[messages.length - 1]?.role === 'user' || isCreatingChat) && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8">
            <div className="flex gap-4 max-w-[85%] mt-8">
              <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary">
                <Database className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 text-text-muted text-sm pb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isCreatingChat ? 'Initializing secure session...' : 'Analyzing your query...'}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {activeReport && <BoardroomReport data={activeReport} onClose={() => setActiveReport(null)} />}

      <div className="p-4 bg-background border-t border-gray-200 dark:border-white/10 pb-8 px-8 max-w-4xl mx-auto w-full transition-colors shrink-0 z-10 bg-linear-to-t from-background via-background to-transparent">
        <form onSubmit={onSubmit} className="relative flex items-center shadow-lg rounded-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the UPI transaction data... (e.g., 'Compare failures on 4G and 5G')"
            className="w-full bg-surface border-gray-200 dark:border-white/10 border text-text-main placeholder:text-text-muted rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-sans text-[15px]"
            disabled={isLoading}
          />
          <button
            id="chat-submit-btn"
            type="submit"
            disabled={isLoading || (!input?.trim() && !pendingQuery)}
            className="absolute right-2 p-2.5 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <div className="text-center mt-3 text-xs text-text-muted">
          AI-powered analytics processed securely in your browser. Zero data leaves your device.
        </div>
      </div>
    </>
  );
}
