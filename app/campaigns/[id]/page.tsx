import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CampaignControls from '@/components/CampaignControls';
import Link from 'next/link';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      leads: {
        include: {
          lead: true,
        },
        orderBy: { sentAt: 'desc' },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const template = await prisma.template.findUnique({
    where: { id: campaign.templateId || undefined },
  });

  const stats = {
    total: campaign.leads.length,
    sent: campaign.leads.filter((l: { status: string }) => l.status === 'SENT').length,
    queued: campaign.leads.filter((l: { status: string }) => l.status === 'QUEUED').length,
    failed: campaign.leads.filter((l: { status: string }) => l.status === 'FAILED').length,
  };

  const progress = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/campaigns" className="text-blue-600 hover:underline text-sm">
          ← Back to Campaigns
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-gray-600 mt-1">
            Template: <span className="font-semibold">{template?.name}</span>
          </p>
        </div>
        <CampaignControls campaignId={campaign.id} status={campaign.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Sent</p>
          <p className="text-2xl font-bold text-green-700">{stats.sent}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Queued</p>
          <p className="text-2xl font-bold text-blue-700">{stats.queued}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Failed</p>
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Campaign Info */}
      <div className="mb-6 p-4 bg-gray-50 border rounded">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>{' '}
            <span className="font-semibold">{campaign.status}</span>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>{' '}
            <span className="font-semibold">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </span>
          </div>
          {campaign.startedAt && (
            <div>
              <span className="text-gray-600">Started:</span>{' '}
              <span className="font-semibold">
                {new Date(campaign.startedAt).toLocaleString()}
              </span>
            </div>
          )}
          {campaign.completedAt && (
            <div>
              <span className="text-gray-600">Completed:</span>{' '}
              <span className="font-semibold">
                {new Date(campaign.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Lead</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Sent At</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaign.leads.map((cl: any) => (
              <tr key={cl.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{cl.lead.name}</td>
                <td className="px-4 py-3 text-sm">{cl.lead.email}</td>
                <td className="px-4 py-3 text-sm">{cl.lead.company}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${cl.status === 'SENT'
                      ? 'bg-green-100 text-green-800'
                      : cl.status === 'QUEUED'
                        ? 'bg-blue-100 text-blue-800'
                        : cl.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {cl.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {cl.sentAt ? new Date(cl.sentAt).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-red-600">
                  {cl.errorMessage || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {campaign.status === 'ACTIVE' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            ℹ️ Campaign is active. Emails are being sent with 2-10 minute delays. Check back
            shortly for updates.
          </p>
        </div>
      )}
    </div>
  );
}
