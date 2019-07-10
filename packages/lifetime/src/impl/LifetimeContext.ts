import {Context, createContextNamespace} from '@openland/context';

interface ContextLifetimeManager {
    stop(): void;
    onStop(cb: () => void): void;
}

const NoopLifetimeManager = {
    stop() {
        // noop
    },
    onStop() {
        // noop
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
        } else {
            throw new Error('Double cancel of context!');
        }
    }

    onStop(cb: () => void) {
        if (this.cancelled) {
            throw new Error('Context already cancelled');
        }
        this.listeners.push(cb);
    }
}

export const LifetimeContext = createContextNamespace<ContextLifetimeManager>('lifetime-context', NoopLifetimeManager);

export function withLifetime(ctx: Context) {
    return LifetimeContext.set(ctx, new LifetimeManager());
}

export function onContextCancel(ctx: Context, cb: () => void) {
    LifetimeContext.get(ctx).onStop(cb);
}

export function cancelContext(ctx: Context) {
    LifetimeContext.get(ctx).stop();
}