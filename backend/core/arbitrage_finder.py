def find_arbitrage_opportunities(prices):
    """Detect arbitrage opportunities with real-time data"""
    opportunities = []
    for pair, data in prices.items():
        buy_price = min(data.values())  # Find lowest price
        sell_price = max(data.values())  # Find highest price
        
        if sell_price > buy_price * 1.005:  # Ensure minimum 0.5% profit margin
            opportunities.append({
                "pair": pair,
                "buy_from": [dex for dex, price in data.items() if price == buy_price][0],
                "sell_to": [dex for dex, price in data.items() if price == sell_price][0],
                "profit": round(sell_price - buy_price, 6)
            })
    return opportunities
