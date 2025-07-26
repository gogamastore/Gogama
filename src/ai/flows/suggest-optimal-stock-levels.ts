'use server';

/**
 * @fileOverview An AI-powered tool that analyzes order patterns and suggests optimal stock levels.
 *
 * - suggestOptimalStockLevels - A function that handles the suggestion of optimal stock levels.
 * - SuggestOptimalStockLevelsInput - The input type for the suggestOptimalStockLevels function.
 * - SuggestOptimalStockLevelsOutput - The return type for the suggestOptimalStockLevels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalStockLevelsInputSchema = z.object({
  orderHistory: z
    .string()
    .describe(
      'A JSON string representing the order history, including product IDs, quantities, and order dates.'
    ),
  productDetails: z
    .string()
    .describe(
      'A JSON string representing the product details, including product IDs and names.'
    ),
});
export type SuggestOptimalStockLevelsInput = z.infer<
  typeof SuggestOptimalStockLevelsInputSchema
>;

const SuggestOptimalStockLevelsOutputSchema = z.object({
  suggestedStockLevels: z
    .string()
    .describe(
      'A JSON string representing the suggested stock levels for each product, including product ID and suggested quantity.'
    ),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the suggested stock levels.'),
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
  prompt: `You are an AI assistant specializing in inventory management.
  Analyze the order history and product details provided to suggest optimal stock levels for each product.

  Order History: {{{orderHistory}}}
  Product Details: {{{productDetails}}}

  Consider order frequency, product combinations, and potential lead times to prevent shortages.
  Provide the suggested stock levels in JSON format, along with a clear explanation of your reasoning.
  `,
});

const suggestOptimalStockLevelsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalStockLevelsFlow',
    inputSchema: SuggestOptimalStockLevelsInputSchema,
    outputSchema: SuggestOptimalStockLevelsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
