import { memo } from 'react';
import { MousePointer2 } from 'lucide-react';
import type { PortfolioEntry } from '../content/types';
import './objects.css';

interface ObjectFaceProps {
  entry: PortfolioEntry;
}

/** Decorative miniatures. The surrounding native button supplies the accessible name. */
export const ObjectFace = memo(function ObjectFace({ entry }: ObjectFaceProps) {
  switch (entry.appearance) {
    case 'palette':
      return (
        <div className="face face-palette" aria-hidden="true">
          <div className="color-samples"><i /><i /><i /><i /><i /></div>
          <span className="face-title">{entry.label}</span>
        </div>
      );
    case 'type':
      return (
        <div className="face face-type" aria-hidden="true">
          <span className="type-number">01 / specimen</span>
          <span className="type-specimen">Aa<span>.</span></span>
          <span className="face-title">{entry.label}</span>
          <span className="type-baseline" />
        </div>
      );
    case 'interface':
      return (
        <div className="face face-interface" aria-hidden="true">
          <div className="mini-toolbar"><i /><i /><i /><span /></div>
          <div className="mini-interface-content">
            <div className="mini-toggle"><span /><i /></div>
            <span className="mini-slider"><i /></span>
            <span className="face-title">{entry.label}</span>
          </div>
          <MousePointer2 className="mini-pointer" size={15} strokeWidth={1.5} />
        </div>
      );
    case 'rhythm':
      return (
        <div className="face face-rhythm" aria-hidden="true">
          <div className="sound-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="sound-controls"><i /><span className="face-title">{entry.label}</span><i /></div>
          <span className="sound-screws"><i /><i /></span>
        </div>
      );
    case 'code':
      return (
        <div className="face face-code" aria-hidden="true">
          <div className="terminal-toolbar"><span className="terminal-dots"><i /><i /><i /></span><span>~/brett</span></div>
          <span className="code-specimen"><i>{'{'}</i><span>{entry.label}</span><i>{'}'}</i></span>
          <div className="code-lines">
            <span><i /><i /></span>
            <span><i /><i /><i /></span>
            <span><i /><i /></span>
          </div>
        </div>
      );
    case 'game':
      return (
        <div className="face face-game" aria-hidden="true">
          <span className="cartridge-grip"><i /><i /><i /></span>
          <div className="cartridge-label">
            {entry.image ? <img src={entry.image.src} alt="" draggable={false} /> : <span className="game-pixel">+</span>}
            <span className="face-title">{entry.label}</span>
          </div>
          <span className="cartridge-contact"><i /><i /><i /><i /><i /></span>
        </div>
      );
    case 'runner':
      return (
        <div className="face face-runner" aria-hidden="true">
          <svg className="running-shoe" viewBox="0 0 112 68">
            <path className="shoe-upper" d="M8 23 24 16Q27 24 40 23L48 16Q51 23 56 28L64 35Q74 41 93 42 108 43 108 53H6L5 31Q5 26 8 23Z" />
            <path className="shoe-collar" d="M13 24 23 20Q28 29 41 25L45 20 49 25Q36 35 16 32Z" />
            <path className="shoe-heel" d="M6 34 19 32 23 48H6Z" />
            <path className="shoe-tongue" d="M41 25 49 20 67 36 62 40 51 35Z" />
            <path className="shoe-laces" d="m44 28 13-3m-10 8 13-3m-9 8 12-3" />
            <path className="shoe-sole" d="M6 49Q38 53 62 51 84 48 108 50L110 56Q103 64 90 64H12Q5 62 5 55Z" />
            <path className="shoe-outsole" d="M8 59Q53 64 94 60L108 56V60Q103 67 90 67H11Q5 65 6 59Z" />
            <path className="shoe-tread" d="m18 62 1 4m11-3 1 4m11-3 1 3m11-3 1 3m11-4 1 4m11-4 1 4" />
          </svg>
          <span className="face-title">{entry.label}</span>
        </div>
      );
    case 'document':
      return (
        <div className="face face-document" aria-hidden="true">
          <span className="paper-sheet" /><span className="paper-fold" />
          <div className="paper-print">
            <span className="paper-name">brett<br />hickman</span>
            <span className="paper-rule" />
            <div className="document-lines"><i /><i /><i /></div>
            <span className="face-title">{entry.label}</span>
            <div className="document-lines document-lines-bottom"><i /><i /></div>
          </div>
        </div>
      );
    case 'contact':
      return (
        <div className="face face-contact" aria-hidden="true">
          <span className="envelope-side envelope-side-left" />
          <span className="envelope-side envelope-side-right" />
          <span className="envelope-bottom" /><span className="envelope-flap" />
          <span className="envelope-seal">b.</span>
          <span className="face-title">{entry.label}</span>
        </div>
      );
    case 'note':
      return (
        <div className="face face-note" aria-hidden="true">
          <span className="note-tape" />
          <span className="note-asterisk">✳</span>
          <span className="note-title">{entry.label}</span>
          <span className="note-underline" /><span className="note-curl" />
        </div>
      );
    case 'disc':
      return (
        <div className="face face-disc" aria-hidden="true">
          <div className="disc-label"><span>33⅓ rpm</span><strong>{entry.label}</strong></div>
          <span className="disc-hole" />
        </div>
      );
    case 'ticket':
      return (
        <div className="face face-ticket" aria-hidden="true">
          <span className="ticket-stub">admit<br />one</span>
          <div className="ticket-content"><span className="face-title">{entry.label}</span><span className="ticket-barcode" /></div>
          <span className="ticket-serial">bh—001</span>
        </div>
      );
    case 'folder':
      return (
        <div className="face face-folder" aria-hidden="true">
          <span className="folder-tab" /><span className="folder-back" />
          <div className="folder-paper"><i /><i /><i /></div>
          <div className="folder-front"><span className="face-title">{entry.label}</span><span className="folder-notation">bh / projects</span></div>
        </div>
      );
    case 'award':
      return (
        <div className="face face-award" aria-hidden="true">
          <span className="trophy-handle trophy-handle-left" /><span className="trophy-handle trophy-handle-right" />
          <span className="trophy-stem" /><span className="trophy-foot" />
          <span className="trophy-cup"><i>✦</i></span>
          <span className="trophy-base"><span className="face-title">{entry.label}</span></span>
        </div>
      );
    case 'metronome':
      return (
        <div className="face face-metronome" aria-hidden="true">
          <span className="metronome-case" /><span className="metronome-face" />
          <span className="metronome-scale" />
          <span className="metronome-pendulum"><i /></span>
          <span className="metronome-dial" />
          <span className="face-title">{entry.label}</span>
        </div>
      );
    case 'keyboard':
      return (
        <div className="face face-keyboard" aria-hidden="true">
          <div className="keyboard-keys">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'A', 'S', 'D', 'F', 'G', 'H'].map((key) => <i key={key}>{key}</i>)}
          </div>
          <div className="keyboard-bottom"><i>⇧</i><i /><i>↵</i></div>
          <span className="face-title">{entry.label}</span>
        </div>
      );
    case 'studio':
      return (
        <div className="face face-studio" aria-hidden="true">
          <span className="studio-mark">o<span>✦</span></span>
          <span className="studio-role">cto</span>
          <div className="studio-caption"><span className="face-title">{entry.label}</span><span>virtuosos → ongawa</span></div>
        </div>
      );
  }
});
