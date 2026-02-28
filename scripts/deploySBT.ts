import pkg from "hardhat"; 
const { ethers } = pkg; 

async function main() { 

  const Factory = 
    await ethers.getContractFactory( 
      "VeridusSBT" 
    ); 

  const contract = 
    await Factory.deploy(); 

  await contract.waitForDeployment(); 

  console.log( 
    "✅ VeridusSBT deployed:", 
    await contract.getAddress() 
  ); 
} 

main().catch(console.error); 
