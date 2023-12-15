/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
	test: {
		environment: 'jsdom',
		coverage: {
			include: ['src'],
		},
		reporters: 'verbose',
	},
})
