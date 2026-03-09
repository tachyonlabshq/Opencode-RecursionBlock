import { describe, it, expect, beforeEach } from 'vitest';
import { RecursionBlocker, RecursionLimitExceededError, createRecursionBlockerPlugin } from '../src/index';

describe('RecursionBlocker', () => {
    let blocker: RecursionBlocker;
    const threadId = 'thread-1';

    beforeEach(() => {
        blocker = new RecursionBlocker({ maxDepth: 3 });
    });

    it('allows calls under max depth', () => {
        expect(() => blocker.onBeforeAgentCall(threadId, 'agentA', 'task1')).not.toThrow();
        expect(() => blocker.onBeforeAgentCall(threadId, 'agentB', 'task2')).not.toThrow();
        expect(() => blocker.onBeforeAgentCall(threadId, 'agentC', 'task3')).not.toThrow();
    });

    it('throws when max depth is exceeded', () => {
        blocker.onBeforeAgentCall(threadId, 'agentA', 'task1');
        blocker.onBeforeAgentCall(threadId, 'agentB', 'task2');
        blocker.onBeforeAgentCall(threadId, 'agentC', 'task3');

        expect(() => blocker.onBeforeAgentCall(threadId, 'agentD', 'task4'))
            .toThrowError(RecursionLimitExceededError);
    });

    it('pops stack correctly on completion', () => {
        blocker.onBeforeAgentCall(threadId, 'agentA', 'task1');
        blocker.onBeforeAgentCall(threadId, 'agentB', 'task2');
        blocker.onAfterAgentCall(threadId); // Pops agentB
        blocker.onBeforeAgentCall(threadId, 'agentC', 'task3');
        blocker.onBeforeAgentCall(threadId, 'agentD', 'task4'); // Stack is now A, C, D (len 3)

        expect(() => blocker.onBeforeAgentCall(threadId, 'agentE', 'task5'))
            .toThrowError(RecursionLimitExceededError);
    });

    it('detects cycles', () => {
        blocker.onBeforeAgentCall(threadId, 'agentA', 'task1');
        blocker.onBeforeAgentCall(threadId, 'agentB', 'task2');

        // Cycle! Exact same agent and task signature.
        expect(() => blocker.onBeforeAgentCall(threadId, 'agentA', 'task1'))
            .toThrowError(/Cycle detected/);
    });

    it('allows same agent if task signature is different', () => {
        blocker.onBeforeAgentCall(threadId, 'agentA', 'task1');
        blocker.onBeforeAgentCall(threadId, 'agentB', 'task2');
        // Not a cycle because the task is different
        expect(() => blocker.onBeforeAgentCall(threadId, 'agentA', 'task3')).not.toThrow();
    });

    it('returns false when throwOnError is false and limits are reached', () => {
        const gracefulBlocker = new RecursionBlocker({ maxDepth: 2, throwOnError: false });

        expect(gracefulBlocker.onBeforeAgentCall(threadId, 'agentA', 'task1')).toBeUndefined();
        expect(gracefulBlocker.onBeforeAgentCall(threadId, 'agentB', 'task2')).toBeUndefined();

        // Depth exceeded
        expect(gracefulBlocker.onBeforeAgentCall(threadId, 'agentC', 'task3')).toBe(false);
    });
});

describe('createRecursionBlockerPlugin', () => {
    it('creates a shape with hooks', () => {
        const plugin = createRecursionBlockerPlugin({ maxDepth: 2 });
        expect(plugin.name).toBe('recursion-blocker');
        expect(plugin.hooks.onBeforeSubagentCall).toBeTypeOf('function');
        expect(plugin.hooks.onAfterSubagentCall).toBeTypeOf('function');

        plugin.hooks.onBeforeSubagentCall({ threadId: 't1', agentId: 'a1', task: 'task1' });
        plugin.hooks.onBeforeSubagentCall({ threadId: 't1', agentId: 'a2', task: 'task2' });

        expect(() => plugin.hooks.onBeforeSubagentCall({ threadId: 't1', agentId: 'a3', task: 'task3' }))
            .toThrowError(RecursionLimitExceededError);
    });
});
