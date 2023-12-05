/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
	test: {
		environment: 'jsdom',
		coverage: {
			enabled: true,
			include: ['src'],
		},
		reporters: 'verbose',
	},
})
