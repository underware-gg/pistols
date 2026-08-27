import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

// The SDK had no eslint setup at all, so `turbo lint` reached only the client and
// 273 SDK source files were never linted. rules-of-hooks is on because it catches
// real state-corruption bugs. exhaustive-deps is also a permanent gate across
// both packages, with documented inline exceptions for lifecycle-style helpers.
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
      // are a backlog to take deliberately. Leaving them
      // unlisted keeps them off without pinning rule names that only exist in v7.
      'react-hooks/rules-of-hooks': 'error',

      // Enabled after converting the SDK's async fetch hooks to react-query. What
      // remains are five hooks that are effect-shaped by nature - a frame-skip, a
      // clock, a localStorage seed, a browser-API poll, and a generic async runner
      // with opaque deps - each carrying an inline disable and the reason.
      'react-hooks/set-state-in-effect': 'error',

      'react-hooks/exhaustive-deps': 'error',
    },
  },
]
