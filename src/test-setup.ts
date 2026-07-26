import { FakeIntersectionObserver, FakeResizeObserver } from './fake-observers';

globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
