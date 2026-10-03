import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhysicsScene } from '../src/scene/physics.ts';
import type { PhysicsScene } from '../src/scene/types.ts';

function pointer(type: string, x: number, y: number, time: number, buttons = 1): PointerEvent {
  return { type, clientX: x, clientY: y, timeStamp: time, buttons, button: 0, pointerId: 1, isPrimary: true } as PointerEvent;
}

/** Run the real Rapier scene with a deterministic animation clock and a single object. */
async function withScene(run: (scene: PhysicsScene, position: () => { x: number; y: number }, advance: () => void) => void) {
  const saved = new Map(['document', 'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle']
    .map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  let time = 0;
  const capture = new Set<number>();
  const element = {
    style: { transform: '' }, dataset: {}, offsetWidth: 100, offsetHeight: 60,
    offsetParent: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    setPointerCapture: (id: number) => capture.add(id),
    hasPointerCapture: (id: number) => capture.has(id),
    releasePointerCapture: (id: number) => capture.delete(id),
    removeAttribute: () => {},
  };
  const globals = {
    document: { hidden: false, addEventListener: () => {}, removeEventListener: () => {} },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    getComputedStyle: () => ({ getPropertyValue: () => '1.5' }),
  };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  let scene: PhysicsScene | undefined;
  try {
    scene = await createPhysicsScene([{ id: 'object', element: element as unknown as HTMLElement, width: 100, height: 60 }],
      { width: 1200, height: 800, floor: 790, resultsTop: 300 }, false);
    const position = () => {
      const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(element.style.transform)!;
      return { x: Number(match[1]) + 50, y: Number(match[2]) + 30 };
    };
    const advance = () => {
      for (let step = 0; step < 6; step++) {
        const callbacks = [...frames.values()];
        frames.clear();
        time += 1000 / 60;
        for (const callback of callbacks) callback(time);
      }
    };
    const start = position();
    scene.pointerDown('object', pointer('pointerdown', start.x, start.y, 0));
    run(scene, position, advance);
  } finally {
    scene?.dispose();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test('a sparse move stream with a final release flick carries the body beyond its release position', async () => {
  await withScene((scene, position, advance) => {
    scene.pointerMove(pointer('pointermove', 450, 300, 1000));
    scene.pointerMove(pointer('pointermove', 550, 280, 1020));
    scene.pointerUp(pointer('pointerup', 650, 270, 1150, 0));
    advance();
    assert.ok(position().x > 700, 'release movement must become real body momentum');
  });
});

test('capture loss after button release preserves a throw before a late pointer-up', async () => {
  await withScene((scene, position, advance) => {
    scene.pointerMove(pointer('pointermove', 450, 300, 1000));
    scene.pointerMove(pointer('pointermove', 550, 300, 1020));
    scene.pointerUp(pointer('lostpointercapture', 0, 0, 1030, 0));
    scene.pointerUp(pointer('pointerup', 550, 300, 1031, 0));
    advance();
    assert.ok(position().x > 650, 'normal capture release must not cancel momentum');
  });
});

test('pausing before release lets the body drop in place', async () => {
  await withScene((scene, position, advance) => {
    scene.pointerMove(pointer('pointermove', 450, 300, 1000));
    scene.pointerMove(pointer('pointermove', 550, 300, 1020));
    scene.pointerUp(pointer('pointerup', 550, 300, 1170, 0));
    advance();
    assert.ok(Math.abs(position().x - 550) < 0.5);
    assert.ok(position().y > 300);
  });
});

test('capture loss while the button is held cancels the throw', async () => {
  await withScene((scene, position, advance) => {
    scene.pointerMove(pointer('pointermove', 450, 300, 1000));
    scene.pointerMove(pointer('pointermove', 550, 300, 1020));
    scene.pointerUp(pointer('lostpointercapture', 0, 0, 1030, 1));
    advance();
    assert.ok(Math.abs(position().x - 550) < 0.5);
  });
});

for (const resultsTop of [300, 340]) {
  test(`${resultsTop === 300 ? 'identical bounds' : 'a search-area update'} preserves a throw in progress`, async () => {
    await withScene((scene, position, advance) => {
      scene.pointerMove(pointer('pointermove', 450, 300, 1000));
      scene.pointerMove(pointer('pointermove', 550, 300, 1020));
      scene.pointerUp(pointer('pointerup', 650, 300, 1040, 0));
      scene.resize({ width: 1200, height: 800, floor: 790, resultsTop });
      advance();
      assert.ok(position().x > 750, 'layout notifications must not reset the world or its velocity');
    });
  });
}

test('a search-area update preserves an active drag and retargets selected objects', async () => {
  await withScene((scene, position, advance) => {
    scene.pointerMove(pointer('pointermove', 450, 300, 1000));
    scene.resize({ width: 1200, height: 800, floor: 790, resultsTop: 340 });
    scene.pointerMove(pointer('pointermove', 550, 300, 1020));
    scene.pointerUp(pointer('pointerup', 650, 300, 1040, 0));
    advance();
    assert.ok(position().x > 750, 'changing the search area must not cancel a drag');

    scene.select(['object']);
    for (let i = 0; i < 20; i++) advance();
    const before = position();
    scene.resize({ width: 1200, height: 800, floor: 790, resultsTop: 420 });
    for (let i = 0; i < 20; i++) advance();
    assert.ok(Math.abs(position().y - before.y - 80) < 1, 'selected objects must follow the new result position');
  });
});

test('a smaller viewport rebuilds the boundaries and retains the selection', async () => {
  await withScene((scene, position, advance) => {
    scene.select(['object']);
    scene.resize({ width: 600, height: 650, floor: 640, resultsTop: 260 });
    for (let i = 0; i < 20; i++) advance();
    assert.ok(Math.abs(position().x - 300) < 1);
    assert.ok(position().y > 260 && position().y < 640);
  });
});
