module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        '**/*.(t|j)s',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
    transformIgnorePatterns: [
        // Transform ES modules in these packages
        'node_modules/(?!(uuid|@nestjs|class-validator|class-transformer)/)',
    ],
    // Mock modules that cause issues in tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        'jsdom': '<rootDir>/../test/__mocks__/jsdom.mock.ts',
    },
};
