export class DoubleContextCancellationError extends Error {
    constructor() {
        super('Double cancel of context!')
    }
}

export class ContextAlreadyCancelledError extends Error {
    constructor() {
        super('Context already cancelled')
    }
}