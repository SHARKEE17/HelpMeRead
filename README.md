# HelpMeRead

A web app that turns PDFs into clean, readable web pages with AI-powered explanations.

Upload a PDF, and it gets converted into a structured, distraction-free reading experience — with correct reading order, preserved tables, math rendering, and a built-in "Simplify" feature that explains any selected text in plain language.

## Features

- **PDF to Web Reader** — Upload any PDF and read it in a clean, single-column layout with proper typography.
- **Correct Reading Order** — Uses coordinate-based extraction (PyMuPDF bounding boxes) to handle multi-column layouts, headers, footers, and complex page structures — the same approach used by MinerU, Docling, and Marker.
- **Page-by-Page Processing** — Each page is sent individually to Gemini with spatial reading order hints, so content never gets jumbled.
- **Table Support** — Complex tables with rowspan/colspan render correctly using HTML pass-through.
- **Math Rendering** — Inline and display LaTeX via KaTeX.
- **Simplify / ELI5** — Select any text and get a plain-language explanation powered by Gemini. No jargon, no fluff — like texting a smart friend.
- **Text Highlighting** — Select and highlight text with persistence.
- **Noise Removal** — Page numbers, running headers/footers, and boilerplate URLs are automatically stripped.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (TypeScript) + Vite |
| UI | Material UI (MUI) |
| Math | KaTeX via react-markdown + rehype-katex |
| Backend | Django + Django REST Framework |
| PDF Extraction | PyMuPDF (coordinate-based reading order) |
| AI Processing | Google Gemini 2.5 Flash (PDF to Markdown) |
| AI Explanations | Google Gemini 2.0 Flash (Simplify feature) |
| Markdown Parsing | markdown-it-py + BeautifulSoup4 |
| Fallback OCR | Sarvam AI Document Intelligence |

## How It Works

```
PDF Upload
    |
    v
PyMuPDF extracts text blocks with bounding boxes (x, y coordinates)
    |
    v
Column detection + spatial sorting --> correct reading order
    |
    v
Each page sent to Gemini with coordinate hints --> clean Markdown
    |
    v
Post-processing: noise removal, table block separation
    |
    v
Semantic Parser: Markdown --> structured JSON (sections, blocks)
    |
    v
React renderer: headings, paragraphs, tables, math, lists, quotes
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/apikey) (free tier works)

### 1. Backend

```bash
cd backend_django
python -m venv venv

# Activate venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Create .env from the example
cp .env.example .env
# Edit .env and add your API keys

python manage.py migrate
python manage.py runserver
```

Backend runs on `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### Environment Variables

Copy `backend_django/.env.example` to `backend_django/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SARVAM_API_KEY` | No | Sarvam AI key (fallback processor) |
| `DJANGO_SECRET_KEY` | No | Django secret key (auto-generated for dev) |

## Project Structure

```
backend_django/
  config/                      # Django settings, URLs
  core/
    models.py                  # Document, Highlight models
    views.py                   # API endpoints
    serializers.py             # DRF serializers
    services/
      gemini_processor.py      # Page-by-page Gemini processing
      reading_order.py         # PyMuPDF coordinate extraction
      semantic_parser.py       # Markdown to structured JSON
      sarvam_reorder.py        # Sarvam output reordering (fallback)
      llm.py                   # Simplify/ELI5 explanations
      pdf.py                   # Processing pipeline orchestrator

frontend/
  src/
    components/
      Semantic/                # Document renderer (blocks, tables, math)
      Dashboard.tsx            # Upload and document list
      ReaderView.tsx           # Main reading interface
      ProcessingView.tsx       # Upload progress
      LandingPage.tsx          # Landing page
    api/                       # API clients
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/` | Upload a PDF |
| GET | `/documents/` | List all documents |
| GET | `/documents/{id}/` | Get document with processed content |
| GET | `/documents/{id}/status/` | Poll processing status |
| POST | `/explain/` | Get simplified explanation of selected text |
| CRUD | `/highlights/` | Create/read/update/delete highlights |
