import { defineConfig } from 'tsup'

import pkg from './package.json' with { type: 'json' }

// https://tsup.egoist.dev
export default defineConfig({
	entry: {
		[pkg.name]: 'src/index.ts',
	},
	format: 'esm',
	dts: true,
	clean: true,
	minify: true,
})
