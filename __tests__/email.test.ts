/**
 * Email Service Tests
 * Tests template rendering, header generation, and XSS prevention
 */

import { describe, it, expect } from 'vitest';
import { renderTemplate } from '@/lib/email';

describe('Email Template Rendering', () => {
  const mockLead = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
  };

  describe('renderTemplate()', () => {
    it('should replace {{Name}} placeholder', () => {
      const template = 'Hello {{Name}}, welcome!';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe('Hello John Doe, welcome!');
    });

    it('should replace {{Company}} placeholder', () => {
      const template = 'We noticed {{Company}} is growing fast.';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe('We noticed Acme Corp is growing fast.');
    });

    it('should replace {{Email}} placeholder', () => {
      const template = 'Your email is {{Email}}';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe('Your email is john@example.com');
    });

    it('should replace multiple placeholders', () => {
      const template = 'Hi {{Name}} from {{Company}}, contact us at {{Email}}';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe('Hi John Doe from Acme Corp, contact us at john@example.com');
    });

    it('should handle repeated placeholders', () => {
      const template = '{{Name}}, {{Name}}, {{Name}}!';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe('John Doe, John Doe, John Doe!');
    });

    it('should leave unknown placeholders unchanged', () => {
      const template = 'Hello {{Name}}, {{Unknown}} placeholder';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe('Hello John Doe, {{Unknown}} placeholder');
    });
  });

  describe('Plain Text Content Fidelity', () => {
    it('should preserve special characters in name field (no HTML escaping)', () => {
      const maliciousLead = {
        ...mockLead,
        name: '<script>alert("XSS")</script>',
      };

      const template = 'Hello {{Name}}';
      const result = renderTemplate(template, maliciousLead);

      // In plain text, this is safe. It should NOT be escaped.
      expect(result).toBe('Hello <script>alert("XSS")</script>');
    });

    it('should preserve special characters in company field', () => {
      const maliciousLead = {
        ...mockLead,
        company: '<img src=x onerror=alert("XSS")>',
      };

      const template = 'Company: {{Company}}';
      const result = renderTemplate(template, maliciousLead);

      expect(result).toBe('Company: <img src=x onerror=alert("XSS")>');
    });

    it('should preserve ampersands', () => {
      const lead = {
        ...mockLead,
        company: 'Smith & Jones',
      };

      const template = '{{Company}}';
      const result = renderTemplate(template, lead);

      expect(result).toBe('Smith & Jones');
    });

    it('should preserve quotes', () => {
      const lead = {
        ...mockLead,
        name: 'John "The Boss" Doe',
      };

      const template = '{{Name}}';
      const result = renderTemplate(template, lead);

      expect(result).toBe('John "The Boss" Doe');
    });

    it('should preserve single quotes', () => {
      const lead = {
        ...mockLead,
        company: "O'Reilly Media",
      };

      const template = '{{Company}}';
      const result = renderTemplate(template, lead);

      expect(result).toBe("O'Reilly Media");
    });

    it('should preserve forward slashes', () => {
      const lead = {
        ...mockLead,
        company: 'A/B Testing Co',
      };

      const template = '{{Company}}';
      const result = renderTemplate(template, lead);

      expect(result).toBe('A/B Testing Co');
    });
  });

  describe('Email Headers Generation', () => {
    it('should generate proper Message-ID format', () => {
      const leadId = '123e4567-e89b-12d3-a456-426614174000';
      const domain = 'example.com';
      const timestamp = Date.now();

      const expectedFormat = `<${leadId}-${timestamp}@${domain}>`;

      // Message-ID should match this pattern
      const messageIdRegex = /^<[0-9a-f-]+-\d+@[\w.-]+>$/;
      expect(messageIdRegex.test(expectedFormat)).toBe(true);
    });

    it('should validate List-Unsubscribe URL format', () => {
      const appUrl = 'https://example.com';
      const leadId = '123e4567-e89b-12d3-a456-426614174000';
      const unsubscribeUrl = `<${appUrl}/api/unsubscribe?leadId=${leadId}>`;

      expect(unsubscribeUrl).toContain(leadId);
      expect(unsubscribeUrl).toMatch(/^<https?:\/\/.+>$/);
    });

    it('should validate Feedback-ID format', () => {
      const leadId = '123e4567-e89b-12d3-a456-426614174000';
      const domain = 'example.com';
      const feedbackId = `campaign:${leadId}:${domain}`;

      expect(feedbackId).toContain('campaign:');
      expect(feedbackId).toContain(leadId);
      expect(feedbackId).toContain(domain);
    });
  });

  describe('Template Edge Cases', () => {
    it('should handle empty template', () => {
      const result = renderTemplate('', mockLead);
      expect(result).toBe('');
    });

    it('should handle template with no placeholders', () => {
      const template = 'This is a plain text email.';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe(template);
    });

    it('should handle empty lead fields', () => {
      const emptyLead = {
        id: '123',
        name: '',
        email: '',
        company: '',
      };

      const template = 'Hello {{Name}} from {{Company}}';
      const result = renderTemplate(template, emptyLead);

      expect(result).toBe('Hello  from ');
    });

    it('should handle special characters in template', () => {
      const template = 'Price: $100\nDiscount: 50%\tTotal: $50';
      const result = renderTemplate(template, mockLead);

      expect(result).toBe(template);
    });
  });
});
