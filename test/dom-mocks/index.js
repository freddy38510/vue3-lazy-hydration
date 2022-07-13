import RequestIdleCallback from './request-idle-callback';
import IntersectionObserver from './intersection-observer';

export const requestIdleCallback = new RequestIdleCallback();
export const intersectionObserver = new IntersectionObserver();

const mocksToEnsureReset = {
  requestIdleCallback,
  intersectionObserver,
};

export function ensureMocksReset() {
  Object.keys(mocksToEnsureReset).forEach((mockName) => {
    if (mocksToEnsureReset[mockName].isMocked()) {
      throw new Error(
        `You did not reset the mocked ${mockName}. Make sure to call ${mockName}.restore() after your tests have run.`
      );
    }
  });
}
