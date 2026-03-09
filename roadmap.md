# Roadmap: Opencode Recursion Blocker Plugin

## Phase 1: Planning and Setup
- [x] Create project structure and repository.
- [ ] Define the architecture for tracking agent call stacks and detecting recursion.

## Phase 2: Core Implementation
- [ ] Initialize standard NPM/Bun package setup (TypeScript).
- [ ] Implement cycle detection algorithm (e.g., checking if the same agent + task signature is called in the current stack).
- [ ] Implement depth limitation logic (fail-safe max depth).
- [ ] Expose the Opencode Plugin interface matching the standard `opencode` plugin shape.

## Phase 3: Testing and Debugging
- [ ] Set up testing framework (Jest or Vitest).
- [ ] Write failing test cases for infinite loops (Agent A -> Agent B -> Agent A).
- [ ] Make tests pass by ensuring the plugin throws an appropriate Error or halts execution.
- [ ] Validate cross-platform compatibility (Node.js & Bun environments).

## Phase 4: Polish and Documentation
- [ ] Add JSDoc / TSDoc comments for all exported interfaces.
- [ ] Create a thorough `README.md` with installation and usage instructions.

## Phase 5: Security and Release
- [ ] Run local security audits (e.g., `npm audit`).
- [ ] Initialize git repo.
- [ ] Commit and push to `tachyonlabshq/Opencode-RecursionBlock`.
