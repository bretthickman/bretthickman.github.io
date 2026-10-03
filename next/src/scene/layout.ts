import type { SceneBounds, SceneObject } from './types';

type LayoutObject = Pick<SceneObject, 'id' | 'width' | 'height'> & { shape?: 'circle' };

export interface Placement {
  id: string;
  x: number;
  y: number;
  angle: number;
}

const RESULT_LIMIT = 4;
const RESULT_GAP = 16;
const EDGE_GAP = 16;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** A ranked prefix that fits at its real size; short screens show fewer results. */
export function layoutResults(objects: readonly LayoutObject[], bounds: SceneBounds): Placement[] {
  const width = Math.min(920, bounds.width - EDGE_GAP * 2);
  const top = Math.max(EDGE_GAP, bounds.resultsTop);
  const bottom = Math.min(bounds.height, bounds.floor) - EDGE_GAP;

  for (let count = Math.min(RESULT_LIMIT, objects.length); count > 0; count -= 1) {
    const rows: LayoutObject[][] = [[]];
    let rowWidth = 0;

    for (const object of objects.slice(0, count)) {
      if (rowWidth && rowWidth + RESULT_GAP + object.width > width) {
        rows.push([]);
        rowWidth = 0;
      }
      rows[rows.length - 1].push(object);
      rowWidth += object.width + (rowWidth ? RESULT_GAP : 0);
    }

    const rowHeights = rows.map((row) => Math.max(...row.map((object) => object.height)));
    const height = rowHeights.reduce((sum, value) => sum + value, 0) + RESULT_GAP * (rows.length - 1);
    if (height > bottom - top || objects.slice(0, count).some((object) => object.width > width)) continue;

    const placements: Placement[] = [];
    let y = top;
    rows.forEach((row, index) => {
      const rowWidth = row.reduce((sum, object) => sum + object.width, 0) + RESULT_GAP * (row.length - 1);
      let x = (bounds.width - rowWidth) / 2;
      for (const object of row) {
        placements.push({ id: object.id, x: x + object.width / 2, y: y + rowHeights[index] / 2, angle: 0 });
        x += object.width + RESULT_GAP;
      }
      y += rowHeights[index] + RESULT_GAP;
    });
    return placements;
  }
  return [];
}

function seedFor(id: string): number {
  let seed = 0;
  for (const character of id) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  return seed;
}

/** Bottom-up skyline packing staggers irregular objects without an initial collision burst. */
export function layoutPile(
  objects: readonly LayoutObject[],
  bounds: SceneBounds,
  reservePrompt = false,
): Placement[] {
  const edge = 6;
  const width = Math.max(1, bounds.width - edge * 2);
  const floor = Math.min(bounds.floor, bounds.height) - 2;
  const columns = Math.max(1, Math.floor(width / 6));
  const columnWidth = width / columns;
  const skyline = Array<number>(columns).fill(0);
  const placements = new Map<string, Placement>();
  const halfHeights = new Map<string, number>();
  const packed = [...objects].sort((a, b) => b.width - a.width || seedFor(a.id) - seedFor(b.id));

  for (const object of packed) {
    const seed = seedFor(object.id);
    const angle = Math.sin(seed * 0.47 + 0.8) * 0.34;
    const cosine = Math.abs(Math.cos(angle));
    const sine = Math.abs(Math.sin(angle));
    const halfWidth = object.shape === 'circle' ? object.width / 2 : (object.width * cosine + object.height * sine) / 2;
    const halfHeight = object.shape === 'circle' ? object.height / 2 : (object.height * cosine + object.width * sine) / 2;
    const span = Math.min(columns, Math.ceil((halfWidth * 2 + 2) / columnWidth));
    let bestColumn = 0;
    let bestSupport = 0;
    let bestScore = Infinity;

    for (let start = 0; start <= columns - span; start += 1) {
      let support = 0;
      for (let index = start; index < start + span; index += 1) support = Math.max(support, skyline[index]);
      const center = edge + (start + span / 2) * columnWidth;
      const score = support + Math.abs(center - bounds.width / 2) * 0.025 + Math.sin(seed + start * 1.7) * 2;
      if (score < bestScore) {
        bestColumn = start;
        bestSupport = support;
        bestScore = score;
      }
    }

    placements.set(object.id, {
      id: object.id,
      x: clamp(edge + (bestColumn + span / 2) * columnWidth, halfWidth + 1, bounds.width - halfWidth - 1),
      y: clamp(floor - bestSupport - halfHeight, halfHeight + 1, floor - halfHeight),
      angle,
    });
    halfHeights.set(object.id, halfHeight);
    for (let index = bestColumn; index < bestColumn + span; index += 1) {
      skyline[index] = bestSupport + halfHeight * 2 + 2;
    }
  }

  if (reservePrompt) {
    // A static scene may overlap gently when space is scarce, while keeping the input clear.
    let compression = 1;
    for (const placement of placements.values()) {
      const halfHeight = halfHeights.get(placement.id)!;
      const lift = floor - halfHeight - placement.y;
      if (lift > 0) compression = Math.min(compression, Math.max(0, (floor - bounds.resultsTop - halfHeight * 2) / lift));
    }
    for (const placement of placements.values()) {
      const halfHeight = halfHeights.get(placement.id)!;
      placement.y = floor - halfHeight - (floor - halfHeight - placement.y) * compression;
    }
  }

  return objects.map((object) => placements.get(object.id)!);
}
