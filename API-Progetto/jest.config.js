module.exports = {
    moduleDirectories: ['node_modules', 'src'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    }
};