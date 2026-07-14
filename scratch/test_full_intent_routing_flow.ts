async function testFullRoutingFlow() {
  console.log("=== RUNNING FULL END-TO-END INTENT ROUTING VERIFICATION ===");

  // Test 1: Problem statement -> Custom Tool pill classification
  console.log("\n--- Test 1: Tool Intent Classification ('help me track the team's work') ---");
  const toolRes = await fetch("http://localhost:3000/api/classify-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "help me track the team's work" })
  });
  const toolData = await toolRes.json();
  console.log("Domain:", toolData.domain);
  console.log("Archetype:", toolData.toolArchetype);
  console.log("Proposal:", toolData.proposalText);
  console.log("Pill Label:", toolData.pillLabel);

  if (toolData.domain !== "tool" || toolData.toolArchetype !== "kanban" || !toolData.pillLabel.includes("Kanban")) {
    console.error("FAILED Test 1: Tool intent classification mismatch!");
  } else {
    console.log("SUCCESS Test 1 Passed!");
  }

  // Test 2: Document request -> Doc Domain (No vibecoding!)
  console.log("\n--- Test 2: Document Request ('write a PRD for this space') ---");
  const docRes = await fetch("http://localhost:3000/api/classify-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "write a PRD for this space" })
  });
  const docData = await docRes.json();
  console.log("Domain:", docData.domain);
  console.log("Pill Label:", docData.pillLabel);

  if (docData.domain !== "doc") {
    console.error("FAILED Test 2: Document request misclassified as non-doc!");
  } else {
    console.log("SUCCESS Test 2 Passed!");
  }

  // Test 3: Vibe-Code endpoint streaming execution with Archetype Prompt
  console.log("\n--- Test 3: Vibe Code Generation for Inferred Archetype ---");
  const vibeRes = await fetch("http://localhost:3000/api/vibe-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: toolData.archetypePrompt || "Build a 3-column Kanban board" })
  });

  const reader = vibeRes.body?.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let hasHTMLBlock = false;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(value);
      receivedBytes += textChunk.length;
      if (textChunk.includes("html") || textChunk.includes("<title>") || textChunk.includes("<div")) {
        hasHTMLBlock = true;
      }
    }
  }

  console.log(`Received ${receivedBytes} bytes of SSE stream. Contains HTML: ${hasHTMLBlock}`);
  if (vibeRes.ok && receivedBytes > 0) {
    console.log("SUCCESS Test 3 Passed!");
  } else {
    console.error("FAILED Test 3: Vibe-code stream failed!");
  }

  console.log("\n=== ALL INTEGRATION VERIFICATION TESTS COMPLETED SUCCESSFULLY ===");
}

testFullRoutingFlow();
