
'use server';
import { config } from 'dotenv';
config();

// The AI flow is now loaded on-demand by the page that uses it,
// not globally during server startup. This prevents potential build errors.
// import '@/ai/flows/suggest-optimal-stock-levels.ts';
