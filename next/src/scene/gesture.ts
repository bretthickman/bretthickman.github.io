export const DRAG_THRESHOLD = 6;

type PointerPosition = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY'>;
type PointerStart = PointerPosition & Pick<PointerEvent, 'button' | 'isPrimary'>;

/** Keeps activation intent independent of the simulation and capture-event ordering. */
export class PointerGesture {
  private current?: {
    pointerId: number;
    startX: number;
    startY: number;
    dragged: boolean;
    cancelled: boolean;
    released: boolean;
  };

  start(event: PointerStart) {
    if (event.button !== 0 || !event.isPrimary) return;
    this.current = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      dragged: false, cancelled: false, released: false,
    };
  }

  move(event: PointerPosition) {
    const gesture = this.current;
    if (!gesture || gesture.released || event.pointerId !== gesture.pointerId) return;
    gesture.dragged ||= Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) >= DRAG_THRESHOLD;
  }

  release(event: PointerPosition) {
    if (event.pointerId !== this.current?.pointerId) return;
    this.move(event);
    this.current.released = true;
  }

  cancel(event: Pick<PointerEvent, 'pointerId'>) {
    if (event.pointerId !== this.current?.pointerId) return;
    this.current.cancelled = true;
    this.current.released = true;
  }

  loseCapture(event: Pick<PointerEvent, 'pointerId'>) {
    // A normal release drops capture too. Only an interrupted gesture is cancelled.
    if (!this.current?.released) this.cancel(event);
  }

  consumeClick(pointerType?: string): boolean {
    // Keyboard and assistive activation have no pointer type in modern browsers.
    const suppress = pointerType !== '' && Boolean(this.current?.dragged || this.current?.cancelled);
    this.reset();
    return suppress;
  }

  reset() {
    this.current = undefined;
  }
}
