import { mintOnAllChains } from "../../blockchain";

/**
 * Backward-compatible facade for the new blockchain router.
 * Calls mintOnAllChains internally.
 * 
 * @param studentWallet - The wallet address of the student.
 * @param metadataURI - The full IPFS URI of the metadata.
 * @returns Object with txHash and tokenId.
 */
export async function mintSoulbound( 
  studentWallet: string, 
  metadataURI: string 
) { 
  // Extract CID from the metadata URI
  const gateway = process.env.NEXT_PUBLIC_GATEWAY || "";
  const metadataCID = metadataURI.replace(gateway, "");

  const result = await mintOnAllChains(metadataCID, studentWallet);

  return {
    txHash: result.txHash,
    tokenId: result.assetId ? Number(result.assetId) : null
  }; 
} 
