import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/utils/*.ts',
        'src/redux/*.ts',
        'src/services/*.ts',
        'src/hooks/*.ts',
        'src/components/DocumentUploader.tsx',
        'src/components/FormattedNumberInput.tsx',
        'src/components/ImageUploader.tsx',
        'src/components/InfoAlert.tsx',
        'src/components/OptimizedImage.tsx',
        'src/components/Dashboard/CustomersList.tsx',
        'src/components/Dashboard/components/PeriodSelector.tsx',
        'src/components/Dashboard/components/ProductMetrics.tsx',
        'src/components/Dashboard/components/SalesMetrics.tsx',
        'src/app/robots.ts',
        'src/app/sitemap.ts',
        'src/app/about/page.tsx',
        'src/app/\\[storeId\\]/customers/page.tsx',
        'src/app/\\[storeId\\]/customers/hooks/useCustomers.ts',
        'src/app/providers/AuthProvider.tsx',
        'src/app/providers/ReduxProvider.tsx',
        'src/app/providers/index.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, './src'),
    },
  },
});
