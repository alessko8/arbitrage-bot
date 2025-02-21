import { ethers } from "ethers";

// 1. Use a reliable RPC (replace with your endpoint)
const provider = new ethers.JsonRpcProvider("https://bsc-testnet.publicnode.com"); 

// 2. Contract configuration
const positionManager = new ethers.Contract(
  "0x18350b048Ab366ed601F61F0C233d72bcc4F35c9",
  [
    "function positions(uint256) view returns (tuple(uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1))"
  ],
  provider
);

// 3. Check position
async function checkPosition(tokenId) {
  try {
    const pos = await positionManager.positions(tokenId);
    console.log("✅ Position Verified:", {
      token0: pos.token0,
      token1: pos.token1,
      fee: pos.fee.toString(),
      liquidity: ethers.formatUnits(pos.liquidity, 18)
    });
  } catch (error) {
    console.log("🔍 Verify manually: https://testnet.bscscan.com/token/0x18350b048Ab366ed601F61F0C233d72bcc4F35c9?a=5230");
  }
}

// 4. Run with your position ID
checkPosition(5230);