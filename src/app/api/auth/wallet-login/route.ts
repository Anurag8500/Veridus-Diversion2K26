import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        // --- Index Migration Fix ---
        try {
            const indexes = await User.collection.getIndexes();
            if (indexes.email_1) {
                console.log("Found legacy email_1 index, dropping it...");
                await User.collection.dropIndex("email_1");
            }
        } catch (idxError) {
            // Silently ignore if index doesn't exist or already dropped
        }
        // ---------------------------

        const { walletAddress, role } = await req.json();

        if (!walletAddress || !role) {
            return NextResponse.json(
                { error: "Wallet address and role are required" },
                { status: 400 }
            );
        }

        const normalizedWalletAddress = walletAddress.toLowerCase();

        // 1. Find user by walletAddress
        let user = await User.findOne({ walletAddress: normalizedWalletAddress });

        if (user) {
            // IF user exists: return existing user
            return NextResponse.json({ user });
        } else {
            // IF user does NOT exist: create user
            user = await User.create({
                walletAddress: normalizedWalletAddress,
                role,
                profileCompleted: false
            });

            return NextResponse.json({ user }, { status: 201 });
        }
    } catch (error: any) {
        console.error("Wallet login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
