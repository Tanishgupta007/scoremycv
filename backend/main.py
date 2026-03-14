from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import openai
import pdfplumber
import docx2txt
import io
import os
import json
import razorpay
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Resume Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")
razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)

# --- In-memory usage tracker (use Redis/DB in production) ---
usage_store = {}  # { email: scan_count }

FREE_LIMIT = 1  # 1 free scan


def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif filename.endswith(".docx"):
        return docx2txt.process(io.BytesIO(file_bytes))
    else:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files supported.")


def analyze_with_gpt(resume_text: str, job_role: str) -> dict:
    prompt = f"""
You are an expert ATS resume reviewer. Analyze the following resume for the role: "{job_role}".

Return a JSON object with exactly these fields:
{{
  "ats_score": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "missing_keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "section_scores": {{
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "formatting": <0-100>
  }},
  "verdict": "<one of: Strong, Good, Needs Work, Weak>"
}}

Resume:
{resume_text[:4000]}
"""
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    raw = response.choices[0].message.content
    # Strip markdown code blocks if present
    raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    return json.loads(raw)


# --- Routes ---

@app.get("/")
def root():
    return {"status": "AI Resume Analyzer API is running"}


@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: str = "Software Engineer",
    email: str = "guest",
):
    # Check free usage
    scans = usage_store.get(email, 0)
    if scans >= FREE_LIMIT:
        raise HTTPException(
            status_code=402,
            detail="Free limit reached. Please upgrade to continue.",
        )

    file_bytes = await file.read()
    resume_text = extract_text(file_bytes, file.filename)

    if len(resume_text.strip()) < 100:
        raise HTTPException(status_code=400, detail="Could not extract enough text from resume.")

    result = analyze_with_gpt(resume_text, job_role)

    # Increment usage
    usage_store[email] = scans + 1

    return {
        "success": True,
        "scans_used": usage_store[email],
        "free_limit": FREE_LIMIT,
        "data": result,
    }


@app.post("/create-order")
def create_order(data: dict):
    amount = data.get("amount", 29900)  # ₹299 in paise
    order = razorpay_client.order.create({
        "amount": amount,
        "currency": "INR",
        "payment_capture": 1,
    })
    return {"order_id": order["id"], "amount": amount}


@app.post("/verify-payment")
def verify_payment(data: dict):
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data["order_id"],
            "razorpay_payment_id": data["payment_id"],
            "razorpay_signature": data["signature"],
        })
        email = data.get("email", "guest")
        usage_store[email] = 0  # Reset usage after payment
        return {"success": True, "message": "Payment verified. Scans reset!"}
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed.")
