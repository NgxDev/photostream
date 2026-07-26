import { FakeResizeObserver } from './fake-observers';

globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
