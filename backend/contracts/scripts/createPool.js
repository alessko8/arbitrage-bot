const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  // Token addresses
  const tokenAddress = "0x4E5a5A0e95D8298f6f5CCDB11e6A5cD507F3B1A1";
  const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

  // Sort tokens
  const token0 = await ethers.getAddress(
    tokenAddress.toLowerCase() < wbnbAddress.toLowerCase() 
      ? tokenAddress 
      : wbnbAddress
  );
  const token1 = await ethers.getAddress(
    tokenAddress.toLowerCase() < wbnbAddress.toLowerCase() 
      ? wbnbAddress 
      : tokenAddress
  );

  // Initialize factory
  const factory = await ethers.getContractAt(
    [
      "function getPool(address,address,uint24) view returns (address)",
      "function createPool(address,address,uint24) returns (address)"
    ],
    "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
    signer
  );

  // Use allowed fee tier (500 or 10000)
  const feeTier = 500; // 0.05% fee

  // Create pool
  const tx = await factory.createPool(token0, token1, feeTier);
  console.log("Tx Hash:", tx.hash);
  await tx.wait();
  
  // Verify
  const poolAddress = await factory.getPool(token0, token1, feeTier);
  console.log("Pool Address:", poolAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});