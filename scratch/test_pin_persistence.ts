import assert from 'assert';

async function testPinPersistence() {
  console.log("=== Integration Test: Dual-Target Pin Persistence (Space & Home) ===");
  
  const testSpaceId = `space_pin_test_${Date.now()}`;
  const homeChatId = "home_guest";
  const artifactId = `artifact_doc_${Date.now()}`;

  // Test 1: Save pinned artifact to Space target
  const spacePayload = {
    id: testSpaceId,
    projectName: "Space Pinning Test Workspace",
    type: "space",
    pinnedArtifactIds: [artifactId]
  };

  const spacePostRes = await fetch(`http://localhost:3000/api/chats/${testSpaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spacePayload)
  });

  assert.strictEqual(spacePostRes.status, 200, `POST /api/chats/${testSpaceId} must return 200`);
  console.log("PASS: 1. Pinning artifact to Space target saved via POST /api/chats/:spaceId");

  const spaceGetRes = await fetch(`http://localhost:3000/api/chats/${testSpaceId}`);
  assert.strictEqual(spaceGetRes.status, 200, `GET /api/chats/${testSpaceId} must return 200`);
  const spaceData = await spaceGetRes.json();
  assert.deepStrictEqual(spaceData.pinnedArtifactIds, [artifactId], "Space pinnedArtifactIds must include the test artifact");
  console.log("PASS: 2. GET /api/chats/:spaceId verified pinnedArtifactIds persistence on Space target");

  // Test 2: Save pinned artifact to Home target
  const homeGetRes = await fetch(`http://localhost:3000/api/chats/${homeChatId}`);
  let homeData: any = {};
  if (homeGetRes.status === 200) {
    homeData = await homeGetRes.json();
  }
  const existingHomePins = homeData.pinnedArtifactIds || [];
  const updatedHomePins = Array.from(new Set([...existingHomePins, artifactId]));

  const homePostRes = await fetch(`http://localhost:3000/api/chats/${homeChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...homeData, id: homeChatId, pinnedArtifactIds: updatedHomePins })
  });
  assert.strictEqual(homePostRes.status, 200, `POST /api/chats/${homeChatId} must return 200`);
  console.log("PASS: 3. Pinning artifact to Home target saved via POST /api/chats/:homeId");

  const homeVerifyRes = await fetch(`http://localhost:3000/api/chats/${homeChatId}`);
  assert.strictEqual(homeVerifyRes.status, 200, `GET /api/chats/${homeChatId} must return 200`);
  const verifiedHomeData = await homeVerifyRes.json();
  assert.ok(verifiedHomeData.pinnedArtifactIds?.includes(artifactId), "Home pinnedArtifactIds must contain the newly pinned artifact");
  console.log("PASS: 4. GET /api/chats/:homeId verified pinnedArtifactIds persistence on Home target");

  // Test 3: Unpin artifact from Space target
  const unpinSpacePayload = { ...spaceData, pinnedArtifactIds: [] };
  await fetch(`http://localhost:3000/api/chats/${testSpaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unpinSpacePayload)
  });
  const unpinnedSpaceGet = await (await fetch(`http://localhost:3000/api/chats/${testSpaceId}`)).json();
  assert.deepStrictEqual(unpinnedSpaceGet.pinnedArtifactIds, [], "Space pinnedArtifactIds must be empty after unpinning");
  console.log("PASS: 5. Unpinning from Space target verified successfully!");

  console.log("\nALL DUAL-TARGET PIN PERSISTENCE TESTS PASSED PERFECTLY!");
}

testPinPersistence().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
