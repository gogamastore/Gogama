
"use server";
import { suggestOptimalStockLevels, SuggestOptimalStockLevelsInput, SuggestOptimalStockLevelsOutput } from '@/ai/flows/suggest-optimal-stock-levels';

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

    