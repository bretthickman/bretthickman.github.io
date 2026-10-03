import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowUpRight, AudioLines, Code2, Disc3, FileText, Folder, Footprints,
  Gamepad2, Keyboard, Mail, Music2, Palette, PanelsTopLeft, StickyNote,
  Ticket, Timer, Trophy, Type,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { Category, ObjectAppearance, PortfolioEntry } from '../content/types';
import { DialogCloseButton } from './DialogCloseButton';
import './dialogs.css';
import './index.css';

const filters: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'work', label: 'work' },
  { value: 'project', label: 'projects' },
  { value: 'craft', label: 'craft' },
  { value: 'life', label: 'life' },
  { value: 'about', label: 'about' },
];

const categoryOrder: Category[] = ['work', 'project', 'craft', 'life', 'about'];

const icons: Record<ObjectAppearance, LucideIcon> = {
  palette: Palette,
  type: Type,
  interface: PanelsTopLeft,
  rhythm: Music2,
  code: Code2,
  game: Gamepad2,
  runner: Footprints,
  document: FileText,
  note: StickyNote,
  contact: Mail,
  disc: Disc3,
  ticket: Ticket,
  folder: Folder,
  award: Trophy,
  metronome: Timer,
  keyboard: Keyboard,
  studio: AudioLines,
};

interface IndexDialogProps {
  entries: readonly PortfolioEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (entry: PortfolioEntry, origin: HTMLElement) => void;
}

export function IndexDialog({ entries, open, onOpenChange, onSelect }: IndexDialogProps) {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const visibleEntries = filter === 'all'
    ? categoryOrder.flatMap((category) => entries.filter((entry) => entry.category === category))
    : entries.filter((entry) => entry.category === filter);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport index-viewport">
          <Dialog.Popup className="index-dialog">
            <header className="index-header">
              <div className="index-heading">
                <Dialog.Title className="index-title">index</Dialog.Title>
                <DialogCloseButton label="close index" />
              </div>
              <Dialog.Description className="sr-only">Browse work, projects, and interests by category.</Dialog.Description>
              <div className="index-filters" role="group" aria-label="categories">
                {filters.map(({ value, label }) => (
                  <button
                    type="button"
                    className="index-filter"
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >{label}</button>
                ))}
              </div>
            </header>
            <div className="index-scroll" role="region" aria-label="portfolio entries" tabIndex={0}>
              {visibleEntries.map((entry) => {
                const Icon = icons[entry.appearance];
                return (
                  <button
                    type="button"
                    className="index-item"
                    key={entry.id}
                    onClick={(event) => onSelect(entry, event.currentTarget)}
                  >
                    <Icon className="index-entry-icon" size={18} strokeWidth={1.65} aria-hidden="true" />
                    <span className="index-entry-title">{entry.title}</span>
                    {entry.year && <small>{entry.year}</small>}
                    <ArrowUpRight className="index-entry-arrow" size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
