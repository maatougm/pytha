module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.e2e-spec.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/test/setup.e2e.ts'],
    transformIgnorePatterns: [
        // Don't transform node_modules except specific ESM packages
        '/node_modules/(?!(uuid)/)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Mock jsdom and related modules for E2E tests
        '^jsdom$': '<rootDir>/test/__mocks__/jsdom.mock.ts',
    },
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json',
        },
    },
};
