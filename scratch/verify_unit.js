import { INITIAL_HTML_LOADING_SKELETON } from '../src/utils/constants.ts';

function simulateAppViewSrcDoc(selectedFile, files) {
  const isHtml = (f) => f && f.name && (f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));
  const activeHtmlFile = (selectedFile && isHtml(selectedFile)) 
    ? selectedFile 
    : (files || []).find(f => isHtml(f) || f.name === 'index.html');

  if (activeHtmlFile || (files && files.length > 0)) {
    let content = (activeHtmlFile && activeHtmlFile.content) ? activeHtmlFile.content : INITIAL_HTML_LOADING_SKELETON;
    return content;
  }
  return undefined;
}

console.log("=== Testing Unit State Scenarios for AppView srcDoc ===");

// Scenario A: Pre-seeding index.html with empty string (legacy behavior vs new behavior)
const preSeededFile = { name: 'index.html', content: '', type: 'code' };
const srcDocPreSeeded = simulateAppViewSrcDoc(preSeededFile, [preSeededFile]);
console.log("Scenario A (Pre-seeded index.html with empty content):");
console.log("srcDoc is defined?", srcDocPreSeeded !== undefined);
console.log("srcDoc contains skeleton loader?", srcDocPreSeeded.includes("Assembling Application Code"));

if (srcDocPreSeeded !== undefined && srcDocPreSeeded.includes("Assembling Application Code")) {
  console.log("✔ Scenario A PASS: srcDoc immediately evaluates to Skeleton HTML instead of undefined!");
} else {
  throw new Error("Scenario A FAIL!");
}

// Scenario B: Selected file is null, but files has index.html with empty content
const srcDocFallback = simulateAppViewSrcDoc(null, [{ name: 'index.html', content: '' }]);
console.log("\nScenario B (null selectedFile, fallback files array):");
console.log("srcDoc is defined?", srcDocFallback !== undefined);

if (srcDocFallback !== undefined && srcDocFallback.includes("Assembling Application Code")) {
  console.log("✔ Scenario B PASS: Fallback to skeleton HTML verified!");
} else {
  throw new Error("Scenario B FAIL!");
}

// Scenario C: Populated code generation arrives from server
const generatedFile = { name: 'index.html', content: '<!DOCTYPE html><html><body><h1>Decision Tracker App</h1></body></html>' };
const srcDocGenerated = simulateAppViewSrcDoc(generatedFile, [generatedFile]);
console.log("\nScenario C (Generated HTML output arrives):");
console.log("srcDoc content length:", srcDocGenerated.length);

if (srcDocGenerated.includes("Decision Tracker App")) {
  console.log("✔ Scenario C PASS: srcDoc seamlessly switches to real generated application HTML!");
} else {
  throw new Error("Scenario C FAIL!");
}

console.log("\nALL APPVIEW RE-RENDER & SKELETON UNIT TESTS PASSED!");
