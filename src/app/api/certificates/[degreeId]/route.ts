import connectDB from "@/lib/mongodb";
import Degree from "@/models/Degree";
import { generateCertificate } from "@/lib/certificateGenerator";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ degreeId: string }> }
) {
    try {
        await connectDB();
        const resolvedParams = await params;
        const degreeId = resolvedParams.degreeId;

        // 1. Fetch degree from database
        const degree = await Degree.findOne({
            degreeId: degreeId,
        }).lean();

        // 2. Return 404 if degree doesn't exist
        if (!degree) {
            return NextResponse.json(
                { success: false, message: "Certificate not found" },
                { status: 404 }
            );
        }

        // 3. Optional Ownership Validation (if session exists)
        // Note: In a real production app, we would use getServerSession with authOptions
        // For now, we'll keep it simple as requested
        const session: any = await getServerSession();
        if (session?.user?.walletAddress) {
            const userWallet = session.user.walletAddress.toLowerCase();
            const isOwner = userWallet === degree.studentWallet.toLowerCase();
            const isIssuer = userWallet === degree.institutionWallet.toLowerCase();

            if (!isOwner && !isIssuer) {
                return NextResponse.json(
                    { success: false, message: "Unauthorized access to this certificate" },
                    { status: 403 }
                );
            }
        }

        // 4. Define the file path for the certificate
        const filePath = path.join(process.cwd(), "storage", "certificates", `${degreeId}.pdf`);

        // 5. Generate the certificate if it doesn't already exist
        if (!fs.existsSync(filePath)) {
            await generateCertificate(degree);
        }

        // 6. Read the PDF file
        const pdfBuffer = fs.readFileSync(filePath);

        // 7. Return the PDF as an inline response
        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${degreeId}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error("Certificate fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
