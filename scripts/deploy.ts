import hre from "hardhat";

async function main() {

  console.log("Deploying VeridusAnchor...");

  const AnchorFactory =
    await hre.ethers.getContractFactory("VeridusAnchor");

  const anchor =
    await AnchorFactory.deploy();

  await anchor.waitForDeployment();

  const address =
    await anchor.getAddress();

  console.log("✅ VeridusAnchor deployed to:", address);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});