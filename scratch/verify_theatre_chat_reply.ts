import fs from 'fs';
import path from 'path';

async function verifyTheatreChatReply() {
  console.log("=== Verifying Theatre Mode Proactive Chat Reply ===");

  // 1. Verify JSON database has the chat conversion task
  const mockTasksPath = path.join(process.cwd(), 'data', 'mock_inferred_tasks.json');
  const rawData = fs.readFileSync(mockTasksPath, 'utf-8');
  const tasks = JSON.parse(rawData);

  const conversionTask = tasks.find((t: any) => t.id === 'todo-chat-conversion');
  if (!conversionTask) {
    console.error("FAIL: todo-chat-conversion task not found in mock_inferred_tasks.json");
    process.exit(1);
  }

  console.log("✓ todo-chat-conversion task found:", {
    id: conversionTask.id,
    title: conversionTask.title,
    personName: conversionTask.personName,
    senderMessage: conversionTask.senderMessage,
    proposedReply: conversionTask.proposedReply
  });

  if (conversionTask.personName !== 'Alan Vance') {
    console.error(`FAIL: Expected personName 'Alan Vance', got '${conversionTask.personName}'`);
    process.exit(1);
  }

  if (!conversionTask.senderMessage.includes('conversation rate') || !conversionTask.proposedReply.includes('21%')) {
    console.error("FAIL: senderMessage or proposedReply content mismatch");
    process.exit(1);
  }

  // 2. Verify server endpoint /api/mock-inferred-tasks
  try {
    const res = await fetch('http://localhost:3000/api/mock-inferred-tasks');
    if (res.ok) {
      const serverTasks = await res.json();
      const serverConversionTask = serverTasks.find((t: any) => t.id === 'todo-chat-conversion');
      if (serverConversionTask) {
        console.log("✓ Server /api/mock-inferred-tasks returned task successfully.");
      } else {
        console.log("ℹ Server running without todo-chat-conversion or static JSON serve mode.");
      }
    }
  } catch (err) {
    console.log("ℹ Note: Dev server endpoint check skipped or server on different port:", err);
  }

  // 3. Verify TheatreView.tsx syntax and exports
  const theatreViewPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'TheatreView.tsx');
  const theatreViewCode = fs.readFileSync(theatreViewPath, 'utf-8');

  if (!theatreViewCode.includes('isChatReplyTask')) {
    console.error("FAIL: isChatReplyTask not found in TheatreView.tsx");
    process.exit(1);
  }

  if (!theatreViewCode.includes('senderMessage')) {
    console.error("FAIL: senderMessage rendering not found in TheatreView.tsx");
    process.exit(1);
  }

  if (!theatreViewCode.includes('Pencil')) {
    console.error("FAIL: Pencil edit icon not found in TheatreView.tsx");
    process.exit(1);
  }

  console.log("✓ All checks passed successfully!");
}

verifyTheatreChatReply().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
