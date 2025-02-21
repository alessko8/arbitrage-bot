export async function fetchArbitrageOpportunities() {
    try {
        const response = await fetch("http://127.0.0.1:8000/arbitrage/");
        if (!response.ok) {
            throw new Error("Failed to fetch arbitrage opportunities");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching arbitrage opportunities:", error);
        return { arbitrage_opportunities: [] }; // Return empty array on error
    }
}
