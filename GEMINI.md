# GEMINI.md - Personal CRM Project Rules

This document is the **Immutable Constitution** for the "Cold Email Automation" project. It defines the laws, protocols, and best practices that every AI agent and developer MUST follow to ensure system integrity, reliability, and safety.

## 1. The "No False Positives" Protocol (Verification)
**Rule:** NEVER push code without local verification.
- **Action:** Before every `git push`, you MUST run:
  ```bash
  npm run build
  ```
  (or at minimum `tsc --noEmit` if only touching TS files).
- **Constraint:** "It looks right" is NOT a valid verification. If the compiler hasn't blessed it, it doesn't exist.

## 2. The "Schema Sync" Protocol (Database)
**Rule:** The Prisma Client must ALWAYS match the Schema.
- **Action:** After any change to `prisma/schema.prisma`:
  1. Run `npx prisma generate` immediately.
  2. If running `db push`, check for data loss warnings.
  3. Restart the TS server or check `node_modules/@prisma/client` if linter errors persist.
- **Constraint:** Do not ignore "Module has no exported member" errors. They are always real.

## 3. The "Enum Strictness" Protocol (Type Safety)
**Rule:** String literals are forbidden for Enum fields.
- **Action:** Always import and use the Prisma Enum.
  - **Bad:** `status: 'NEW'`
  - **Good:** `status: LeadStatus.NEW`
- **Reason:** This prevents silent failures when Enums are renamed or values are removed.

## 4. The "Script Integrity" Protocol (Maintenance)
**Rule:** Scripts are First-Class Citizens.
- **Action:** When refactoring core logic (like `LeadStatus`), you MUST audit `scripts/` and `__tests__/`.
- **Constraint:** A broken script is a broken build. Run `npx tsx scripts/my-script.ts` to verify fixes.

## 5. The "Personal CRM" Best Practices (Architecture)
- **Safety First:** The system handles personal reputation. Rate limits and "Kill Switches" are mandatory.
- **Data Ownership:** All data stays in the user's DB. No external dependencies for core logic.
- **Simplicity:** Prefer monolithic Next.js actions over complex microservices for this scale.

## 6. The "Scenario-Based" Rules (The 100 Laws)

### Database & Schema
- **Adding Models:** Run `npx prisma generate` immediately.
- **Renaming Fields:** Check for data loss warnings; update all code references.
- **Enum Changes:** Update all switch cases; verify with `tsc`.
- **Required Fields:** Provide default values or backfill scripts.
- **Deleting Models:** Verify no cascading delete issues.
- **Raw SQL:** Avoid if possible; wrap in transactions if necessary.
- **Seeding:** Use `prisma/seed.ts`; ensure idempotency.
- **Migrations:** Check `prisma/migrations` for drift on failure.
- **Connections:** Use `global.prisma` singleton pattern.
- **Performance:** Add `@@index` to frequently queried fields.

### TypeScript & Type Safety
- **No `any`:** Forbidden. Define interfaces or types.
- **Optional Chaining:** Use `?.` freely but handle `undefined`.
- **No Non-Null Assertions:** Avoid `!`; use type guards.
- **Return Types:** Explicitly define for exported functions.
- **Async Errors:** Wrap in `try/catch` or use wrappers.
- **Enums:** Prefer Enums over String Unions for DB fields.
- **Naming:** Interfaces use PascalCase (no `I` prefix).
- **Narrowing:** Use discriminated unions.
- **Generics:** Keep simple; don't over-engineer.
- **Libraries:** Install `@types/package` immediately.

### Testing & Verification
- **New Features:** Write a test case in `__tests__` first.
- **Bug Fixes:** Create a reproduction test case.
- **CI/CD:** Run `npm run build` locally before push.
- **Flaky Tests:** Investigate immediately; do not ignore.
- **Mocking:** Use factories or helper functions.
- **Integration:** Test critical paths (Signup -> Dashboard).
- **Snapshots:** Use sparingly; prefer explicit assertions.
- **Coverage:** Aim for high coverage on core logic.
- **Speed:** Mock external API calls.
- **Manual:** Document steps in `walkthrough.md`.

