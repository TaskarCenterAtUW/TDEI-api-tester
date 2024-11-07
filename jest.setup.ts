import * as matchers from 'jest-extended';

expect.extend(matchers);
expect.extend({
    toBeNullOrString(received) {
        const pass = received === undefined || received === null || typeof received === 'string';
        if (pass) {
            return {
                message: () => `expected ${received} not to be absent, null, or a string`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be absent, null, or a string`,
                pass: false,
            };
        }
    },
});

expect.extend({
    toBeAbsentOrNullOrString(received) {
        const pass = received === undefined || received === null || typeof received === 'string';
        if (pass) {
            return {
                message: () => `expected ${received} not to be absent, null, or a string`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be absent, null, or a string`,
                pass: false,
            };
        }
    },
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, you can fail the test if there's an unhandled rejection
    throw reason;
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown', error);
    process.exit(1);
});