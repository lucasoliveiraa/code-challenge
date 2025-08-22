export default {
  testEnvironment: 'node',
  verbose: true,
  roots: ['<rootDir>/__tests__'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
