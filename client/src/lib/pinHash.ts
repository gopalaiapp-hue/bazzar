// PIN hashing utility using Web Crypto API (SHA-256)
export async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'sahk osh_salt_2024'); // Add salt for basic security
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Verify PIN against stored hash
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
    const pinHash = await hashPin(pin);
    return pinHash === storedHash;
}
