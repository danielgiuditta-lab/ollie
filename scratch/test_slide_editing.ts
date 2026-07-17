import fetch from 'node-fetch';
import assert from 'assert';

async function testSlideEditingMock() {
  console.log("=== Testing Mock Slide Editing via /api/doc-journey ===");

  const originalContent = `# Regulating Frontier AI — Global Policy Keynote Presentation

---

# Executive Policy Outlook & Regulatory Philosophy

- **Target Audience**: Foreign Policy Advisory Board & Technology Policy Summit
- **Core Essay Thesis**: Democratic governance must institute proactive institutional oversight without stifling open scientific inquiry.
- **Key Policy Mandate**: Harmonizing safety standards across international jurisdictions while maintaining public transparency.`;

  const startTime = Date.now();
  const res = await fetch("http://localhost:3000/api/doc-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "make this slide more concise",
      activeFileName: "AI Policy & Governance Keynote Outline.gslides",
      activeFileContent: originalContent,
      activeSlideIndex: 1
    })
  });

  if (!res.ok) {
    console.error("HTTP error status:", res.status);
    process.exit(1);
  }

  const fullStreamText = await res.text();
  const duration = Date.now() - startTime;
  console.log(`Stream finished in ${duration}ms.`);

  // Parse out doc content from the SSE events
  let docContent = "";
  const lines = fullStreamText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const parsed = JSON.parse(line.substring(6));
        if (parsed.text) {
          docContent += parsed.text;
        }
      } catch (e) {
        // Ignore parsing errors of non-JSON lines
      }
    }
  }

  console.log("Extracted response content:\n", docContent);

  const docMatch = docContent.match(/<doc>([\s\S]*?)<\/doc>/i);
  if (!docMatch) {
    console.error("FAILED: Response did not contain <doc>...</doc> block!");
    process.exit(1);
  }

  const updatedMarkdown = docMatch[1].trim();
  console.log("Updated slide markdown:\n", updatedMarkdown);

  // Assertions:
  // Slide 2 is the index 1 slide
  assert.ok(updatedMarkdown.includes("Foreign Policy Advisory Board"), "Should contain the shortened target audience");
  assert.ok(!updatedMarkdown.includes("Foreign Policy Advisory Board & Technology Policy Summit"), "Should NOT contain the original long target audience");
  assert.ok(updatedMarkdown.includes("Proactive governance without stifling open scientific inquiry"), "Should contain shortened essay thesis");
  assert.ok(updatedMarkdown.includes("Harmonizing safety standards while maintaining transparency"), "Should contain shortened policy mandate");
  
  // Slide 1 (index 0) should be untouched
  assert.ok(updatedMarkdown.includes("Regulating Frontier AI — Global Policy Keynote Presentation"), "Slide 1 should remain intact");

  console.log("✔ Slide editing mock E2E verification test passed successfully in " + duration + "ms!");
}

testSlideEditingMock().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
