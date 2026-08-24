1. **Before every task/prompt:**
   * Read `.ai-context/PROJECT.md`
   * Read `.ai-context/CURRENT_STATE.md`
   * Inspect relevant source code before making assumptions.

2. **After EVERY user prompt/task:**
   * Complete the requested work first.
   * Re-check the actual changes made.
   * Update the contents of `.ai-context/PROJECT.md` and/or `.ai-context/CURRENT_STATE.md` wherever necessary.
   * Do this **even if the prompt only makes a small change**.
   * Never leave the context files describing an outdated state.

3. **After every meaningful change**, update:
   * Implemented features
   * Current state
   * Bugs/issues
   * Pending tasks
   * Architecture/configuration/decisions if affected

4. Repository source code is the ultimate source of truth.

5. Never invent files, APIs, features, dependencies, configuration, or architecture.

6. Preserve existing functionality and architecture unless explicitly asked to change them.

7. Do not ask the user to re-explain project context if it can be obtained from the repository/context files.

8. Keep the context concise but sufficiently detailed for a **new AI session to immediately understand where the project currently stands**.

### Critical Rule

**EVERY TIME I SEND A PROMPT:**

```text
READ CONTEXT
    ↓
UNDERSTAND CURRENT STATE
    ↓
DO THE REQUESTED WORK
    ↓
VERIFY CHANGES
    ↓
UPDATE .ai-context FILE CONTENTS
    ↓
READY FOR NEXT PROMPT
```
