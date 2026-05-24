# ResumeAI — AI-Powered ATS CV Builder

Free, no-signup CV builder powered by Claude AI. Generates ATS-optimized resumes with one click.

## 🚀 Deploy on GitHub Pages (Free)

### Step 1 — Upload to GitHub
1. Go to **github.com** → sign in → click **"New repository"**
2. Name it `resumeai` → click **"Create repository"**
3. Upload all these files (drag & drop or use GitHub Desktop)

### Step 2 — Edit 2 lines
Open `package.json` and change:
```
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/resumeai"
```
Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

Open `vite.config.js` — the `base: '/resumeai/'` should match your repo name (it already does if you named it `resumeai`).

### Step 3 — Install & Deploy
Open terminal in the project folder:
```bash
npm install
npm run deploy
```

That's it. Your site is live at:
`https://YOUR_GITHUB_USERNAME.github.io/resumeai`

---

## 💻 Run Locally
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`

---

## 📁 Project Structure
```
resumeai/
├── index.html          # HTML entry point
├── vite.config.js      # Vite config (set base URL here)
├── package.json        # Scripts + dependencies
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx         # Main application component
    ├── App.css         # All component styles
    ├── index.css       # Global CSS variables & reset
    ├── atsBuilder.js   # ATS-optimized HTML generator
    └── useAI.js        # Claude API hook
```

## ✦ Features
- 5-step guided form
- AI writes professional summary, experience bullets, and suggests skills
- Live preview updates as you type
- Downloads ATS-optimized HTML → open in browser → Ctrl+P → PDF
- 100% free, no backend needed
