# MedScan

A full-stack clinical management system that automates the classification of laboratory test results. Labs deliver results as PDF files with inconsistent test names, forcing doctors to manually look up and categorize each value. MedScan extracts text from those PDFs, classifies tests into standardized LOINC-mapped categories using a local ML pipeline, and presents everything through a structured medical-records interface.

## Overview

MedScan is built around three layers:

- **Frontend** — A native Windows desktop client (WPF, .NET 9) using the Fluent design system, built with the MVVM pattern.
- **Backend** — A Node.js/Express REST API with JWT authentication, backed by a MariaDB database.
- **ML pipeline** — A local hierarchical classifier running on Ollama that maps free-form Ukrainian test names to ~300 standardized LOINC categories.

## Features

- **Patient management** — Browse a patient list, view and edit medical cards, manage allergies and diagnoses.
- **Medical records** — Create and edit records; open, close, and reopen clinical cases.
- **PDF ingestion** — Upload lab-result PDFs; text is extracted automatically server-side.
- **Automated classification** — A two-stage hierarchical Ollama classifier assigns each test to a LOINC-mapped category, with a built-in "undefined" refusal class to avoid forced misclassification. Outputs are constrained via JSON Schema enums to prevent hallucinated class names.
- **Structured results view** — Research results are grouped (case-linked, processed without a case, and unprocessed PDFs) for fast triage.

## Tech Stack

| Layer      | Technologies                                                                 |
|------------|------------------------------------------------------------------------------|
| Frontend   | WPF, .NET 9, WPF-UI (Fluent), CommunityToolkit.Mvvm                           |
| Backend    | Node.js, Express, Prisma ORM, MariaDB (Docker), JWT                          |
| ML         | Ollama (gemma3 model family), JSON Schema–constrained outputs                |
| Data       | LOINC 2.82 + MIMIC III                                                       |
| Tooling    | pdfjs-dist (text extraction), pdfkit (PDF generation), GitHub                |

## Getting Started

### Prerequisites

- .NET 9 SDK
- Node.js (22+) and npm
- Docker
- [Ollama](https://ollama.com) with a gemma3:4b model pulled locally

### Backend

```bash
cd dev/backend
npm install
docker compose up -d          # start MariaDB
npx prisma migrate deploy     # apply schema
npm run start
```

### ML / Ollama

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
ollama serve
```

### Frontend

Open the WPF solution in Visual Studio 2022 and run, or:

```bash
cd dev/frontend
dotnet run
```

## Project Structure

A monorepo with feature branches (`dev/backend`, `dev/frontend`, `dev/ml`) merging into `dev`:

```
medscan/
├── dev/backend/    # Express API, Prisma schema, services
├── dev/frontend/   # WPF .NET 9 client
└── dev/ml/         # Ollama classification pipeline, dataset
```

## License

This project is developed as an academic diploma project.
