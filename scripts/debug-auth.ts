function testAuth(user: string, pass: string, authHeader: string) {
    console.log(`Testing Auth for User: ${user}, Pass: ${pass}`);

    if (!authHeader) {
        console.log("No auth header provided.");
        return false;
    }

    const authValue = authHeader.split(' ')[1];
    if (!authValue) {
        console.log("Invalid auth header format.");
        return false;
    }

    try {
        const decoded = atob(authValue);
        console.log(`Decoded: ${decoded}`);
        const [u, p] = decoded.split(':');

        console.log(`Parsed User: ${u}`);
        console.log(`Parsed Pass: ${p}`);

        if (u === user && p === pass) {
            console.log("✅ Auth Success!");
            return true;
        } else {
            console.log("❌ Auth Failed: Credentials mismatch.");
            return false;
        }
    } catch (e) {
        console.log("❌ Auth Failed: Decoding error", e);
        return false;
    }
}

// Test with default credentials
const adminUser = "admin";
const adminPass = "secure-password-change-me-123";

// Simulate Browser sending "admin:secure-password-change-me-123"
const correctCreds = btoa(`${adminUser}:${adminPass}`);
testAuth(adminUser, adminPass, `Basic ${correctCreds}`);

// Test with wrong password
const wrongCreds = btoa(`${adminUser}:wrongpass`);
testAuth(adminUser, adminPass, `Basic ${wrongCreds}`);
