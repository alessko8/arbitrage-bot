import json
from datetime import datetime

LOG_FILE = "logs/trade_log.json"

def log_trade(trade_data):
    """Log trade results to a file"""
    trade_data["timestamp"] = datetime.utcnow().isoformat()
    
    with open(LOG_FILE, "a") as file:
        file.write(json.dumps(trade_data) + "\n")
