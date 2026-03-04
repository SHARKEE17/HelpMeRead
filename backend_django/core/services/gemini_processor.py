"""
gemini_processor.py
───────────────────
Uses Google Gemini 2.0 Flash to convert a PDF to structured Markdown,
processing PAGE-BY-PAGE with coordinate-based reading order hints.

Approach (mirrors MinerU / Docling / Marker):
  1. PyMuPDF extracts text blocks with bounding boxes per page
  2. Column detection + spatial sorting gives correct reading order
  3. Each page is sent individually to Gemini with the pre-ordered text
  4. Gemini formats (tables, math, headings) — it does NOT determine order
  5. Pages are concatenated in sequence

For image-based or vector-drawn PDFs where PyMuPDF cannot extract text,
falls back to Gemini vision-only mode (page-by-page, which is still
better than whole-PDF for reading order accuracy).

Free tier limits (Gemini 2.0 Flash):
  - 15 requests / minute  →  4-second delay between pages
  - 1,500 requests / day  →  ~75 papers/day at 20 pages each
"""

import os
import re
import time
import logging
import tempfile

import fitz  # PyMuPDF
from google import genai
from google.genai import types

from core.services.reading_order import get_page_reading_order_text

logger = logging.getLogger(__name__)

# Delay between page requests to respect rate limits (15 req/min)
PAGE_DELAY_SECONDS = 4

# ─────────────────────────────────────────────────────────────────
# Per-page prompt — Gemini formats, coordinates dictate order
# ─────────────────────────────────────────────────────────────────
PAGE_PROMPT_WITH_COORDS = """\
Convert this single PDF page to clean, well-structured Markdown.

CRITICAL — READING ORDER:
The text on this page has been spatially analyzed from coordinates.
Here is the correct reading order:
---
{ordered_text}
---
You MUST follow this exact block order. Do not rearrange, reorder, or skip any content.
If the page has multi-column layout, the order above already accounts for it.

STRIP NOISE — do NOT include any of these in the output:
- Page numbers (standalone numbers like "1", "2", "3" at top/bottom of page)
- Headers/footers that repeat across pages (e.g. course names, author names at page edges)
- "Electronic copy available at: ..." URLs
- Running headers or running footers

TABLES — always use HTML, never pipe syntax:
- Use <table> <thead> <tbody> <tr> <th> <td> tags
- Use colspan="N" / rowspan="N" for spanning cells
- Include ALL cells — even empty ones — preserve the full grid

MATH — use LaTeX notation:
- Inline: $formula$
- Display / block: $$formula$$
- Superscript footnote markers: $^{{1}}$

HEADINGS — ## for section headers, ### for subsections

Output ONLY the Markdown for this page. No preamble, no commentary.\
"""

# Fallback prompt for image-based / vector-drawn PDFs where PyMuPDF
# cannot extract text. Gemini vision determines order directly.
PAGE_PROMPT_VISION_ONLY = """\
Convert this single PDF page to clean, well-structured Markdown.

READING ORDER:
- Read top-to-bottom, left-to-right
- For multi-column layouts: read left column fully first, then right column
- Do NOT interleave columns

STRIP NOISE — do NOT include any of these in the output:
- Page numbers (standalone numbers like "1", "2", "3" at top/bottom of page)
- Headers/footers that repeat across pages (e.g. course names, author names at page edges)
- "Electronic copy available at: ..." URLs
- Running headers or running footers

TABLES — always use HTML, never pipe syntax:
- Use <table> <thead> <tbody> <tr> <th> <td> tags
- Use colspan="N" / rowspan="N" for spanning cells
- Include ALL cells — even empty ones — preserve the full grid

MATH — use LaTeX notation:
- Inline: $formula$
- Display / block: $$formula$$
- Superscript footnote markers: $^{1}$

HEADINGS — ## for section headers, ### for subsections

Output ONLY the Markdown for this page. No preamble, no commentary.\
"""


def _upload_page_to_gemini(client, doc, page_num, pdf_path):
    """
    Extract a single page as a temp PDF file and upload to Gemini Files API.
    Returns the uploaded file reference (in ACTIVE state).
    """
    # Save single page to a temp file (Gemini client expects a file path)
    single_page_doc = fitz.open()
    single_page_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)

    tmp = tempfile.NamedTemporaryFile(
        suffix='.pdf', prefix=f'page_{page_num + 1}_', delete=False
    )
    tmp_path = tmp.name
    tmp.close()

    try:
        single_page_doc.save(tmp_path)
        single_page_doc.close()

        uploaded = client.files.upload(
            file=tmp_path,
            config=types.UploadFileConfig(
                mime_type='application/pdf',
                display_name=f"{os.path.basename(pdf_path)}_p{page_num + 1}",
            ),
        )

        # Wait for file to become ACTIVE
        file_ref = client.files.get(name=uploaded.name)
        deadline = time.time() + 60  # 1-minute timeout per page
        while file_ref.state.name == 'PROCESSING':
            if time.time() > deadline:
                raise TimeoutError(f"Gemini timed out on page {page_num + 1}")
            time.sleep(2)
            file_ref = client.files.get(name=uploaded.name)

        if file_ref.state.name != 'ACTIVE':
            raise RuntimeError(f"Gemini file failed: {file_ref.state.name}")

        return file_ref

    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ─────────────────────────────────────────────────────────────────
