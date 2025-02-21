import random

def simulate_trade(opportunity):
    """Simulate an arbitrage trade execution"""
    simulated_gas = random.uniform(0.0001, 0.001)  # Simulated gas cost in BNB
    estimated_profit = opportunity["profit"] - simulated_gas
    
    return {
        "pair": opportunity["pair"],
        "buy_from": opportunity["buy_from"],
        "sell_to": opportunity["sell_to"],
        "profit_after_gas": round(estimated_profit, 6),
        "gas_cost": simulated_gas,
        "executed": estimated_profit > 0  # Only executes if profitable
    }
