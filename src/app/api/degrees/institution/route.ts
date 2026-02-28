import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getInstitutionDegrees } from "@/controllers/degreeController";

/**
 * API route to fetch degrees issued by a logged-in institution.
 * GET /api/degrees/institution
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const institutionWallet = searchParams.get("institutionWallet");

        if (!institutionWallet) {
            return NextResponse.json(
                { success: false, message: "Institution wallet address is required." },
                { status: 400 }
            );
        }

        const degrees = await getInstitutionDegrees(institutionWallet);

        return NextResponse.json(
            {
                success: true,
                degrees,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[INSTITUTION DEGREES API ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "An unexpected error occurred while fetching degrees.",
            },
            { status: 500 }
        );
    }
}
