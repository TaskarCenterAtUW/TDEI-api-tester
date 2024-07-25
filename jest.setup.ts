import * as matchers from 'jest-extended';

expect.extend(matchers);
expect.extend({
    toBeNullOrString(received) {
        if (received === null || typeof received === 'string') {
            return {
                message: () => `expected ${received} not to be null or a string`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be null or a string`,
                pass: false,
            };
        }
    },
});