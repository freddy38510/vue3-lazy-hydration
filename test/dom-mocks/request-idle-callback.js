export default class RequestIdleCallback {
  constructor() {
    this.isUsingMockIdleCallback = false;
    this.isMockingUnsupported = false;
    this.queued = {};
    this.originalRequestIdleCallback = undefined;
    this.originalCancelIdleCallback = undefined;
    this.currentIdleCallback = 0;

    this.requestIdleCallback = (callback) => {
      this.currentIdleCallback += 1;
      this.queued[this.currentIdleCallback] = callback;
      return this.currentIdleCallback;
    };

    this.cancelIdleCallback = (callback) => {
      delete this.queued[callback];
    };
  }

  mock() {
    if (this.isUsingMockIdleCallback) {
      throw new Error(
        'requestIdleCallback is already mocked, but you tried to mock it again.'
      );
    }

    this.isUsingMockIdleCallback = true;
    const windowWithIdle = window;
    this.originalRequestIdleCallback = windowWithIdle.requestIdleCallback;
    windowWithIdle.requestIdleCallback = this.requestIdleCallback;
    this.originalCancelIdleCallback = windowWithIdle.cancelIdleCallback;
    windowWithIdle.cancelIdleCallback = this.cancelIdleCallback;
  }

  mockAsUnsupported() {
    if (this.isUsingMockIdleCallback) {
      throw new Error(
        'requestIdleCallback is already mocked, but you tried to mock it again.'
      );
    }

    this.isUsingMockIdleCallback = true;
    this.isMockingUnsupported = true;
    const windowWithIdle = window;
    this.originalRequestIdleCallback = windowWithIdle.requestIdleCallback;
    delete windowWithIdle.requestIdleCallback;
    this.originalCancelIdleCallback = windowWithIdle.cancelIdleCallback;
    delete windowWithIdle.cancelIdleCallback;
  }

  restore() {
    if (!this.isUsingMockIdleCallback) {
      throw new Error(
        'requestIdleCallback is already real, but you tried to restore it again.'
      );
    }

    if (Object.keys(this.queued).length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        'You are restoring requestIdleCallback, but some idle callbacks have not been run. You can run requestIdleCallback.cancelIdleCallback() to clear them all and avoid this warning.'
      );
      this.cancelIdleCallbacks();
    }

    this.isUsingMockIdleCallback = false;
    this.isMockingUnsupported = false;

    if (this.originalRequestIdleCallback) {
      window.requestIdleCallback = this.originalRequestIdleCallback;
    } else {
      delete window.requestIdleCallback;
    }

    if (this.originalCancelIdleCallback) {
      window.cancelIdleCallback = this.originalCancelIdleCallback;
    } else {
      delete window.cancelIdleCallback;
    }
  }

  isMocked() {
    return this.isUsingMockIdleCallback;
  }

  runIdleCallbacks(timeRemaining = Infinity, didTimeout = false) {
    this.ensureIdleCallbackIsMock();
    // We need to do it this way so that frames that queue other frames
    // don't get removed

    Object.keys(this.queued).forEach((frame) => {
      const callback = this.queued[frame];
      delete this.queued[frame];
      callback({
        timeRemaining: () => timeRemaining,
        didTimeout,
      });
    });
  }

  cancelIdleCallbacks() {
    this.ensureIdleCallbackIsMock();

    Object.keys(this.queued).forEach((id) => {
      this.cancelIdleCallback(id);
    });
  }

  ensureIdleCallbackIsMock() {
    if (!this.isUsingMockIdleCallback) {
      throw new Error(
        'You must call requestIdleCallback.mock() before interacting with the mock request- or cancel- IdleCallback methods.'
      );
    }

    if (this.isMockingUnsupported) {
      throw new Error(
        'You have mocked requestIdleCallback as unsupported. Call requestIdleCallback.restore(), then requestIdleCallback.mock() if you want to simulate idle callbacks.'
      );
    }
  }
}
