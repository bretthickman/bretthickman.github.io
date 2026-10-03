import assert from 'node:assert/strict';
import test from 'node:test';
import { DragVelocity } from '../src/scene/velocity.ts';

const sample = (x: number, time: number, y = 0) => ({ x, y, time });
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} ≈ ${expected}`);

test('a steady throw has the same velocity across pointer event frequencies', () => {
  for (const interval of [4, 8, 16, 33]) {
    const velocity = new DragVelocity(sample(0, 0));
    for (let time = interval; time < 200; time += interval) velocity.sample(sample(time * 0.9, time, time * -0.6));
    const released = velocity.release(sample(180, 200, -120));
    close(released.x, 900);
    close(released.y, -600);
  }
});

test('a final flick reported only at release contributes momentum after a sparse move stream', () => {
  const velocity = new DragVelocity(sample(0, 0));
  velocity.sample(sample(40, 40));
  const released = velocity.release(sample(240, 190));
  assert.ok(released.x > 1000);
});

test('a short stationary release retains momentum and a deliberate pause drops it', () => {
  const releaseAfter = (pause: number) => {
    const velocity = new DragVelocity(sample(0, 0));
    for (const time of [20, 40, 60, 80, 100]) velocity.sample(sample(time, time));
    return velocity.release(sample(100, 100 + pause)).x;
  };
  assert.ok(releaseAfter(10) > 850);
  assert.ok(releaseAfter(50) > 0 && releaseAfter(50) < releaseAfter(10));
  close(releaseAfter(150), 0);
});

test('holding an object before a flick does not dilute its recent velocity', () => {
  const velocity = new DragVelocity(sample(0, 0));
  velocity.sample(sample(5, 2000));
  velocity.sample(sample(15, 2010));
  velocity.sample(sample(25, 2020));
  close(velocity.release(sample(35, 2030)).x, 1000);
});

test('recent movement wins after reversing direction', () => {
  const velocity = new DragVelocity(sample(0, 0));
  velocity.sample(sample(100, 100));
  velocity.sample(sample(150, 150));
  velocity.sample(sample(100, 200));
  velocity.sample(sample(50, 250));
  close(velocity.release(sample(0, 300)).x, -1000);
});

test('duplicate and out-of-order timestamps cannot produce invalid velocities', () => {
  const velocity = new DragVelocity(sample(0, 0));
  velocity.sample(sample(5, 0));
  assert.deepEqual(velocity.release(sample(10, 0)), { x: 0, y: 0 });
  velocity.sample(sample(20, 20));
  velocity.sample(sample(9999, 10));
  close(velocity.release(sample(30, 30)).x, 2000 / 3);
});

test('extreme flicks are capped without changing direction', () => {
  const velocity = new DragVelocity(sample(0, 0));
  const released = velocity.release(sample(300, 100, 400));
  close(Math.hypot(released.x, released.y), 1800);
  close(released.y / released.x, 4 / 3);
});
