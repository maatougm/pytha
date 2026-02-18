// Mock JSDOM for tests
export class JSDOM {
    constructor(html?: string) {
        // Mock implementation
    }

    get window() {
        return {
            document: {
                createElement: jest.fn(),
                createTextNode: jest.fn(),
            },
        };
    }
}

export default { JSDOM };
