// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VigilToken ($VIGIL)
 * @notice ERC-20 token powering the Vigil Protocol auditor network.
 * Auditors stake $VIGIL to participate, earn fees, and can be slashed.
 */
contract VigilToken is ERC20, Ownable {
    constructor(
        uint256 initialSupply
    ) ERC20("Vigil Protocol", "VIGIL") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Mint additional tokens (owner only, for controlled distribution).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
