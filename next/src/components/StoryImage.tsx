import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { ContentImage } from '../content/types';

interface StoryImageProps {
  image: ContentImage;
  eager?: boolean;
}

/** Demos begin as stills so the reader decides when motion helps explain the story. */
export function StoryImage({ image, eager = false }: StoryImageProps) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="story-image">
      <div className="story-image-frame">
        <img src={playing ? image.src : image.stillSrc ?? image.src} alt={image.alt}
          width={image.width} height={image.height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </div>
      {(image.caption || image.stillSrc) && (
        <figcaption>
          {image.caption && <span>{image.caption}</span>}
          {image.stillSrc && (
            <button className="demo-control" type="button" aria-pressed={playing}
              aria-label={`${playing ? 'Pause' : 'Play'} demo: ${image.alt}`}
              onClick={() => setPlaying((current) => !current)}>
              {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
              {playing ? 'pause demo' : 'play demo'}
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}
