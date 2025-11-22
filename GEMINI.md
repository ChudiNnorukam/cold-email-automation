# GEMINI.md - Personal CRM Project Rules

This document establishes the immutable laws for the "Cold Email Automation" (Personal CRM) project. These rules are designed to prevent "false positives" and ensure a robust, production-ready application.

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

---
*This file is the source of truth for project standards. Update it as new lessons are learned.*
