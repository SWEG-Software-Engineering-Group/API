import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    moduleDirectories: ['node_modules', 'src'],
    clearMocks: false,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",
    testEnvironment: "node",
    testMatch: [
        "**/*.test.ts"
    ],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    roots: [
        '<rootDir>/src'
    ],
    moduleNameMapper: {
        '@alias/(.*)': '<rootDir>/src/path/to/alias/$1'
    },
    preset: "@shelf/jest-dynamodb"
};

export default config;