import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import devSSR from './plugin-dev-server';

import { name as packageName } from './package.json';

const getPackageNameCamelCase = () => {
  try {
    return packageName.replace(/-./g, (char) => char[1].toUpperCase());
  } catch (err) {
    throw new Error('Name property in package.json is missing.');
  }
};

let format;

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [vue(), devSSR()],
  publicDir: command === 'build' ? false : 'public',
  define: {
    __DEV__: `${
      mode.production
        ? `process.env.NODE_ENV === 'development'`
        : 'import.meta.env.DEV'
    }`,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: getPackageNameCamelCase(),
      formats: ['cjs', 'es'],
      fileName: (moduleFormat) => {
        format = moduleFormat;

        if (moduleFormat === 'cjs') {
          return `${getPackageNameCamelCase()}.cjs.js`;
        }

        return `${format === 'es' ? 'esm' : 'cjs'}/[name].js`;
      },
    },
    rollupOptions: {
      external: ['vue'],
      manualChunks: (id) => {
        if (format === 'cjs') {
          return null;
        }

        if (id.includes('src/components')) {
          return `components/${path.parse(id).name}`;
        }

        if (id.includes('src/composables')) {
          return `composables/${path.parse(id).name}`;
        }

        if (id.includes('src/wrappers')) {
          return `wrappers/${path.parse(id).name}`;
        }

        if (id.includes('src/utils')) {
          return `utils/${path.parse(id).name}`;
        }

        return path.parse(id).name;
      },
      output: {
        chunkFileNames: () => {
          return 'esm/[name].js';
        },
      },
    },
    minify: false,
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setupVitestEnv.js'],
  },
}));
