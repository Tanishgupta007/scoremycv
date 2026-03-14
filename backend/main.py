from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import pdfplumber
import docx2txt
import io
import os
import json
import razorpay
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Resume Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID", "dummy"), os.getenv("RAZORPAY_KEY_SECRET", "dummy"))
)

usage_store = {}
FREE_LIMIT = 1


def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif filename.endswith(".docx"):
        return docx2txt.process(io.BytesIO(file_bytes))
    else:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files supported.")


def analyze_with_groq(resume_text: str, job_role: str, job_description: str = "") -> dict:
    jd_section = ""
    if job_description.strip():
        jd_section = f"""
A specific job description has been provided. Compare the resume against it.

Job Description:
\"\"\"{job_description[:3000]}\"\"\"

Populate the jd_match object with real data from comparing resume vs job description.
"""
    else:
        jd_section = "No job description provided. Set jd_match to null."

    prompt = f"""
You are an expert ATS resume reviewer. Analyze the following resume for the role: "{job_role}".

{jd_section}

Return ONLY a valid JSON object. No extra text, no markdown, no code blocks, just raw JSON:
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
  "verdict": "<one of: Strong, Good, Needs Work, Weak>",
  "jd_match": null
}}

Resume:
{resume_text[:4000]}
"""

    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.lstrip("```json").lstrip("```").rstrip("```").strip()
    return json.loads(raw)


@app.get("/")
def root():
    return {"status": "AI Resume Analyzer API is running"}


@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: str = "Software Engineer",
    job_description: str = "",
    email: str = "guest",
):
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

    result = analyze_with_groq(resume_text, job_role, job_description)
    usage_store[email] = scans + 1

    return {
        "success": True,
        "scans_used": usage_store[email],
        "free_limit": FREE_LIMIT,
        "data": result,
    }


@app.post("/create-order")
def create_order(data: dict):
    amount = data.get("amount", 29900)
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
        usage_store[email] = 0
        return {"success": True, "message": "Payment verified. Scans reset!"}
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed.")
