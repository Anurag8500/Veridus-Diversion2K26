import { ethers, FetchRequest } from "ethers";

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

      // 1. Explicitly define the Amoy network (Chain ID 80002)
      // This eliminates the "failed to detect network" error during startup.
      const amoyNetwork = ethers.Network.from(80002);

      // 2. Configure FetchRequest with a custom timeout
      // Public RPCs can be slow; increasing the timeout to 30s prevents code=TIMEOUT errors.
      const fetchReq = new FetchRequest(rpcUrl);
      fetchReq.timeout = 30000; // 30 seconds

      // 3. Create provider with static network and custom fetch request
      const provider = new ethers.JsonRpcProvider(fetchReq, amoyNetwork, {
        staticNetwork: true,
      });

      // 4. Set a stable polling interval
      provider.pollingInterval = 4000;

      BlockchainProvider.instance = provider;
    }
    return BlockchainProvider.instance;
  }
}

export default BlockchainProvider;
