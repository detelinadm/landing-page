import os
import time
from datetime import date
from typing import Dict, Tuple
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles 
from fastapi.templating import Jinja2Templates
from starlette.requests import Request 
from openai import OpenAI 

load_dotenv()

STARTUP_TIME = time.time()
app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

def env(name: str, default: str = "unknown") -> str:
    return os.getenv(name, default)

@app.get("/api/health")
async def health_check():
    return JSONResponse(content={"status": "healthy"}, status_code=200)

@app.get("/api/ready")
async def ready_check():
    return JSONResponse(content={"status": "ready"}, status_code=200)

@app.get("/api/version")
async def version():
    return {
        "git_sha": env("GIT_SHA"),
        "build_time": env("BUILD_TIME"),
        "environment": env("APP_ENV", "local"),
        "service": env("SERVICE_NAME", "landing_page")
    }

def format_uptime(seconds: float) -> str:
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours}h {minutes}m {seconds}s"

@app.get("/api/uptime")
async def uptime():
    return JSONResponse(content={"uptime": format_uptime(time.time() - STARTUP_TIME)}, status_code=200)

@app.get("/home", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    DEEPSEEK_API_KEY = ""

ds_client = OpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",  
)

CV_PATH = "app/data/cv.txt"
try:
    with open(CV_PATH, "r", encoding="utf-8") as f:
        CV_TEXT = f.read()
except FileNotFoundError:
    CV_TEXT = ""

# Limits 
COOLDOWN_SECONDS = 15           # 1 request per 15s per IP
MAX_PER_DAY = 20                # 20 requests/day per IP
MAX_QUESTION_CHARS = 300        # keep it short to control cost
MAX_CV_CHARS = 8000             # don’t send infinite context

last_call_at: Dict[str, float] = {}                  # ip -> timestamp
daily_count: Dict[str, Tuple[date, int]] = {}        # ip -> (date, count)
cache: Dict[Tuple[str, str], Tuple[float, str]] = {} # (ip, question)->(ts, answer)
CACHE_TTL_SECONDS = 60 * 60 * 24                     # 24h


@app.post("/api/ask-cv")
async def ask_cv(request: Request):
    ip = request.client.host if request.client else "unknown"

    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="LLM is not configured (missing DEEPSEEK_API_KEY).")

    if not CV_TEXT.strip():
        raise HTTPException(status_code=500, detail="CV text not found. Put your resume text in app/data/cv.txt")

    body = await request.json()
    question = (body.get("question") or "").strip()

    if not question:
        raise HTTPException(status_code=400, detail="Please enter a question.")
    if len(question) > MAX_QUESTION_CHARS:
        raise HTTPException(status_code=400, detail=f"Keep questions under {MAX_QUESTION_CHARS} characters.")

    # Cooldown
    now = time.time()
    last = last_call_at.get(ip, 0)
    if now - last < COOLDOWN_SECONDS:
        retry = int(COOLDOWN_SECONDS - (now - last))
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Try again shortly.", "retry_after_seconds": retry},
        )

    # Daily limit
    today = date.today()
    d, cnt = daily_count.get(ip, (today, 0))
    if d != today:
        d, cnt = today, 0
    if cnt >= MAX_PER_DAY:
        return JSONResponse(
            status_code=429,
            content={"error": "Daily limit reached. Try again tomorrow."},
        )

    # Cache
    qkey = question.lower()
    cache_key = (ip, qkey)
    cached = cache.get(cache_key)
    if cached:
        ts, ans = cached
        if now - ts < CACHE_TTL_SECONDS:
            return {"answer": ans, "cached": True}

    # Update counters
    last_call_at[ip] = now
    daily_count[ip] = (today, cnt + 1)

    cv_context = CV_TEXT[:MAX_CV_CHARS]

    system = (
        "You are an assistant that answers questions about Detelina Marinova ONLY using the CV text provided. "
        "If the answer is not explicitly supported by the CV, say you don't know and suggest what to ask instead. "
        "Keep answers short (3-6 sentences)."
    )

    resp = ds_client.chat.completions.create(
        model="deepseek-chat",      
        temperature=0.2,
        max_tokens=350,             
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"CV:\n{cv_context}\n\nQuestion: {question}"},
        ],
    )

    answer = resp.choices[0].message.content.strip()

    cache[cache_key] = (now, answer)
    return {"answer": answer, "cached": False}
