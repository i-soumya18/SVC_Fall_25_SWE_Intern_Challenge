import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'frontend',
    environment: 'jsdom',
    globals: true,
    include: ['client/**/*.spec.ts'],
    setupFiles: ['./tests/setup-frontend.ts'], // Create if needed
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/frontend',
      all: true,
      include: ['client/lib/**/*.{ts,tsx}'],
      exclude: [
        'client/**/*.test.{ts,tsx}',
        'client/**/*.spec.{ts,tsx}',
        'client/**/*.d.ts',
        'client/lib/supabase.ts',
        'client/**/*.stories.{ts,tsx}',
        'client/**/index.ts',
        'client/components/**/*',
        'client/pages/**/*',
        'client/hooks/**/*',
        'client/App.tsx',
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});