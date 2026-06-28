---
name: write tool guardrail
description: The write tool rejects writes to existing files not read in the current session.
---

The `write` tool enforces a read-before-write guardrail: if a file exists on disk but was not read via the `read` tool in the current session, the write is rejected with "Read it first before writing to it."

**Why:** Prevents accidental overwrites of files whose content was loaded from a previous session's memory/cache.

**How to apply:** 
- For new files: `write` works fine.
- For existing files you've read earlier in the session: `write` works fine.
- For existing files you haven't read yet (e.g. large rewrites): use `edit` with enough surrounding context to make the old_string unique, OR read the file first then write.
- Prefer `edit` over `write` for existing files — it's always safe and avoids this guardrail.
