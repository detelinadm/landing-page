# CV Interactive Web App

A simple web application that uses an LLM to answer questions about my CV.

## Tech Stack

- **Backend**: FastAPI, Uvicorn
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Docker, Azure Container Apps, Terraform
- **CI/CD**: GitHub Actions

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload

# Or with Docker
docker build -t cv-app .
docker run -p 8000:8000 cv-app
```

## Features

- LLM-powered Q&A about my professional background
- Health check endpoint
- Automated deployment pipeline
