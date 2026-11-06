# JudicAI | The Modern Magistrate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-05998b.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)](https://tailwindcss.com/)
[![CI](https://github.com/SujitSpark/JudicAi/actions/workflows/ci.yml/badge.svg)](https://github.com/SujitSpark/JudicAi/actions/workflows/ci.yml)

**JudicAI** is a high-fidelity judicial intelligence system engineered for supreme and upper judiciaries. It serves as an **Intelligence Layer** that sits above existing registries to solve systemic backlogs through multi-agent orchestration, predictive risk scoring, and automated scheduling.

---

## 🏛️ Core Vision
The judiciary faces an unprecedented backlog of millions of cases. JudicAI isn't just a management tool; it's a **predictive engine** designed to identify high-risk cases before they stall, ensuring that "Justice Delayed" is no longer the norm.

---

## ✨ Key Intelligence Modules

| Module | Description | Impact |
| :--- | :--- | :--- |
| **⚖️ AI-Priority Registry** | Orchestrates Intake → Priority → Risk agents to rank the case registry. | Benchmarked on 1,200 cases ([results](benchmarks/README.md)) |
| **🔍 Risk Engine** | Hybrid rule + XGBoost adjournment-risk score with an **80-point critical threshold**. | Proactively flags "Stall Warnings" |
| **📜 Automated Memos** | Generates legal summaries and chamber review memos using LLM orchestration. | Speeds up judge preparation |
| **📅 Smart Allocation** | Dynamically assigns cases based on judge capacity and historical specialization. | Optimizes bench utilization |
| **🌗 Premium UI** | "Deep Ink & Brass" aesthetics providing a professional, distraction-free interface. | Enhanced focus for judicial staff |

---

## 📊 Benchmark & Testing

JudicAI's triage agents are evaluated on a **1,200-case synthetic benchmark** modelled on
100 real Supreme Court cases (see [`benchmarks/`](benchmarks/README.md)), against the manual
"oldest case first" order a registry clerk would use:

| Ranking | ROC-AUC | Precision @ top 20% | Review effort saved |
|---|---|---|---|
| Manual (oldest first) | 0.51 | 43% | — |
| Risk agent (rule engine) | 0.60 | 49% | 9% |
| Proposed supervised stall classifier | **0.65** | **59%** | **15%** |

The benchmark exposed and fixed **target leakage** in the risk model (it scored a meaningless
R² of 1.00 by reading its own target; R² is 0.67 once fixed), negative risk scores, and an
index-alignment bug. `pytest tests` covers scoring, the leakage guard and the generator, and
runs in CI.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph "Data Ingestion"
        A[Case Files / PDF / CSV] --> B[Intake Agent]
    end

    subgraph "JudicAI Core (Multi-Agent)"
        B --> C{Supervisor Agent}
        C --> D[Priority Agent]
        C --> E[Risk Agent]
        C --> F[Memo Agent]
    end

    subgraph "Storage & API"
        D & E & F --> G[(PostgreSQL / SQLite)]
        G --> H[FastAPI Backend]
    end

    subgraph "Visual Interface"
        H --> I[Vite + React Dashboard]
        I --> J[Judicial Insights Dashboard]
    end
```

### 🧩 Sub-System Component Architecture & Flows
Below are the visual reference diagrams detailing the sub-system block architecture and agent-entity interaction flows:

| Sub-System Component Relationships | Agent Entity Interaction Flows |
| :---: | :---: |
| ![Sub-System Component Relationships](images/A.%20Sub-Systems%20%28Blocks_Entities%29%20-%20visual%20selection%20%284%29.png) | ![Agent Entity Interaction Flows](images/A.%20Sub-Systems%20%28Blocks_Entities%29%20-%20visual%20selection%20%285%29.png) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Backend)
- **Node.js 18+** (Frontend)
- **PostgreSQL** (Optional, defaults to SQLite)

### 2. Installation & Setup

#### Backend Setup
```bash
cd backend
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure Environment
# Copy the template and fill in your keys
cp ../.env.example .env

# 3. Launch the API
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
# 1. Install dependencies
npm install

# 2. Start the Development Server
npm run dev
```

### 3. Database Seeding
Populate the system with a synthetic Supreme Court dataset (100 cases and a full 34-judge bench):
```bash
python scripts/seed_supreme_court.py
```

---

## 🛠️ Tech Stack

- **Intelligence**: LangGraph (Agent Orchestration), Google Gemini / OpenAI Models.
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Pydantic v2.
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (Animations).
- **Visualization**: Recharts, Lucide Icons.
- **Data Engineering**: Pandas, NumPy.

---

## 📂 Project Structure

```text
JudicAi/
├── backend/            # FastAPI Application
│   ├── app/            # Core logic, Agents, API, DB
│   └── requirements.txt
├── frontend/           # Vite + React Application
│   ├── src/            # Components, Pages, State
│   └── package.json
├── data/               # CSV datasets and synthetic data
├── scripts/            # Database seeding and utility scripts
├── .env.example        # Environment template
└── Readme.md           # You are here
```

---

## 🤝 Contributing
Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

---
*Built with precision for the modern judiciary.*
