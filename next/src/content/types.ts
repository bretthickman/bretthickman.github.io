export type Category = 'work' | 'project' | 'craft' | 'life' | 'about';

export type ObjectAppearance =
  | 'palette' | 'type' | 'interface' | 'rhythm' | 'code'
  | 'game' | 'runner' | 'document' | 'note' | 'contact'
  | 'disc' | 'ticket' | 'folder' | 'award' | 'metronome' | 'keyboard' | 'studio';

export interface ContentImage {
  src: string;
  alt: string;
  caption?: string;
  stillSrc?: string;
  width?: number;
  height?: number;
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
  image?: ContentImage;
}

export interface PortfolioEntry {
  id: string;
  title: string;
  label: string;
  category: Category;
  appearance: ObjectAppearance;
  summary: string;
  topics: string[];
  sections: ContentSection[];
  links?: { label: string; url: string }[];
  image?: ContentImage;
  year?: string;
}
