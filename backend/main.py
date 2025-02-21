from fastapi import FastAPI
from typing import Dict, Any
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from web3 import Web3
import requests

app = FastAPI()

BSC_RPC = "https://bsc-dataseed.binance.org/"
web3 = Web3(Web3.HTTPProvider(BSC_RPC))
GAS_FEE_ESTIMATE = 0.005 #example BNB cost per trade


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Binance Smart Chain (BSC) Node
BSC_RPC_URL = "https://bsc-dataseed.binance.org/"
web3 = Web3(Web3.HTTPProvider(BSC_RPC_URL))

# PancakeSwap and BakerySwap Router Contracts
PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
BAKERYSWAP_ROUTER = "0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F"

# Convert token addresses to checksum format
BNB = Web3.to_checksum_address("0xbb4CdB9Cbd36B01bD1cBaEBF2De08d9173bc095c")  # WBNB on BSC
CAKE = Web3.to_checksum_address("0x0E09FaBB73Bd3Ade0A17ECC321Fd13A19e81cE82")  # CAKE on BSC
USDT = Web3.to_checksum_address("0x55d398326f99059fF775485246999027B3197955")  # USDT (Stablecoin)

TRADE_AMOUNT = 1 #simulating trade with 1 WBNB

# Example DEX prices (Replace with actual price-fetching logic)
DEX_PRICES = {
    "BNB": {"PancakeSwap": None, "BakerySwap": None},
    "CAKE": {"PancakeSwap": None, "BakerySwap": None}
}

def get_token_prices():
    try:
        # Simulated example (Replace with Web3 calls to PancakeSwap/BakerySwap)
        DEX_PRICES["BNB"]["PancakeSwap"] = 320
        DEX_PRICES["BNB"]["BakerySwap"] = 322
        DEX_PRICES["CAKE"]["PancakeSwap"] = 4.5
        DEX_PRICES["CAKE"]["BakerySwap"] = 4.4
    except Exception as e:
        print(f"Error fetching prices: {e}")

# Function to calculate arbitrage opportunities
def find_arbitrage_opportunities() -> Dict[str, Any]:
    opportunities = []
    
    for token, dex_prices in DEX_PRICES.items():
        if dex_prices["PancakeSwap"] and dex_prices["BakerySwap"]:
            buy_on = "PancakeSwap" if dex_prices["PancakeSwap"] < dex_prices["BakerySwap"] else "BakerySwap"
            sell_on = "BakerySwap" if buy_on == "PancakeSwap" else "PancakeSwap"
            price_difference = dex_prices[sell_on] - dex_prices[buy_on]
            percentage_profit = (price_difference / dex_prices[buy_on]) * 100

            if price_difference > 0:
                opportunities.append({
                    "token": token,
                    "buy_on": buy_on,
                    "sell_on": sell_on,
                    "profit_per_1000": (1000 / dex_prices[buy_on]) * price_difference,
                    "profit_percentage": round(percentage_profit, 2),
                })

    return opportunities



def simulate_trade(dex, token_in, token_out, amount):
    """Calls the API to simulate trade execution"""
    try:
        response = requests.get(
            f"http://127.0.0.1:8000/simulate_trade/?dex={dex}&token_in={token_in}&token_out={token_out}&amount={amount}"
        )
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Error calling simulation API: {e}")
        return None

# New API endpoint to simulate a trade
@app.get("/simulate_trade/")
async def simulate_trade_endpoint(dex: str, token_in: str, token_out: str, amount: float):
    """API to simulate a trade on a selected DEX"""
    if dex.lower() == "pancakeswap":
        router = PANCAKESWAP_ROUTER
    elif dex.lower() == "bakeryswap":
        router = BAKERYSWAP_ROUTER
    else:
        raise HTTPException(status_code=400, detail="Invalid DEX name")

    estimated_output = simulate_trade(router, Web3.to_checksum_address(token_in), Web3.to_checksum_address(token_out), amount)

    if estimated_output is None:
        raise HTTPException(status_code=500, detail="Simulation failed")

    return {"dex": dex, "token_in": token_in, "token_out": token_out, "amount_in": amount, "estimated_output": estimated_output}

@app.get("/simulate_flash_loan_trade/")
async def simulate_flash_loan_trade(
    dex_in: str,
    dex_out: str,
    token_in: str,
    token_out: str,
    amount: float
):
    """Simulates a flash loan trade to estimate profit."""
    
    # Mock price fetching
    price_in = 2.5  # Mocked price at dex_in
    price_out = 2.55  # Mocked price at dex_out
    
    estimated_output = amount * price_out / price_in
    
    # Deduct gas fees
    estimated_profit = estimated_output - amount - GAS_FEE_ESTIMATE
    
    return {
        "dex_in": dex_in,
        "dex_out": dex_out,
        "token_in": token_in,
        "token_out": token_out,
        "amount_in": amount,
        "estimated_output": estimated_output,
        "estimated_profit": estimated_profit
    }

# ABI for Swap Router (Only the "getAmountsOut" function)
PANCAKESWAP_ABI = BAKERYSWAP_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "amountIn", "type": "uint256"}, {"name": "path", "type": "address[]"}],
        "name": "getAmountsOut",
        "outputs": [{"name": "amounts", "type": "uint256[]"}],
        "payable": False,
        "stateMutability": "view",
        "type": "function",
    }
]

def get_token_price(router_address, token_address):
    """Fetches token price in USDT using the DEX router contract"""
    try:
        print(f"\nFetching price for {token_address} from {router_address}...")  # Debugging
        router_contract = web3.eth.contract(address=router_address, abi=PANCAKESWAP_ABI)

        amount_in = Web3.to_wei(1, "ether")  # 1 Token
        path = [token_address, BNB, USDT]  # Ensure the swap goes through BNB

        print(f"Calling getAmountsOut({amount_in}, {path}) on {router_address}...")  # Debugging
        
        amounts_out = router_contract.functions.getAmountsOut(amount_in, path).call()

        print(f"Raw Output from getAmountsOut: {amounts_out}")  # Debugging

        price = Web3.from_wei(amounts_out[-1], "ether")  # Convert back to readable price
        print(f"Final Converted Price for {token_address}: {price}")
        
        return price

    except Exception as e:
        print(f"Error fetching price for {token_address}: {e}")
        return None


@app.get("/arbitrage/")
async def get_arbitrage_opportunities():
    get_token_prices()  # Update prices
    opportunities = find_arbitrage_opportunities()
    return {"arbitrage_opportunities": opportunities}

@app.get("/")
def home():
    return {"message": "Arbitrage Bot API is running!"}

@app.get("/prices")
async def get_prices():
    """Fetch real-time token prices from PancakeSwap & BakerySwap"""
    bnb_price_pancake = get_token_price(PANCAKESWAP_ROUTER, BNB)
    bnb_price_bakery = get_token_price(BAKERYSWAP_ROUTER, BNB)

    cake_price_pancake = get_token_price(PANCAKESWAP_ROUTER, CAKE)
    cake_price_bakery = get_token_price(BAKERYSWAP_ROUTER, CAKE)

    return {
        "BNB": {"PancakeSwap": bnb_price_pancake, "BakerySwap": bnb_price_bakery},
        "CAKE": {"PancakeSwap": cake_price_pancake, "BakerySwap": cake_price_bakery},
    }
