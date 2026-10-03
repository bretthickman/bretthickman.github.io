import { useEffect, useRef, useState } from 'react';
import { FileText, Grid2X2 } from 'lucide-react';
import { portfolio } from './content';
import type { PortfolioEntry } from './content/types';
import { searchPortfolio } from './search';
import { readTheme, type Theme } from './theme';
import { ThemeMenu } from './components/ThemeMenu';
import { PhysicsPile } from './components/PhysicsPile';
import { ContentDialog } from './components/ContentDialog';
import { IndexDialog } from './components/IndexDialog';
import { PromptField } from './components/PromptField';

const initialEntry = portfolio.find((entry) => entry.id === new URLSearchParams(location.search).get('view')) ?? null;

export function App() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(0);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [displayed, setDisplayed] = useState<readonly string[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'ready'>('idle');
  const [entry, setEntry] = useState<PortfolioEntry | null>(initialEntry);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialEntry));
  const [indexOpen, setIndexOpen] = useState(false);
  const [resultsTop, setResultsTop] = useState(390);
  const origin = useRef<HTMLElement | null>(null);
  const prompt = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const indexButton = useRef<HTMLButtonElement>(null);
  const requestId = useRef(0);
  const previousSubmission = useRef(0);
  const currentEntry = entry ? portfolio.find((item) => item.id === entry.id) ?? null : null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('brett-theme', theme); } catch { /* Themes still work when storage is unavailable. */ }
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [theme]);

  useEffect(() => {
    const update = () => { if (prompt.current) setResultsTop(prompt.current.getBoundingClientRect().bottom + window.scrollY + 30); };
    const resize = new ResizeObserver(update);
    if (prompt.current) resize.observe(prompt.current);
    window.addEventListener('resize', update);
    update();
    return () => { resize.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  useEffect(() => {
    const version = ++requestId.current;
    const controller = new AbortController();
    const value = query.trim();
    const immediate = submitted !== previousSubmission.current;
    previousSubmission.current = submitted;
    if (!value) { setSelected([]); setStatus('idle'); return () => controller.abort(); }
    setStatus('searching');
    const timer = window.setTimeout(() => {
      searchPortfolio(value, portfolio, controller.signal).then((result) => {
        if (version !== requestId.current || controller.signal.aborted) return;
        setSelected(result.ids);
        setStatus('ready');
      }).catch(() => {
        if (version === requestId.current && !controller.signal.aborted) { setSelected([]); setStatus('ready'); }
      });
    }, immediate ? 0 : 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, submitted]);

  useEffect(() => {
    const onPopState = () => {
      const id = new URLSearchParams(location.search).get('view');
      const next = portfolio.find((item) => item.id === id) ?? null;
      if (next) { setEntry(next); setIndexOpen(false); }
      setDetailOpen(Boolean(next));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function openEntry(next: PortfolioEntry, element: HTMLElement) {
    origin.current = element;
    setEntry(next);
    setIndexOpen(false);
    setDetailOpen(true);
    const url = new URL(location.href);
    url.searchParams.set('view', next.id);
    history.pushState({}, '', url);
  }

  function closeEntry() {
    setDetailOpen(false);
    const url = new URL(location.href);
    url.searchParams.delete('view');
    history.replaceState({}, '', url);
  }

  function reset() {
    setQuery('');
    field.current?.focus();
  }

  return (
    <main className="portfolio" aria-label="Brett Hickman’s portfolio" onKeyDown={(event) => {
      if (event.key === 'Escape' && !detailOpen && !indexOpen) reset();
    }}>
      <a className="skip-link" href="#ask">Skip to search</a>
      <header className="site-header">
        <button className="wordmark" onClick={reset} aria-label="Brett Hickman, reset exploration">brett hickman<span>.</span></button>
        <nav aria-label="Main navigation">
          <button className="header-action" ref={indexButton} onClick={() => setIndexOpen(true)}
            aria-label="Browse the index">
            <span className="header-action-icon"><Grid2X2 size={19} strokeWidth={2} aria-hidden="true" /></span>
            <span className="header-action-label" aria-hidden="true"><span>index</span></span>
          </button>
          <button className="header-action header-action-resume" aria-label="Open résumé" onClick={(event) => {
            const resume = portfolio.find((item) => item.id === 'resume');
            if (resume) openEntry(resume, event.currentTarget);
          }}>
            <span className="header-action-icon"><FileText size={19} strokeWidth={2} aria-hidden="true" /></span>
            <span className="header-action-label" aria-hidden="true"><span>résumé</span></span>
          </button>
          <ThemeMenu theme={theme} onChange={setTheme} />
        </nav>
      </header>

      <section className="prompt-area" aria-label="Ask about Brett" ref={prompt}>
        <form role="search" onSubmit={(event) => { event.preventDefault(); setSubmitted((current) => current + 1); }}>
          <PromptField value={query} onChange={setQuery} onClear={reset} inputRef={field}
            searching={status === 'searching'} paused={detailOpen || indexOpen} />
        </form>
        <div className="search-feedback" aria-live="polite" aria-atomic="true">
          {status === 'ready' && selected.length === 0 ? (
            <span>no results. <button onClick={() => setIndexOpen(true)}>open index</button>.</span>
          ) : status === 'ready' ? (
            <span className="sr-only">{displayed.length} {displayed.length === 1 ? 'result' : 'results'}.</span>
          ) : null}
        </div>
      </section>

      <PhysicsPile entries={portfolio} selected={selected} searching={status === 'searching'}
        paused={detailOpen || indexOpen} resultsTop={resultsTop} onOpen={openEntry} onSelectionChange={setDisplayed} />

      <IndexDialog entries={portfolio} open={indexOpen} onOpenChange={setIndexOpen}
        onSelect={(next) => openEntry(next, indexButton.current!)} />
      <ContentDialog entry={currentEntry} open={detailOpen} origin={origin.current}
        onClose={closeEntry} onClosed={() => { if (!detailOpen) setEntry(null); }} />
    </main>
  );
}
