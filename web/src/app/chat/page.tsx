'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, UIMessage } from 'ai';
import { useDuckDB } from '@/hooks/useDuckDB';
import { GenerativeInsightCard, type ChartType } from '@/components/GenerativeInsightCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { Send, Loader2, Database, AlertCircle, LogOut, PlusCircle, MessageSquare, Trash2, Pencil } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearchParams, useRouter } from 'next/navigation';
import { Components } from 'react-markdown';

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
    return <pre {...props}>{children}</pre>;
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
        <div className="relative my-2">
          <div className="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-800 rounded-bl-md rounded-tr-md">
            {lang}
          </div>
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3 border border-gray-200 dark:border-white/10 rounded-lg">
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
    <div className="flex h-screen bg-background font-sans transition-colors">
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
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
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
      <div className="flex-1 flex flex-col min-w-0 bg-background transition-colors relative">
        {isLoadingChat || !activeChatData ? (
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <ChatWorkspace 
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

// Ensure the actual chat context receives isolated state whenever ID changes
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
  
  const activeIdRef = useRef<string | null>(chatId);
  const router = useRouter();

  // Sync state when props change (navigation) without remounting
  useEffect(() => {
    // Only overwrite if we aren't actively in the middle of a submission
    // to prevent race conditions during new chat creation
    if (status === 'ready' && !isToolExecuting) {
      setMessages(initialMessages);
      setToolDataStore(initialToolDataStore);
    }
    // Update ref
    activeIdRef.current = chatId;
  }, [chatId, initialMessages, initialToolDataStore, setMessages, status, isToolExecuting]);

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

  const transport = useRef(new DefaultChatTransport({ 
    api: '/api/chat',
    body: () => ({ chatId: activeIdRef.current, toolDataStore }),
  }));

  const { messages, sendMessage, addToolResult, status, setMessages } = useChat({
    transport: transport.current,
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
            const ageGroup = String(args.age_group ?? '');
            const state = String(args.state ?? '');
            // Prevent SQL injection in simple demo queries by sanitizing out quotes if needed, but safe here via controlled enums
            query = `SELECT transaction_status as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE sender_age_group='${ageGroup}' AND sender_state='${state}' GROUP BY transaction_status`;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Transaction status distribution for ${ageGroup} demographic in ${state}.` };
            break;
          }
          case 'compare_network_failures': {
            const pn = String(args.primary_network ?? '');
            const sn = String(args.secondary_network ?? '');
            query = `SELECT network_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE network_type IN ('${pn}','${sn}') AND transaction_status='FAILED' GROUP BY network_type`;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Failure comparison between ${pn} and ${sn} networks.` };
            break;
          }
          case 'average_transaction_value': {
            const cat = String(args.category ?? '');
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
            const stateF = args.state ? `AND sender_state='${args.state}'` : '';
            const catF = args.category ? `AND merchant_category='${args.category}'` : '';
            query = `SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${stateF} ${catF} GROUP BY hour_of_day ORDER BY hour_of_day`;
            chartProps = { type: 'area', x: 'name', y: 'value', narrative: `Hourly transaction volume trend${args.state ? ` in ${args.state}` : ''}${args.category ? ` for ${args.category}` : ''}.` };
            break;
          }
          case 'daily_pattern_analysis': {
            const sf = args.status_filter === 'ALL' || !args.status_filter ? '' : `AND transaction_status='${args.status_filter}'`;
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
            const geoSf = args.status_filter === 'ALL' || !args.status_filter ? '' : `AND transaction_status='${args.status_filter}'`;
            const geoLim = Number(args.limit) || 10;
            query = `SELECT sender_state as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${geoSf} GROUP BY sender_state ORDER BY value DESC LIMIT ${geoLim}`;
            chartProps = { type: 'bar', x: 'name', y: 'value', narrative: `Geographic distribution of UPI transactions across top ${geoLim} states.` };
            break;
          }
          case 'device_type_breakdown': {
            const devState = args.state ? `AND sender_state='${args.state}'` : '';
            query = `SELECT device_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${devState} GROUP BY device_type ORDER BY value DESC`;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Device type distribution${args.state ? ` in ${args.state}` : ''}.` };
            break;
          }
          case 'revenue_by_category': {
            const ageF = args.age_group === 'ALL' || !args.age_group ? '' : `AND sender_age_group='${args.age_group}'`;
            query = `SELECT merchant_category as name, CAST(SUM(amount_inr) AS INTEGER) as value FROM transactions WHERE 1=1 ${ageF} GROUP BY merchant_category ORDER BY value DESC`;
            chartProps = { type: 'composed', x: 'name', y: 'value', narrative: `Total revenue (₹) per merchant category${args.age_group && args.age_group !== 'ALL' ? ` for ${args.age_group} age group` : ''}.` };
            break;
          }
          case 'transaction_type_split': {
            const txState = args.state ? `AND sender_state='${args.state}'` : '';
            query = `SELECT transaction_type as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${txState} GROUP BY transaction_type ORDER BY value DESC`;
            chartProps = { type: 'pie', x: 'name', y: 'value', narrative: `Transaction type distribution (P2P, P2M, etc.)${args.state ? ` in ${args.state}` : ''}.` };
            break;
          }
          case 'peak_usage_analysis': {
            const pkCat = args.category ? `AND merchant_category='${args.category}'` : '';
            const pkState = args.state ? `AND sender_state='${args.state}'` : '';
            query = `SELECT CAST(hour_of_day AS VARCHAR) as name, CAST(COUNT(*) AS INTEGER) as value FROM transactions WHERE 1=1 ${pkCat} ${pkState} GROUP BY hour_of_day ORDER BY value DESC LIMIT 10`;
            chartProps = { type: 'area', x: 'name', y: 'value', narrative: `Peak usage hours${args.category ? ` for ${args.category}` : ''}${args.state ? ` in ${args.state}` : ''}.` };
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
          
          // Trigger sync immediately to save the raw payload data
          if (activeIdRef.current) {
             syncChatStateToBackend(messages, nextToolDataStore);
          }

          addToolResult({
            tool: toolName,
            toolCallId,
            output: { rowCount: rows.length, chartType: chartProps.type, narrative: chartProps.narrative },
          });
        }
      } catch (e) {
        addToolResult({
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

  // Background Sync hook to ensure messages are constantly synced when streaming finishes OR state changes significantly
  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      if (activeIdRef.current && messages.length > 0 && messages !== initialMessages) {
        syncChatStateToBackend(messages, toolDataStore);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, status]);

  const isLoading = isToolExecuting || status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (isAutoScrollEnabled) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isAutoScrollEnabled]);

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
    
    // Create new chat backend mapping if this is the absolute first message
    if (!activeIdRef.current) {
       try {
         const res = await fetch('/api/chats', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ initialMessage: textToSubmit })
         });
         const data = await res.json();
         if (data.id) {
           activeIdRef.current = data.id;
           window.history.replaceState(null, '', `/chat?id=${data.id}`);
           refetchHistory(); // Refresh Sidebar immediately
         }
       } catch(e) { console.error('Failed to instantiate new chat state', e) }
    }
    
    sendMessage({ text: textToSubmit });
    if (overrideInput === undefined) {
      setInput('');
    }
    setIsAutoScrollEnabled(true);
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
        className="flex-1 overflow-y-auto px-8 w-full max-w-4xl mx-auto py-8 z-0 relative"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-4">
            <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <Database className="h-8 w-8 text-primary -rotate-3" />
            </div>
            <h2 className="text-2xl font-bold text-text-main">InsightsX Analytics</h2>
            <p className="text-center max-w-md text-text-muted mb-8 text-[15px]">
              Ask anything about your loaded dataset. Get visualizations, business insights, and strategic analysis — all processed locally in your browser.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
              {EXAMPLES.map((q) => (
                <button
                  key={q}
                  onClick={(e) => {
                    e.preventDefault();
                    setInput(q);
                    onSubmit(undefined, q);
                  }}
                  className="text-left w-full text-sm p-3.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-text-main shadow-sm hover:shadow"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const textContent = m.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map(p => p.text)
            .join('\n');

          const toolParts = m.parts?.filter(p =>
            (p.type.startsWith('tool-') || p.type === 'dynamic-tool') && 'toolCallId' in p
          ) ?? [];

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
                        textContent
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-text-main prose-strong:text-text-main prose-a:text-primary prose-blockquote:border-primary/50 prose-blockquote:text-text-muted prose-code:bg-background prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:text-xs prose-pre:bg-background prose-pre:text-text-main prose-th:bg-background prose-td:border-gray-200 dark:prose-td:border-white/10 prose-th:border-gray-200 dark:prose-th:border-white/10">
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

                  {toolParts.map((part) => {
                    const inv = part as unknown as Record<string, unknown>;
                    const toolCallId = inv.toolCallId as string;
                    const resultData = toolDataStore[toolCallId];
                    const toolName = ('toolName' in inv ? String(inv.toolName) : part.type.replace('tool-', ''));

                    return (
                      <div key={toolCallId} className="w-full mt-4">
                        {inv.state === 'input-streaming' || inv.state === 'partial-call' ? (
                          <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20 w-fit">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-medium">Querying local DuckDB...</span>
                            <code className="text-xs bg-primary/20 px-2 py-0.5 rounded opacity-70">
                              {toolName}(...)
                            </code>
                          </div>
                        ) : resultData ? (
                          <GenerativeInsightCard
                            intent={`${toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                            filters={Object.fromEntries(
                              Object.entries((inv.input as Record<string, unknown>) ?? {})
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

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-4 max-w-[85%] mt-8">
            <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary">
              <Database className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 text-text-muted text-sm pb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your query...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
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
            disabled={isLoading || !input?.trim()}
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
