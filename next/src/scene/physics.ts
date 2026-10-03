import type { Collider, RigidBody, World } from '@dimforge/rapier2d-compat';
import { clamp, layoutPile, layoutResults } from './layout.ts';
import type { Placement } from './layout';
import type { PhysicsScene, SceneBounds, SceneObject } from './types';
import { DRAG_THRESHOLD } from './gesture.ts';
import { DragVelocity } from './velocity.ts';

const PIXELS_PER_METRE = 100;
const STEP = 1 / 60;
const SPRING_FREQUENCY = 11;
const SPRING_DAMPING = 1.75 * SPRING_FREQUENCY;
const paintedTransforms = new WeakMap<HTMLElement, string>();

let physicsReady: Promise<typeof import('@dimforge/rapier2d-compat').default> | undefined;

function loadPhysics() {
  physicsReady ??= import('@dimforge/rapier2d-compat').then(async ({ default: rapier }) => {
    await rapier.init();
    return rapier;
  });
  return physicsReady;
}

interface Spring extends Placement {
  target: Placement;
  vx: number;
  vy: number;
  angularVelocity: number;
  settled: boolean;
}

interface SceneBody {
  object: SceneObject;
  body: RigidBody;
  collider: Collider;
  spring?: Spring;
}

interface Drag {
  item: SceneBody;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  velocity: DragVelocity;
  active: boolean;
  visualWidth: number;
  visualHeight: number;
}

function pose(item: SceneBody): Placement {
  const translation = item.body.translation();
  return {
    id: item.object.id,
    x: translation.x * PIXELS_PER_METRE,
    y: translation.y * PIXELS_PER_METRE,
    angle: item.body.rotation(),
  };
}

function paint(object: SceneObject, placement: Placement) {
  const transform = `translate(${(placement.x - object.width / 2).toFixed(2)}px, ${(placement.y - object.height / 2).toFixed(2)}px) rotate(${placement.angle.toFixed(4)}rad)`;
  if (paintedTransforms.get(object.element) === transform) return;
  object.element.style.transform = transform;
  paintedTransforms.set(object.element, transform);
}

function springAt(placement: Placement, target: Placement): Spring {
  return { ...placement, target, vx: 0, vy: 0, angularVelocity: 0, settled: false };
}

