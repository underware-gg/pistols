module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-duplicate-enum-values': 0,
    'react-refresh/only-export-components': 'warn',
    'no-mixed-spaces-and-tabs': 0,
    // TODO: uncomment and fix all this...
    'react-hooks/exhaustive-deps': 0,
    'react-refresh/only-export-components': 0,
  },
}
