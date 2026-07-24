/** @type {import('prettier').Config} */
module.exports = {
  printWidth: 120,
  endOfLine: 'auto',
  singleQuote: true,
  useTabs: false,
  tabWidth: 2,
  semi: true,
  bracketSpacing: true,
  trailingComma: 'es5',

  // organize-imports sorts imports AND removes unused ones (on save, on commit, on `npm run format`).
  // Per-file escape hatch if you ever need it: a `// organize-imports-ignore` comment.
  plugins: ['prettier-plugin-organize-attributes', 'prettier-plugin-organize-imports'],

  attributeGroups: [
    '^#',
    '$ANGULAR_STRUCTURAL_DIRECTIVE',
    '^(id|name)$',
    '^class$',
    '\\[ng',
    '$DEFAULT',
    '^aria-',
    '$ANGULAR_TWO_WAY_BINDING',
    '$ANGULAR_INPUT',
    '$ANGULAR_OUTPUT',
  ],
  attributeSort: 'ASC',

  overrides: [
    {
      // Angular v20+ names templates `app.html`, not `app.component.html`, and Prettier
      // only auto-selects its Angular parser for `*.component.html`. Without this override
      // templates are parsed as plain HTML and Angular syntax is mangled.
      files: '*.html',
      options: { parser: 'angular' },
    },
  ],
};
