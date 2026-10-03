interface MotionSample {
  x: number;
  y: number;
  time: number;
}

const HISTORY_MS = 100;
const MAX_SPEED = 1800;

/** A time-based motion window keeps throws independent of pointer event frequency. */
export class DragVelocity {
  private samples: MotionSample[];

  constructor(initial: MotionSample) {
    this.samples = [initial];
  }

  sample(point: MotionSample) {
    this.record(point, true);
  }

  release(point: MotionSample): { x: number; y: number } {
    // Release can contain movement that never arrived in a pointermove event.
    this.record(point, false);
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const next = this.samples[1];
    const startTime = Math.max(first.time, last.time - HISTORY_MS);
    const elapsed = (last.time - startTime) / 1000;
    if (!next || elapsed <= 0) return { x: 0, y: 0 };

    const fraction = (startTime - first.time) / (next.time - first.time);
    const startX = first.x + (next.x - first.x) * fraction;
    const startY = first.y + (next.y - first.y) * fraction;
    const x = (last.x - startX) / elapsed;
    const y = (last.y - startY) / elapsed;
    const scale = Math.min(1, MAX_SPEED / Math.hypot(x, y));
    return { x: x * scale, y: y * scale };
  }

  private record(point: MotionSample, restartAfterPause: boolean) {
    const last = this.samples[this.samples.length - 1];
    if (point.time < last.time) return;
    if (point.time === last.time) {
      this.samples[this.samples.length - 1] = point;
      return;
    }
    if (restartAfterPause && point.time - last.time > HISTORY_MS) this.samples = [];
    this.samples.push(point);
    // Retain one older point so the start of the window can be interpolated.
    while (this.samples.length > 2 && this.samples[1].time <= point.time - HISTORY_MS) this.samples.shift();
  }
}
