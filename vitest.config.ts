import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [...configDefaults.include],
    exclude: [...configDefaults.exclude],
    reporters: ['verbose', 'html'],
    outputFile: {
      html: "./test/results/unit-tests/index.html"
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    }
  },
})