import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        let body;
        try {
            body = await req.json();
        } catch (jsonErr) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { walletAddress, role } = body;

        if (!walletAddress) {
            return NextResponse.json(
                { error: "Wallet address is required" },
                { status: 400 }
            );
        }

        if (!role) {
            return NextResponse.json(
                { error: "Role is required" },
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
