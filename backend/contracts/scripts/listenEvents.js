const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const contractAddress = "0xA4d34b7EfDA166cbe778B2C2b5B78Cdaa865c8e8";
  const contract = await ethers.getContractAt("FlashLoanArbitrage", contractAddress);

  console.log("✅ Listening for Arbitrage Events...");

  // Add error handling and rate limiting
  const eventHandler = async (token, profit, event) => {
    try {
      console.log(`\n=== New Arbitrage Detected ===`);
      console.log(`Token: ${token}`);
      console.log(`Profit: ${ethers.formatEther(profit)} BNB`);
      console.log(`TX Hash: ${event.transactionHash}`);
    } catch (error) {
      console.error("Error processing event:", error);
    }
  };

  contract.on("ArbitrageExecuted", eventHandler);

  // Keep process alive with proper cleanup
  const shutdown = async () => {
    contract.off("ArbitrageExecuted", eventHandler);
    console.log("\n🚫 Listener stopped");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Add periodic health check
  setInterval(() => {
    console.log("👂 Still listening... Last check:", new Date().toISOString());
  }, 60000); // Every 60 seconds
}

main().catch(error => {
  console.error("Listener error:", error);
  process.exit(1);
});