module.exports = {
  env: {
    browser: true,
    es2021: true,
    'jest/globals': true
  },
  plugins: ['jest'],
  extends: ['standard-with-typescript', 'plugin:jest/recommended'],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['tsconfig.eslint.json']
  },
  rules: {
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  }
}
