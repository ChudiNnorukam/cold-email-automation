import { renderTemplate } from '../lib/email';

const template = "Hi {{Name}}, I saw {{Company}} in [City]. Contact: {{Email}}";

const testCases = [
    {
        name: "Standard",
        lead: { id: '1', name: "John", company: "Acme Corp", email: "john@acme.com" },
        expected: "Hi John, I saw Acme Corp in your area. Contact: john@acme.com"
    },
    {
        name: "Unknown Name",
        lead: { id: '2', name: "Unknown", company: "Acme Corp", email: "info@acme.com" },
        expected: "Hi there, I saw Acme Corp in your area. Contact: info@acme.com"
    },
    {
        name: "Empty Name",
        lead: { id: '3', name: "", company: "Acme Corp", email: "info@acme.com" },
        expected: "Hi there, I saw Acme Corp in your area. Contact: info@acme.com"
    },
    {
        name: "Company Suffix (LLC)",
        lead: { id: '4', name: "Jane", company: "Tech Solutions LLC", email: "jane@tech.com" },
        expected: "Hi Jane, I saw Tech Solutions in your area. Contact: jane@tech.com"
    },
    {
        name: "Company Suffix (, Inc.)",
        lead: { id: '5', name: "Bob", company: "Global Industries, Inc.", email: "bob@global.com" },
        expected: "Hi Bob, I saw Global Industries in your area. Contact: bob@global.com"
    },
    {
        name: "Domain as Company",
        lead: { id: '6', name: "Alice", company: "coolstartup.io", email: "alice@coolstartup.io" },
        expected: "Hi Alice, I saw Coolstartup in your area. Contact: alice@coolstartup.io"
    },
    {
        name: "Complex Domain (www + hyphen)",
        lead: { id: '7', name: "Dave", company: "www.best-plumbers.com", email: "dave@bp.com" },
        expected: "Hi Dave, I saw Best Plumbers in your area. Contact: dave@bp.com"
    },
    {
        name: "Protocol + Domain",
        lead: { id: '8', name: "Eve", company: "https://secure-systems.net", email: "eve@ss.net" },
        expected: "Hi Eve, I saw Secure Systems in your area. Contact: eve@ss.net"
    }
];

console.log("🧪 Testing Edge Cases...\n");

let failed = 0;

testCases.forEach(test => {
    const result = renderTemplate(template, test.lead);
    if (result === test.expected) {
        console.log(`✅ ${test.name}: PASS`);
    } else {
        console.log(`❌ ${test.name}: FAIL`);
        console.log(`   Expected: "${test.expected}"`);
        console.log(`   Actual:   "${result}"`);
        failed++;
    }
});

if (failed === 0) {
    console.log("\n✨ All edge cases handled correctly!");
} else {
    console.log(`\n⚠️  ${failed} tests failed.`);
    process.exit(1);
}
