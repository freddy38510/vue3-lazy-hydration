import createApp from './main';
import { removeCssHotReloaded } from './collect-css-ssr';

removeCssHotReloaded();

const { app, router } = createApp();

// wait until router is ready before mounting to ensure hydration match
// eslint-disable-next-line no-void
void router.isReady().then(() => {
  app.mount('#app');
});
