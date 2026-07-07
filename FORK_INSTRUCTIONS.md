# 📁 How to Fork, Setup, Run, and Collaborate on Spaces Platform

Welcome to **Spaces Platform**! This document provides complete instructions for cloning, configuring environment settings/keys, running the application on your local machine, and collaborating with teammates via GitHub.

---

### 🔗 Repository Information
- **Original Repository**: [https://github.com/danielgiuditta-lab/Drive](https://github.com/danielgiuditta-lab/Drive)

---

### 🍴 Step 1: Fork or Clone the Repository

#### Option A: Forking (Recommended for external contributors or feature isolation)
1. Navigate to [https://github.com/danielgiuditta-lab/Drive](https://github.com/danielgiuditta-lab/Drive) on GitHub.
2. Click the **Fork** button in the top-right corner to create a copy in your personal GitHub account.
3. Clone your personal fork to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Drive.git
   cd Drive
   ```

#### Option B: Direct Clone (For core team collaborators)
If you have write permissions / collaborator access on `danielgiuditta-lab/Drive`:
```bash
git clone https://github.com/danielgiuditta-lab/Drive.git
cd Drive
```

---

### 📦 Step 2: Install Dependencies

Run the following command in your terminal to install all necessary Node.js dependencies:

```bash
npm install
```

---

### 🔑 Step 3: Environment Variables & GCP Settings

The codebase is pre-configured with smart fallbacks to work immediately, but you can set up custom keys if needed:

1. **Gemini AI API Key (`GEMINI_API_KEY`)**:
   - Create a `.env` file in the root directory (or copy `.env.example`):
     ```bash
     cp .env.example .env
     ```
   - Set your Gemini API key in `.env`:
     ```env
     GEMINI_API_KEY="your_gemini_api_key_here"
     ```

2. **Google OAuth Client ID (`VITE_GOOGLE_CLIENT_ID`)**:
   - **Default / Fallback**: The app includes a pre-configured Google Client ID in `src/main.tsx` calibrated for testing on `http://localhost:3000`.
   - **Custom Client ID**: If you want to use your own Google Cloud Console project, create an OAuth 2.0 Web Client ID in [Google Cloud Console](https://console.cloud.google.com/), add `http://localhost:3000` to *Authorized JavaScript origins*, and set it in `.env`:
     ```env
     VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
     ```

3. **Firebase / Firestore Database Configuration**:
   - `firebase-applet-config.json` is included in the repository. Firestore database integration for syncing and sharing workspaces will connect automatically when running locally. If disconnected, the app automatically degrades gracefully to local disk storage (`data/`).

---

### 🚀 Step 4: Run the Local Development Server

Start both the backend server and frontend Vite dev server with a single command:

```bash
npm run dev
```

Open your browser and visit: **[http://localhost:3000](http://localhost:3000)**

*(Note for CloudTop / Remote SSH users: If running on a remote server, remember to forward port 3000 to your local machine: `ssh -L 3000:localhost:3000 <your-host>`)*

---

### 🔄 Step 5: How Teammates Collaborate & Push Code Back

There are two primary ways to push code back depending on your team's workflow:

#### 1. Fork & Pull Request (PR) Workflow (Standard GitHub Model)
When teammates work on their own forks:
1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Commit and Push to Fork**:
   ```bash
   git add .
   git commit -m "Add new feature or fix"
   git push origin feature/my-new-feature
   ```
3. **Open a Pull Request (PR)**:
   - Go to your fork on GitHub (`https://github.com/YOUR_USERNAME/Drive`).
   - Click **Contribute** -> **Open Pull Request**.
   - Set the base repository to `danielgiuditta-lab/Drive` (`main` branch) and compare with your feature branch.
   - The repository owner (`danielgiuditta-lab`) will review and merge your code!

#### 2. Shared Repository Collaborator Workflow
If team members are added directly as **Collaborators** under `danielgiuditta-lab/Drive` Settings:
1. **Create a Branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Push Branch directly to original repo**:
   ```bash
   git push origin feature/my-new-feature
   ```
3. **Open PR inside the same repo**:
   - Go to `https://github.com/danielgiuditta-lab/Drive/pulls` and click **New pull request** to merge your branch into `main`.