# Main function — page-by-page processing
# ─────────────────────────────────────────────────────────────────
def process_pdf_with_gemini(pdf_path: str, api_key: str,
                             progress_callback=None) -> str:
    """
    Process a PDF page-by-page with Gemini, using PyMuPDF coordinate
    extraction for reading order.

    Args:
        pdf_path:          Absolute path to the PDF file.
        api_key:           Gemini API key.
        progress_callback: Optional callable(message: str, percent: int).

    Returns:
        Markdown string with correct reading order, ready for semantic_parser.
    """
    client = genai.Client(api_key=api_key)
    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    logger.info(f"Processing {pdf_path}: {total_pages} pages (page-by-page)")

    if progress_callback:
        progress_callback(f"Analyzing PDF ({total_pages} pages)...", 5)

    all_page_markdown = []

    for page_num in range(total_pages):
        page = doc[page_num]
        page_label = f"Page {page_num + 1}/{total_pages}"

        # ── 1. Extract reading order from coordinates ────────────────
        ordered_text = get_page_reading_order_text(page)
        has_text = bool(ordered_text.strip())

        if has_text:
            logger.info(f"{page_label}: extracted {len(ordered_text)} chars via PyMuPDF")
        else:
            logger.info(f"{page_label}: no extractable text (image/vector PDF), using vision-only mode")

        # ── 2. Upload single page to Gemini ──────────────────────────
        if progress_callback:
            percent = 10 + int((page_num / total_pages) * 75)
            progress_callback(f"Processing {page_label}...", percent)

        logger.info(f"{page_label}: uploading to Gemini...")

        try:
            file_ref = _upload_page_to_gemini(client, doc, page_num, pdf_path)

            # ── 3. Generate markdown for this page ───────────────────
            # Use coordinate-guided prompt if we have text, otherwise
            # fall back to vision-only prompt for image/vector PDFs
            if has_text:
                prompt = PAGE_PROMPT_WITH_COORDS.format(ordered_text=ordered_text)
            else:
                prompt = PAGE_PROMPT_VISION_ONLY

            # Retry up to 3 times on rate limit (429) errors
            page_markdown = None
            for attempt in range(3):
                try:
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[
                            types.Part.from_uri(
                                file_uri=file_ref.uri,
                                mime_type='application/pdf',
                            ),
                            prompt,
                        ],
                        config=types.GenerateContentConfig(
                            temperature=0.1,
                            max_output_tokens=8192,
                        ),
                    )
                    page_markdown = response.text.strip()
                    break  # success
                except Exception as retry_err:
                    err_str = str(retry_err)
                    if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str:
                        wait = 40 * (attempt + 1)  # 40s, 80s, 120s
                        logger.warning(f"{page_label}: rate limited (attempt {attempt+1}/3), waiting {wait}s...")
                        if progress_callback:
                            progress_callback(f"Rate limited, waiting {wait}s...", percent)
                        time.sleep(wait)
                    else:
                        raise  # non-rate-limit error, propagate

            if page_markdown is None:
                raise RuntimeError(f"All 3 retry attempts failed for {page_label}")
            all_page_markdown.append(page_markdown)
            logger.info(
                f"{page_label}: got {len(page_markdown)} chars of Markdown"
            )

            # ── 4. Clean up uploaded file ────────────────────────────
            try:
                client.files.delete(name=file_ref.name)
            except Exception as e:
                logger.warning(f"Could not delete file for {page_label}: {e}")

        except Exception as e:
            logger.error(f"{page_label}: Gemini failed ({e})")
            # Fallback: use coordinate-extracted text if available
            if has_text:
                logger.info(f"{page_label}: falling back to raw PyMuPDF text")
                all_page_markdown.append(ordered_text)
            else:
                logger.warning(f"{page_label}: no fallback available (image/vector PDF)")
                all_page_markdown.append(f"<!-- {page_label}: processing failed -->")

        # ── 5. Rate limiting ─────────────────────────────────────────
        if page_num < total_pages - 1:
            time.sleep(PAGE_DELAY_SECONDS)

    doc.close()

    if progress_callback:
        progress_callback("Assembling document...", 90)

    # ── 6. Concatenate all pages ─────────────────────────────────────
    markdown_text = "\n\n".join(all_page_markdown)

    # ── 7. Post-process: strip remaining noise Gemini may have missed ──
    markdown_text = _strip_noise(markdown_text)

    logger.info(
        f"Complete: {len(markdown_text)} chars from {total_pages} pages"
    )

    if progress_callback:
        progress_callback("Gemini conversion complete.", 95)

    return markdown_text


# Patterns for noise that should be stripped from the final output
_NOISE_PATTERNS = [
    # Standalone page numbers (1-4 digits alone on a line)
    re.compile(r'^\d{1,4}\s*$', re.MULTILINE),
    # "Electronic copy available at: ..."
    re.compile(r'^Electronic copy available at:.*$', re.MULTILINE | re.IGNORECASE),
    # Horizontal rules used as page separators (3+ dashes alone)
    re.compile(r'^-{3,}\s*$', re.MULTILINE),
    # HTML comment placeholders from failed pages
    re.compile(r'^<!--.*?processing failed.*?-->\s*$', re.MULTILINE),
]


def _strip_noise(text: str) -> str:
    """Remove page numbers, URLs, separators, and other PDF noise."""
    for pattern in _NOISE_PATTERNS:
        text = pattern.sub('', text)

    # Ensure HTML <table> blocks are separated by blank lines so that
    # MarkdownIt recognises them as html_block tokens (type-6 HTML blocks
    # cannot interrupt a paragraph in the CommonMark spec).
    text = re.sub(r'(?<!\n)\n(<table)', r'\n\n\1', text)
    text = re.sub(r'(</table>)\n(?!\n)', r'\1\n\n', text)

    # Collapse runs of 3+ blank lines into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()
