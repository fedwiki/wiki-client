import globals from 'globals'
import pluginJs from '@eslint/js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: ['test/*.js'],
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
    files: ['test/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        expect: 'readonly',
        ...globals.browser,
        ...globals.jquery,
        ...globals.mocha,
      },
    },
  },
]
