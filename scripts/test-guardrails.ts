import { renderTemplate } from '../lib/email';
import { isRoleBasedEmail } from '../lib/email-verifier';

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
    }
}

async function testGuardrails() {
    console.log("--- Testing Personalization Guardrails ---");

    // 1. Test Name Cleaning
    const tpl = "Hi {{Name}}, welcome to {{Company}}.";

    assert(renderTemplate(tpl, { id: '1', name: 'Office', email: 'e', company: 'C' }).includes("Hi there"), "Name 'Office' -> 'there'");
    assert(renderTemplate(tpl, { id: '1', name: 'Owner', email: 'e', company: 'C' }).includes("Hi there"), "Name 'Owner' -> 'there'");
    assert(renderTemplate(tpl, { id: '1', name: 'Support', email: 'e', company: 'C' }).includes("Hi there"), "Name 'Support' -> 'there'");
    assert(renderTemplate(tpl, { id: '1', name: 'Chudi', email: 'e', company: 'C' }).includes("Hi Chudi"), "Name 'Chudi' -> 'Chudi'");

    // 2. Test Company Cleaning
    assert(renderTemplate(tpl, { id: '1', name: 'N', email: 'e', company: 'Acme, LLC' }).includes("welcome to Acme"), "Company 'Acme, LLC' -> 'Acme'");
    assert(renderTemplate(tpl, { id: '1', name: 'N', email: 'e', company: 'Tech Inc.' }).includes("welcome to Tech"), "Company 'Tech Inc.' -> 'Tech'");
    assert(renderTemplate(tpl, { id: '1', name: 'N', email: 'e', company: 'Global Corp' }).includes("welcome to Global"), "Company 'Global Corp' -> 'Global'");
    assert(renderTemplate(tpl, { id: '1', name: 'N', email: 'e', company: 'My-Company.com' }).includes("welcome to My Company"), "Company 'My-Company.com' -> 'My Company'");

    // 3. Test Role-Based Email Detection
    console.log("\n--- Testing Role-Based Email Detection ---");
    assert(isRoleBasedEmail('office@example.com'), "office@ is role-based");
    assert(isRoleBasedEmail('owner@example.com'), "owner@ is role-based");
    assert(isRoleBasedEmail('support@example.com'), "support@ is role-based");
    assert(isRoleBasedEmail('info@example.com'), "info@ is role-based");
    assert(!isRoleBasedEmail('chudi@example.com'), "chudi@ is NOT role-based");
}

testGuardrails();
