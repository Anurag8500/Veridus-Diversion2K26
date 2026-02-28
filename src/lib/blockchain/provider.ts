import { ethers } from "ethers";

/**
 * Singleton class to manage the blockchain provider.
 * Prevents multiple provider instances and network detection overhead.
 */
class BlockchainProvider {
  private static instance: ethers.JsonRpcProvider | null = null;

  public static getInstance(): ethers.JsonRpcProvider {
    if (!BlockchainProvider.instance) {
      const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
      
      if (!rpcUrl) {
        throw new Error("RPC_URL or NEXT_PUBLIC_RPC_URL is not defined in environment variables");
      }

      // Create provider with static network to avoid extra network detection calls
      // and increased timeout for better stability on public RPCs
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true,
      });

      // Set a reasonable polling interval to avoid spamming the node
      provider.pollingInterval = 4000;

      BlockchainProvider.instance = provider;
    }
    return BlockchainProvider.instance;
  }
}

export default BlockchainProvider;
