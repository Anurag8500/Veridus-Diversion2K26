import { ethers } from "ethers"; 
 
 export function getAnchorContract() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error("Missing blockchain environment variables (RPC_URL, PRIVATE_KEY, or CONTRACT_ADDRESS)");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const abi = [
    "function anchorCredential(bytes32 hash)",
    "function verifyCredential(bytes32 hash) view returns(address,uint256,bool)"
  ];

  return new ethers.Contract(contractAddress, abi, wallet);
}

export async function anchorCredential(hash: string) {
  const contract = getAnchorContract();
  const tx = await contract.anchorCredential("0x" + hash);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function verifyOnChain(hash: string) {
  const contract = getAnchorContract();
  const result = await contract.verifyCredential("0x" + hash);
  return result[2];
}
