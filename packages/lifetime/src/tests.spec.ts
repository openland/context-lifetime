import {EmptyContext} from "@openland/context";
import {delay, delayBreakable, forever} from "./impl/time";
import {cancelContext, withLifetime} from "./impl/LifetimeContext";

describe('Lifetime', () => {
    it('should cancel breakable delay on context stop', async () => {
        let ctx = withLifetime(EmptyContext);
        setTimeout(() => cancelContext(ctx), 100);
        let {wait, cancel} = delayBreakable(ctx, 7777777);
        await wait;
    });

    it('should stop forever on context stop', async () => {
        let ctx = withLifetime(EmptyContext);
        setTimeout(() => cancelContext(ctx), 10);
        forever(ctx, async () => {
            await delay(100);
        });
    });

    it('should crash when running task on stopped context', async () => {
        let ctx = withLifetime(EmptyContext);
        cancelContext(ctx);
        expect(() => delayBreakable(ctx, 7777777)).toThrow('Context already cancelled');
    });
});