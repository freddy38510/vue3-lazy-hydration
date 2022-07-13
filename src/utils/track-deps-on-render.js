export default function trackDepsOnRender(instance) {
  const componentUpdateFn = instance.effect.fn;
  const originalRender = instance.render;

  instance.render = (...args) => {
    instance.effect.fn = () => originalRender(...args);

    const result = instance.effect.run();

    /**
     * Restore render and effect functions
     */
    instance.effect.fn = componentUpdateFn;
    instance.render = originalRender;

    return result;
  };
}
