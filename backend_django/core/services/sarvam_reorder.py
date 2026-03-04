"""
sarvam_reorder.py
─────────────────
Post-processor for Sarvam API markdown output.

THE PROBLEM
-----------
Sarvam extracts PDF text in "PDF stream order," not visual reading order.
For each page it produces elements in this scrambled sequence:

  [footnote defs] → [orphan continuation from prev page] → [URL noise]
  → [main body] → [section headers] → [page number] → [---]

This script fixes that scrambling. Insert it as Step 1.5 in your pipeline,
between raw Sarvam output and semantic_parser.py.

PIPELINE POSITION
-----------------
  1.  Sarvam API       → raw_sarvam_output.md
  1.5 THIS SCRIPT      → reordered_output.md      ← NEW STEP
  2.  semantic_parser  → semantic_doc.json
  3.  ArticleRenderer  → rendered HTML
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, List, Tuple


# ─────────────────────────────────────────────────────────────────
# Helper Functions (v2 Upgrade)
# ─────────────────────────────────────────────────────────────────

def convert_latex_commands(text: str) -> str:
    text = re.sub(r'\\textsc\{([^}]+)\}', lambda m: f'**{m.group(1).upper()}**', text)
    text = re.sub(r'\\textit\{([^}]+)\}', r'*\1*', text)
    text = re.sub(r'\\textbf\{([^}]+)\}', r'**\1**', text)
    text = re.sub(r'\\emph\{([^}]+)\}', r'*\1*', text)
    text = re.sub(r'\\text\{-+\}', '—', text)
    return text


def fix_images(text: str) -> str:
    IMG_RE = re.compile(
        r'!\[Image\]\((data:image/[^)]+)\)\s*\n\s*\n?(\*The image[^*]+\*)',
        re.DOTALL
    )
    def replace_image(m):
        src = m.group(1)
        alt = re.sub(r'^\*|\*$', '', m.group(2)).strip()
        short_alt = alt.split('.')[0].strip()
        return (
            f'\n<figure class="game-tree">\n'
            f'  <img src="{src}" alt="{short_alt}" />\n'
            f'  <figcaption>{short_alt}</figcaption>\n'
            f'</figure>\n'
        )
    return IMG_RE.sub(replace_image, text)


def collect_column_header(lines: List[str], table_line_idx: int) -> Optional[str]:
    COL_HEADER_RE = re.compile(
        r'^\*(Player [12]|Firm [12]|Goalie|Kicker)\*$', re.IGNORECASE
    )
    for j in range(table_line_idx - 1, max(-1, table_line_idx - 6), -1):
        stripped = lines[j].strip()
        if COL_HEADER_RE.match(stripped):
            return re.sub(r'^\*|\*$', '', stripped)
        if stripped and not stripped.isdigit():
            break
    return None


def repair_tables(text: str) -> str:
    lines = text.splitlines()
    result = []
    i = 0
    while i < len(lines):
        if lines[i].strip() == '<table>':
            end = i
            while end < len(lines) and lines[end].strip() != '</table>':
                end += 1
            table_html = '\n'.join(lines[i:end+1])
            col_header = collect_column_header(lines, i)

            # Remove the floating *Player 2* etc. line already added to result
            if col_header and result:
                for k in range(len(result) - 1, max(-1, len(result) - 6), -1):
                    if re.match(r'^\*(Player [12]|Firm [12]|Goalie|Kicker)\*$',
                                result[k].strip(), re.IGNORECASE):
                        result.pop(k)
                        break

            # Skip repair if the table already has a proper multi-level header
            # (multi-row thead OR any colspan/rowspan) — repairing it would destroy structure.
            thead_inner_match = re.search(r'<thead>(.*?)</thead>', table_html, re.DOTALL)
            if thead_inner_match:
                thead_inner = thead_inner_match.group(1)
                has_multi_row  = thead_inner.count('<tr') > 1
                has_span       = bool(re.search(r'(col|row)span\s*=\s*["\']?[2-9]', thead_inner))
                if has_multi_row or has_span:
                    result.append(table_html)
                    i = end + 1
                    continue

            # Rebuild thead with correct header (simple tables only)
            tbody_match = re.search(r'<tbody>(.*?)</tbody>', table_html, re.DOTALL)
            if tbody_match:
                first_tr = re.search(r'<tr>(.*?)</tr>', tbody_match.group(1), re.DOTALL)
                td_count = len(re.findall(r'<td', first_tr.group(1))) if first_tr else 0
                thead_match = re.search(r'<thead>(.*?)</thead>', table_html, re.DOTALL)
                if thead_match and td_count > 0:
                    raw_ths = re.findall(r'<th[^>]*>(.*?)</th>', thead_match.group(1), re.DOTALL)
                    th_texts = [t.strip() for t in raw_ths if t.strip()]
                    new_rows = []
                    if col_header:
                        data_cols = td_count - 1 if td_count > 1 else td_count
                        new_rows.append(f'  <tr>\n    <th></th>\n    <th colspan="{data_cols}">{col_header}</th>\n  </tr>')
                    if th_texts:
                        cells = ['    <th></th>'] + [f'    <th>{t}</th>' for t in th_texts]
                        new_rows.append('  <tr>\n' + '\n'.join(cells) + '\n  </tr>')
                    new_thead = '<thead>\n' + '\n'.join(new_rows) + '\n</thead>'
                    table_html = table_html.replace(thead_match.group(0), new_thead)

            result.append(table_html)
            i = end + 1
        else:
            result.append(lines[i])
            i += 1
    return '\n'.join(result)


# ─────────────────────────────────────────────────────────────────
# Element classification
# ─────────────────────────────────────────────────────────────────

@dataclass
class DocElement:
    kind: str       # 'heading' | 'footnote_def' | 'orphan' | 'body' |
                    # 'table_html' | 'table_label' | 'page_num' |
                    # 'url_noise' | 'separator' | 'blank'
    text: str
    is_continuation: bool = False  # True if this is a cross-page orphan fragment


# Regexes
RE_HEADING      = re.compile(r'^#{1,6}\s+')
RE_PAGE_NUM     = re.compile(r'^\d{1,3}$')          # standalone 1–3 digit int
RE_URL_NOISE    = re.compile(r'^Electronic copy available at:', re.IGNORECASE)
RE_FOOTNOTE_DEF = re.compile(r'^\[\^(\d+)\]:|^\$\^\{?\d+\}?\$')  # [^N]: or $^N$
RE_TABLE_START  = re.compile(r'^<table', re.IGNORECASE)
RE_TABLE_END    = re.compile(r'^</table>', re.IGNORECASE)
RE_TABLE_LABEL  = re.compile(
    r'^\*(Table \d+:|Player [12]|Firm [12]|Goalie|Kicker)\b',
    re.IGNORECASE
)
RE_SEPARATOR    = re.compile(r'^---+$')
# Orphan heuristic: paragraph starts with a lowercase letter
# (likely a cross-page continuation) and is not a list item / LaTeX
RE_ORPHAN_START = re.compile(r'^[a-z\(]')
RE_LIST_ITEM    = re.compile(r'^[•\-\*]\s|^\d+\.')


def classify_paragraph(text: str) -> DocElement:
    """Classify a single paragraph block into a DocElement."""
    first_line = text.split('\n')[0].strip()

    if not first_line:
        return DocElement('blank', text)

    if RE_SEPARATOR.match(first_line):
        return DocElement('separator', text)

    if RE_URL_NOISE.match(first_line):
        return DocElement('url_noise', text)

    if RE_PAGE_NUM.match(first_line) and len(text.strip().split('\n')) == 1:
        return DocElement('page_num', text)

    if RE_HEADING.match(first_line):
        return DocElement('heading', text)

    if RE_FOOTNOTE_DEF.match(first_line):
        return DocElement('footnote_def', text)

    if RE_TABLE_LABEL.match(first_line):
        return DocElement('table_label', text)

    if RE_TABLE_START.match(first_line):
        return DocElement('table_html', text)

    # Orphan heuristic: starts lowercase AND is not a list, LaTeX env, or example block
    is_lower_start  = RE_ORPHAN_START.match(first_line)
    is_list         = RE_LIST_ITEM.match(first_line)
    is_latex_block  = first_line.startswith('\\') or first_line.startswith('$$')
    is_example_line = re.match(r'^(example|exercise|note)\b', first_line, re.IGNORECASE)
    if is_lower_start and not is_list and not is_latex_block and not is_example_line:
        return DocElement('body', text, is_continuation=True)

    return DocElement('body', text)


# ─────────────────────────────────────────────────────────────────
# Page-block reordering
# ─────────────────────────────────────────────────────────────────

def split_into_paragraphs(text: str) -> List[str]:
    """Split markdown text into paragraph-level blocks."""
    # Respect HTML table blocks as atomic units
    paragraphs = []
    buffer: List[str] = []
    in_table = False

    for line in text.splitlines():
        if RE_TABLE_START.match(line.strip()):
            if buffer:
                paragraphs.append('\n'.join(buffer))
                buffer = []
            in_table = True
            buffer.append(line)
        elif RE_TABLE_END.match(line.strip()) and in_table:
            buffer.append(line)
            paragraphs.append('\n'.join(buffer))
            buffer = []
            in_table = False
        elif in_table:
            buffer.append(line)
        elif line.strip() == '' and not in_table:
            if buffer:
                paragraphs.append('\n'.join(buffer))
                buffer = []
        else:
            buffer.append(line)

    if buffer:
        paragraphs.append('\n'.join(buffer))

    return [p for p in paragraphs if p.strip()]


def reorder_page_block(elements: List[DocElement]) -> Tuple[List[DocElement], List[DocElement]]:
    """
    Reorder elements within a single page block into correct reading order.

    Correct order:
      1. Headings (section titles that open the page)
      2. Body text (non-orphan paragraphs)
      3. Tables (label + html)
      4. Orphan continuations go to a "deferred" list (returned separately)
      5. Footnote defs, page nums, url_noise → stripped out

    Orphan continuations are returned as the SECOND element of the tuple
    so the caller can prepend them to the PREVIOUS block's tail.
    """
    headings:      List[DocElement] = []
    body:          List[DocElement] = []
    tables:        List[DocElement] = []
    orphans:       List[DocElement] = []
    pending_label: Optional[DocElement] = None

    for el in elements:
        if el.kind in ('page_num', 'url_noise', 'blank', 'separator', 'footnote_def'):
            continue  # discard noise; footnotes handled globally

        if el.kind == 'table_label':
            pending_label = el

        elif el.kind == 'table_html':
            if pending_label:
                tables.append(pending_label)
                pending_label = None
            tables.append(el)

        elif el.kind == 'heading':
            # Flush any pending label that wasn't followed by a table
            if pending_label:
                body.append(pending_label)
                pending_label = None
            headings.append(el)

        elif el.kind == 'body':
            if pending_label:
                body.append(pending_label)
                pending_label = None

            if el.is_continuation:
                orphans.append(el)
            else:
                body.append(el)

    if pending_label:
        body.append(pending_label)

    reordered = headings + body + tables
    return reordered, orphans


# ─────────────────────────────────────────────────────────────────
# Document-level assembly
# ─────────────────────────────────────────────────────────────────

def extract_footnote_defs(paragraphs: List[str]) -> Tuple[List[str], List[str]]:
    """Separate footnote definitions from body paragraphs."""
    body, footnotes = [], []
    for p in paragraphs:
        el = classify_paragraph(p)
        if el.kind == 'footnote_def':
            footnotes.append(p)
        else:
            body.append(p)
    return body, footnotes


def process_document(raw_md: str) -> str:
    """
    Main entry point. Takes raw Sarvam markdown, returns reordered markdown.
    """
    # Pre-process: convert LaTeX commands and fix images first
    raw_md = convert_latex_commands(raw_md)
    raw_md = fix_images(raw_md)

    # ── Step 1: Extract ALL footnote defs globally (they appear scattered) ──
    all_paragraphs = split_into_paragraphs(raw_md)
    body_paragraphs, all_footnotes = extract_footnote_defs(all_paragraphs)

    # ── Step 2: Split remaining content into page blocks at '---' separators ──
    page_blocks: List[List[str]] = []
    current_block: List[str] = []

    for p in body_paragraphs:
        el = classify_paragraph(p)
        if el.kind == 'separator':
            if current_block:
                page_blocks.append(current_block)
                current_block = []
        else:
            current_block.append(p)
    if current_block:
        page_blocks.append(current_block)

    # ── Step 3: Reorder each page block; stitch orphans to previous block ──
    processed_blocks: List[List[DocElement]] = []
    pending_orphans:  List[DocElement] = []

    for block_paragraphs in page_blocks:
        elements = [classify_paragraph(p) for p in block_paragraphs]

        # Prepend orphans from the previous block to this block's START
        # (they are continuations of the paragraph that ended on the prev page)
        if pending_orphans:
            elements = pending_orphans + elements

        reordered, new_orphans = reorder_page_block(elements)
        processed_blocks.append(reordered)
        pending_orphans = new_orphans

    # Flush any remaining orphans
    if pending_orphans and processed_blocks:
        processed_blocks[-1].extend(pending_orphans)

    # ── Step 4: Render back to markdown ──
    output_parts: List[str] = []

    # Try to put the document title first (find first H1/H2 in all blocks)
    title_block_idx, title_el_idx = None, None
    for bi, block in enumerate(processed_blocks):
        for ei, el in enumerate(block):
            if el.kind == 'heading' and el.text.startswith('## ') or \
               el.kind == 'heading' and el.text.startswith('# '):
                # Only pick the very first heading as the doc title
                title_block_idx, title_el_idx = bi, ei
                break
        if title_block_idx is not None:
            break

    if title_block_idx is not None:
        title_el = processed_blocks[title_block_idx].pop(title_el_idx)
        output_parts.append(title_el.text)
        output_parts.append('')

    for block in processed_blocks:
        for el in block:
            output_parts.append(el.text)
            output_parts.append('')

    # ── Step 5: Append all footnotes at the end ──
    if all_footnotes:
        output_parts.append('')
        output_parts.append('---')
        output_parts.append('')
        output_parts.append('## Notes')
        output_parts.append('')
        for fn in all_footnotes:
            output_parts.append(fn)
            output_parts.append('')

    # Post-process: repair tables
    final = '\n'.join(output_parts)
    final = repair_tables(final)
    return final


# ─────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python sarvam_reorder.py <input.md> [output.md]")
        print("")
        print("Example:")
        print("  python sarvam_reorder.py sarvam_output.md reordered.md")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else \
                  input_path.with_name(input_path.stem + '_reordered.md')

    raw_md = input_path.read_text(encoding='utf-8')
    result = process_document(raw_md)
    output_path.write_text(result, encoding='utf-8')

    print(f"✓ Reordered document written to: {output_path}")
    print(f"  Input lines:  {len(raw_md.splitlines())}")
    print(f"  Output lines: {len(result.splitlines())}")


if __name__ == '__main__':
    main()
