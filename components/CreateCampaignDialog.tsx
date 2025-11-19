'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCampaign } from '@/app/actions';
import prisma from '@/lib/prisma';

export default function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch templates and leads
      fetch('/api/data/templates')
        .then((res) => res.json())
        .then((data) => setTemplates(data))
        .catch(() => {});

      fetch('/api/data/leads')
        .then((res) => res.json())
        .then((data) => setLeads(data))
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(formData: FormData) {
    formData.set('leadIds', JSON.stringify(selectedLeads));

    const result = await createCampaign(formData);

    if (result?.error) {
      alert(result.error);
    } else {
      setOpen(false);
      setSelectedLeads([]);
    }
  }

  function toggleLead(leadId: string) {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Campaign</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input type="text" id="name" name="name" placeholder="Q1 Outreach" required />
          </div>

          <div>
            <Label htmlFor="templateId">Email Template</Label>
            <select
              id="templateId"
              name="templateId"
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Select Leads ({selectedLeads.length} selected)</Label>
            <div className="border rounded max-h-60 overflow-y-auto p-2 space-y-2">
              {leads.length === 0 ? (
                <p className="text-sm text-gray-500">No leads available</p>
              ) : (
                leads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-gray-600">
                        {lead.email} · {lead.company}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-800">
              ℹ️ Campaign will send emails with 2-10 minute random delays between sends.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedLeads.length === 0}>
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
