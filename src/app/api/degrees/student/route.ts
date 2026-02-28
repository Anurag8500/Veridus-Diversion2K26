import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getStudentDegrees } from "@/controllers/degreeController";

/**
 * API route to fetch degrees for a logged-in student.
 * GET /api/degrees/student
 * 
 * Flow:
 * 1. Connect MongoDB
 * 2. Extract studentId from searchParams (temporary until auth middleware)
 * 3. Call getStudentDegrees controller
 * 4. Return success/failure JSON response
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

        const degrees = await getStudentDegrees(studentWallet);

        return NextResponse.json(
            {
                success: true,
                degrees,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[STUDENT DEGREES API ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "An unexpected error occurred while fetching degrees.",
            },
            { status: 500 }
        );
    }
}
