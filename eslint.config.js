// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', 'out-tsc/**', '.angular/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ps',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'ps',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },

  prettierRecommended,

  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
      curly: 'error',
      eqeqeq: 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      'max-len': ['error', { code: 120 }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      'max-len': ['error', { code: 120 }],
    },
  },
  {
    files: ['src/server.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);
