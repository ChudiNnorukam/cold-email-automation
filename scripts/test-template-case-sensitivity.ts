
import { renderTemplate } from '../lib/email';

const lead = {
    id: 'test-id',
    name: 'John Doe',
    company: 'Acme Corp',
    email: 'john@acme.com'
};

const testCases = [
    {
        name: "Standard (Existing)",
        template: "Hi {{Name}}, {{Company}}",
        expected: "Hi John Doe, Acme"
    },
    {
        name: "Lowercase",
        template: "Hi {{name}}, {{company}}",
        expected: "Hi John Doe, Acme"
    },
    {
        name: "Uppercase",
        template: "Hi {{NAME}}, {{COMPANY}}",
        expected: "Hi John Doe, Acme"
    },
    {
        name: "Mixed",
        template: "Hi {{Name}}, {{company}}",
        expected: "Hi John Doe, Acme"
    },
    {
        name: "Email Variable",
        template: "Email: {{email}} / {{Email}}",
        expected: "Email: john@acme.com / john@acme.com"
    }
];

console.log("🧪 Testing Template Case Sensitivity...\n");

let failed = 0;

testCases.forEach(test => {
    const result = renderTemplate(test.template, lead);
    if (result === test.expected) {
        console.log(`✅ ${test.name}: PASS`);
    } else {
        console.log(`❌ ${test.name}: FAIL`);
        console.log(`   Template: "${test.template}"`);
        console.log(`   Expected: "${test.expected}"`);
        console.log(`   Actual:   "${result}"`);
        failed++;
    }
});

if (failed === 0) {
    console.log("\n✨ All tests passed!");
} else {
    console.log(`\n⚠️  ${failed} tests failed.`);
    process.exit(1);
}
