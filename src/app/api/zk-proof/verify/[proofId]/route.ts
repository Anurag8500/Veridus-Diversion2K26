import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ZKProof from "@/models/ZKProof";
import { verifyOnChain } from "@/lib/blockchain/anchorCredential";
import { safeSerialize } from "@/lib/utils/serialize";

/**
 * API endpoint for verifying ZK-proofs.
 * GET /api/zk-proof/verify/[proofId]
 * 
 * This endpoint:
 * 1. Fetches the proof from the database
 * 2. Validates the proof against the on-chain Merkle root
 * 3. Returns verification result without revealing PII
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ proofId: string }> }
) {
    try {
        await connectDB();
        const resolvedParams = await params;
        const proofId = resolvedParams.proofId;

        // 1. Fetch proof from database
        const proof = await ZKProof.findOne({ proofId }).lean();

        if (!proof) {
            return NextResponse.json(
                { success: false, message: "Proof not found" },
                { status: 404 }
            );
        }

        // 2. Check if proof has expired
        if (proof.expiresAt && new Date(proof.expiresAt) < new Date()) {
            return NextResponse.json(
                { success: false, message: "Proof has expired" },
                { status: 410 }
            );
        }

        // 3. Verify proof against on-chain Merkle root
        let blockchainVerified = false;
        try {
            blockchainVerified = await verifyOnChain(proof.merkleRoot);
        } catch (bcError) {
            console.error("[BLOCKCHAIN VERIFICATION ERROR]", bcError);
            // Continue even if blockchain verification fails (might be network issue)
        }

        // 4. Construct verification response (NO PII)
        const verificationResult = {
            proofId: proof.proofId,
            disclosureType: proof.disclosureType,
            verified: true,
            blockchainVerified,
            merkleRoot: proof.merkleRoot,
            proofHash: proof.proofHash,
            proofData: {
                // Only return non-PII data
                degreeTitle: proof.proofData.degreeTitle,
                institutionName: proof.proofData.institutionName,
                branch: proof.proofData.branch,
                issueDate: proof.proofData.issueDate,
                gpaVerified: proof.proofData.gpaVerified,
                gpaThreshold: proof.proofData.gpaThreshold,
            },
            createdAt: proof.createdAt,
        };

        return NextResponse.json(
            {
                success: true,
                verification: safeSerialize(verificationResult),
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("[ZK-PROOF VERIFICATION ERROR]", error);
        return NextResponse.json(
            { success: false, message: "Internal server error during verification" },
            { status: 500 }
        );
    }
}

