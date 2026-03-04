import os
import logging
import time
import zipfile
import uuid

from django.conf import settings
from core.services.semantic_parser import markdown_to_semantic

# Try to import SarvamAI
try:
    from sarvamai import SarvamAI
except ImportError:
    SarvamAI = None

logger = logging.getLogger(__name__)


class PDFProcessor:
    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.gemini_api_key = (
            getattr(settings, 'GEMINI_API_KEY', None)
            or os.getenv('GEMINI_API_KEY')
        )

        if self.gemini_api_key:
            logger.info("Gemini API key found — will use Gemini as primary processor.")

        if self.api_key and SarvamAI:
            self.client = SarvamAI(api_subscription_key=self.api_key)
            logger.info("Initialized SarvamAI client (available as fallback).")
        else:
            self.client = None
            if not self.api_key:
                logger.warning("SARVAM_API_KEY not found.")
            elif not SarvamAI:
                logger.warning("sarvamai library not found.")

    def process_pdf(self, file_path, progress_callback=None):
        """
        Process a PDF into the semantic JSON structure expected by the frontend.

        Pipeline priority:
            1. Gemini (page-by-page with coordinate-based reading order)
            2. Sarvam Document Intelligence (fallback)
            3. Mock output (when no API keys are configured)

        Args:
            file_path:         Absolute path to the uploaded PDF.
            progress_callback: Optional callable(status_message, progress_percent).
        """
        # ── Try Gemini first ──────────────────────────────────────────
        if self.gemini_api_key:
            try:
                return self._process_with_gemini(file_path, progress_callback)
            except Exception as e:
                logger.warning(f"Gemini processing failed ({e}), falling back to Sarvam.")

        # ── Try Sarvam ────────────────────────────────────────────────
        if not self.client:
            return self._mock_processing(file_path, progress_callback)

        try:
            if progress_callback:
                progress_callback("Uploading to Sarvam...", 10)
            logger.info(f"Uploading {file_path} to Sarvam Document Intelligence...")

            # 1. Create Job
            job = self.client.document_intelligence.create_job(
                language="en-IN",
                output_format="md",
            )

            # 2. Upload File
            job.upload_file(file_path)

            # 3. Start Processing
            if progress_callback:
                progress_callback("Starting processing...", 20)
            job.start()
            logger.info(f"Sarvam Job ID: {job.job_id} started.")

            # 4. Poll for completion
            status = job.get_status()
            start_time = time.time()

            while status.job_state not in ['Completed', 'Failed', 'PartiallyCompleted']:
                if time.time() - start_time > 600:
                    raise Exception("Sarvam processing timed out after 10 minutes")

                time.sleep(2)
                try:
                    status = job.get_status()
                    logger.info(f"Sarvam Job State: {status.job_state}")
                except Exception as e:
                    logger.error(f"Error polling status: {e}")

                # Calculate progress
                try:
                    metrics = job.get_page_metrics()
                    total = metrics.get('total_pages', 0)
                    processed = metrics.get('pages_processed', 0)

                    if total > 0:
                        percent = 20 + int((processed / total) * 70)
                        msg = f"Processing page {processed} of {total}..."
                        if progress_callback:
                            progress_callback(msg, percent)
                    else:
                        elapsed = time.time() - start_time
                        fake_percent = min(80, 20 + int(elapsed / 2))
                        if progress_callback:
                            progress_callback(f"Processing ({status.job_state})...", fake_percent)
                except Exception:
                    if progress_callback:
                        progress_callback(f"Processing ({status.job_state})...", 30)

            logger.info(f"Sarvam Job finished with state: {status.job_state}")

            if status.job_state != 'Completed':
                raise Exception(f"Sarvam processing failed with state: {status.job_state}")

            # 5. Download Output (ZIP)
            if progress_callback:
                progress_callback("Downloading results...", 90)
            temp_zip_path = file_path + ".out.zip"
            job.download_output(temp_zip_path)

            # 6. Extract Markdown from ZIP
            if progress_callback:
                progress_callback("Parsing results...", 95)
            markdown_content = ""
            with zipfile.ZipFile(temp_zip_path, 'r') as zf:
                md_files = [f for f in zf.namelist() if f.endswith('.md')]
                if md_files:
                    with zf.open(md_files[0]) as f:
                        markdown_content = f.read().decode('utf-8')
                else:
                    raise Exception("No markdown file found in Sarvam output ZIP.")

            # Clean up temp zip
            try:
                os.remove(temp_zip_path)
            except OSError:
                pass

            # 7. Reorder Sarvam output (fix PDF stream order)
            if progress_callback:
                progress_callback("Finalizing...", 99)
            try:
                from core.services.sarvam_reorder import process_document
                logger.info("Running Sarvam output reordering...")
                markdown_content = process_document(markdown_content)
                logger.info("Reordering complete.")
            except Exception as e:
                logger.error(f"Failed to reorder Sarvam content: {e}")

            # 8. Parse Markdown to Semantic JSON
            return markdown_to_semantic(markdown_content, os.path.basename(file_path))

        except Exception as e:
            logger.error(f"Sarvam processing failed: {e}")
            return {
                "id": str(uuid.uuid4()),
                "title": "Processing Failed",
                "sections": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Error",
                        "level": 1,
                        "blocks": [
                            {
                                "id": str(uuid.uuid4()),
                                "type": "paragraph",
                                "content": f"Could not process document: {str(e)}",
                                "attrs": {},
                            }
                        ],
                    }
                ],
            }

    def _process_with_gemini(self, file_path, progress_callback=None):
        """
        Process a PDF using Gemini with page-by-page coordinate-based
        reading order (mirrors MinerU/Docling/Marker approach).

        Reading order comes from PyMuPDF spatial coordinates — no heuristic
        reordering needed. sarvam_reorder is intentionally skipped here.
        """
        from core.services.gemini_processor import process_pdf_with_gemini

        markdown_content = process_pdf_with_gemini(
            file_path,
            self.gemini_api_key,
            progress_callback=progress_callback,
        )

        if progress_callback:
            progress_callback("Finalizing...", 99)

        return markdown_to_semantic(markdown_content, os.path.basename(file_path))

    def _mock_processing(self, file_path, progress_callback=None):
        """Mock output for testing when no API keys are configured."""
        if progress_callback:
            progress_callback("Uploading...", 20)
            time.sleep(1)
            progress_callback("Processing...", 60)
            time.sleep(1)
            progress_callback("Downloading...", 90)

        return {
            "id": "mock-doc-id",
            "title": "Mock Document",
            "sections": [
                {
                    "id": "sec-1",
                    "title": "Introduction",
                    "level": 1,
                    "blocks": [
                        {
                            "id": "block-1",
                            "type": "paragraph",
                            "content": "This is a mock document generated because no API keys were found.",
                            "attrs": {},
                        }
                    ],
                }
            ],
            "meta": {
                "version": "1.0.0",
                "generator": "mock",
            },
        }
