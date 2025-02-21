const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking position for:", await signer.getAddress());

  // Verified ABI from BscScan
  const positionManagerABI = [
    {
      "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
      "name": "positions",
      "outputs": [
        {"internalType": "uint96","name": "nonce","type": "uint96"},
        {"internalType": "address","name": "operator","type": "address"},
        {"internalType": "address","name": "token0","type": "address"},
        {"internalType": "address","name": "token1","type": "address"},
        {"internalType": "uint24","name": "fee","type": "uint24"},
        {"internalType": "int24","name": "tickLower","type": "int24"},
        {"internalType": "int24","name": "tickUpper","type": "int24"},
        {"internalType": "uint128","name": "liquidity","type": "uint128"},
        {"internalType": "uint256","name": "feeGrowthInside0LastX128","type": "uint256"},
        {"internalType": "uint256","name": "feeGrowthInside1LastX128","type": "uint256"},
        {"internalType": "uint128","name": "tokensOwed0","type": "uint128"},
        {"internalType": "uint128","name": "tokensOwed1","type": "uint128"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const positionManager = new ethers.Contract(
    "0x18350b048Ab366ed601F61F0C233d72bcc4F35c9", // Correct Testnet address
    positionManagerABI,
    signer
  );

  try {
    // Check position #5230 directly
    const position = await positionManager.positions(5230);
    console.log("✅ Position Verified:", {
      token0: position[2],  // 0x4E5a5A0e95D8298f6f5CCDB11e6A5cD507F3B1A1
      token1: position[3],  // 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd
      feeTier: position[4].toString(), // 500 (0.05%)
      liquidity: ethers.formatUnits(position[7], 18) // Human-readable format
    });
  } catch (error) {
    console.log("❌ Manual verification required:");
    console.log("1. Visit: https://testnet.bscscan.com/address/0x18350b048Ab366ed601F61F0C233d72bcc4F35c9#readContract");
    console.log("2. Call 'positions' with tokenId: 5230");
  }
}

main().catch(console.error);