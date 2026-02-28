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
     "function mint(address to, string memory tokenURI) public returns(uint256)" 
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
 
   return receipt.hash; 
 } 
