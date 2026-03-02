// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BountyVault
 * @notice Holds $VIGIL rewards for successful challengers.
 * Funded by: 10% of scan fees, 20% of slash events, treasury top-ups.
 */
contract BountyVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public vigilToken;

    struct BountyReward {
        address recipient;
        uint256 amount;
        bool claimed;
        uint256 challengeId;
    }

    uint256 public rewardCount;
    mapping(uint256 => BountyReward) public rewards;
    mapping(address => uint256[]) public recipientRewards;

    event Deposited(address indexed from, uint256 amount);
    event RewardCreated(
        uint256 indexed rewardId,
        address indexed recipient,
        uint256 amount,
        uint256 challengeId
    );
    event RewardClaimed(uint256 indexed rewardId, address indexed recipient, uint256 amount);

    constructor(address _vigilToken) Ownable(msg.sender) {
        vigilToken = IERC20(_vigilToken);
    }

    /**
     * @notice Deposit $VIGIL into the bounty vault.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        vigilToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Create a bounty reward for a successful challenger.
     */
    function createReward(
        address recipient,
        uint256 amount,
        uint256 challengeId
    ) external onlyOwner {
        require(
            vigilToken.balanceOf(address(this)) >= amount,
            "Insufficient vault balance"
        );

        uint256 rewardId = rewardCount++;
        rewards[rewardId] = BountyReward({
            recipient: recipient,
            amount: amount,
            claimed: false,
            challengeId: challengeId
        });
        recipientRewards[recipient].push(rewardId);

        emit RewardCreated(rewardId, recipient, amount, challengeId);
    }

    /**
     * @notice Claim a bounty reward.
     */
    function claim(uint256 rewardId) external nonReentrant {
        BountyReward storage reward = rewards[rewardId];
        require(reward.recipient == msg.sender, "Not your reward");
        require(!reward.claimed, "Already claimed");

        reward.claimed = true;
        vigilToken.safeTransfer(msg.sender, reward.amount);

        emit RewardClaimed(rewardId, msg.sender, reward.amount);
    }

    // --- View functions ---

    function getBalance() external view returns (uint256) {
        return vigilToken.balanceOf(address(this));
    }

    function getRewardsForRecipient(
        address recipient
    ) external view returns (uint256[] memory) {
        return recipientRewards[recipient];
    }
}
