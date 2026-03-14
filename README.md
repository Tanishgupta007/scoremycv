# ⚡ ResumeAI — AI Resume Analyzer

Fully automated SaaS. Users upload a resume → get an ATS score + feedback → pay to unlock unlimited scans. Zero manual work after setup.

---

## 📁 Project Structure

```
resume-analyzer/
├── backend/          ← FastAPI (Python)
│   ├── main.py
│   ├── requirements.txt
│   ├── render.yaml
│   └── .env.example
└── frontend/         ← React + Vite
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── pages/Upload.jsx
    │   └── pages/Results.jsx
    ├── index.html
    ├── package.json
    └── .env.example
```

---

## 🚀 Setup (Step by Step)

### Step 1 — Get API Keys

| Service | Where to get | Cost |
|---|---|---|
| OpenAI | platform.openai.com | Pay per use (~₹0.5/scan) |
| Razorpay | dashboard.razorpay.com | Free, 2% per transaction |

---

### Step 2 — Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Copy and fill in your keys
cp .env.example .env
# Edit .env with your OPENAI_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# Run locally
uvicorn main:app --reload
# → http://localhost:8000
```

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install

# Copy and fill in your keys
cp .env.example .env
# Edit VITE_API_URL=http://localhost:8000 (local) or your Render URL
# Edit VITE_RAZORPAY_KEY=rzp_test_... (from Razorpay dashboard)

# Run locally
npm run dev
# → http://localhost:5173
```

---

### Step 4 — Deploy Backend to Render (Free)

1. Push your code to GitHub
2. Go to render.com → New → Web Service
3. Connect your GitHub repo, select `/backend` folder
4. Set environment variables:
   - `OPENAI_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Deploy → copy your URL (e.g. https://resume-analyzer-xyz.onrender.com)

---

### Step 5 — Deploy Frontend to Vercel (Free)

```bash
npm install -g vercel
cd frontend
vercel
# Follow prompts, set VITE_API_URL to your Render backend URL
```

Or connect GitHub repo to vercel.com for auto-deploy.

---

## 💰 Monetization

- **Free tier:** 1 scan per email (tracked in-memory; use Redis/PostgreSQL for production)
- **Paid tier:** ₹299/month → unlimited scans via Razorpay
- **Upgrade prompt:** auto-shown after free scan is used

---

## 📈 How to Get First Users

1. Post on Reddit: r/developersIndia, r/cscareerquestions, r/jobs
2. Share on LinkedIn with a sample resume screenshot
3. List on Product Hunt
4. Post in Telegram/WhatsApp job groups

---

## 🔧 Production Upgrades (when you're ready)

- Replace in-memory `usage_store` with PostgreSQL / Redis
- Add email reports (SendGrid)
- Add job description matching (paste JD → compare with resume)
- Add resume rewrite feature (premium tier)
