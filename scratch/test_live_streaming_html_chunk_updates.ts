function testLiveStreamingHtmlChunkUpdates() {
  console.log("=== TESTING LIVE HTML CHUNK STREAMING UPDATES ===");

  const accumulatedOutput = "```html\n<!DOCTYPE html>\n<html>\n<head><title>Decision Log</title></head>\n<body><h1>Live Decision Log</h1></body>\n</html>\n```";

  const rawHtmlMatch = accumulatedOutput.match(/(<!(?:DOCTYPE )?html[\s\S]*)/i) || 
                       accumulatedOutput.match(/(<html[\s\S]*)/i) || 
                       accumulatedOutput.match(/(<div[\s\S]*)/i) ||
                       accumulatedOutput.match(/```html\s*([\s\S]*)/i);

  let liveHtmlContent = rawHtmlMatch ? rawHtmlMatch[1].replace(/```$/g, '').trim() : "";

  console.log("-> Live extracted HTML length:", liveHtmlContent.length);
  console.log("-> Live extracted HTML preview:", liveHtmlContent.substring(0, 80));

  if (liveHtmlContent.includes("<h1>Live Decision Log</h1>")) {
    console.log("SUCCESS: Partial streaming HTML chunk extracted live for AppView rendering!");
  } else {
    console.error("FAIL: Partial streaming HTML chunk extraction failed.");
  }
}

testLiveStreamingHtmlChunkUpdates();
