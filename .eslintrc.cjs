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
  rules: {
    'prettier/prettier': 'error',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-param-reassign': ['error', { props: false }],
  },
};
