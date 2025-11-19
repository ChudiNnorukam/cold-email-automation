import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'node', // Use 'node' for server-side tests, 'jsdom' for React components
        globals: true,
        setupFiles: ['./test/setup.ts'],
        alias: {
            '@': path.resolve(__dirname, './')
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                '.next/',
                'vitest.config.ts',
                '**/*.d.ts',
                'e2e/',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './')
        },
    },
})
