export function extractEpicKey(input: string): string | null {
    // Match something like ABC-123
    const match = input.match(/[A-Z][A-Z0-9]+-\d+/i);
    return match ? match[0].toUpperCase() : null;
}
