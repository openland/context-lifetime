import {Context, createContextNamespace} from '@openland/context';
import {ContextAlreadyCancelledError, DoubleContextCancellationError} from "./errors";

interface ContextLifetimeManager {
    stop(): void;
    onStop(cb: () => void): void;
    isCancelled: boolean;
}

const NoopLifetimeManager = {
    stop() {
        // noop
    },
    onStop() {
        // noop
    },
    get isCancelled() {
        return false;
    }
};

class LifetimeManager {
    private listeners: (() => void)[] = [];
    private cancelled = false;

    stop() {
        if (!this.cancelled) {
            this.cancelled = true;
            for (let listener of [...this.listeners]) {
                listener();
            }
            this.listeners = [];
        } else {
            throw new DoubleContextCancellationError();
        }
    }

    onStop(cb: () => void) {
        if (this.cancelled) {
            throw new ContextAlreadyCancelledError();
        }
        this.listeners.push(cb);
    }

    get isCancelled() {
        return this.cancelled;
    }
}

export const LifetimeContext = createContextNamespace<ContextLifetimeManager>('lifetime-context', NoopLifetimeManager);

/**
 * Add lifetime to context
 * @param ctx
 */
export function withLifetime(ctx: Context) {
    if (LifetimeContext.get(ctx) !== NoopLifetimeManager) {
        return ctx;
    }
    return LifetimeContext.set(ctx, new LifetimeManager());
}

/**
 * Allows to subscribe to context cancellation
 * @param ctx
 * @param cb
 */
export function onContextCancel(ctx: Context, cb: () => void) {
    LifetimeContext.get(ctx).onStop(cb);
}

/**
 * Cancels context
 * @param ctx
 */
export function cancelContext(ctx: Context) {
    LifetimeContext.get(ctx).stop();
}

/**
 * Returns context cancellation status
 * @param ctx
 */
export function isContextCancelled(ctx: Context) {
    return LifetimeContext.get(ctx).isCancelled;
}