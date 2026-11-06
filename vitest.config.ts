import { join } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'process.env.SKYGO_API_BASE_URL': JSON.stringify(
      'http://localhost:8080/api',
    ),
  },
  plugins: [
    {
      name: 'vitest-md-raw-loader',
      transform(code, id) {
        if (!id.endsWith('.md')) {
          return null;
        }
        return {
          code: `export default ${JSON.stringify(String(code))};`,
          map: null,
        };
      },
    },
  ],
  // Umi's package entry is a Node CLI; runtime exports are provided by Umi
  // and mocked by these browser tests, so do not prebundle the CLI.
  optimizeDeps: { exclude: ['@umijs/max'] },
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
      '@root': join(__dirname),
      '@@': join(__dirname, 'src', '.umi'),
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: process.env.PLAYWRIGHT_CHANNEL
          ? { channel: process.env.PLAYWRIGHT_CHANNEL }
          : {},
      }),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    globals: true,
    setupFiles: ['./tests/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.umi'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/.umi/**',
        'src/.umi-test/**',
        'src/.umi-production/**',
        'src/services/ant-design-pro/**',
        'src/**/*.d.ts',
        'src/**/index.style.ts',
      ],
    },
    passWithNoTests: true,
    testTimeout: 15000,
  },
});
