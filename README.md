# HelpMeRead - Intelligent PDF Reader

**Transform static PDFs into interactive, semantically rich web experiences.**

HelpMeRead is a next-generation PDF reader that goes beyond simple text extraction. It leverages advanced OCR and layout analysis (powered by Sarvam AI) to understand the *structure* of documents, preserving semantic meaning while offering a modern, distraction-free reading environment.

## 🚀 Key Features

### 🧠 Semantic Document Understanding
Unlike traditional readers that flatten text, HelpMeRead preserves the logical structure of your documents:
*   **Recursive Semantic Parsing**: Correctly identifies and identifies nested structures like lists within lists and blockquotes.
*   **Rich Block Support**: Natively renders:
    *   **Lists**: Ordered and unordered lists with proper indentation.
    *   **Blockquotes**: Distinctively styled quotes.
    *   **Captions**: Automatically detects figure and table captions (e.g., "Figure 1: Architecture").
    *   **Metadata**: Identifies author, date, and affiliation blocks.

### 🎨 Advanced Rendering Engine
*   **Block-Based Architecture**: A custom React renderer that treats every element as a structured block, enabling granular interaction.
*   **Mathematical Precision**: Full support for inline LaTeX math rendering using **KaTeX** (e.g., $E = mc^2$).
*   **Complex Tables**: Handles tables with row-spans, col-spans, and unescaped special characters for perfect data presentation.
*   **Smart Footnotes**: Automatically exacts footnotes, links them in the text, and displays them in a dedicated "References" section with clickable source links.

### ⚡ Interactive Reader
*   **Distraction-Free Mode**: Clean, single-column layout with premium typography (Google Fonts: Inter, Roboto Serif).
*   **Text Highlighting**: Select and highlight text with persistence.
*   **Contextual explanations**: (Coming soon) AI-powered definitions for complex terms.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: [React](https://reactjs.org/) (TypeScript) + [Vite](https://vitejs.dev/)
*   **UI Library**: [Material UI (MUI)](https://mui.com/) v5
*   **Math Rendering**: `react-katex` / `katex`
*   **State Management**: React Hooks

### Backend
*   **Framework**: [Django](https://www.djangoproject.com/) (Python)
*   **Parsing**: `markdown-it-py` with custom recursive descent parser.
*   **OCR/Layout**: Sarvam AI Document Intelligence API.
*   **HTML Processing**: `BeautifulSoup4` for table extraction.

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Sarvam AI API Key specified in `settings.py` or environment variables.

### 1. Backend Setup (Django)
```bash
cd backend_django
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*Backend runs on `<BACKEND_URL>`*

### 2. Frontend Setup (React/Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `<FRONTEND_URL>`*

## 🏗️ Architecture

The system uses a **Block-Based JSON Schema** for document representation:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Paper Title" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Paper abstract..." }]
    },
    {
      "type": "figure",
      "content": [ ... ] 
    }
  ],
  "footnotes": [ ... ]
}
```

This schema allows for the frontend to render any content type deterministically while maintaining the ability to attach metadata (like highlights) to specific block IDs.
