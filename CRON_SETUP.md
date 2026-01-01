# External Cron Setup Guide (cron-job.org)

Since Vercel Hobby has limits, we will use **cron-job.org** to trigger your email system reliably.

## 1. Create a Job
1.  Log in to [cron-job.org](https://cron-job.org/).
2.  Click **"Create Cronjob"**.

## 2. Job Details (Copy Exact Values)
*   **Title:** `Cold Email Master`
*   **URL:** `https://cold-email-tool-chudi-nnorukams-projects.vercel.app/api/cron/master`
*   **Execution Schedule:** `User-defined`
    *   **Days:** Select All (Mon-Sun)
    *   **Hours:** Select `09` to `17` (9am to 5pm)
    *   **Minutes:** Select `00` (Top of the hour)
    *   *Result: Runs hourly from 9am to 5pm.*

## 3. Advanced Settings (Critical)
You **MUST** set the Authorization header, or the job will fail.

1.  Expand **"Advanced"** or **"Headers"**.
2.  Add a Header:
    *   **Key:** `Authorization`
    *   **Value:** `Bearer DWT+i7+AGDndGy1kjWwI4KoNVtyvVLpYh80qK5Do410=`

## 4. Save & Test
1.  Click **"Create"**.
2.  Once created, click the **"Run Now"** (Play button) to test it.
3.  Check the "History" tab. It should show `200 OK`.

## 5. Cleanup (Optional)
Now that you have this, you can delete the Cron Job in your Vercel Dashboard to free up that slot for other projects!
