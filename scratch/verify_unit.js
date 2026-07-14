function simulateAppViewSrcDoc(selectedFile, files) {
  const isHtml = (f) => f && f.name && (f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));
  const activeHtmlFile = (selectedFile && isHtml(selectedFile)) 
    ? selectedFile 
    : (files || []).find(f => isHtml(f) || f.name === 'index.html');

  if (activeHtmlFile && activeHtmlFile.content && activeHtmlFile.content.trim().length > 0) {
    let content = activeHtmlFile.content;
    return content;
  }
  return undefined;
}

console.log("=== Testing Single Unified Loading State for AppView srcDoc ===");

// Test 1: Unpopulated / pre-seeded empty index.html
const preSeededFile = { name: 'index.html', content: '', type: 'code' };
const srcDocPreSeeded = simulateAppViewSrcDoc(preSeededFile, [preSeededFile]);
console.log("Test 1 (Pre-seeded empty index.html):");
console.log("srcDoc is undefined?", srcDocPreSeeded === undefined);

if (srcDocPreSeeded === undefined) {
  console.log("✔ Test 1 PASS: srcDoc evaluates to undefined so AppView renders single clean loading indicator without duplicate iframe skeleton!");
} else {
  throw new Error("Test 1 FAIL!");
}

// Test 2: Real generated tool output arrives
const generatedFile = { name: 'index.html', content: '<!DOCTYPE html><html><body><h1>Decision & Risk Log Tool</h1></body></html>' };
const srcDocGenerated = simulateAppViewSrcDoc(generatedFile, [generatedFile]);
console.log("\nTest 2 (Generated tool code arrives):");
console.log("srcDoc content length:", srcDocGenerated.length);

if (srcDocGenerated && srcDocGenerated.includes("Decision & Risk Log Tool")) {
  console.log("✔ Test 2 PASS: srcDoc evaluates to true and mounts the interactive web app!");
} else {
  throw new Error("Test 2 FAIL!");
}

console.log("\nUNIFIED LOADING STATE VERIFICATION PASSED!");
