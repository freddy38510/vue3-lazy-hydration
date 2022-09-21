module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended',
    'eslint-config-vitest-globals',
  ],
  env: {
    browser: true,
    node: true,
    'vue/setup-compiler-macros': true,
  },
  globals: {
    __DEV__: 'readonly',
  },
  ignorePatterns: ['node_modules', 'dist'],
  rules: {
    'prettier/prettier': 'error',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-param-reassign': ['error', { props: false }],
  },
};
