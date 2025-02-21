const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with the account:", deployer.address);

    const FlashLoanArbitrage = await hre.ethers.getContractFactory("FlashLoanArbitrage");
    
    const contract = await FlashLoanArbitrage.deploy(
        "0x3c73A5E5785cAC854D468F727c606C07488a29D6", // Aave Address Provider
        "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Verified Aave Pool
        "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3", // PancakeSwap Router
        "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3", // BakerySwap Router
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"  // WBNB
    );

    await contract.waitForDeployment();
    console.log("Contract deployed to:", await contract.getAddress());
}

main().catch(console.error);