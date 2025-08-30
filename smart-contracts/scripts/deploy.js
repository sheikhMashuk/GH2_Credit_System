import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("Deploying HydrogenMarketplace contract...");
    
    // Get the contract factory
    const HydrogenMarketplace = await ethers.getContractFactory("HydrogenMarketplace");
    
    // Deploy the contract
    const hydrogenMarketplace = await HydrogenMarketplace.deploy();
    
    // Wait for deployment to complete
    await hydrogenMarketplace.deployed();
    
    console.log("HydrogenMarketplace deployed to:", hydrogenMarketplace.address);
    
    // Get the deployer's address (contract owner)
    const [deployer] = await ethers.getSigners();
    console.log("Deployed by:", deployer.address);
    console.log("Deployer balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    // If verifier address is provided in environment, set it
    if (process.env.VERIFIER_ADDRESS) {
        console.log("Setting verifier address to:", process.env.VERIFIER_ADDRESS);
        const setVerifierTx = await hydrogenMarketplace.setVerifier(process.env.VERIFIER_ADDRESS);
        await setVerifierTx.wait();
        console.log("Verifier address set successfully");
    } else {
        console.log("No VERIFIER_ADDRESS provided in environment. Remember to set it later using setVerifier()");
    }
    
    // Verify contract on Etherscan (optional)
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for block confirmations...");
        await hydrogenMarketplace.deployTransaction.wait(6);
        
        console.log("Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: hydrogenMarketplace.address,
                constructorArguments: [],
            });
            console.log("Contract verified successfully");
        } catch (error) {
            console.log("Contract verification failed:", error.message);
        }
    }
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: hydrogenMarketplace.address,
        deployerAddress: deployer.address,
        network: hre.network.name,
        deploymentTime: new Date().toISOString(),
        verifierAddress: process.env.VERIFIER_ADDRESS || "Not set"
    };
    
    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("\nPlease update your .env file with:");
    console.log(`SMART_CONTRACT_ADDRESS=${hydrogenMarketplace.address}`);
    
    return hydrogenMarketplace;
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
