// Mock for jsdom in E2E tests
export class JSDOM {
    constructor(html: string = '') {
        // Mock implementation
    }

    get window() {
        return {
            document: {
                createElement: () => ({}),
                createTextNode: () => ({}),
            },
        };
    }
}

export default { JSDOM };
