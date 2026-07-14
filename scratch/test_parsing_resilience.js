function simulateStreamExtraction(deltas, steps) {
  let accumulatedOutput = "";
  for (const deltaText of deltas) {
    if (deltaText) {
      accumulatedOutput += deltaText;
    }
  }

  let fullModelOutput = "";
  if (steps && Array.isArray(steps)) {
    for (const step of steps) {
      const txt = step.text || 
                  step.code || 
                  step.output || 
                  (Array.isArray(step.content) ? step.content.map((c) => c.text || c.code || '').join('\n') : (step.content?.text || step.content?.code || '')) || 
                  "";
      if (txt) {
        fullModelOutput += (fullModelOutput ? "\n" : "") + txt;
      }
    }
  }

  let finalHtmlText = fullModelOutput.trim().length > 0 ? fullModelOutput : accumulatedOutput;
  const textToSearch = finalHtmlText.trim().length > 0 ? finalHtmlText : accumulatedOutput;

  const parsedFiles = [];
  const blockRegex = /(?:(?:<!--|\/\*|\/\/)\s*([a-zA-Z0-9_\-\.\/]+)\s*(?:-->|\*\/)?\s*)?```([a-z]*)\s*([\s\S]*?)(?:```|$)/gi;
  const matches = [...textToSearch.matchAll(blockRegex)];

  if (matches.length > 0) {
    for (const match of matches) {
      const precedingName = match[1];
      const lang = (match[2] || '').toLowerCase();
      let content = match[3].trim();
      let inferredName = precedingName || (lang === 'html' ? 'index.html' : '');
      if (lang === 'html' || content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) {
        inferredName = 'index.html';
      }
      if (inferredName === 'index.html') {
        parsedFiles.push({ name: 'index.html', content });
      }
    }
  }

  if (parsedFiles.length === 0) {
    const fallbackMatch = textToSearch.match(/(<!(?:DOCTYPE )?html[\s\S]*?(?:<\/html>|$))/i) || 
                         textToSearch.match(/(<html[\s\S]*?(?:<\/html>|$))/i) || 
                         textToSearch.match(/(<div[\s\S]*?(?:<\/div>|$))/i);
    if (fallbackMatch) {
      parsedFiles.push({ name: 'index.html', content: fallbackMatch[1].trim() });
    } else if (textToSearch.trim().length > 0) {
      parsedFiles.push({ name: 'index.html', content: textToSearch.trim() });
    }
  }

  return parsedFiles;
}

console.log("=== Testing 100% Stream Extraction Resilience ===");

// Scenario 1: Step type is 'thought' or 'agent' or 'unknown'
const deltas1 = ["I am building ", "your app...\n", "```html\n<!DOCTYPE html><html><body><h1>Decision Log</h1></body></html>\n```"];
const steps1 = [{ type: 'thought', text: "I am building your app...\n```html\n<!DOCTYPE html><html><body><h1>Decision Log</h1></body></html>\n```" }];
const res1 = simulateStreamExtraction(deltas1, steps1);
console.log("Test 1 (thought step type):", res1[0]?.name, "Content length:", res1[0]?.content?.length);
if (res1.length > 0 && res1[0].content.includes("Decision Log")) {
  console.log("✔ Test 1 PASS");
} else {
  throw new Error("Test 1 FAIL");
}

// Scenario 2: Raw HTML output without markdown ticks
const deltas2 = ["<!DOCTYPE html><html><body><h1>Raw HTML App</h1></body></html>"];
const steps2 = [{ type: 'tool_output', content: { text: "<!DOCTYPE html><html><body><h1>Raw HTML App</h1></body></html>" } }];
const res2 = simulateStreamExtraction(deltas2, steps2);
console.log("\nTest 2 (Raw HTML output without ticks):", res2[0]?.name, "Content length:", res2[0]?.content?.length);
if (res2.length > 0 && res2[0].content.includes("Raw HTML App")) {
  console.log("✔ Test 2 PASS");
} else {
  throw new Error("Test 2 FAIL");
}
// Scenario 3: Event object with direct { text: "..." } property (without event.delta)
function processEvent(event) {
  const eventType = event.event_type || event.type || event.event || event.kind || (event.interaction ? 'interaction.completed' : (event.delta || event.text ? 'step.delta' : 'unknown'));
  const deltaText = event.delta?.text || event.delta?.code || event.delta?.thought || event.delta?.query || event.delta?.content?.text || event.delta?.content?.code || event.text || event.code || (typeof event.content === 'string' ? event.content : (event.content?.text || event.content?.code || '')) || "";
  return { eventType, deltaText };
}

const rawEvent = { text: "<!DOCTYPE html><html><body><h1>Direct Text Event</h1></body></html>" };
const processed = processEvent(rawEvent);
console.log("\nTest 3 (Direct text property resolution): eventType:", processed.eventType, "deltaText length:", processed.deltaText.length);
if (processed.eventType === 'step.delta' && processed.deltaText.includes("Direct Text Event")) {
  console.log("✔ Test 3 PASS");
} else {
  throw new Error("Test 3 FAIL");
}

console.log("\nALL STREAM EXTRACTION VERIFICATION TESTS PASSED!");
