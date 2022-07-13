import createApp from './main';
import { removeCssHotReloaded } from './collect-css-ssr';

removeCssHotReloaded();

const { app, router } = createApp();

// wait until router is ready before mounting to ensure hydration match
router.isReady().then(() => {
  app.mount('#app');
});
