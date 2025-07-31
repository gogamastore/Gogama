'use server';

/**
 * @fileOverview An AI-powered tool that analyzes historical sales data for a specific product
 * to forecast demand and suggest optimal stock levels.
 *
 * - suggestOptimalStockLevels - A function that handles the stock level suggestion process.
 * - SuggestOptimalStockLevelsInput - The input type for the suggestOptimalStockLevels function.
 * - SuggestOptimalStockLevelsOutput - The return type for the suggestOptimalStockLevels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalesDataItemSchema = z.object({
  orderDate: z.string().describe('The date of the order in YYYY-MM-DD format.'),
  quantity: z.number().describe('The quantity of the product sold in that order.'),
});

const SuggestOptimalStockLevelsInputSchema = z.object({
  productName: z.string().describe('The name of the product being analyzed.'),
  currentStock: z.number().describe('The current stock level of the product.'),
  salesData: z
    .array(SalesDataItemSchema)
    .describe(
      'An array of sales data objects for the product over a specific period.'
    ),
  analysisPeriod: z
    .string()
    .describe(
      'The time period of the sales data provided (e.g., "30 days", "90 days").'
    ),
});
export type SuggestOptimalStockLevelsInput = z.infer<
  typeof SuggestOptimalStockLevelsInputSchema
>;

const SuggestOptimalStockLevelsOutputSchema = z.object({
  productName: z.string().describe('The name of the product analyzed.'),
  analysis: z.object({
    totalSold: z.number().describe('Total units sold during the period.'),
    salesTrend: z.string().describe('A brief description of the sales trend (e.g., "stable", "increasing", "seasonal").'),
    peakDays: z.array(z.string()).describe('Days or weeks with the highest sales.'),
  }),
  suggestion: z.object({
    nextPeriodStock: z.number().describe('The suggested stock quantity for the next period (e.g., next month).'),
    safetyStock: z.number().describe('A recommended safety stock or buffer quantity.'),
  }),
  reasoning: z
    .string()
    .describe('The detailed AI reasoning behind the stock level suggestion, explaining how the analysis led to the recommendation.'),
});
export type SuggestOptimalStockLevelsOutput = z.infer<
  typeof SuggestOptimalStockLevelsOutputSchema
>;

export async function suggestOptimalStockLevels(
  input: SuggestOptimalStockLevelsInput
): Promise<SuggestOptimalStockLevelsOutput> {
  return suggestOptimalStockLevelsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalStockLevelsPrompt',
  input: {schema: SuggestOptimalStockLevelsInputSchema},
  output: {schema: SuggestOptimalStockLevelsOutputSchema},
  prompt: `You are an expert inventory management AI for a retail business.
  Your task is to analyze the historical sales data for a product and provide a concrete stock level suggestion for the next month.

  Analyze the following data for the product "{{productName}}":
  - Current Stock: {{currentStock}}
  - Sales Period: Last {{analysisPeriod}}
  - Sales History (JSON): {{{json salesData}}}

  Your analysis should:
  1.  Calculate the total quantity sold.
  2.  Identify the sales trend (e.g., is it increasing, decreasing, stable, or seasonal?).
  3.  Pinpoint any peak sales days or weeks.

  Based on your analysis, provide a clear recommendation:
  1.  **Suggested Stock for Next Month:** Calculate a specific number of units to stock for the upcoming month. Consider the sales velocity and trend.
  2.  **Safety Stock:** Recommend a buffer quantity to avoid stockouts due to unexpected demand.
  3.  **Reasoning:** Provide a step-by-step explanation of how you arrived at your suggestion. Explain the trend you observed and how it influenced your forecast. Be clear and concise.

  Return the entire analysis and suggestion in the specified JSON output format.
  `,
});

const suggestOptimalStockLevelsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalStockLevelsFlow',
    inputSchema: SuggestOptimalStockLevelsInputSchema,
    outputSchema: SuggestOptimalStockLevelsOutputSchema,
  },
  async input => {
    // Optional: Add more complex logic here in the future, e.g., fetching supplier lead times.
    const {output} = await prompt(input);
    return output!;
  }
);
