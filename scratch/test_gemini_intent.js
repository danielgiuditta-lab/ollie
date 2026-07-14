import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are an expert intent router for an AI workspace.
Analyze the user's natural language request and classify it into JSON format.

CRITICAL CLASSIFICATION RULES:

1. DOMAIN = "doc":
   - IF the user asks to write, draft, create, edit, summarize, or produce a document, PRD, specification, design spec, report, text article, written proposal, or roadmap (e.g., "write a doc", "write a PRD for this space", "write a roadmap document based on this project", "draft a proposal", "create a roadmap doc"):
   - You MUST set "domain": "doc" and "toolArchetype": null.
   - Set "proposalText": "Would you like me to draft a document for this request?"
   - Set "pillLabel": "Draft Document"
   - YOU ARE STRICTLY FORBIDDEN from classifying document, PRD, or roadmap requests as "tool"!

2. DOMAIN = "slide":
   - IF the user explicitly requests a presentation, slide deck, or slides (e.g., "make a slide deck"), set "domain": "slide" and "toolArchetype": null.

3. DOMAIN = "organize":
   - IF the user asks to organize, sort, move, or clean up workspace files (e.g., "organize my files"), set "domain": "organize" and "toolArchetype": null.

4. DOMAIN = "tool":
   - IF the user describes a workflow problem, task tracking, bug tracking, risk management, approval queue, or requests an interactive software application or web app (e.g., "help me track the team's work", "help me manage software bugs", "track our project decisions and risk mitigations", "manage design approvals and sign-offs", "help me track unreplied emails"):
   - Set "domain": "tool"
   - Select the optimal "toolArchetype":
     * "kanban": MANDATORY for any prompt mentioning "track work", "track team work", "track tasks", "kanban board" (e.g. "help me track the team's work", "help me track my team's tasks")
     * "bug_tracker": for software defects, bug reports, issues, feedback ("help me manage software bugs", "bug tracker")
     * "decision_risk_log": for decisions, risk registers, mitigations ("track project decisions and risk mitigations", "risk log")
     * "approval_queue": for review queues, sign-offs, pending approvals ("manage design approvals", "approval queue")
     * "action_agenda": for task lists, meeting action items, unreplied emails ("track unreplied emails", "action item list")
     * "custom": for any other interactive tool.

EXAMPLES:
Input: "write a PRD for this space" -> {"domain": "doc", "toolArchetype": null, "proposalText": "Would you like me to draft a Product Requirement Document (PRD) for this space?", "pillLabel": "Draft PRD"}
Input: "write a roadmap document based on this project" -> {"domain": "doc", "toolArchetype": null, "proposalText": "Would you like me to draft a Roadmap document for this project?", "pillLabel": "Draft Roadmap"}
Input: "help me track the team's work" -> {"domain": "tool", "toolArchetype": "kanban", "proposalText": "Would you like me to build a **Kanban Board** to track the team's work?", "pillLabel": "Build Kanban Board"}
Input: "help me manage software bugs and feedback" -> {"domain": "tool", "toolArchetype": "bug_tracker", "proposalText": "Would you like me to build a **Bug Tracker** to manage software defects and feedback?", "pillLabel": "Build Bug Tracker"}
Input: "track our project decisions and risk mitigations" -> {"domain": "tool", "toolArchetype": "decision_risk_log", "proposalText": "Would you like me to build a **Decision & Risk Log** to track decisions and risks?", "pillLabel": "Build Decision & Risk Log"}
Input: "manage design approvals and sign-offs" -> {"domain": "tool", "toolArchetype": "approval_queue", "proposalText": "Would you like me to build an **Approval Queue** to manage design approvals?", "pillLabel": "Build Approval Queue"}

OUTPUT ONLY VALID JSON:
{
  "domain": "doc" | "slide" | "organize" | "tool",
  "toolArchetype": "kanban" | "bug_tracker" | "decision_risk_log" | "approval_queue" | "action_agenda" | "custom" | null,
  "proposalText": string,
  "pillLabel": string,
  "archetypePrompt": string
}`;

  const testPrompts = [
    "help me track the teams decisions",
    "write a roadmap document based on this project",
    "manage design approvals and sign-offs"
  ];

  for (const prompt of testPrompts) {
    console.log(`\n--- Testing prompt: "${prompt}" ---`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${systemPrompt}\n\nUser request: "${prompt}"`,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 256,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      console.log("Response text:", response.text);
    } catch (e) {
      console.error("Gemini call error:", e.message || e);
    }
  }
}

testGemini();
