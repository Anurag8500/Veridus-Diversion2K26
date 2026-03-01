import { mintPolygonNFT } from "./polygon/polygonAdapter";
import { MintResult } from "./types";

/**
 * Mints the credential NFT on all supported blockchains.
 * Currently only supports Polygon.
 * 
 * @param metadataCID - The IPFS CID for the NFT metadata.
 * @param studentWallet - The wallet address of the student receiving the credential.
 * @returns A promise resolving to a MintResult from the Polygon chain.
 */
export async function mintOnAllChains(
  metadataCID: string,
  studentWallet: string
): Promise<MintResult> {
  // For now, only call Polygon NFT minting.
  // Algorand support will be added later.
  return await mintPolygonNFT(metadataCID, studentWallet);
}

export * from "./types";
export * from "./polygon/polygonAdapter";
