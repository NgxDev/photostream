/**
 * jsdom has no ResizeObserver, so specs get this instead: inert until a test drives it through
 * `resizeTo`. Installed globally by `test-setup.ts`.
 */
export class FakeResizeObserver {
  static latest: FakeResizeObserver | undefined;

  private observed: Element | undefined;

  constructor(private readonly notify: ResizeObserverCallback) {
    FakeResizeObserver.latest = this;
  }

  readonly observe = (target: Element): void => {
    this.observed = target;
  };

  readonly unobserve = (): void => undefined;
  readonly disconnect = (): void => undefined;

  readonly resizeTo = (width: number): void => {
    const entry = { target: this.observed, contentRect: { width } } as unknown as ResizeObserverEntry;

    this.notify([entry], this as unknown as ResizeObserver);
  };
}
