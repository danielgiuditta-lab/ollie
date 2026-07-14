async function testClassifier() {
  const testCases = [
    { prompt: "write a PRD for this space", expectedDomain: "doc" },
    { prompt: "write a roadmap document based on this project", expectedDomain: "doc" },
    { prompt: "help me track the team's work", expectedDomain: "tool", expectedArchetype: "kanban" },
    { prompt: "help me manage software bugs and feedback", expectedDomain: "tool", expectedArchetype: "bug_tracker" },
    { prompt: "track our project decisions and risk mitigations", expectedDomain: "tool", expectedArchetype: "decision_risk_log" },
    { prompt: "manage design approvals and sign-offs", expectedDomain: "tool", expectedArchetype: "approval_queue" }
  ];

  console.log("=== RUNNING INTENT CLASSIFIER VERIFICATION TEST ===\n");

  let passed = 0;
  for (const tc of testCases) {
    try {
      const res = await fetch("http://localhost:3000/api/classify-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tc.prompt })
      });
      const data = await res.json();
      console.log(`Prompt: "${tc.prompt}"`);
      console.log(`  -> Domain: ${data.domain} (Expected: ${tc.expectedDomain})`);
      console.log(`  -> Archetype: ${data.toolArchetype}`);
      console.log(`  -> Proposal: "${data.proposalText}"`);
      console.log(`  -> Pill Label: "${data.pillLabel}"\n`);

      if (data.domain === tc.expectedDomain && (!tc.expectedArchetype || data.toolArchetype === tc.expectedArchetype)) {
        passed++;
      } else {
        console.warn(`  [FAIL] Did not match expected domain/archetype!`);
      }
    } catch (err) {
      console.error(`Error testing prompt "${tc.prompt}":`, err);
    }
  }

  console.log(`Results: ${passed}/${testCases.length} test cases passed.`);
}

testClassifier();
