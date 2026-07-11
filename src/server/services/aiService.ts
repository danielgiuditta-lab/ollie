import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';

let aiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Gemini] Warning: GEMINI_API_KEY is not defined. AI interactions will be unavailable.");
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (err) {
      console.error("[Gemini] Failed to initialize GoogleGenAI client:", err);
      return null;
    }
  }
  return aiClient;
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error.status || error.statusCode || (error.response && error.response.status);
    const isRateLimitOrTransient = 
      status === 429 || 
      status === 503 || 
      status === 500 || 
      (error.message && (
        error.message.includes("503") || 
        error.message.includes("429") || 
        error.message.includes("high demand") || 
        error.message.includes("overloaded") ||
        error.message.includes("ResourceExhausted") ||
        error.message.includes("Unavailable")
      ));
    
    if (retries > 0 && isRateLimitOrTransient) {
      console.warn(`[Gemini API] Transient error (status: ${status}). Retrying in ${delay}ms... Error: ${error.message || error}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
