/**
 * Opencode Recursion Blocker Plugin
 * 
 * Prevents infinite loops caused by subagents continuously calling each other.
 */

export interface RecursionBlockerOptions {
    /** Maximum allowed depth of nested agent calls (default: 10) */
    maxDepth?: number;

    /** Whether to throw an error when recursion limit is exceeded instead of gracefully failing (default: true) */
    throwOnError?: boolean;
}

export interface AgentCallContext {
    agentId: string;
    taskSignature: string;
}

export class RecursionLimitExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RecursionLimitExceededError';
    }
}

/**
 * A recursion blocker instance designed to be registered as an Opencode plugin or hook.
 */
export class RecursionBlocker {
    private maxDepth: number;
    private throwOnError: boolean;

    // Track the call stack per thread/run ID. 
    // For simplicity in a local context without explicit threads, we use a single global stack,
    // but in a real Opencode environment, this might be keyed by a `runId`.
    private callStacks: Map<string, AgentCallContext[]> = new Map();

    constructor(options: RecursionBlockerOptions = {}) {
        this.maxDepth = options.maxDepth ?? 10;
        this.throwOnError = options.throwOnError ?? true;
    }

    /**
     * Called before a subagent is executed.
     * Checks if the call exceeds the maximum depth or forms a cycle.
     * 
     * @param threadId - A unique identifier for the current execution thread/chain.
     * @param agentId - The ID or name of the agent being called.
     * @param taskSignature - A hash or normalized string of the task being requested.
     */
    public onBeforeAgentCall(threadId: string, agentId: string, taskSignature: string): void | false {
        if (!this.callStacks.has(threadId)) {
            this.callStacks.set(threadId, []);
        }

        const stack = this.callStacks.get(threadId)!;

        // 1. Check max depth
        if (stack.length >= this.maxDepth) {
            if (this.throwOnError) {
                throw new RecursionLimitExceededError(`Recursion limit exceeded: Call depth reached ${this.maxDepth} for thread ${threadId}.`);
            }
            return false; // Signal to abort gracefully
        }

        // 2. Cycle Detection
        // Check if the exact same agent is being called with the exact same task signature in the current stack.
        const isCycle = stack.some(call => call.agentId === agentId && call.taskSignature === taskSignature);
        if (isCycle) {
            if (this.throwOnError) {
                throw new RecursionLimitExceededError(`Cycle detected: Agent '${agentId}' was already called with identical task signature in this execution chain.`);
            }
            return false; // Signal to abort gracefully
        }

        // Push to stack
        stack.push({ agentId, taskSignature });
    }

    /**
     * Called when a subagent finishes execution.
     * Pops the agent from the call stack.
     * 
     * @param threadId - A unique identifier for the current execution thread/chain.
     */
    public onAfterAgentCall(threadId: string): void {
        const stack = this.callStacks.get(threadId);
        if (stack && stack.length > 0) {
            stack.pop();
            if (stack.length === 0) {
                this.callStacks.delete(threadId);
            }
        }
    }

    /**
     * Clear all stacks (useful for testing or full resets)
     */
    public clearAll() {
        this.callStacks.clear();
    }
}

// Opencode Plugin shape export (assuming Opencode plugins define hooks)
// This is a generic factory for a generic hook system.
export function createRecursionBlockerPlugin(options?: RecursionBlockerOptions) {
    const blocker = new RecursionBlocker(options);

    return {
        name: 'recursion-blocker',
        hooks: {
            onBeforeSubagentCall: (context: { threadId: string; agentId: string; task: string }) => {
                // We use the raw task string as the signature for simplistic cycle detection
                blocker.onBeforeAgentCall(context.threadId, context.agentId, context.task);
            },
            onAfterSubagentCall: (context: { threadId: string; }) => {
                blocker.onAfterAgentCall(context.threadId);
            }
        }
    };
}
