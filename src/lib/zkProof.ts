import crypto from "crypto";
import Degree from "@/models/Degree";

/**
 * Types of selective disclosure supported
 */
export type DisclosureType = "full" | "degree_only" | "gpa_threshold";

/**
 * Interface for proof generation input
 */
export interface ProofGenerationInput {
    degreeId: string;
    studentWallet: string;
    disclosureType: DisclosureType;
    gpaThreshold?: number; // Required if disclosureType is "gpa_threshold"
}

/**
 * Interface for the generated proof
 */
export interface GeneratedProof {
    proofId: string;
    proofHash: string;
    merkleRoot: string;
    proofData: {
        degreeTitle: string;
        institutionName: string;
        branch: string;
        issueDate: Date;
        gpaVerified?: boolean;
        gpaThreshold?: number;
    };
}

/**
 * Generates a unique proof ID
 */
function generateProofId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    return `ZK-${timestamp}-${random}`;
}

/**
 * Creates a commitment hash for CGPA without revealing the actual value.
 * Uses a range proof approach: we prove CGPA >= threshold without revealing CGPA.
 */
function createGPACommitment(actualCGPA: number, threshold: number): string {
    // Create a commitment: hash(actualCGPA || threshold || salt)
    // In a real ZK system, this would use Pedersen commitments or similar
    // For simplicity, we use a hash-based commitment
    const salt = crypto.randomBytes(16).toString("hex");
    const commitment = crypto
        .createHash("sha256")
        .update(`${actualCGPA}|${threshold}|${salt}`)
        .digest("hex");
    
    return commitment;
}

/**
 * Generates a proof that CGPA >= threshold without revealing actual CGPA
 * This is a simplified version - in production, use proper ZK-SNARKs
 */
function generateGPAProof(actualCGPA: number, threshold: number): {
    verified: boolean;
    commitment: string;
} {
    const verified = actualCGPA >= threshold;
    const commitment = createGPACommitment(actualCGPA, threshold);
    
    return {
        verified,
        commitment,
    };
}

/**
 * Generates a ZK-proof for selective disclosure
 */
export async function generateZKProof(
    input: ProofGenerationInput
): Promise<GeneratedProof> {
    // 1. Fetch the degree from database
    const degree = await Degree.findOne({ 
        degreeId: input.degreeId,
        studentWallet: input.studentWallet.toLowerCase()
    });

    if (!degree) {
        throw new Error("Degree not found or access denied");
    }

    if (degree.status !== "valid") {
        throw new Error("Cannot generate proof for invalid or revoked degree");
    }

    // 2. Get the on-chain Merkle root (credentialHash)
    if (!degree.credentialHash) {
        throw new Error("Degree not anchored on blockchain");
    }
    const merkleRoot = degree.credentialHash;

    // 3. Generate proof data based on disclosure type
    let proofData: GeneratedProof["proofData"];
    let gpaVerified: boolean | undefined = undefined;

    switch (input.disclosureType) {
        case "full":
            // Full disclosure - reveal all non-PII data
            proofData = {
                degreeTitle: degree.degreeTitle,
                institutionName: degree.institutionName,
                branch: degree.branch,
                issueDate: degree.issueDate,
            };
            break;

        case "degree_only":
            // Only degree info, hide marks/CGPA
            proofData = {
                degreeTitle: degree.degreeTitle,
                institutionName: degree.institutionName,
                branch: degree.branch,
                issueDate: degree.issueDate,
            };
            break;

        case "gpa_threshold":
            // Prove GPA >= threshold without revealing actual GPA
            if (input.gpaThreshold === undefined || input.gpaThreshold === null) {
                throw new Error("GPA threshold is required for gpa_threshold disclosure type");
            }

            if (degree.cgpa === null || degree.cgpa === undefined) {
                throw new Error("This credential does not have CGPA data. Please contact your institution to add CGPA information to this credential.");
            }

            const gpaProof = generateGPAProof(degree.cgpa, input.gpaThreshold);
            gpaVerified = gpaProof.verified;

            if (!gpaVerified) {
                throw new Error(`CGPA ${degree.cgpa} does not meet threshold ${input.gpaThreshold}`);
            }

            proofData = {
                degreeTitle: degree.degreeTitle,
                institutionName: degree.institutionName,
                branch: degree.branch,
                issueDate: degree.issueDate,
                gpaVerified: true,
                gpaThreshold: input.gpaThreshold,
            };
            break;

        default:
            throw new Error(`Unknown disclosure type: ${input.disclosureType}`);
    }

    // 4. Generate proof hash (links proof to Merkle root)
    // The proof hash is: hash(merkleRoot || proofData || disclosureType)
    const proofHashInput = JSON.stringify({
        merkleRoot,
        proofData,
        disclosureType: input.disclosureType,
        degreeId: input.degreeId,
    });
    const proofHash = crypto
        .createHash("sha256")
        .update(proofHashInput)
        .digest("hex");

    // 5. Generate unique proof ID
    const proofId = generateProofId();

    return {
        proofId,
        proofHash,
        merkleRoot,
        proofData,
    };
}

/**
 * Verifies a ZK-proof against the on-chain Merkle root
 */
export async function verifyZKProof(proofId: string): Promise<{
    valid: boolean;
    proofData?: GeneratedProof["proofData"];
    merkleRoot?: string;
    error?: string;
}> {
    // This will be implemented in the API route that fetches from database
    // For now, return a placeholder
    return {
        valid: false,
        error: "Proof verification must be done via API endpoint",
    };
}

