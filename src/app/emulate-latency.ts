import { defer, delay, MonoTypeOperatorFunction } from 'rxjs';

export const MIN_LATENCY_MS = 200;
export const MAX_LATENCY_MS = 300;

function randomLatencyMs(): number {
  return MIN_LATENCY_MS + Math.round(Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS));
}

export function emulateLatency<T>(): MonoTypeOperatorFunction<T> {
  return (source) => defer(() => source.pipe(delay(randomLatencyMs())));
}
