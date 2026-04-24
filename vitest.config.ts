import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ['./setup.ts']
    },
    resolve: {
        alias: {
            'graphql': resolve(__dirname, './node_modules/graphql/index.js'),
        },
    },
})