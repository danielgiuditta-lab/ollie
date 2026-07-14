async function verifyUserPrompt() {
  const prompt = "help me track the teams decisions";
  const res = await fetch("http://localhost:3000/api/classify-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  console.log("\n=== VERIFYING USER'S PROMPT ===");
  console.log(`Prompt: "${prompt}"`);
  console.log(`Domain: ${data.domain}`);
  console.log(`Archetype: ${data.toolArchetype}`);
  console.log(`Proposal: "${data.proposalText}"`);
  console.log(`Pill Label: "${data.pillLabel}"`);
  console.log(`Archetype Prompt: "${data.archetypePrompt}"\n`);
}

verifyUserPrompt();
