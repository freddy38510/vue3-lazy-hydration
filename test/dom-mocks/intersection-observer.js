/* eslint-disable max-classes-per-file */

function normalizeEntry(entry, target) {
  const isIntersecting =
    entry.isIntersecting == null
      ? Boolean(entry.intersectionRatio)
      : entry.isIntersecting;
  const intersectionRatio = entry.intersectionRatio || (isIntersecting ? 1 : 0);
  return {
    boundingClientRect:
      entry.boundingClientRect || target.getBoundingClientRect(),
    intersectionRatio,
    intersectionRect: entry.intersectionRect || target.getBoundingClientRect(),
    isIntersecting,
    rootBounds: entry.rootBounds || document.body.getBoundingClientRect(),
    target,
    time: entry.time || Date.now(),
  };
}

export default class IntersectionObserverMock {
  constructor() {
    this.observers = [];
    this.isUsingMockIntersectionObserver = false;
    this.originalIntersectionObserver = global.IntersectionObserver;
    this.originalIntersectionObserverEntry = global.IntersectionObserverEntry;
  }

  simulate(entry) {
    this.ensureMocked();
    const arrayOfEntries = Array.isArray(entry) ? entry : [entry];
    const targets = arrayOfEntries.map(({ target }) => target);
    const noCustomTargets = targets.every((target) => target == null);

    this.observers.forEach((observer) => {
      if (noCustomTargets || targets.includes(observer.target)) {
        observer.callback(
          arrayOfEntries.map((observerEntry) =>
            normalizeEntry(observerEntry, observer.target)
          ),
          observer
        );
      }
    });
  }

  mock() {
    if (this.isUsingMockIntersectionObserver) {
      throw new Error(
        'IntersectionObserver is already mocked, but you tried to mock it again.'
      );
    }

    this.isUsingMockIntersectionObserver = true;

    const setObservers = (setter) => {
      this.observers = setter(this.observers);
    };

    global.IntersectionObserverEntry = class IntersectionObserverEntry {};
    Object.defineProperty(
      IntersectionObserverEntry.prototype,
      'intersectionRatio',
      {
        get() {
          return 0;
        },
      }
    );
    global.IntersectionObserver = class FakeIntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }

      observe(target) {
        setObservers((observers) => [
          ...observers,
          {
            source: this,
            target,
            callback: this.callback,
            options: this.options,
          },
        ]);
      }

      disconnect() {
        setObservers((observers) =>
          observers.filter((observer) => observer.source !== this)
        );
      }

      unobserve(target) {
        setObservers((observers) =>
          observers.filter(
            (observer) =>
              !(observer.target === target && observer.source === this)
          )
        );
      }
    };
  }

  mockAsUnsupported() {
    if (this.isUsingMockIntersectionObserver) {
      throw new Error(
        'intersectionObserver is already mocked, but you tried to mock it again.'
      );
    }

    this.isUsingMockIntersectionObserver = true;
    this.isMockingUnsupported = true;
    const windowIntersectionObserver = window;
    this.originalIntersectionObserver =
      windowIntersectionObserver.IntersectionObserver;
    delete windowIntersectionObserver.IntersectionObserver;
  }

  restore() {
    if (!this.isUsingMockIntersectionObserver) {
      throw new Error(
        'IntersectionObserver is already real, but you tried to restore it again.'
      );
    }

    global.IntersectionObserver = this.originalIntersectionObserver;
    global.IntersectionObserverEntry = this.originalIntersectionObserverEntry;
    this.isUsingMockIntersectionObserver = false;
    this.observers.length = 0;
  }

  isMocked() {
    return this.isUsingMockIntersectionObserver;
  }

  ensureMocked() {
    if (!this.isUsingMockIntersectionObserver) {
      throw new Error(
        'You must call intersectionObserver.mock() before interacting with the fake IntersectionObserver.'
      );
    }
  }
}
