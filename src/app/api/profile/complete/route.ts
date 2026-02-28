import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { walletAddress, ...profileData } = body;

        if (!walletAddress) {
            return NextResponse.json(
                { error: "Wallet address is required" },
                { status: 400 }
            );
        }

        const normalizedWalletAddress = walletAddress.toLowerCase();

        // 1. Identify user using walletAddress
        const user = await User.findOne({ walletAddress: normalizedWalletAddress });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // 2. Update profile fields and set profileCompleted = true
        // We use spread to update only the fields provided in profileData
        Object.assign(user, profileData);
        user.profileCompleted = true;

        await user.save();

        return NextResponse.json({ 
            success: true, 
            message: "Profile completed successfully",
            user 
        });

    } catch (error: any) {
        console.error("Profile completion error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
