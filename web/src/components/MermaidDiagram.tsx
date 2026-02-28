'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
      fontSize: '14px',
    },
    flowchart: { curve: 'basis', padding: 15 },
    sequence: { mirrorActors: false, width: 180, height: 50 },
    securityLevel: 'loose',
  });
}

function sanitizeMermaidCode(raw: string): string {
  let code = raw.trim();
  code = code.replace(/^```mermaid\s*/i, '').replace(/^```\s*/gm, '').replace(/```\s*$/gm, '');
  code = code.replace(/<br\s*\/?>/gi, '\n');
  code = code.replace(/<[^>]+>/g, '');
  code = code.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  code = code.replace(/[→⟶➔]/g, '-->'); // Fix DeepSeek unicode arrows
  code = code.replace(/─/g, '-');       // Fix box-drawing characters used as dashes
  code = code.replace(/\n{3,}/g, '\n\n');
  return code.trim();
}

/**
 * Only strip width/height from the ROOT <svg> element.
 * Do NOT touch child elements like <rect>, <text>, etc.
 */
function makeSvgResponsive(svgHtml: string): string {
  // Match only the opening <svg tag (first occurrence)
  const svgOpenTagMatch = svgHtml.match(/^(<svg\s[^>]*>)/);
  if (!svgOpenTagMatch) return svgHtml;

  let rootTag = svgOpenTagMatch[1];
  const rest = svgHtml.slice(rootTag.length);

  // Strip width/height/style from root SVG only
  rootTag = rootTag.replace(/\s+width="[^"]*"/, '');
  rootTag = rootTag.replace(/\s+height="[^"]*"/, '');
  rootTag = rootTag.replace(/\s+style="[^"]*"/, '');

  // Add responsive style
  rootTag = rootTag.replace('<svg ', '<svg style="width:100%;height:auto;" ');

  return rootTag + rest;
}

// ─── Fullscreen Modal ───────────────────────────────────────────────
function FullscreenModal({ svg, code, onClose }: { svg: string; code: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const responsiveSvg = makeSvgResponsive(svg);

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[92vw] h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Diagram — Full View
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Close (Esc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable diagram area */}
        <div className="flex-1 overflow-auto p-8 bg-white min-h-0">
          {responsiveSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: responsiveSvg }}
              className="w-full min-h-[400px]"
            />
          ) : (
            <pre className="text-sm text-gray-600 font-mono whitespace-pre-wrap p-4 bg-gray-50 rounded-lg">{code}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mermaid Diagram Component ──────────────────────────────────────
export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevCodeRef = useRef('');

  const openFullscreen = useCallback(() => { if (svg) setIsFullscreen(true); }, [svg]);
  const closeFullscreen = useCallback(() => setIsFullscreen(false), []);

  const [debouncedCode, setDebouncedCode] = useState(code);

  // Debounce the code changes to avoid rendering unfinished diagrams constantly
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 1500); // 1.5s debounce since AI streams slowly
    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    const sanitized = sanitizeMermaidCode(debouncedCode);
    if (!sanitized) return;

    if (sanitized === prevCodeRef.current) return;
    prevCodeRef.current = sanitized;

    const validStarts = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline', 'sankey', 'block', 'architecture'];
    const firstWord = sanitized.split(/[\s\n]/)[0].toLowerCase().replace(/-/g, '');
    const looksValid = validStarts.some(v => firstWord.startsWith(v));

    if (!looksValid) {
      setError(`Unrecognized diagram type: ${firstWord}`);
      return;
    }

    let cancelled = false;
    const newId = `mermaid-${Date.now()}-${mermaidCounter++}`;

    async function render() {
      try {
        initMermaid();
        document.querySelectorAll('[id^="dmermaid-"]').forEach(el => el.remove());
        document.querySelectorAll('.mermaid-error').forEach(el => el.remove());

        const renderPromise = mermaid.render(newId, sanitized);
        
        let timerId: NodeJS.Timeout;
        const timeoutPromise = new Promise((_, reject) => {
          timerId = setTimeout(() => {
            reject(new Error('Mermaid render timeout (5s)'));
          }, 5000);
        });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { svg: rendered } = await Promise.race([renderPromise, timeoutPromise]) as any;
        clearTimeout(timerId!);
        
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        document.querySelectorAll(`#${CSS.escape(newId)}`).forEach(el => el.remove());
        document.querySelectorAll('[id^="dmermaid-"]').forEach(el => el.remove());

        if (!cancelled) {
          console.warn('Mermaid render error:', err);
          setError(String(err));
          setSvg('');
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [debouncedCode]);

  // Removed 6-second absolute timeout to allow slow AI generation

  const sanitized = sanitizeMermaidCode(code);

  // Error / timeout fallback — show raw code in styled box
  if (error) {
    return (
      <div className="my-3 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          <span>{error === 'timeout' ? 'Diagram Generation in Progress (Source)' : 'Diagram Source'}</span>
      </div>
      <span className="text-gray-500">mermaid</span>
    </div>
    <pre className="p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{sanitized}</pre>
  </div>
    );
  }

  // Loading
  if (!svg) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-3 text-center text-gray-400 text-sm animate-pulse">
        Rendering diagram...
      </div>
    );
  }

  // Rendered diagram
  return (
    <>
      <div
        className="my-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm cursor-pointer group hover:border-indigo-300 hover:shadow-md transition-all"
        onClick={openFullscreen}
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="font-medium">Diagram</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 group-hover:text-indigo-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span>Click to expand</span>
          </div>
        </div>

        <div className="p-4 overflow-hidden">
          <div
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svg }}
            className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:max-h-64"
          />
        </div>
      </div>

      {isFullscreen && <FullscreenModal svg={svg} code={sanitized} onClose={closeFullscreen} />}
    </>
  );
}
