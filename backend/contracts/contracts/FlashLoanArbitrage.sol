// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@pancakeswap/v3-core/contracts/interfaces/IPancakeV3Factory.sol";
import "@pancakeswap/v3-core/contracts/interfaces/IPancakeV3Pool.sol";
import "@pancakeswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";

// Define ISwapRouter interface (if not already available)
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external returns (uint256 amountOut);
}

contract FlashLoanArbitrage is IFlashLoanReceiver, Ownable, ReentrancyGuard {
    IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
    IPool public immutable override POOL;
    ISwapRouter public pancakeRouter;
    ISwapRouter public bakeryRouter;
    address public immutable WBNB;
    bool public paused;
    uint256 public minProfit = 0.01 ether;
    uint256 public slippageBips = 9800;
    uint256 public minLiquidity = 1 ether;
    uint256 public maxGasPrice = 200 gwei;
    uint256 public consecutiveFailures;
    bool private locked;

    event ArbitrageExecuted(address indexed token, uint256 profit);
    event ArbitrageFailed(string reason);


    modifier whenNotPaused() {
        require(!paused, "Trading paused");
        _;
    }

    modifier checkGas() {
        require(tx.gasprice <= maxGasPrice, "Gas price too high");
        _;
    }

    modifier noReentrancy() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

     constructor(
        address _provider,
        address _poolAddress,
        address _pancakeRouter,
        address _bakeryRouter,
        address _wbnbAddress
    ) { 
        // ✅ Assign immutable variables first before using them
        WBNB = _wbnbAddress;

        IERC20(_wbnbAddress).approve(_pancakeRouter, type(uint256).max);
        IERC20(_wbnbAddress).approve(_bakeryRouter, type(uint256).max);

        ADDRESSES_PROVIDER = IPoolAddressesProvider(_provider);
        POOL = IPool(_poolAddress);
        pancakeRouter = ISwapRouter(_pancakeRouter);
        bakeryRouter = ISwapRouter(_bakeryRouter);

    }

    function checkLiquidity(address[] memory path, address router) public view returns (uint256) {
    return IERC20(path[0]).balanceOf(router);
    }

    function executeArbitrage(
        address[] memory path1,
        address[] memory path2,
        uint256 amount
    ) external onlyOwner whenNotPaused checkGas noReentrancy {
        require(path1.length >= 2 && path2.length >= 2, "Invalid paths");
        _checkLiquidity(path1, pancakeRouter);
        _checkLiquidity(path2, bakeryRouter);

        address[] memory assets = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        uint256[] memory modes = new uint256[](1);

        assets[0] = path1[0];
        amounts[0] = amount;
        modes[0] = 0;

        POOL.flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            address(0),
            abi.encode(path1, path2),
            0
        );
    }

    function _checkLiquidity(address[] memory path, ISwapRouter router) internal view {
        require(path.length >= 2, "Invalid path");
        address tokenIn = path[0];

        uint256 liquidityAmount = IERC20(tokenIn).balanceOf(address(router));
        require(liquidityAmount >= minLiquidity, "Insufficient liquidity");
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override nonReentrant returns (bool) {
        require(msg.sender == address(POOL), "Unauthorized");
        require(initiator == address(this), "Unauthorized initiator");

        (address[] memory path1, address[] memory path2) = abi.decode(params, (address[], address[]));
        address tokenIn = assets[0];
        uint256 amountOwed = amounts[0] + premiums[0];

        try this.externalArbitrageExecution(tokenIn, amounts[0], path1, path2) {
            consecutiveFailures = 0;

            uint256 finalBalance = IERC20(tokenIn).balanceOf(address(this));
            require(finalBalance >= amountOwed, "Negative profit");

            uint256 profit = finalBalance - amountOwed;
            require(profit >= minProfit, "Profit below threshold");

            IERC20(tokenIn).approve(address(POOL), amountOwed);
            IERC20(tokenIn).transfer(address(POOL), amountOwed);
            IERC20(tokenIn).transfer(owner(), profit);

            emit ArbitrageExecuted(tokenIn, profit);
            return true;
        } catch Error(string memory reason) {
            consecutiveFailures++;
            if (consecutiveFailures >= 3) paused = true;
            emit ArbitrageFailed(reason);
            return false;
        }
    }

    function _executeArbitrage(
        address tokenIn,
        uint256 amountIn,
        address[] memory path1,
        address[] memory path2
    ) internal {
        require(path1.length >= 2 && path2.length >= 2, "Invalid paths");

        IERC20(tokenIn).approve(address(pancakeRouter), amountIn);
        uint256 amountOut1 = pancakeRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: path1[0],
                tokenOut: path1[path1.length - 1],
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 1,
                sqrtPriceLimitX96: 0
            })
        );

        IERC20(path1[path1.length - 1]).approve(address(bakeryRouter), amountOut1);
        uint256 amountOut2 = bakeryRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: path2[0],
                tokenOut: path2[path2.length - 1],
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountOut1,
                amountOutMinimum: 1,
                sqrtPriceLimitX96: 0
            })
        );

        require(amountOut2 > amountIn, "No profit");
    }

    function externalArbitrageExecution(
        address tokenIn,
        uint256 amountIn,
        address[] memory path1,
        address[] memory path2
    ) external {
        require(msg.sender == address(this), "Only internal call");
        _executeArbitrage(tokenIn, amountIn, path1, path2);
    }

    // Helper functions
    function resetFailureCounter() external onlyOwner {
        consecutiveFailures = 0;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function setMaxGasPrice(uint256 _maxGasPrice) external onlyOwner {
        require(_maxGasPrice <= 500 gwei, "Excessive gas limit");
        maxGasPrice = _maxGasPrice;
    }

    function recoverToken(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
}