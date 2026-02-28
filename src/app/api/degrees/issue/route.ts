import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { issueDegree } from "@/controllers/degreeController";

/**
 * API route for issuing a new degree.
 * POST /api/degrees/issue
 * 
 * Flow:
 * 1. Connect MongoDB
 * 2. Read request body
 * 3. Extract authenticated universityId (from body temporarily)
 * 4. Call issueDegree controller
 * 5. Return success/failure JSON response
 */
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const { institutionWallet, ...payload } = body;

        // Security Rule: Ensure institutionWallet is provided (should be from session in production)
        if (!institutionWallet) {
            return NextResponse.json(
                { success: false, message: "Institution wallet address is required." },
                { status: 400 }
            );
        }

        const degree = await issueDegree(institutionWallet, payload);

        return NextResponse.json(
            {
                success: true,
                message: "Degree issued successfully.",
                degree,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[ISSUE DEGREE API ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "An unexpected error occurred during degree issuance.",
            },
            { status: 500 }
        );
    }
}
