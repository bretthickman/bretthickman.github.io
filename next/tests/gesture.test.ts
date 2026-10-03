import assert from 'node:assert/strict';
import test from 'node:test';
import { PointerGesture } from '../src/scene/gesture.ts';

const down = { pointerId: 1, clientX: 100, clientY: 100, button: 0, isPrimary: true };
const point = (x: number, y = 100) => ({ ...down, clientX: x, clientY: y });

test('a tap tolerates small pointer jitter and normal capture release', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.move(point(103, 102));
  gesture.release(point(102));
  gesture.loseCapture(down);
  assert.equal(gesture.consumeClick('touch'), false);
});

test('dragging away and back never becomes a click', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.move(point(180));
  gesture.move(down);
  gesture.release(down);
  gesture.loseCapture(down);
  assert.equal(gesture.consumeClick('mouse'), true);
});

test('lost capture and a late pointer-up cannot erase drag suppression', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.move(point(180));
  gesture.loseCapture(down);
  gesture.release(down);
  gesture.release(down);
  assert.equal(gesture.consumeClick('mouse'), true);
});

test('release coordinates also detect movement without a final move event', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.release(point(140));
  assert.equal(gesture.consumeClick('pen'), true);
});

test('cancelled gestures do not activate, and the next tap still works', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.cancel(down);
  assert.equal(gesture.consumeClick('touch'), true);
  gesture.start(down);
  gesture.release(down);
  assert.equal(gesture.consumeClick('mouse'), false);
});

test('keyboard activation remains available after a drag with no generated click', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.move(point(180));
  gesture.release(point(180));
  assert.equal(gesture.consumeClick(''), false);
  gesture.start(down);
  gesture.move(point(180));
  gesture.release(point(180));
  gesture.reset();
  assert.equal(gesture.consumeClick(), false);
});

test('a non-primary pointer does not change the active gesture', () => {
  const gesture = new PointerGesture();
  gesture.start(down);
  gesture.start({ ...point(180), pointerId: 2, isPrimary: false });
  gesture.move({ ...point(180), pointerId: 2 });
  gesture.release(down);
  assert.equal(gesture.consumeClick('mouse'), false);
});
