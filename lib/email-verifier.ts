import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function verifyEmailDomain(email: string): Promise<boolean> {
    try {
        const domain = email.split('@')[1];
        if (!domain) return false;

        const addresses = await resolveMx(domain);
        return addresses && addresses.length > 0;
    } catch (error) {
        console.warn(`DNS verification failed for ${email}:`, error);
        return false;
    }
}

export function isRoleBasedEmail(email: string): boolean {
    const rolePrefixes = ['admin', 'support', 'info', 'sales', 'contact', 'help', 'webmaster', 'postmaster', 'hostmaster', 'abuse', 'noreply', 'no-reply'];
    const prefix = email.split('@')[0].toLowerCase();
    return rolePrefixes.includes(prefix);
}
