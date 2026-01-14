# DevOps Portfolio Landing Page (FastAPI) 🚀

A “static-ish” landing page that still feels production-y: **health checks, version stamping, uptime**, and an **Ask My CV** widget powered by an LLM (with strict rate limits + cost caps).

Built to be:
- easy to run locally
- easy to containerize
- easy to deploy (Azure Container Apps planned)
- easy to **destroy** (Terraform planned)

---

## ✨ Demo Features

### 🧩 Landing Page (`/home`)
- Clean landing page + DevOps dashboard tiles
- “Would you hire me?” buttons with fun modals:
  - **No** → creates an incident report modal (SEV-1 😅)
  - **Yes** → confetti + “collect your prize” (image zoom-in)

### 📊 DevOps Dashboard APIs
- `GET /api/health` — health check (200 OK)
- `GET /api/ready` — readiness check (200 OK)
- `GET /api/version` — build metadata (stamped by CI/CD)
- `GET /api/uptime` — uptime seconds + human format

### 🤖 Ask My CV (LLM)
- A small Q&A widget that answers from **resume text only** (`app/data/cv.txt`)
- Backend-only API key (never exposed in frontend)
- Rate limits + token caps + caching to keep costs low

---

## 🧱 Tech Stack

- **Backend:** FastAPI (Python)
- **Templates:** Jinja2
- **Frontend:** Vanilla HTML/CSS/JS (static-ish)
- **Container:** Docker + Docker Compose
- **LLM:** DeepSeek API (OpenAI-compatible)
- **Planned:** GitHub Actions CI/CD → Azure Container Apps → Terraform

---

## 📁 Project Structure

