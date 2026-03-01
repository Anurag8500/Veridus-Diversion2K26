import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { generateZKProof, DisclosureType } from "@/lib/zkProof";
import ZKProof from "@/models/ZKProof";
import { verifyOnChain } from "@/lib/blockchain/anchorCredential";
import { safeSerialize } from "@/lib/utils/serialize";

/**
 * API endpoint for generating ZK-proofs for selective disclosure.
 * POST /api/zk-proof/generate
 * 
 * Body:
 * {
 *   degreeId: string;
 *   studentWallet: string;
 *   disclosureType: "full" | "degree_only" | "gpa_threshold";
 *   gpaThreshold?: number; // Required if disclosureType is "gpa_threshold"
 * }
 */
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { degreeId, studentWallet, disclosureType, gpaThreshold } = body;

        // Validate input
        if (!degreeId || !studentWallet || !disclosureType) {
            return NextResponse.json(
                { success: false, message: "Missing required fields: degreeId, studentWallet, disclosureType" },
                { status: 400 }
            );
        }

        if (disclosureType === "gpa_threshold" && (gpaThreshold === undefined || gpaThreshold === null)) {
            return NextResponse.json(
                { success: false, message: "gpaThreshold is required for gpa_threshold disclosure type" },
                { status: 400 }
            );
        }

        // Generate the proof
        const proof = await generateZKProof({
            degreeId,
            studentWallet,
            disclosureType: disclosureType as DisclosureType,
            gpaThreshold,
        });

        // Store proof in database
        const proofDoc = await ZKProof.create({
            proofId: proof.proofId,
            degreeId,
            studentWallet: studentWallet.toLowerCase(),
            disclosureType: disclosureType as DisclosureType,
            gpaThreshold: disclosureType === "gpa_threshold" ? gpaThreshold : null,
            proofHash: proof.proofHash,
            merkleRoot: proof.merkleRoot,
            proofData: proof.proofData,
        });

        // Generate verification URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const verificationUrl = `${appUrl}/verify-proof/${proof.proofId}`;

        return NextResponse.json(
            {
                success: true,
                proof: {
                    proofId: proof.proofId,
                    verificationUrl,
                    disclosureType: disclosureType,
                    createdAt: proofDoc.createdAt,
                },
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("[ZK-PROOF GENERATION ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to generate ZK-proof",
            },
            { status: 500 }
        );
    }
}

