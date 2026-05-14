import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
	globalIgnores(['coverage/', 'dist/']),

	js.configs.recommended,
	tseslint.configs.strict,
	tseslint.configs.stylistic,

	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/semi': ['error', 'never'],
			'@stylistic/space-before-function-paren': ['error', 'always'],
			'@stylistic/quotes': ['error', 'single'],
		},
	},
)
