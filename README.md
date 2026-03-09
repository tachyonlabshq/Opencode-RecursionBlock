# Opencode Recursion Blocker 🛡️

A lightweight plugin for Opencode designed to prevent infinite loops caused by subagents continuously calling each other or themselves indefinitely. It tracks tool call execution stacks and automatically halts agent chains that exceed a configured maximum depth or exhibit cyclical patterns.

## Features

- **Max Depth Limitations:** Fail-safe halts when agent chains exceed logical thresholds.
- **Cycle Detection:** Automatically detects when the same agent is called recursively with identical task signatures within an execution chain.
- **Universal Support:** Works in Node.js, Bun, and Deno environments.

## Installation

You can install this plugin via your preferred package manager:

```bash
# Using npm
npm install opencode-recursionblock

# Using bun
bun add opencode-recursionblock
```

## Usage Example

Inject this plugin into your Opencode initialization. By default, the blocker prevents calls exceeding a depth of `10` or directly cyclical.

```typescript
import { createRecursionBlockerPlugin } from 'opencode-recursionblock';

// Add to your Opencode runner
const recursionBlocker = createRecursionBlockerPlugin({
  maxDepth: 5,        // Set your custom depth limit (default: 10)
  throwOnError: true  // Throws a RecursionLimitExceededError instead of gracefully ignoring
});

// Example hook binding for generic subagent frameworks:
// opencodeInstance.use(recursionBlocker);
```

## Security

Dependencies are strictly limited to testing and build tools. Ensure your downstream platform catches thrown `RecursionLimitExceededError` if `throwOnError` is enabled, otherwise set `throwOnError: false` to silently prevent cyclical tool executions.

## License

ISC License
