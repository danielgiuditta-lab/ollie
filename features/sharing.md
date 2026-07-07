# Feature Specification — Sharing & Collaborative Workspace Flows

The **Sharing Flow** implements an asynchronous, multiplayer MVP that enables authenticated users (e.g. validated `@google.com` team members) to easily distribute, view, and collaborate on live workspaces without complex real-time WebSocket infrastructures or manual Google Drive folder permissions synchronization.

---

## 1. Product & Architecture Overview
By utilizing an lightweight persistent indexing database (such as Google Cloud Firestore) acting as a secure lookup table, we establish a permanent association between custom-generated short links and active Antigravity Sandbox container identifies (`env_id`).

```
  User A (Owner)                           Firestore DB                       User B (Viewer)
 ─────────────────                         ────────────                       ───────────────
         │                                       │                                   │
  1. Click "Share"                               │                                   │
         ├───────────────────────────────────────┐                                   │
  2. Send active `env_id` to server              │                                   │
         │                                       │                                   │
  3. Server creates unique slug doc              │                                   │
         │     { slug: "x9a2b",                  │                                   │
         │       envId: "container_123" }        │                                   │
         │                                       │                                   │
  4. Copy short-link: `/?share=x9a2b`            │                                   │
         ├──────────────────────────────────────────────────────────────────────────>│
                                                 │                                   │ 5. Visit Shared URL
                                                 │                                   │
                                                 │                                   │ 6. Complete OAuth Sign-In
                                                 │                                   │
                                                 │                                   │ 7. Query `/api/share/x9a2b`
                                                 │<──────────────────────────────────┤
                                                 │                                   │
                                                 │   Return 'container_123'          │
                                                 ├──────────────────────────────────>│
                                                 │                                   │ 8. Restores sandbox state!
                                                                                     │    Mounts inside <Projector/>
```

---

## 2. Technical Database Schema
Firestore documents under the `/shards` namespace are defined by the following strict schema layout:

```json
{
  "id": "String (unique URL identifier / slug)",
  "envId": "String (the Antigravity container environment state identifier)",
  "workspaceName": "String (descriptive title of the workspace/prototype)",
  "owner": "String (verified email of the creator)",
  "createdAt": "Timestamp"
}
```

---

## 3. Step-by-Step Interactive Workflow

### Step 1: Link Generation (Owner Side)
1. Inside the workspace, the owner clicks **Share Link** located on the main control banner.
2. The UI makes an asynchronous API call to the backend server: `POST /api/share` carrying `{ envId: envId, name: workspaceName }`.
3. The Express handler secures this mapping in the Firestore collection, produces a randomized 8-character token (e.g. `x9a2b3df`), and returns it to the client.
4. The client copies the full address (e.g. `https://domain.app/?share=x9a2b3df`) to the clipboard, illustrating a beautiful success confirmation banner or toast.

### Step 2: Client URL Interception (Recipient Side)
1. When User B clicks on the shared URL, the React initializing engine inspects URL search parameters for `?share=X` or `?projector=X`.
2. **The Authentication Gate**: If User B is not authenticated, the app renders a clean **Google OAuth Sign-in View**, prompting them to log in using their enterprise profile.
3. **The Sandbox Recovery Fetch**: Once authenticated, the app calls `GET /api/share/${slug}`.
   * **If Valid**: The server returns `{ envId, workspaceName, owner }`.
   * **If Invalid**: Displays a clean "Workspace Not Found" or "Expired Share Link" card.
4. **Environment Binding**: The React application binds the returned `envId` into the local state. On the next in-app conversational chat prompts, it passes this `envId` to `/api/vibe-code`, ensuring User B's prompt commands execute inside the *exact same* sandboxed file workspace.
5. **Locked Viewer Mode**: By default, viewers are launched directly into our newly designed full-screen **Projector Mode** (`?mode=projector`) to interact with the finished product before choosing to open standard editor workflows or requesting edit access.
