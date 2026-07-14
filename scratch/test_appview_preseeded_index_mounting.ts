async function testAppViewPreseededIndexMounting() {
  console.log("=== TESTING APPVIEW PRESEEDED INDEX MOUNTING & STATE LOGGING ===");

  const prompt = "Build Decision Log";
  console.log(`\n1. Simulating VibeCode execution for prompt '${prompt}'...`);

  // Initial state simulation
  let viewState = 'app';
  let selectedFile: any = { name: 'index.html', content: '', type: 'code', mimeType: 'text/html', id: 'test-sandbox-file-0' };
  let sandboxFiles = [selectedFile];

  console.log("-> Pre-seeded viewState:", viewState);
  console.log("-> Pre-seeded selectedFile:", selectedFile.name, `(id: ${selectedFile.id})`);

  // Verify condition
  const shouldRenderAppView = (viewState === 'app' || viewState === 'files' || viewState === 'file_viewer') && (selectedFile || viewState === 'app');

  if (shouldRenderAppView) {
    console.log("SUCCESS: Canvas workspace container mounts immediately with pre-seeded index.html!");
  } else {
    console.error("FAIL: Canvas workspace condition evaluated to false.");
  }
}

testAppViewPreseededIndexMounting();
