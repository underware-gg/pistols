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
      // Rules are enumerated deliberately rather than spread from
      // reactHooks.configs['recommended-latest']. That preset grew: plugin v7
      // added nine React Compiler rules to it, which report 223 violations across
      // this repository (199 client, 24 sdk) - set-state-in-effect 94,
      // immutability 57, refs 33, static-components 13, purity 9, use-memo 9,
      // preserve-manual-memoization 4, set-state-in-render 3, void-use-memo 1.
      //
      // Adopting those as a side effect of moving off a deprecated ESLint line
      // would fold a large code-quality decision into a supply-chain fix. They
      // are a backlog to take deliberately. Leaving them
      // unlisted keeps them off without pinning rule names that only exist in v7.
      'react-hooks/rules-of-hooks': 'error',

      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/no-duplicate-enum-values': 0,
      'no-mixed-spaces-and-tabs': 0,

      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': 0,
    },
  },
]
