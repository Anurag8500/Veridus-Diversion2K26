import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Degree from "@/models/Degree";
import { generateCredentialHash } from "@/lib/hashCredential";
import { verifyOnChain } from "@/lib/blockchain/anchorCredential";
import { safeSerialize } from "@/lib/utils/serialize";

/**
 * Public API endpoint for credential verification.
 * Anyone can access this endpoint to verify a degreeId.
 * GET /api/verify/[degreeId]
 * 
 * Logic:
 * 1. Fetch stored degree by degreeId.
 * 2. Recompute hash from stored data using deterministic SHA256.
 * 3. Compare recomputedHash with stored credentialHash.
 * 4. Detect tampering if hashes do not match.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ degreeId: string }> }
) {
    try {
        await connectDB();
        const resolvedParams = await params;
        const degreeId = resolvedParams.degreeId;

        // 1. Fetch degree from database
        const degree = await Degree.findOne({ degreeId }).lean();

        // 2. Handle missing credential
        if (!degree) {
            return NextResponse.json(
                { success: false, message: "Credential not found" },
                { status: 404 }
            );
        }

        let isTampered = false;
        let calculatedHash = null;
        let blockchainVerified = false;

        // 3. Perform Hash Integrity Check (Tamper-proofing)
        if (degree.credentialHash) {
            // Normalize issueDate to ensure consistent comparison
            let normalizedIssueDate = degree.issueDate;
            if (normalizedIssueDate instanceof Date) {
                normalizedIssueDate = normalizedIssueDate.toISOString();
            } else if (typeof normalizedIssueDate === 'string') {
                // Ensure it's in ISO format
                try {
                    normalizedIssueDate = new Date(normalizedIssueDate).toISOString();
                } catch (e) {
                    console.error("[DATE NORMALIZATION ERROR]", e);
                }
            }

            // Recompute hash from current database values
            calculatedHash = generateCredentialHash({
                degreeId: String(degree.degreeId || ""),
                studentWallet: String(degree.studentWallet || "").toLowerCase(),
                institutionWallet: String(degree.institutionWallet || "").toLowerCase(),
                studentName: String(degree.studentName || ""),
                degreeTitle: String(degree.degreeTitle || ""),
                branch: String(degree.branch || ""),
                issueDate: normalizedIssueDate
            });

            // Strict comparison - any mismatch indicates tampering
            const hashMatch = calculatedHash === degree.credentialHash;
            
            if (!hashMatch) {
                isTampered = true;
                console.warn(`[TAMPER DETECTED] degreeId: ${degreeId}`);
                console.warn(`  Stored Hash:    ${degree.credentialHash}`);
                console.warn(`  Calculated Hash: ${calculatedHash}`);
                console.warn(`  Current DB Values:`, {
                    degreeId: degree.degreeId,
                    studentName: degree.studentName,
                    degreeTitle: degree.degreeTitle,
                    branch: degree.branch,
                    issueDate: degree.issueDate
                });
            } else {
                // 3b. Perform Blockchain Validation (only if hash matches)
                try {
                    blockchainVerified = await verifyOnChain(degree.credentialHash);
                } catch (bcError) {
                    console.error("[BLOCKCHAIN VERIFICATION ERROR]", bcError);
                    // Fallback to false if check fails
                }
            }
        } else {
            // If for some reason a degree exists without a hash, mark as invalid/tampered for safety
            isTampered = true;
            console.warn(`[MISSING HASH] degreeId: ${degreeId} has no credentialHash`);
        }

        // 4. Construct verification response
        const verificationResult = {
            degreeId: degree.degreeId,
            status: isTampered ? "TAMPERED" : degree.status,
            isAuthentic: !isTampered && degree.status === "valid",
            blockchainVerified,
            storedHash: degree.credentialHash,
            recomputedHash: calculatedHash,
            academicData: {
                studentName: degree.studentName,
                degreeTitle: degree.degreeTitle,
                branch: degree.branch,
                institutionName: degree.institutionName,
                issueDate: degree.issueDate,
                blockchainTxHash: degree.blockchainTxHash,
                anchoredAt: degree.anchoredAt
            }
        };

        return NextResponse.json(
            {
                success: true,
                verification: safeSerialize(verificationResult)
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Verification fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error during verification" },
            { status: 500 }
        );
    }
}
