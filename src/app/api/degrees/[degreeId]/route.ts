import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Degree from "@/models/Degree";
import { safeSerialize } from "@/lib/utils/serialize";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ degreeId: string }> }
) {
    try {
        const resolvedParams = await params;
        const degreeId = resolvedParams.degreeId;

        await connectDB();

        const degree = await Degree.findOne({ degreeId }).lean();
        
        if (!degree) {
            return NextResponse.json(
                { success: false, message: "Credential not found" },
                { status: 404 }
            );
        }

        // Optional: Check session if available
        const session = await getServerSession();
        if (session?.user?.walletAddress) {
            const userWallet = session.user.walletAddress.toLowerCase();
            const isInstitution = degree.institutionWallet.toLowerCase() === userWallet;
            const isStudent = degree.studentWallet.toLowerCase() === userWallet;

            if (!isInstitution && !isStudent) {
                return NextResponse.json(
                    { success: false, message: "Unauthorized to view this credential" },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            degree: safeSerialize(degree)
        });

    } catch (error) {
        console.error("Error fetching degree:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
