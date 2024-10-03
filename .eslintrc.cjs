module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    "plugin:dusk/recommended",
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/node.d.ts', 'src/declarations.d.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    //'no-this-before-super': ["off"],
    // "@typescript-eslint/no-this-alias": [
    //   "off"
    // ],
    // "@typescript-eslint/ban-types": [
    //   "off"
    // ],
    // "@typescript-eslint/no-explicit-any": [
    //   "off"
    // ],
    // "no-restricted-syntax": [
    //   "off"
    // ]
  },
}
