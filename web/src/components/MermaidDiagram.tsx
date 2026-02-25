'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;
let mermaidCounter = 0;

function initMermaid() {
  if (initialized) return;
  initialized = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: '#eef2ff',
      primaryBorderColor: '#6366f1',
      primaryTextColor: '#1e1b4b',
      lineColor: '#6366f1',
      secondaryColor: '#f0fdf4',
      tertiaryColor: '#fefce8',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
    },
    flowchart: { curve: 'basis', padding: 15 },
    sequence: { mirrorActors: false },
    securityLevel: 'loose',
  });
}

function sanitizeMermaidCode(raw: string): string {
  let code = raw.trim();
  
  // Remove markdown fences if the LLM accidentally includes them
  code = code.replace(/^```mermaid\s*/i, '').replace(/^```\s*/gm, '').replace(/```\s*$/gm, '');
  
  // Remove HTML tags that can break mermaid
  code = code.replace(/<br\s*\/?>/gi, '\n');
  code = code.replace(/<[^>]+>/g, '');
  
  // Fix common LLM mistakes
  // Replace smart quotes with regular quotes
  code = code.replace(/[""]/g, '"').replace(/['']/g, "'");
  
  // Fix parentheses in node labels — wrap in quotes if they contain special chars
  // e.g., A(Payment Service Provider) → A["Payment Service Provider"]
  code = code.replace(/(\w+)\(([^)]*[&/<>][^)]*)\)/g, '$1["$2"]');
  
  // Remove empty lines between graph declarations and nodes
  code = code.replace(/\n{3,}/g, '\n\n');
  
  return code.trim();
}

export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${Date.now()}-${mermaidCounter++}`);
  const prevCodeRef = useRef('');

  useEffect(() => {
    const sanitized = sanitizeMermaidCode(code);
    
    // Don't re-render if code hasn't meaningfully changed
    if (sanitized === prevCodeRef.current) return;
    prevCodeRef.current = sanitized;
    
    // Skip rendering incomplete diagrams (streaming)
    if (!sanitized || sanitized.length < 10) return;
    
    // Check it starts with a valid mermaid keyword
    const validStarts = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline', 'sankey', 'block'];
    const firstWord = sanitized.split(/[\s\n]/)[0].toLowerCase().replace('-', '');
    const looksValid = validStarts.some(v => firstWord.startsWith(v.toLowerCase().replace('-', '')));
    
    if (!looksValid) {
      setError('Invalid diagram syntax');
      return;
    }

    let cancelled = false;
    const newId = `mermaid-${Date.now()}-${mermaidCounter++}`;

    initMermaid();
    
    async function render() {
      try {
        const { svg: rendered } = await mermaid.render(newId, sanitized);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Mermaid render error:', err);
          setError(String(err));
          setSvg('');
        }
      }
    }

    // Debounce to avoid rendering during streaming
    const timeout = setTimeout(render, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [code]);

  if (error) {
    // Show the raw mermaid code in a styled fallback
    const sanitized = sanitizeMermaidCode(code);
    return (
      <div className="my-3 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Diagram (text fallback)
        </div>
        <pre className="p-3 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{sanitized}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-3 text-center text-gray-400 text-sm animate-pulse">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div className="my-3 bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto shadow-sm">
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svg }}
        className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
      />
    </div>
  );
}
