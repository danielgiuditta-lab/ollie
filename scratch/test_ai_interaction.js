import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testInteraction(envValue) {
  console.log(`\n--- Testing environment: ${JSON.stringify(envValue)} ---`);
  try {
    const payload = {
      agent: "antigravity-preview-05-2026",
      input: "Build a simple counter tool in HTML",
      system_instruction: "Output HTML code inside ```html ... ``` block.",
      stream: true,
    };
    if (envValue !== undefined) {
      payload.environment = envValue;
    }

    const interaction = await ai.interactions.create(payload, { timeout: 30000 });
    let count = 0;
    for await (const chunk of interaction) {
      count++;
      if (count <= 3) {
        console.log(`Chunk ${count}:`, JSON.stringify(chunk).slice(0, 100));
      }
    }
    console.log(`SUCCESS! Received ${count} total chunks for environment: ${JSON.stringify(envValue)}`);
  } catch (err) {
    console.error(`ERROR for environment ${JSON.stringify(envValue)}:`, err?.message || err);
  }
}

async function runAll() {
  await testInteraction("remote");
  await testInteraction(undefined);
  await testInteraction("");
}

runAll();
