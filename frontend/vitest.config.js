import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    css: false,
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/__tests__/**',
        'src/types/index.js',
        'src/pages/MaintenancePage.jsx',
        'src/hooks/useFocusTrap.js',
        'src/pages/CommissioningPage.jsx',
        'src/pages/DecommissionPage.jsx',
        'src/pages/DutyLogPage.jsx',
        'src/pages/ActivityReportPage.jsx',
        'src/pages/ProcurementPage.jsx',
        'src/pages/DocumentsPage.jsx',
        'src/pages/AnnualInventoryPage.jsx',
        'src/components/ui/calendar-sidebar.jsx',
        'src/schemas/deviceSchema.js',
        'src/pages/DeviceForm.jsx',
        'src/pages/MaintenanceCalendarPage.jsx',
        'src/pages/MaintenanceExecutionPage.jsx',
        'src/components/MppExecutionForm.jsx',
        'src/pages/MppExecutionForm.jsx',
        'src/pages/ConsumablesPage.jsx',
        'src/pages/RepairTicketsPage.jsx',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
