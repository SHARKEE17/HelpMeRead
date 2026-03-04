import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class LLMService:
    @staticmethod
    def configure():
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set.")
            return False
        genai.configure(api_key=api_key)
        return True

    @staticmethod
    def explain_text(text):
        """Generate a simplified explanation of the selected text using Gemini."""
        if not LLMService.configure():
            return "Gemini API Key is missing."

        prompt = f"""You are a friendly teacher and you have to explain the selected text in very simple and clear language.
Rules:
- Do not use greetings and unnecessary introductions.
- Always start the first sentence with "{text}", and format the selected text avoid punctuation marks while showing it in simplified version.
- If the text has only one word, use: "{text} means ..."
- If the text has two or more words, use: "{text} is ..." or "{text} means ..."
- Use plain, everyday language — avoid jargon, technical terms, and academic phrasing.
- Write like you are texting a smart friend who has no background in the topic.
- Do NOT use childish analogies (toys, candy, school, cartoons, etc.).
- If you use an example, use a relatable everyday situation (work, shopping, decisions, daily life).
- Do not add new information beyond the text.
- Keep the explanation between 2 to 3 sentences.

Text:
\'\'\'{text}\'\'\'"""

        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            explanation = response.text.strip()
            logger.info("Gemini explanation generated successfully.")
            return explanation
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            return "Failed to generate explanation."
