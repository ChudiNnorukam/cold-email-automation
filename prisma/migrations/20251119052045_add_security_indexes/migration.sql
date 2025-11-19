-- CreateIndex
CREATE INDEX "CampaignLead_scheduledFor_idx" ON "CampaignLead"("scheduledFor");

-- CreateIndex
CREATE INDEX "CampaignLead_sentAt_idx" ON "CampaignLead"("sentAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
