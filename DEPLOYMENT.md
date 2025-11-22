# Deployment Guide: Automated Cold Email System

To run the system daily without your local machine, you need to deploy it to **Vercel**.

## 1. Prerequisites
- A [Vercel Account](https://vercel.com/).
- A [GitHub Account](https://github.com/).
- This project pushed to a GitHub repository.

## 2. Deploy to Vercel
1.  Go to your Vercel Dashboard.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Configure Project:**
    *   **Framework Preset:** Next.js (Default)
    *   **Root Directory:** `./` (Default)

## 3. Environment Variables (Critical)
Before clicking "Deploy", expand the **"Environment Variables"** section and add the following keys from your local `.env` file:

| Key | Value (Copy from your local .env) |
| :--- | :--- |
| `DATABASE_URL` | *Your Postgres Connection String* |
| `GOOGLE_PLACES_API` | *Your Google API Key* |
| `HUNTER_API_KEY` | *Your Hunter.io API Key* |
| `CRON_SECRET` | `DWT+i7+AGDndGy1kjWwI4KoNVtyvVLpYh80qK5Do410=` |
| `SMTP_HOST` | *Your SMTP Host* |
| `SMTP_PORT` | *Your SMTP Port* |
| `SMTP_USER` | *Your SMTP User* |
| `SMTP_PASSWORD` | *Your SMTP Password* |
| `SMTP_FROM` | *Your From Email* |

> **Note:** You can also copy-paste your entire `.env` file content if Vercel offers a "Paste .env" option.

## 4. Cron Job Verification
Once deployed, Vercel will automatically detect the `vercel.json` file.
*   **Schedule:** It is configured to run **Daily** at 9am PST (17:00 UTC).
*   **Note:** On Vercel Hobby plan, you are limited to 1 cron job per day. For hourly sending, you would need to upgrade to Pro. For now, this will send a batch once a day.

## 5. Verify It's Working
1.  Go to your Vercel Project Dashboard.
2.  Click on the **"Settings"** tab -> **"Cron Jobs"**.
3.  You should see `/api/cron/master` listed with the schedule `0 16-23,0,1 * * *`.
4.  You can manually trigger it from there to test.

## 6. "Set and Forget"
Once deployed:
1.  The **Master Cron** runs hourly.
2.  It calls `findNewLeads` (if you have auto-sourcing enabled) and `processEmailQueue`.
3.  It checks your database for any `QUEUED` emails and sends them.
4.  You can monitor progress by checking your database or the Vercel logs.
