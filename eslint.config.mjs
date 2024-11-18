import globals from 'globals'
import pluginJs from '@eslint/js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    languageOptions: {
      globals: {
        wiki: 'writable',
        ...globals.browser,
        ...globals.jquery,
        ...globals.mocha,
      },
    },
  },
]
