import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runVerification() {
  console.log("=== Autonomous Pre-Verification Test: Segmented Inferred Tasks Spec & Categorization ===");
  let failures = 0;

  console.log("\n1. Fetching mock inferred tasks from endpoint '/api/mock-inferred-tasks'...");
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/mock-inferred-tasks',
      method: 'GET'
    });

    if (res.status === 200) {
      console.log("   ✅ GET /api/mock-inferred-tasks succeeded with status 200!");
      const tasks = res.data;

      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.error("   ❌ Failed: Mock tasks is not an array or is empty.");
        failures++;
      } else {
        console.log(`   ✅ Fetched ${tasks.length} mock tasks successfully.`);

        // Validate each task schema matches new specification
        const validCategories = new Set(['needs_approval', 'needs_input', 'fyi']);
        const validTypes = new Set(['email', 'chat', 'comment', 'calendar', 'buganizer', 'doc', 'slide', 'sheet', 'fyi']);

        tasks.forEach((task, index) => {
          console.log(`\n   Analyzing Task [${index + 1}] - ID: ${task.id}, Title: "${task.title}"`);
          
          // Verify category field
          if (!task.category) {
            console.error("     ❌ Failed: Missing 'category' field!");
            failures++;
          } else if (!validCategories.has(task.category)) {
            console.error(`     ❌ Failed: Invalid category value "${task.category}". Must be one of: ${[...validCategories].join(', ')}`);
            failures++;
          } else {
            console.log(`     ✅ Category: "${task.category}"`);
          }

          // Verify type field
          if (!task.type) {
            console.error("     ❌ Failed: Missing 'type' field!");
            failures++;
          } else if (!validTypes.has(task.type)) {
            console.error(`     ❌ Failed: Invalid type value "${task.type}". Must be one of: ${[...validTypes].join(', ')}`);
            failures++;
          } else {
            console.log(`     ✅ Type: "${task.type}"`);
          }

          // Verify FYI link structure
          if (task.category === 'fyi') {
            if (task.links) {
              if (!Array.isArray(task.links)) {
                console.error("     ❌ Failed: FYI task links field is not an array!");
                failures++;
              } else {
                task.links.forEach((link, lIdx) => {
                  if (!link.label || !link.url) {
                    console.error(`     ❌ Failed: Link [${lIdx + 1}] is missing label or url:`, link);
                    failures++;
                  } else {
                    console.log(`     ✅ Valid Link [${lIdx + 1}]: "${link.label}" -> ${link.url}`);
                  }
                });
              }
            } else {
              console.log("     ℹ️ FYI task has no optional links array.");
            }
          }
        });

        // Ensure all three buckets are represented at least once in the mock data
        const categoriesSeen = new Set(tasks.map(t => t.category));
        console.log(`\n   Categories represented in mock database:`, [...categoriesSeen]);
        ['needs_approval', 'needs_input', 'fyi'].forEach(cat => {
          if (!categoriesSeen.has(cat)) {
            console.error(`   ❌ Failed: Category "${cat}" is not represented in the mock database!`);
            failures++;
          } else {
            console.log(`   ✅ Category "${cat}" is represented.`);
          }
        });
      }
    } else {
      console.error(`   ❌ Failed: GET returned status ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error connecting to backend server:", err.message);
    failures++;
  }

  console.log("\n==================================================");
  if (failures === 0) {
    console.log("RESULT: ALL SEGMENTED INFERRED TASKS VERIFICATION TESTS PASSED! ✅");
    process.exit(0);
  } else {
    console.error(`RESULT: ${failures} TEST(S) FAILED! ❌`);
    process.exit(1);
  }
}

runVerification();
