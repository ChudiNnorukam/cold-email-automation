import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import CreateCampaignDialog from '@/components/CreateCampaignDialog';
import { deleteCampaign } from '@/app/actions';
import Link from 'next/link';

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      _count: {
        select: { leads: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const smtpConfigured = (await prisma.smtpConfig.count()) > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <CreateCampaignDialog />
      </div>

      {!smtpConfigured && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            ⚠️ Please{' '}
            <Link href="/settings" className="underline font-semibold">
              configure SMTP settings
            </Link>{' '}
            before creating campaigns.
          </p>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No campaigns yet. Create your first campaign to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <h2 className="text-xl font-semibold hover:text-blue-600">
                      {campaign.name}
                    </h2>
                  </Link>
                  <div className="mt-2 flex gap-4 text-sm text-gray-600">
                    <span>{campaign._count.leads} leads</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        campaign.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'PAUSED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : campaign.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      await deleteCampaign(campaign.id);
                    }}
                  >
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
