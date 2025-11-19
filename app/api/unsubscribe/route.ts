import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// UUID validation regex (standard v4 format)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('leadId');

  // Validate leadId format before database query
  if (!leadId || !UUID_REGEX.test(leadId)) {
    return new Response(
      '<html><body><h1>Invalid Request</h1><p>Invalid or missing lead ID.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 400 }
    );
  }

  try {
    // Check if lead exists before updating
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return new Response(
        '<html><body><h1>Not Found</h1><p>This unsubscribe link is invalid or expired.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' }, status: 404 }
      );
    }

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'NOT_INTERESTED' },
    });

    return new Response(
      `<html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 100px auto;
              padding: 20px;
              text-align: center;
            }
            h1 { color: #059669; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>✓ Unsubscribed Successfully</h1>
          <p>You have been removed from our outreach list and will not receive any further emails.</p>
          <p style="margin-top: 40px; font-size: 14px;">
            If this was a mistake, please contact us directly.
          </p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    return new Response(
      '<html><body><h1>Error</h1><p>Failed to unsubscribe. Please try again.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
}
