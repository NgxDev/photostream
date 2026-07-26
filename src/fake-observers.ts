/**
 * jsdom implements neither observer, so specs get these instead of the real thing: inert until a
 * test drives them through `resizeTo` or `comeIntoView`. Installed globally by `test-setup.ts`.
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

export class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | undefined;

  constructor(
    private readonly notify: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit
  ) {
    FakeIntersectionObserver.latest = this;
  }

  readonly observe = (): void => undefined;
  readonly unobserve = (): void => undefined;
  readonly disconnect = (): void => undefined;

  readonly comeIntoView = (): void => {
    const entry = { isIntersecting: true } as unknown as IntersectionObserverEntry;

    this.notify([entry], this as unknown as IntersectionObserver);
  };
}
