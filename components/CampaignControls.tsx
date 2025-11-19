'use client';

import { Button } from '@/components/ui/button';
import { updateCampaignStatus } from '@/app/actions';
import { useState } from 'react';

interface CampaignControlsProps {
  campaignId: string;
  status: string;
}

export default function CampaignControls({ campaignId, status }: CampaignControlsProps) {
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (
      newStatus === 'ACTIVE' &&
      !confirm('Start this campaign? Emails will begin sending automatically.')
    ) {
      return;
    }

    if (newStatus === 'PAUSED' && !confirm('Pause this campaign?')) {
      return;
    }

    setLoading(true);
    await updateCampaignStatus(campaignId, newStatus);
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      {status === 'DRAFT' && (
        <Button onClick={() => handleStatusChange('ACTIVE')} disabled={loading}>
          {loading ? 'Starting...' : 'Start Campaign'}
        </Button>
      )}

      {status === 'ACTIVE' && (
        <Button onClick={() => handleStatusChange('PAUSED')} variant="outline" disabled={loading}>
          {loading ? 'Pausing...' : 'Pause Campaign'}
        </Button>
      )}

      {status === 'PAUSED' && (
        <Button onClick={() => handleStatusChange('ACTIVE')} disabled={loading}>
          {loading ? 'Resuming...' : 'Resume Campaign'}
        </Button>
      )}

      {status === 'COMPLETED' && (
        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
          ✓ Completed
        </div>
      )}
    </div>
  );
}
