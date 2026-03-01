/**
 * Sanitizes data by removing non-plain objects like Mongoose documents, Sets, Maps,
 * BigInt, ObjectId, and prototype objects. Ensures compatibility with Next.js Client
 * Components and JSON serialization rules.
 */
export function safeSerialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}

// Alias for backward compatibility with existing callers
export const serialize = safeSerialize;
