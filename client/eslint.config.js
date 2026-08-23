import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// Flat config, replacing .eslintrc.cjs. ESLint 9 ignores eslintrc by default and
// ESLint 10 removes it entirely, so `pnpm lint` could not run at all.
//
// This is a faithful port of the previous rule set, not a revision of it. The
// `--ext` flag is gone in flat config, so file selection lives here instead and
// the lint script passes only the directory.
export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,

      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/no-duplicate-enum-values': 0,
      'no-mixed-spaces-and-tabs': 0,

      // TODO: uncomment and fix all this...
      'react-hooks/exhaustive-deps': 0,
      'react-refresh/only-export-components': 0,
    },
  },
]
