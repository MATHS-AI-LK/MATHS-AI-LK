# MATHS AI LK - Grade 10 Sri Lankan AI Math Tutor

A modern, high-performance web application designed for Sri Lankan Grade 10 students to solve Mathematics Part I and Part II questions using AI.

## Project Structure
```
maths_ai_lk/
├── index.html          # Main Frontend Interface
├── style.css           # Glassmorphism & Neon Dark Theme
├── script.js            # Interactive Chat & Logic
├── 404.html            # GitHub Pages Custom 404 Error Page
├── README.md           # Documentation
└── backend/
    ├── worker.js       # Cloudflare Worker Source Code
    └── wrangler.toml   # Cloudflare Deployment Config
```

## Setup Instructions

### 1. Cloudflare Worker Backend Setup
1. Install Wrangler CLI: `npm install -g wrangler`
2. Navigate to `backend/` folder.
3. Authenticate Cloudflare: `wrangler login`
4. Store your OpenAI API Secret Key safely:
   `wrangler secret put OPENAI_API_KEY`
5. Store your Vector Store ID (containing Grade 10 Textbooks Part I & II):
   `wrangler secret put VECTOR_STORE_ID`
6. Deploy Worker: `wrangler deploy`
7. Copy your deployed worker URL (e.g., `https://maths-ai-lk-backend.subdomain.workers.dev/api/chat`) and update `WORKER_URL` in `script.js`.

### 2. Textbook Vector Store Setup (OpenAI)
1. Go to OpenAI Dashboard -> Assistants / Vector Stores.
2. Create a Vector Store and upload Grade 10 Maths Part I & Part II PDFs.
3. Copy the `vs_...` Vector Store ID to Cloudflare secrets.

---

## 🇱🇰 Sinhala Deployment Instructions (GitHub Pages වෙත Upload කරන ආකාරය)

1. **GitHub Repository එකක් සෑදීම:**
   - GitHub.com වෙත ගොස් **New Repository** එකක් සාදන්න (උදා: `maths-ai-lk`).
   - Public ලෙස තෝරන්න.

2. **ගොනු Upload කිරීම:**
   - zip ගොනුව Extract කරන්න.
   - `index.html`, `style.css`, `script.js`, `404.html` සහ `README.md` යන මුලික ෆෝල්ඩරයේ ඇති ගොනු සියල්ල GitHub Repository එකේ Root එකට upload කරන්න.

3. **GitHub Pages සක්‍රීය කිරීම:**
   - Repository හි **Settings** -> **Pages** වෙත යන්න.
   - **Source** යටතේ `Deploy from a branch` තෝරන්න.
   - Branch එක `main` හෝ `master` ලෙස සහ Folder එක `/ (root)` ලෙස තෝරා **Save** කරන්න.
   - මිනිත්තු කිහිපයකින් ඔබේ වෙබ් අඩවිය සජීවී වේ!
