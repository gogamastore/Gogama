"use server";
import { suggestOptimalStockLevels, SuggestOptimalStockLevelsInput, SuggestOptimalStockLevelsOutput } from '@/ai/flows/suggest-optimal-stock-levels';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

/**
 * Fetches sales data for a specific product within a date range from Firestore.
 * @param productId The ID of the product to fetch sales data for.
 * @param startDate The start date of the period.
 * @param endDate The end date of the period.
 * @returns A promise that resolves to an array of sales data.
 */
export async function getSalesDataForProduct(productId: string, startDate: Date, endDate: Date) {
    const salesData: { orderDate: string; quantity: number }[] = [];
    
    const ordersQuery = query(
        collection(db, "orders"),
        where("status", "in", ["Shipped", "Delivered"]),
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate))
    );

    const querySnapshot = await getDocs(ordersQuery);
    querySnapshot.forEach(doc => {
        const order = doc.data();
        order.products?.forEach((product: any) => {
            if (product.productId === productId) {
                salesData.push({
                    orderDate: format(order.date.toDate(), 'yyyy-MM-dd'),
                    quantity: product.quantity
                });
            }
        });
    });

    return salesData;
}


/**
 * Calls the Genkit AI flow to get stock suggestions.
 * @param input The input data for the AI flow.
 * @returns A promise that resolves to the AI's suggestion.
 */
export async function getStockSuggestion(input: SuggestOptimalStockLevelsInput): Promise<SuggestOptimalStockLevelsOutput> {
  try {
    const result = await suggestOptimalStockLevels(input);
    return result;
  } catch (error) {
    console.error("Error getting stock suggestion:", error);
    throw new Error("Failed to get stock suggestion from AI.");
  }
}
