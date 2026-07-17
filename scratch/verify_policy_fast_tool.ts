import http from 'http';

function postJson(path: string, payload: object): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk.toString());
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 200, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode || 200, data: raw });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function streamPost(path: string, payload: object): Promise<{ duration: number; text: string }> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const startTime = Date.now();
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk.toString());
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({ duration, text: raw });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runVerification() {
  console.log('--- Phase 1: Verify Intent Classification for "help me track client requests" ---');
  const userPrompt = 'help me track client requests';
  const intentRes = await postJson('/api/classify-intent', { prompt: userPrompt });

  console.log('Intent Result:', intentRes.data);
  const isClientReqArchetype = intentRes.data.toolArchetype === 'client_request_tracker';
  const proposalCorrect = intentRes.data.proposalText?.includes('Client Request Tracker');
  const pillCorrect = intentRes.data.pillLabel === 'Build Client Request Tracker';

  console.log('1. Correct Archetype (client_request_tracker):', isClientReqArchetype);
  console.log('2. Proposal Text Contains "Client Request Tracker":', proposalCorrect);
  console.log('3. Pill Label is "Build Client Request Tracker":', pillCorrect);

  if (!isClientReqArchetype || !proposalCorrect || !pillCorrect) {
    console.error('FAILED: Intent classification misidentified client request prompt!');
    process.exit(1);
  }

  console.log('\n--- Phase 2: Verify /api/vibe-code Fast Interception for Client Request Tracker ---');
  const vibeRes = await streamPost('/api/vibe-code', {
    prompt: userPrompt,
    chatId: 'space-1784214248389',
    env_id: 'remote'
  });

  console.log(`Stream Duration: ${vibeRes.duration}ms`);
  const containsToolHtml = vibeRes.text.includes('Trust & Safety Client Request Tracker');
  const containsCompletionMsg = vibeRes.text.includes('Your Client Request Tracker is ready');

  console.log('1. Output contains Client Request Tracker HTML:', containsToolHtml);
  console.log('2. Output contains completion message:', containsCompletionMsg);
  console.log('3. Fast duration (< 3000ms):', vibeRes.duration < 3000);

  if (containsToolHtml && containsCompletionMsg && vibeRes.duration < 3000) {
    console.log('\nSUCCESS: Both Client Request Intent Classification and Fast Tool Streaming passed!');
    process.exit(0);
  } else {
    console.error('FAILED: Vibe-code stream failed to intercept client request or took too long.');
    process.exit(1);
  }
}

runVerification();
