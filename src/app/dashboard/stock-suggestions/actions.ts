"use server";
import { suggestOptimalStockLevels, SuggestOptimalStockLevelsInput, SuggestOptimalStockLevelsOutput } from '@/ai/flows/suggest-optimal-stock-levels';

export async function getStockSuggestion(input: SuggestOptimalStockLevelsInput): Promise<SuggestOptimalStockLevelsOutput> {
  try {
    const result = await suggestOptimalStockLevels(input);
    return result;
  } catch (error) {
    console.error("Error getting stock suggestion:", error);
    throw new Error("Failed to get stock suggestion from AI.");
  }
}
