# Plenia Conference Stand Registry

A premium, glassmorphic single-page dashboard and FastAPI backend service to manage conference stand registrations with MongoDB.

## Features
* **FastAPI Backend**: Asynchronous CRUD endpoints using `motor`.
* **Interactive UI**: Single-page dark mode administration panel at the root route.
* **Database Management**: Local MongoDB service and Mongo Express UI containerized via Docker.
* **Environment-driven Settings**: Fully configured using `.env` files.

## Prerequisites
* Python 3.8+
* Docker Desktop

## Quick Start

1. **Spin up Infrastructure**
   ```bash
   docker compose up -d
   ```
   *Note: Exposes MongoDB on port `27018` and Mongo Express on `8081`.*

2. **Install Python Dependencies**
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the API Server**
   ```bash
   uvicorn app.main:app --reload
   ```

## Services & Ports
* **Web Dashboard**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **API Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Mongo Express DB GUI**: [http://127.0.0.1:8081/](http://127.0.0.1:8081/) (Default login: `admin` / `secretpassword`)