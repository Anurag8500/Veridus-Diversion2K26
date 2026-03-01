import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { safeSerialize } from "@/lib/utils/serialize";

export async function GET(req: NextRequest) {
    try {
        // Read NextAuth token instead of custom JWT
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Use token.userId (which we set in the jwt callback) to find the user
        const user = await User.findById(token.userId).select("-password").lean();

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(safeSerialize(user));
    } catch (error) {
        console.error("[API ME ERROR]", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
