// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VigilStaking
 * @notice Auditors stake $VIGIL to become eligible for audits.
 * Tiers: Bronze (1k), Silver (5k), Gold (25k), Platinum (100k).
 * Slash mechanism called by the Challenge contract.
 */
contract VigilStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public vigilToken;
    address public challengeContract;

    uint256 public constant UNSTAKE_COOLDOWN = 7 days;

    // Tier thresholds (in token units, assuming 18 decimals)
    uint256 public constant BRONZE_THRESHOLD = 1_000 * 1e18;
    uint256 public constant SILVER_THRESHOLD = 5_000 * 1e18;
    uint256 public constant GOLD_THRESHOLD = 25_000 * 1e18;
    uint256 public constant PLATINUM_THRESHOLD = 100_000 * 1e18;

    enum Tier { None, Bronze, Silver, Gold, Platinum }

    struct StakeInfo {
        uint256 amount;
        uint256 unstakeRequestTime;
        uint256 unstakeRequestAmount;
        bool isRegistered;
    }

    mapping(address => StakeInfo) public stakes;
    address[] public auditors;

    event Staked(address indexed auditor, uint256 amount, Tier tier);
    event UnstakeRequested(address indexed auditor, uint256 amount, uint256 availableAt);
    event Unstaked(address indexed auditor, uint256 amount);
    event Slashed(address indexed auditor, uint256 amount, address challenger);

    constructor(address _vigilToken) Ownable(msg.sender) {
        vigilToken = IERC20(_vigilToken);
    }

    function setChallengeContract(address _challengeContract) external onlyOwner {
        challengeContract = _challengeContract;
    }

    /**
     * @notice Stake $VIGIL to become an auditor.
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        vigilToken.safeTransferFrom(msg.sender, address(this), amount);

        if (!stakes[msg.sender].isRegistered) {
            stakes[msg.sender].isRegistered = true;
            auditors.push(msg.sender);
        }

        stakes[msg.sender].amount += amount;

        emit Staked(msg.sender, amount, getTier(msg.sender));
    }

    /**
     * @notice Request to unstake. Subject to cooldown period.
     */
    function requestUnstake(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        require(amount > 0, "Amount must be > 0");

        stakes[msg.sender].unstakeRequestTime = block.timestamp;
        stakes[msg.sender].unstakeRequestAmount = amount;

        emit UnstakeRequested(
            msg.sender,
            amount,
            block.timestamp + UNSTAKE_COOLDOWN
        );
    }

    /**
     * @notice Complete unstake after cooldown period.
     */
    function unstake() external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        require(info.unstakeRequestAmount > 0, "No unstake request");
        require(
            block.timestamp >= info.unstakeRequestTime + UNSTAKE_COOLDOWN,
            "Cooldown period not elapsed"
        );

        uint256 amount = info.unstakeRequestAmount;
        info.amount -= amount;
        info.unstakeRequestAmount = 0;
        info.unstakeRequestTime = 0;

        vigilToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Slash an auditor's stake. Only callable by Challenge contract.
     * @param auditor The auditor to slash
     * @param amount The amount to slash
     * @param challenger The challenger who submitted the successful challenge
     */
    function slash(
        address auditor,
        uint256 amount,
        address challenger
    ) external {
        require(msg.sender == challengeContract, "Only challenge contract");
        require(stakes[auditor].amount >= amount, "Insufficient stake to slash");

        stakes[auditor].amount -= amount;

        // 60% to challenger, 20% to bounty vault (owner for now), 20% burned
        uint256 challengerShare = (amount * 60) / 100;
        uint256 vaultShare = (amount * 20) / 100;
        // Remaining 20% stays in contract (effectively burned from circulation)

        vigilToken.safeTransfer(challenger, challengerShare);
        vigilToken.safeTransfer(owner(), vaultShare);

        emit Slashed(auditor, amount, challenger);
    }

    // --- View functions ---

    function getStake(address auditor) external view returns (uint256) {
        return stakes[auditor].amount;
    }

    function getTier(address auditor) public view returns (Tier) {
        uint256 amount = stakes[auditor].amount;
        if (amount >= PLATINUM_THRESHOLD) return Tier.Platinum;
        if (amount >= GOLD_THRESHOLD) return Tier.Gold;
        if (amount >= SILVER_THRESHOLD) return Tier.Silver;
        if (amount >= BRONZE_THRESHOLD) return Tier.Bronze;
        return Tier.None;
    }

    function getAuditorCount() external view returns (uint256) {
        return auditors.length;
    }
}
