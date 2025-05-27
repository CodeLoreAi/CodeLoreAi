import google.generativeai as genai
import os

class GeminiService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel("gemini-1.5-flash-latest")
    
    def generate_response(self, context, query):
        prompt = f"""You are a helpful code assistant. Use the following JavaScript code context to answer the user's question.

=== CODE SNIPPETS ===
{context}

=== USER QUESTION ===
{query}
"""
        response = self.model.generate_content(prompt)
        return response.text