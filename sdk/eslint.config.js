import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

// The SDK had no eslint setup at all, so `turbo lint` reached only the client and
// 273 SDK source files were never linted. rules-of-hooks is on because it catches
// real state-corruption bugs; exhaustive-deps is off to match the client, where it
// is a 303-violation backlog rather than a gate. The SDK's own backlog is 39.
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
      // are a backlog to take deliberately, like exhaustive-deps. Leaving them
      // unlisted keeps them off without pinning rule names that only exist in v7.
      'react-hooks/rules-of-hooks': 'error',

      // TODO: 39 violations in sdk/src. Enable with the client's 303.
      'react-hooks/exhaustive-deps': 0,
    },
  },
]
