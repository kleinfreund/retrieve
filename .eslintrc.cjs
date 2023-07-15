/** @type {import('eslint').Linter.Config} */ const config = {
	root: true,
	parserOptions: {
		parser: '@typescript-eslint/parser',
		sourceType: 'module',
	},
	env: {
		browser: true,
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		// Necessary to use tabs for indentation.
		'no-tabs': ['error', { allowIndentationTabs: true }],
		indent: 'off',
		'@typescript-eslint/indent': ['error', 'tab'],

		'comma-dangle': ['error', 'always-multiline'],
		'@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
	},
}

/* eslint-env node */
module.exports = config
