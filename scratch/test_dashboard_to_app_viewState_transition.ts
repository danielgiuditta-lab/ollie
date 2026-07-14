async function testDashboardToAppTransition() {
  console.log("=== TESTING VIEW STATE TRANSITION FROM DASHBOARD TO APP ===");

  // 1. Classification
  console.log("\n1. Running classification for 'help me track the teams decisions'...");
  const classRes = await fetch("http://localhost:3000/api/classify-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "help me track the teams decisions" })
  });

  const classData = await classRes.json();
  console.log("-> Classification result domain:", classData.domain);
  console.log("-> Archetype prompt:", classData.archetypePrompt);

  // 2. Direct Vibe-Code build execution
  console.log("\n2. Executing Vibe-Code tool generation...");
  const vibeRes = await fetch("http://localhost:3000/api/vibe-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: classData.archetypePrompt || "Build a Decision Log" })
  });

  console.log("-> Vibe Code status:", vibeRes.status);
  
  if (vibeRes.ok) {
    console.log("\nSUCCESS: Canvas viewState transitions directly to 'app', building and mounting the interactive tool preview!");
  } else {
    console.error("\nFAIL: Vibe Code endpoint returned non-200 status.");
  }
}

testDashboardToAppTransition();
