import { useEffect, useRef, useState } from 'react';
import type { PortfolioEntry } from '../content/types';
import type { PhysicsScene, SceneBounds, SceneObject } from '../scene/types';
import { ObjectFace } from './PortfolioObject';
import { useMediaQuery } from '../hooks';
import { PointerGesture } from '../scene/gesture';

interface PhysicsPileProps {
  entries: readonly PortfolioEntry[];
  selected: readonly string[];
  searching: boolean;
  paused: boolean;
  resultsTop: number;
  onOpen: (entry: PortfolioEntry, origin: HTMLElement) => void;
  onSelectionChange: (ids: readonly string[]) => void;
}

export function PhysicsPile({ entries, selected, searching, paused, resultsTop, onOpen, onSelectionChange }: PhysicsPileProps) {
  const host = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const controller = useRef<PhysicsScene | null>(null);
  const gesture = useRef(new PointerGesture());
  const selectedRef = useRef(selected);
  const topRef = useRef(resultsTop);
  const pausedRef = useRef(paused);
  const selectionCallback = useRef(onSelectionChange);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const reducedRef = useRef(reduced);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  selectedRef.current = selected;
  topRef.current = resultsTop;
  pausedRef.current = paused;
  reducedRef.current = reduced;
  selectionCallback.current = onSelectionChange;

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let cancelled = false;
    let scene: PhysicsScene | null = null;
    setReady(false);

    const bounds = (): SceneBounds => ({
      width: root.clientWidth,
      height: root.clientHeight,
      floor: root.clientHeight - 10,
      resultsTop: topRef.current,
    });
    const objects: SceneObject[] = entries.flatMap((entry) => {
      const element = elements.current.get(entry.id);
      return element ? [{ id: entry.id, element, width: element.offsetWidth, height: element.offsetHeight }] : [];
    });

    const resize = new ResizeObserver(() => scene?.resize(bounds()));
    resize.observe(root);
    const visibility = () => scene?.setPaused(pausedRef.current || document.hidden);
    document.addEventListener('visibilitychange', visibility);

    import('../scene/physics').then(({ createPhysicsScene }) => createPhysicsScene(objects, bounds(), reducedRef.current,
      (ids) => { if (!cancelled) selectionCallback.current(ids); }))
      .then((created) => {
        if (cancelled) { created.dispose(); return; }
        scene = created;
        controller.current = created;
        created.setReducedMotion(reducedRef.current);
        created.resize(bounds());
        created.select(selectedRef.current);
        visibility();
        setReady(true);
      }).catch(() => {
        if (!cancelled) { setFailed(true); selectionCallback.current(selectedRef.current); }
      });

    return () => {
      cancelled = true;
      resize.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      scene?.dispose();
      if (controller.current === scene) controller.current = null;
    };
  }, [entries]);

  useEffect(() => {
    controller.current?.select(selected);
    if (failed) selectionCallback.current(selected);
  }, [selected, failed]);
  useEffect(() => { controller.current?.setPaused(paused || document.hidden); }, [paused]);
  useEffect(() => { controller.current?.setReducedMotion(reduced); }, [reduced]);
  useEffect(() => {
    const root = host.current;
    if (root) controller.current?.resize({ width: root.clientWidth, height: root.clientHeight, floor: root.clientHeight - 10, resultsTop });
  }, [resultsTop]);

  return (
    <div ref={host} className={`physics-pile ${ready ? 'is-ready' : ''} ${failed ? 'is-static' : ''}`}
      data-has-results={selected.length > 0 || undefined} data-searching={searching || undefined}
      aria-label="Explore Brett’s work and interests">
      {entries.map((entry) => (
        <button key={entry.id} className={`portfolio-object object-${entry.appearance}`}
          ref={(element) => { if (element) elements.current.set(entry.id, element); else elements.current.delete(entry.id); }}
          aria-label={`Open ${entry.title}`} data-entry={entry.id}
          data-shape={entry.appearance === 'disc' ? 'circle' : undefined}
          onPointerDown={(event) => {
            gesture.current.start(event.nativeEvent);
            controller.current?.pointerDown(entry.id, event.nativeEvent);
          }}
          onPointerMove={(event) => {
            gesture.current.move(event.nativeEvent);
            controller.current?.pointerMove(event.nativeEvent);
          }}
          onPointerUp={(event) => {
            gesture.current.release(event.nativeEvent);
            controller.current?.pointerUp(event.nativeEvent);
          }}
          onPointerCancel={(event) => {
            gesture.current.cancel(event.nativeEvent);
            controller.current?.pointerUp(event.nativeEvent);
          }}
          onLostPointerCapture={(event) => {
            gesture.current.loseCapture(event.nativeEvent);
            controller.current?.pointerUp(event.nativeEvent);
          }}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') gesture.current.reset(); }}
          onClick={(event) => {
            if (gesture.current.consumeClick((event.nativeEvent as Partial<PointerEvent>).pointerType)) return;
            onOpen(entry, event.currentTarget);
          }}>
          <ObjectFace entry={entry} />
        </button>
      ))}
    </div>
  );
}
