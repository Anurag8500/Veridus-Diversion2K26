import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const runtime = 'nodejs';

export async function GET() {
    try {
        if (!process.env.PRIVATE_KEY) {
            return NextResponse.json({
                success: false,
                error: "PRIVATE_KEY not configured"
            }, { status: 500 });
        }

        if (!process.env.RPC_URL) {
            return NextResponse.json({
                success: false,
                error: "RPC_URL not configured"
            }, { status: 500 });
        }

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log("Testing wallet connection...");
        const balance = await provider.getBalance(wallet.address);
        
        return NextResponse.json({
            success: true,
            walletAddress: wallet.address,
            balance: ethers.formatEther(balance),
            balanceWei: balance.toString(),
            hasFunds: balance > 0n,
            network: {
                chainId: (await provider.getNetwork()).chainId.toString(),
            }
        });
    } catch (error: any) {
        console.error("Wallet test error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
        }, { status: 500 });
    }
}
