import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_API_URL': JSON.stringify('http://localhost:3000'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: [
        'src/utils/*.ts',
        'src/redux/*.ts',
        'src/services/*.ts',
        'src/hooks/*.ts',
        'src/providers/*.tsx',
        'src/types/index.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/utils/firebase-admin.config.ts', // Usually untestable or configuration
        'src/services/api.ts' // Might need mocking
      ],
    },
  },
});
