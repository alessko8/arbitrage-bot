// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IFlashLoanArbitrage {
    /// @notice Event emitted when a profitable arbitrage is executed
    event ArbitrageExecuted(
        address indexed token0,
        address indexed token1,
        uint256 profit,
        uint256 timestamp
    );

    /// @notice Event emitted when the bot is paused/unpaused
    event BotStatusChanged(bool isPaused);

    /// @notice Execute a flash loan arbitrage
    /// @param assets The addresses of the assets to borrow
    /// @param amounts The amounts to borrow
    /// @param paths The DEX swap paths to use
    function executeArbitrage(
        address[] calldata assets,
        uint256[] calldata amounts,
        bytes[] calldata paths
    ) external;

    /// @notice Emergency withdraw funds
    /// @param token The token to withdraw
    /// @param amount The amount to withdraw
    function emergencyWithdraw(address token, uint256 amount) external;

    /// @notice Pause the bot
    function pause() external;

    /// @notice Unpause the bot
    function unpause() external;
}