import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: {
            hasPrivateKey: !!process.env.PRIVATE_KEY,
            privateKeyLength: process.env.PRIVATE_KEY?.length || 0,
            privateKeyPreview: process.env.PRIVATE_KEY?.substring(0, 10) + "...",
            
            hasContractAddress: !!process.env.SBT_CONTRACT_ADDRESS,
            contractAddress: process.env.SBT_CONTRACT_ADDRESS,
            
            hasRpcUrl: !!process.env.RPC_URL,
            rpcUrl: process.env.RPC_URL?.substring(0, 50) + "...",
            
            hasGateway: !!process.env.NEXT_PUBLIC_GATEWAY,
            gateway: process.env.NEXT_PUBLIC_GATEWAY,
            
            hasPinataJwt: !!process.env.PINATA_JWT,
            pinataJwtLength: process.env.PINATA_JWT?.length || 0,
        },
        allConfigured: !!(
            process.env.PRIVATE_KEY &&
            process.env.SBT_CONTRACT_ADDRESS &&
            process.env.RPC_URL &&
            process.env.NEXT_PUBLIC_GATEWAY &&
            process.env.PINATA_JWT
        )
    });
}
