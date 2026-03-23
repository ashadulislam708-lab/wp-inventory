import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: 'test/.*\\.e2e-spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        // Strip .js extensions from ALL imports (relative + alias) before resolution
        // This must come first so it applies universally
        '^(\\.{1,2}/.*)\\.js$': '$1',
        // Path aliases — with .js extension stripping
        '^@config/(.*)\\.js$': '<rootDir>/src/config/$1',
        '^@core/(.*)\\.js$': '<rootDir>/src/core/$1',
        '^@database/(.*)\\.js$': '<rootDir>/src/database/$1',
        '^@infrastructure/(.*)\\.js$': '<rootDir>/src/infrastructure/$1',
        '^@modules/(.*)\\.js$': '<rootDir>/src/modules/$1',
        '^@shared/(.*)\\.js$': '<rootDir>/src/shared/$1',
        // Path aliases — without .js extension (fallback)
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@database/(.*)$': '<rootDir>/src/database/$1',
        '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    modulePaths: ['<rootDir>'],
};

export default config;
