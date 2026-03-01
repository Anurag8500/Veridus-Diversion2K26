import crypto from "crypto";

/**
 * Interface representing the canonical credential data used for hashing.
 */
export interface CredentialData {
    degreeId: string;
    studentWallet: string;
    institutionWallet: string;
    studentName: string;
    degreeTitle: string;
    branch: string;
    issueDate: string | Date;
}

/**
 * Generates a deterministic SHA-256 hash from credential data.
 * 
 * This hash depends only on the following fields:
 * degreeId, studentWallet, institutionWallet, studentName, degreeTitle, branch, issueDate.
 * 
 * IMPORTANT: Field order must NEVER change to maintain deterministic output.
 * 
 * @param data The credential data to hash.
 * @returns A hex-encoded SHA-256 string.
 */
export function generateCredentialHash(data: CredentialData): string {
    // Normalize all inputs to ensure consistent hashing
    const normalizeString = (str: string | null | undefined): string => {
        return String(str || "").trim();
    };

    const normalizeDate = (date: string | Date | null | undefined): string => {
        if (!date) return "";
        if (date instanceof Date) {
            return date.toISOString();
        }
        if (typeof date === 'string') {
            // Try to parse and normalize to ISO format
            try {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            } catch (e) {
                // If parsing fails, return as-is (shouldn't happen with valid dates)
            }
            return date;
        }
        return "";
    };

    // 1. Construct canonical object in strict deterministic order as per specification
    const canonicalObject = {
        degreeId: normalizeString(data.degreeId),
        studentWallet: normalizeString(data.studentWallet).toLowerCase(),
        institutionWallet: normalizeString(data.institutionWallet).toLowerCase(),
        studentName: normalizeString(data.studentName),
        degreeTitle: normalizeString(data.degreeTitle),
        branch: normalizeString(data.branch),
        issueDate: normalizeDate(data.issueDate)
    };

    // 2. Convert to deterministic string
    const canonicalString = JSON.stringify(canonicalObject);

    // 3. Compute SHA-256 hash
    return crypto
        .createHash("sha256")
        .update(canonicalString)
        .digest("hex");
}
