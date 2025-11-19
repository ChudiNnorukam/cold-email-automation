# System Design Proposal: Bug Fixes & Stability Improvements

## 1. Executive Summary
This proposal addresses two critical issues identified during the codebase audit:
1.  **Email Content Corruption**: The current XSS protection incorrectly escapes HTML entities in plain text emails, causing recipients to see artifacts like `&amp;` instead of `&`.
2.  **Uncaught Database Errors**: Server actions lack exception handling, leading to potential application crashes during database outages or constraint violations.

## 2. Problem Statement
-   **Email Rendering**: The `renderTemplate` function applies `escapeHtml` to all content. Since the system currently sends `text/plain` emails, this "safety" feature actually corrupts the user's message.
-   **Error Handling**: Functions in `app/actions.ts` (e.g., `createLead`) execute Prisma commands directly. If `prisma.lead.create` throws (e.g., unique constraint violation), the Next.js server action fails with an unhandled error, providing poor UX.

## 3. Proposed Solution

### 3.1 Email Rendering Logic
-   **Strategy**: Disable HTML escaping for the current plain-text implementation.
-   **Rationale**: XSS is a vulnerability for *HTML* contexts (browsers, HTML emails). It is not a vulnerability for plain text. If we later add HTML email support, we will re-introduce escaping *only* for the HTML body part.
-   **Changes**:
    -   Modify `lib/email.ts`: Remove `escapeHtml` usage in `renderTemplate`.
    -   Update `__tests__/email.test.ts`: Assert that special characters remain unchanged.

### 3.2 Server Action Error Handling
-   **Strategy**: Wrap all database interactions in `try/catch` blocks.
-   **Pattern**:
    ```typescript
    try {
      // db operation
      return { success: true, data: ... }
    } catch (error) {
      console.error("Action failed:", error);
      return { error: "Human readable error message" };
    }
    ```
-   **Changes**:
    -   Update `app/actions.ts`: Apply this pattern to `createLead`, `updateLeadStatus`, `deleteLead`, `createTemplate`, `createSmtpConfig`, `createCampaign`.

## 4. Security Implications
-   **XSS**: Removing escaping for plain text is safe because plain text is not executable by email clients.
-   **Data Leakage**: The `catch` blocks must ensure we do not leak raw database errors (which might contain table names or partial data) to the client. We will log the raw error server-side and return a generic message to the client.

## 5. Verification Plan
-   **Unit Tests**: Run `vitest` to verify `renderTemplate` behavior and `actions` error handling (if testable via unit tests).
-   **Manual Verification**: Review code changes to ensure all DB calls are covered.
