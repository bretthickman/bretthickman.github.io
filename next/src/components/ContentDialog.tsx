import { Dialog } from '@base-ui/react/dialog';
import { ArrowUpRight, Download } from 'lucide-react';
import { useRef, type CSSProperties } from 'react';
import type { PortfolioEntry } from '../content/types';
import { DialogCloseButton } from './DialogCloseButton';
import { ResumeDocument } from './ResumeDocument';
import { StoryImage } from './StoryImage';
import './dialogs.css';

interface ContentDialogProps {
  entry: PortfolioEntry | null;
  open: boolean;
  origin: HTMLElement | null;
  onClose: () => void;
  onClosed: () => void;
}

type Treatment = 'paper' | 'screen' | 'terminal' | 'resume';

function treatmentFor(entry: PortfolioEntry | null): Treatment {
  if (entry?.id === 'resume') return 'resume';
  if (entry?.appearance === 'game' || entry?.appearance === 'studio') return 'screen';
  if (entry?.appearance === 'code' || entry?.appearance === 'keyboard' || entry?.appearance === 'folder') return 'terminal';
  return 'paper';
}

function ResumeToolbar({ entry }: { entry: PortfolioEntry }) {
  const pdf = entry.links?.find((link) => link.url.endsWith('.pdf'));
  const linkedIn = entry.links?.find((link) => link.url.startsWith('https://www.linkedin.com/'));
  return (
    <header className="dialog-heading-row resume-heading-row">
      <div className="resume-heading">
        <Dialog.Title>résumé</Dialog.Title>
        <span>original version</span>
      </div>
      <Dialog.Description className="sr-only">{entry.summary}</Dialog.Description>
      <div className="resume-actions">
        {pdf && <a className="document-action" href={pdf.url} download="Brett-Hickman-Resume.pdf">
          <Download size={16} aria-hidden="true" />download
        </a>}
        {linkedIn && <a className="document-action" href={linkedIn.url} target="_blank" rel="noreferrer">
          linkedin<ArrowUpRight size={15} aria-hidden="true" />
        </a>}
      </div>
      <DialogCloseButton label="close résumé" />
    </header>
  );
}

function StoryContent({ entry }: { entry: PortfolioEntry }) {
  const simple = entry.sections.length === 1;
  return (
    <div className="story-content">
      <Dialog.Description className={simple ? 'sr-only' : 'story-summary'}>{entry.summary}</Dialog.Description>
      {simple && <div className="story-lead">
        {entry.sections[0].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>}
      {entry.links && entry.links.length > 0 && <div className="story-links">
        {entry.links.map((link) => (
          <a key={link.url} href={link.url} target={link.url.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
            {link.label}<ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ))}
      </div>}
      {entry.image && <div className="story-hero"><StoryImage key={`${entry.id}/${entry.image.src}`} image={entry.image} eager /></div>}
      {simple ? entry.sections[0].image && <div className="story-sections">
        <StoryImage image={entry.sections[0].image} />
      </div> : <div className="story-sections">
        {entry.sections.map((section) => (
          <section className="story-section" key={`${entry.id}/${section.heading}`}>
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.image && <StoryImage key={section.image.src} image={section.image} />}
          </section>
        ))}
      </div>}
    </div>
  );
}

export function ContentDialog({ entry, open, origin, onClose, onClosed }: ContentDialogProps) {
  const originStyle = useRef<CSSProperties>({ '--origin-x': '50vw', '--origin-y': '50vh' } as CSSProperties);
  // Retain the opening point through the closing animation.
  if (open && origin) {
    const rect = origin.getBoundingClientRect();
    originStyle.current = { '--origin-x': `${rect.left + rect.width / 2}px`, '--origin-y': `${rect.top + rect.height / 2}px` } as CSSProperties;
  }
  const treatment = treatmentFor(entry);
  const hasImages = Boolean(entry?.image || entry?.sections.some((section) => section.image));
  const compact = !hasImages && entry?.sections.length === 1 && treatment !== 'resume';

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}
      onOpenChangeComplete={(next) => { if (!next) onClosed(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport">
          <Dialog.Popup className="content-dialog" data-treatment={treatment} data-has-images={hasImages || undefined}
            data-compact={compact || undefined} style={originStyle.current} finalFocus={() => origin ?? true}>
            {entry && <>
              {treatment === 'resume' ? <ResumeToolbar entry={entry} /> : <header className="dialog-heading-row">
                <Dialog.Title className="story-title">{entry.title}</Dialog.Title>
                <DialogCloseButton label="close details" />
              </header>}
              <div className="story-scroll" key={entry.id} role="region" aria-label={`${entry.title} details`} tabIndex={0}>
                {treatment === 'resume' ? <ResumeDocument /> : <StoryContent entry={entry} />}
              </div>
            </>}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
