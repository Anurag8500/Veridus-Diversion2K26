import pkg from "hardhat"; 
const { ethers } = pkg; 

async function main() { 
  const BASE_URI = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/metadata/`
    : "http://localhost:3000/api/metadata/";

  console.log(`Deploying VeridusSBT with baseURI: ${BASE_URI}`);

  const Factory = 
    await ethers.getContractFactory( 
      "VeridusSBT" 
    ); 

  // Explicitly cast to any or use the correct contract factory type if known
  const contract = await (Factory as any).deploy(BASE_URI); 

  await contract.waitForDeployment(); 

  console.log( 
    "✅ VeridusSBT deployed:", 
    await contract.getAddress() 
  ); 
} 

main().catch(console.error); 
