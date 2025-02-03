import globals from 'globals'
import pluginJs from '@eslint/js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['client/**'] },
  pluginJs.configs.recommended,
  {
    files: ['client.js', 'lib/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        wiki: 'writable',
        ...globals.browser,
        ...globals.jquery,
      },
    },
  },
  {
    files: ['testclient.js', 'test/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        expect: 'readonly',
        sinon: 'readonly',
        ...globals.browser,
        ...globals.jquery,
        ...globals.mocha,
      },
    },
  },
  {
    files: ['scripts/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['scripts/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
]
