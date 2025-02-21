import React from "react";
import "./App.css";
import ArbitrageDashboard from "./components/ArbitrageDashboard";

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>Flash Loan Arbitrage Bot</h1>
      </header>
      <main>
        <ArbitrageDashboard />
      </main>
    </div>
  );
}

export default App;
