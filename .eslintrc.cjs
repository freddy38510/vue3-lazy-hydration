require('@rushstack/eslint-patch/modern-module-resolution');
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    node: true,
    'vitest-globals/env': true,
  },
  ignorePatterns: ['node_modules', 'dist', 'temp'],
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-airbnb-with-typescript',
    'plugin:vitest-globals/recommended',
    'prettier',
  ],
  rules: {
    'no-param-reassign': ['error', { props: false }],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
  },
});
