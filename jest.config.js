export default {
  testEnvironment: 'node',
  verbose: true,
  roots: ['<rootDir>/tests'],
  // O projeto já é ESM (type: module); não precisamos de transform aqui.

  // Coverage configuration
  collectCoverage: false, // Enabled via CLI flag when needed
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude entry point
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
