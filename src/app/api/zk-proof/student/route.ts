import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ZKProof from "@/models/ZKProof";
import { safeSerialize } from "@/lib/utils/serialize";

/**
 * API endpoint to fetch all ZK-proofs for a student.
 * GET /api/zk-proof/student?studentWallet=0x...
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const studentWallet = searchParams.get("studentWallet");

        if (!studentWallet) {
            return NextResponse.json(
                { success: false, message: "Student wallet address is required." },
                { status: 400 }
            );
        }

        // Fetch all proofs for this student, sorted by most recent first
        const proofs = await ZKProof.find({ 
            studentWallet: studentWallet.toLowerCase() 
        })
        .sort({ createdAt: -1 })
        .lean();

        // Format the proofs for display
        const formattedProofs = proofs.map((proof) => ({
            proofId: proof.proofId,
            degreeId: proof.degreeId,
            degreeTitle: proof.proofData.degreeTitle,
            institutionName: proof.proofData.institutionName,
            disclosureType: proof.disclosureType,
            gpaThreshold: proof.gpaThreshold,
            verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-proof/${proof.proofId}`,
            createdAt: proof.createdAt,
            expiresAt: proof.expiresAt,
            status: proof.expiresAt && new Date(proof.expiresAt) < new Date() ? "Expired" : "Active",
        }));

        return NextResponse.json(
            {
                success: true,
                proofs: safeSerialize(formattedProofs),
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[ZK-PROOF STUDENT API ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "An unexpected error occurred while fetching proofs.",
            },
            { status: 500 }
        );
    }
}

