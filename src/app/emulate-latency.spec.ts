import { of, throwError } from 'rxjs';
import { emulateLatency, MAX_LATENCY_MS, MIN_LATENCY_MS } from './emulate-latency';

describe('emulateLatency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('withholds the value until at least 200ms have passed', async () => {
    const received: string[] = [];
    of('photo')
      .pipe(emulateLatency())
      .subscribe((value) => received.push(value));

    await vi.advanceTimersByTimeAsync(MIN_LATENCY_MS - 1);

    expect(received).toEqual([]);
  });

  it('has released the value by 300ms', async () => {
    const received: string[] = [];
    of('photo')
      .pipe(emulateLatency())
      .subscribe((value) => received.push(value));

    await vi.advanceTimersByTimeAsync(MAX_LATENCY_MS);

    expect(received).toEqual(['photo']);
  });

  it('passes every value through unchanged and completes', async () => {
    const received: number[] = [];
    let completed = false;
    of(1, 2, 3)
      .pipe(emulateLatency())
      .subscribe({ next: (value) => received.push(value), complete: () => (completed = true) });

    await vi.advanceTimersByTimeAsync(MAX_LATENCY_MS);

    expect(received).toEqual([1, 2, 3]);
    expect(completed).toBe(true);
  });

  it('forwards errors', async () => {
    const failure = new Error('offline');
    let caught: unknown;
    throwError(() => failure)
      .pipe(emulateLatency())
      .subscribe({ error: (error) => (caught = error) });

    await vi.advanceTimersByTimeAsync(MAX_LATENCY_MS);

    expect(caught).toBe(failure);
  });

  it('draws a new delay for every subscription', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
    const delayed = of('photo').pipe(emulateLatency());
    const first: string[] = [];
    const second: string[] = [];

    delayed.subscribe((value) => first.push(value));
    delayed.subscribe((value) => second.push(value));
    await vi.advanceTimersByTimeAsync(MIN_LATENCY_MS);

    expect(first).toEqual(['photo']);
    expect(second).toEqual([]);

    await vi.advanceTimersByTimeAsync(MAX_LATENCY_MS - MIN_LATENCY_MS);

    expect(second).toEqual(['photo']);
  });
});
