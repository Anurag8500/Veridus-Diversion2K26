import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const runtime = 'nodejs';

export async function GET() {
    try {
        if (!process.env.RPC_URL) {
            return NextResponse.json({
                success: false,
                error: "RPC_URL not configured"
            }, { status: 500 });
        }

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        console.log("Testing RPC connection...");
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        
        return NextResponse.json({
            success: true,
            rpcUrl: process.env.RPC_URL.substring(0, 50) + "...",
            blockNumber,
            chainId: network.chainId.toString(),
            chainName: network.name,
        });
    } catch (error: any) {
        console.error("RPC test error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
        }, { status: 500 });
    }
}
