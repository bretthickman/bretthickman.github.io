export interface SceneObject {
  id: string;
  element: HTMLElement;
  width: number;
  height: number;
}

export interface SceneBounds {
  width: number;
  height: number;
  floor: number;
  resultsTop: number;
}

export interface PhysicsScene {
  select(ids: readonly string[]): void;
  resize(bounds: SceneBounds): void;
  setPaused(paused: boolean): void;
  setReducedMotion(reduced: boolean): void;
  pointerDown(id: string, event: PointerEvent): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): boolean;
  dispose(): void;
}
