import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Configuração do Vitest para testes unitários.
 *
 * Rodar testes: npx vitest run
 * Rodar testes em watch: npx vitest
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        exclude: ['node_modules', '.next'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
