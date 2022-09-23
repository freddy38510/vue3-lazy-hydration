const observers = new Map();

export default function createHydrationObserver(
  options?: IntersectionObserverInit
): {
  supported: boolean;
  observer?: IntersectionObserver;
} {
  const supported = typeof IntersectionObserver !== 'undefined';

  if (!supported) {
    return { supported };
  }

  const optionKey = JSON.stringify(options);

  if (observers.has(optionKey)) {
    return { supported, observer: observers.get(optionKey) };
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(
      (
        entry: IntersectionObserverEntry & {
          target: { hydrate?: () => Promise<void> };
        }
      ) => {
        // Use `intersectionRatio` because of Edge 15's
        // lack of support for `isIntersecting`.
        // See: https://github.com/w3c/IntersectionObserver/issues/211
        const isIntersecting =
          entry.isIntersecting || entry.intersectionRatio > 0;

        if (!isIntersecting || !entry.target.hydrate) {
          return;
        }

        entry.target.hydrate();
      }
    );
  }, options);

  observers.set(optionKey, observer);

  return { supported, observer };
}
