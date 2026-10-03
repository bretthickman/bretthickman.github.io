import { useEffect, useState, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { CloseIcon } from './CloseIcon';
import { useMediaQuery } from '../hooks';

const examples = [
  'what is brett good at?',
  'design systems',
  'what has brett built?',
  'his running career',
  'résumé',
  'who is brett?',
];

interface PromptFieldProps {
  value: string;
  searching: boolean;
  paused: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function PromptField({ value, searching, paused, inputRef, onChange, onClear }: PromptFieldProps) {
  const [example, setExample] = useState(0);
  const [fading, setFading] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const active = !value && !focused && !paused && !reducedMotion;

  useEffect(() => {
    setFading(false);
    if (!active) return;
    let fade: ReturnType<typeof setTimeout> | undefined;
    const cycle = setInterval(() => {
      if (document.hidden) return;
      setFading(true);
      fade = setTimeout(() => {
        if (document.hidden) { setFading(false); return; }
        setExample((current) => (current + 1) % examples.length);
        setFading(false);
      }, 350);
    }, 6_500);
    const visibility = () => {
      if (document.hidden) { clearTimeout(fade); setFading(false); }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearInterval(cycle);
      clearTimeout(fade);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [active]);

  return (
    <div className="prompt-field">
      <Search className="search-icon" size={20} strokeWidth={2.25} aria-hidden="true" />
      <input id="ask" ref={inputRef} type="text" value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={`try "${examples[example]}"`} data-placeholder-fading={fading || undefined}
        aria-label="Ask about Brett’s work, projects, or interests"
        maxLength={240} autoComplete="off" spellCheck={false} />
      {searching && <span className="search-activity" aria-hidden="true" />}
      {value && <button type="button" className="close-control clear-button" onClick={onClear}
        aria-label="Clear search and release the objects"><CloseIcon /></button>}
    </div>
  );
}
