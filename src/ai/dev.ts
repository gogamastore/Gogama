'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-optimal-stock-levels.ts';
import '@/ai/flows/send-chat-message.ts';
