import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Degree from "@/models/Degree";

/**
 * Dynamic NFT Metadata API
 * Returns ERC721 compliant metadata for Veridus Soulbound Tokens.
 * GET /api/metadata/[tokenId]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ tokenId: string }> }
) {
    try {
        await connectDB();
        const resolvedParams = await params;
        const tokenId = Number(resolvedParams.tokenId);

        if (isNaN(tokenId)) {
            return NextResponse.json({ error: "Invalid token ID" }, { status: 400 });
        }

        // 1. Find the degree associated with this SBT tokenId
        const degree = await Degree.findOne({ sbtTokenId: tokenId }).lean();

        if (!degree) {
            return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
        }

        // 2. Construct ERC721 Metadata
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        
        const metadata = {
            name: `${degree.degreeTitle} - ${degree.studentName}`,
            description: "Soulbound academic credential issued via VERIDUS Protocol. This token is non-transferable and serves as immutable proof of academic achievement.",
            image: `${appUrl}/api/certificate-image/${degree.degreeId}`,
            external_url: `${appUrl}/verify/${degree.degreeId}`,
            attributes: [
                {
                    trait_type: "Institution",
                    value: degree.institutionName
                },
                {
                    trait_type: "Branch",
                    value: degree.branch
                },
                {
                    trait_type: "Status",
                    value: degree.status.toUpperCase()
                },
                {
                    trait_type: "Issue Year",
                    value: new Date(degree.issueDate).getFullYear().toString()
                },
                {
                    trait_type: "Blockchain Anchored",
                    value: degree.blockchainTxHash ? "Yes" : "No"
                }
            ]
        };

        return NextResponse.json(metadata);

    } catch (error) {
        console.error("[METADATA API ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
