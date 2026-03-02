// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVigilStaking {
    function slash(address auditor, uint256 amount, address challenger) external;
    function getStake(address auditor) external view returns (uint256);
}

/**
 * @title VigilChallenge
 * @notice Challenge contract for disputing bad audits.
 * Challengers submit proof of vulnerability; auditors have 48h to respond.
 * Resolution: automated (owner) or DAO governance.
 */
contract VigilChallenge is Ownable, ReentrancyGuard {
    IVigilStaking public stakingContract;

    uint256 public constant DISPUTE_WINDOW = 48 hours;

    enum ChallengeStatus { Pending, Responded, Resolved, Rejected }

    struct Challenge {
        address challenger;
        address auditor;
        bytes32 skillId;
        bytes32 proofHash;
        bytes32 counterProofHash;
        uint256 createdAt;
        uint256 respondedAt;
        ChallengeStatus status;
        uint256 slashAmount;
    }

    uint256 public challengeCount;
    mapping(uint256 => Challenge) public challenges;

    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed challenger,
        address indexed auditor,
        bytes32 skillId,
        bytes32 proofHash
    );
    event ChallengeResponded(uint256 indexed challengeId, bytes32 counterProofHash);
    event ChallengeResolved(uint256 indexed challengeId, bool slashed, uint256 slashAmount);
    event ChallengeRejected(uint256 indexed challengeId);

    constructor(address _stakingContract) Ownable(msg.sender) {
        stakingContract = IVigilStaking(_stakingContract);
    }

    /**
     * @notice Submit a challenge against an auditor for a specific skill audit.
     * @param auditor The auditor being challenged
     * @param skillId The skill that was audited (bytes32 hash)
     * @param proofHash Hash of the vulnerability proof (details stored off-chain)
     */
    function challenge(
        address auditor,
        bytes32 skillId,
        bytes32 proofHash
    ) external returns (uint256) {
        require(stakingContract.getStake(auditor) > 0, "Auditor has no stake");

        uint256 challengeId = challengeCount++;

        challenges[challengeId] = Challenge({
            challenger: msg.sender,
            auditor: auditor,
            skillId: skillId,
            proofHash: proofHash,
            counterProofHash: bytes32(0),
            createdAt: block.timestamp,
            respondedAt: 0,
            status: ChallengeStatus.Pending,
            slashAmount: 0
        });

        emit ChallengeCreated(challengeId, msg.sender, auditor, skillId, proofHash);

        return challengeId;
    }

    /**
     * @notice Auditor responds to a challenge within the dispute window.
     */
    function respond(uint256 challengeId, bytes32 counterProofHash) external {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.Pending, "Not pending");
        require(msg.sender == c.auditor, "Only auditor can respond");
        require(
            block.timestamp <= c.createdAt + DISPUTE_WINDOW,
            "Dispute window closed"
        );

        c.counterProofHash = counterProofHash;
        c.respondedAt = block.timestamp;
        c.status = ChallengeStatus.Responded;

        emit ChallengeResponded(challengeId, counterProofHash);
    }

    /**
     * @notice Resolve a challenge. Slash the auditor if the challenge is valid.
     * Currently owner-only; will transition to DAO governance.
     * @param challengeId The challenge to resolve
     * @param shouldSlash Whether to slash the auditor
     * @param slashAmount Amount to slash (capped at auditor's stake)
     */
    function resolve(
        uint256 challengeId,
        bool shouldSlash,
        uint256 slashAmount
    ) external onlyOwner nonReentrant {
        Challenge storage c = challenges[challengeId];
        require(
            c.status == ChallengeStatus.Pending ||
                c.status == ChallengeStatus.Responded,
            "Already resolved"
        );

        if (shouldSlash) {
            uint256 auditorStake = stakingContract.getStake(c.auditor);
            uint256 actualSlash = slashAmount > auditorStake
                ? auditorStake
                : slashAmount;

            stakingContract.slash(c.auditor, actualSlash, c.challenger);

            c.slashAmount = actualSlash;
            c.status = ChallengeStatus.Resolved;

            emit ChallengeResolved(challengeId, true, actualSlash);
        } else {
            c.status = ChallengeStatus.Rejected;
            emit ChallengeRejected(challengeId);
        }
    }

    // --- View functions ---

    function getChallengeStatus(
        uint256 challengeId
    ) external view returns (ChallengeStatus) {
        return challenges[challengeId].status;
    }

    function getChallenge(
        uint256 challengeId
    ) external view returns (Challenge memory) {
        return challenges[challengeId];
    }
}
