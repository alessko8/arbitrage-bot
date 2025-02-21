import React, { useEffect, useState } from "react";
import { fetchPrices } from "../api/fetchPrices";
import { fetchArbitrageOpportunities } from "../api/fetchArbitrage";

const ArbitrageDashboard = () => {
  const [prices, setPrices] = useState({});
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const data = await fetchPrices();
        setPrices(data);
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    const loadOpportunities = async () => {
      try {
        const data = await fetchArbitrageOpportunities();
        setOpportunities(data.arbitrage_opportunities || []);
      } catch (error) {
        console.error("Error fetching arbitrage opportunities:", error);
      }
    };

    loadPrices();
    loadOpportunities();
    const interval = setInterval(() => {
      loadPrices();
      loadOpportunities();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Flash Loan Arbitrage Bot</h2>
      <h3>Token Prices</h3>
      <div className="prices">
        {Object.keys(prices).length > 0 ? (
          Object.entries(prices).map(([token, exchanges]) => (
            <div key={token}>
              <strong>{token}:</strong>{" "}
              {Object.entries(exchanges).map(([dex, price]) => (
                <span key={dex}>
                  {dex}: ${price ? price.toFixed(2) : "N/A"} |{" "}
                </span>
              ))}
            </div>
          ))
        ) : (
          <p>Loading prices...</p>
        )}
      </div>

      <h3>Arbitrage Opportunities</h3>
      <div className="opportunities">
        {opportunities.length > 0 ? (
          opportunities.map((opportunity, index) => (
            <p key={index}>
              Buy <strong>{opportunity.token}</strong> on{" "}
              <strong>{opportunity.buy_on}</strong> and sell on{" "}
              <strong>{opportunity.sell_on}</strong>. Estimated Profit:{" "}
              <strong>${opportunity.profit_per_1000.toFixed(2)}</strong> per{" "}
              $1000 trade ({opportunity.profit_percentage.toFixed(2)}%).
            </p>
          ))
        ) : (
          <p>No arbitrage opportunities detected.</p>
        )}
      </div>
    </div>
  );
};

export default ArbitrageDashboard;