function resultScale(object: SceneObject): number {
  const scale = Number.parseFloat(getComputedStyle(object.element).getPropertyValue('--result-scale'));
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function advanceSpring(spring: Spring) {
  const strength = SPRING_FREQUENCY ** 2;
  spring.vx += ((spring.target.x - spring.x) * strength - spring.vx * SPRING_DAMPING) * STEP;
  spring.vy += ((spring.target.y - spring.y) * strength - spring.vy * SPRING_DAMPING) * STEP;
  spring.angularVelocity += (-spring.angle * strength - spring.angularVelocity * SPRING_DAMPING) * STEP;
  spring.x += spring.vx * STEP;
  spring.y += spring.vy * STEP;
  spring.angle += spring.angularVelocity * STEP;

  if (Math.hypot(spring.target.x - spring.x, spring.target.y - spring.y) < 0.3
    && Math.hypot(spring.vx, spring.vy) < 1 && Math.abs(spring.angle) < 0.002) {
    Object.assign(spring, spring.target, { vx: 0, vy: 0, angularVelocity: 0, settled: true });
  }
}

/** Owns animation and WASM resources; React only supplies content and user intent. */
export async function createPhysicsScene(
  objects: SceneObject[],
  initialBounds: SceneBounds,
  initialReducedMotion: boolean,
  onSelectionChange?: (ids: readonly string[]) => void,
): Promise<PhysicsScene> {
  const rapier = await loadPhysics();
  const objectsById = new Map(objects.map((object) => [object.id, object]));
  const bodies = new Map<string, SceneBody>();
  let bounds = initialBounds;
  let world: World | undefined;
  let selectedIds: readonly string[] = [];
  let displayedIds: readonly string[] = [];
  let reducedMotion = initialReducedMotion;
  let paused = false;
  let hidden = document.hidden;
  let disposed = false;
  let drag: Drag | undefined;
  let frame = 0;
  let lastTime = 0;
  let accumulator = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    accumulator = 0;
  }

  function hasWork() {
    if (drag?.active) return true;
    for (const item of bodies.values()) {
      if (item.spring ? !item.spring.settled : !item.body.isSleeping()) return true;
    }
    return false;
  }

  function wake() {
    if (!frame && !disposed && !paused && !hidden && !reducedMotion && world && hasWork()) {
      frame = requestAnimationFrame(tick);
    }
  }

  function tick(time: number) {
    frame = 0;
    if (!world || disposed || paused || hidden || reducedMotion) return;
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, STEP * 4) : STEP;
    lastTime = time;
    accumulator += elapsed;

    while (accumulator >= STEP) {
      for (const item of bodies.values()) {
        if (drag?.active && drag.item === item) {
          item.body.setNextKinematicTranslation({ x: drag.x / PIXELS_PER_METRE, y: drag.y / PIXELS_PER_METRE });
        } else if (item.spring && !item.spring.settled) {
          advanceSpring(item.spring);
          item.body.setNextKinematicTranslation({ x: item.spring.x / PIXELS_PER_METRE, y: item.spring.y / PIXELS_PER_METRE });
          item.body.setNextKinematicRotation(item.spring.angle);
        }
      }
      world.step();
      accumulator -= STEP;
    }

    for (const item of bodies.values()) paint(item.object, pose(item));
    if (hasWork()) wake();
    else stop();
  }

  function targets() {
    return layoutResults(selectedIds.flatMap((id) => {
      const object = objectsById.get(id);
      if (!object) return [];
      const scale = resultScale(object);
      return [{ id, width: object.width * scale, height: object.height * scale }];
    }), bounds);
  }

  function markSelections(placements: readonly Placement[]) {
    const order = new Map(placements.map((placement, index) => [placement.id, index]));
    for (const object of objects) {
      const index = order.get(object.id);
      object.element.dataset.sceneState = index === undefined ? 'pile' : 'selected';
      if (index === undefined) delete object.element.dataset.selectionOrder;
      else object.element.dataset.selectionOrder = String(index + 1);
    }
  }

  function pileObjects() {
    return objects.map((object) => ({
      id: object.id, width: object.width, height: object.height,
      shape: object.element.dataset.shape === 'circle' ? 'circle' as const : undefined,
    }));
  }

  function applySelections() {
    const placements = targets();
    markSelections(placements);
    const nextIds = placements.map((placement) => placement.id);
    if (nextIds.length !== displayedIds.length || nextIds.some((id, index) => id !== displayedIds[index])) {
      displayedIds = nextIds;
      onSelectionChange?.(nextIds);
    }

    if (reducedMotion) {
      const staticPoses = new Map(layoutPile(pileObjects(), bounds, true).map((placement) => [placement.id, placement]));
      for (const placement of placements) staticPoses.set(placement.id, placement);
      for (const object of objects) paint(object, staticPoses.get(object.id)!);
      return;
    }

    const targetById = new Map(placements.map((placement) => [placement.id, placement]));
    for (const item of bodies.values()) {
      const target = targetById.get(item.object.id);
      if (target) {
        if (item.spring?.target.x === target.x && item.spring.target.y === target.y) continue;
        item.spring = springAt(pose(item), target);
        item.body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
        item.collider.setSensor(true);
      } else if (item.spring) {
        item.spring = undefined;
        item.collider.setSensor(false);
        item.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
        item.body.setLinvel({ x: 0, y: 0.3 }, true);
        item.body.setAngvel(0, true);
      }
    }
    wake();
  }

  function endDrag(cancelled: boolean, releaseTime?: number) {
    const current = drag;
    drag = undefined;
    if (!current) return false;
    const { item } = current;
    if (current.active) {
      item.object.element.removeAttribute('data-dragging');
      item.body.setTranslation({ x: current.x / PIXELS_PER_METRE, y: current.y / PIXELS_PER_METRE }, true);
      if (item.spring) {
        item.spring = springAt(pose(item), item.spring.target);
      } else {
        const velocity = cancelled || releaseTime === undefined ? { x: 0, y: 0 }
          : current.velocity.release({ x: current.x, y: current.y, time: releaseTime });
        item.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
        item.body.setLinvel({
          x: velocity.x / PIXELS_PER_METRE,
          y: velocity.y / PIXELS_PER_METRE,
        }, true);
        item.body.setAngvel(clamp(velocity.x * current.offsetY / 10000, -5, 5), true);
      }
      wake();
    }
    if (item.object.element.hasPointerCapture(current.pointerId)) {
      item.object.element.releasePointerCapture(current.pointerId);
    }
    return current.active;
  }

  function rebuild() {
    endDrag(true);
    stop();
    world?.free();
    world = undefined;
    bodies.clear();

    if (!reducedMotion) {
      world = new rapier.World({ x: 0, y: 15 });
      world.timestep = STEP;
      world.integrationParameters.numSolverIterations = 6;
      const width = bounds.width / PIXELS_PER_METRE;
      const height = bounds.height / PIXELS_PER_METRE;
      const floor = bounds.floor / PIXELS_PER_METRE;
      const walls = [
        rapier.ColliderDesc.cuboid(0.25, height / 2 + 1).setTranslation(-0.25, height / 2),
        rapier.ColliderDesc.cuboid(0.25, height / 2 + 1).setTranslation(width + 0.25, height / 2),
        rapier.ColliderDesc.cuboid(width / 2 + 1, 0.25).setTranslation(width / 2, floor + 0.25),
        rapier.ColliderDesc.cuboid(width / 2 + 1, 0.25).setTranslation(width / 2, -0.25),
      ];
      for (const wall of walls) world.createCollider(wall.setFriction(0.8).setRestitution(0.12));

      for (const placement of layoutPile(pileObjects(), bounds, true)) {
        const object = objectsById.get(placement.id)!;
        const body = world.createRigidBody(rapier.RigidBodyDesc.dynamic()
          .setTranslation(placement.x / PIXELS_PER_METRE, placement.y / PIXELS_PER_METRE)
          .setRotation(placement.angle)
          .setLinearDamping(0.35)
          .setAngularDamping(1.2)
          .setCanSleep(true)
          .setCcdEnabled(true));
        const shape = object.element.dataset.shape === 'circle'
          ? rapier.ColliderDesc.ball(Math.min(object.width, object.height) / (PIXELS_PER_METRE * 2))
          : rapier.ColliderDesc.cuboid(object.width / (PIXELS_PER_METRE * 2), object.height / (PIXELS_PER_METRE * 2));
        const collider = world.createCollider(shape.setFriction(0.8).setRestitution(0.13), body);
        bodies.set(object.id, { object, body, collider });
        paint(object, placement);
      }
    }
    applySelections();
    wake();
  }

  function localPointer(event: PointerEvent, object: SceneObject) {
    const container = object.element.offsetParent ?? object.element.parentElement;
    const rect = container?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  }

  function dragPosition(current: Drag, event: PointerEvent) {
    const pointer = localPointer(event, current.item.object);
    const width = current.visualWidth;
    const height = current.visualHeight;
    const angle = current.item.body.rotation();
    const circle = current.item.object.element.dataset.shape === 'circle';
    const halfWidth = circle ? width / 2 : (width * Math.abs(Math.cos(angle)) + height * Math.abs(Math.sin(angle))) / 2;
    const halfHeight = circle ? height / 2 : (height * Math.abs(Math.cos(angle)) + width * Math.abs(Math.sin(angle))) / 2;
    return {
      x: clamp(pointer.x - current.offsetX, halfWidth, bounds.width - halfWidth),
      y: clamp(pointer.y - current.offsetY, halfHeight, bounds.floor - halfHeight),
    };
  }

  function activateDrag(current: Drag, event: PointerEvent) {
    if (!current.active && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) >= DRAG_THRESHOLD) {
      current.active = true;
      current.item.body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
      current.item.object.element.dataset.dragging = 'true';
    }
    return current.active;
  }

  function visibilityChanged() {
    hidden = document.hidden;
    if (hidden) {
      endDrag(true);
      stop();
    } else wake();
  }

  document.addEventListener('visibilitychange', visibilityChanged);
  rebuild();

  return {
    select(ids) {
      if (disposed) return;
      endDrag(true);
      selectedIds = [...new Set(ids)].filter((id) => objectsById.has(id)).slice(0, 4);
      applySelections();
    },
    resize(nextBounds) {
      if (disposed) return;
      let dimensionsChanged = bounds.width !== nextBounds.width || bounds.height !== nextBounds.height || bounds.floor !== nextBounds.floor;
      for (const object of objects) {
        const width = object.element.offsetWidth || object.width;
        const height = object.element.offsetHeight || object.height;
        if (width !== object.width || height !== object.height) dimensionsChanged = true;
        object.width = width;
        object.height = height;
      }
      const targetsChanged = bounds.resultsTop !== nextBounds.resultsTop;
      bounds = nextBounds;
      if (dimensionsChanged) rebuild();
      else if (targetsChanged) applySelections();
    },
    setPaused(nextPaused) {
      if (disposed || paused === nextPaused) return;
      paused = nextPaused;
      if (paused) {
        endDrag(true);
        stop();
      } else wake();
    },
    setReducedMotion(reduced) {
      if (disposed || reducedMotion === reduced) return;
      reducedMotion = reduced;
      rebuild();
    },
    pointerDown(id, event) {
      if (disposed || paused || hidden || reducedMotion || event.button !== 0 || !event.isPrimary) return;
      const item = bodies.get(id);
      if (!item) return;
      endDrag(true);
      const pointer = localPointer(event, item.object);
      const placement = pose(item);
      const scale = item.spring ? resultScale(item.object) : 1;
      drag = {
        item, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
        offsetX: pointer.x - placement.x, offsetY: pointer.y - placement.y,
        x: placement.x, y: placement.y,
        velocity: new DragVelocity({ x: placement.x, y: placement.y, time: event.timeStamp }), active: false,
        visualWidth: item.object.width * scale, visualHeight: item.object.height * scale,
      };
      item.object.element.setPointerCapture(event.pointerId);
    },
    pointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId || disposed || paused || hidden) return;
      const position = dragPosition(drag, event);
      drag.velocity.sample({ ...position, time: event.timeStamp });
      if (!activateDrag(drag, event)) return;
      Object.assign(drag, position);
      wake();
    },
    pointerUp(event) {
      if (!drag || event.pointerId !== drag.pointerId) return false;
      if (event.type === 'pointerup' && activateDrag(drag, event)) Object.assign(drag, dragPosition(drag, event));
      const cancelled = event.type === 'pointercancel'
        || (event.type === 'lostpointercapture' && event.buttons !== 0);
      return endDrag(cancelled, event.timeStamp);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      endDrag(true);
      document.removeEventListener('visibilitychange', visibilityChanged);
      world?.free();
      world = undefined;
      bodies.clear();
      for (const object of objects) {
        delete object.element.dataset.sceneState;
        delete object.element.dataset.selectionOrder;
        delete object.element.dataset.dragging;
      }
    },
  };
}
