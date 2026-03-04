"""
reading_order.py
────────────────
Coordinate-based reading order extraction using PyMuPDF.

Follows the approach used by MinerU, Docling, and Marker:
  1. Extract text blocks with bounding boxes (x0, y0, x1, y1)
  2. Detect columns via x-coordinate gap analysis
  3. Sort within columns top-to-bottom, order columns left-to-right
  4. Interleave full-width blocks by y-position

This gives ground-truth reading order from spatial coordinates,
independent of PDF stream order or LLM inference.
"""

import fitz  # PyMuPDF
import logging
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Thresholds (fraction of page dimension)
COLUMN_GAP_THRESHOLD = 0.05       # x-gap > 5% of page width = column boundary
FULL_WIDTH_THRESHOLD = 0.55       # block wider than 55% of page = full-width
HEADER_FOOTER_MARGIN = 0.07       # top/bottom 7% of page = header/footer zone
MIN_BLOCK_TEXT_LEN = 2            # skip blocks with < 2 chars


def _extract_text_blocks(page: fitz.Page) -> List[Dict]:
    """Extract text blocks with bounding boxes from a single page."""
    blocks = []
    page_dict = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)

    for block in page_dict.get("blocks", []):
        if block["type"] != 0:  # only text blocks (type 0)
            continue

        x0, y0, x1, y1 = block["bbox"]
        text_parts = []
        for line in block.get("lines", []):
            line_text = ""
            for span in line.get("spans", []):
                line_text += span["text"]
            text_parts.append(line_text)

        text = "\n".join(text_parts).strip()
        if len(text) < MIN_BLOCK_TEXT_LEN:
            continue

        blocks.append({
            "x0": x0, "y0": y0, "x1": x1, "y1": y1,
            "text": text,
            "width": x1 - x0,
            "height": y1 - y0,
            "mid_x": (x0 + x1) / 2,
        })

    return blocks


def _is_header_or_footer(block: Dict, page_height: float) -> bool:
    """Check if a block is in the header/footer zone."""
    margin = page_height * HEADER_FOOTER_MARGIN
    if block["y1"] < margin:  # top zone
        return True
    if block["y0"] > page_height - margin:  # bottom zone
        return True
    return False


def _detect_columns(blocks: List[Dict], page_width: float) -> List[Tuple[float, float]]:
    """
    Detect column boundaries using x-coordinate gap analysis.

    Returns list of (x_start, x_end) tuples, one per column, sorted left-to-right.
    """
    if not blocks:
        return [(0, page_width)]

    # Filter to non-full-width blocks for column detection
    narrow_blocks = [b for b in blocks if b["width"] < page_width * FULL_WIDTH_THRESHOLD]
    if not narrow_blocks:
        return [(0, page_width)]

    # Collect all x-ranges and find gaps
    # Sort blocks by x0
    sorted_by_x = sorted(narrow_blocks, key=lambda b: b["x0"])

    # Build merged x-intervals
    intervals = []
    for b in sorted_by_x:
        if intervals and b["x0"] <= intervals[-1][1] + page_width * 0.02:
            # Merge overlapping/adjacent intervals
            intervals[-1] = (intervals[-1][0], max(intervals[-1][1], b["x1"]))
        else:
            intervals.append((b["x0"], b["x1"]))

    if len(intervals) <= 1:
        return [(0, page_width)]

    # Find significant gaps between intervals
    gap_threshold = page_width * COLUMN_GAP_THRESHOLD
    columns = []
    for i, (start, end) in enumerate(intervals):
        if i == 0:
            col_start = start
        if i < len(intervals) - 1:
            gap = intervals[i + 1][0] - end
            if gap > gap_threshold:
                columns.append((col_start, end))
                col_start = intervals[i + 1][0]
        else:
            columns.append((col_start, end))

    return columns if columns else [(0, page_width)]


