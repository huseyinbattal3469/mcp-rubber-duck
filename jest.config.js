/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2022',
        moduleResolution: 'node',
        isolatedModules: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|strip-ansi|ansi-regex)/)'
  ],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
};