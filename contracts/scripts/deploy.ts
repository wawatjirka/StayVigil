import { ethers, network } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deploying contracts with:", deployer.address);
  console.log("Network:", network.name);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n && network.name !== "hardhat") {
    throw new Error("Deployer has no ETH. Fund the wallet first.");
  }

  // 1. Deploy $VIGIL Token
  const totalSupply = ethers.parseEther("1000000000"); // 1B tokens
  const VigilToken = await ethers.getContractFactory("VigilToken");
  const token = await VigilToken.deploy(totalSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("VigilToken deployed to:", tokenAddress);

  // 2. Deploy Staking Contract
  const VigilStaking = await ethers.getContractFactory("VigilStaking");
  const staking = await VigilStaking.deploy(tokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("VigilStaking deployed to:", stakingAddress);

  // 3. Deploy Challenge Contract
  const VigilChallenge = await ethers.getContractFactory("VigilChallenge");
  const challenge = await VigilChallenge.deploy(stakingAddress);
  await challenge.waitForDeployment();
  const challengeAddress = await challenge.getAddress();
  console.log("VigilChallenge deployed to:", challengeAddress);

  // 4. Deploy Bounty Vault
  const BountyVault = await ethers.getContractFactory("BountyVault");
  const vault = await BountyVault.deploy(tokenAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("BountyVault deployed to:", vaultAddress);

  // 5. Wire up: set Challenge contract on Staking
  const tx = await staking.setChallengeContract(challengeAddress);
  await tx.wait();
  console.log("Challenge contract linked to Staking");

  // Save deployment addresses to JSON
  const deployment = {
    network: network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      VigilToken: tokenAddress,
      VigilStaking: stakingAddress,
      VigilChallenge: challengeAddress,
      BountyVault: vaultAddress,
    },
  };

  const outputPath = join(__dirname, `../deployments-${network.name}.json`);
  writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment addresses saved to: deployments-${network.name}.json`);

  console.log("\n=== Deployment Summary ===");
  console.log(`Network:        ${network.name}`);
  console.log(`VigilToken:     ${tokenAddress}`);
  console.log(`VigilStaking:   ${stakingAddress}`);
  console.log(`VigilChallenge: ${challengeAddress}`);
  console.log(`BountyVault:    ${vaultAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
