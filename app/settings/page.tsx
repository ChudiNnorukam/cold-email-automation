'use client';

import { useState, useEffect } from 'react';
import { createSmtpConfig, getSmtpConfig, testSmtpConnection } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const [testing, setTesting] = useState(false);
  const [provider, setProvider] = useState('gmail');
  const [existingConfig, setExistingConfig] = useState<any>(null);

  useEffect(() => {
    getSmtpConfig().then((config) => {
      if (config) {
        setExistingConfig(config);
        setProvider(config.provider);
      }
    });
  }, []);

  async function handleTest() {
    setTesting(true);
    const result = await testSmtpConnection();
    if (result.error) {
      alert(result.error);
    } else {
      alert('✓ Connection successful!');
    }
    setTesting(false);
  }

  async function handleSubmit(formData: FormData) {
    const result = await createSmtpConfig(formData);
    if (result?.error) {
      alert(result.error);
    } else {
      alert('✓ SMTP configuration saved!');
      const config = await getSmtpConfig();
      setExistingConfig(config);
    }
  }

  const isGmail = provider === 'gmail';
  const isOutlook = provider === 'outlook';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">SMTP Settings</h1>

      {existingConfig && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            ✓ SMTP configured: {existingConfig.fromEmail}
          </p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="provider">Provider</Label>
          <select
            id="provider"
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="gmail">Gmail / Google Workspace</option>
            <option value="outlook">Outlook / Microsoft 365</option>
            <option value="custom">Custom SMTP</option>
          </select>
        </div>

        {provider === 'custom' && (
          <>
            <div>
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                type="text"
                id="host"
                name="host"
                placeholder="smtp.example.com"
                defaultValue={existingConfig?.host || ''}
                required
              />
            </div>

            <div>
              <Label htmlFor="port">SMTP Port</Label>
              <Input
                type="number"
                id="port"
                name="port"
                placeholder="587"
                defaultValue={existingConfig?.port || ''}
                required
              />
            </div>
          </>
        )}

        <input type="hidden" name="host" value={isGmail ? 'smtp.gmail.com' : isOutlook ? 'smtp.office365.com' : ''} />
        <input type="hidden" name="port" value={isGmail || isOutlook ? '587' : ''} />
        <input type="hidden" name="secure" value="false" />

        <div>
          <Label htmlFor="user">Email Address</Label>
          <Input
            type="email"
            id="user"
            name="user"
            placeholder="your@email.com"
            defaultValue={existingConfig?.user || ''}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">
            {isGmail ? 'App Password' : isOutlook ? 'Password' : 'SMTP Password'}
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            placeholder={existingConfig ? '••••••••' : 'Enter password'}
            required={!existingConfig}
          />
          {isGmail && (
            <p className="text-xs text-gray-500 mt-1">
              Generate at: accounts.google.com → Security → 2-Step Verification → App Passwords
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="fromName">From Name</Label>
          <Input
            type="text"
            id="fromName"
            name="fromName"
            placeholder="Your Name"
            defaultValue={existingConfig?.fromName || ''}
            required
          />
        </div>

        <div>
          <Label htmlFor="fromEmail">From Email</Label>
          <Input
            type="email"
            id="fromEmail"
            name="fromEmail"
            placeholder="your@email.com"
            defaultValue={existingConfig?.fromEmail || ''}
            required
          />
        </div>

        <div>
          <Label htmlFor="dailyLimit">Daily Send Limit</Label>
          <Input
            type="number"
            id="dailyLimit"
            name="dailyLimit"
            placeholder="50"
            defaultValue={existingConfig?.dailyLimit || 50}
            min="1"
            max="500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 50 for Gmail, 100 for Google Workspace, 200 for Outlook
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Save Configuration</Button>
          {existingConfig && (
            <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          )}
        </div>
      </form>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Passwords are encrypted using AES-256-GCM before storage</li>
          <li>Configure SPF, DKIM, and DMARC DNS records for your domain</li>
          <li>Start with low daily limits and warm up your email gradually</li>
          <li>Gmail requires App Passwords with 2FA enabled</li>
        </ul>
      </div>

      {existingConfig && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">System Controls</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-4 border rounded bg-gray-50">
              <h3 className="font-semibold mb-2">Manual Trigger</h3>
              <p className="text-sm text-gray-600 mb-4">
                Run the email sending cron job immediately. Useful for testing.
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  if (confirm('Run email sending job now?')) {
                    const res = await fetch('/api/cron/trigger', {
                      method: 'POST',
                      body: JSON.stringify({ job: 'send-emails' })
                    });
                    const data = await res.json();
                    alert(JSON.stringify(data, null, 2));
                  }
                }}
              >
                Run Email Sender
              </Button>
            </div>

            <div className="p-4 border rounded bg-red-50 border-red-100">
              <h3 className="font-semibold mb-2 text-red-900">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-900">Kill Switch</p>
                  <p className="text-sm text-red-700">
                    Pause all email sending immediately.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {existingConfig.isSystemPaused ? 'PAUSED' : 'ACTIVE'}
                  </span>
                  <Button
                    variant={existingConfig.isSystemPaused ? "default" : "destructive"}
                    onClick={async () => {
                      const { toggleSystemPause } = await import('@/app/actions');
                      const newState = !existingConfig.isSystemPaused;
                      const result = await toggleSystemPause(newState);
                      if (result.success) {
                        setExistingConfig({ ...existingConfig, isSystemPaused: newState });
                      } else {
                        alert(result.error);
                      }
                    }}
                  >
                    {existingConfig.isSystemPaused ? 'Resume System' : 'PAUSE SYSTEM'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
