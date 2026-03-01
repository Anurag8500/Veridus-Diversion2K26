import { ethers } from "ethers"; 
import BlockchainProvider from "../../lib/blockchain/provider";
import { MintResult, BlockchainAdapter } from "../types";

function getSBTContract() { 
  const privateKey = process.env.PRIVATE_KEY!; 
  const contractAddress = 
    process.env.SBT_CONTRACT_ADDRESS!; 

  const provider = BlockchainProvider.getInstance(); 

  const wallet = 
    new ethers.Wallet(privateKey, provider); 

  const abi = [ 
    "function mint(address to, string memory tokenURI) public returns(uint256)",
    "event SoulboundMinted(address indexed student, uint256 tokenId, string degreeId)"
  ]; 

  return new ethers.Contract( 
    contractAddress, 
    abi, 
    wallet 
  ); 
} 

export async function mintPolygonNFT( 
  metadataCID: string,
  studentWallet: string
): Promise<MintResult> { 
  try {
    const contract = getSBTContract(); 
    const metadataURI = `${process.env.NEXT_PUBLIC_GATEWAY}${metadataCID}`;

    const tx = 
      await contract.mint( 
        studentWallet, 
        metadataURI 
      ); 

    const receipt = await tx.wait(); 

    // Extract tokenId from logs
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((parsedLog: any) => parsedLog && parsedLog.name === "SoulboundMinted");

    const tokenId = event ? Number(event.args[1]) : null;

    return {
      chain: "polygon",
      assetId: tokenId?.toString() || "",
      txHash: receipt.hash,
    }; 
  } catch (error) {
    console.error("[POLYGON MINT ERROR]", error);
    throw error; 
  }
} 

export const PolygonAdapter: BlockchainAdapter = {
  mintCredentialNFT: mintPolygonNFT,
};
