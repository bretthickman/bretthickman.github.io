import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutPile, layoutResults } from '../src/scene/layout.ts';

const cards = Array.from({ length: 15 }, (_, index) => ({
  id: String(index), width: 104 + index % 3 * 6, height: 66 + index % 4 * 7,
}));

test('ranked results fit without overlap across mobile, desktop, and short viewports', () => {
  for (const width of [320, 360, 390, 768, 1440]) {
    for (const height of [340, 460, 620, 900]) {
      const bounds = { width, height, resultsTop: 180, floor: height - 20 };
      const placements = layoutResults(cards, bounds);
      assert.ok(placements.length <= 4);
      assert.deepEqual(placements.map((placement) => placement.id), cards.slice(0, placements.length).map((card) => card.id));
      for (const placement of placements) {
        const card = cards.find((card) => card.id === placement.id)!;
        assert.ok(placement.x - card.width / 2 >= 16);
        assert.ok(placement.x + card.width / 2 <= width - 16);
        assert.ok(placement.y - card.height / 2 >= bounds.resultsTop);
        assert.ok(placement.y + card.height / 2 <= bounds.floor - 16);
        for (const other of placements.filter((other) => other.id !== placement.id)) {
          const otherCard = cards.find((card) => card.id === other.id)!;
          assert.ok(Math.abs(placement.x - other.x) >= (card.width + otherCard.width) / 2
            || Math.abs(placement.y - other.y) >= (card.height + otherCard.height) / 2);
        }
      }
    }
  }
});

test('short screens keep a fitting ranked prefix rather than overlapping cards', () => {
  const placements = layoutResults(cards, { width: 320, height: 320, resultsTop: 200, floor: 300 });
  assert.deepEqual(placements.map((placement) => placement.id), ['0', '1']);
});

test('an oversized first result is withheld rather than placed outside the scene', () => {
  assert.deepEqual(layoutResults([{ id: 'wide', width: 420, height: 80 }], {
    width: 320, height: 620, resultsTop: 200, floor: 600,
  }), []);
});

test('expanded compact cards are laid out using their entire visible footprint', () => {
  const scale = 1.4;
  const compactCards = cards.slice(0, 4).map((card) => ({
    id: card.id, width: 76 * scale, height: (55 + Number(card.id) * 3) * scale,
  }));
  const bounds = { width: 320, height: 620, resultsTop: 320, floor: 600 };
  const placements = layoutResults(compactCards, bounds);
  assert.equal(placements.length, 4);
  for (const placement of placements) {
    const card = compactCards.find((card) => card.id === placement.id)!;
    assert.ok(placement.x - card.width / 2 >= 16);
    assert.ok(placement.x + card.width / 2 <= bounds.width - 16);
    assert.ok(placement.y - card.height / 2 >= bounds.resultsTop);
    assert.ok(placement.y + card.height / 2 <= bounds.floor - 16);
    for (const other of placements.filter((other) => other.id !== placement.id)) {
      const otherCard = compactCards.find((card) => card.id === other.id)!;
      assert.ok(Math.abs(placement.x - other.x) >= (card.width + otherCard.width) / 2
        || Math.abs(placement.y - other.y) >= (card.height + otherCard.height) / 2);
    }
  }
});

test('reduced-motion pile is deterministic and rotated rectangles remain within bounds', () => {
  const bounds = { width: 360, height: 620, resultsTop: 200, floor: 600 };
  const placements = layoutPile(cards, bounds);
  assert.deepEqual(placements, layoutPile(cards, bounds));
  assert.equal(placements.length, cards.length);
  for (const placement of placements) {
    const card = cards.find((card) => card.id === placement.id)!;
    const halfWidth = (card.width * Math.cos(placement.angle) + card.height * Math.abs(Math.sin(placement.angle))) / 2;
    const halfHeight = (card.height * Math.cos(placement.angle) + card.width * Math.abs(Math.sin(placement.angle))) / 2;
    assert.ok(placement.x - halfWidth >= 0);
    assert.ok(placement.x + halfWidth <= bounds.width);
    assert.ok(placement.y - halfHeight >= 0);
    assert.ok(placement.y + halfHeight <= bounds.floor);
  }
});

const smallFootprints = [
  [108, 48], [68, 86], [106, 74], [84, 60], [112, 72],
  [72, 88], [85, 66], [66, 96], [78, 76], [100, 63],
  [80, 80], [110, 52], [96, 68], [64, 78], [92, 46],
];
const smallObjects = Array.from({ length: 24 }, (_, index) => ({
  id: `small-${index}`,
  width: smallFootprints[index % smallFootprints.length][0] * 0.79,
  height: smallFootprints[index % smallFootprints.length][1] * 0.79,
}));

test('irregular skyline placements start without overlapping rotated footprints', () => {
  const bounds = { width: 360, height: 900, resultsTop: 280, floor: 890 };
  const placements = layoutPile(smallObjects, bounds);
  const rectangles = placements.map((placement) => {
    const object = smallObjects.find((object) => object.id === placement.id)!;
    return {
      ...placement,
      halfWidth: (object.width * Math.abs(Math.cos(placement.angle)) + object.height * Math.abs(Math.sin(placement.angle))) / 2,
      halfHeight: (object.height * Math.abs(Math.cos(placement.angle)) + object.width * Math.abs(Math.sin(placement.angle))) / 2,
    };
  });
  const levels = new Set(rectangles.map((rectangle) => Math.round(rectangle.y + rectangle.halfHeight)));
  assert.ok(levels.size > 5, 'different supports produce an irregular skyline rather than aligned shelves');
  for (const rectangle of rectangles) {
    for (const other of rectangles.filter((other) => other.id !== rectangle.id)) {
      assert.ok(Math.abs(rectangle.x - other.x) >= rectangle.halfWidth + other.halfWidth
        || Math.abs(rectangle.y - other.y) >= rectangle.halfHeight + other.halfHeight);
    }
  }
});

test('static compact piles keep every visible footprint below the input on narrow screens', () => {
  for (const width of [320, 360, 390]) {
    const bounds = { width, height: 620, resultsTop: 290, floor: 610 };
    const placements = layoutPile(smallObjects, bounds, true);
    assert.deepEqual(placements, layoutPile(smallObjects, bounds, true));
    for (const placement of placements) {
      const object = smallObjects.find((object) => object.id === placement.id)!;
      const halfWidth = (object.width * Math.abs(Math.cos(placement.angle)) + object.height * Math.abs(Math.sin(placement.angle))) / 2;
      const halfHeight = (object.height * Math.abs(Math.cos(placement.angle)) + object.width * Math.abs(Math.sin(placement.angle))) / 2;
      assert.ok(placement.y - halfHeight >= bounds.resultsTop - 0.001);
      assert.ok(placement.y + halfHeight <= bounds.floor);
      assert.ok(placement.x - halfWidth >= 0);
      assert.ok(placement.x + halfWidth <= bounds.width);
    }
  }
});

test('circular footprints remain round during rotated pile placement', () => {
  const bounds = { width: 320, height: 620, resultsTop: 290, floor: 610 };
  const [placement] = layoutPile([{ id: 'disc', width: 80, height: 80, shape: 'circle' }], bounds);
  assert.equal(placement.y, bounds.floor - 2 - 40);
  assert.ok(placement.x - 40 >= 0 && placement.x + 40 <= bounds.width);
});
