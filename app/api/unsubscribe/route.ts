import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('leadId');

  if (!leadId) {
    return new Response(
      '<html><body><h1>Invalid Request</h1><p>Missing lead ID.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 400 }
    );
  }

  try {
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
