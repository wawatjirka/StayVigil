import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Vigil Protocol", function () {
  async function deployFixture() {
    const [owner, auditor, challenger] = await ethers.getSigners();

    // Deploy token
    const totalSupply = ethers.parseEther("1000000000"); // 1B
    const VigilToken = await ethers.getContractFactory("VigilToken");
    const token = await VigilToken.deploy(totalSupply);

    // Deploy staking
    const VigilStaking = await ethers.getContractFactory("VigilStaking");
    const staking = await VigilStaking.deploy(await token.getAddress());

    // Deploy challenge
    const VigilChallenge = await ethers.getContractFactory("VigilChallenge");
    const challenge = await VigilChallenge.deploy(await staking.getAddress());

    // Deploy bounty vault
    const BountyVault = await ethers.getContractFactory("BountyVault");
    const vault = await BountyVault.deploy(await token.getAddress());

    // Wire up
    await staking.setChallengeContract(await challenge.getAddress());

    // Transfer tokens to auditor for staking
    await token.transfer(auditor.address, ethers.parseEther("10000"));

    return { token, staking, challenge, vault, owner, auditor, challenger };
  }

  describe("Token", function () {
    it("should have correct name and symbol", async function () {
      const { token } = await loadFixture(deployFixture);
      expect(await token.name()).to.equal("Vigil Protocol");
      expect(await token.symbol()).to.equal("VIGIL");
    });

    it("should mint total supply to deployer", async function () {
      const { token, owner } = await loadFixture(deployFixture);
      const balance = await token.balanceOf(owner.address);
      // Owner transferred 10k to auditor, so balance = total - 10k
      expect(balance).to.equal(ethers.parseEther("999990000"));
    });
  });

  describe("Staking", function () {
    it("should allow staking and track tiers", async function () {
      const { token, staking, auditor } = await loadFixture(deployFixture);

      // Approve and stake 1000 tokens (Bronze)
      const amount = ethers.parseEther("1000");
      await token.connect(auditor).approve(await staking.getAddress(), amount);
      await staking.connect(auditor).stake(amount);

      expect(await staking.getStake(auditor.address)).to.equal(amount);
      expect(await staking.getTier(auditor.address)).to.equal(1); // Bronze
    });

    it("should upgrade tier with more stake", async function () {
      const { token, staking, auditor } = await loadFixture(deployFixture);

      const amount = ethers.parseEther("5000");
      await token.connect(auditor).approve(await staking.getAddress(), amount);
      await staking.connect(auditor).stake(amount);

      expect(await staking.getTier(auditor.address)).to.equal(2); // Silver
    });
  });

  describe("Challenge", function () {
    it("should allow creating and resolving challenges", async function () {
      const { token, staking, challenge, auditor, challenger, owner } =
        await loadFixture(deployFixture);

      // Auditor stakes
      const stakeAmount = ethers.parseEther("5000");
      await token.connect(auditor).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(auditor).stake(stakeAmount);

      // Challenger creates challenge
      const skillId = ethers.keccak256(ethers.toUtf8Bytes("test-skill"));
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await challenge.connect(challenger).challenge(auditor.address, skillId, proofHash);

      // Check status
      expect(await challenge.getChallengeStatus(0)).to.equal(0); // Pending

      // Resolve with slash
      const slashAmount = ethers.parseEther("1000");
      await challenge.connect(owner).resolve(0, true, slashAmount);

      // Auditor's stake reduced
      expect(await staking.getStake(auditor.address)).to.equal(
        stakeAmount - slashAmount
      );

      // Challenger received 60%
      const challengerBalance = await token.balanceOf(challenger.address);
      expect(challengerBalance).to.equal((slashAmount * 60n) / 100n);
    });
  });

  describe("BountyVault", function () {
    it("should accept deposits and create rewards", async function () {
      const { token, vault, owner, challenger } =
        await loadFixture(deployFixture);

      // Deposit to vault
      const depositAmount = ethers.parseEther("10000");
      await token.approve(await vault.getAddress(), depositAmount);
      await vault.deposit(depositAmount);

      expect(await vault.getBalance()).to.equal(depositAmount);

      // Create reward
      const rewardAmount = ethers.parseEther("500");
      await vault.createReward(challenger.address, rewardAmount, 0);

      // Claim reward
      await vault.connect(challenger).claim(0);
      expect(await token.balanceOf(challenger.address)).to.equal(rewardAmount);
    });
  });
});
