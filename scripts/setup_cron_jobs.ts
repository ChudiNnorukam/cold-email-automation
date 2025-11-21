import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_URL = 'https://api.cron-job.org';
const APP_URL = 'https://cold-email-tool-invi1qm15-chudi-nnorukams-projects.vercel.app';

// Job Definitions
const JOBS = [
    {
        title: 'Cold Email Sender',
        url: `${APP_URL}/api/cron/send-emails`,
        schedule: {
            hours: [9], // 9 AM
            minutes: [0],
            mdays: [-1], // Every day
            months: [-1], // Every month
            wdays: [-1], // Every weekday
            timezone: 'America/Los_Angeles'
        }
    },
    {
        title: 'Cold Email Lead Finder',
        url: `${APP_URL}/api/cron/find-leads`,
        schedule: {
            hours: [6], // 6 AM
            minutes: [0],
            mdays: [-1],
            months: [-1],
            wdays: [-1],
            timezone: 'America/Los_Angeles'
        }
    }
];

async function createJob(apiKey: string, job: any) {
    try {
        const response = await fetch(`${API_URL}/jobs`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job: {
                    url: job.url,
                    enabled: true,
                    saveResponses: true,
                    schedule: job.schedule,
                    title: job.title
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Created job: ${job.title} (ID: ${data.jobId})`);
        } else {
            console.error(`❌ Failed to create ${job.title}:`, data);
        }
    } catch (error) {
        console.error(`❌ Error creating ${job.title}:`, error);
    }
}

rl.question('🔑 Please enter your cron-job.org API Key (Settings -> API): ', async (apiKey) => {
    if (!apiKey) {
        console.error('API Key is required.');
        process.exit(1);
    }

    console.log('\n🚀 Setting up cron jobs for Los Angeles time...\n');

    for (const job of JOBS) {
        await createJob(apiKey.trim(), job);
    }

    console.log('\n✨ Done! Check your dashboard at https://console.cron-job.org/jobs');
    rl.close();
});
