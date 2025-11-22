import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadStatus } from '@prisma/client';
import { createLead } from '@/app/actions';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    default: {
        lead: {
            create: vi.fn(),
        },
    },
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    // Add any other exports from 'next/cache' that might be used and need mocking
    // For example, if you were using `revalidateTag`, you'd add:
    // revalidateTag: vi.fn(),
}));

describe('Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createLead', () => {
        it('should create a lead when valid data is provided', async () => {
            const formData = new FormData();
            formData.append('name', 'John Doe');
            formData.append('email', 'john@example.com');
            formData.append('company', 'Acme Inc');

            await createLead(formData);

            expect(prisma.lead.create).toHaveBeenCalledWith({
                data: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    company: 'Acme Inc',
                    notes: undefined,
                    status: LeadStatus.NEW,
                },
            });
        });

        it('should return validation error when email is invalid', async () => {
            const formData = new FormData();
            formData.append('name', 'John Doe');
            formData.append('email', 'not-an-email');
            formData.append('company', 'Acme Inc');

            const result = await createLead(formData);

            expect(result).toEqual({ error: 'Validation failed' });
            expect(prisma.lead.create).not.toHaveBeenCalled();
        });

        it('should return validation error when required fields are missing', async () => {
            const formData = new FormData();
            // Missing name and company
            formData.append('email', 'john@example.com');

            const result = await createLead(formData);

            expect(result).toEqual({ error: 'Validation failed' });
            expect(prisma.lead.create).not.toHaveBeenCalled();
        });
    });
});
