import { ethers } from "ethers"; 
 
 function getSBTContract() { 
   const rpcUrl = process.env.RPC_URL!; 
   const privateKey = process.env.PRIVATE_KEY!; 
   const contractAddress = 
     process.env.SBT_CONTRACT_ADDRESS!; 
 
   const provider = 
     new ethers.JsonRpcProvider(rpcUrl); 
 
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
 
 export async function mintSoulbound( 
   studentWallet: string, 
   metadataURI: string 
 ) { 
   const contract = getSBTContract(); 
 
   const tx = 
     await contract.mint( 
       studentWallet, 
       metadataURI 
     ); 
 
   const receipt = await tx.wait(); 

   // Extract tokenId from logs
   // VeridusSBT.sol emits SoulboundMinted(address indexed student, uint256 tokenId, string degreeId)
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
     txHash: receipt.hash,
     tokenId: tokenId
   }; 
 } 
