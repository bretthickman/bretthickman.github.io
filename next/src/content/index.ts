import data from './catalog.json';
import type { ContentImage, PortfolioEntry } from './types';
import { publicUrl } from '../public-url';

function resolveImage(image: ContentImage | undefined): ContentImage | undefined {
  return image && { ...image, src: publicUrl(image.src), stillSrc: image.stillSrc && publicUrl(image.stillSrc) };
}

export const portfolio: readonly PortfolioEntry[] = (data as PortfolioEntry[]).map((entry) => ({
  ...entry,
  links: entry.links?.map((link) => ({ ...link, url: publicUrl(link.url) })),
  image: resolveImage(entry.image),
  sections: entry.sections.map((section) => ({ ...section, image: resolveImage(section.image) })),
}));

export const categoryNames = {
  work: 'work',
  project: 'projects',
  craft: 'craft',
  life: 'life',
  about: 'about',
} as const;