### Security & Auth
- **Secrets:** `.env` only; never commit secrets.
- **API Keys:** Validate presence at startup.
- **Passwords:** Never log user passwords.
- **SQL Injection:** Use ORM methods.
- **XSS:** Be careful with `dangerouslySetInnerHTML`.
- **CSRF:** Rely on Next.js built-in protection.
- **Rate Limiting:** Implement for all public APIs.
- **Authorization:** Check permissions on every server action.
- **Validation:** Use Zod for all inputs.
- **Dependencies:** Run `npm audit` regularly.

### Performance & Optimization
- **Bundle Size:** Use `next/dynamic` for large components.
- **Images:** Use `next/image` for optimization.
- **Memory:** Clean up event listeners in `useEffect`.
- **N+1:** Use `include` or `select` in Prisma.
- **Computation:** Move heavy tasks to background jobs.
- **Caching:** Use `unstable_cache` or React `cache`.
- **Latency:** Use edge functions if possible.
- **Rendering:** Memoize expensive components (`React.memo`).
- **Network:** Deduplicate requests.
- **Assets:** Serve static assets from CDN/public folder.

### Code Style & Convention
- **Files:** kebab-case.
- **Components:** PascalCase.
- **Variables:** camelCase; descriptive names.
- **Comments:** Explain "Why", not "What".
- **Functions:** Keep short (< 50 lines).
- **Components:** Break down large components.
- **Imports:** External -> Internal -> Relative.
- **Exports:** Named exports preferred.
- **DRY:** Extract duplicate logic to utils.
- **Magic Numbers:** Define as constants.
- **Dead Code:** Delete it; don't comment out.

### Error Handling & Logging
- **Uncaught:** Use global error boundaries.
- **API Errors:** Return standardized error responses.
- **Logs:** Use a logger (e.g., `pino`) in production.
- **Debug:** Use `console.debug` for dev-only logs.
- **User Errors:** Friendly messages, not stack traces.
- **Reporting:** Integrate Sentry (future).
- **Retries:** Implement exponential backoff.
- **Timeouts:** Set timeouts for fetch requests.
- **Validation:** Return field-specific error messages.
- **404:** Use custom 404 page.

### Deployment & DevOps
- **Env Vars:** Fail build fast if missing.
- **Build Failure:** Do not deploy.
- **Migrations:** Run as part of build/deploy pipeline.
- **Rollback:** Have a plan.
- **Staging:** Test here before Prod.
- **Cron:** Monitor execution status.
- **Limits:** Be aware of serverless limits.
- **Cold Starts:** Keep critical functions warm.
- **DNS:** Verify configuration.
- **SSL:** Enforce HTTPS.

### Workflow & Process
- **Start:** Check `task.md`.
- **Finish:** Update `task.md` and `walkthrough.md`.
- **Context:** Leave "breadcrumb" comments.
- **Stuck:** Ask for clarification.
- **Refactor:** Separate commit.
- **Review:** Self-review before user review.
- **Docs:** Update alongside code.
- **Deps:** Justify new dependencies.
- **Prune:** Remove unused dependencies.
- **Commits:** Conventional Commits (feat, fix, chore).

### Agent-Specific (The "Meta" Rules)
- **Hallucinations:** Verify API existence before use.
- **Files:** Double-check paths before modification.
- **User Code:** Read before writing (no overwrites).
- **Instructions:** Re-read prompt and `GEMINI.md`.
- **Completion:** Finish what you start.
- **Breaking Changes:** Warn the user; provide migration path.
- **Context:** Search for context first.
- **Environment:** Must work in CI/CD.
- **Time:** Use `task_boundary` effectively.
- **Assumptions:** Ask. Don't assume.

---
*This file is the source of truth for project standards. Update it as new lessons are learned.*
