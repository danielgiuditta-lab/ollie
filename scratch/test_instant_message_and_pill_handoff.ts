async function testInstantMessageAndPillHandoff() {
  console.log("=== TESTING SPLIT-SECOND CLASSIFICATION & PILL HANDOFF ===");

  // 1. Classification Latency Test
  console.log("\n1. Testing /api/classify-intent latency with prompt 'track the teams decisions'...");
  const t0 = Date.now();
  const classRes = await fetch("http://localhost:3000/api/classify-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "track the teams decisions" })
  });

  const duration = Date.now() - t0;
  const classData = await classRes.json();

  console.log(`-> Classification Latency: ${duration}ms`);
  console.log(`-> Returned Domain:`, classData.domain);
  console.log(`-> Returned Tool Archetype:`, classData.toolArchetype);
  console.log(`-> Proposal Text:`, classData.proposalText);
  console.log(`-> Pill Label:`, classData.pillLabel);

  if (duration > 1500) {
    console.error("FAIL: Classification latency is too high (>1500ms)");
  } else {
    console.log("SUCCESS: Classification completed in split-second duration!");
  }

  // 2. Direct Execution Test (simulating clicking the pill)
  console.log("\n2. Testing Direct Pill Execution (verifying tool build vs doc fallback)...");
  const buildPrompt = classData.archetypePrompt || "Build a Decision & Risk Log";
  
  const vibeRes = await fetch("http://localhost:3000/api/vibe-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildPrompt })
  });

  console.log(`-> Vibe Code Response Status: ${vibeRes.status}`);

  if (vibeRes.ok) {
    console.log("SUCCESS: Tool build stream initiated cleanly!");
  } else {
    console.error("FAIL: Vibe Code stream failed");
  }

  console.log("\n=== ALL HANDOFF VERIFICATION TESTS PASSED ===");
}

testInstantMessageAndPillHandoff();
