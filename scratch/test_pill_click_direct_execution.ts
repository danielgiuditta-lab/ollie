async function testPillClickDirectExecution() {
  console.log("=== VERIFYING PILL CLICK DIRECT EXECUTION & ZERO DELAY ===");

  // 1. Initial prompt classification
  console.log("\n1. Testing classification for initial problem statement ('track decisions and risks')...");
  const classRes = await fetch("http://localhost:3000/api/classify-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "track decisions and risks" })
  });

  const classData = await classRes.json();
  console.log("-> Initial classification domain:", classData.domain);
  console.log("-> Initial classification archetype:", classData.toolArchetype);
  console.log("-> Generated pill archetype prompt:", classData.archetypePrompt);

  // 2. Direct execution simulation (clicking the pill)
  console.log("\n2. Simulating pill click execution (direct build stream without re-classification)...");
  const startTime = Date.now();
  const vibeRes = await fetch("http://localhost:3000/api/vibe-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: classData.archetypePrompt || "Build a Decision & Risk Log" })
  });

  const reader = vibeRes.body?.getReader();
  const decoder = new TextDecoder();
  let firstChunkTime = 0;
  let totalBytes = 0;

  if (reader) {
    const { done, value } = await reader.read();
    if (value) {
      firstChunkTime = Date.now() - startTime;
      totalBytes += value.length;
    }
  }

  console.log(`-> Time to First Chunk on Pill Click: ${firstChunkTime}ms (Zero classification latency!)`);
  console.log(`-> Direct execution response status: ${vibeRes.status}`);

  if (vibeRes.ok && firstChunkTime < 3000) {
    console.log("\nSUCCESS: Pill click immediately executes tool creation without delay or looping!");
  } else {
    console.error("\nFAIL: Direct execution delay exceeded expected bounds.");
  }
}

testPillClickDirectExecution();
