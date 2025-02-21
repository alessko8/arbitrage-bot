const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying token with the account:", deployer.address);

    const Token = await ethers.getContractFactory("YourToken"); // Change to your token contract name
    const token = await Token.deploy("MyTestToken", "MTT", 18, ethers.parseEther("1000000"));

    await token.waitForDeployment();
    console.log("✅ Token deployed to:", await token.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});