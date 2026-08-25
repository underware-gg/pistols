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
      ...reactHooks.configs['recommended-latest'].rules,

      // TODO: 39 violations in sdk/src. Enable with the client's 303.
      'react-hooks/exhaustive-deps': 0,
    },
  },
]
