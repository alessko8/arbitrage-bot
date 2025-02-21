import asyncio
import websockets
import json

DEX_WS_URL = "wss://bsc.dex.websocket.example"  # Replace with actual DEX WebSocket

async def fetch_live_prices():
    """Fetch live token prices using WebSockets from DEX"""
    async with websockets.connect(DEX_WS_URL) as ws:
        await ws.send(json.dumps({"method": "subscribe", "params": ["prices"]}))
        while True:
            response = await ws.recv()
            prices = json.loads(response)
            print("Live Prices:", prices)  # Debugging
            return prices

# Example Usage
if __name__ == "__main__":
    asyncio.run(fetch_live_prices())
