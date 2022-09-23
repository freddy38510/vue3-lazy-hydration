/* eslint-disable no-underscore-dangle */
/* eslint-disable no-bitwise */

import type { ModuleNode } from 'vite';

const hashCode = (moduleId: string) => {
  let hash = 0;
  let i;
  let chr;
  if (moduleId.length === 0) return hash;
  for (i = 0; i < moduleId.length; i += 1) {
    chr = moduleId.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const moduleIsStyle = (mod: ModuleNode) =>
  (mod?.file?.endsWith('.scss') ||
    mod?.file?.endsWith('.css') ||
    mod?.id?.includes('vue&type=style')) &&
  mod?.ssrModule;

/**
 * Collect SSR CSS for Vite
 */
export const collectCss = (
  mods: ModuleNode[] | Set<ModuleNode>,
  styles = new Map(),
  checkedMods = new Set()
) => {
  let result = '';

  mods.forEach((mod) => {
    if (moduleIsStyle(mod)) {
      styles.set(mod.url, mod.ssrModule?.default);
    }

    if (mod?.importedModules?.size > 0 && !checkedMods.has(mod.id)) {
      checkedMods.add(mod.id);

      collectCss(mod.importedModules, styles, checkedMods);
    }
  });

  styles.forEach((content, id) => {
    result = result.concat(
      `<style vite-module-id="${hashCode(id)}">${content}</style>`
    );
  });

  return result;
};

/**
 * Client listener to detect updated modules through HMR,
 * and remove the initial styled attached to the head
 */
export const removeCssHotReloaded = () => {
  if (!import.meta.hot) {
    return;
  }

  import.meta.hot.on('vite:beforeUpdate', (module) => {
    module.updates.forEach((update) => {
      const moduleStyle = document.querySelector(
        `[vite-module-id="${hashCode(update.acceptedPath)}"]`
      );

      if (moduleStyle) {
        moduleStyle.remove();
      }
    });
  });
};
