import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import { name as packageName } from './package.json';
import devSSR from './plugin-dev-server';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue(), devSSR()],
  publicDir: command === 'build' ? false : 'public',
  define: {
    __DEV__: `${
      command === 'build'
        ? `process.env.NODE_ENV === 'development'`
        : 'import.meta.env.DEV'
    }`,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: packageName,
    },
    rollupOptions: {
      external: ['vue'],
      treeshake: {
        moduleSideEffects: 'no-external',
      },
      output: [
        {
          format: 'cjs',
          entryFileNames: `${packageName}.cjs`,
          dir: 'dist',
        },
        {
          format: 'es',
          dir: 'dist/esm',
          entryFileNames: ({ facadeModuleId }) => {
            if (facadeModuleId?.endsWith('src/index.ts')) {
              return `${packageName}.mjs`;
            }

            return '[name].mjs';
          },
          preserveModules: true,
        },
      ],
    },
    minify: false,
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setupVitestEnv.ts'],
  },
}));
