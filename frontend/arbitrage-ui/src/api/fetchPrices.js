export async function fetchPrices() {
    try {
        const response = await fetch("http://127.0.0.1:8000/prices");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching prices:", error);
        return null;
    }
}