def _assign_to_columns(
    blocks: List[Dict],
    columns: List[Tuple[float, float]],
    page_width: float,
) -> Tuple[List[Dict], List[List[Dict]]]:
    """
    Assign blocks to columns or mark as full-width.

    Returns:
        full_width_blocks: blocks spanning multiple columns
        column_blocks: list of lists, one per column
    """
    full_width = []
    col_blocks = [[] for _ in columns]

    for block in blocks:
        if block["width"] >= page_width * FULL_WIDTH_THRESHOLD:
            full_width.append(block)
            continue

        # Find best matching column by midpoint
        mid_x = block["mid_x"]
        best_col = 0
        best_dist = float("inf")
        for i, (cx0, cx1) in enumerate(columns):
            col_mid = (cx0 + cx1) / 2
            dist = abs(mid_x - col_mid)
            if dist < best_dist:
                best_dist = dist
                best_col = i

        col_blocks[best_col].append(block)

    return full_width, col_blocks


def _sort_reading_order(
    full_width: List[Dict],
    column_blocks: List[List[Dict]],
) -> List[Dict]:
    """
    Merge full-width blocks and column blocks into final reading order.

    Strategy:
    - Sort each column's blocks top-to-bottom
    - Interleave full-width blocks at correct y-positions
    - Within each "band" between full-width blocks, read columns left-to-right
    """
    # Sort each column top-to-bottom
    for col in column_blocks:
        col.sort(key=lambda b: b["y0"])

    # Sort full-width blocks by y-position
    full_width.sort(key=lambda b: b["y0"])

    if not full_width:
        # No full-width blocks: just read columns left-to-right, each top-to-bottom
        result = []
        for col in column_blocks:
            result.extend(col)
        return result

    # Interleave: split column content at full-width block y-positions
    result = []
    fw_idx = 0

    # Collect all column blocks into a single list with column index
    all_col_blocks = []
    for col_idx, col in enumerate(column_blocks):
        for block in col:
            all_col_blocks.append((col_idx, block))

    # Sort by y0, then by column index for tie-breaking
    all_col_blocks.sort(key=lambda x: (x[1]["y0"], x[0]))

    col_ptr = 0
    for fw_block in full_width:
        # Add all column blocks that come before this full-width block
        while col_ptr < len(all_col_blocks) and all_col_blocks[col_ptr][1]["y0"] < fw_block["y0"]:
            result.append(all_col_blocks[col_ptr][1])
            col_ptr += 1
        result.append(fw_block)

    # Add remaining column blocks after last full-width block
    while col_ptr < len(all_col_blocks):
        result.append(all_col_blocks[col_ptr][1])
        col_ptr += 1

    return result


def extract_page_reading_order(page: fitz.Page) -> List[Dict]:
    """
    Extract text blocks from a single page in correct reading order.

    Returns list of dicts with keys: x0, y0, x1, y1, text, width, height, mid_x
    """
    page_width = page.rect.width
    page_height = page.rect.height

    # Step 1: Extract all text blocks with bounding boxes
    blocks = _extract_text_blocks(page)

    # Step 2: Strip headers and footers
    blocks = [b for b in blocks if not _is_header_or_footer(b, page_height)]

    if not blocks:
        return []

    # Step 3: Detect columns
    columns = _detect_columns(blocks, page_width)

    # Step 4: Assign blocks to columns
    full_width, col_blocks = _assign_to_columns(blocks, columns, page_width)

    # Step 5: Sort in reading order
    ordered = _sort_reading_order(full_width, col_blocks)

    return ordered


def get_page_reading_order_text(page: fitz.Page) -> str:
    """
    Get the reading-order text for a single page as a plain string.
    Blocks are separated by double newlines.
    """
    ordered = extract_page_reading_order(page)
    return "\n\n".join(block["text"] for block in ordered)


def get_document_reading_order(pdf_path: str) -> List[Dict]:
    """
    Extract reading order for the entire document.

    Returns list of page dicts:
        [{"page_num": 1, "blocks": [...], "text": "..."}, ...]
    """
    doc = fitz.open(pdf_path)
    pages = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        ordered_blocks = extract_page_reading_order(page)
        text = "\n\n".join(b["text"] for b in ordered_blocks)
        pages.append({
            "page_num": page_num + 1,
            "blocks": ordered_blocks,
            "text": text,
        })

    doc.close()
    return pages
