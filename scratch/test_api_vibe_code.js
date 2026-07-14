async function testVibeCodeEndpoint() {
  console.log("=== Testing /api/vibe-code HTTP Endpoint End-to-End ===");
  try {
    const res = await fetch("http://localhost:3000/api/vibe-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Build an interactive Decision and Risk Log tool",
        env_id: null
      })
    });

    console.log("HTTP Response Status:", res.status, res.statusText);
    if (!res.ok) {
      const errText = await res.text();
      console.error("HTTP ERROR response:", errText);
      process.exit(1);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunkCount++;
      const text = decoder.decode(value);
      accumulatedText += text;
      if (chunkCount <= 5) {
        console.log(`Received Chunk #${chunkCount}:`, text.slice(0, 150));
      }
    }

    console.log(`\nSUCCESS! Received ${chunkCount} chunks. Total length: ${accumulatedText.length} bytes.`);
    const hasHtml = accumulatedText.includes("<!DOCTYPE html") || accumulatedText.includes("<html") || accumulatedText.includes("<div");
    console.log("HTML code detected in output:", hasHtml);
    if (hasHtml) {
      console.log("✔ END-TO-END VERIFICATION PASS!");
    } else {
      console.error("❌ Output missing HTML structure");
      process.exit(1);
    }
  } catch (err) {
    console.error("Failed to execute testVibeCodeEndpoint:", err);
    process.exit(1);
  }
}

testVibeCodeEndpoint();
