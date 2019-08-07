import {createLogger} from "@openland/log";
import {Context, createNamedContext} from "@openland/context";
import {onContextCancel} from "./LifetimeContext";

const log = createLogger('backoff');
const unknownContext = createNamedContext('unknown');

/**
 * Basic async delay function
 * @param ms time to delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Delay which can be canceled from outer code
 * @param ctx
 * @param ms
 */
export function delayBreakable(ctx: Context, ms: number) {
    let timer = setTimeout(() => cancel(), ms);
    let resolver: (() => void) = () => {};
    let wait = new Promise(resolve => resolver = resolve);
    let cancel = () => {
        resolver();
        clearTimeout(timer);
    };
    onContextCancel(ctx, () => cancel());
    return {wait, cancel};
}

export function exponentialBackoffDelay(currentFailureCount: number, minDelay: number, maxDelay: number, maxFailureCount: number) {
    let maxDelayRet = minDelay + ((maxDelay - minDelay) / maxFailureCount) * currentFailureCount;
    return Math.random() * maxDelayRet;
}

/**
 * Backoff loop which can be canceled using cancelContext
 * @param ctx
 * @param callback
 */
export async function backoff<T>(ctx: Context, callback: () => Promise<T>): Promise<T> {
    let working = true;
    onContextCancel(ctx, () => working = false);

    let currentFailureCount = 0;
    const minDelay = 500;
    const maxDelay = 15000;
    const maxFailureCount = 50;
    while (working) {
        try {
            return await callback();
        } catch (e) {
            if (currentFailureCount > 3) {
                log.warn(unknownContext, e);
            }
            if (currentFailureCount < maxFailureCount) {
                currentFailureCount++;
            }

            let waitForRequest = exponentialBackoffDelay(currentFailureCount, minDelay, maxDelay, maxFailureCount);
            await delay(waitForRequest);
        }
    }
    throw new Error('Context was stopped');
}

/**
 * Forever loop which can be canceled using cancelContext
 * @param ctx
 * @param callback
 */
export function forever(ctx: Context, callback: () => Promise<void>) {
    let working = true;
    onContextCancel(ctx, () => working = false);
    // tslint:disable-next-line:no-floating-promises
    (async () => {
        while (working) {
            try {
                await backoff(ctx, callback);
            } catch (e) {
                working = false;
            }
        }
    })();
}