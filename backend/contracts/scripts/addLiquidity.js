const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  // Contract addresses
  const tokenAddress = "0x4E5a5A0e95D8298f6f5CCDB11e6A5cD507F3B1A1";
  const wbnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
  const positionManagerAddress = "0x18350b048Ab366ed601F61F0C233d72bcc4F35c9";

  // Initialize contracts
  const token = await ethers.getContractAt("IERC20", tokenAddress, signer);
  const wbnb = await ethers.getContractAt("IERC20", wbnbAddress, signer);
  
  // Approve tokens (adjust amounts as needed)
  await token.approve(positionManagerAddress, ethers.parseEther("1000"));
  await wbnb.approve(positionManagerAddress, ethers.parseEther("0.1"));

  // Initialize Position Manager
  const positionManager = await ethers.getContractAt(
    [
      "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) returns (uint256,uint128,uint256,uint256)"
    ],
    positionManagerAddress,
    signer
  );

  // Add liquidity to 0.05% fee pool
  const tx = await positionManager.mint({
    token0: tokenAddress,
    token1: wbnbAddress,
    fee: 500, // Must match your pool's fee tier
    tickLower: -887220,
    tickUpper: 887220,
    amount0Desired: ethers.parseEther("100"),
    amount1Desired: ethers.parseEther("0.1"),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now()/1000) + 600
  });

  console.log("\n✅ Transaction Hash:", tx.hash);
  await tx.wait();
  console.log("Liquidity added to pool:", "0x1289e2368a7833aDEdD192226B6508a07cF94cF2");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});