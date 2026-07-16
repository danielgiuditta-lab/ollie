import fetch from 'node-fetch';

async function testFastKanbanStream() {
  console.log("=== Testing Fast H2 Kanban Streaming Endpoint with Completion Event ===");

  const res = await fetch("http://localhost:3000/api/vibe-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "help me track the H2 work",
      env_id: "remote"
    })
  });

  if (!res.ok) {
    console.error("HTTP error status:", res.status);
    process.exit(1);
  }

  let fullStreamText = "";
  const startTime = Date.now();

  for await (const chunk of res.body) {
    const str = chunk.toString();
    fullStreamText += str;
  }

  const duration = Date.now() - startTime;
  console.log(`Stream finished in ${duration}ms (${fullStreamText.length} bytes received).`);

  const hasHtml = fullStreamText.includes("H2 Patient Journey Kanban Board") && fullStreamText.includes("<!-- index.html -->");
  const hasCompletionEvent = fullStreamText.includes('"event_type":"interaction.completed"');

  if (hasHtml && hasCompletionEvent) {
    console.log("SUCCESS: Fast streaming returned pre-cached H2 Kanban tool HTML AND interaction.completed event!");
  } else {
    console.error("FAILED verification:", { hasHtml, hasCompletionEvent });
    process.exit(1);
  }
}

testFastKanbanStream().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
