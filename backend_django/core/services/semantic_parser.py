import re
import uuid
import logging
from markdown_it import MarkdownIt
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

def generate_id():
    return str(uuid.uuid4())

class SemanticParser:
    def __init__(self):
        self.md = MarkdownIt()
        # Add plugins if needed, e.g. footnotes
        try:
            from mdit_py_plugins.footnote import footnote_plugin
            self.md.use(footnote_plugin)
        except ImportError:
            pass

    def parse(self, markdown_text, title="Untitled Document"):
        tokens = self.md.parse(markdown_text)
        
        doc_id = generate_id()
        sections = []
        
        # Default introduction section (for content before the first heading)
        current_section = {
            "id": generate_id(),
            "title": "Introduction",
            "level": 1,
            "blocks": [],
            "is_implicit": True # Markup to indicate this was auto-created
        }
        
        # Helper to push current section and start a new one
        def push_section():
            nonlocal current_section
            if current_section["blocks"] or current_section["title"] != "Introduction":
                 sections.append(current_section)

        i = 0
        while i < len(tokens):
            token = tokens[i]
            
            # 1. Section Headings (H1, H2)
            if token.type == 'heading_open':
                level = int(token.tag[1])
                
                # If H1 or H2, treats as a new Section
                if level <= 2:
                    push_section()
                    
                    # Get heading text
                    i += 1
                    heading_text = tokens[i].content if tokens[i].type == 'inline' else ""
                    
                    current_section = {
                        "id": generate_id(),
                        "title": heading_text,
                        "level": level,
                        "blocks": []
                    }
                    
                    # Skip to close
                    while i < len(tokens) and tokens[i].type != 'heading_close':
                        i += 1
                    i += 1 # Skip close
                    continue
                else:
                    # Treat H3+ as a Heading Block within the current section
                    pass # Will be handled by block parser logic below

            # 2. Process Blocks within Section
            block, new_index = self._process_block(tokens, i)
            if block:
                current_section["blocks"].append(block)
                i = new_index
            else:
                i += 1
        
        # Push final section
        push_section()
        
        # Cleanup: Remove empty implicit introduction if it's truly empty
        if sections and sections[0].get("is_implicit") and not sections[0]["blocks"]:
            sections.pop(0)

        # Ensure at least one section exists
        if not sections:
            sections.append({
                "id": generate_id(),
                "title": title,
                "level": 1,
                "blocks": []
            })

        return {
            "id": doc_id,
            "title": title,
            "sections": sections,
            "meta": {
                "version": "1.0.0",
                "generator": "semantic-parser-v1"
            }
        }

    def _process_block(self, tokens, start_index):
        """
        Extracts a single semantic block starting at start_index.
        Returns (BlockDict, next_index).
        """
        i = start_index
        token = tokens[i]
        
        # HEADINGS (H3-H6)
        if token.type == 'heading_open':
            level = int(token.tag[1])
            i += 1
            text = tokens[i].content
            # Skip to close
            while i < len(tokens) and tokens[i].type != 'heading_close':
                i += 1
            return {
                "id": generate_id(),
                "type": "heading",
                "content": text,
                "attrs": {"level": level}
            }, i + 1

        # PARAGRAPHS
        elif token.type == 'paragraph_open':
            i += 1
            inline_token = tokens[i]
            text = inline_token.content
            
            # Metadata/Caption Heuristics (preserved from previous logic)
            block_type = "paragraph"
            if re.match(r'^(Figure|Table|Fig\.)\s*\d+[:.]', text, re.IGNORECASE):
                block_type = "caption"
            elif re.match(r'^(Author|Date|Affiliation|Published):', text, re.IGNORECASE):
                block_type = "metadata"

            # Skip to close
            while i < len(tokens) and tokens[i].type != 'paragraph_close':
                i += 1
            
            if not text.strip(): # Skip empty paragraphs
                return None, i + 1

            return {
                "id": generate_id(),
                "type": block_type,
                "content": text,
                "attrs": {}
            }, i + 1

        # LISTS
        elif token.type in ['bullet_list_open', 'ordered_list_open']:
            list_type = 'bullet' if token.type == 'bullet_list_open' else 'ordered'
            close_type = token.type.replace('_open', '_close')
            
            items = []
            # Simple recursive-ish collector for list items
            # Note: This simplifies nested lists into a flat text structure or assumes simple nesting
            # produced by Sarvam. For full fidelity, we'd recurse. 
            # For now, let's capture the list items as a simple list of strings/blocks.
            
            i += 1
            current_item_text = []
            
            while i < len(tokens) and tokens[i].type != close_type:
                t = tokens[i]
                if t.type == 'inline':
                    # Append text to current item
                    current_item_text.append(t.content)
                elif t.type == 'list_item_close':
                    # Flush item
                    if current_item_text:
                        items.append(" ".join(current_item_text))
                        current_item_text = []
                elif t.type == 'list_item_open':
                    pass # Just a container
                elif t.type.endswith('_open'):
                     # Handle nested blocks if necessary, for now skip to close
                     # This effectively flattens content inside list items
                     pass
                i += 1

            return {
                "id": generate_id(),
                "type": "list",
                "content": items,
                "attrs": {"style": list_type}
            }, i + 1

        # CODE BLOCKS
        elif token.type == 'fence' or token.type == 'code_block':
            return {
                "id": generate_id(),
                "type": "code",
                "content": token.content,
                "attrs": {"language": token.info or "text"}
            }, i + 1

        # BLOCKQUOTES
        elif token.type == 'blockquote_open':
             i += 1
             # Capture text content
             text_content = []
             while i < len(tokens) and tokens[i].type != 'blockquote_close':
                 if tokens[i].type == 'inline':
                     text_content.append(tokens[i].content)
                 i += 1
             
             return {
                "id": generate_id(),
                "type": "quote",
                "content": " ".join(text_content),
                "attrs": {}
            }, i + 1

        # TABLES (HTML)
        elif token.type == 'html_block' and token.content.strip().startswith('<table'):
            soup = BeautifulSoup(token.content, 'html.parser')
            table_data = self._parse_html_table(soup)
            return {
                "id": generate_id(),
                "type": "table",
                "content": table_data,
                "attrs": {}
            }, i + 1

        # TABLES (Markdown pipe tables — table_open ... table_close)
        elif token.type == 'table_open':
            table_data, new_i = self._parse_markdown_table(tokens, i)
            return {
                "id": generate_id(),
                "type": "table",
                "content": table_data,
                "attrs": {}
            }, new_i

        else:
            # Skip unknown tokens
            return None, i + 1

    def _is_complex_table(self, table):
        """Returns True if the table has multi-level headers or spanning cells."""
        thead = table.find('thead')
        if thead:
            if len(thead.find_all('tr')) > 1:
                return True
        for tag in table.find_all(['th', 'td']):
            colspan = str(tag.get('colspan', '1')).strip()
            rowspan = str(tag.get('rowspan', '1')).strip()
            if colspan not in ('1', '') or rowspan not in ('1', ''):
                return True
        return False

    def _parse_html_table(self, soup):
        table = soup.find('table')
        if not table: return None

        # 1. Caption
        caption = ""
        caption_tag = table.find('caption')
        if caption_tag:
             caption = caption_tag.get_text(strip=True)

        # 2. Complex tables: pass raw HTML through — preserves colspan/rowspan/multi-row headers.
        #    Rendering layer (TableRenderer) will use dangerouslySetInnerHTML for these.
        if self._is_complex_table(table):
            return {
                "caption": caption,
                "raw_html": str(table),
                "columns": [],
                "rows": [],
            }

        # 3. Columns (simple tables — single header row, no spans)
        columns = []
        thead = table.find('thead')
        if thead:
            # Use the LAST header row (most specific column labels)
            header_rows = thead.find_all('tr')
            header_row = header_rows[-1] if header_rows else None
            if header_row:
                for th in header_row.find_all(['th', 'td']):
                    columns.append({
                        "id": generate_id(),
                        "label": th.get_text(strip=True),
                        "level": 0
                    })
        
        # If no thead, try first row of tbody if it looks like header (optional heuristic, skipping for now to be strict)

        # 3. Rows
        rows = []
        tbody = table.find('tbody')
        target_body = tbody if tbody else table # Fallback if no tbody
        
        for tr in target_body.find_all('tr'):
            # Skip if it was the header row we already processed (if table has no thead)
            # Simplification: Assume markdown tables usually generate thead. 
            
            cells = tr.find_all(['td', 'th'])
            if not cells: continue

            # Hierarchy Detection: Check first cell for indentation
            first_cell = cells[0]
            raw_text = first_cell.get_text() # Get text with whitespace
            striped_text = raw_text.lstrip()
            
            # Heuristic: 2 spaces = 1 level, or specific known markers?
            # Standard markdown doesn't mandate this, but let's support 2-space indentation.
            # Also check for &nbsp; which BS4 might convert to non-breaking space \xa0
            leading_space_count = 0
            for char in raw_text:
                if char in (' ', '\t', '\xa0'):
                    leading_space_count += 1
                else:
                    break
            
            level = leading_space_count // 2 # Aggressive indentation assumption
            
            label = striped_text
            values = [c.get_text(strip=True) for c in cells[1:]] # Rest of columns
            
            rows.append({
                "id": generate_id(),
                "label": label,
                "level": level,
                "values": values
            })
            
        return {
            "caption": caption,
            "columns": columns,
            "rows": rows
        }

    def _parse_markdown_table(self, tokens, start_index):
        """
        Parse a markdown-it pipe table (table_open … table_close) into TableData.
        Token sequence: table_open thead_open tr_open th_open inline th_close …
                        thead_close tbody_open tr_open td_open inline td_close … tbody_close table_close
        """
        i = start_index + 1  # skip table_open

        columns = []
        rows = []
        in_head = False
        current_row_cells = []
        is_header_row = False

        while i < len(tokens) and tokens[i].type != 'table_close':
            t = tokens[i]

            if t.type == 'thead_open':
                in_head = True
            elif t.type == 'thead_close':
                in_head = False
            elif t.type == 'tr_open':
                current_row_cells = []
                is_header_row = in_head
            elif t.type == 'tr_close':
                if is_header_row:
                    columns = [
                        {"id": generate_id(), "label": cell, "level": 0}
                        for cell in current_row_cells
                    ]
                else:
                    if current_row_cells:
                        rows.append({
                            "id": generate_id(),
                            "label": current_row_cells[0],
                            "level": 0,
                            "values": current_row_cells[1:],
                        })
            elif t.type == 'inline':
                current_row_cells.append(t.content)

            i += 1

        return {
            "caption": "",
            "columns": columns,
            "rows": rows,
        }, i + 1  # skip table_close


def markdown_to_semantic(text, title="Untitled"):
    parser = SemanticParser()
    return parser.parse(text, title)
